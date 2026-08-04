"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Check, Plus, Trash2, CalendarClock } from "lucide-react"
import type { Todo } from "@/lib/types"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDue(due: string) {
  const d = new Date(due + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TodosPanel({
  todos,
  setTodos,
}: {
  todos: Todo[]
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>
}) {
  const [text, setText] = useState("")
  const [due, setDue] = useState("")

  const { pending, done } = useMemo(() => {
    const pending = todos
      .filter((t) => !t.done)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return a.createdAt - b.createdAt
      })
    const done = todos.filter((t) => t.done).sort((a, b) => b.createdAt - a.createdAt)
    return { pending, done }
  }, [todos])

  function addTodo(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: trimmed,
        done: false,
        dueDate: due || null,
        createdAt: Date.now(),
      },
    ])
    setText("")
    setDue("")
  }

  function toggle(id: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const today = todayISO()

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">To-dos</h2>
        <span className="text-sm text-muted-foreground">
          {pending.length} pending
        </span>
      </div>

      <form onSubmit={addTodo} className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a task..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="New task"
          />
          <label className="flex items-center gap-1 text-muted-foreground">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Due date</span>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="bg-transparent text-xs text-muted-foreground outline-none"
              aria-label="Due date"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={!text.trim()}
            aria-label="Add task"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        {pending.length === 0 && done.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Add your first task above.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {pending.map((t) => {
              const overdue = t.dueDate && t.dueDate < today
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <button
                    onClick={() => toggle(t.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 transition-colors hover:border-primary"
                    aria-label={`Mark "${t.text}" as done`}
                  />
                  <span className="flex-1 text-sm leading-snug">{t.text}</span>
                  {t.dueDate && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        overdue
                          ? "bg-destructive/15 text-destructive"
                          : "bg-accent/25 text-accent-foreground"
                      }`}
                    >
                      {overdue ? "Overdue · " : ""}
                      {formatDue(t.dueDate)}
                    </span>
                  )}
                  <button
                    onClick={() => remove(t.id)}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label={`Delete "${t.text}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              )
            })}

            {done.length > 0 && (
              <li className="mt-3 mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Completed
              </li>
            )}

            {done.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 opacity-70"
              >
                <button
                  onClick={() => toggle(t.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  aria-label={`Mark "${t.text}" as not done`}
                >
                  <Check className="h-3 w-3" />
                </button>
                <span className="flex-1 text-sm leading-snug line-through">{t.text}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={`Delete "${t.text}"`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
