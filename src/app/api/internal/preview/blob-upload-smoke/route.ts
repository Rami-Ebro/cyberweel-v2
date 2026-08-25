import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const expectedBranch = "feat/stage-partner-assignment-workflow";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== expectedBranch) {
    return new NextResponse(null, { status: 404 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, reason: "blob-token-missing" }, { status: 503 });
  }

  try {
    const blob = await put(`partner-upload-smoke/${Date.now()}.txt`, "CyberWeel Preview blob smoke test", {
      access: "private",
      token,
      addRandomSuffix: true,
      contentType: "text/plain",
    });
    return NextResponse.json({ ok: true, pathname: blob.pathname, contentType: blob.contentType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "blob-smoke-failed";
    console.error("[blob-upload-smoke] failed", message);
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}
