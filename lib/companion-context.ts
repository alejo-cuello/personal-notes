import type { Note, Todo } from "@/lib/types"

// Lightweight shapes accepted by the context builder (works with full or
// trimmed records from either the client or the API route).
type NoteLike = Pick<Note, "title" | "body" | "updatedAt">
type TodoLike = Pick<Todo, "text" | "done" | "dueDate">

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function buildContext(notes: NoteLike[], todos: TodoLike[]) {
  const today = new Date().toISOString().slice(0, 10)

  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  const pendingText = pending.length
    ? pending
        .map((t) => {
          let line = `- ${t.text}`
          if (t.dueDate) {
            const overdue = t.dueDate < today
            line += ` (due ${t.dueDate}${overdue ? " — OVERDUE" : ""})`
          }
          return line
        })
        .join("\n")
    : "None right now."

  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8)

  const notesText = recentNotes.length
    ? recentNotes
        .map((n) => `- "${n.title || "Untitled"}" (updated ${formatDate(n.updatedAt)}): ${n.body.slice(0, 400)}`)
        .join("\n")
    : "No notes yet."

  return `Today's date is ${today}.

The person's PENDING to-dos (${pending.length} pending, ${done.length} completed):
${pendingText}

The person's RECENT notes (most recent first):
${notesText}`
}

const BASE_PERSONA = `You are "Quiet", a warm, calm, and thoughtful personal companion who helps someone reflect on their notes and stay on top of their to-do list.

You have live access to the person's current notes and to-dos, provided below. Use this information naturally when answering. When they ask what's pending, summarize their open tasks clearly and gently, calling out anything overdue. When they want to talk about a note, refer to its actual content. If they're feeling overwhelmed, help them prioritize a small next step.`

// Instruction for the text chat (may be rendered on screen).
export function buildChatInstructions(notes: NoteLike[], todos: TodoLike[]) {
  return `${BASE_PERSONA}

Guidelines:
- Be concise and conversational, like a supportive friend — not a robotic assistant.
- Since your replies may be read aloud, write in clean, natural prose. Avoid markdown tables, code blocks, and long bulleted lists; prefer short sentences.
- Never invent tasks or notes that aren't in the data. If something isn't there, say so kindly.
- When nothing is pending, reassure them and maybe suggest a moment of rest.

Here is the person's current data:

${buildContext(notes, todos)}`
}

// Instruction for the real-time voice conversation (spoken aloud).
export function buildVoiceInstructions(notes: NoteLike[], todos: TodoLike[]) {
  return `${BASE_PERSONA}

You are speaking out loud in a real-time voice conversation, so:
- Keep replies short and natural, the way a person actually talks. One or two sentences is usually enough.
- Never read out markdown, symbols, or lists — speak in flowing sentences.
- It's fine to pause and ask a brief follow-up question to keep the conversation going.
- Never invent tasks or notes that aren't in the data below. If something isn't there, say so kindly.
- Greet the person briefly when the conversation starts and offer to go over what's pending.

Here is the person's current data:

${buildContext(notes, todos)}`
}
