export function ZibiIcon({ className = '', size = 32, equippedItem = null }: { className?: string; size?: number; equippedItem?: string | null }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Antennas */}
      <line x1="38" y1="30" x2="32" y2="15" stroke="#172033" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="15" r="5" fill="#ffd95a" stroke="#172033" strokeWidth="4" />
      
      <line x1="62" y1="30" x2="68" y2="15" stroke="#172033" strokeWidth="4" strokeLinecap="round" />
      <circle cx="68" cy="15" r="5" fill="#ffd95a" stroke="#172033" strokeWidth="4" />

      {/* Arms */}
      <ellipse cx="22" cy="62" rx="10" ry="6" fill="#84f5a2" stroke="#172033" strokeWidth="4" transform="rotate(-20 22 62)" />
      <ellipse cx="78" cy="62" rx="10" ry="6" fill="#84f5a2" stroke="#172033" strokeWidth="4" transform="rotate(20 78 62)" />

      {/* Head/Body */}
      <rect x="25" y="30" width="50" height="52" rx="22" fill="#84f5a2" stroke="#172033" strokeWidth="4" />

      {/* Belly */}
      <ellipse cx="50" cy="72" rx="14" ry="7" fill="#ffffff" stroke="#172033" strokeWidth="3" opacity="0.9" />

      {/* Eyes */}
      <circle cx="40" cy="46" r="8" fill="#ffffff" stroke="#172033" strokeWidth="4" />
      <circle cx="40" cy="46" r="3.5" fill="#172033" />
      <circle cx="38.5" cy="44.5" r="1.2" fill="#ffffff" />
      
      <circle cx="60" cy="46" r="8" fill="#ffffff" stroke="#172033" strokeWidth="4" />
      <circle cx="60" cy="46" r="3.5" fill="#172033" />
      <circle cx="58.5" cy="44.5" r="1.2" fill="#ffffff" />

      {/* Smile */}
      <path d="M 43 58 Q 50 64 57 58" fill="none" stroke="#172033" strokeWidth="4" strokeLinecap="round" />

      {/* Redesigned Space Helmet overlay */}
      {equippedItem === 'helmet' && (
        <>
          {/* Earmuffs */}
          <rect x="22" y="44" width="7" height="15" rx="3.5" fill="#ff9b45" stroke="#172033" strokeWidth="3.5" />
          <rect x="71" y="44" width="7" height="15" rx="3.5" fill="#ff9b45" stroke="#172033" strokeWidth="3.5" />
          {/* Antenna */}
          <line x1="25" y1="44" x2="20" y2="30" stroke="#172033" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="20" cy="30" r="3.5" fill="#ffd84d" stroke="#172033" strokeWidth="3.5" />
          {/* Base collar */}
          <ellipse cx="50" cy="80" rx="26" ry="6" fill="#ffffff" stroke="#172033" strokeWidth="4" />
          {/* Visor bubble */}
          <circle cx="50" cy="52" r="32" fill="rgba(93, 215, 255, 0.25)" stroke="#172033" strokeWidth="4" />
          {/* Shine glare */}
          <path d="M 28 36 A 24 24 0 0 1 72 36" fill="none" stroke="#ffffff" strokeWidth="3.5" opacity="0.75" strokeLinecap="round" />
        </>
      )}

      {/* Cosmic Star Crown overlay */}
      {equippedItem === 'crown' && (
        <>
          {/* Crown pointed body */}
          <path d="M 32 30 L 32 12 L 41 22 L 50 6 L 59 22 L 68 12 L 68 30 Q 50 33 32 30 Z" fill="#ffd84d" stroke="#172033" strokeWidth="4" strokeLinejoin="round" />
          {/* Peak Gems */}
          <circle cx="32" cy="10" r="3.5" fill="#5dd7ff" stroke="#172033" strokeWidth="2.5" />
          <circle cx="50" cy="4.5" r="4.5" fill="#ff78b7" stroke="#172033" strokeWidth="2.5" />
          <circle cx="68" cy="10" r="3.5" fill="#5dd7ff" stroke="#172033" strokeWidth="2.5" />
          {/* Center crystal diamond */}
          <polygon points="50,18 54,22 50,26 46,22" fill="#5dd7ff" stroke="#172033" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}
