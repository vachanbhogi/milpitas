import { motion, type TargetAndTransition } from 'framer-motion';

interface MascotSceneProps {
  progress: number;
  mood: 'idle' | 'listening' | 'happy' | 'thinking' | 'retry' | 'launch' | 'reading';
  equippedItem?: string | null;
  hideShip?: boolean;
}

const moodAnimations: Record<string, { alien: TargetAndTransition; ship: TargetAndTransition }> = {
  idle: {
    alien: { scale: 1, rotate: 0, y: 0 },
    ship: { y: 0, rotate: 10 },
  },
  listening: {
    alien: { scale: 1.03, rotate: 2, y: -4 },
    ship: { y: -6, rotate: 12 },
  },
  happy: {
    alien: {
      scale: [1, 1.06, 1],
      rotate: [0, 3, -3, 0],
      y: [0, -14, 0],
      transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }
    },
    ship: {
      y: [0, -18, 0],
      rotate: [10, 13, 7, 10],
      transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
    },
  },
  thinking: {
    alien: { scale: 0.98, rotate: -3, y: -2 },
    ship: { y: -3, rotate: 8 },
  },
  reading: {
    alien: { scale: 0.97, rotate: 4, y: -4 },
    ship: { y: 2, rotate: 6 },
  },
  retry: {
    alien: { scale: 0.97, rotate: 4, y: 2 },
    ship: { y: 2, rotate: 6 },
  },
  launch: {
    alien: { scale: 0.8, rotate: 0, y: -200, opacity: 0 },
    ship: { y: -300, rotate: 25, opacity: 0 },
  },
};

export function MascotScene({ progress, mood, equippedItem = null, hideShip = false }: MascotSceneProps) {
  const flameScale = Math.max(progress, 12) / 100;

  const alienSpring = { type: 'spring' as const, stiffness: 200, damping: 16, mass: 0.8 };
  const shipSpring = { type: 'spring' as const, stiffness: 180, damping: 14, mass: 0.6 };

  return (
    <motion.div
      className={`mascot-scene mood-${mood} ${mood === 'launch' ? 'is-launching' : ''} ${hideShip ? 'hide-ship' : ''}`}
      aria-label={hideShip ? 'Zibi' : `Zibi ship ${progress}% repaired`}
    >
      {!hideShip && (
        <motion.div
          className="ship-wrap"
          aria-hidden="true"
          animate={moodAnimations[mood]?.ship || moodAnimations.idle.ship}
          transition={shipSpring}
        >
          <div className="ship">
            <span className="ship-window" />
            <span className="ship-fin left" />
            <span className="ship-fin right" />
            <motion.span
              className="ship-flame"
              animate={{ scaleY: flameScale }}
              transition={{ type: 'spring', stiffness: 100, damping: 8 }}
            />
          </div>
        </motion.div>
      )}
      <motion.div
        className="alien"
        aria-hidden="true"
        animate={moodAnimations[mood]?.alien || moodAnimations.idle.alien}
        transition={alienSpring}
      >
        <span className="antenna left" />
        <span className="antenna right" />
        
        {/* Redesigned Space Helmet */}
        {equippedItem === 'helmet' && (
          <svg className="zibi-space-helmet" viewBox="0 0 100 100" style={{
            position: 'absolute',
            top: '-25%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '124%',
            height: '124%',
            zIndex: 10,
            overflow: 'visible',
            pointerEvents: 'none'
          }}>
            {/* Earmuffs */}
            <rect x="18" y="44" width="9" height="19" rx="4.5" fill="var(--orange)" stroke="var(--line)" strokeWidth="4.5" />
            <rect x="73" y="44" width="9" height="19" rx="4.5" fill="var(--orange)" stroke="var(--line)" strokeWidth="4.5" />
            {/* Radar antenna */}
            <line x1="22" y1="44" x2="16" y2="28" stroke="var(--line)" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="16" cy="28" r="4.5" fill="var(--yellow)" stroke="var(--line)" strokeWidth="4.5" />
            {/* Base collar */}
            <ellipse cx="50" cy="85" rx="33" ry="9" fill="#ffffff" stroke="var(--line)" strokeWidth="4.5" />
            {/* Visor bubble */}
            <circle cx="50" cy="50" r="41" fill="rgba(93, 215, 255, 0.22)" stroke="var(--line)" strokeWidth="4.5" />
            {/* Visor glare highlight */}
            <path d="M 21 27 A 38 38 0 0 1 79 27" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="0.75" strokeLinecap="round" />
          </svg>
        )}

        {/* Cosmic Star Crown */}
        {equippedItem === 'crown' && (
          <svg className="zibi-star-crown" viewBox="0 0 100 100" style={{
            position: 'absolute',
            top: '-25%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '124%',
            height: '124%',
            zIndex: 10,
            overflow: 'visible',
            pointerEvents: 'none'
          }}>
            {/* Crown body sits on top of head */}
            <path d="M 28 26 L 28 8 L 39 18 L 50 2 L 61 18 L 72 8 L 72 26 Q 50 29 28 26 Z" fill="var(--yellow)" stroke="var(--line)" strokeWidth="4.5" strokeLinejoin="round" />
            {/* Gems */}
            <circle cx="28" cy="6" r="4.5" fill="var(--blue)" stroke="var(--line)" strokeWidth="3" />
            <circle cx="50" cy="0" r="5" fill="var(--pink)" stroke="var(--line)" strokeWidth="3" />
            <circle cx="72" cy="6" r="4.5" fill="var(--blue)" stroke="var(--line)" strokeWidth="3" />
            <polygon points="50,14 55,19 50,24 45,19" fill="var(--blue)" stroke="var(--line)" strokeWidth="3" />
          </svg>
        )}

        <span className="eye left" />
        <span className="eye right" />
        <span className="smile" />
        <span className="belly" />
        {mood === 'reading' && <span className="book"><span className="bookmark" /></span>}
      </motion.div>
    </motion.div>
  );
}
