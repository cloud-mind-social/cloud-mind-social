import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

import { getDb, getEnv } from "@/lib/env";
import { newId, randomToken, sha256Hex } from "@/lib/id";
import { verifyPassword } from "@/lib/password";
import { clearRateLimit, consumeRateLimit, hashIp } from "@/lib/rate-limit";

export const SESSION_COOKIE = "cms_admin_session";
const SESSION_DAYS = 14;

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

type SessionRow = AdminUser & { session_id: string };

/**
 * Deduped per request — the admin layout and any server action in the same
 * render each call this, but only one D1 round-trip happens.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const tokenHash = await sha256Hex(token);

  const row = await db
    .prepare(
      `SELECT s.id AS session_id, u.id, u.email, u.name
         FROM sessions s
         JOIN admin_users u ON u.id = s.user_id
        WHERE s.token_hash = ?1
          AND s.expires_at > datetime('now')`,
    )
    .bind(tokenHash)
    .first<SessionRow>();

  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name };
});

export async function requireAdmin(returnTo?: string): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const target = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/admin/login${target}`);
  }
  return admin;
}

async function issueSession(userId: string) {
  const db = await getDb();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const headerList = await headers();
  const userAgent = headerList.get("user-agent")?.slice(0, 300) ?? null;

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent)
       VALUES (?1, ?2, ?3, datetime('now', ?4), ?5)`,
    )
    .bind(newId("ses"), userId, tokenHash, `+${SESSION_DAYS} days`, userAgent)
    .run();

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  // Housekeeping: drop this user's expired rows while we're here.
  await db
    .prepare("DELETE FROM sessions WHERE user_id = ?1 AND expires_at <= datetime('now')")
    .bind(userId)
    .run();
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const db = await getDb();
  const env = await getEnv();
  const headerList = await headers();
  const ip = headerList.get("cf-connecting-ip") ?? headerList.get("x-forwarded-for");
  const ipKey = (await hashIp(ip, env.IP_HASH_SALT)) ?? "unknown";

  // Two windows: one per address being targeted, one per origin doing the trying.
  const perAccount = await consumeRateLimit(db, `login:acct:${email}`, 8, 15 * 60);
  const perIp = await consumeRateLimit(db, `login:ip:${ipKey}`, 20, 15 * 60);

  if (!perAccount.ok || !perIp.ok) {
    const minutes = Math.ceil(
      Math.max(perAccount.retryAfterSeconds, perIp.retryAfterSeconds) / 60,
    );
    return {
      ok: false,
      error: `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const user = await db
    .prepare("SELECT id, email, name, password_hash FROM admin_users WHERE email = ?1")
    .bind(email)
    .first<{ id: string; email: string; name: string; password_hash: string }>();

  // Always run a verification so a missing account and a wrong password take
  // roughly the same time.
  const stored =
    user?.password_hash ??
    "pbkdf2.sha256.100000.AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const valid = await verifyPassword(password, stored);

  if (!user || !valid) {
    return { ok: false, error: "That email and password don't match." };
  }

  await issueSession(user.id);
  await db
    .prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?1")
    .bind(user.id)
    .run();

  await clearRateLimit(db, `login:acct:${email}`);
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = await getDb();
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?1")
      .bind(await sha256Hex(token))
      .run();
  }

  jar.delete(SESSION_COOKIE);
}

export async function countAdmins(): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM admin_users")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function createAdmin(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AdminUser> {
  const db = await getDb();
  const id = newId("usr");
  await db
    .prepare(
      `INSERT INTO admin_users (id, email, name, password_hash)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(id, input.email, input.name, input.passwordHash)
    .run();
  return { id, email: input.email, name: input.name };
}

/** Signs the given user in immediately after account creation. */
export async function startSessionFor(userId: string) {
  await issueSession(userId);
}
