"use client"

import { useEffect } from "react"
import { Mic, PhoneOff, Loader2, AlertCircle } from "lucide-react"
import { useLiveConversation, type VoiceStatus } from "@/lib/use-live-conversation"
import { buildVoiceInstructions } from "@/lib/companion-context"
import type { Note, Todo } from "@/lib/types"

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "Tap to start a voice conversation",
  connecting: "Connecting...",
  listening: "Listening — just talk",
  speaking: "Quiet is speaking",
  error: "Something went wrong",
}

export function VoiceConversation({
  notes,
  todos,
  onClose,
}: {
  notes: Note[]
  todos: Todo[]
  onClose: () => void
}) {
  const { status, error, userTranscript, modelTranscript, isSupported, start, stop } =
    useLiveConversation()

  const active = status !== "idle" && status !== "error"

  // Stop the session when the panel unmounts.
  useEffect(() => {
    return () => stop()
  }, [stop])

  function handleStart() {
    start({ systemInstruction: buildVoiceInstructions(notes, todos) })
  }

  function handleEnd() {
    stop()
    onClose()
  }

  return (
    <div className="flex h-full flex-col items-center justify-between py-2">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Live voice</p>
        <p className="mt-1 text-sm font-medium text-foreground">{STATUS_LABEL[status]}</p>
      </div>

      {/* Orb */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {active && (
            <>
              <span
                className={`absolute inset-0 rounded-full bg-primary/20 ${
                  status === "speaking" ? "animate-ping" : "animate-pulse"
                }`}
              />
              <span className="absolute inset-4 rounded-full bg-primary/15" />
            </>
          )}
          <div
            className={`relative flex h-28 w-28 items-center justify-center rounded-full transition-colors ${
              status === "error"
                ? "bg-destructive/15 text-destructive"
                : active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {status === "connecting" ? (
              <Loader2 className="h-9 w-9 animate-spin" />
            ) : status === "error" ? (
              <AlertCircle className="h-9 w-9" />
            ) : (
              <Mic className="h-9 w-9" />
            )}
          </div>
        </div>

        {/* Live transcript */}
        <div className="min-h-[3.5rem] w-full max-w-sm px-2 text-center">
          {modelTranscript ? (
            <p className="text-pretty text-sm leading-relaxed text-foreground">{modelTranscript}</p>
          ) : userTranscript ? (
            <p className="text-pretty text-sm italic leading-relaxed text-muted-foreground">
              {userTranscript}
            </p>
          ) : (
            active && (
              <p className="text-sm text-muted-foreground">
                Ask about your pending tasks or your latest notes.
              </p>
            )
          )}
        </div>

        {error && (
          <p className="max-w-sm text-pretty text-center text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {!isSupported ? (
          <p className="max-w-xs text-pretty text-center text-sm text-muted-foreground">
            Voice conversation needs a browser with microphone support. Try Chrome or Edge on
            desktop.
          </p>
        ) : active ? (
          <button
            onClick={handleEnd}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
          >
            <PhoneOff className="h-4 w-4" /> End conversation
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Mic className="h-4 w-4" /> {status === "error" ? "Try again" : "Start talking"}
          </button>
        )}
        <button
          onClick={handleEnd}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to chat
        </button>
      </div>
    </div>
  )
}
