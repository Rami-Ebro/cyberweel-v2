import { cn } from "@/lib/utils";

/**
 * Architectural arch motif derived from the CyberWeel logo geometry.
 * The arch = the system, the keystone = the catalyst, the vertical
 * white channel = activation/knowledge flow. Used as a quiet brand
 * accent — never as a replacement for the final logo PNG.
 */
export function ArchMotif({
  className,
  size = 120,
  onDark = false,
}: {
  className?: string;
  size?: number;
  onDark?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={cn(onDark ? "text-bone/25" : "text-bone", className)}
      aria-hidden
    >
      {/* arch outline */}
      <path
        d="M14 112 V60 a46 46 0 0 1 92 0 V112"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* inner arch line */}
      <path
        d="M24 112 V60 a36 36 0 0 1 72 0 V112"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      {/* keystone */}
      <path d="M52 16 L68 16 L64 28 L56 28 Z" fill="var(--camel)" />
      {/* activation channel */}
      <line
        x1="60"
        y1="18"
        x2="60"
        y2="28"
        stroke={onDark ? "var(--floral)" : "#FFFFFF"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Large architectural gateway — a segmented arch structure derived from
 * the logo's segmented-block geometry. Designed as a hero anchor /
 * background motif: the arch frames the logo, the keystone sits at the
 * crown, and segmented voussoirs echo the logo's block structure.
 * Architectural and intentional — never decorative noise.
 */
export function ArchGateway({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const stroke = onDark ? "rgba(247,243,235,0.55)" : "rgba(184,154,90,0.95)";
  const strokeSoft = onDark ? "rgba(247,243,235,0.30)" : "rgba(17,24,39,0.42)";
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      className={cn("h-full w-full", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {/* outer arch silhouette */}
      <path
        d="M70 560 V300 a230 230 0 0 1 460 0 V560"
        stroke={stroke}
        strokeWidth="1.5"
        fill="none"
      />
      {/* inner arch line */}
      <path
        d="M120 560 V300 a180 180 0 0 1 360 0 V560"
        stroke={strokeSoft}
        strokeWidth="1"
        fill="none"
      />

      {/* segmented voussoirs — left side (echoes the logo's segmented blocks) */}
      <g stroke={strokeSoft} strokeWidth="1" fill="none">
        <line x1="120" y1="300" x2="70" y2="300" />
        <line x1="135" y1="220" x2="92" y2="200" />
        <line x1="175" y1="155" x2="140" y2="120" />
        <line x1="230" y1="110" x2="210" y2="68" />
      </g>
      {/* segmented voussoirs — right side (mirrored) */}
      <g stroke={strokeSoft} strokeWidth="1" fill="none">
        <line x1="480" y1="300" x2="530" y2="300" />
        <line x1="465" y1="220" x2="508" y2="200" />
        <line x1="425" y1="155" x2="460" y2="120" />
        <line x1="370" y1="110" x2="390" y2="68" />
      </g>

      {/* vertical activation channel — the logo's knowledge-flow line,
          extended full height as a quiet architectural spine */}
      <line
        x1="300"
        y1="70"
        x2="300"
        y2="560"
        stroke={strokeSoft}
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* keystone at the crown */}
      <path d="M276 60 L324 60 L314 86 L286 86 Z" fill="var(--camel)" />
      <line
        x1="300"
        y1="62"
        x2="300"
        y2="86"
        stroke={onDark ? "var(--floral)" : "#FFFFFF"}
        strokeWidth="1.5"
      />

      {/* base plinth lines — grounds the arch architecturally */}
      <line x1="40" y1="560" x2="560" y2="560" stroke={stroke} strokeWidth="1.5" />
      <line x1="40" y1="572" x2="560" y2="572" stroke={strokeSoft} strokeWidth="1" />
    </svg>
  );
}

/** Hairline divider with a small centered keystone — tasteful section break. */
export function KeystoneDivider({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 py-2",
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "h-px w-16 sm:w-24",
          onDark ? "bg-floral/15" : "bg-border"
        )}
      />
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        <path d="M2 1 L12 1 L9 9 L5 9 Z" fill="var(--camel)" />
        <line x1="7" y1="2" x2="7" y2="9" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
      <span
        className={cn(
          "h-px w-16 sm:w-24",
          onDark ? "bg-floral/15" : "bg-border"
        )}
      />
    </div>
  );
}
