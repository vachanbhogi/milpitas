import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MascotScene } from '../components/MascotScene';
import { PictureBadge } from '../components/PictureBadge';
import { playSynthesizedPhonics } from '../audioUtils';
import { COURSE_MODULES as REAL_COURSE_MODULES } from '../course/courseModules';
import Tesseract from 'tesseract.js';
import {
  type Lesson,
  type CourseModule,
  type ModuleId,
  type LessonStatus,
  type PhonicsLesson,
  type ChoiceLesson,
  type SentenceLesson,
  type WritingLesson,
  type VoiceSnapshot
} from '../types';

const springTap = { type: 'spring' as const, stiffness: 500, damping: 20 };
const stagger = { staggerChildren: 0.08 };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};
const fadeUpFast = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

type HomePlanetNode = {
  id: 'home-planet';
  title: string;
  planet: string;
  colorClass: string;
  mission: string;
  lessons: [];
};

type PathNode = CourseModule | HomePlanetNode;

const HOME_PLANET_NODE: HomePlanetNode = {
  id: 'home-planet',
  title: 'Mumble Home 🪐',
  planet: 'Mumble Home Planet',
  colorClass: 'violet',
  mission: 'Welcome home, Zibi! Planet reached.',
  lessons: [],
};

interface AppCourseProps {
  completedLessons: Set<string>;
  completedCount: number;
  totalLessons: number;
  shipProgress: number;
  allDone: boolean;
  isServerConnected: boolean | null;
  onOpenModule: (moduleId: ModuleId) => void;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenRewards: () => void;
  onRestart: () => void;
  // Lesson specific props
  viewingLesson: boolean;
  lesson: Lesson;
  activeModule: CourseModule;
  currentModuleProgress: number;
  activeLessonIndex: number;
  status: LessonStatus;
  feedbackText: string;
  heardText: string;
  isSupported: boolean;
  isListening: boolean;
  soundClass: string;
  energy: number;
  confidence: number;
  bestVoice: VoiceSnapshot;
  selectedChoiceId: string | null;
  selectedTiles: string[];
  onBack: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onChoice: (choiceId: string) => void;
  onTile: (tile: string) => void;
  onClearSentence: () => void;
  onCompleteWriting: () => void;
  onNext: () => void;
}

export function AppCourse(props: AppCourseProps) {
  if (props.viewingLesson) {
    return <LessonScreen {...props} />;
  }

  return <CourseMap {...props} />;
}

