import { type PictureArt } from '../types';

interface PictureBadgeProps {
  art: PictureArt;
  label: string;
}

export function PictureBadge({ art, label }: PictureBadgeProps) {
  return (
    <span className={`picture-badge art-${art}`} role="img" aria-label={label}>
      <span />
    </span>
  );
}
