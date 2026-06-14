# Earthlingo

**Milpitas Hacks 2 — Track 1: Interactive Learning**

Earthlingo completely reimagines early childhood learning by prioritizing **interactive experiences designed around sound and visuals** instead of reading-heavy instructions. The story is engaging: Zibi, a young alien, crash-lands on Earth and needs help learning Earth sounds, letters, and words. Kids complete bright, highly interactive missions to earn star seeds and repair Zibi's ship.

## What The App Includes

- **Course Map:** An intuitive, visually driven app-first experience with phonics, letters, grammar, and reward sections.
- **Sound Safari (Phonics):** Kids use their voice! Features live microphone recording, an AudioWorklet-based live sound-shape feedback loop, browser speech recognition, and an optimized local `whisper.cpp` server for offline transcription and scoring of spoken words.
- **Letter & Grammar Games:** Frontend interactive mechanics for matching sounds to letters and building simple sentences.
- **Rewards:** Creative game mechanics with playful rewards like star seeds and spaceship repair progress to make learning memorable.

## What Runs Where

- **Frontend:** React + TypeScript app, powered by Vite. Handles the course map, lessons, grammar games, and reward state.
- **Browser Audio:** Utilizes the Web Audio API and custom AudioWorklets for real-time microphone capture and live DSP visual feedback.
- **Local Backend:** A highly efficient `whisper.cpp` server running locally (`http://127.0.0.1:8080/inference`) for ultra-fast, offline speech transcription.

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

The `package.json` scripts expect a `whisper.cpp` checkout in this project directory for offline voice recognition.

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
3. Complete one **Letter Lagoon** and **Tiny Talk Town** mission.
4. Open **Rewards** to observe the game mechanics and ship progress.
5. Open **Pitch** to review the problem, solution, tech stack, and design system.

## Inspiration
Our inspiration comes from the desire to reimagine early childhood learning. We noticed that many educational apps require reading instructions, which creates a barrier for young learners. We wanted to build an interactive experience based entirely around sound and visuals. The story of Zibi, a young alien who needs help learning Earth languages, provided the perfect engaging framework to make learning feel like a playful mission rather than a chore.

## What it does
Earthlingo (codenamed Mumble) is a web application where kids complete bright, highly interactive missions to earn star seeds and repair an alien's ship. It includes:
- **Sound Safari:** Kids speak into the microphone to teach words, utilizing live sound-shape feedback and offline AI transcription to verify pronunciation.
- **Letter & Grammar Games:** Intuitive matching and sentence-building games designed for early learners.

## How we built it
We built the frontend using **React, TypeScript, and Vite**. For the interactive components, we leveraged:
- **Web Audio API & AudioWorklets** for real-time microphone capture and live DSP visual feedback.
- A local **`whisper.cpp`** server for ultra-fast, completely offline speech transcription to ensure kid's audio data never leaves their machine.
We also maintained exemplary code quality by adhering to strict ESLint rules and ensuring no `any` types were used.

## Challenges we ran into
One of the main challenges was providing a responsive, private voice recognition experience for young kids. Cloud-based APIs raised privacy concerns and latency, so we integrated a local `whisper.cpp` model. Another hurdle was managing complex audio state in the browser using AudioWorklets without blocking the main UI thread.

## Accomplishments that we're proud of
We're incredibly proud of building a fully functional, offline-first app that utilizes voice AI in a seamless React interface. Creating an educational tool that requires zero reading to operate—while successfully implementing a complex and highly efficient tech stack—is a major achievement for our team. We're also proud of our strict adherence to high-quality, type-safe code.

## What we learned
We learned a massive amount about browser audio capabilities, specifically the Web Audio API and AudioWorklets. We also learned how to successfully bridge local AI inference (Whisper) with a modern web framework, all while keeping the user experience extremely smooth and kid-friendly.

## What's next for Mumble
For Mumble (Earthlingo), we plan to expand the course map with more complex grammar missions and additional languages. We want to refine the voice recognition to support entire sentences dynamically and perhaps integrate a local text-to-speech engine so Zibi can speak back to the kids!
