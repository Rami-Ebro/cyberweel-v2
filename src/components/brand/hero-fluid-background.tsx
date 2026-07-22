type HeroFluidBackgroundProps = {
  className?: string;
};

export function HeroFluidBackground({ className = "" }: HeroFluidBackgroundProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#0b101b] ${className}`}
    >
      {/* Deep ink base with a restrained central glow. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 72% at 72% 34%, rgba(31,42,62,0.86), transparent 68%), radial-gradient(70% 58% at 12% 86%, rgba(184,154,90,0.12), transparent 72%), linear-gradient(135deg, #090e18 0%, #111827 54%, #080d16 100%)",
        }}
      />

      {/* Broad shadowed ribbon, inspired by the card's flowing dark layers. */}
      <div
        className="absolute -bottom-[34%] -left-[22%] h-[86%] w-[132%] -rotate-[7deg] rounded-[48%_52%_0_0/68%_74%_0_0] blur-[1px]"
        style={{
          background:
            "radial-gradient(62% 88% at 20% 72%, rgba(2,6,14,0.94), transparent 72%), radial-gradient(58% 86% at 50% 68%, rgba(28,38,56,0.78), transparent 75%), radial-gradient(48% 76% at 78% 64%, rgba(184,154,90,0.16), transparent 76%)",
        }}
      />

      {/* Satin highlight: visible enough to define the flow, never glossy or watery. */}
      <div
        className="absolute bottom-[8%] -left-[13%] h-[46%] w-[92%] rotate-[2deg] skew-x-[-9deg] rounded-[52%_58%_0_0/74%_80%_0_0] border-t border-[#b89a5a]/30 opacity-90"
        style={{
          background:
            "linear-gradient(164deg, transparent 18%, rgba(216,210,196,0.055) 38%, rgba(247,243,235,0.12) 49%, transparent 72%), linear-gradient(180deg, rgba(184,154,90,0.055), transparent 62%)",
        }}
      />

      {/* Fine gold contour taken from the card's premium accent language. */}
      <div className="absolute bottom-[22%] -left-[8%] h-[27%] w-[78%] -rotate-[2deg] rounded-[50%] border-t border-[#b89a5a]/35" />

      {/* Quiet light around the logo side. */}
      <div className="absolute -right-[14%] top-[4%] h-[58%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(184,154,90,0.12),rgba(184,154,90,0.035)_38%,transparent_70%)] blur-3xl" />

      {/* Very subtle grain, made only with CSS. */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(247,243,235,0.22) 0.7px, transparent 0.8px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070b13]/75 to-transparent" />
    </div>
  );
}
