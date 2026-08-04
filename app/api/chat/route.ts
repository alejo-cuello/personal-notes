import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { buildChatInstructions } from "@/lib/companion-context"
import type { Note, Todo } from "@/lib/types"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

type ChatBody = {
  messages: UIMessage[]
  notes?: Note[]
  todos?: Todo[]
}

export async function POST(req: Request) {
  const { messages, notes = [], todos = [] }: ChatBody = await req.json()

  const instructions = buildChatInstructions(notes, todos)

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
