import { useEffect, useMemo, useRef, useState } from 'react';
import { CourseMap } from './components/CourseMap';
import { LessonScreen } from './components/LessonScreen';
import { PitchPage } from './components/PitchPage';
import { RewardsScreen } from './components/RewardsScreen';
import { COURSE_MODULES, type Lesson, type ModuleId, type PhonicsLesson, type View, type VoiceSnapshot } from './course';
import { isChoiceLesson, isPhonicsLesson, isSentenceLesson } from './course/lessonGuards';
import { useLiveVoiceAnalyzer } from './hooks/useLiveVoiceAnalyzer';
import { useMicrophone } from './hooks/useMicrophone';
import { cleanSpeech, getSoundLabel, playSoundEffect } from './utils/sound';
import './App.css';

const EMPTY_VOICE: VoiceSnapshot = {
  soundClass: 'quiet',
  confidence: 0,
  energy: 0,
  score: 0,
};

function App() {
  const firstModule = COURSE_MODULES[0];
  const firstLesson = firstModule.lessons[0];

  const [view, setView] = useState<View>('course');
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>(firstModule.id);
  const [activeLessonId, setActiveLessonId] = useState<string>(firstLesson.id);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => new Set());
  const [lessonStatus, setLessonStatus] = useState<'idle' | 'recording' | 'checking' | 'success' | 'retry' | 'error'>('idle');
  const [feedbackText, setFeedbackText] = useState<string>('Choose a mission to help Zibi.');
  const [heardText, setHeardText] = useState<string>('');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [isServerConnected, setIsServerConnected] = useState<boolean | null>(null);
  const [bestVoice, setBestVoice] = useState<VoiceSnapshot>(EMPTY_VOICE);

  const bestVoiceRef = useRef<VoiceSnapshot>(EMPTY_VOICE);

  const { isListening, isSupported, error: micError, startRecording, stopRecording, setOnChunk } = useMicrophone();
  const { soundClass, energy, confidence, analyze, reset } = useLiveVoiceAnalyzer();

  const allLessons = useMemo(() => COURSE_MODULES.flatMap(module => module.lessons), []);
  const activeModule = COURSE_MODULES.find(module => module.id === activeModuleId) ?? firstModule;
  const activeLesson = allLessons.find(lesson => lesson.id === activeLessonId) ?? firstLesson;
  const activeLessonIndex = activeModule.lessons.findIndex(lesson => lesson.id === activeLesson.id);
  const nextLesson = activeModule.lessons[activeLessonIndex + 1] ?? null;
  const completedCount = completedLessons.size;
  const totalLessons = allLessons.length;
  const starSeeds = completedCount * 5;
  const shipProgress = Math.round((completedCount / totalLessons) * 100);
  const allDone = completedCount === totalLessons;
  const currentModuleProgress = activeModule.lessons.filter(lesson => completedLessons.has(lesson.id)).length;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [view, activeLessonId]);

  useEffect(() => {
    if (isListening) {
      setOnChunk((chunk) => {
        const result = analyze(chunk);
        const nextScore = result.confidence * Math.max(result.energy, 0.02);
        if (result.soundClass !== 'quiet' && nextScore > bestVoiceRef.current.score) {
          const snapshot = {
            soundClass: result.soundClass,
            confidence: result.confidence,
            energy: result.energy,
            score: nextScore,
          };
          bestVoiceRef.current = snapshot;
          setBestVoice(snapshot);
        }
      });
    } else {
      setOnChunk(null);
      reset();
    }

    return () => setOnChunk(null);
  }, [isListening, setOnChunk, analyze, reset]);

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const controller = new AbortController();
        const id = window.setTimeout(() => controller.abort(), 1200);
        const response = await fetch('http://127.0.0.1:8080/inference', {
          method: 'OPTIONS',
          signal: controller.signal,
        });
        window.clearTimeout(id);
        setIsServerConnected(response.ok || [400, 404, 405].includes(response.status));
      } catch {
        setIsServerConnected(false);
      }
    };

    checkServerConnection().catch(() => {});
    const interval = window.setInterval(() => {
      checkServerConnection().catch(() => {});
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const markLessonComplete = (lesson: Lesson) => {
    setCompletedLessons(prev => {
      if (prev.has(lesson.id)) return prev;
      const next = new Set(prev);
      next.add(lesson.id);
      return next;
    });
  };

  const resetLessonInteraction = (lesson: Lesson, complete = completedLessons.has(lesson.id)) => {
    setSelectedChoiceId(null);
    setSelectedTiles([]);
    setHeardText('');
    bestVoiceRef.current = EMPTY_VOICE;
    setBestVoice(EMPTY_VOICE);

    if (complete) {
      setLessonStatus('success');
      setFeedbackText('Mission complete. Zibi saved this star seed.');
      return;
    }

    setLessonStatus('idle');
    setFeedbackText(isPhonicsLesson(lesson) ? lesson.coachPrompt : lesson.storyPrompt);
  };

  const openModule = (moduleId: ModuleId) => {
    const module = COURSE_MODULES.find(item => item.id === moduleId) ?? firstModule;
    const firstOpenLesson = module.lessons.find(lesson => !completedLessons.has(lesson.id)) ?? module.lessons[0];
    setActiveModuleId(module.id);
    setActiveLessonId(firstOpenLesson.id);
    resetLessonInteraction(firstOpenLesson);
    setView('lesson');
  };

  const goToLesson = (lesson: Lesson) => {
    setActiveModuleId(lesson.moduleId);
    setActiveLessonId(lesson.id);
    resetLessonInteraction(lesson);
    setView('lesson');
  };

  const goNext = () => {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
      resetLessonInteraction(nextLesson);
      return;
    }
    setView('course');
  };

  const restartCourse = () => {
    setCompletedLessons(new Set());
    setActiveModuleId(firstModule.id);
    setActiveLessonId(firstLesson.id);
    resetLessonInteraction(firstLesson, false);
    setView('course');
  };

  const handleStartRecording = async () => {
    if (!isPhonicsLesson(activeLesson)) return;
    setHeardText('');
    setLessonStatus('recording');
    setFeedbackText('Zibi is listening. Say the sound out loud.');
    bestVoiceRef.current = EMPTY_VOICE;
    setBestVoice(EMPTY_VOICE);
    const started = await startRecording();
    if (!started) {
      setLessonStatus('error');
      setFeedbackText('Zibi needs microphone permission to hear Earth sounds.');
      playSoundEffect('fail');
    }
  };

  const gradePhonics = (lesson: PhonicsLesson, transcript: string) => {
    const cleanTranscript = cleanSpeech(transcript);
    const transcriptSuccess = lesson.successMatches.some(match => {
      const cleanMatch = cleanSpeech(match);
      if (lesson.kind === 'sound') return cleanTranscript.includes(cleanMatch);
      return cleanTranscript === cleanMatch || cleanTranscript.includes(cleanMatch);
    });

    const voiceSuccess = lesson.kind === 'sound'
      && !!lesson.expectedSoundClass
      && bestVoiceRef.current.soundClass === lesson.expectedSoundClass
      && bestVoiceRef.current.score > 0.015;

    return transcriptSuccess || voiceSuccess;
  };

  const checkWithWhisper = async (samples: Float32Array) => {
    const { encodeFloat32ArrayToWav } = await import('./audioUtils');
    const wavArrayBuffer = encodeFloat32ArrayToWav(samples);
    const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', wavBlob, 'earthlingo.wav');
    formData.append('response_format', 'json');

    const response = await fetch('http://127.0.0.1:8080/inference', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper returned ${response.status}`);
    }

    const data = await response.json();
    return String(data.text || data.result || '').trim();
  };

  const handleStopRecording = async () => {
    if (!isPhonicsLesson(activeLesson)) return;
    setLessonStatus('checking');
    setFeedbackText('Zibi is checking the translator.');

    const samples = await stopRecording();
    if (micError) {
      setLessonStatus('error');
      setFeedbackText(`Microphone error: ${micError}`);
      playSoundEffect('fail');
      return;
    }

    if (!samples || samples.length === 0) {
      setLessonStatus('error');
      setFeedbackText("Zibi could not hear anything. Try once more.");
      playSoundEffect('fail');
      return;
    }

    const minimumSamples = activeLesson.kind === 'word' ? 5000 : 1800;
    if (samples.length < minimumSamples) {
      setLessonStatus('retry');
      setFeedbackText('That was very quick. Hold the sound a little longer.');
      playSoundEffect('fail');
      return;
    }

    let transcript = '';
    let whisperFailed = false;

    if (isServerConnected) {
      try {
        transcript = await checkWithWhisper(samples);
        setHeardText(transcript || getSoundLabel(bestVoiceRef.current.soundClass));
      } catch {
        whisperFailed = true;
        setIsServerConnected(false);
      }
    }

    if ((!isServerConnected || whisperFailed) && activeLesson.kind === 'word') {
      setLessonStatus('error');
      setFeedbackText('Whisper is offline. Start the local server to check Earth words.');
      playSoundEffect('fail');
      return;
    }

    const success = gradePhonics(activeLesson, transcript);
    if (success) {
      markLessonComplete(activeLesson);
      setLessonStatus('success');
      setFeedbackText(`Yes. Zibi learned ${activeLesson.displayText}.`);
      playSoundEffect('success');
    } else {
      setLessonStatus('retry');
      setFeedbackText(transcript ? `Zibi heard "${transcript}". ${activeLesson.retryPrompt}` : activeLesson.retryPrompt);
      playSoundEffect('fail');
    }
  };

  const handleChoice = (choiceId: string) => {
    if (!isChoiceLesson(activeLesson) || lessonStatus === 'success') return;
    setSelectedChoiceId(choiceId);

    if (choiceId === activeLesson.correctChoiceId) {
      markLessonComplete(activeLesson);
      setLessonStatus('success');
      setFeedbackText(activeLesson.successPrompt);
      playSoundEffect('success');
    } else {
      setLessonStatus('retry');
      setFeedbackText(activeLesson.retryPrompt);
      playSoundEffect('fail');
    }
  };

  const handleTile = (tile: string) => {
    if (!isSentenceLesson(activeLesson) || lessonStatus === 'success') return;
    if (selectedTiles.includes(tile)) return;

    const nextTiles = [...selectedTiles, tile];
    setSelectedTiles(nextTiles);

    const partialIsValid = nextTiles.every((item, index) => item === activeLesson.correctSequence[index]);
    if (!partialIsValid) {
      setLessonStatus('retry');
      setFeedbackText(activeLesson.retryPrompt);
      playSoundEffect('fail');
      window.setTimeout(() => {
        setSelectedTiles([]);
        setLessonStatus('idle');
        setFeedbackText(activeLesson.storyPrompt);
      }, 900);
      return;
    }

    if (nextTiles.length === activeLesson.correctSequence.length) {
      markLessonComplete(activeLesson);
      setLessonStatus('success');
      setFeedbackText(activeLesson.successPrompt);
      playSoundEffect('success');
      return;
    }

    setLessonStatus('idle');
    setFeedbackText('Good start. Add the next word.');
  };

  const clearSentence = () => {
    if (!isSentenceLesson(activeLesson)) return;
    setSelectedTiles([]);
    setLessonStatus('idle');
    setFeedbackText(activeLesson.storyPrompt);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => setView('course')}>
          <span className="brand-mark" aria-hidden="true">E</span>
          <span>
            <strong>Earthlingo</strong>
            <small>Zibi learns Earth</small>
          </span>
        </button>

        <nav className="top-nav" aria-label="main navigation">
          <button className={view === 'course' ? 'is-active' : ''} type="button" onClick={() => setView('course')}>
            Course
          </button>
          <button className={view === 'rewards' ? 'is-active' : ''} type="button" onClick={() => setView('rewards')}>
            Rewards
          </button>
          <button className={view === 'pitch' ? 'is-active' : ''} type="button" onClick={() => setView('pitch')}>
            Pitch
          </button>
        </nav>

        <div className="star-counter" aria-label={`${starSeeds} star seeds`}>
          <span aria-hidden="true" />
          <strong>{starSeeds}</strong>
        </div>
      </header>

      {view === 'course' && (
        <CourseMap
          completedLessons={completedLessons}
          completedCount={completedCount}
          totalLessons={totalLessons}
          shipProgress={shipProgress}
          allDone={allDone}
          isServerConnected={isServerConnected}
          onOpenModule={openModule}
          onOpenLesson={goToLesson}
          onOpenRewards={() => setView('rewards')}
          onRestart={restartCourse}
        />
      )}

      {view === 'lesson' && (
        <LessonScreen
          lesson={activeLesson}
          activeModule={activeModule}
          currentModuleProgress={currentModuleProgress}
          activeLessonIndex={activeLessonIndex}
          completedLessons={completedLessons}
          status={lessonStatus}
          feedbackText={feedbackText}
          heardText={heardText}
          isSupported={isSupported}
          isListening={isListening}
          isServerConnected={isServerConnected}
          soundClass={soundClass}
          energy={energy}
          confidence={confidence}
          bestVoice={bestVoice}
          selectedChoiceId={selectedChoiceId}
          selectedTiles={selectedTiles}
          onBack={() => setView('course')}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onChoice={handleChoice}
          onTile={handleTile}
          onClearSentence={clearSentence}
          onNext={goNext}
        />
      )}

      {view === 'rewards' && (
        <RewardsScreen
          completedCount={completedCount}
          totalLessons={totalLessons}
          starSeeds={starSeeds}
          shipProgress={shipProgress}
          completedLessons={completedLessons}
          onOpenModule={openModule}
          onRestart={restartCourse}
        />
      )}

      {view === 'pitch' && (
        <PitchPage
          isServerConnected={isServerConnected}
          onOpenApp={() => setView('course')}
        />
      )}
    </div>
  );
}

export default App;
