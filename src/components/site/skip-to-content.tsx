"use client";

type SkipToContentProps = {
  label: string;
  targetId?: string;
};

export function SkipToContent({ label, targetId = "main" }: SkipToContentProps) {
  const skip = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "auto", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={skip}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-floral"
    >
      {label}
    </button>
  );
}
