import { useEffect, useRef, useState } from 'react';
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
  isServerConnected,
  onOpenModule,
  onOpenLesson,
  onOpenRewards,
  onRestart,
}: AppCourseProps) {
  const courseNodes: PathNode[] = [...REAL_COURSE_MODULES, HOME_PLANET_NODE];

  // Detect Zibi's current position
  const activePlanetIndex = REAL_COURSE_MODULES.findIndex(m => {
    const moduleDone = m.lessons.filter(l => completedLessons.has(l.id)).length;
    return moduleDone < m.lessons.length;
  });
  const currentActiveModuleId = activePlanetIndex !== -1 ? REAL_COURSE_MODULES[activePlanetIndex].id : 'home-planet';
  const hasUnlockedHome = completedCount >= totalLessons;

  return (
    <main className="course-layout">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Interactive Learning Flight Path</p>
          <h1>Help Zibi get home.</h1>
          <p>
            Welcome to <strong>Mumble</strong>! Speak phonics sounds and guide Zibi
            along the stellar orbit pathway back to his Home Planet.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => onOpenModule('phonics')}>
              Start Orbit
            </button>
            <button className="secondary-action" type="button" onClick={onOpenRewards}>
              Rewards Path
            </button>
          </div>
        </div>

        <MascotScene 
          progress={shipProgress} 
          mood={allDone ? 'launch' : 'happy'} 
        />
      </section>

      <section className="status-strip" aria-label="course status">
        <div>
          <span>Ship repair</span>
          <strong>{shipProgress}%</strong>
        </div>
        <div>
          <span>Missions</span>
          <strong>{completedCount}/{totalLessons}</strong>
        </div>
        <div>
          <span>Whisper lab</span>
          <strong>{isServerConnected ? 'online' : 'offline'}</strong>
        </div>
      </section>

      {allDone && (
        <section className="launch-card">
          <div>
            <p className="eyebrow">Launch ready</p>
            <h2>Zibi can visit Earth again.</h2>
            <p>Every Scoin seed is glowing. Replay the course or jump into any planet.</p>
          </div>
          <button className="secondary-action" type="button" onClick={onRestart}>
            Play Again
          </button>
        </section>
      )}

      {/* Spacelike flight path constellation */}
      <section className="flight-path-section">
        <h2 className="orbit-heading">✦ Constellation Orbit Trail ✦</h2>
        <p className="path-subtitle">Follow the orbital trail to repair Zibi's ship and fly home!</p>
        <div className="flight-path-container">
          <svg className="flight-path-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
            <defs>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--yellow)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--yellow)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              className="flight-path-curve"
              d="M145 80 C480 120, 480 120, 655 180 C480 240, 480 240, 145 300 C480 360, 480 360, 655 420 C480 480, 480 480, 145 520"
              fill="none"
            />
            <circle cx="145" cy="80" r="18" fill="url(#nodeGlow)" opacity="0.5" />
            <circle cx="655" cy="180" r="18" fill="url(#nodeGlow)" opacity="0.5" />
            <circle cx="145" cy="300" r="18" fill="url(#nodeGlow)" opacity="0.5" />
            <circle cx="655" cy="420" r="18" fill="url(#nodeGlow)" opacity="0.5" />
            <circle cx="145" cy="520" r="18" fill="url(#nodeGlow)" opacity="0.5" />
          </svg>
          
          {courseNodes.map((module, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const isHomePlanet = module.id === 'home-planet';
            const isLocked = isHomePlanet && !hasUnlockedHome;
            const isCurrentActive = currentActiveModuleId === module.id;

            // Calculate progress percentage inside module
            const moduleDoneCount = !isHomePlanet ? module.lessons.filter(lesson => completedLessons.has(lesson.id)).length : 0;
            const totalInModule = !isHomePlanet ? module.lessons.length : 0;

            return (
              <div key={module.id} className={`path-node-wrap ${side} ${isCurrentActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}>
                {isCurrentActive && (
                  <div className="ship-avatar-indicator animate-float">
                    <div className="path-ship-wrap" aria-hidden="true">
                      <div className="path-ship">
                        <span className="path-ship-window" />
                        <span className="path-ship-fin left" />
                        <span className="path-ship-fin right" />
                        <span className="path-ship-flame" />
                      </div>
                    </div>
                    <span className="indicator-tooltip">Zibi is here!</span>
                  </div>
                )}
                
                <div className={`path-planet-bubble color-${module.colorClass}`}>
                  <PictureBadge 
                    art={isHomePlanet ? 'planet' : module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : module.id === 'writing' ? 'paint' : 'ship'} 
                    label={module.title} 
                  />
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
                            <button 
                              key={lesson.id} 
                              className={`path-dot ${completedLessons.has(lesson.id) ? 'is-complete' : ''}`}
                              type="button"
                              onClick={() => {
                                onOpenLesson(lesson);
                              }}
                              title={`Start lesson: ${lesson.title}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!isLocked && !isHomePlanet && (
                    <button className="primary-action start-planet-btn" onClick={() => onOpenModule(module.id)}>
                      Land!
                    </button>
                  )}
                  {isHomePlanet && !isLocked && (
                    <div className="home-victory-banner">🎉 VICTORY! ZIBI IS HOME! 🎉</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
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
    <main className="lesson-layout">
      <div className="lesson-grid">
        <section className={`lesson-card module-${activeModule.colorClass}`}>
          <div className="lesson-header">
            <button className="back-button" type="button" onClick={onBack}>
              Map
            </button>
            <div>
              <span>{activeModule.planet}</span>
              <strong>{currentModuleProgress}/{activeModule.lessons.length} complete</strong>
            </div>
          </div>

          <div className="mission-banner">
            <PictureBadge 
              art={lesson.moduleId === 'phonics' ? 'planet' : lesson.moduleId === 'letters' ? 'star' : lesson.moduleId === 'writing' ? 'paint' : 'ship'} 
              label={getLessonIcon(lesson.moduleId)} 
            />
            <div>
              <p className="eyebrow">Mission {activeLessonIndex + 1}</p>
              <h1>{lesson.title}</h1>
              <p>{lesson.storyPrompt}</p>
            </div>
          </div>

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

          {isComplete && (
            <div className="success-row">
              <div>
                <span className="seed-icon" aria-hidden="true" />
                <strong>{lesson.rewardName} (+1 Scoin Seed!)</strong>
              </div>
              <button className="primary-action" type="button" onClick={onNext}>
                Next Mission
              </button>
            </div>
          )}
        </section>

        <section className="mascot-side-panel">
          <div className="mascot-panel-header">
            <h2>Zibi's Cabin</h2>
            <p className="cabin-status">
              {status === 'recording' ? 'Listening...' : status === 'checking' ? 'Translating...' : isComplete ? 'Success!' : 'Ready'}
            </p>
          </div>
          <MascotScene 
            progress={shipProgress} 
            mood={mascotMood} 
          />
        </section>
      </div>
    </main>
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
    <div className="mission-body">
      <section 
        className="sound-stage clickable-sound-stage" 
        aria-label="speech mission"
        onClick={() => playSynthesizedPhonics(lesson.targetText)}
        style={{ cursor: 'pointer' }}
      >
        <div className="target-label">Teach Zibi (Tap to Hear) 🔊</div>
        <h2>{lesson.displayText}</h2>
        <div className="phonics-row" aria-label="sound parts">
          {lesson.phonicsParts.map(part => (
            <span 
              key={part}
              onClick={(e) => {
                e.stopPropagation();
                playSynthesizedPhonics(part);
              }}
              style={{ cursor: 'pointer' }}
            >
              {part}
            </span>
          ))}
        </div>
        <p>{lesson.coachPrompt}</p>
      </section>

      <section className={`translator-panel ${isListening ? 'is-listening' : ''}`}>
        <div className="translator-topline">
          <div>
            <span className="live-dot" aria-hidden="true" />
            <strong>{isListening ? getSoundLabel(soundClass) : 'translator ready'}</strong>
          </div>
          <span className={isServerConnected ? 'server-pill online' : 'server-pill'}>
            {isServerConnected ? 'Whisper online' : 'Whisper offline'}
          </span>
        </div>
        <div className="meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${meterScale})` }} />
        </div>
        <p>{feedbackText}</p>
        <div className="voice-readout" aria-label="voice readout">
          <span>Best sound: {getSoundLabel(bestVoice.soundClass)}</span>
          <span>Live confidence: {Math.round(confidence * 100)}%</span>
          {heardText && <span>Whisper heard: {heardText}</span>}
        </div>
      </section>

      {!isSupported && (
        <p className="system-note">This browser cannot use the microphone. Try Chrome, Edge, or Safari on localhost.</p>
      )}

      {!isServerConnected && lesson.kind === 'word' && (
        <p className="system-note">
          Word checks need the local Whisper server. Run bun run whisper:server before this mission.
        </p>
      )}

      <div className="lesson-actions">
        {status !== 'recording' && status !== 'checking' && (
          <button className="primary-action" type="button" disabled={!isSupported} onClick={onStartRecording}>
            Start Speaking
          </button>
        )}
        {status === 'recording' && (
          <button className="primary-action stop-action" type="button" onClick={onStopRecording}>
            Check My Sound
          </button>
        )}
        {status === 'checking' && (
          <button className="primary-action" type="button" disabled>
            Checking
          </button>
        )}
      </div>
    </div>
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
    <div className="mission-body">
      <section className="prompt-panel">
        <span>{lesson.type === 'letter-choice' ? 'Letter game' : 'Tiny grammar'}</span>
        <h2>{lesson.prompt}</h2>
        <p>{feedbackText}</p>
      </section>

      <div className="choice-grid">
        {lesson.choices.map(choice => {
          const isSelected = selectedChoiceId === choice.id;
          const isCorrect = choice.id === lesson.correctChoiceId;
          return (
            <button
              className={`choice-card ${isSelected ? 'is-selected' : ''} ${status === 'success' && isCorrect ? 'is-correct' : ''}`}
              type="button"
              key={choice.id}
              onClick={() => onChoice(choice.id)}
            >
              <PictureBadge art={choice.art} label={choice.helper} />
              <strong>{choice.label}</strong>
              <span>{choice.helper}</span>
            </button>
          );
        })}
      </div>
    </div>
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
    <div className="mission-body">
      <section className="prompt-panel">
        <span>Sentence builder</span>
        <h2>{lesson.prompt}</h2>
        <p>{feedbackText}</p>
      </section>

      <div className="sentence-builder">
        <div className="sentence-slots" aria-label="selected words">
          {lesson.correctSequence.map((_, index) => (
            <span key={index}>{selectedTiles[index] ?? ''}</span>
          ))}
        </div>

        <div className="tile-grid">
          {lesson.tiles.map(tile => (
            <button
              key={tile}
              className={selectedTiles.includes(tile) ? 'is-used' : ''}
              type="button"
              onClick={() => onTile(tile)}
            >
              {tile}
            </button>
          ))}
        </div>

        {status !== 'success' && (
          <button className="secondary-action clear-action" type="button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
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
    <div className="mission-body">
      <section className="writing-target-panel">
        <div className="writing-word-display">
          <span className="writing-emoji" aria-hidden="true">{lesson.wordEmoji}</span>
          <h2 className="writing-target-word">{lesson.targetWord}</h2>
        </div>
        <p className="writing-description">{lesson.description}</p>
        <p className="writing-instruction">
          Write <strong>{lesson.targetWord}</strong> on the canvas below ✏️
        </p>
      </section>

      <div className="writing-canvas-wrap">
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
        {!hasInk && status !== 'success' && !isChecking && (
          <div className="canvas-placeholder" aria-hidden="true">✏️ Draw here…</div>
        )}
      </div>

      {localFeedback && (
        <p className={`writing-local-feedback ${isChecking ? 'is-checking' : ''}`}>{localFeedback}</p>
      )}

      <div className="lesson-actions">
        {status !== 'success' && (
          <>
            <button 
              className="secondary-action" 
              type="button" 
              onClick={clearCanvas}
              disabled={isChecking}
            >
              Clear Canvas
            </button>
            <button
              className="primary-action"
              type="button"
              disabled={!hasInk || isChecking}
              onClick={handleCheck}
            >
              {isChecking ? 'Scanning...' : 'Check My Writing!'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
