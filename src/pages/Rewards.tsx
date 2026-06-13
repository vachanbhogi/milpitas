import { motion } from 'framer-motion';
import { MascotScene } from '../components/MascotScene';
import { PictureBadge } from '../components/PictureBadge';
import { COURSE_MODULES } from '../course/courseModules';
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

const springTap = { type: 'spring' as const, stiffness: 500, damping: 20 };
const stagger = { staggerChildren: 0.08 };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};
const fadeUpFast = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

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
    <motion.main className="rewards-layout" initial="hidden" animate="visible" variants={stagger}>
      <motion.section className="rewards-hero" variants={fadeUp}>
        <motion.div variants={fadeUp}>
          <MascotScene progress={shipProgress} mood={shipProgress === 100 ? 'launch' : 'happy'} />
        </motion.div>
        <motion.div variants={stagger}>
          <motion.p className="eyebrow" variants={fadeUpFast}>Space Seeds Log</motion.p>
          <motion.h1 variants={fadeUpFast}>{completedCount} Scoin Seeds Collected</motion.h1>
          <motion.p variants={fadeUpFast}>Zibi needs {totalLessons} Scoin seeds to unlock the final jump home!</motion.p>
          <motion.div className="milestone-badge" variants={fadeUpFast}
            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 200, damping: 12 } }}>
            <strong>Total Scoin Seeds: {completedCount}/{totalLessons}</strong>
            <p className="milestone-subtext">
              {hasUnlockedHome 
                ? "🎉 Mission Accomplished! The Mumble Home Planet is fully unlocked!" 
                : `Collect ${totalLessons - completedCount} more seeds to reach home!`}
            </p>
            <div className="milestone-track" aria-hidden="true">
              <motion.div className="milestone-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalLessons) * 100}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.3 }} />
            </div>
          </motion.div>
          <motion.button className="secondary-action" type="button" onClick={onRestart} style={{ marginTop: '16px' }}
            variants={fadeUpFast}
            whileHover={{ scale: 1.05, boxShadow: '7px 7px 0 #172033' }}
            whileTap={{ scale: 0.96 }}
            transition={springTap}>
            Restart Orbit
          </motion.button>
        </motion.div>
      </motion.section>

      <motion.section className="galaxy-map-section" variants={fadeUp}>
        <motion.h2 variants={fadeUpFast}>Galaxy Progress Orbit</motion.h2>
        <motion.p className="path-subtitle" variants={fadeUpFast}>Trace your flight path around the planets to collect all the seeds!</motion.p>
        
        <div className="galaxy-path-container">
          <motion.div className="galaxy-path-line"
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }} />
          
          {COURSE_MODULES.map((module, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const moduleDone = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
            
            return (
              <motion.div key={module.id} className={`galaxy-node-wrap ${side}`} variants={fadeUpFast}>
                <motion.div className={`galaxy-planet-bubble color-${module.colorClass}`}
                  whileHover={{ scale: 1.05, y: -5, boxShadow: '8px 12px 0 #172033' }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
                  <motion.div
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                    <PictureBadge
                      art={module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : 'ship'}
                      label={module.title}
                    />
                  </motion.div>
                  <div className="planet-details">
                    <h3>{module.title}</h3>
                    <strong className="seed-collect-status">
                      🪐 {moduleDone}/{module.lessons.length} Scoin seeds collected
                    </strong>
                    <div className="mini-progress-dots" style={{ justifyContent: 'center', marginTop: '8px' }}>
                      {module.lessons.map(lesson => (
                        <motion.button
                          key={lesson.id}
                          className={`path-dot ${completedLessons.has(lesson.id) ? 'is-complete' : ''}`}
                          type="button"
                          onClick={() => onOpenLesson(lesson)}
                          title={`Start lesson: ${lesson.title}`}
                          whileHover={{ scale: 1.6 }}
                          whileTap={{ scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                        />
                      ))}
                    </div>
                  </div>
                  <motion.button className="primary-action start-planet-btn" type="button" onClick={() => onOpenModule(module.id)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={springTap}>
                    Visit Planet
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </motion.main>
  );
}
