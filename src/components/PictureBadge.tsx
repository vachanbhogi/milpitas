import { type PictureArt } from '../types';

export function PictureBadge({ art, label }: { art: PictureArt; label: string }) {
  return (
    <span className={`picture-badge art-${art}`} role="img" aria-label={label}>
      <span />
    </span>
  );
}
