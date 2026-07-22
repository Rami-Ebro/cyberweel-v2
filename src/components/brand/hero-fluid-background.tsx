type HeroFluidBackgroundProps = {
  className?: string;
};

export function HeroFluidBackground({ className = "" }: HeroFluidBackgroundProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#070b12] ${className}`}
    >
      <style>{`
        @keyframes cwCircuitFlow {
          to { stroke-dashoffset: -180; }
        }
        @keyframes cwNodePulse {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.35); }
        }
        @keyframes cwArchFloat {
          0%, 100% { transform: translate3d(0,0,0) rotateY(-8deg); }
          50% { transform: translate3d(0,-8px,0) rotateY(-5deg); }
        }
        .cw-circuit-line {
          stroke-dasharray: 10 18;
          animation: cwCircuitFlow 12s linear infinite;
        }
        .cw-circuit-node {
          transform-box: fill-box;
          transform-origin: center;
          animation: cwNodePulse 3.8s ease-in-out infinite;
        }
        .cw-arch-float {
          transform-origin: 50% 50%;
          animation: cwArchFloat 7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cw-circuit-line,
          .cw-circuit-node,
          .cw-arch-float { animation: none !important; }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(72% 78% at 25% 46%, rgba(30,52,82,0.48), transparent 68%), radial-gradient(52% 60% at 18% 58%, rgba(184,154,90,0.12), transparent 72%), linear-gradient(115deg, #060a11 0%, #0d1421 42%, #111827 68%, #080c14 100%)",
        }}
      />

      <div className="absolute inset-y-0 right-0 w-[54%] bg-[linear-gradient(90deg,transparent,rgba(7,11,18,0.54)_34%,rgba(7,11,18,0.94)_100%)]" />

      <svg
        viewBox="0 0 900 760"
        className="absolute -left-[5%] top-1/2 h-[92%] w-[62%] -translate-y-1/2 overflow-visible"
        role="presentation"
      >
        <defs>
          <linearGradient id="cwStone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#26364f" />
            <stop offset="0.45" stopColor="#172236" />
            <stop offset="1" stopColor="#090f19" />
          </linearGradient>
          <linearGradient id="cwStoneEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3d5679" stopOpacity="0.92" />
            <stop offset="1" stopColor="#111827" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="cwGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f1d18e" />
            <stop offset="0.4" stopColor="#c49f56" />
            <stop offset="1" stopColor="#6f4f20" />
          </linearGradient>
          <radialGradient id="cwHalo">
            <stop offset="0" stopColor="#9bc7ff" stopOpacity="0.23" />
            <stop offset="1" stopColor="#9bc7ff" stopOpacity="0" />
          </radialGradient>
          <filter id="cwShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="28" stdDeviation="24" floodColor="#000" floodOpacity="0.58" />
          </filter>
          <filter id="cwGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <ellipse cx="420" cy="380" rx="360" ry="330" fill="url(#cwHalo)" />

        <g opacity="0.68">
          <path className="cw-circuit-line" d="M40 180 H170 V115 H265" fill="none" stroke="#b89a5a" strokeWidth="2" />
          <path className="cw-circuit-line" d="M30 520 H145 V610 H280" fill="none" stroke="#5b83b6" strokeWidth="2" />
          <path className="cw-circuit-line" d="M580 82 H740 V190 H860" fill="none" stroke="#b89a5a" strokeWidth="2" />
          <path className="cw-circuit-line" d="M605 625 H750 V540 H875" fill="none" stroke="#5b83b6" strokeWidth="2" />
          <path className="cw-circuit-line" d="M95 330 H210 V250 H300" fill="none" stroke="#5b83b6" strokeWidth="1.5" />
          <path className="cw-circuit-line" d="M545 300 H715 V370 H850" fill="none" stroke="#b89a5a" strokeWidth="1.5" />

          {[ [40,180],[170,115],[265,115],[30,520],[145,610],[280,610],[580,82],[740,190],[860,190],[605,625],[750,540],[875,540],[95,330],[210,250],[300,250],[545,300],[715,370],[850,370] ].map(([cx,cy], i) => (
            <circle key={i} className="cw-circuit-node" cx={cx} cy={cy} r={i % 3 === 0 ? 5 : 3.5} fill={i % 2 === 0 ? "#d2ae68" : "#7fa9d8"} style={{ animationDelay: `${(i % 6) * 0.45}s` }} />
          ))}
        </g>

        <g className="cw-arch-float" filter="url(#cwShadow)">
          <path d="M160 650V385C160 175 285 70 430 70s270 105 270 315v265" fill="none" stroke="#111827" strokeWidth="190" strokeLinecap="butt" />
          <path d="M160 650V385C160 175 285 70 430 70s270 105 270 315v265" fill="none" stroke="url(#cwStone)" strokeWidth="164" strokeLinecap="butt" />
          <path d="M160 650V385C160 175 285 70 430 70s270 105 270 315v265" fill="none" stroke="url(#cwStoneEdge)" strokeWidth="7" strokeLinecap="butt" opacity="0.75" />

          <g stroke="#070b12" strokeWidth="10">
            <path d="M150 555 L245 520" />
            <path d="M150 445 L250 425" />
            <path d="M180 325 L270 350" />
            <path d="M235 215 L310 285" />
            <path d="M315 135 L350 245" />
            <path d="M510 135 L485 245" />
            <path d="M590 210 L525 285" />
            <path d="M665 320 L575 350" />
            <path d="M710 438 L610 425" />
            <path d="M710 555 L615 520" />
          </g>

          <path d="M388 64 L472 64 L500 196 L430 255 L360 196 Z" fill="url(#cwGold)" stroke="#f2d493" strokeOpacity="0.68" strokeWidth="4" filter="url(#cwGlow)" />
          <path d="M382 198 L430 255 L478 198" fill="none" stroke="#6c4a1d" strokeOpacity="0.65" strokeWidth="3" />

          <path d="M226 650V405C226 250 315 172 430 172s204 78 204 233v245" fill="none" stroke="#05080e" strokeWidth="18" opacity="0.96" />
        </g>
      </svg>

      <div className="absolute bottom-0 left-0 h-[38%] w-[60%] bg-[radial-gradient(ellipse_at_bottom,rgba(32,54,84,0.32),transparent_70%)] blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#05080d]/90 to-transparent" />
    </div>
  );
}
