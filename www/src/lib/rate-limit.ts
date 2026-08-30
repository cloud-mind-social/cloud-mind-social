import { sha256Hex } from "@/lib/id";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window counter in D1. Good enough for a low-volume marketing site and
 * it needs no extra infrastructure — the window row simply expires.
 */
export async function consumeRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + windowSeconds;

  try {
    // Reset the row first if its window has already closed, then increment.
    await db
      .prepare("DELETE FROM rate_limits WHERE key = ?1 AND expires_at <= ?2")
      .bind(key, now)
      .run();

    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, count, expires_at)
         VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET count = count + 1
         RETURNING count, expires_at`,
      )
      .bind(key, expiresAt)
      .first<{ count: number; expires_at: number }>();

    const count = row?.count ?? 1;
    const windowEnd = row?.expires_at ?? expiresAt;

    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Math.max(1, windowEnd - now),
    };
  } catch {
    // Never let the limiter itself take the form down.
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

export async function clearRateLimit(db: D1Database, key: string) {
  try {
    await db.prepare("DELETE FROM rate_limits WHERE key = ?1").bind(key).run();
  } catch {
    // Non-fatal.
  }
}

/** Opportunistic cleanup so the table can't grow without bound. */
export async function purgeExpiredRateLimits(db: D1Database) {
  try {
    await db
      .prepare("DELETE FROM rate_limits WHERE expires_at <= ?1")
      .bind(Math.floor(Date.now() / 1000))
      .run();
  } catch {
    // Non-fatal.
  }
}

/** Salted hash — lets us rate-limit and audit by IP without storing one. */
export async function hashIp(ip: string | null, salt?: string): Promise<string | null> {
  if (!ip) return null;
  return sha256Hex(`${salt ?? "cms"}:${ip}`);
}
