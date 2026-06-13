export type View = 'home' | 'course' | 'lesson' | 'rewards';
export type ModuleId = 'phonics' | 'letters' | 'grammar' | 'writing';
export type LessonStatus = 'idle' | 'recording' | 'checking' | 'success' | 'retry' | 'error';
export type PictureArt = 'rocket' | 'moon' | 'sun' | 'leaf' | 'planet' | 'star' | 'jump' | 'paint' | 'ship' | 'path';

export interface BaseLesson {
  id: string;
  moduleId: ModuleId;
  title: string;
  storyPrompt: string;
  rewardName: string;
}

export interface PhonicsLesson extends BaseLesson {
  type: 'phonics';
  kind: 'sound' | 'word';
  targetText: string;
  displayText: string;
  phonicsParts: string[];
  successMatches: string[];
  expectedSoundClass?: string;
  coachPrompt: string;
  retryPrompt: string;
  repairPart: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  helper: string;
  art: PictureArt;
}

export interface ChoiceLesson extends BaseLesson {
  type: 'letter-choice' | 'grammar-choice';
  prompt: string;
  choices: ChoiceOption[];
  correctChoiceId: string;
  successPrompt: string;
  retryPrompt: string;
}

export interface SentenceLesson extends BaseLesson {
  type: 'sentence-build';
  prompt: string;
  tiles: string[];
  correctSequence: string[];
  successPrompt: string;
  retryPrompt: string;
}

export interface WritingLesson extends BaseLesson {
  type: 'writing';
  targetWord: string;
  description: string;
  wordEmoji: string;
  successPrompt: string;
  retryPrompt: string;
}

export type Lesson = PhonicsLesson | ChoiceLesson | SentenceLesson | WritingLesson;

export interface CourseModule {
  id: ModuleId;
  title: string;
  planet: string;
  mission: string;
  colorClass: string;
  lessons: Lesson[];
}

export interface VoiceSnapshot {
  soundClass: string;
  confidence: number;
  energy: number;
  score: number;
}

// Add DOM types for Speech Recognition
export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: unknown; // SpeechGrammarList is often not fully typed
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}
