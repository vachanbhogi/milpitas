import type { SoundClass } from '../hooks/useLiveVoiceAnalyzer';
import type {
  ChoiceLesson,
  CourseModule,
  Lesson,
  LessonStatus,
  PhonicsLesson,
  SentenceLesson,
  VoiceSnapshot,
} from '../course';
import { isChoiceLesson, isPhonicsLesson, isSentenceLesson } from '../course/lessonGuards';
import { getSoundLabel } from '../utils/sound';
import { PictureBadge } from './PictureBadge';

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
  soundClass: SoundClass;
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

export function LessonScreen({
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

  return (
    <main className="lesson-layout">
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
          <PictureBadge art={lesson.moduleId === 'phonics' ? 'planet' : lesson.moduleId === 'letters' ? 'star' : 'ship'} label={getLessonIcon(lesson.moduleId)} />
          <div>
            <p className="eyebrow">Mission {activeLessonIndex + 1}</p>
            <h1>{lesson.title}</h1>
            <p>{lesson.storyPrompt}</p>
          </div>
        </div>

        {isPhonicsLesson(lesson) && (
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

        {isChoiceLesson(lesson) && (
          <ChoiceMission
            lesson={lesson}
            status={status}
            feedbackText={feedbackText}
            selectedChoiceId={selectedChoiceId}
            onChoice={onChoice}
          />
        )}

        {isSentenceLesson(lesson) && (
          <SentenceMission
            lesson={lesson}
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
              <strong>{lesson.rewardName}</strong>
            </div>
            <button className="primary-action" type="button" onClick={onNext}>
              Next Mission
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

interface PhonicsMissionProps {
  lesson: PhonicsLesson;
  status: LessonStatus;
  feedbackText: string;
  heardText: string;
  isSupported: boolean;
  isListening: boolean;
  isServerConnected: boolean | null;
  soundClass: SoundClass;
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
  return (
    <div className="mission-body">
      <section className="sound-stage" aria-label="speech mission">
        <div className="target-label">Teach Zibi</div>
        <h2>{lesson.displayText}</h2>
        <div className="phonics-row" aria-label="sound parts">
          {lesson.phonicsParts.map(part => (
            <span key={part}>{part}</span>
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

function getLessonIcon(moduleId: string) {
  if (moduleId === 'phonics') return 'sound rings';
  if (moduleId === 'letters') return 'letter lights';
  return 'word blocks';
}
