export const MAX_SUBMISSION_FILES = 20;
export const MAX_SUBMISSION_LINKS = 20;
export const MAX_SUBMISSION_FILE_SIZE = 25 * 1024 * 1024;

export const SUBMISSION_ALLOWED_CONTENT_TYPES = [
  "application/octet-stream",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
];

export const SUBMISSION_ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "zip", "png", "jpg", "jpeg", "webp", "txt",
]);

export function cleanSubmissionFilename(value: string) {
  return value.replace(/[\r\n"]/g, "").trim().slice(0, 180) || "client-file";
}

export function clientSubmissionBlobPrefix(clientId: string, submissionId: string) {
  return `clients/${clientId}/submissions/${submissionId}/`;
}

function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseSubmissionLinks(value: unknown) {
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : [];
  const trimmed = raw.map((item) => item.trim()).filter(Boolean);
  const normalized = trimmed.map((item) => ({ item, url: normalizeLink(item) }));
  return {
    links: [...new Set(normalized.flatMap(({ url }) => url ? [url] : []))].slice(0, MAX_SUBMISSION_LINKS),
    invalid: normalized.filter(({ url }) => !url).map(({ item }) => item),
    tooMany: trimmed.length > MAX_SUBMISSION_LINKS,
  };
}

export function isVercelBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function isExpectedClientSubmissionBlobUrl(value: string, clientId: string, submissionId: string) {
  try {
    const url = new URL(value);
    const expectedPrefix = `/${clientSubmissionBlobPrefix(clientId, submissionId)}`;
    return url.protocol === "https:"
      && url.hostname.endsWith(".private.blob.vercel-storage.com")
      && url.pathname.startsWith(expectedPrefix);
  } catch {
    return false;
  }
}
