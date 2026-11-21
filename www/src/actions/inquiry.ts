"use server";

import { headers } from "next/headers";

import { getEnv, siteUrl } from "@/lib/env";
import { getDb } from "@/lib/env";
import { consumeRateLimit, hashIp, purgeExpiredRateLimits } from "@/lib/rate-limit";
import { createInquiry, recordAcknowledgement } from "@/lib/inquiries";
import { sendEmail } from "@/lib/email/send";
import { inquiryAlertEmail, inquiryReceivedEmail } from "@/lib/email/templates";
import { isIntakeRoute } from "@/lib/intake";
import { parseInquiry } from "@/lib/validation";
import type { InquiryFormState } from "@/lib/form-state";

const GENERIC_FAILURE =
  "Something went wrong on our end. Please try again, or email us directly.";

/** Visible fields echoed back on an error. Hidden and honeypot fields aren't. */
const ECHOED = [
  "name",
  "email",
  "business",
  "phone",
  "profile",
  "role",
  "stage",
  "message",
  "consequence",
  "why_now",
  "decision",
  "timing",
] as const;

function echo(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of ECHOED) {
    const value = form.get(key);
    if (typeof value === "string" && value) values[key] = value.slice(0, 4000);
  }
  return values;
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export async function submitInquiry(
  _prev: InquiryFormState,
  form: FormData,
): Promise<InquiryFormState> {
  const routeField = form.get("route");
  const route =
    typeof routeField === "string" && isIntakeRoute(routeField) ? routeField : undefined;

  // Honeypot: a real person never fills a field they can't see.
  if (typeof form.get("company_website") === "string" && form.get("company_website")) {
    return { status: "success", route };
  }

  const { data, errors } = parseInquiry(form);
  if (!data) {
    return {
      status: "error",
      message: "A couple of fields need another look.",
      errors,
      route,
      values: echo(form),
    };
  }

  try {
    const env = await getEnv();
    const db = await getDb();
    const headerList = await headers();

    const ip =
      headerList.get("cf-connecting-ip") ?? headerList.get("x-forwarded-for");
    const ipHash = await hashIp(ip, env.IP_HASH_SALT);
    const userAgent = headerList.get("user-agent")?.slice(0, 300) ?? null;

    const limit = await consumeRateLimit(
      db,
      `inquiry:${ipHash ?? data.email}`,
      5,
      60 * 60,
    );
    if (!limit.ok) {
      return {
        status: "error",
        message:
          "We've already got a few requests from you. Give us a chance to reply to those first.",
        route,
        values: echo(form),
      };
    }

    const inquiry = await createInquiry({ ...data, ipHash, userAgent });

    const origin = headerList.get("origin") ?? undefined;
    const site = siteUrl(env, origin);

    const acknowledgement = inquiryReceivedEmail(inquiry, site);
    const alert = inquiryAlertEmail(inquiry, site);
    const notifyTo = env.INQUIRY_NOTIFY_TO || env.MAIL_REPLY_TO;

    // The inquiry is already saved; email problems must not lose it.
    const [ack, notify] = await Promise.allSettled([
      sendEmail(env, {
        to: inquiry.email,
        subject: acknowledgement.subject,
        html: acknowledgement.html,
        text: acknowledgement.text,
        replyTo: env.MAIL_REPLY_TO,
      }),
      notifyTo
        ? sendEmail(env, {
            to: notifyTo,
            subject: alert.subject,
            html: alert.html,
            text: alert.text,
            replyTo: inquiry.email,
          })
        : Promise.resolve({ ok: true as const, id: null, mode: "logged" as const }),
    ]);

    // Record how the acknowledgement went, so the inbox can say "we never
    // reached them" instead of showing an inquiry that looks fully handled.
    // Until a sending domain is onboarded this fails for every real address
    // with E_RECIPIENT_NOT_ALLOWED, and that was previously invisible outside
    // the Worker logs.
    if (ack.status === "rejected") {
      console.error("[inquiry] acknowledgement email failed", ack.reason);
      await recordAcknowledgement(inquiry.id, "failed", messageOf(ack.reason));
    } else if (!ack.value.ok) {
      console.error("[inquiry] acknowledgement email failed", ack.value.error);
      await recordAcknowledgement(inquiry.id, "failed", ack.value.error);
    } else {
      await recordAcknowledgement(inquiry.id, ack.value.mode, null);
    }
    if (notify.status === "rejected" || (notify.status === "fulfilled" && !notify.value.ok)) {
      console.error("[inquiry] alert email failed", notify);
    }

    await purgeExpiredRateLimits(db);

    return { status: "success", route: data.route };
  } catch (error) {
    console.error("[inquiry] submission failed", error);
    return { status: "error", message: GENERIC_FAILURE, route, values: echo(form) };
  }
}
