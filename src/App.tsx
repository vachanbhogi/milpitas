import { useEffect, useMemo, useRef, useState } from 'react';
import { useMicrophone } from './hooks/useMicrophone';
import { useLiveVoiceAnalyzer } from './hooks/useLiveVoiceAnalyzer';
import { playSynthesizedPhonics, speakText } from './audioUtils';
import { COURSE_MODULES } from './course/courseModules';
import { scoreWordAttempt } from './soundSafari/scoring';
import { transcribeAttempt, type TranscriptionSource } from './soundSafari/transcribeAttempt';
import { checkWhisperHealth } from './soundSafari/whisperClient';
import { useSpeechRecognition } from './soundSafari/useSpeechRecognition';
import './App.css';

// Page and Component Imports
import { 
  type View, 
  type ModuleId, 
  type LessonStatus, 
  type Lesson, 
  type VoiceSnapshot,
  type PhonicsLesson,
  type ChoiceLesson,
  type SentenceLesson,
  type WritingLesson
} from './types';
import { Home } from './pages/Home';
import { AppCourse } from './pages/AppCourse';
import { Rewards } from './pages/Rewards';
import { ZibiIcon } from './components/ZibiIcon';

const EMPTY_VOICE: VoiceSnapshot = {
  soundClass: 'quiet',
  confidence: 0,
  energy: 0,
  score: 0,
};

function playSoundEffect(type: 'success' | 'fail') {
  try {
    const AudioContextCtor = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.36);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(146.83, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    }
  } catch {
    // Audio feedback is optional
  }
}

function isPhonicsLesson(lesson: Lesson): lesson is PhonicsLesson {
  return lesson.type === 'phonics';
}

function isChoiceLesson(lesson: Lesson): lesson is ChoiceLesson {
  return lesson.type === 'letter-choice' || lesson.type === 'grammar-choice';
}

function isSentenceLesson(lesson: Lesson): lesson is SentenceLesson {
  return lesson.type === 'sentence-build';
}

function isWritingLesson(lesson: Lesson): lesson is WritingLesson {
  return lesson.type === 'writing';
}

