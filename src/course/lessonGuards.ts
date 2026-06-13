import type { ChoiceLesson, Lesson, PhonicsLesson, SentenceLesson } from './types';

export function isPhonicsLesson(lesson: Lesson): lesson is PhonicsLesson {
  return lesson.type === 'phonics';
}

export function isChoiceLesson(lesson: Lesson): lesson is ChoiceLesson {
  return lesson.type === 'letter-choice' || lesson.type === 'grammar-choice';
}

export function isSentenceLesson(lesson: Lesson): lesson is SentenceLesson {
  return lesson.type === 'sentence-build';
}
