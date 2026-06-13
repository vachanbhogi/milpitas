import { grammarModule } from './modules/grammar';
import { lettersModule } from './modules/letters';
import { phonicsModule } from './modules/phonics';
import type { CourseModule } from './types';

export const COURSE_MODULES: CourseModule[] = [
  phonicsModule,
  lettersModule,
  grammarModule,
];

export * from './types';
