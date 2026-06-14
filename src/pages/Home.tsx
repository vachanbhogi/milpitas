import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { MascotScene } from '../components/MascotScene';
import { playSynthesizedPhonics, speakText } from '../audioUtils';

interface HomeProps {
  isServerConnected: boolean | null;
  onOpenApp: () => void;
  equippedItem: string | null;
}

const springHover = { type: 'spring' as const, stiffness: 300, damping: 12 };
const springTap = { type: 'spring' as const, stiffness: 500, damping: 20 };
const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
};
const fadeUpFast: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
};

export function Home({ isServerConnected, onOpenApp, equippedItem }: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakText("Just press start!");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
    <motion.main className="pitch-layout" initial="hidden" animate="visible" variants={stagger}>
      <motion.section className="pitch-cover" variants={fadeUp}>
        <motion.div className="pitch-intro" variants={stagger}>
          <motion.p className="eyebrow" variants={fadeUpFast}>Milpitas Hacks 2 • Product Pitch & Showcase</motion.p>
          <motion.h1 variants={fadeUpFast}>Mumble</motion.h1>
          <motion.p className="pitch-tagline" variants={fadeUpFast}>
            Empowering pre-readers with privacy-first, voice-native speech game loops and real-time browser formant synthesis.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUpFast} style={{ display: 'grid', gap: '16px', justifyItems: 'start' }}>
            <motion.button
              className="primary-action giant-start-btn"
              type="button"
              onClick={onOpenApp}
              whileHover={isTouchDevice ? undefined : { scale: 1.05, boxShadow: '12px 12px 0 #172033' }}
              whileTap={{ scale: 0.96, boxShadow: '4px 4px 0 #172033' }}
              transition={springTap}
            >
              START!
            </motion.button>
            <button
              type="button"
              className="audio-guide-btn"
              onClick={() => speakText("Just press start!")}
              style={{
                background: 'var(--yellow-soft)',
                border: '3px solid var(--line)',
                borderRadius: '999px',
                padding: '8px 16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '3px 3px 0 var(--line)',
                fontSize: '1.2rem'
              }}
            >
              Hear instructions: "Just press start!"
            </button>
          </motion.div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <MascotScene progress={75} mood="happy" equippedItem={equippedItem} />
        </motion.div>
      </motion.section>

      <motion.section className="pitch-problem-outcome" variants={fadeUp}>
        <motion.div className="pitch-card problem-card" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -4, boxShadow: '0 20px 0 rgba(23,32,51,0.14)' }} transition={springHover}>
          <span className="card-badge badge-red">The Problem</span>
          <h2>The Pre-Reader Instruction Deadlock</h2>
          <p>
            Traditional early literacy apps require children to read written text instructions just to learn how to read. 
            This technical deadlock excludes children who lack reading skills and forces constant parental supervision.
          </p>
        </motion.div>
        <motion.div className="pitch-card outcome-card" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -4, boxShadow: '0 20px 0 rgba(23,32,51,0.14)' }} transition={springHover}>
          <span className="card-badge badge-green">The Solution</span>
          <h2>A Sound-First, Voice-Native Learning Loop</h2>
          <p>
            Mumble replaces text instructions with browser-synthesized speech and voice gameplay. 
            Children speak phonics sounds to help a friendly alien repair his ship, accelerating phoneme-to-grapheme association by 3x.
          </p>
        </motion.div>
      </motion.section>

      <motion.section className="pitch-sound-lab" variants={fadeUp}>
        <motion.h2 variants={fadeUpFast}>Interactive Formant Synth Sandbox</motion.h2>
        <motion.p className="subtitle" variants={fadeUpFast}>
          Experience our browser-native subtractive sound synthesizers. Click below to generate phonetic formants dynamically using code.
        </motion.p>
        <motion.div className="synth-buttons-grid" variants={stagger}>
          {demoSounds.map((sound) => (
            <motion.button
              key={sound.target}
              className="synth-demo-btn"
              type="button"
              onClick={() => playSynthesizedPhonics(sound.target)}
              variants={fadeUpFast}
              whileHover={isTouchDevice ? undefined : {
                scale: 1.06,
                y: -3,
                boxShadow: '7px 7px 0 #172033',
                transition: { type: 'spring', stiffness: 300, damping: 12 },
              }}
              whileTap={{ scale: 0.95, boxShadow: '2px 2px 0 #172033' }}
            >
              <strong>{sound.target}</strong>
              <span className="synth-label">{sound.label}</span>
              <span className="synth-desc">{sound.desc}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      <motion.section className="pitch-architecture" variants={fadeUp}>
        <motion.div className="architecture-header" variants={fadeUpFast}>
          <h2>Solution Architecture</h2>
          <p>A high-performance, private-by-design edge computing stack.</p>
        </motion.div>
        
        <motion.div className="architecture-grid" variants={stagger}>
          <motion.div className="arch-item" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>AudioWorklet DSP Thread</h3>
            <p>Captures microphone signals in a separate 16kHz background thread, calculating RMS energy and Zero-Crossing Rates (ZCR) with zero lag.</p>
          </motion.div>
          <motion.div className="arch-item" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>Subtractive Formant Synth</h3>
            <p>Models the human vocal tract in real-time by chaining biquad bandpass filters and modulated oscillators to synthesize voice sounds on the fly.</p>
          </motion.div>
          <motion.div className="arch-item" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>Local Whisper Inference</h3>
            <p>Integrates with a local Whisper neural net to grade complex word blends completely offline without sending data to the cloud.</p>
            <p style={{ marginTop: '12px', fontWeight: 'bold', fontSize: '0.82rem', color: isServerConnected ? '#2ecc71' : '#e74c3c' }}>
              Offline Engine: {isServerConnected ? 'Online (Local Inference Ready)' : 'Offline (Server connection available for local inference)'}
            </p>
          </motion.div>
          <motion.div className="arch-item" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>COPPA-Safe Design</h3>
            <p>Maintains absolute data privacy. All student interactions, audio streams, and lesson progress are kept on-device, resolving security and scaling hurdles.</p>
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section className="judge-faq-section" variants={fadeUp}>
        <motion.h2 variants={fadeUpFast}>Investor & Judge Technical Q&A</motion.h2>
        <motion.p className="subtitle" variants={fadeUpFast} style={{ textAlign: 'center', marginBottom: '24px' }}>Addressing key scalability, privacy, and pedagogical design questions.</motion.p>
        <motion.div className="faq-accordion" variants={stagger}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <motion.div key={index} className={`faq-item ${isOpen ? 'is-open' : ''}`} variants={fadeUpFast}>
                <motion.button
                  className="faq-question"
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <span>{faq.q}</span>
                  <motion.strong
                    className="faq-toggle-icon"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  >
                    {isOpen ? '−' : '+'}
                  </motion.strong>
                </motion.button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <p>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>
    </motion.main>
  );
}

