import { GoogleGenAI } from "@google/genai"

// Native-audio Gemini Live model (GA). Override via env if needed.
export const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-live-2.5-flash-native-audio"

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY. Add your Gemini API key to enable voice." },
      { status: 500 },
    )
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    // Short-lived token: 1 session start within 2 minutes, messages allowed for 30 minutes.
    const now = Date.now()
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
      },
    })

    if (!token.name) {
      throw new Error("Token provisioning returned no token name")
    }

    return Response.json({ token: token.name, model: LIVE_MODEL })
  } catch (err) {
    console.log("[v0] live-token error:", err instanceof Error ? err.message : err)
    return Response.json(
      { error: "Could not create a voice session token. Check your Gemini API key." },
      { status: 500 },
    )
  }
}
