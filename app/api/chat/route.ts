import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

type Note = {
  title: string
  body: string
  updatedAt: number
}

type Todo = {
  text: string
  done: boolean
  dueDate: string | null
}

type ChatBody = {
  messages: UIMessage[]
  notes?: Note[]
  todos?: Todo[]
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function buildContext(notes: Note[], todos: Todo[]) {
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

  const recentNotes = [...notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8)

  const notesText = recentNotes.length
    ? recentNotes
        .map(
          (n) =>
            `- "${n.title || "Untitled"}" (updated ${formatDate(
              n.updatedAt,
            )}): ${n.body.slice(0, 400)}`,
        )
        .join("\n")
    : "No notes yet."

  return `Today's date is ${today}.

The person's PENDING to-dos (${pending.length} pending, ${done.length} completed):
${pendingText}

The person's RECENT notes (most recent first):
${notesText}`
}

export async function POST(req: Request) {
  const { messages, notes = [], todos = [] }: ChatBody = await req.json()

  const context = buildContext(notes, todos)

  const instructions = `You are "Quiet", a warm, calm, and thoughtful personal companion who helps someone reflect on their notes and stay on top of their to-do list.

You have live access to the person's current notes and to-dos, provided below. Use this information naturally when answering. When they ask what's pending, summarize their open tasks clearly and gently, calling out anything overdue. When they want to talk about a note, refer to its actual content. If they're feeling overwhelmed, help them prioritize a small next step.

Guidelines:
- Be concise and conversational, like a supportive friend — not a robotic assistant.
- Since your replies may be read aloud, write in clean, natural prose. Avoid markdown tables, code blocks, and long bulleted lists; prefer short sentences.
- Never invent tasks or notes that aren't in the data. If something isn't there, say so kindly.
- When nothing is pending, reassure them and maybe suggest a moment of rest.

Here is the person's current data:

${context}`

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "Missing GEMINI_API_KEY. Add your Gemini API key to start chatting.",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    instructions,
    messages: await convertToModelMessages(messages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
