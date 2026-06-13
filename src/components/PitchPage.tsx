import { MascotScene } from './MascotScene';

interface PitchPageProps {
  isServerConnected: boolean | null;
  onOpenApp: () => void;
}

export function PitchPage({ isServerConnected, onOpenApp }: PitchPageProps) {
  return (
    <main className="pitch-layout">
      <section className="pitch-cover">
        <div>
          <p className="eyebrow">Milpitas Hacks 2</p>
          <h1>Earthlingo</h1>
          <p>Interactive early learning built around sound, visuals, and playful rewards.</p>
          <button className="primary-action" type="button" onClick={onOpenApp}>
            Open App
          </button>
        </div>
        <MascotScene progress={68} mood="happy" />
      </section>

      <section className="pitch-grid">
        <article>
          <span>Problem</span>
          <h2>Many early learners need practice before reading feels natural.</h2>
          <p>Text-heavy apps ask young kids to read instructions before they are ready. Earthlingo starts with sounds, pictures, and touch.</p>
        </article>
        <article>
          <span>Question</span>
          <h2>What if kids could teach an alien to speak Earth?</h2>
          <p>The story gives every sound and letter a reason. Children help Zibi repair a ship by completing missions.</p>
        </article>
        <article>
          <span>Solution</span>
          <h2>A course map with phonics, letters, and tiny grammar.</h2>
          <p>Speech missions use the microphone and Whisper. Letter and grammar missions are frontend games for fast judging.</p>
        </article>
        <article>
          <span>Research</span>
          <h2>Sound-first learning supports pre-readers.</h2>
          <p>Final slides should add cited literacy research and a personal anecdote. The app already shows the learning loop.</p>
        </article>
      </section>

      <section className="tech-section">
        <div>
          <h2>Tech stack</h2>
          <p>React, TypeScript, Vite, Web Audio API, AudioWorklet, local whisper.cpp, and browser-first lesson state.</p>
        </div>
        <div className="tech-list">
          <span>Mic capture</span>
          <span>Live sound shape</span>
          <span>Whisper scoring</span>
          <span>Course progress</span>
          <span>Responsive UI</span>
          <span>{isServerConnected ? 'Whisper online' : 'Whisper offline'}</span>
        </div>
      </section>

      <section className="design-section">
        <h2>Design system</h2>
        <p>Bright planets, original cartoon characters, chunky controls, minimal reading, and reward feedback made for young kids.</p>
        <div className="design-tokens" aria-label="design tokens">
          <span className="token-yellow" />
          <span className="token-blue" />
          <span className="token-pink" />
          <span className="token-green" />
        </div>
      </section>
    </main>
  );
}
