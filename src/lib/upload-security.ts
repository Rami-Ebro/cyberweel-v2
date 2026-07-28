const MIME_EXTENSIONS: Record<string, Set<string>> = {
  "application/pdf": new Set(["pdf"]),
  "application/msword": new Set(["doc"]),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    new Set(["docx"]),
  "application/vnd.ms-excel": new Set(["xls"]),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    new Set(["xlsx"]),
  "image/png": new Set(["png"]),
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/webp": new Set(["webp"]),
};

function startsWith(buffer: Buffer, bytes: number[]) {
  return (
    buffer.length >= bytes.length &&
    bytes.every((value, index) => buffer[index] === value)
  );
}

function hasZipEntry(buffer: Buffer, prefix: string) {
  return buffer.includes(Buffer.from(prefix, "utf8"));
}

function isZip(buffer: Buffer) {
  return (
    startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

function hasExpectedSignature(buffer: Buffer, mime: string) {
  switch (mime) {
    case "application/pdf":
      return (
        buffer.subarray(0, 5).toString("ascii") === "%PDF-" &&
        buffer.subarray(Math.max(0, buffer.length - 2048)).includes(Buffer.from("%%EOF"))
      );
    case "image/png":
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return (
        startsWith(buffer, [0xff, 0xd8, 0xff]) &&
        buffer.length >= 2 &&
        buffer[buffer.length - 2] === 0xff &&
        buffer[buffer.length - 1] === 0xd9
      );
    case "image/webp":
      return (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "application/msword":
    case "application/vnd.ms-excel":
      return startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return (
        isZip(buffer) &&
        hasZipEntry(buffer, "[Content_Types].xml") &&
        hasZipEntry(buffer, "word/")
      );
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return (
        isZip(buffer) &&
        hasZipEntry(buffer, "[Content_Types].xml") &&
        hasZipEntry(buffer, "xl/")
      );
    default:
      return false;
  }
}

export function validateUploadedFile(
  filename: string,
  declaredMime: string,
  buffer: Buffer,
) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const allowedExtensions = MIME_EXTENSIONS[declaredMime];
  if (!allowedExtensions?.has(extension)) return false;
  return hasExpectedSignature(buffer, declaredMime);
}
