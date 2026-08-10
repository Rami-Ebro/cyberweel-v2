const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parseDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateParts(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("/");
}

/** Displays every date consistently as year/month/day. */
export function formatDate(value: string | Date | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const date = parseDate(value);
  return date ? dateParts(date) : fallback;
}

/** Displays date and 24-hour time as year/month/day، hour:minute. */
export function formatDateTime(value: string | Date | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const date = parseDate(value);
  return date ? `${dateParts(date)}, ${timeFormatter.format(date)}` : fallback;
}
