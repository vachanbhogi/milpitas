import { useEffect, useMemo, useRef, useState } from 'react';
import { useMicrophone } from './hooks/useMicrophone';
import { type SoundClass, useLiveVoiceAnalyzer } from './hooks/useLiveVoiceAnalyzer';
import './App.css';

type View = 'course' | 'lesson' | 'rewards' | 'pitch';
type ModuleId = 'phonics' | 'letters' | 'grammar';
type LessonStatus = 'idle' | 'recording' | 'checking' | 'success' | 'retry' | 'error';
type PictureArt = 'rocket' | 'moon' | 'sun' | 'leaf' | 'planet' | 'star' | 'jump' | 'paint' | 'ship' | 'path';

interface BaseLesson {
  id: string;
  moduleId: ModuleId;
  title: string;
  storyPrompt: string;
  rewardName: string;
}

interface PhonicsLesson extends BaseLesson {
  type: 'phonics';
  kind: 'sound' | 'word';
  targetText: string;
  displayText: string;
  phonicsParts: string[];
  successMatches: string[];
  expectedSoundClass?: SoundClass;
  coachPrompt: string;
  retryPrompt: string;
  repairPart: string;
}

interface ChoiceOption {
  id: string;
  label: string;
  helper: string;
  art: PictureArt;
}

interface ChoiceLesson extends BaseLesson {
  type: 'letter-choice' | 'grammar-choice';
  prompt: string;
  choices: ChoiceOption[];
  correctChoiceId: string;
  successPrompt: string;
  retryPrompt: string;
}

interface SentenceLesson extends BaseLesson {
  type: 'sentence-build';
  prompt: string;
  tiles: string[];
  correctSequence: string[];
  successPrompt: string;
  retryPrompt: string;
}

type Lesson = PhonicsLesson | ChoiceLesson | SentenceLesson;

interface CourseModule {
  id: ModuleId;
  title: string;
  planet: string;
  mission: string;
  colorClass: string;
  lessons: Lesson[];
}

interface VoiceSnapshot {
  soundClass: SoundClass;
  confidence: number;
  energy: number;
  score: number;
}

