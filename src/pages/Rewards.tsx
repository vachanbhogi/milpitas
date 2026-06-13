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
  glowCoins: number;
  purchasedItems: string[];
  equippedItem: string | null;
  onBuyItem: (itemId: string, cost: number) => void;
  onEquipItem: (itemId: string | null) => void;
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
  glowCoins,
  purchasedItems,
  equippedItem,
  onBuyItem,
  onEquipItem,
}: RewardsProps) {
  const hasUnlockedHome = completedCount >= totalLessons;

  return (
    <motion.main className="rewards-layout" initial="hidden" animate="visible" variants={stagger}>
      <motion.section className="rewards-hero" variants={fadeUp}>
        <motion.div variants={fadeUp}>
          <MascotScene progress={shipProgress} mood={shipProgress === 100 ? 'launch' : 'happy'} equippedItem={equippedItem} />
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

      {/* Rewards Shop Section */}
      <motion.section className="rewards-shop-section" variants={fadeUp}>
        <div style={{ borderBottom: '3px solid var(--line)', paddingBottom: '12px', marginBottom: '8px' }}>
          <motion.h2 variants={fadeUpFast} style={{ fontSize: '1.8rem', margin: 0 }}>Zibi's Space Shop</motion.h2>
          <motion.p className="shop-intro" variants={fadeUpFast} style={{ fontSize: '1.1rem', marginTop: '6px' }}>
            Earn Glow Coins by playing missions. Get cool cosmic gear for Zibi!
          </motion.p>
        </div>

        <div className="shop-grid">
          {/* Redesigned Retro Space Helmet */}
          <motion.div className="shop-card"
            variants={fadeUpFast}
            whileHover={{ y: -4, boxShadow: '8px 8px 0 #172033' }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            
            <div className="shop-card-preview">
              <svg viewBox="0 0 100 100" width="80" height="80" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
                {/* Zibi head silhouette */}
                <rect x="30" y="32" width="40" height="42" rx="16" fill="#84f5a2" stroke="#172033" strokeWidth="4" />
                <circle cx="43" cy="46" r="6" fill="#ffffff" stroke="#172033" strokeWidth="3" />
                <circle cx="43" cy="46" r="2.5" fill="#172033" />
                <circle cx="57" cy="46" r="6" fill="#ffffff" stroke="#172033" strokeWidth="3" />
                <circle cx="57" cy="46" r="2.5" fill="#172033" />
                <path d="M 45 56 Q 50 61 55 56" fill="none" stroke="#172033" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="50" cy="66" rx="10" ry="5" fill="#ffffff" stroke="#172033" strokeWidth="2.5" opacity="0.9" />

                {/* Redesigned earmuffs */}
                <rect x="22" y="44" width="7" height="15" rx="3.5" fill="#ff9b45" stroke="#172033" strokeWidth="3.5" />
                <rect x="71" y="44" width="7" height="15" rx="3.5" fill="#ff9b45" stroke="#172033" strokeWidth="3.5" />
                {/* Antenna */}
                <line x1="25" y1="44" x2="20" y2="30" stroke="#172033" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="20" cy="30" r="3.5" fill="#ffd84d" stroke="#172033" strokeWidth="3.5" />
                {/* Base collar */}
                <ellipse cx="50" cy="74" rx="26" ry="6" fill="#ffffff" stroke="#172033" strokeWidth="4" />
                {/* Visor bubble */}
                <circle cx="50" cy="50" r="32" fill="rgba(93, 215, 255, 0.25)" stroke="#172033" strokeWidth="4" />
                {/* Shine glare */}
                <path d="M 28 36 A 24 24 0 0 1 72 36" fill="none" stroke="#ffffff" strokeWidth="3.5" opacity="0.75" strokeLinecap="round" />
              </svg>
            </div>

            <div className="shop-card-info">
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Retro Space Helmet</h3>
              <p>Redesigned shell featuring physical earmuffs and radar antenna.</p>
              
              <div className="shop-card-footer">
                <div className="price-tag">
                  <span className="coin-icon" />
                  <strong>20 Coins</strong>
                </div>
                
                {!purchasedItems.includes('helmet') ? (
                  <button
                    type="button"
                    className="buy-button"
                    disabled={glowCoins < 20}
                    onClick={() => onBuyItem('helmet', 20)}
                  >
                    {glowCoins >= 20 ? 'Buy Helmet' : 'Not Enough'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`equip-button ${equippedItem === 'helmet' ? 'is-equipped' : ''}`}
                    onClick={() => onEquipItem(equippedItem === 'helmet' ? null : 'helmet')}
                  >
                    {equippedItem === 'helmet' ? 'Wearing' : 'Put on'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Cosmic Star Crown */}
          <motion.div className="shop-card"
            variants={fadeUpFast}
            whileHover={{ y: -4, boxShadow: '8px 8px 0 #172033' }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            
            <div className="shop-card-preview" style={{ background: 'var(--violet)' }}>
              <svg viewBox="0 0 100 100" width="80" height="80" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
                {/* Zibi head silhouette */}
                <rect x="30" y="32" width="40" height="42" rx="16" fill="#84f5a2" stroke="#172033" strokeWidth="4" />
                <circle cx="43" cy="46" r="6" fill="#ffffff" stroke="#172033" strokeWidth="3" />
                <circle cx="43" cy="46" r="2.5" fill="#172033" />
                <circle cx="57" cy="46" r="6" fill="#ffffff" stroke="#172033" strokeWidth="3" />
                <circle cx="57" cy="46" r="2.5" fill="#172033" />
                <path d="M 45 56 Q 50 61 55 56" fill="none" stroke="#172033" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="50" cy="66" rx="10" ry="5" fill="#ffffff" stroke="#172033" strokeWidth="2.5" opacity="0.9" />

                {/* Crown base sitting on top of head */}
                <path d="M 28 26 L 28 8 L 39 18 L 50 2 L 61 18 L 72 8 L 72 26 Q 50 29 28 26 Z" fill="#ffd84d" stroke="#172033" strokeWidth="4" strokeLinejoin="round" />
                {/* Gem circles on crown peaks */}
                <circle cx="28" cy="6" r="4.5" fill="#5dd7ff" stroke="#172033" strokeWidth="3" />
                <circle cx="50" cy="0" r="5" fill="#ff78b7" stroke="#172033" strokeWidth="3" />
                <circle cx="72" cy="6" r="4.5" fill="#5dd7ff" stroke="#172033" strokeWidth="3" />
                {/* Diamond gem in the center */}
                <polygon points="50,14 55,19 50,24 45,19" fill="#5dd7ff" stroke="#172033" strokeWidth="3" />
              </svg>
            </div>

            <div className="shop-card-info">
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Cosmic Star Crown</h3>
              <p>Fit for orbital royalty! Golden crown detailed with floating blue and pink gems.</p>
              
              <div className="shop-card-footer">
                <div className="price-tag">
                  <span className="coin-icon" />
                  <strong>50 Coins</strong>
                </div>
                
                {!purchasedItems.includes('crown') ? (
                  <button
                    type="button"
                    className="buy-button"
                    disabled={glowCoins < 50}
                    onClick={() => onBuyItem('crown', 50)}
                  >
                    {glowCoins >= 50 ? 'Buy Crown' : 'Not Enough'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`equip-button ${equippedItem === 'crown' ? 'is-equipped' : ''}`}
                    onClick={() => onEquipItem(equippedItem === 'crown' ? null : 'crown')}
                  >
                    {equippedItem === 'crown' ? 'Wearing' : 'Put on'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="seed-log-section" variants={fadeUp} style={{ marginTop: '24px' }}>
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
