import { formatDate, formatDateTime } from "@/lib/date-format";
import { cn } from "@/lib/utils";

type DateTextProps = {
  value: string | Date | null | undefined;
  withTime?: boolean;
  fallback?: string;
  className?: string;
};

/** Keeps numeric dates readable when they appear inside Arabic (RTL) content. */
export function DateText({
  value,
  withTime = false,
  fallback = "—",
  className,
}: DateTextProps) {
  if (!value) return <span className={className}>{fallback}</span>;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return <span className={className}>{fallback}</span>;

  return (
    <time
      dateTime={date.toISOString()}
      dir="ltr"
      lang="en-CA"
      className={cn("inline-block whitespace-nowrap text-left tabular-nums [unicode-bidi:isolate]", className)}
    >
      {withTime ? formatDateTime(date, fallback) : formatDate(date, fallback)}
    </time>
  );
}
