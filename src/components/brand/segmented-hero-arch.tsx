const stones = [
  "M 95 360 A 255 255 0 0 1 101.5 302.6 L 184.4 321.8 A 170 170 0 0 0 180 360 Z",
  "M 104.9 289.7 A 255 255 0 0 1 127 236.4 L 201.3 277.6 A 170 170 0 0 0 186.6 313.1 Z",
  "M 133.7 224.9 A 255 255 0 0 1 169.7 179.7 L 229.8 239.8 A 170 170 0 0 0 205.8 269.9 Z",
  "M 179.4 170.5 A 255 255 0 0 1 226.4 137 L 267.6 211.3 A 170 170 0 0 0 236.2 233.7 Z",
  "M 238.2 130.8 A 255 255 0 0 1 292.6 111.5 L 311.8 194.4 A 170 170 0 0 0 275.5 207.2 Z",
  "M 394.3 108.9 A 255 255 0 0 1 449.6 125.3 L 416.4 203.5 A 170 170 0 0 0 379.5 192.6 Z",
  "M 461.8 130.8 A 255 255 0 0 1 510.5 161.8 L 457 227.9 A 170 170 0 0 0 424.5 207.2 Z",
  "M 520.6 170.5 A 255 255 0 0 1 558.9 213.7 L 489.3 262.5 A 170 170 0 0 0 463.8 233.7 Z",
  "M 566.3 224.9 A 255 255 0 0 1 591.1 277 L 510.7 304.7 A 170 170 0 0 0 494.2 269.9 Z",
  "M 595.1 289.7 A 255 255 0 0 1 604.7 346.7 L 519.8 351.1 A 170 170 0 0 0 513.4 313.1 Z",
];

export function SegmentedHeroArch() {
  return (
    <svg
      viewBox="0 0 700 720"
      className="h-[620px] w-full max-w-[590px] overflow-visible"
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id="archStoneFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#26354f" />
          <stop offset="0.55" stopColor="#18243a" />
          <stop offset="1" stopColor="#0b111c" />
        </linearGradient>
        <linearGradient id="archGoldStone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d57e" />
          <stop offset="0.5" stopColor="#c79b3d" />
          <stop offset="1" stopColor="#7f581a" />
        </linearGradient>
        <filter id="archBlockShadow" x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="16" stdDeviation="13" floodColor="#000" floodOpacity="0.45" />
        </filter>
        <filter id="archGoldGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="350" cy="650" rx="248" ry="25" fill="#2357ff" opacity="0.1" />

      <g filter="url(#archBlockShadow)">
        <rect x="95" y="360" width="85" height="132" rx="2" fill="url(#archStoneFace)" stroke="#315ce7" strokeWidth="2" />
        <rect x="95" y="500" width="85" height="142" rx="2" fill="url(#archStoneFace)" stroke="#315ce7" strokeWidth="2" />
        <rect x="520" y="360" width="85" height="132" rx="2" fill="url(#archStoneFace)" stroke="#315ce7" strokeWidth="2" />
        <rect x="520" y="500" width="85" height="142" rx="2" fill="url(#archStoneFace)" stroke="#315ce7" strokeWidth="2" />

        {stones.map((stone) => (
          <path key={stone} d={stone} fill="url(#archStoneFace)" stroke="#315ce7" strokeWidth="2" />
        ))}

        <path
          d="M 318 52 L 382 52 L 392 126 L 350 173 L 308 126 Z"
          fill="url(#archGoldStone)"
          stroke="#f4d78b"
          strokeWidth="3"
          filter="url(#archGoldGlow)"
        />
        <path d="M350 74 V139" stroke="#111827" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
      </g>

      <path d="M72 660 H628" stroke="#1448d8" strokeWidth="2" opacity="0.34" />
    </svg>
  );
}
