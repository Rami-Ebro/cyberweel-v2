type HeroFluidBackgroundProps = {
  className?: string;
};

export function HeroFluidBackground({ className = "" }: HeroFluidBackgroundProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(184,154,90,0.10),transparent_60%)]" />

      <div
        className="absolute -bottom-[28%] -left-[18%] h-[78%] w-[118%] rotate-[-4deg] rounded-[48%_52%_0_0/62%_68%_0_0] opacity-80 blur-[2px]"
        style={{
          background:
            "radial-gradient(70% 95% at 22% 78%, rgba(17,24,39,0.055), transparent 72%), radial-gradient(62% 82% at 48% 72%, rgba(216,210,196,0.48), transparent 75%), radial-gradient(58% 76% at 73% 68%, rgba(184,154,90,0.10), transparent 74%)",
        }}
      />

      <div
        className="absolute bottom-[7%] -left-[8%] h-[42%] w-[82%] rotate-[2deg] skew-x-[-7deg] rounded-[50%_56%_0_0/70%_76%_0_0] border-t border-camel/20 opacity-70"
        style={{
          background:
            "linear-gradient(165deg, transparent 22%, rgba(255,255,255,0.42) 46%, transparent 70%), linear-gradient(178deg, rgba(216,210,196,0.16), transparent 65%)",
        }}
      />

      <div className="absolute -right-[12%] top-[8%] h-[44%] w-[48%] rounded-full bg-[radial-gradient(circle,rgba(184,154,90,0.08),transparent_68%)] blur-2xl" />

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
    </div>
  );
}
