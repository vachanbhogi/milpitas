import type { SoundClass } from '../hooks/useLiveVoiceAnalyzer';

export type View = 'course' | 'lesson' | 'rewards' | 'pitch';
export type ModuleId = string;
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
  expectedSoundClass?: SoundClass;
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

export type Lesson = PhonicsLesson | ChoiceLesson | SentenceLesson;

export interface CourseModule {
  id: ModuleId;
  title: string;
  planet: string;
  mission: string;
  colorClass: string;
  lessons: Lesson[];
}

export interface VoiceSnapshot {
  soundClass: SoundClass;
  confidence: number;
  energy: number;
  score: number;
}
