import { motion } from 'framer-motion';

interface MascotSceneProps {
  progress: number;
  mood: 'idle' | 'listening' | 'happy' | 'thinking' | 'retry' | 'launch';
}

const moodAnimations: Record<string, { alien: object; ship: object }> = {
  idle: {
    alien: { scale: 1, rotate: 0, y: 0 },
    ship: { y: 0, rotate: 10 },
  },
  listening: {
    alien: { scale: 1.03, rotate: 2, y: -4 },
    ship: { y: -6, rotate: 12 },
  },
  happy: {
    alien: { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0], y: [0, -12, 0] },
    ship: { y: [0, -16, 0], rotate: [10, 14, 6, 10] },
  },
  thinking: {
    alien: { scale: 0.98, rotate: -3, y: -2 },
    ship: { y: -3, rotate: 8 },
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

export function MascotScene({ progress, mood }: MascotSceneProps) {
  const flameScale = Math.max(progress, 12) / 100;

  const alienSpring = { type: 'spring' as const, stiffness: 200, damping: 16, mass: 0.8 };
  const shipSpring = { type: 'spring' as const, stiffness: 180, damping: 14, mass: 0.6 };

  return (
    <motion.div
      className={`mascot-scene mood-${mood} ${mood === 'launch' ? 'is-launching' : ''}`}
      aria-label={`Zibi ship ${progress}% repaired`}
    >
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
      <motion.div
        className="alien"
        aria-hidden="true"
        animate={moodAnimations[mood]?.alien || moodAnimations.idle.alien}
        transition={alienSpring}
      >
        <span className="antenna left" />
        <span className="antenna right" />
        <span className="eye left" />
        <span className="eye right" />
        <span className="smile" />
        <span className="belly" />
      </motion.div>
    </motion.div>
  );
}
