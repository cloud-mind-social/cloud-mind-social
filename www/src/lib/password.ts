/**
 * Password hashing built on Web Crypto only, so the exact same code runs in
 * the Cloudflare Workers runtime and in Node (see scripts/create-admin.ts).
 *
 * Encoded form: pbkdf2.sha256.<iterations>.<salt-b64url>.<hash-b64url>
 * The iteration count travels with the hash, so it can be raised later without
 * invalidating existing passwords. The separator is "." rather than the more
 * conventional "$" because these hashes get pasted into shell commands during
 * a password reset, and "$" would be expanded there.
 */

const SEPARATOR = ".";
const ALGORITHM = "pbkdf2";
const DIGEST = "sha256";
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function b64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // BufferSource in a fresh ArrayBuffer keeps TS happy across lib targets.
      salt: new Uint8Array(salt).buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return [
    ALGORITHM,
    DIGEST,
    ITERATIONS,
    b64UrlEncode(salt),
    b64UrlEncode(hash),
  ].join(SEPARATOR);
}

/** Length-independent, value-constant-time comparison. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const parts = encoded.split(SEPARATOR);
  if (parts.length !== 5) return false;
  const [algorithm, digest, iterationsRaw, saltRaw, hashRaw] = parts;
  if (algorithm !== ALGORITHM || digest !== DIGEST) return false;

  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isSafeInteger(iterations) || iterations < 1_000) return false;

  try {
    const expected = b64UrlDecode(hashRaw);
    const actual = await derive(password, b64UrlDecode(saltRaw), iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export type PasswordProblem = string | null;

/** Deliberately simple: length does more for safety here than character classes. */
export function checkPasswordStrength(password: string): PasswordProblem {
  if (password.length < 12) {
    return "Use at least 12 characters — length matters more than symbols.";
  }
  if (password.length > 200) {
    return "That password is too long (200 characters max).";
  }
  if (!/[^\s]/.test(password)) return "Password can't be only whitespace.";
  return null;
}
