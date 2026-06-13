import { MascotScene } from '../components/MascotScene';
import { PictureBadge } from '../components/PictureBadge';
import { COURSE_MODULES } from '../App';
import { type ModuleId, type Lesson } from '../types';

interface RewardsProps {
  completedCount: number;
  totalLessons: number;
  completedLessons: Set<string>;
  onOpenModule: (moduleId: ModuleId) => void;
  onOpenLesson: (lesson: Lesson) => void;
  onRestart: () => void;
  shipProgress: number;
}

export function Rewards({
  completedCount,
  totalLessons,
  completedLessons,
  onOpenModule,
  onOpenLesson,
  onRestart,
  shipProgress,
}: RewardsProps) {
  const hasUnlockedHome = completedCount >= totalLessons;

  return (
    <main className="rewards-layout">
      <section className="rewards-hero">
        <MascotScene 
          progress={shipProgress} 
          mood={shipProgress === 100 ? 'launch' : 'happy'} 
        />
        <div>
          <p className="eyebrow">Space Seeds Log</p>
          <h1>{completedCount} Scoin Seeds Collected</h1>
          <p>Zibi needs {totalLessons} Scoin seeds to unlock the final jump home!</p>
          <div className="milestone-badge">
            <strong>Total Scoin Seeds: {completedCount}/{totalLessons}</strong>
            <p className="milestone-subtext">
              {hasUnlockedHome 
                ? "🎉 Mission Accomplished! The Mumble Home Planet is fully unlocked!" 
                : `Collect ${totalLessons - completedCount} more seeds to reach home!`}
            </p>
            <div className="milestone-track" aria-hidden="true">
              <div className="milestone-fill" style={{ width: `${(completedCount / totalLessons) * 100}%` }} />
            </div>
          </div>
          <button className="secondary-action" type="button" onClick={onRestart} style={{ marginTop: '16px' }}>
            Restart Orbit
          </button>
        </div>
      </section>

      <section className="galaxy-map-section">
        <h2>Galaxy Progress Orbit</h2>
        <p className="path-subtitle">Trace your flight path around the planets to collect all the seeds!</p>
        
        <div className="galaxy-path-container">
          <div className="galaxy-path-line" />
          
          {COURSE_MODULES.map((module, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const moduleDone = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
            
            return (
              <div key={module.id} className={`galaxy-node-wrap ${side}`}>
                <div className={`galaxy-planet-bubble color-${module.colorClass}`}>
                  <PictureBadge 
                    art={module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : 'ship'} 
                    label={module.title} 
                  />
                  <div className="planet-details">
                    <h3>{module.title}</h3>
                    <strong className="seed-collect-status">
                      🪐 {moduleDone}/{module.lessons.length} Scoin seeds collected
                    </strong>
                    <div className="mini-progress-dots" style={{ justifyContent: 'center', marginTop: '8px' }}>
                      {module.lessons.map(lesson => (
                        <button 
                          key={lesson.id} 
                          className={`path-dot ${completedLessons.has(lesson.id) ? 'is-complete' : ''}`}
                          type="button"
                          onClick={() => onOpenLesson(lesson)}
                          title={`Start lesson: ${lesson.title}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button className="primary-action start-planet-btn" type="button" onClick={() => onOpenModule(module.id)}>
                    Visit Planet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
