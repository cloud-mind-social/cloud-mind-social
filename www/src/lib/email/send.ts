import "server-only";

import type { AppEnv } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string | null; mode: "sent" | "logged" }
  | { ok: false; error: string; code?: string };

/**
 * Splits `Display Name <address@example.com>` into the shape the binding wants.
 * A bare address is returned as-is.
 */
export function parseAddress(value: string): string | EmailAddress {
  const match = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(value);
  if (!match) return value.trim();
  const [, name, email] = match;
  return name ? { name, email } : email;
}

export function mailFrom(env: AppEnv): string {
  return env.MAIL_FROM || "Cloud Mind Social <hello@cloudmindsocial.com>";
}

/** Cloudflare surfaces failures as an Error carrying a machine-readable code. */
function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

/**
 * A short explanation for the codes that are actually actionable from the
 * inbox, so a failed reply says what to fix rather than just failing.
 */
function explain(code: string | undefined, fallback: string): string {
  switch (code) {
    case "E_SENDER_NOT_VERIFIED":
    case "E_SENDER_DOMAIN_NOT_AVAILABLE":
      return `the sending domain isn't onboarded to Cloudflare Email Sending yet (${code}).`;
    case "E_RECIPIENT_NOT_ALLOWED":
      return "that address isn't a verified destination, and no sending domain is onboarded yet — until one is, mail can only go to verified addresses.";
    case "E_RECIPIENT_SUPPRESSED":
      return "that address is on the account suppression list, usually after a hard bounce or a spam report.";
    case "E_DAILY_LIMIT_EXCEEDED":
    case "E_RATE_LIMIT_EXCEEDED":
      return `the account's sending limit was hit (${code}). It'll clear on its own.`;
    case "E_DELIVERY_FAILED":
      return "the receiving mail server rejected it.";
    default:
      return fallback;
  }
}

/**
 * Sends through Cloudflare Email Sending via the `EMAIL` binding — the Workers
 * runtime has no TCP, so SMTP isn't an option, and the binding avoids needing
 * a third-party API key at all.
 *
 * Without the binding (or under `next dev`, where the platform proxy doesn't
 * provide it) the message is logged instead of sent. The mode comes back
 * either way so callers can be honest about what actually happened.
 */
export async function sendEmail(
  env: AppEnv,
  message: EmailMessage,
): Promise<SendResult> {
  if (!env.EMAIL) {
    console.warn(
      `[email] No EMAIL binding — logging instead of sending.\n` +
        `  to: ${message.to}\n  subject: ${message.subject}\n\n${message.text}`,
    );
    return { ok: true, id: null, mode: "logged" };
  }

  try {
    const result = await env.EMAIL.send({
      to: message.to,
      from: parseAddress(mailFrom(env)),
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: parseAddress(message.replyTo) } : {}),
    });
    return { ok: true, id: result.messageId, mode: "sent" };
  } catch (error) {
    const code = errorCode(error);
    const detail = error instanceof Error ? error.message : "Unknown email failure.";
    return { ok: false, error: explain(code, detail), code };
  }
}
