interface MascotSceneProps {
  progress: number;
  mood: 'idle' | 'listening' | 'happy' | 'thinking' | 'retry' | 'launch';
}

export function MascotScene({ progress, mood }: MascotSceneProps) {
  return (
    <div className={`mascot-scene mood-${mood} ${mood === 'launch' ? 'is-launching' : ''}`} aria-label={`Zibi ship ${progress}% repaired`}>
      <div className="ship-wrap" aria-hidden="true">
        <div className="ship">
          <span className="ship-window" />
          <span className="ship-fin left" />
          <span className="ship-fin right" />
          <span className="ship-flame" style={{ transform: `scaleY(${Math.max(progress, 12) / 100})` }} />
        </div>
      </div>
      <div className="alien" aria-hidden="true">
        <span className="antenna left" />
        <span className="antenna right" />
        <span className="eye left" />
        <span className="eye right" />
        <span className="smile" />
        <span className="belly" />
      </div>
    </div>
  );
}
