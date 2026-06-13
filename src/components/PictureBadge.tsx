import { motion } from 'framer-motion';
import { type PictureArt } from '../types';

export function PictureBadge({ art, label }: { art: PictureArt; label: string }) {
  return (
    <motion.span
      className={`picture-badge art-${art}`}
      role="img"
      aria-label={label}
      animate={{ rotate: [0, 3, -3, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span />
    </motion.span>
  );
}
