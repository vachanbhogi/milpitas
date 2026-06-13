import { COURSE_MODULES, type ModuleId } from '../course';
import { MascotScene } from './MascotScene';
import { PictureBadge } from './PictureBadge';

interface RewardsScreenProps {
  completedCount: number;
  totalLessons: number;
  starSeeds: number;
  shipProgress: number;
  completedLessons: Set<string>;
  onOpenModule: (moduleId: ModuleId) => void;
  onRestart: () => void;
}

export function RewardsScreen({
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
