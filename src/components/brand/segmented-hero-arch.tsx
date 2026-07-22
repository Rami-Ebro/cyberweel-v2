export function SegmentedHeroArch() {
  return (
    <svg
      viewBox="0 0 700 720"
      className="h-[620px] w-full max-w-[590px] overflow-visible"
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id="blockFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#25324a" />
          <stop offset="0.55" stopColor="#172238" />
          <stop offset="1" stopColor="#0b111c" />
        </linearGradient>
        <linearGradient id="goldStone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d57e" />
          <stop offset="0.5" stopColor="#c79b3d" />
          <stop offset="1" stopColor="#7f581a" />
        </linearGradient>
        <filter id="blockShadow" x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#000000" floodOpacity="0.46" />
        </filter>
        <filter id="blueGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="goldGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="350" cy="650" rx="245" ry="26" fill="#2357ff" opacity="0.12" />

      <g filter="url(#blockShadow)">
        <rect x="82" y="520" width="102" height="122" rx="2" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <rect x="82" y="388" width="102" height="116" rx="2" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M88 269 L192 303 L184 375 L82 340 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M132 181 L228 243 L196 296 L102 235 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M215 112 L292 206 L239 239 L162 150 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M306 79 L339 192 L281 207 L248 96 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />

        <path d="M394 79 L361 192 L419 207 L452 96 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M485 112 L408 206 L461 239 L538 150 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M568 181 L472 243 L504 296 L598 235 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <path d="M612 269 L508 303 L516 375 L618 340 Z" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <rect x="516" y="388" width="102" height="116" rx="2" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />
        <rect x="516" y="520" width="102" height="122" rx="2" fill="url(#blockFace)" stroke="#284fd8" strokeWidth="2" />

        <path
          d="M315 29 L385 29 L397 124 L350 167 L303 124 Z"
          fill="url(#goldStone)"
          stroke="#f4d78b"
          strokeWidth="3"
          filter="url(#goldGlow)"
        />
        <path d="M350 56 V137" stroke="#111827" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
      </g>

      <g filter="url(#blueGlow)" opacity="0.75">
        <path d="M89 646 H184" stroke="#2a63ff" strokeWidth="2" />
        <path d="M516 646 H611" stroke="#2a63ff" strokeWidth="2" />
        <path d="M192 303 L184 375" stroke="#2a63ff" strokeWidth="2" />
        <path d="M508 303 L516 375" stroke="#2a63ff" strokeWidth="2" />
      </g>

      <path d="M68 660 H632" stroke="#1448d8" strokeWidth="2" opacity="0.38" />
    </svg>
  );
}
