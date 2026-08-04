# Personal Notes & AI Companion

A personal notes and to-do list app with **Quiet**, an AI companion powered by Google Gemini that can talk to you about your pending tasks and recent notes — in text or in a real-time voice conversation.

- **Notes & to-dos** are stored in your browser's local storage (no database, no login).
- **Text chat** streams responses from Gemini and can read them aloud.
- **Voice mode** is a real-time, interruptible voice conversation using the Gemini Live API (native audio streaming).

## Requirements

- [Node.js](https://nodejs.org) 18.18 or newer
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)
  (use an AI Studio key, **not** a Vertex/Google Cloud key — the Live API and ephemeral tokens use the Gemini Developer API)

## Run it locally

### 1. Get the code

Clone the repository:

```bash
git clone https://github.com/alejo-cuello/personal-notes.git
cd personal-notes
git checkout ai-personal-assistant
```

Or download the project as a ZIP from v0 and unzip it.

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Gemini key

Both the text chat and the live voice need it. Create a file called `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_key_from_google_ai_studio
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production build

To run an optimized production build locally:

```bash
npm run build
npm start
```

## Notes on voice mode

- Voice mode needs microphone access and a **secure context**. `localhost` counts as secure, so the mic works during local development.
- If you host the app on a plain-HTTP address (anything other than `localhost`), browsers will block microphone access — you'll need **HTTPS**.
- Voice mode works best in Chromium-based browsers (Chrome, Edge).

## How your data is stored

Your notes and to-dos are saved in the browser's **local storage** on your device. Nothing is sent to a server except the text/audio you exchange with the Gemini API while chatting. Clearing your browser data will erase your notes.

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [AI SDK](https://ai-sdk.dev) with the Google provider for text chat
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) for the Gemini Live voice conversation
- Tailwind CSS for styling
