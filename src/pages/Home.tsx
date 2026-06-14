import { useState } from 'react';
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
const isTouchDevice = typeof window !== 'undefined' && (
  window.matchMedia('(pointer: coarse)').matches ||
  'ontouchstart' in window ||
  (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0)
);
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

  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const demoColors = ['var(--yellow)', 'var(--blue)', 'var(--pink)', 'var(--green)'];

  const demoSounds = [
    { target: 'S', label: 'Hissy Air' },
    { target: 'M', label: 'Moon Hum' },
    { target: 'A', label: 'Open Vowel' },
    { target: 'T', label: 'Quick Tap' },
    { target: 'P', label: 'Pop Pod' },
    { target: 'SAT', label: 'Blend: SAT' },
    { target: 'MAT', label: 'Blend: MAT' },
    { target: 'PAT', label: 'Blend: PAT' },
  ];

  const faqs = [
    {
      q: "How does Mumble protect kids' privacy?",
      a: "Mumble is private-by-design. All audio input is processed locally on the user's device. No voice recordings or telemetry are ever sent to external cloud servers, making it 100% COPPA-compliant and safe for early learners."
    },
    {
      q: "Why browser-native speech instead of pre-recorded audio?",
      a: "By synthesizing phonemes in real-time using the Web Audio API, we reduce app size by 95% and enable interactive sound manipulation that adapts to a child's pace with zero download latency."
    },
    {
      q: "How does the engine handle varied toddler pronunciation?",
      a: "Toddler speech is highly variable and often confuses standard speech-to-text models. Mumble uses a hybrid validation engine: real-time DSP heuristics analyze phoneme acoustics while a local Whisper neural net checks full word blends, ensuring encouraging and accurate grading."
    },
    {
      q: "What is the commercial scaling cost?",
      a: "Because all audio analysis, speech synthesis, and DSP run directly on client hardware, Mumble has $0 API scaling cost. This makes it highly profitable, scalable, and fully functional offline."
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
        <motion.div className="pitch-card problem-card pitch-card-accent-red" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -4, boxShadow: '0 20px 0 rgba(23,32,51,0.14)' }} transition={springHover}>
          <span className="card-badge badge-red">The Problem</span>
          <h2>Most literacy apps assume kids can already read.</h2>
          <p>Traditional early literacy apps require children to read written text instructions just to learn how to read.</p>
        </motion.div>
        <motion.div className="pitch-card outcome-card pitch-card-accent-green" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -4, boxShadow: '0 20px 0 rgba(23,32,51,0.14)' }} transition={springHover}>
          <span className="card-badge badge-green">The Solution</span>
          <h2>Mumble flips the script.</h2>
          <p>Children speak. Zibi listens. No reading required.</p>
        </motion.div>
      </motion.section>

      <motion.section className="pitch-sound-lab" variants={fadeUp}>
        <motion.h2 variants={fadeUpFast}>Interactive Formant Synth Sandbox</motion.h2>
        <motion.p className="subtitle" variants={fadeUpFast}>
          Click any sound to hear Zibi's voice engine in action.
        </motion.p>
        <motion.div className="synth-buttons-grid" variants={stagger}>
          {demoSounds.map((sound, i) => {
            const isPlaying = playingSound === sound.target;
            return (
              <motion.button
                key={sound.target}
                className={`synth-demo-btn${isPlaying ? ' is-playing' : ''}`}
                type="button"
                onClick={() => {
                  setPlayingSound(sound.target);
                  playSynthesizedPhonics(sound.target);
                  setTimeout(() => setPlayingSound(null), 600);
                }}
                variants={fadeUpFast}
                style={{ '--btn-color': demoColors[i % 4] } as React.CSSProperties}
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
              </motion.button>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.section className="pitch-architecture" variants={fadeUp}>
        <motion.div className="architecture-header" variants={fadeUpFast}>
          <h2>How It Works Under the Hood</h2>
          <p>Built for speed, privacy, and the classroom.</p>
        </motion.div>
        
        <motion.div className="architecture-grid" variants={stagger}>
          <motion.div className="arch-item arch-yellow" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <span className="arch-number">01</span>
            <h3>Audio Capture</h3>
            <p>Captures microphone signals in a separate 16kHz background thread with zero lag.</p>
          </motion.div>
          <motion.div className="arch-item arch-blue" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <span className="arch-number">02</span>
            <h3>Voice Synthesis</h3>
            <p>Models the human vocal tract in real-time using chained biquad filters and modulated oscillators.</p>
          </motion.div>
          <motion.div className="arch-item arch-pink" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <span className="arch-number">03</span>
            <h3>Speech Grading</h3>
            <p>Grades complex word blends completely offline without sending data to the cloud.</p>
          </motion.div>
          <motion.div className="arch-item arch-green" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <span className="arch-number">04</span>
            <h3>Zero Data Stored</h3>
            <p>All student interactions, audio streams, and lesson progress are kept on-device, never sent to servers.</p>
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section className="judge-faq-section" variants={fadeUp}>
        <motion.h2 variants={fadeUpFast}>Judge FAQ</motion.h2>
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
                  <strong className="faq-toggle-icon">{isOpen ? '▾' : '▸'}</strong>
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

      <motion.section className="closing-banner" variants={fadeUp}>
        <motion.div variants={fadeUpFast}>
          <h2>20 Missions. One Journey.</h2>
          <p>Help Zibi repair his ship, one word at a time.</p>
          <motion.button
            className="primary-action"
            type="button"
            onClick={onOpenApp}
            whileHover={{ scale: 1.05, boxShadow: '7px 7px 0 #172033' }}
            whileTap={{ scale: 0.96, boxShadow: '2px 2px 0 #172033' }}
            transition={springTap}
          >
            Open Course &rarr;
          </motion.button>
        </motion.div>
      </motion.section>
    </motion.main>
  );
}

