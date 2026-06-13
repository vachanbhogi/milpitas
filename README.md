# Earthlingo

Earthlingo is a Vite + React + TypeScript hackathon app for **Milpitas Hacks 2 Track 1: Interactive Learning**.

The story is simple: Zibi, a young alien, crash-lands on Earth and needs help learning Earth sounds, letters, and tiny sentences. Kids complete bright course missions, earn star seeds, and repair Zibi's ship.

## What The App Includes

- **Course map:** app-first experience with phonics, letters, grammar, rewards, and pitch sections.
- **Phonics missions:** microphone recording, live sound-shape feedback, and local `whisper.cpp` transcript scoring for word checks.
- **Letter missions:** frontend games for matching sounds to letters.
- **Grammar missions:** frontend games for nouns, actions, and simple sentence building.
- **Rewards:** star seeds, ship repair progress, and course completion feedback.
- **Pitch page:** judge-facing summary based on the hackathon pitch deck.

## What Runs Where

- **Frontend:** React app, lesson state, course map, rewards, letter and grammar games.
- **Browser audio:** Web Audio API and AudioWorklet for microphone capture and live feedback.
- **Local backend:** `whisper.cpp` server at `http://127.0.0.1:8080/inference` for speech transcription.

The app no longer uses presenter-only correctness controls. Speech missions use real microphone input. Sound-only missions can still use the live audio analyzer when Whisper is offline, but word missions need the local Whisper server.

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

Then open the app and visit **Sound Safari**. The pitch page shows whether the Whisper lab is online or offline.

## Judging Flow

1. Open the app and start on the course map.
2. Complete one **Sound Safari** mission with the microphone.
3. Complete one **Letter Lagoon** mission.
4. Complete one **Tiny Talk Town** mission.
5. Open **Rewards** to show ship progress.
6. Open **Pitch** to explain the problem, solution, tech stack, and design system.

## Hackathon Rubric Fit

- **Innovation:** kids teach an alien Earth language through sound and visuals.
- **Technical execution:** React, TypeScript, Web Audio, AudioWorklet, and Whisper integration.
- **Functionality:** judges can freely explore a course map, lessons, rewards, and pitch page.
- **Design:** bright original cartoon UI with large controls for young learners.
- **Impact:** early literacy practice without requiring reading-heavy instructions.
- **Theme relevance:** focused on interactive childhood learning through sound, visuals, and rewards.
