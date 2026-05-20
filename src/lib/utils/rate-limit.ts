import { NextRequest, NextResponse } from "next/server";

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  req: NextRequest,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `rl:${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const entry = inMemoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) },
      }
    );
  }

  entry.count += 1;
  return null;
}