const COURSE_MODULES: CourseModule[] = [
  {
    id: 'phonics',
    title: 'Sound Safari',
    planet: 'Echo Planet',
    mission: 'Teach Zibi the Earth sounds that wake up words.',
    colorClass: 'yellow',
    lessons: [
      {
        id: 'sound-s',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Star Air',
        storyPrompt: 'Zibi found the ship antenna. It glows when it hears a long s sound.',
        rewardName: 'Antenna Star Seed',
        targetText: 's',
        displayText: 'S',
        phonicsParts: ['ssss'],
        successMatches: ['s', 'ess', 'sss', 'say', 'sea', 'see'],
        expectedSoundClass: 'hissy',
        coachPrompt: 'Teeth close. Let air slide out.',
        retryPrompt: 'Try a long s sound.',
        repairPart: 'antenna',
      },
      {
        id: 'sound-m',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Moon Hum',
        storyPrompt: 'The moon engine needs a gentle mmm hum.',
        rewardName: 'Engine Star Seed',
        targetText: 'm',
        displayText: 'M',
        phonicsParts: ['mmmm'],
        successMatches: ['m', 'em', 'mmm', 'mom', 'hum'],
        expectedSoundClass: 'open',
        coachPrompt: 'Lips together. Let the sound buzz.',
        retryPrompt: 'Close your lips and hum mmmm.',
        repairPart: 'engine',
      },
      {
        id: 'sound-a',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Open Air',
        storyPrompt: 'Zibi opens the ship window to catch the short a sound.',
        rewardName: 'Window Star Seed',
        targetText: 'a',
        displayText: 'A',
        phonicsParts: ['aaa'],
        successMatches: ['a', 'ah', 'aa', 'at'],
        expectedSoundClass: 'open',
        coachPrompt: 'Open your mouth. Short sound: aaa.',
        retryPrompt: 'Open wide and say aaa.',
        repairPart: 'window dome',
      },
      {
        id: 'sound-t',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Tap Button',
        storyPrompt: 'The launch button listens for one quick t tap.',
        rewardName: 'Button Star Seed',
        targetText: 't',
        displayText: 'T',
        phonicsParts: ['t'],
        successMatches: ['t', 'tea', 'tee', 'to'],
        expectedSoundClass: 'pop',
        coachPrompt: 'Tongue taps up top. Make it quick.',
        retryPrompt: 'Tap the sound: t.',
        repairPart: 'launch button',
      },
      {
        id: 'sound-p',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Pop Pod',
        storyPrompt: 'A fuel pod pops open when it hears p.',
        rewardName: 'Fuel Star Seed',
        targetText: 'p',
        displayText: 'P',
        phonicsParts: ['p'],
        successMatches: ['p', 'pea', 'pee', 'pa'],
        expectedSoundClass: 'pop',
        coachPrompt: 'Lips pop open. Tiny burst of air.',
        retryPrompt: 'Pop your lips: p.',
        repairPart: 'fuel pod',
      },
      {
        id: 'word-sat',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'word',
        title: 'Ship Seat',
        storyPrompt: 'Zibi needs to sit safely before launch.',
        rewardName: 'Seat Star Seed',
        targetText: 'sat',
        displayText: 'SAT',
        phonicsParts: ['s', 'a', 't'],
        successMatches: ['sat'],
        coachPrompt: 'Slide the sounds together: s-a-t.',
        retryPrompt: 'Start with ssss, then aaa, then t.',
        repairPart: 'seat belt',
      },
      {
        id: 'word-mat',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'word',
        title: 'Landing Mat',
        storyPrompt: 'The ship needs a soft landing mat.',
        rewardName: 'Landing Star Seed',
        targetText: 'mat',
        displayText: 'MAT',
        phonicsParts: ['m', 'a', 't'],
        successMatches: ['mat'],
        coachPrompt: 'Buzz, open, tap: m-a-t.',
        retryPrompt: 'Try mmmm, aaa, t.',
        repairPart: 'landing mat',
      },
      {
        id: 'word-pat',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'word',
        title: 'Repair Pat',
        storyPrompt: 'Give the ship a gentle repair pat.',
        rewardName: 'Hull Star Seed',
        targetText: 'pat',
        displayText: 'PAT',
        phonicsParts: ['p', 'a', 't'],
        successMatches: ['pat'],
        coachPrompt: 'Pop, open, tap: p-a-t.',
        retryPrompt: 'Try p, aaa, t.',
        repairPart: 'ship hull',
      },
    ],
  },
  {
    id: 'letters',
    title: 'Letter Lagoon',
    planet: 'Glow Letter Lagoon',
    mission: 'Match Earth sounds to big bright letters.',
    colorClass: 'blue',
    lessons: [
      {
        id: 'letter-s',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Find S',
        storyPrompt: 'Zibi hears ssss from a star trail.',
        rewardName: 'Star Trail Seed',
        prompt: 'Which letter makes ssss?',
        correctChoiceId: 's',
        successPrompt: 'Yes. S makes the star sound.',
        retryPrompt: 'Look for the curvy letter that slides like air.',
        choices: [
          { id: 's', label: 'S', helper: 'star sound', art: 'star' },
          { id: 'm', label: 'M', helper: 'moon hum', art: 'moon' },
          { id: 'p', label: 'P', helper: 'pop pod', art: 'planet' },
        ],
      },
      {
        id: 'letter-m',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Find M',
        storyPrompt: 'The moon garden hums mmmm.',
        rewardName: 'Moon Garden Seed',
        prompt: 'Which letter makes mmmm?',
        correctChoiceId: 'm',
        successPrompt: 'Yes. M makes the moon hum.',
        retryPrompt: 'Find the letter with mountain bumps.',
        choices: [
          { id: 'a', label: 'A', helper: 'open air', art: 'sun' },
          { id: 'm', label: 'M', helper: 'moon hum', art: 'moon' },
          { id: 't', label: 'T', helper: 'tap top', art: 'path' },
        ],
      },
      {
        id: 'letter-match-a',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Big And Little A',
        storyPrompt: 'Zibi finds a big A and needs its small Earth friend.',
        rewardName: 'Alphabet Seed',
        prompt: 'Which little letter matches A?',
        correctChoiceId: 'a',
        successPrompt: 'Yes. A and a are letter friends.',
        retryPrompt: 'Choose the little a.',
        choices: [
          { id: 'o', label: 'o', helper: 'round o', art: 'planet' },
          { id: 'a', label: 'a', helper: 'little a', art: 'leaf' },
          { id: 'p', label: 'p', helper: 'pop p', art: 'rocket' },
        ],
      },
    ],
  },
  {
    id: 'grammar',
    title: 'Tiny Talk Town',
    planet: 'Sentence Town',
    mission: 'Help Zibi build tiny Earth ideas with pictures.',
    colorClass: 'pink',
    lessons: [
      {
        id: 'grammar-noun',
        moduleId: 'grammar',
        type: 'grammar-choice',
        title: 'Thing Word',
        storyPrompt: 'Zibi points at a thing. Earth kids call thing words nouns.',
        rewardName: 'Naming Seed',
        prompt: 'Zibi sees a blank.',
        correctChoiceId: 'rocket',
        successPrompt: 'Rocket is a thing word.',
        retryPrompt: 'Pick the thing Zibi can see.',
        choices: [
          { id: 'rocket', label: 'rocket', helper: 'a thing', art: 'rocket' },
          { id: 'jump', label: 'jump', helper: 'an action', art: 'jump' },
          { id: 'bright', label: 'bright', helper: 'a describing word', art: 'sun' },
        ],
      },
      {
        id: 'grammar-action',
        moduleId: 'grammar',
        type: 'grammar-choice',
        title: 'Action Word',
        storyPrompt: 'Zibi wants to move like an Earth kid.',
        rewardName: 'Action Seed',
        prompt: 'What can Zibi do?',
        correctChoiceId: 'jump',
        successPrompt: 'Jump is an action word.',
        retryPrompt: 'Pick the word that shows moving.',
        choices: [
          { id: 'ship', label: 'ship', helper: 'a thing', art: 'ship' },
          { id: 'jump', label: 'jump', helper: 'an action', art: 'jump' },
          { id: 'green', label: 'green', helper: 'a color', art: 'leaf' },
        ],
      },
      {
        id: 'grammar-sentence',
        moduleId: 'grammar',
        type: 'sentence-build',
        title: 'First Message',
        storyPrompt: 'Zibi is ready to send one clear Earth sentence.',
        rewardName: 'Message Seed',
        prompt: 'Tap the words in order.',
        tiles: ['hop', 'Zibi', 'moon', 'can'],
        correctSequence: ['Zibi', 'can', 'hop'],
        successPrompt: 'Great sentence. Zibi can hop.',
        retryPrompt: 'Start with who, then can, then the action.',
      },
    ],
  },
];

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
    // Audio feedback is optional and should never interrupt the lesson.
  }
}

