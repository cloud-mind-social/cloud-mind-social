"use server";

import { headers } from "next/headers";

import { getEnv, siteUrl } from "@/lib/env";
import { getDb } from "@/lib/env";
import { consumeRateLimit, hashIp, purgeExpiredRateLimits } from "@/lib/rate-limit";
import { createInquiry } from "@/lib/inquiries";
import { sendEmail } from "@/lib/email/send";
import { inquiryAlertEmail, inquiryReceivedEmail } from "@/lib/email/templates";
import { parseInquiry } from "@/lib/validation";
import type { InquiryFormState } from "@/lib/form-state";

const GENERIC_FAILURE =
  "Something went wrong on our end. Please try again, or email us directly.";

export async function submitInquiry(
  _prev: InquiryFormState,
  form: FormData,
): Promise<InquiryFormState> {
  // Honeypot: a real person never fills a field they can't see.
  if (typeof form.get("company_website") === "string" && form.get("company_website")) {
    return { status: "success" };
  }

  const { data, errors } = parseInquiry(form);
  if (!data) {
    return {
      status: "error",
      message: "A couple of fields need another look.",
      errors,
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
      };
    }

    const inquiry = await createInquiry({ ...data, ipHash, userAgent });

    const origin = headerList.get("origin") ?? undefined;
    const site = siteUrl(env, origin);
    const summary = {
      id: inquiry.id,
      name: inquiry.name,
      business: inquiry.business,
      email: inquiry.email,
      phone: inquiry.phone,
      stage: inquiry.stage,
      message: inquiry.message,
      createdAt: inquiry.created_at,
    };

    const acknowledgement = inquiryReceivedEmail(summary, site);
    const alert = inquiryAlertEmail(summary, site);
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

    if (ack.status === "rejected" || (ack.status === "fulfilled" && !ack.value.ok)) {
      console.error("[inquiry] acknowledgement email failed", ack);
    }
    if (notify.status === "rejected" || (notify.status === "fulfilled" && !notify.value.ok)) {
      console.error("[inquiry] alert email failed", notify);
    }

    await purgeExpiredRateLimits(db);

    return { status: "success" };
  } catch (error) {
    console.error("[inquiry] submission failed", error);
    return { status: "error", message: GENERIC_FAILURE };
  }
}
