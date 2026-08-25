import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ assignmentId: string; submissionId: string; fileName: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { assignmentId, submissionId } = await context.params;
  const index = request.nextUrl.searchParams.get("index") || "0";
  const target = new URL(
    `/api/partner/stage-assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}/file`,
    request.url,
  );
  target.searchParams.set("index", index);
  return NextResponse.redirect(target, { status: 307 });
}
