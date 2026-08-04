"use client"

import type React from "react"
import { useState } from "react"
import { NotebookPen, ListTodo, MessageCircleHeart } from "lucide-react"
import { useLocalStorage } from "@/lib/use-local-storage"
import type { Note, Todo } from "@/lib/types"
import { NotesPanel } from "@/components/notes-panel"
import { TodosPanel } from "@/components/todos-panel"
import { AiCompanion } from "@/components/ai-companion"

type MobileTab = "notes" | "todos" | "companion"

export default function Page() {
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>("quiet.notes", [])
  const { value: todos, setValue: setTodos } = useLocalStorage<Todo[]>("quiet.todos", [])
  const [tab, setTab] = useState<MobileTab>("companion")

  const pendingCount = todos.filter((t) => !t.done).length

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-6 md:py-10">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight md:text-3xl">
            Quiet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount > 0
              ? `You have ${pendingCount} task${pendingCount === 1 ? "" : "s"} waiting.`
              : "All caught up. Take a breath."}
          </p>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1 md:hidden">
        <TabButton active={tab === "notes"} onClick={() => setTab("notes")} icon={<NotebookPen className="h-4 w-4" />} label="Notes" />
        <TabButton active={tab === "todos"} onClick={() => setTab("todos")} icon={<ListTodo className="h-4 w-4" />} label="To-dos" />
        <TabButton active={tab === "companion"} onClick={() => setTab("companion")} icon={<MessageCircleHeart className="h-4 w-4" />} label="Talk" />
      </div>

      {/* Desktop: three columns. Mobile: single active tab. */}
      <div className="grid flex-1 gap-4 md:grid-cols-[1fr_1fr_1.1fr]">
        <section
          className={`${tab === "notes" ? "block" : "hidden"} h-[68vh] rounded-2xl border border-border bg-card/50 p-4 md:block md:h-[72vh]`}
        >
          <NotesPanel notes={notes} setNotes={setNotes} />
        </section>

        <section
          className={`${tab === "todos" ? "block" : "hidden"} h-[68vh] rounded-2xl border border-border bg-card/50 p-4 md:block md:h-[72vh]`}
        >
          <TodosPanel todos={todos} setTodos={setTodos} />
        </section>

        <section
          className={`${tab === "companion" ? "block" : "hidden"} h-[68vh] rounded-2xl border border-border bg-card p-4 shadow-sm md:block md:h-[72vh]`}
        >
          <AiCompanion notes={notes} todos={todos} />
        </section>
      </div>
    </main>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