function cleanSpeech(text: string) {
  return text.toLowerCase().replace(/[^a-z]/g, '');
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

function getSoundLabel(soundClass: SoundClass) {
  switch (soundClass) {
    case 'hissy':
      return 'hissy air';
    case 'open':
      return 'open voice';
    case 'pop':
      return 'quick pop';
    case 'voice':
      return 'voice';
    default:
      return 'quiet';
  }
}

function getLessonIcon(moduleId: ModuleId) {
  if (moduleId === 'phonics') return 'sound rings';
  if (moduleId === 'letters') return 'letter lights';
  return 'word blocks';
}

function App() {
  const [view, setView] = useState<View>('course');
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>('phonics');
  const [activeLessonId, setActiveLessonId] = useState<string>(COURSE_MODULES[0].lessons[0].id);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => new Set());
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('idle');
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
  const activeModule = COURSE_MODULES.find(module => module.id === activeModuleId) ?? COURSE_MODULES[0];
  const activeLesson = allLessons.find(lesson => lesson.id === activeLessonId) ?? COURSE_MODULES[0].lessons[0];
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
    const module = COURSE_MODULES.find(item => item.id === moduleId) ?? COURSE_MODULES[0];
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
    setActiveModuleId('phonics');
    setActiveLessonId(COURSE_MODULES[0].lessons[0].id);
    resetLessonInteraction(COURSE_MODULES[0].lessons[0], false);
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

interface CourseMapProps {
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
}

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
}: CourseMapProps) {
  return (
    <main className="course-layout">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Interactive Learning Track</p>
          <h1>Help Zibi learn Earth sounds.</h1>
          <p>
            A voice-first course for young learners with bright missions, letter games,
            tiny grammar, and rewards that repair an alien ship.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => onOpenModule('phonics')}>
              Start Course
            </button>
            <button className="secondary-action" type="button" onClick={onOpenRewards}>
              View Rewards
            </button>
          </div>
        </div>

        <MascotScene progress={shipProgress} mood={allDone ? 'launch' : 'happy'} />
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
            <p>Every star seed is glowing. Replay the course or jump into any planet.</p>
          </div>
          <button className="secondary-action" type="button" onClick={onRestart}>
            Play Again
          </button>
        </section>
      )}

      <section className="module-grid" aria-label="learning planets">
        {COURSE_MODULES.map(module => {
          const moduleDone = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
          const nextLesson = module.lessons.find(lesson => !completedLessons.has(lesson.id)) ?? module.lessons[0];

          return (
            <article className={`module-card module-${module.colorClass}`} key={module.id}>
              <div className="module-topline">
                <PictureBadge art={module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : 'ship'} label={module.title} />
                <span>{moduleDone}/{module.lessons.length}</span>
              </div>
              <h2>{module.title}</h2>
              <p>{module.mission}</p>
              <div className="mini-progress" aria-label={`${moduleDone} of ${module.lessons.length} complete`}>
                {module.lessons.map(lesson => (
                  <button
                    key={lesson.id}
                    className={completedLessons.has(lesson.id) ? 'is-complete' : ''}
                    type="button"
                    aria-label={`${lesson.title} ${completedLessons.has(lesson.id) ? 'complete' : 'not complete'}`}
                    onClick={() => onOpenLesson(lesson)}
                  />
                ))}
              </div>
              <button className="module-button" type="button" onClick={() => onOpenModule(module.id)}>
                {completedLessons.has(nextLesson.id) ? 'Review Planet' : 'Continue'}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}

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

interface RewardsScreenProps {
  completedCount: number;
  totalLessons: number;
  starSeeds: number;
  shipProgress: number;
  completedLessons: Set<string>;
  onOpenModule: (moduleId: ModuleId) => void;
  onRestart: () => void;
}

function RewardsScreen({
  completedCount,
  totalLessons,
  starSeeds,
  shipProgress,
  completedLessons,
  onOpenModule,
  onRestart,
}: RewardsScreenProps) {
  return (
    <main className="rewards-layout">
      <section className="rewards-hero">
        <MascotScene progress={shipProgress} mood={shipProgress === 100 ? 'launch' : 'happy'} />
        <div>
          <p className="eyebrow">Reward Bay</p>
          <h1>{starSeeds} star seeds saved</h1>
          <p>Zibi uses every seed to repair the Star Sprout and remember Earth sounds.</p>
          <button className="secondary-action" type="button" onClick={onRestart}>
            Restart Course
          </button>
        </div>
      </section>

      <section className="badge-grid" aria-label="module rewards">
        {COURSE_MODULES.map(module => {
          const moduleDone = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
          return (
            <article className={`badge-card module-${module.colorClass}`} key={module.id}>
              <PictureBadge art={module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : 'ship'} label={module.title} />
              <h2>{module.title}</h2>
              <p>{moduleDone}/{module.lessons.length} seeds collected</p>
              <button className="module-button" type="button" onClick={() => onOpenModule(module.id)}>
                Visit Planet
              </button>
            </article>
          );
        })}
      </section>

      <section className="repair-summary">
        <h2>Ship repair log</h2>
        <p>{completedCount} of {totalLessons} missions complete. The ship is {shipProgress}% ready.</p>
        <div className="ship-progress-track" aria-hidden="true">
          <span style={{ width: `${shipProgress}%` }} />
        </div>
      </section>
    </main>
  );
}

interface PitchPageProps {
  isServerConnected: boolean | null;
  onOpenApp: () => void;
}

function PitchPage({ isServerConnected, onOpenApp }: PitchPageProps) {
  return (
    <main className="pitch-layout">
      <section className="pitch-cover">
        <div>
          <p className="eyebrow">Milpitas Hacks 2</p>
          <h1>Earthlingo</h1>
          <p>Interactive early learning built around sound, visuals, and playful rewards.</p>
          <button className="primary-action" type="button" onClick={onOpenApp}>
            Open App
          </button>
        </div>
        <MascotScene progress={68} mood="happy" />
      </section>

      <section className="pitch-grid">
        <article>
          <span>Problem</span>
          <h2>Many early learners need practice before reading feels natural.</h2>
          <p>Text-heavy apps ask young kids to read instructions before they are ready. Earthlingo starts with sounds, pictures, and touch.</p>
        </article>
        <article>
          <span>Question</span>
          <h2>What if kids could teach an alien to speak Earth?</h2>
          <p>The story gives every sound and letter a reason. Children help Zibi repair a ship by completing missions.</p>
        </article>
        <article>
          <span>Solution</span>
          <h2>A course map with phonics, letters, and tiny grammar.</h2>
          <p>Speech missions use the microphone and Whisper. Letter and grammar missions are frontend games for fast judging.</p>
        </article>
        <article>
          <span>Research</span>
          <h2>Sound-first learning supports pre-readers.</h2>
          <p>Final slides should add cited literacy research and a personal anecdote. The app already shows the learning loop.</p>
        </article>
      </section>

      <section className="tech-section">
        <div>
          <h2>Tech stack</h2>
          <p>React, TypeScript, Vite, Web Audio API, AudioWorklet, local whisper.cpp, and browser-first lesson state.</p>
        </div>
        <div className="tech-list">
          <span>Mic capture</span>
          <span>Live sound shape</span>
          <span>Whisper scoring</span>
          <span>Course progress</span>
          <span>Responsive UI</span>
          <span>{isServerConnected ? 'Whisper online' : 'Whisper offline'}</span>
        </div>
      </section>

      <section className="design-section">
        <h2>Design system</h2>
        <p>Bright planets, original cartoon characters, chunky controls, minimal reading, and reward feedback made for young kids.</p>
        <div className="design-tokens" aria-label="design tokens">
          <span className="token-yellow" />
          <span className="token-blue" />
          <span className="token-pink" />
          <span className="token-green" />
        </div>
      </section>
    </main>
  );
}

function MascotScene({ progress, mood }: { progress: number; mood: 'happy' | 'launch' }) {
  return (
    <div className={`mascot-scene ${mood === 'launch' ? 'is-launching' : ''}`} aria-label={`Zibi ship ${progress}% repaired`}>
      <div className="planet-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ship-wrap" aria-hidden="true">
        <div className="ship">
          <span className="ship-window" />
          <span className="ship-fin left" />
          <span className="ship-fin right" />
          <span className="ship-flame" style={{ transform: `scaleY(${Math.max(progress, 12) / 100})` }} />
        </div>
      </div>
      <div className="alien" aria-hidden="true">
        <span className="antenna left" />
        <span className="antenna right" />
        <span className="eye left" />
        <span className="eye right" />
        <span className="smile" />
        <span className="belly" />
      </div>
    </div>
  );
}

function PictureBadge({ art, label }: { art: PictureArt; label: string }) {
  return (
    <span className={`picture-badge art-${art}`} role="img" aria-label={label}>
      <span />
    </span>
  );
}

export default App;
