import { COURSE_MODULES, type Lesson, type ModuleId } from '../course';
import { MascotScene } from './MascotScene';
import { PictureBadge } from './PictureBadge';

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

export function CourseMap({
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