// CourseMap implementation using winding flight path
function CourseMap({
  completedLessons,
  completedCount,
  totalLessons,
  shipProgress,
  allDone,
  onOpenModule,
  onOpenLesson,
  onOpenRewards,
  onRestart,
}: AppCourseProps) {
  const courseNodes: PathNode[] = [...REAL_COURSE_MODULES, HOME_PLANET_NODE];

  const hasUnlockedHome = completedCount >= totalLessons;

  return (
    <motion.main className="course-layout" initial="hidden" animate="visible" variants={stagger}>
      <motion.section className="hero-panel" variants={fadeUp}>
        <motion.div className="hero-copy" variants={stagger}>
          <motion.p className="eyebrow" variants={fadeUpFast}>Interactive Learning Flight Path</motion.p>
          <motion.h1 variants={fadeUpFast}>Help Zibi get home.</motion.h1>
          <motion.p variants={fadeUpFast}>
            Welcome to <strong>Mumble</strong>! Speak phonics sounds and guide Zibi
            along the stellar orbit pathway back to his Home Planet.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUpFast}>
            <motion.button className="primary-action" type="button" onClick={() => onOpenModule('phonics')}
              whileHover={{ scale: 1.05, boxShadow: '7px 7px 0 #172033' }} whileTap={{ scale: 0.96 }} transition={springTap}>
              Start Orbit
            </motion.button>
            <motion.button className="secondary-action" type="button" onClick={onOpenRewards}
              whileHover={{ scale: 1.05, boxShadow: '7px 7px 0 #172033' }} whileTap={{ scale: 0.96 }} transition={springTap}>
              Rewards Path
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <MascotScene progress={shipProgress} mood={allDone ? 'launch' : 'happy'} />
        </motion.div>
      </motion.section>

      <motion.section className="status-strip" variants={fadeUp} aria-label="course status">
        {[
          { label: 'Ship repair', value: `${shipProgress}%` },
          { label: 'Missions', value: `${completedCount}/${totalLessons}` },
        ].map((item) => (
          <motion.div key={item.label} variants={fadeUpFast}
            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </motion.div>
        ))}
      </motion.section>

      <AnimatePresence>
        {allDone && (
          <motion.section className="launch-card"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
            <div>
              <p className="eyebrow">Launch ready</p>
              <h2>Zibi can visit Earth again.</h2>
              <p>Every Scoin seed is glowing. Replay the course or jump into any planet.</p>
            </div>
            <motion.button className="secondary-action" type="button" onClick={onRestart}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
              Play Again
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section className="flight-path-section" variants={fadeUp}>
        <motion.h2 className="orbit-heading" variants={fadeUpFast}>✦ Constellation Orbit Trail ✦</motion.h2>
        <div className="flight-path-container">
          <motion.div className="flight-path-line"
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}>
            <span className="path-marker" style={{ top: '0%' }}>0%</span>
            <span className="path-marker" style={{ top: '25%' }}>25%</span>
            <span className="path-marker" style={{ top: '50%' }}>50%</span>
            <span className="path-marker" style={{ top: '75%' }}>75%</span>
            <span className="path-marker" style={{ top: '100%' }}>100%</span>
          </motion.div>

          <motion.div className="ship-avatar-indicator animate-float"
            style={{ top: `${shipProgress}%` }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            <div className="path-ship-wrap" aria-hidden="true">
              <div className="path-ship">
                <span className="path-ship-window" />
                <span className="path-ship-fin left" />
                <span className="path-ship-fin right" />
                <span className="path-ship-flame" />
              </div>
            </div>
            <span className="indicator-tooltip">Zibi is here!</span>
          </motion.div>
          
          {courseNodes.map((module, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const isHomePlanet = module.id === 'home-planet';
            const isLocked = isHomePlanet && !hasUnlockedHome;

            const moduleDoneCount = !isHomePlanet ? module.lessons.filter(lesson => completedLessons.has(lesson.id)).length : 0;
            const totalInModule = !isHomePlanet ? module.lessons.length : 0;

            return (
              <motion.div
                key={module.id}
                className={`path-node-wrap ${side} ${isLocked ? 'locked' : ''}`}
                variants={fadeUpFast}
              >
                <motion.div className={`path-planet-bubble color-${module.colorClass}`}
                  whileHover={{ scale: 1.03, rotate: 1, boxShadow: '8px 8px 0 #172033' }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
                  <PictureBadge art={isHomePlanet ? 'planet' : module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : module.id === 'writing' ? 'paint' : 'ship'} label={module.title} />
                  <div className="planet-details">
                    <h3>{module.title}</h3>
                    {isHomePlanet ? (
                      <>
                        <p>{module.mission}</p>
                        <div className="lock-milestone-text">
                          {isLocked ? '🔒' : '🔓'} Total Scoin Seeds: {completedCount}/{totalLessons}
                        </div>
                      </>
                    ) : (
                      <>
                        <p>{module.mission}</p>
                        <span className="planet-node-progress">{moduleDoneCount}/{totalInModule} completed</span>
                        <div className="mini-progress-dots">
                          {module.lessons.map(lesson => (
                            <motion.button
                              key={lesson.id}
                              className={`path-dot ${completedLessons.has(lesson.id) ? 'is-complete' : ''}`}
                              type="button"
                              onClick={() => onOpenLesson(lesson)}
                              title={`Start lesson: ${lesson.title}`}
                              whileHover={{ scale: 1.6 }}
                              whileTap={{ scale: 0.8 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!isLocked && !isHomePlanet && (
                    <motion.button className="primary-action start-planet-btn" onClick={() => onOpenModule(module.id)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={springTap}>
                      Land!
                    </motion.button>
                  )}
                  {isHomePlanet && !isLocked && (
                    <motion.div className="home-victory-banner"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                      🎉 VICTORY! ZIBI IS HOME! 🎉
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {allDone && (
              <motion.div className="orbit-complete-banner"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 150, damping: 12 }}>
                <span>🎉</span>
                <strong>Ship Repaired! You've Finished!</strong>
                <span>🛸</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.main>
  );
}

// LessonScreen coordinator
interface LessonScreenProps {
  lesson: Lesson;
  activeModule: CourseModule;
  currentModuleProgress: number;
  activeLessonIndex: number;
  completedLessons: Set<string>;
  status: LessonStatus;
  feedbackText: string;
  heardText: string;
  isSupported: boolean;
  isListening: boolean;
  isServerConnected: boolean | null;
  soundClass: string;
  energy: number;
  confidence: number;
  bestVoice: VoiceSnapshot;
  selectedChoiceId: string | null;
  selectedTiles: string[];
  shipProgress: number;
  onBack: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onChoice: (choiceId: string) => void;
  onTile: (tile: string) => void;
  onClearSentence: () => void;
  onCompleteWriting: () => void;
  onNext: () => void;
}

function LessonScreen({
  lesson,
  activeModule,
  currentModuleProgress,
  activeLessonIndex,
  completedLessons,
  status,
  feedbackText,
  heardText,
  isSupported,
  isListening,
  isServerConnected,
  soundClass,
  energy,
  confidence,
  bestVoice,
  selectedChoiceId,
  selectedTiles,
  shipProgress,
  onBack,
  onStartRecording,
  onStopRecording,
  onChoice,
  onTile,
  onClearSentence,
  onCompleteWriting,
  onNext,
}: LessonScreenProps) {
  const meterScale = Math.min(Math.max(energy * 5, 0.04), 1);
  const isComplete = completedLessons.has(lesson.id);

  let mascotMood: 'idle' | 'listening' | 'happy' | 'thinking' | 'retry' | 'launch' = 'idle';
  if (status === 'recording') {
    mascotMood = 'listening';
  } else if (status === 'checking') {
    mascotMood = 'thinking';
  } else if (status === 'success' || isComplete) {
    mascotMood = 'happy';
  } else if (status === 'retry' || status === 'error') {
    mascotMood = 'retry';
  }

  function getLessonIcon(moduleId: string) {
    if (moduleId === 'phonics') return 'sound rings';
    if (moduleId === 'letters') return 'letter lights';
    if (moduleId === 'writing') return 'ink canvas';
    return 'word blocks';
  }

  return (
    <motion.main className="lesson-layout" initial="hidden" animate="visible" variants={stagger}>
      <div className="lesson-grid">
        <motion.section className={`lesson-card module-${activeModule.colorClass}`} variants={fadeUp}>
          <motion.div className="lesson-header" variants={fadeUpFast}>
            <motion.button className="back-button" type="button" onClick={onBack}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
              Map
            </motion.button>
            <div>
              <span>{activeModule.planet}</span>
              <strong>{currentModuleProgress}/{activeModule.lessons.length} complete</strong>
            </div>
          </motion.div>

          <motion.div className="mission-banner" variants={fadeUpFast}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <PictureBadge
                art={lesson.moduleId === 'phonics' ? 'planet' : lesson.moduleId === 'letters' ? 'star' : lesson.moduleId === 'writing' ? 'paint' : 'ship'}
                label={getLessonIcon(lesson.moduleId)}
              />
            </motion.div>
            <motion.div variants={stagger}>
              <motion.p className="eyebrow" variants={fadeUpFast}>Mission {activeLessonIndex + 1}</motion.p>
              <motion.h1 variants={fadeUpFast}>{lesson.title}</motion.h1>
              <motion.p variants={fadeUpFast}>{lesson.storyPrompt}</motion.p>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={lesson.id + status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
              {lesson.type === 'phonics' && (
                <PhonicsMission
                  lesson={lesson}
                  status={status}
                  feedbackText={feedbackText}
                  heardText={heardText}
                  isSupported={isSupported}
                  isListening={isListening}
                  isServerConnected={isServerConnected}
                  soundClass={soundClass}
                  confidence={confidence}
                  bestVoice={bestVoice}
                  meterScale={meterScale}
                  onStartRecording={onStartRecording}
                  onStopRecording={onStopRecording}
                />
              )}

              {(lesson.type === 'letter-choice' || lesson.type === 'grammar-choice') && (
                <ChoiceMission
                  lesson={lesson as ChoiceLesson}
                  status={status}
                  feedbackText={feedbackText}
                  selectedChoiceId={selectedChoiceId}
                  onChoice={onChoice}
                />
              )}

              {lesson.type === 'sentence-build' && (
                <SentenceMission
                  lesson={lesson as SentenceLesson}
                  status={status}
                  feedbackText={feedbackText}
                  selectedTiles={selectedTiles}
                  onTile={onTile}
                  onClear={onClearSentence}
                />
              )}

              {lesson.type === 'writing' && (
                <WritingMission
                  lesson={lesson as WritingLesson}
                  status={status}
                  onComplete={onCompleteWriting}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {isComplete && (
              <motion.div className="success-row"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
                <div>
                  <motion.span className="seed-icon" aria-hidden="true"
                    animate={{ rotate: [0, -35, 0] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }} />
                  <strong>{lesson.rewardName} (+1 Scoin Seed!)</strong>
                </div>
                <motion.button className="primary-action" type="button" onClick={onNext}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
                  Next Mission
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section className="mascot-side-panel" variants={fadeUp}
          animate={status === 'recording' ? { boxShadow: '0 0 24px rgba(100, 219, 135, 0.3)' } : { boxShadow: '0 16px 0 rgba(23, 32, 51, 0.12)' }}
          transition={{ duration: 0.4 }}>
          <div className="mascot-panel-header">
            <motion.h2
              animate={status === 'success' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.4 }}>
              Zibi's Cabin
            </motion.h2>
            <motion.p className="cabin-status"
              key={status}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}>
              {status === 'recording' ? 'Listening...' : status === 'checking' ? 'Translating...' : isComplete ? 'Success!' : 'Ready'}
            </motion.p>
          </div>
          <MascotScene progress={shipProgress} mood={mascotMood} />
        </motion.section>
      </div>
    </motion.main>
  );
}

// PhonicsMission component
interface PhonicsMissionProps {
  lesson: PhonicsLesson;
  status: LessonStatus;
  feedbackText: string;
  heardText: string;
  isSupported: boolean;
  isListening: boolean;
  isServerConnected: boolean | null;
  soundClass: string;
  confidence: number;
  bestVoice: VoiceSnapshot;
  meterScale: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

function PhonicsMission({
  lesson,
  status,
  feedbackText,
  heardText,
  isSupported,
  isListening,
  isServerConnected,
  soundClass,
  confidence,
  bestVoice,
  meterScale,
  onStartRecording,
  onStopRecording,
}: PhonicsMissionProps) {
  function getSoundLabel(sc: string) {
    if (sc === 'hissy') return 'hissy air';
    if (sc === 'open') return 'open voice';
    if (sc === 'pop') return 'quick pop';
    if (sc === 'voice') return 'voice';
    return 'quiet';
  }

  return (
    <motion.div className="mission-body" variants={stagger}>
      <motion.section
        className="sound-stage clickable-sound-stage"
        aria-label="speech mission"
        onClick={() => playSynthesizedPhonics(lesson.targetText)}
        style={{ cursor: 'pointer' }}
        variants={fadeUpFast}
        whileHover={{ y: -3, boxShadow: '0 20px 0 rgba(23,32,51,0.15)' }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      >
        <div className="target-label">Teach Zibi (Tap to Hear) 🔊</div>
        <motion.h2
          animate={isListening ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 1.2, repeat: isListening ? Infinity : 0, ease: 'easeInOut' }}>
          {lesson.displayText}
        </motion.h2>
        <motion.div className="phonics-row" aria-label="sound parts" variants={stagger}>
          {lesson.phonicsParts.map(part => (
            <motion.span
              key={part}
              variants={fadeUpFast}
              onClick={(e) => {
                e.stopPropagation();
                playSynthesizedPhonics(part);
              }}
              style={{ cursor: 'pointer' }}
              whileHover={{ scale: 1.12, y: -2, boxShadow: '6px 6px 0 #172033' }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            >
              {part}
            </motion.span>
          ))}
        </motion.div>
        <p>{lesson.coachPrompt}</p>
      </motion.section>

      <motion.section
        className={`translator-panel ${isListening ? 'is-listening' : ''}`}
        variants={fadeUpFast}
        animate={isListening ? { backgroundColor: '#f1fff5' } : { backgroundColor: '#ffffff' }}
        transition={{ duration: 0.3 }}
      >
        <div className="translator-topline">
          <div>
            <motion.span className="live-dot" aria-hidden="true"
              animate={isListening ? { scale: [1, 1.3, 1], backgroundColor: ['#2c3a58', '#64db87', '#2c3a58'] } : {}}
              transition={{ duration: 0.8, repeat: isListening ? Infinity : 0 }} />
            <motion.strong key={isListening ? 'listening' : 'idle'}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              {isListening ? getSoundLabel(soundClass) : 'translator ready'}
            </motion.strong>
          </div>
          <motion.span className={isServerConnected ? 'server-pill online' : 'server-pill'}
            animate={isServerConnected ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 3, repeat: isServerConnected ? Infinity : 0 }}>
            {isServerConnected ? 'Whisper online' : 'Whisper offline'}
          </motion.span>
        </div>
        <div className="meter" aria-hidden="true">
          <motion.span
            animate={{ scaleX: meterScale }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          />
        </div>
        <motion.p key={feedbackText}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}>
          {feedbackText}
        </motion.p>
        <div className="voice-readout" aria-label="voice readout">
          {[
            `Best sound: ${getSoundLabel(bestVoice.soundClass)}`,
            `Live confidence: ${Math.round(confidence * 100)}%`,
            heardText && `Whisper heard: ${heardText}`,
          ].filter(Boolean).map((text, i) => (
            <motion.span key={String(text)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 12 }}>
              {text}
            </motion.span>
          ))}
        </div>
      </motion.section>

      <AnimatePresence>
        {!isSupported && (
          <motion.p className="system-note" variants={fadeUpFast}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            This browser cannot use the microphone. Try Chrome, Edge, or Safari on localhost.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isServerConnected && lesson.kind === 'word' && (
          <motion.p className="system-note" variants={fadeUpFast}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            Word checks need the local Whisper server. Run bun run whisper:server before this mission.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div className="lesson-actions" variants={fadeUpFast}>
        <AnimatePresence mode="wait">
          {status !== 'recording' && status !== 'checking' && (
            <motion.button key="start" className="primary-action" type="button" disabled={!isSupported} onClick={onStartRecording}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
              Start Speaking
            </motion.button>
          )}
          {status === 'recording' && (
            <motion.button key="stop" className="primary-action stop-action" type="button" onClick={onStopRecording}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}>
              Check My Sound
            </motion.button>
          )}
          {status === 'checking' && (
            <motion.button key="checking" className="primary-action" type="button" disabled
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              Checking
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ChoiceMission component
interface ChoiceMissionProps {
  lesson: ChoiceLesson;
  status: LessonStatus;
  feedbackText: string;
  selectedChoiceId: string | null;
  onChoice: (choiceId: string) => void;
}

function ChoiceMission({ lesson, status, feedbackText, selectedChoiceId, onChoice }: ChoiceMissionProps) {
  return (
    <motion.div className="mission-body" variants={stagger}>
      <motion.section className="prompt-panel" variants={fadeUpFast}>
        <span>{lesson.type === 'letter-choice' ? 'Letter game' : 'Tiny grammar'}</span>
        <h2>{lesson.prompt}</h2>
        <motion.p key={feedbackText}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}>
          {feedbackText}
        </motion.p>
      </motion.section>

      <motion.div className="choice-grid" variants={stagger}>
        {lesson.choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          const isCorrect = choice.id === lesson.correctChoiceId;
          return (
            <motion.button
              className={`choice-card ${isSelected ? 'is-selected' : ''} ${status === 'success' && isCorrect ? 'is-correct' : ''}`}
              type="button"
              key={choice.id}
              onClick={() => onChoice(choice.id)}
              variants={fadeUpFast}
              whileHover={{ scale: 1.04, y: -4, boxShadow: '10px 10px 0 rgba(23,32,51,0.2)' }}
              whileTap={{ scale: 0.95, boxShadow: '2px 2px 0 rgba(23,32,51,0.2)' }}
              transition={{ type: 'spring', stiffness: 250, damping: 12 }}
              layout
            >
              <motion.div
                animate={isSelected && status === 'success' ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}>
                <PictureBadge art={choice.art} label={choice.helper} />
              </motion.div>
              <strong>{choice.label}</strong>
              <span>{choice.helper}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// SentenceMission component
interface SentenceMissionProps {
  lesson: SentenceLesson;
  status: LessonStatus;
  feedbackText: string;
  selectedTiles: string[];
  onTile: (tile: string) => void;
  onClear: () => void;
}

function SentenceMission({ lesson, status, feedbackText, selectedTiles, onTile, onClear }: SentenceMissionProps) {
  return (
    <motion.div className="mission-body" variants={stagger}>
      <motion.section className="prompt-panel" variants={fadeUpFast}>
        <span>Sentence builder</span>
        <h2>{lesson.prompt}</h2>
        <motion.p key={feedbackText}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}>
          {feedbackText}
        </motion.p>
      </motion.section>

      <motion.div className="sentence-builder" variants={fadeUpFast}>
        <motion.div className="sentence-slots" aria-label="selected words" variants={stagger}>
          {lesson.correctSequence.map((_, index) => (
            <motion.span key={index}
              animate={selectedTiles[index] ? { scale: [1, 1.06, 1], backgroundColor: '#e9fff0' } : { scale: 1, backgroundColor: '#f3f8ff' }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
              {selectedTiles[index] ?? ''}
            </motion.span>
          ))}
        </motion.div>

        <motion.div className="tile-grid" variants={stagger}>
          {lesson.tiles.map((tile) => (
            <motion.button
              key={tile}
              className={selectedTiles.includes(tile) ? 'is-used' : ''}
              type="button"
              onClick={() => onTile(tile)}
              variants={fadeUpFast}
              whileHover={{ scale: 1.06, y: -2, boxShadow: '7px 7px 0 #172033' }}
              whileTap={{ scale: 0.94, boxShadow: '2px 2px 0 #172033' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              layout
            >
              {tile}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence>
          {status !== 'success' && (
            <motion.button className="secondary-action clear-action" type="button" onClick={onClear}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// WritingMission component
// WritingMission component
interface WritingMissionProps {
  lesson: WritingLesson;
  status: LessonStatus;
  onComplete: () => void;
}

function WritingMission({ lesson, status, onComplete }: WritingMissionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [localFeedback, setLocalFeedback] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current || !canvasRef.current || !lastPosRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    
    ctx.stroke();
    lastPosRef.current = pos;
    if (!hasInk) setHasInk(true);
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasInk(false);
    setLocalFeedback('');
  };

  // Reset the whiteboard and state after every level / when active lesson changes
  useEffect(() => {
    clearCanvas();
  }, [lesson.id]);

  const handleCheck = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Quick pixel density check to ensure something is drawn on the board
    let inkPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i+1];
      const b = imageData.data[i+2];
      if (r < 240 || g < 240 || b < 240) {
        inkPixels++;
      }
    }
    
    const inkRatio = inkPixels / (canvas.width * canvas.height);
    if (inkRatio < 0.003) {
      setLocalFeedback('Please write the word clearly before checking! ✏️');
      return;
    }

    setIsChecking(true);
    setLocalFeedback('Reading…');

    try {
      // Perform local character recognition via Tesseract.js
      const result = await Tesseract.recognize(canvas, 'eng');
      const text = result.data.text || '';
      
      const cleanOcr = text.toUpperCase().replace(/[^A-Z]/g, '');
      const cleanTarget = lesson.targetWord.toUpperCase().replace(/[^A-Z]/g, '');

      // Evaluate writing: exact match, substring match, or character overlap check
      let isCorrect = cleanOcr.includes(cleanTarget);
      
      if (!isCorrect && cleanOcr.length >= 2) {
        // Order-preserving character intersection count (handles minor line breaks/gaps in handdrawn letters)
        let targetIndex = 0;
        let matchCount = 0;
        for (let i = 0; i < cleanOcr.length; i++) {
          if (cleanOcr[i] === cleanTarget[targetIndex]) {
            matchCount++;
            targetIndex++;
            if (targetIndex >= cleanTarget.length) break;
          }
        }
        // If they drew at least (length - 1) letters in order, count it as a correct match
        if (matchCount >= Math.max(2, cleanTarget.length - 1)) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        onComplete();
      } else {
        const heardTextSnippet = cleanOcr 
          ? `Zibi scanned "${cleanOcr}"` 
          : `Zibi couldn't distinguish the letters`;
        setLocalFeedback(`${heardTextSnippet}. ${lesson.retryPrompt}`);
      }
    } catch (err) {
      console.error('Tesseract OCR failure:', err);
      // Fail-safe logic: Fallback to pixel validation if offline/browser resources crash
      if (inkRatio > 0.012) {
        onComplete();
      } else {
        setLocalFeedback(lesson.retryPrompt);
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.div className="mission-body" variants={stagger}>
      <motion.section className="writing-target-panel" variants={fadeUpFast}>
        <motion.div className="writing-word-display"
          animate={status === 'success' ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.5 }}>
          <motion.span className="writing-emoji" aria-hidden="true"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            {lesson.wordEmoji}
          </motion.span>
          <motion.h2 className="writing-target-word"
            animate={status === 'success' ? { scale: [1, 1.08, 1], color: ['#172033', '#8677ff', '#172033'] } : {}}
            transition={{ duration: 0.6 }}>
            {lesson.targetWord}
          </motion.h2>
        </motion.div>
        <p className="writing-description">{lesson.description}</p>
        <motion.p className="writing-instruction"
          animate={!hasInk && status !== 'success' ? { opacity: [1, 0.6, 1] } : {}}
          transition={{ duration: 2, repeat: status !== 'success' ? Infinity : 0 }}>
          Write <strong>{lesson.targetWord}</strong> on the canvas below ✏️
        </motion.p>
      </motion.section>

      <motion.div className="writing-canvas-wrap" variants={fadeUpFast}
        animate={status === 'success' ? { boxShadow: '6px 6px 0 #64db87', borderColor: '#64db87' } : {}}
        transition={{ duration: 0.3 }}>
        <canvas
          ref={canvasRef}
          width={620}
          height={200}
          className="writing-canvas"
          aria-label={`Drawing canvas — write the word ${lesson.targetWord}`}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <AnimatePresence>
          {!hasInk && status !== 'success' && !isChecking && (
            <motion.div className="canvas-placeholder" aria-hidden="true"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              ✏️ Draw here…
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {localFeedback && (
          <motion.p className={`writing-local-feedback ${isChecking ? 'is-checking' : ''}`}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
            {localFeedback}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div className="lesson-actions" variants={fadeUpFast}>
        <AnimatePresence>
          {status !== 'success' && (
            <motion.div key="actions" className="lesson-actions"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.button
                className="secondary-action"
                type="button"
                onClick={clearCanvas}
                disabled={isChecking}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
                Clear Canvas
              </motion.button>
              <motion.button
                className="primary-action"
                type="button"
                disabled={!hasInk || isChecking}
                onClick={handleCheck}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={springTap}>
                {isChecking ? 'Scanning...' : 'Check My Writing!'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
