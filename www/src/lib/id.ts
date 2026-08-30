const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Short, sortable-ish, URL-safe id: base36 timestamp + 8 random chars. */
export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let random = "";
  for (const byte of bytes) random += ALPHABET[byte % ALPHABET.length];
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export function randomToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return base64UrlEncode(buf);
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return toHex(digest);
}
