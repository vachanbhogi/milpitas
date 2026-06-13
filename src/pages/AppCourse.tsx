import { MascotScene } from '../components/MascotScene';
import { PictureBadge } from '../components/PictureBadge';
import { playSynthesizedPhonics } from '../audioUtils';
import { 
  type Lesson, 
  type CourseModule, 
  type ModuleId, 
  type LessonStatus, 
  type PhonicsLesson, 
  type ChoiceLesson, 
  type SentenceLesson, 
  type VoiceSnapshot 
} from '../types';

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
  onOpenRewards,
  onRestart,
}: AppCourseProps) {
  const COURSE_MODULES = [
    {
      id: 'phonics' as ModuleId,
      title: 'Sound Safari',
      planet: 'Echo Planet',
      mission: 'Teach Zibi the Earth sounds that wake up words.',
      colorClass: 'yellow',
      lessons: [
        { id: 'sound-s', title: 'Star Air ⭐️' },
        { id: 'sound-m', title: 'Moon Hum 🌙' },
        { id: 'sound-a', title: 'Open Air 🐥' },
        { id: 'sound-t', title: 'Tap Button ⏰' },
        { id: 'sound-p', title: 'Pop Pod 🫧' },
        { id: 'word-sat', title: 'Ship Seat 🚀' },
        { id: 'word-mat', title: 'Landing Mat 🛬' },
        { id: 'word-pat', title: 'Repair Pat 👋' },
      ],
    },
    {
      id: 'letters' as ModuleId,
      title: 'Letter Lagoon',
      planet: 'Glow Letter Lagoon',
      colorClass: 'blue',
      mission: 'Match Earth sounds to big bright letters.',
      lessons: [
        { id: 'letter-s', title: 'Find S Sound 🐍' },
        { id: 'letter-m', title: 'Find M Sound 🌙' },
        { id: 'letter-p', title: 'Find P Sound 🪐' },
        { id: 'letter-match-a', title: 'Big and Little A 🍎' },
        { id: 'letter-match-s', title: 'Big and Little S ⭐️' },
      ],
    },
    {
      id: 'grammar' as ModuleId,
      title: 'Tiny Talk Town',
      planet: 'Sentence Town',
      colorClass: 'pink',
      mission: 'Help Zibi build tiny Earth ideas with pictures.',
      lessons: [
        { id: 'grammar-noun', title: 'Naming Noun 📦' },
        { id: 'grammar-action', title: 'Action Verb 🏃' },
        { id: 'grammar-sentence', title: 'First Message 🪐' },
        { id: 'grammar-sentence-2', title: 'Space Sight 🌙' },
      ],
    },
    {
      id: 'home-planet' as any,
      title: 'Mumble Home 🪐',
      planet: 'Mumble Home Planet',
      colorClass: 'violet',
      mission: 'Welcome home, Zibi! Planet reached.',
      lessons: [],
    },
  ];

  // Detect Zibi's current position
  const activePlanetIndex = COURSE_MODULES.slice(0, 3).findIndex(m => {
    const moduleDone = m.lessons.filter(l => completedLessons.has(l.id)).length;
    return moduleDone < m.lessons.length;
  });
  const currentActiveModuleId = activePlanetIndex !== -1 ? COURSE_MODULES[activePlanetIndex].id : 'home-planet';
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
        <h2>Constellation Orbit Trail</h2>
        <p className="path-subtitle">Navigate down the flight line to repair Zibi's rocket and fly home!</p>
        <div className="flight-path-container">
          <div className="flight-path-line" />
          
          {COURSE_MODULES.map((module, index) => {
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
                    🚀 <span className="indicator-tooltip">Zibi is here!</span>
                  </div>
                )}
                
                <div className={`path-planet-bubble color-${module.colorClass}`}>
                  <PictureBadge 
                    art={isHomePlanet ? 'planet' : module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : 'ship'} 
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
                            <span 
                              key={lesson.id} 
                              className={`path-dot ${completedLessons.has(lesson.id) ? 'is-complete' : ''}`} 
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
              art={lesson.moduleId === 'phonics' ? 'planet' : lesson.moduleId === 'letters' ? 'star' : 'ship'} 
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
            Stop And Check
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