function App() {
  const [view, setView] = useState<View>('home');
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>('phonics');
  const [activeLessonId, setActiveLessonId] = useState<string>(COURSE_MODULES[0].lessons[0].id);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => new Set());
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('idle');
  const [feedbackText, setFeedbackText] = useState<string>('Choose a mission to help Zibi.');
  const [heardText, setHeardText] = useState<string>('');
  const [heardSource, setHeardSource] = useState<TranscriptionSource>('none');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [isServerConnected, setIsServerConnected] = useState<boolean | null>(null);
  const [bestVoice, setBestVoice] = useState<VoiceSnapshot>(EMPTY_VOICE);
  const [sparkles, setSparkles] = useState<{ id: number; color: string; shape: 'circle' | 'square' | 'star'; x: number; y: number; scale: number }[]>([]);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);

  const [glowCoins, setGlowCoins] = useState<number>(() => {
    const saved = localStorage.getItem('glowCoins');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [purchasedItems, setPurchasedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('purchasedItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [equippedItem, setEquippedItem] = useState<string | null>(() => {
    return localStorage.getItem('equippedItem') || null;
  });

  const bestVoiceRef = useRef<VoiceSnapshot>(EMPTY_VOICE);

  const { isListening, isSupported, error: micError, startRecording, stopRecording, setOnChunk } = useMicrophone();
  const { soundClass, energy, confidence, analyze, reset } = useLiveVoiceAnalyzer();
  const { startRecognition, stopRecognition, getTranscript, resetTranscript } = useSpeechRecognition();

  const allLessons = useMemo(() => COURSE_MODULES.flatMap(module => module.lessons), []);
  const activeModule = COURSE_MODULES.find(module => module.id === activeModuleId) ?? COURSE_MODULES[0];
  const activeLesson = allLessons.find(lesson => lesson.id === activeLessonId) ?? COURSE_MODULES[0].lessons[0];
  const activeLessonIndex = activeModule.lessons.findIndex(lesson => lesson.id === activeLesson.id);
  const nextLesson = activeModule.lessons[activeLessonIndex + 1] ?? null;
  const completedCount = completedLessons.size;
  const totalLessons = allLessons.length;
  const shipProgress = Math.round((completedCount / totalLessons) * 100);
  const allDone = completedCount === totalLessons;
  const currentModuleProgress = activeModule.lessons.filter(lesson => completedLessons.has(lesson.id)).length;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [view, activeLessonId]);

  useEffect(() => {
    setOnChunk((chunk) => {
      const result = analyze(chunk);
      const score = result.energy * result.confidence;
      const snapshot: VoiceSnapshot = {
        soundClass: result.soundClass,
        confidence: result.confidence,
        energy: result.energy,
        score: score,
      };
      if (snapshot.score > bestVoiceRef.current.score) {
        bestVoiceRef.current = snapshot;
        setBestVoice(snapshot);
      }
    });
    return () => setOnChunk(null);
  }, [setOnChunk, analyze]);

  useEffect(() => {
    checkWhisperHealth().then(setIsServerConnected);
  }, [activeLessonId]);

  useEffect(() => {
    if (feedbackText) {
      speakText(feedbackText);
    }
  }, [feedbackText]);

  const triggerExplosion = () => {
    const colors = ['var(--yellow)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--blue)', 'var(--pink)'];
    const shapes = ['circle', 'square', 'star'] as const;
    const newSparkles = Array.from({ length: 25 }).map(() => ({
      id: Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      scale: Math.random() * 0.8 + 0.6,
    }));
    setSparkles(newSparkles);
    setTimeout(() => {
      setSparkles([]);
    }, 1200);
  };

  const markLessonComplete = (lesson: Lesson) => {
    setCompletedLessons(prev => {
      if (prev.has(lesson.id)) return prev;
      const next = new Set(prev);
      next.add(lesson.id);
      // Award 10 Glow Coins
      setGlowCoins(coins => {
        const nextCoins = coins + 10;
        localStorage.setItem('glowCoins', nextCoins.toString());
        return nextCoins;
      });
      return next;
    });
  };

  const markLessonIncomplete = (lesson: Lesson) => {
    setCompletedLessons(prev => {
      if (!prev.has(lesson.id)) return prev;
      const next = new Set(prev);
      next.delete(lesson.id);
      return next;
    });
  };

  const resetLessonInteraction = (lesson: Lesson, complete = completedLessons.has(lesson.id)) => {
    bestVoiceRef.current = EMPTY_VOICE;
    setBestVoice(EMPTY_VOICE);
    setHeardText('');
    setHeardSource('none');
    setSelectedChoiceId(null);
    setSelectedTiles([]);
    setIsFirstAttempt(true);
    reset();

    if (complete) {
      setLessonStatus('success');
      setFeedbackText(isPhonicsLesson(lesson) ? `Zibi learned ${lesson.displayText}.` : 'Lesson complete.');
    } else {
      setLessonStatus('idle');
      if (isPhonicsLesson(lesson)) {
        setFeedbackText(lesson.storyPrompt);
      } else if (isWritingLesson(lesson)) {
        setFeedbackText(lesson.storyPrompt);
      } else {
        setFeedbackText((lesson as ChoiceLesson | SentenceLesson).prompt);
      }
    }
  };

  const openModule = (moduleId: ModuleId) => {
    setActiveModuleId(moduleId);
    const targetModule = COURSE_MODULES.find(m => m.id === moduleId) ?? COURSE_MODULES[0];
    const firstOpenLesson = targetModule.lessons.find(lesson => !completedLessons.has(lesson.id)) ?? targetModule.lessons[0];
    setActiveLessonId(firstOpenLesson.id);
    resetLessonInteraction(firstOpenLesson);
    setView('lesson');
  };

  const goToLesson = (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
    setActiveModuleId(lesson.moduleId);
    resetLessonInteraction(lesson);
    setView('lesson');
  };

  const restartCourse = () => {
    setCompletedLessons(new Set());
    setActiveLessonId(COURSE_MODULES[0].lessons[0].id);
    resetLessonInteraction(COURSE_MODULES[0].lessons[0], false);
    setGlowCoins(0);
    setPurchasedItems([]);
    setEquippedItem(null);
    localStorage.setItem('glowCoins', '0');
    localStorage.setItem('purchasedItems', '[]');
    localStorage.setItem('equippedItem', '');
    setView('course');
  };

  const handleBuyItem = (itemId: string, cost: number) => {
    if (glowCoins >= cost) {
      setGlowCoins(prev => {
        const next = prev - cost;
        localStorage.setItem('glowCoins', next.toString());
        return next;
      });
      setPurchasedItems(prev => {
        const next = [...prev, itemId];
        localStorage.setItem('purchasedItems', JSON.stringify(next));
        return next;
      });
      setEquippedItem(itemId);
      localStorage.setItem('equippedItem', itemId);
    }
  };

  const handleEquipItem = (itemId: string | null) => {
    setEquippedItem(itemId);
    localStorage.setItem('equippedItem', itemId || '');
  };

  const handleStartRecording = async () => {
    bestVoiceRef.current = EMPTY_VOICE;
    setBestVoice(EMPTY_VOICE);
    setHeardText('');
    setHeardSource('none');
    resetTranscript();
    reset();

    startRecognition();

    const started = await startRecording();
    if (started) {
      setLessonStatus('recording');
      setFeedbackText('Speak now... Zibi is listening!');
    } else {
      setLessonStatus('error');
      setFeedbackText('Could not access microphone.');
    }
  };

  const handleStopRecording = async () => {
    if (!isPhonicsLesson(activeLesson)) return;
    setLessonStatus('checking');
    setFeedbackText('Zibi is checking the translator...');

    stopRecognition();

    const samples = await stopRecording();
    if (micError) {
      setLessonStatus('error');
      setFeedbackText(`Microphone error: ${micError}`);
      playSoundEffect('fail');
      return;
    }

    if (!samples || samples.length === 0) {
      setLessonStatus('retry');
      setFeedbackText("Zibi could not hear anything. Try once more.");
      playSoundEffect('fail');
      return;
    }

    const { transcript, source } = await transcribeAttempt({
      samples,
      getBrowserTranscript: getTranscript,
      isServerConnected: isServerConnected === true,
      targetText: activeLesson.targetText,
    });

    console.log(
      `[Sound Safari] expected: "${activeLesson.targetText}" | heard: "${transcript}" | source: ${source}`
    );

    setHeardText(transcript);
    setHeardSource(source);

    if (!transcript) {
      markLessonIncomplete(activeLesson);
      setLessonStatus('retry');
      setFeedbackText(
        isServerConnected
          ? `Try saying "${activeLesson.targetText}" clearly. ${activeLesson.retryPrompt}`
          : `Whisper lab offline. Start the local Whisper server, or try speaking clearly using browser speech recognition. ${activeLesson.retryPrompt}`,
      );
      playSoundEffect('fail');
      return;
    }

    const result = scoreWordAttempt(activeLesson, transcript);
    if (result.success) {
      markLessonComplete(activeLesson);
      setLessonStatus('success');
      setFeedbackText(result.message);
      playSoundEffect('success');
      triggerExplosion();
      if (isFirstAttempt) {
        // Auto-advance after showing the success celebration.
        setTimeout(() => {
          if (nextLesson) {
            goToLesson(nextLesson);
          } else {
            setView('course');
          }
        }, 1500);
      }
    } else {
      markLessonIncomplete(activeLesson);
      setIsFirstAttempt(false);
      setLessonStatus('retry');
      setFeedbackText(result.message);
      playSoundEffect('fail');
    }
  };


  const handleChoice = (choiceId: string) => {
    if (!isChoiceLesson(activeLesson) || lessonStatus === 'success') return;
    setSelectedChoiceId(choiceId);
    playSynthesizedPhonics(choiceId);

    if (choiceId === activeLesson.correctChoiceId) {
      markLessonComplete(activeLesson);
      setLessonStatus('success');
      setFeedbackText(activeLesson.successPrompt);
      playSoundEffect('success');
      triggerExplosion();
    } else {
      setLessonStatus('retry');
      setFeedbackText(activeLesson.retryPrompt);
      playSoundEffect('fail');
    }
  };

  const handleTile = (tile: string) => {
    if (!isSentenceLesson(activeLesson) || lessonStatus === 'success') return;
    if (selectedTiles.includes(tile)) return;

    playSynthesizedPhonics(tile);

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
      triggerExplosion();
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

  const handleCompleteWriting = () => {
    if (!isWritingLesson(activeLesson) || lessonStatus === 'success') return;
    markLessonComplete(activeLesson);
    setLessonStatus('success');
    setFeedbackText(activeLesson.successPrompt);
    playSoundEffect('success');
    triggerExplosion();
  };

  const goNext = () => {
    if (nextLesson) {
      goToLesson(nextLesson);
    } else {
      setView('course');
    }
  };
  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => setView('home')}>
          <span className="brand-mark" aria-hidden="true" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <ZibiIcon size={48} equippedItem={equippedItem} />
          </span>
          <span>
            <strong>Mumble</strong>
            <small>Zibi's Orbit Journey</small>
          </span>
        </button>

        <nav className="top-nav" aria-label="main navigation">
          <button className={view === 'home' ? 'is-active' : ''} type="button" onClick={() => setView('home')}>
            Home
          </button>
          <button className={view === 'course' || view === 'lesson' ? 'is-active' : ''} type="button" onClick={() => setView('course')}>
            Course
          </button>
          <button className={view === 'rewards' ? 'is-active' : ''} type="button" onClick={() => setView('rewards')}>
            Rewards
          </button>
        </nav>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="star-counter" aria-label={`${completedCount} Scoin Seeds`}>
            <span aria-hidden="true" />
            <strong>{completedCount} Seeds</strong>
          </div>
          <div className="coin-counter" aria-label={`${glowCoins} Glow Coins`}>
            <span className="coin-icon" aria-hidden="true" />
            <strong>{glowCoins} Coins</strong>
          </div>
        </div>
      </header>

      {view === 'home' && (
        <Home 
          isServerConnected={isServerConnected} 
          onOpenApp={() => setView('course')} 
          equippedItem={equippedItem}
        />
      )}

      {(view === 'course' || view === 'lesson') && (
        <AppCourse
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
          viewingLesson={view === 'lesson'}
          lesson={activeLesson}
          activeModule={activeModule}
          currentModuleProgress={currentModuleProgress}
          activeLessonIndex={activeLessonIndex}
          status={lessonStatus}
          feedbackText={feedbackText}
          heardText={heardText}
          heardSource={heardSource}
          isSupported={isSupported}
          isListening={isListening}
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
          onCompleteWriting={handleCompleteWriting}
          onNext={goNext}
          equippedItem={equippedItem}
        />
      )}

      {view === 'rewards' && (
        <Rewards
          completedCount={completedCount}
          totalLessons={totalLessons}
          completedLessons={completedLessons}
          onOpenLesson={goToLesson}
          onRestart={restartCourse}
          shipProgress={shipProgress}
          glowCoins={glowCoins}
          purchasedItems={purchasedItems}
          equippedItem={equippedItem}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
        />
      )}

      {sparkles.map(s => (
        <span
          key={s.id}
          className="sparkle-particle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: '16px',
            height: '16px',
            background: s.color,
            border: '2px solid var(--line)',
            borderRadius: s.shape === 'circle' ? '50%' : s.shape === 'star' ? '50% 50% 50% 0' : '4px',
            transform: s.shape === 'star' ? 'rotate(-35deg)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default App;
