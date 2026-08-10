const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parseDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Displays every date consistently as day/month/year. */
export function formatDate(value: string | Date | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : fallback;
}

/** Displays date and 24-hour time as day/month/year، hour:minute. */
export function formatDateTime(value: string | Date | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const date = parseDate(value);
  return date ? `${dateFormatter.format(date)}, ${timeFormatter.format(date)}` : fallback;
}
