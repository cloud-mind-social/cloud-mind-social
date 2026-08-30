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
  | { ok: false; error: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function mailFrom(env: AppEnv): string {
  return env.MAIL_FROM || "Cloud Mind Social <onboarding@resend.dev>";
}

/**
 * Sends through Resend's HTTP API — the Workers runtime has no TCP, so SMTP
 * isn't an option. Without an API key the message is logged instead of sent,
 * which keeps local development zero-config; the mode is returned either way
 * so callers can be honest about what actually happened.
 */
export async function sendEmail(
  env: AppEnv,
  message: EmailMessage,
): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not set — logging instead of sending.\n` +
        `  to: ${message.to}\n  subject: ${message.subject}\n\n${message.text}`,
    );
    return { ok: true, id: null, mode: "logged" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom(env),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        ok: false,
        error: `Resend returned ${response.status}: ${detail.slice(0, 400)}`,
      };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, id: payload.id ?? null, mode: "sent" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email failure.",
    };
  }
}
