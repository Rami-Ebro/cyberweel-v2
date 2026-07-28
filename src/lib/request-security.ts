import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RateLimitOptions = {
  action: string;
  subject?: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function securitySecret() {
  const value =
    process.env.RATE_LIMIT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("A 32+ character rate-limit or authentication secret is required");
  }
  return value;
}

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function subjectHash(value: string) {
  return createHmac("sha256", securitySecret())
    .update(value)
    .digest("hex");
}

export function safeSecretEqual(actual: string | null, expected: string | undefined) {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export async function consumeRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  return consumeRateLimitSubject({
    ...options,
    subject: `${clientIp(request)}:${options.subject ?? ""}`,
  });
}

export async function consumeRateLimitSubject(
  options: RateLimitOptions & { subject: string },
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / options.windowMs) * options.windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + options.windowMs * 2);
  const hashedSubject = subjectHash(options.subject);

  const bucket = await db.rateLimitBucket.upsert({
    where: {
      action_subjectHash_windowStart: {
        action: options.action,
        subjectHash: hashedSubject,
        windowStart,
      },
    },
    create: {
      action: options.action,
      subjectHash: hashedSubject,
      windowStart,
      expiresAt,
    },
    update: {
      count: { increment: 1 },
      expiresAt,
    },
    select: { count: true },
  });

  // Keep the table bounded without adding latency to every request.
  if (Math.random() < 0.01) {
    void db.rateLimitBucket
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => undefined);
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStartMs + options.windowMs - now) / 1000),
  );

  return {
    allowed: bucket.count <= options.limit,
    limit: options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds,
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
  message = "محاولات كثيرة. حاول مجددًا لاحقًا.",
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

export function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function invalidOriginResponse() {
  return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
}
