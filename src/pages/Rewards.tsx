import { motion, type Variants } from 'framer-motion';
import { MascotScene } from '../components/MascotScene';
import { PictureBadge } from '../components/PictureBadge';
import { COURSE_MODULES } from '../course/courseModules';
import { type Lesson } from '../types';

interface RewardsProps {
  completedCount: number;
  totalLessons: number;
  completedLessons: Set<string>;
  onOpenLesson: (lesson: Lesson) => void;
  onRestart: () => void;
  shipProgress: number;
}

const springTap = { type: 'spring' as const, stiffness: 500, damping: 20 };
const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
};
const fadeUpFast: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
};

export function Rewards({
  completedCount,
  totalLessons,
  completedLessons,
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

      <motion.section className="seed-log-section" variants={fadeUp}>
        <motion.h2 variants={fadeUpFast}>Seed Collection Log</motion.h2>
        <div className="seed-log-grid">
          {COURSE_MODULES.map((module, index) => {
            const moduleDone = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
            return (
              <motion.div key={module.id} className={`seed-log-card color-${module.colorClass}`}
                variants={fadeUpFast}
                whileHover={{ y: -3, boxShadow: '6px 6px 0 #172033' }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
                <div className="seed-log-header">
                  <PictureBadge
                    art={module.id === 'phonics' ? 'planet' : module.id === 'letters' ? 'star' : 'ship'}
                    label={module.title}
                  />
                  <h3>{module.title}</h3>
                </div>
                <div className="seed-log-track" aria-hidden="true">
                  <motion.div className="seed-log-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(moduleDone / module.lessons.length) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.1 * index }} />
                </div>
                <strong className="seed-log-count">{moduleDone}/{module.lessons.length} seeds</strong>
                <div className="seed-log-dots">
                  {module.lessons.map(lesson => (
                    <motion.button
                      key={lesson.id}
                      className={`seed-log-dot ${completedLessons.has(lesson.id) ? 'is-complete' : ''}`}
                      type="button"
                      onClick={() => onOpenLesson(lesson)}
                      title={lesson.title}
                      whileHover={{ scale: 1.6 }}
                      whileTap={{ scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </motion.main>
  );
}
