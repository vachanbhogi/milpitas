# Local Real-Time Phonics Prototype

This is a Vite + React + TypeScript MVP for testing a kid-facing phonics loop:

1. Show one sound or simple word.
2. Listen through the browser microphone.
3. Give immediate live feedback from lightweight audio analysis.
4. Send the completed utterance to a local `whisper.cpp` server for transcript scoring.

The app is intentionally not browser-only AI yet. The MVP keeps Whisper as a local sidecar so the first prototype can focus on the teaching loop instead of model loading, WebGPU support, and browser memory limits.

## Demo Mode

Demo mode is currently enabled in the app so the prototype can be shown without `whisper.cpp`.

- Use **Demo wrong** to show an incorrect pronunciation.
- Use **Demo right** to show a correct pronunciation.
- The microphone button can still be used for the live listening feel, but final scoring is faked for the demo.

## What Runs Where

- **Frontend:** React app, microphone capture, live sound-shape feedback, lesson flow.
- **Local backend:** `whisper.cpp` server at `http://127.0.0.1:8080/inference`.
- **Future packaging:** Tauri or Electron can bundle the frontend with `whisper.cpp` as a desktop sidecar after the loop is validated.

## Current Lessons

- Sounds: `s`, `m`, `a`, `t`, `p`
- Words: `sat`, `mat`, `pat`

The live analyzer is not a clinical phoneme recognizer. It only labels simple sound shapes such as quiet, voice, hissy, open, and pop. Whisper scoring happens after the child stops speaking.

## Development

Install dependencies:

```bash
bun install
```

Start the web app:

```bash
bun run dev
```

Build:

```bash
bun run build
```

Lint:

```bash
bun run lint
```

## Local Whisper Backend

The `package.json` scripts expect a `whisper.cpp` checkout in this project directory. If it is not present, add it before using the helper scripts.

Set up the model:

```bash
bun run whisper:setup
```

Run the local server:

```bash
bun run whisper:server
```

The frontend still shows live microphone feedback when the backend is offline. In demo mode, final correctness can be faked with the presenter controls. Turn demo mode off in `src/App.tsx` when you are ready to require the local Whisper server.
