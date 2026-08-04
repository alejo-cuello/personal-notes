"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import type { Note } from "@/lib/types"

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NotesPanel({
  notes,
  setNotes,
}: {
  notes: Note[]
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  )

  const active = activeId ? notes.find((n) => n.id === activeId) ?? null : null

  function createNote() {
    const now = Date.now()
    const note: Note = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
  }

  function updateNote(id: string, patch: Partial<Note>) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    )
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeId === id) setActiveId(null)
  }

  if (active) {
    return (
      <div className="flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setActiveId(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All notes
          </button>
          <button
            onClick={() => remove(active.id)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Delete note"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>

        <input
          value={active.title}
          onChange={(e) => updateNote(active.id, { title: e.target.value })}
          placeholder="Title"
          className="mb-2 w-full bg-transparent font-display text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
          aria-label="Note title"
        />
        <textarea
          value={active.body}
          onChange={(e) => updateNote(active.id, { body: e.target.value })}
          placeholder="Start writing..."
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
          aria-label="Note body"
        />
        <p className="mt-2 text-xs text-muted-foreground">Edited {timeAgo(active.updatedAt)}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">Notes</h2>
        <button
          onClick={createNote}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        {sorted.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No notes yet. Capture a thought with &quot;New&quot;.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sorted.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => setActiveId(n.id)}
                  className="group flex w-full flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {n.title || "Untitled"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(n.updatedAt)}
                    </span>
                  </div>
                  <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {n.body || "No content"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
