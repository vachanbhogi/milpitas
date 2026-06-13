interface MascotSceneProps {
  progress: number;
  mood: 'idle' | 'listening' | 'happy' | 'thinking' | 'retry' | 'launch';
  hasCrown?: boolean;
  hasRainbowFlame?: boolean;
}

export function MascotScene({ progress, mood, hasCrown = false, hasRainbowFlame = false }: MascotSceneProps) {
  return (
    <div className={`mascot-scene mood-${mood} ${mood === 'launch' ? 'is-launching' : ''}`} aria-label={`Zibi ship ${progress}% repaired`}>
      <div className="planet-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ship-wrap" aria-hidden="true">
        <div className="ship">
          <span className="ship-window" />
          <span className="ship-fin left" />
          <span className="ship-fin right" />
          <span className={`ship-flame ${hasRainbowFlame ? 'rainbow-flame-grad' : ''}`} style={{ transform: `scaleY(${Math.max(progress, 12) / 100})` }} />
        </div>
      </div>
      <div className="alien" aria-hidden="true">
        {hasCrown && <span className="mascot-crown" aria-hidden="true">👑</span>}
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
