"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Volume2, Square, Sparkles, StopCircle, Mic } from "lucide-react"
import type { Note, Todo } from "@/lib/types"
import { VoiceConversation } from "@/components/voice-conversation"

const SUGGESTIONS = [
  "What's pending today?",
  "Help me pick what to do next",
  "Summarize my recent notes",
]

function textFromParts(parts: { type: string; text?: string }[]) {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
}

export function AiCompanion({
  notes,
  todos,
}: {
  notes: Note[]
  todos: Todo[]
}) {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [input, setInput] = useState("")
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [voiceMode, setVoiceMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  // Stop any speech when the component unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel()
    }
  }, [])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    sendMessage(
      { text: trimmed },
      {
        body: {
          notes: notes.map((n) => ({ title: n.title, body: n.body, updatedAt: n.updatedAt })),
          todos: todos.map((t) => ({ text: t.text, done: t.done, dueDate: t.dueDate })),
        },
      },
    )
    setInput("")
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      send(input)
    }
  }

  function speak(id: string, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    if (speakingId === id) {
      setSpeakingId(null)
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1
    utter.pitch = 1
    utter.onend = () => setSpeakingId(null)
    utter.onerror = () => setSpeakingId(null)
    setSpeakingId(id)
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Quiet</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Your notes &amp; tasks companion</p>
        </div>
        {!voiceMode && (
          <button
            onClick={() => setVoiceMode(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
            aria-label="Start a live voice conversation"
          >
            <Mic className="h-3.5 w-3.5 text-primary" /> Talk
          </button>
        )}
      </div>

      {voiceMode ? (
        <div className="flex-1">
          <VoiceConversation notes={notes} todos={todos} onClose={() => setVoiceMode(false)} />
        </div>
      ) : (
        <>

      <div ref={scrollRef} className="-mr-1 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-pretty text-sm text-muted-foreground">
              Ask me about your pending tasks or the notes on your mind. I&apos;ll keep it calm and
              to the point.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const text = textFromParts(m.parts as { type: string; text?: string }[])
            const isUser = m.role === "user"
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-pretty">{text}</p>
                  {!isUser && text && (
                    <button
                      onClick={() => speak(m.id, text)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={speakingId === m.id ? "Stop reading aloud" : "Read aloud"}
                    >
                      {speakingId === m.id ? (
                        <>
                          <Square className="h-3 w-3" /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" /> Read aloud
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Talk to me about your day..."
            className="max-h-28 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Message"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Stop"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
        </>
      )}
    </div>
  )
}
