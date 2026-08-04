"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai"
import { OUTPUT_SAMPLE_RATE, base64Pcm16ToFloat32, floatTo16BitPcmBase64 } from "@/lib/audio-utils"

export type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "error"

interface StartOptions {
  systemInstruction: string
}

export function useLiveConversation() {
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [userTranscript, setUserTranscript] = useState("")
  const [modelTranscript, setModelTranscript] = useState("")

  const sessionRef = useRef<Session | null>(null)
  const inputCtxRef = useRef<AudioContext | null>(null)
  const outputCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  // Playback scheduling
  const nextStartRef = useRef(0)
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())

  // Turn transcript accumulators
  const userTurnRef = useRef("")
  const modelTurnRef = useRef("")

  const isSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.AudioContext !== "undefined"

  const cleanup = useCallback(() => {
    try {
      workletRef.current?.disconnect()
      sourceRef.current?.disconnect()
    } catch {
      // ignore
    }
    workletRef.current = null
    sourceRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    scheduledSourcesRef.current.forEach((s) => {
      try {
        s.stop()
      } catch {
        // ignore
      }
    })
    scheduledSourcesRef.current.clear()
    nextStartRef.current = 0

    inputCtxRef.current?.close().catch(() => {})
    outputCtxRef.current?.close().catch(() => {})
    inputCtxRef.current = null
    outputCtxRef.current = null

    try {
      sessionRef.current?.close()
    } catch {
      // ignore
    }
    sessionRef.current = null
  }, [])

  const stopPlayback = useCallback(() => {
    scheduledSourcesRef.current.forEach((s) => {
      try {
        s.stop()
      } catch {
        // ignore
      }
    })
    scheduledSourcesRef.current.clear()
    nextStartRef.current = 0
  }, [])

  const playChunk = useCallback((base64: string) => {
    const ctx = outputCtxRef.current
    if (!ctx) return

    const float = base64Pcm16ToFloat32(base64)
    if (float.length === 0) return

    const buffer = ctx.createBuffer(1, float.length, OUTPUT_SAMPLE_RATE)
    buffer.getChannelData(0).set(float)

    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)

    const now = ctx.currentTime
    const startAt = Math.max(now, nextStartRef.current)
    src.start(startAt)
    nextStartRef.current = startAt + buffer.duration

    scheduledSourcesRef.current.add(src)
    setStatus("speaking")
    src.onended = () => {
      scheduledSourcesRef.current.delete(src)
      if (scheduledSourcesRef.current.size === 0 && sessionRef.current) {
        setStatus("listening")
      }
    }
  }, [])

  const handleMessage = useCallback(
    (message: LiveServerMessage) => {
      const sc = message.serverContent
      if (!sc) return

      if (sc.interrupted) {
        stopPlayback()
      }

      const parts = sc.modelTurn?.parts ?? []
      for (const part of parts) {
        const inline = part.inlineData
        if (inline?.data && inline.mimeType?.startsWith("audio/")) {
          playChunk(inline.data)
        }
      }

      if (sc.inputTranscription?.text) {
        userTurnRef.current += sc.inputTranscription.text
        setUserTranscript(userTurnRef.current)
      }
      if (sc.outputTranscription?.text) {
        modelTurnRef.current += sc.outputTranscription.text
        setModelTranscript(modelTurnRef.current)
      }

      if (sc.turnComplete) {
        // Reset accumulators for the next turn.
        userTurnRef.current = ""
        modelTurnRef.current = ""
      }
    },
    [playChunk, stopPlayback],
  )

  const start = useCallback(
    async ({ systemInstruction }: StartOptions) => {
      if (!isSupported) {
        setError("Your browser does not support microphone audio capture.")
        setStatus("error")
        return
      }
      setError(null)
      setStatus("connecting")
      setUserTranscript("")
      setModelTranscript("")
      userTurnRef.current = ""
      modelTurnRef.current = ""

      try {
        // 1. Get an ephemeral token from our server.
        const res = await fetch("/api/live-token", { method: "POST" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Could not start voice session.")
        const { token, model } = data as { token: string; model: string }

        // 2. Request microphone access.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        })
        streamRef.current = stream

        // 3. Set up audio contexts.
        const inputCtx = new AudioContext()
        inputCtxRef.current = inputCtx
        const outputCtx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })
        outputCtxRef.current = outputCtx
        await outputCtx.resume()

        await inputCtx.audioWorklet.addModule("/audio-capture-worklet.js")

        // 4. Connect to the Gemini Live API with the ephemeral token.
        const ai = new GoogleGenAI({ apiKey: token })
        const session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setStatus("listening")
            },
            onmessage: handleMessage,
            onerror: () => {
              setError("The voice connection ran into an error.")
              setStatus("error")
              cleanup()
            },
            onclose: () => {
              if (sessionRef.current) {
                // Unexpected close while active.
                setStatus("idle")
                cleanup()
              }
            },
          },
        })
        sessionRef.current = session

        // 5. Pipe mic audio into the session.
        const source = inputCtx.createMediaStreamSource(stream)
        const worklet = new AudioWorkletNode(inputCtx, "capture-processor")
        sourceRef.current = source
        workletRef.current = worklet

        worklet.port.onmessage = (event) => {
          const frame = event.data as Float32Array
          if (!sessionRef.current) return
          const base64 = floatTo16BitPcmBase64(frame, inputCtx.sampleRate)
          try {
            sessionRef.current.sendRealtimeInput({
              audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
            })
          } catch {
            // session likely closing
          }
        }

        source.connect(worklet)
        // Keep the worklet processing without routing mic to speakers.
        worklet.connect(inputCtx.destination)
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone access was denied. Enable it to talk."
            : err instanceof Error
              ? err.message
              : "Could not start the voice conversation."
        setError(message)
        setStatus("error")
        cleanup()
      }
    },
    [cleanup, handleMessage, isSupported],
  )

  const stop = useCallback(() => {
    cleanup()
    setStatus("idle")
  }, [cleanup])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return { status, error, userTranscript, modelTranscript, isSupported, start, stop }
}
