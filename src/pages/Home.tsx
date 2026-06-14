import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { MascotScene } from '../components/MascotScene';
import { speakText } from '../audioUtils';

interface HomeProps {
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

export function Home({ onOpenApp, equippedItem }: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakText("Just press start!");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

          <motion.h1 variants={fadeUpFast}>Mumble</motion.h1>
          <motion.p className="pitch-tagline" variants={fadeUpFast}>
            Speak. Zibi listens. No reading required.
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
            >
              Hear instructions
            </button>
          </motion.div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <MascotScene progress={75} mood="happy" equippedItem={equippedItem} />
        </motion.div>
      </motion.section>

      <motion.section className="origin-story" variants={fadeUp}>
        <motion.div variants={fadeUpFast}>
          <span className="card-badge badge-green">A Message from One of the Founders</span>
          <div className="origin-quote-mark" aria-hidden="true">&ldquo;</div>
          <h2>I struggled to read.</h2>
          <p className="origin-text">
            When I was very little, my school put me in front of programs like Lexia before I could read. I'm very fortunate to have a mom that sat with me and worked through it with me. I know not everyone has the privilege of having parents who can always help you study. Mumble wants every kid to have a chance to learn.
          </p>
        </motion.div>
      </motion.section>

      <motion.section className="pitch-problem-outcome" variants={fadeUp}>
        <motion.div className="pitch-card problem-card pitch-card-accent-red" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -4, boxShadow: '0 20px 0 rgba(23,32,51,0.14)' }} transition={springHover}>
          <span className="card-badge badge-red">The Real Technical Problem</span>
          <h3>COPPA compliance bans cloud audio. Single-threaded JS freezes under DSP+AI. Schools ship low-end Chromebooks.</h3>
        </motion.div>
        <motion.div className="pitch-card outcome-card pitch-card-accent-green" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -4, boxShadow: '0 20px 0 rgba(23,32,51,0.14)' }} transition={springHover}>
          <span className="card-badge badge-green">The Real Engineering Solution</span>
          <h3>Local whisper.cpp server keeps audio on-device. Web Audio API + AudioWorklet offload DSP off the main thread. Biquad filters + modulated oscillators close the feedback loop instantly.</h3>
        </motion.div>
      </motion.section>

      <motion.section className="pitch-architecture" variants={fadeUp}>
        <motion.div className="architecture-header" variants={fadeUpFast}>
          <h2>How It Works Under the Hood</h2>
          <p>Built for speed, privacy, and the classroom.</p>
        </motion.div>
        
        <motion.div className="architecture-grid" variants={stagger}>
          <motion.div className="arch-item arch-yellow" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>Audio Capture</h3>
            <p>Captures microphone signals in a separate 16kHz background thread with zero lag.</p>
          </motion.div>
          <motion.div className="arch-item arch-blue" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>Voice Synthesis</h3>
            <p>Models the human vocal tract in real-time using chained biquad filters and modulated oscillators.</p>
          </motion.div>
          <motion.div className="arch-item arch-pink" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>Speech Grading</h3>
            <p>Grades complex word blends completely offline without sending data to the cloud.</p>
          </motion.div>
          <motion.div className="arch-item arch-green" variants={fadeUpFast} whileHover={isTouchDevice ? undefined : { y: -3, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <h3>Zero Data Stored</h3>
            <p>All student interactions, audio streams, and lesson progress are kept on-device, never sent to servers.</p>
          </motion.div>
        </motion.div>

      </motion.section>

      <motion.section className="design-section" variants={fadeUp}>
        <motion.div className="architecture-header" variants={fadeUpFast}>
          <h2>Design Decisions</h2>
          <p>Every choice starts with one question: can a toddler use this alone?</p>
        </motion.div>
        <motion.div className="design-timeline" variants={stagger}>
          {[
            {
              title: 'Privacy-First Onboarding',
              desc: 'No accounts, no email, no data leaves the device. Open the app and press START — zero friction, zero compliance risk.',
              color: 'var(--blue)'
            },
            {
              title: 'Offline by Default',
              desc: 'Every feature works without internet. Audio capture, speech synthesis, AI inference, and grading all run locally — no server dependency.',
              color: 'var(--orange)'
            },
            {
              title: 'Child-Led Pacing',
              desc: 'No timers, no fail states, no pressure. The child controls the rhythm — repeat a lesson ten times or breeze through. Zibi waits patiently.',
              color: 'var(--pink)'
            },
            {
              title: 'Visual Progress Metaphor',
              desc: 'Repair Zibi\'s ship and explore a planet map instead of filling progress bars. Learning feels like a story, not a checklist.',
              color: 'var(--yellow)'
            },
            {
              title: 'Color-Coded Phonics',
              desc: 'Every phoneme has a consistent color across lessons, blending practice, and rewards. Children build pattern recognition without needing to read.',
              color: 'var(--violet)'
            }
          ].map((item, i) => (
            <motion.div key={i} className="timeline-item" variants={fadeUpFast}>
              <div className="timeline-dot" style={{ background: item.color }} />
              <motion.div
                className="timeline-card"
                style={{ '--tl-color': item.color } as React.CSSProperties}
                whileHover={isTouchDevice ? undefined : { x: 4, transition: { type: 'spring', stiffness: 200, damping: 12 } }}
              >
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

        <motion.section className="judge-faq-section" variants={fadeUp}>
          <motion.h2 variants={fadeUpFast}>Judge FAQ</motion.h2>
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
        <div className="closing-mascot">
          <MascotScene progress={60} mood="reading" equippedItem={equippedItem} hideShip />
        </div>
      </motion.section>
    </motion.main>
  );
}
