import { useEffect, useMemo, useRef, useState } from 'react';
import { useMicrophone } from './hooks/useMicrophone';
import { type SoundClass, useLiveVoiceAnalyzer } from './hooks/useLiveVoiceAnalyzer';
import { playSynthesizedPhonics, encodeFloat32ArrayToWav } from './audioUtils';
import './App.css';

// Page and Component Imports
import { 
  type View, 
  type ModuleId, 
  type LessonStatus, 
  type Lesson, 
  type CourseModule, 
  type VoiceSnapshot,
  type PhonicsLesson,
  type ChoiceLesson,
  type SentenceLesson
} from './types';
import { Home } from './pages/Home';
import { AppCourse } from './pages/AppCourse';
import { Rewards } from './pages/Rewards';

export const COURSE_MODULES: CourseModule[] = [
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
        title: 'Star Air ⭐️',
        storyPrompt: "Zibi's spaceship antenna is tickling! Help him make the snakey ssss sound to activate it!",
        rewardName: 'Antenna Star Seed',
        targetText: 's',
        displayText: 'S',
        phonicsParts: ['ssss'],
        successMatches: ['s', 'ess', 'sss', 'say', 'sea', 'see'],
        expectedSoundClass: 'hissy',
        coachPrompt: 'Teeth close. Let air slide out like a snake!',
        retryPrompt: 'Try a long ssss sound!',
        repairPart: 'antenna',
      },
      {
        id: 'sound-m',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Moon Hum 🌙',
        storyPrompt: 'The moon engine needs a warm tummy-hug hum: mmmm! Can you help it spin?',
        rewardName: 'Engine Star Seed',
        targetText: 'm',
        displayText: 'M',
        phonicsParts: ['mmmm'],
        successMatches: ['m', 'em', 'mmm', 'mom', 'hum'],
        expectedSoundClass: 'open',
        coachPrompt: 'Lips together. Let the sound buzz in your nose!',
        retryPrompt: 'Close your lips and hum: mmmm!',
        repairPart: 'engine',
      },
      {
        id: 'sound-a',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Open Air 🐥',
        storyPrompt: 'Catch a space breeze! Open your mouth wide like a baby bird: aaaa!',
        rewardName: 'Window Star Seed',
        targetText: 'a',
        displayText: 'A',
        phonicsParts: ['aaa'],
        successMatches: ['a', 'ah', 'aa', 'at'],
        expectedSoundClass: 'open',
        coachPrompt: 'Open wide! Short sound: aaa.',
        retryPrompt: 'Open wide and say aaa!',
        repairPart: 'window dome',
      },
      {
        id: 'sound-t',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Tap Button ⏰',
        storyPrompt: 'Tick-tock! The launch button listens for one quick t-t-tap sound like a little clock!',
        rewardName: 'Button Star Seed',
        targetText: 't',
        displayText: 'T',
        phonicsParts: ['t'],
        successMatches: ['t', 'tea', 'tee', 'to'],
        expectedSoundClass: 'pop',
        coachPrompt: 'Tap your tongue behind your teeth. Make it quick!',
        retryPrompt: 'Tap the sound: t!',
        repairPart: 'launch button',
      },
      {
        id: 'sound-p',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'sound',
        title: 'Pop Pod 🫧',
        storyPrompt: 'Pop a space bubble! A fuel pod pops open when it hears you pop: p!',
        rewardName: 'Fuel Star Seed',
        targetText: 'p',
        displayText: 'P',
        phonicsParts: ['p'],
        successMatches: ['p', 'pea', 'pee', 'pa'],
        expectedSoundClass: 'pop',
        coachPrompt: 'Lips together, then pop them open with a burst of air!',
        retryPrompt: 'Pop your lips: p!',
        repairPart: 'fuel pod',
      },
      {
        id: 'word-sat',
        moduleId: 'phonics',
        type: 'phonics',
        kind: 'word',
        title: 'Ship Seat 🚀',
        storyPrompt: "Zibi is ready to sit! Let's glide the sounds together to make a seat: s-a-t!",
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
        title: 'Landing Mat 🛬',
        storyPrompt: "Splat! Let's make a soft mat for landing: m-a-t!",
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
        title: 'Repair Pat 👋',
        storyPrompt: 'Gently pat the spaceship hull to fix it: p-a-t!',
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
        title: 'Find Snakey Sound 🐍',
        storyPrompt: 'Zibi hears a snakey ssss sound! Help him find the picture that starts with that sound.',
        rewardName: 'Star Trail Seed',
        prompt: 'Which picture starts with the ssss sound?',
        correctChoiceId: 'sun',
        successPrompt: 'Hooray! Sun starts with S! ☀️',
        retryPrompt: 'Look for the bright round thing in the sky that starts with ssss.',
        choices: [
          { id: 'sun', label: 'Sun', helper: 'ssss-un! ☀️', art: 'sun' },
          { id: 'moon', label: 'Moon', helper: 'mmmm-oon! 🌙', art: 'moon' },
          { id: 'leaf', label: 'Leaf', helper: 'llll-eaf! 🍃', art: 'leaf' },
        ],
      },
      {
        id: 'letter-m',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Find Humming Sound 🌙',
        storyPrompt: 'The night garden hums mmmm! Help Zibi find the humming picture!',
        rewardName: 'Moon Garden Seed',
        prompt: 'Which picture starts with the mmmm sound?',
        correctChoiceId: 'moon',
        successPrompt: 'Yes! Moon starts with M! 🌙',
        retryPrompt: 'Look for the glowing shape that shines at night: mmmm.',
        choices: [
          { id: 'moon', label: 'Moon', helper: 'mmmm-oon! 🌙', art: 'moon' },
          { id: 'star', label: 'Star', helper: 'ssss-tar! ⭐️', art: 'star' },
          { id: 'rocket', label: 'Rocket', helper: 'rrrr-ocket! 🚀', art: 'rocket' },
        ],
      },
      {
        id: 'letter-p',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Find Popping Sound 🪐',
        storyPrompt: "Listen for the popping pppp sound! Let's choose the correct starting picture!",
        rewardName: 'Pop Star Seed',
        prompt: 'Which picture starts with the pppp sound?',
        correctChoiceId: 'planet',
        successPrompt: 'Yay! Planet starts with P! 🪐',
        retryPrompt: 'Look for the big round space ball: pppp-lanet.',
        choices: [
          { id: 'planet', label: 'Planet', helper: 'pppp-lanet! 🪐', art: 'planet' },
          { id: 'jump', label: 'Jump', helper: 'jjjj-ump! 🦘', art: 'jump' },
          { id: 'ship', label: 'Ship', helper: 'ssss-hip! 🚀', art: 'ship' },
        ],
      },
      {
        id: 'letter-match-a',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Big and Little A 🍎',
        storyPrompt: 'Zibi finds a big sister letter A and needs to find her little brother letter helper.',
        rewardName: 'Alphabet Seed',
        prompt: 'Which little letter matches the big sister A?',
        correctChoiceId: 'a',
        successPrompt: 'Fantastic! A and a are letter buddies!',
        retryPrompt: 'Find the round little a with a short tail.',
        choices: [
          { id: 'o', label: 'o', helper: 'little o', art: 'planet' },
          { id: 'a', label: 'a', helper: 'little a', art: 'leaf' },
          { id: 'p', label: 'p', helper: 'little p', art: 'rocket' },
        ],
      },
      {
        id: 'letter-match-s',
        moduleId: 'letters',
        type: 'letter-choice',
        title: 'Big and Little S ⭐️',
        storyPrompt: 'Zibi has a big curvy S. Help him match it with the little brother letter!',
        rewardName: 'Super Star Seed',
        prompt: 'Which little letter matches the big sister S?',
        correctChoiceId: 's',
        successPrompt: 'Super! S and s are curvy snake partners!',
        retryPrompt: 'Find the curvy little s.',
        choices: [
          { id: 's', label: 's', helper: 'little s', art: 'star' },
          { id: 't', label: 't', helper: 'little t', art: 'path' },
          { id: 'm', label: 'm', helper: 'little m', art: 'moon' },
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
        title: 'Naming Word (Noun) 📦',
        storyPrompt: 'Zibi sees a floating space object. In Earth talk, the name of a thing is called a Noun!',
        rewardName: 'Naming Seed',
        prompt: 'Which word is the name of a thing (Noun)?',
        correctChoiceId: 'rocket',
        successPrompt: 'Perfect! Rocket is a thing word (Noun)! 🚀',
        retryPrompt: 'Look for the shiny flying ship.',
        choices: [
          { id: 'rocket', label: 'Rocket', helper: 'A flying ship!', art: 'rocket' },
          { id: 'jump', label: 'Jump', helper: 'An action word!', art: 'jump' },
          { id: 'bright', label: 'Bright', helper: 'Descriptive word!', art: 'sun' },
        ],
      },
      {
        id: 'grammar-action',
        moduleId: 'grammar',
        type: 'grammar-choice',
        title: 'Action Word (Verb) 🏃',
        storyPrompt: 'Zibi wants to bounce up and down! Action words are called Verbs.',
        rewardName: 'Action Seed',
        prompt: 'Which word shows an action (Verb)?',
        correctChoiceId: 'jump',
        successPrompt: 'Whoosh! Jump is a doing word (Verb)! 🦘',
        retryPrompt: 'Find the word that shows moving.',
        choices: [
          { id: 'ship', label: 'Ship', helper: 'A space thing!', art: 'ship' },
          { id: 'jump', label: 'Jump', helper: 'An active bounce!', art: 'jump' },
          { id: 'green', label: 'Green', helper: 'A color!', art: 'leaf' },
        ],
      },
      {
        id: 'grammar-sentence',
        moduleId: 'grammar',
        type: 'sentence-build',
        title: 'First Message 🪐',
        storyPrompt: "Zibi wants to tell you he can bounce! Let's build his sentence.",
        rewardName: 'Message Seed',
        prompt: 'Tap the word blocks in order to say "Zibi can fly!"',
        tiles: ['fly', 'Zibi', 'can'],
        correctSequence: ['Zibi', 'can', 'fly'],
        successPrompt: 'Amazing! "Zibi can fly!" is a real sentence!',
        retryPrompt: 'Start with Zibi, then can, then fly.',
      },
      {
        id: 'grammar-sentence-2',
        moduleId: 'grammar',
        type: 'sentence-build',
        title: 'Space Sight 🌙',
        storyPrompt: "Let's build a sentence to show what Zibi sees in the sky!",
        rewardName: 'Sky Seed',
        prompt: 'Tap the word blocks to make "Zibi sees the moon!"',
        tiles: ['sees', 'moon', 'the', 'Zibi'],
        correctSequence: ['Zibi', 'sees', 'the', 'moon'],
        successPrompt: 'Brilliant! "Zibi sees the moon!" is a perfect sentence!',
        retryPrompt: 'Tap who first (Zibi), then sees, then the, then moon.',
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
    // Audio feedback is optional
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

function App() {
  const [view, setView] = useState<View>('home');
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
  const [sparkles, setSparkles] = useState<{ id: number; emoji: string; x: number; y: number; scale: number }[]>([]);

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
    const checkServer = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8080/inference', { method: 'POST' });
        setIsServerConnected(res.ok || res.status === 400);
      } catch {
        setIsServerConnected(false);
      }
    };
    checkServer();
  }, [activeLessonId]);

  const triggerExplosion = () => {
    const emojis = ['✨', '⭐️', '🎉', '🪐', '💫', '🎨', '🚀', '🥳', '🎈', '⚡️', '🦄', '🛸'];
    const newSparkles = Array.from({ length: 25 }).map(() => ({
      id: Math.random(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
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
      return next;
    });
  };

  const resetLessonInteraction = (lesson: Lesson, complete = completedLessons.has(lesson.id)) => {
    bestVoiceRef.current = EMPTY_VOICE;
    setBestVoice(EMPTY_VOICE);
    setHeardText('');
    setSelectedChoiceId(null);
    setSelectedTiles([]);
    reset();

    if (complete) {
      setLessonStatus('success');
      setFeedbackText(isPhonicsLesson(lesson) ? `Zibi learned ${lesson.displayText}.` : 'Lesson complete.');
    } else {
      setLessonStatus('idle');
      setFeedbackText(isPhonicsLesson(lesson) ? lesson.storyPrompt : lesson.prompt);
    }
  };

  const openModule = (moduleId: ModuleId) => {
    setActiveModuleId(moduleId);
    const targetModule = COURSE_MODULES.find(m => m.id === moduleId) ?? COURSE_MODULES[0];
    const firstOpenLesson = targetModule.lessons.find(lesson => !completedLessons.has(lesson.id)) ?? targetModule.lessons[0];
    setActiveLessonId(firstOpenLesson.id);
    resetLessonInteraction(firstOpenLesson);
    setView('course');
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
    setView('course');
  };

  const handleStartRecording = async () => {
    bestVoiceRef.current = EMPTY_VOICE;
    setBestVoice(EMPTY_VOICE);
    setHeardText('');
    reset();

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
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
        transcript = await Promise.race([checkWithWhisper(samples), timeoutPromise]) as string;
        setHeardText(transcript || getSoundLabel(bestVoiceRef.current.soundClass as SoundClass));
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
      triggerExplosion();
    } else {
      setLessonStatus('retry');
      setFeedbackText(transcript ? `Zibi heard "${transcript}". ${activeLesson.retryPrompt}` : activeLesson.retryPrompt);
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
          <span className="brand-mark" aria-hidden="true">M</span>
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
            App Course
          </button>
          <button className={view === 'rewards' ? 'is-active' : ''} type="button" onClick={() => setView('rewards')}>
            Rewards
          </button>
        </nav>

        <div className="star-counter" aria-label={`${completedCount} Scoin Seeds`}>
          <span aria-hidden="true" />
          <strong>{completedCount} Seeds</strong>
        </div>
      </header>

      {view === 'home' && (
        <Home 
          isServerConnected={isServerConnected} 
          onOpenApp={() => setView('course')} 
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
          onNext={goNext}
        />
      )}

      {view === 'rewards' && (
        <Rewards
          completedCount={completedCount}
          totalLessons={totalLessons}
          completedLessons={completedLessons}
          onOpenModule={openModule}
          onRestart={restartCourse}
          shipProgress={shipProgress}
        />
      )}

      {sparkles.map(s => (
        <span
          key={s.id}
          className="sparkle-particle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `scale(${s.scale})`,
          }}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}

export default App;
