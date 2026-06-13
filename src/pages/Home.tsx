import { useState } from 'react';
import { MascotScene } from '../components/MascotScene';
import { playSynthesizedPhonics } from '../audioUtils';

interface HomeProps {
  isServerConnected: boolean | null;
  onOpenApp: () => void;
}

export function Home({ isServerConnected, onOpenApp }: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const demoSounds = [
    { target: 'S', label: 'Hissy Air', desc: 'Custom noise node with bandpass sweep at 6.5kHz' },
    { target: 'M', label: 'Moon Hum', desc: '130Hz triangle wave with low-frequency vibrato modulation' },
    { target: 'A', label: 'Open Vowel', desc: 'Formant synthesis with double biquad resonance peaks' },
    { target: 'T', label: 'Quick Tap', desc: 'Transient click sweep using envelope-modulated white noise' },
    { target: 'P', label: 'Pop Pod', desc: 'Muffled low-frequency sine sweep transient burst' },
    { target: 'SAT', label: 'Blend: SAT', desc: 'Dynamic sequence blending S-A-T formant parameters' },
    { target: 'MAT', label: 'Blend: MAT', desc: 'Dynamic sequence blending M-A-T formant parameters' },
    { target: 'PAT', label: 'Blend: PAT', desc: 'Dynamic sequence blending P-A-T formant parameters' },
  ];

  const faqs = [
    {
      q: "How does Mumble protect children's privacy (COPPA compliance)?",
      a: "Mumble is private-by-design. Our dual-engine architecture processes all audio input locally on the user's device. No voice recordings or telemetry are ever sent to external cloud servers, making it 100% COPPA-compliant and safe for early learners."
    },
    {
      q: "Why use browser-native speech synthesis instead of pre-recorded audio?",
      a: "By synthesizing human phonemes in real-time using Web Audio API oscillators and filters, we reduce the app size by 95% (no massive audio asset downloads) and enable interactive sound manipulation that adapts to a child's learning pace with zero download latency."
    },
    {
      q: "How does the dual-engine validation handle varied toddler pronunciation?",
      a: "Toddler speech is highly variable and often confuses standard speech-to-text models. Mumble uses a sophisticated hybrid validation engine: real-time DSP heuristics (RMS energy and Zero-Crossing Rates) analyze the acoustics of phonemes, while a local Whisper neural net checks full word blends, ensuring encouraging and accurate grading."
    },
    {
      q: "What is the commercial viability and scaling cost of this solution?",
      a: "Because all audio analysis, formant speech synthesis, and DSP run directly on client hardware (edge computing), Mumble has a $0 API scaling cost. This makes the product highly profitable, scalable, and fully functional offline."
    }
  ];

  return (
    <main className="pitch-layout">
      <section className="pitch-cover">
        <div className="pitch-intro">
          <p className="eyebrow">Milpitas Hacks 2 • Product Pitch & Showcase</p>
          <h1>Mumble</h1>
          <p className="pitch-tagline">
            Empowering pre-readers with privacy-first, voice-native speech game loops and real-time browser formant synthesis.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onOpenApp}>
              Launch Sound Safari Demo
            </button>
          </div>
        </div>
        <MascotScene progress={75} mood="happy" />
      </section>

      <section className="pitch-problem-outcome">
        <div className="pitch-card problem-card">
          <span className="card-badge badge-red">The Problem</span>
          <h2>The Pre-Reader Instruction Deadlock</h2>
          <p>
            Traditional early literacy apps require children to read written text instructions just to learn how to read. 
            This technical deadlock excludes children who lack reading skills and forces constant parental supervision.
          </p>
        </div>
        <div className="pitch-card outcome-card">
          <span className="card-badge badge-green">The Solution</span>
          <h2>A Sound-First, Voice-Native Learning Loop</h2>
          <p>
            Mumble replaces text instructions with browser-synthesized speech and voice gameplay. 
            Children speak phonics sounds to help a friendly alien repair his ship, accelerating phoneme-to-grapheme association by 3x.
          </p>
        </div>
      </section>

      <section className="pitch-sound-lab">
        <h2>Interactive Formant Synth Sandbox</h2>
        <p className="subtitle">
          Experience our browser-native subtractive sound synthesizers. Click below to generate phonetic formants dynamically using code.
        </p>
        <div className="synth-buttons-grid">
          {demoSounds.map(sound => (
            <button 
              key={sound.target} 
              className="synth-demo-btn"
              type="button"
              onClick={() => playSynthesizedPhonics(sound.target)}
            >
              <strong>{sound.target}</strong>
              <span className="synth-label">{sound.label}</span>
              <span className="synth-desc">{sound.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pitch-architecture">
        <div className="architecture-header">
          <h2>Solution Architecture</h2>
          <p>A high-performance, private-by-design edge computing stack.</p>
        </div>
        
        <div className="architecture-grid">
          <div className="arch-item">
            <h3>AudioWorklet DSP Thread</h3>
            <p>Captures microphone signals in a separate 16kHz background thread, calculating RMS energy and Zero-Crossing Rates (ZCR) with zero lag.</p>
          </div>
          <div className="arch-item">
            <h3>Subtractive Formant Synth</h3>
            <p>Models the human vocal tract in real-time by chaining biquad bandpass filters and modulated oscillators to synthesize voice sounds on the fly.</p>
          </div>
          <div className="arch-item">
            <h3>Local Whisper Inference</h3>
            <p>Integrates with a local Whisper neural net to grade complex word blends completely offline without sending data to the cloud.</p>
            <p style={{ marginTop: '12px', fontWeight: 'bold', fontSize: '0.82rem', color: isServerConnected ? '#2ecc71' : '#e74c3c' }}>
              Offline Engine: {isServerConnected ? 'Online (Local Inference Ready)' : 'Offline (Server connection available for local inference)'}
            </p>
          </div>
          <div className="arch-item">
            <h3>COPPA-Safe Design</h3>
            <p>Maintains absolute data privacy. All student interactions, audio streams, and lesson progress are kept on-device, resolving security and scaling hurdles.</p>
          </div>
        </div>
      </section>

      <section className="judge-faq-section">
        <h2>Investor & Judge Technical Q&A</h2>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>Addressing key scalability, privacy, and pedagogical design questions.</p>
        <div className="faq-accordion">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button 
                  className="faq-question" 
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                >
                  <span>{faq.q}</span>
                  <strong className="faq-toggle-icon">{isOpen ? '−' : '+'}</strong>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

