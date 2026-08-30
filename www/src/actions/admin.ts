"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  countAdmins,
  createAdmin,
  login,
  logout,
  requireAdmin,
  startSessionFor,
} from "@/lib/auth";
import { getEnv, siteUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { replyEmail } from "@/lib/email/templates";
import {
  addNote,
  getInquiry,
  recordReply,
  setInquiryStatus,
} from "@/lib/inquiries";
import { isInquiryStatus } from "@/lib/inquiry-status";
import { checkPasswordStrength, hashPassword } from "@/lib/password";
import { parseEmail } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

/** Only allow relative paths back into the admin area. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

/* ------------------------------ auth ------------------------------ */

export async function loginAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const email = parseEmail(form.get("email"));
  const password = form.get("password");
  const next = safeNext(form.get("next"));

  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter your email address and password." };
  }

  const result = await login(email, password);
  if (!result.ok) return { error: result.error };

  redirect(next);
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/**
 * First-run account creation. Guarded twice: the setup token must match, and
 * it stops working the moment an account exists.
 */
export async function setupAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const env = await getEnv();
  const setupToken = env.ADMIN_SETUP_TOKEN;

  if (!setupToken) {
    return {
      error:
        "Setup is closed. Set the ADMIN_SETUP_TOKEN secret before creating the first account.",
    };
  }
  if ((await countAdmins()) > 0) {
    return { error: "An account already exists. Sign in instead." };
  }
  if (form.get("token") !== setupToken) {
    return { error: "That setup token isn't right." };
  }

  const email = parseEmail(form.get("email"));
  const name = typeof form.get("name") === "string" ? String(form.get("name")).trim() : "";
  const password = form.get("password");
  const confirm = form.get("confirm");

  if (!email) return { error: "Enter a valid email address." };
  if (!name) return { error: "Enter the name replies should be signed with." };
  if (typeof password !== "string" || typeof confirm !== "string") {
    return { error: "Enter and confirm a password." };
  }
  if (password !== confirm) return { error: "Those passwords don't match." };

  const weakness = checkPasswordStrength(password);
  if (weakness) return { error: weakness };

  const user = await createAdmin({
    email,
    name,
    passwordHash: await hashPassword(password),
  });
  await startSessionFor(user.id);

  redirect("/admin");
}

/* ---------------------------- inquiries --------------------------- */

export async function updateStatusAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = String(form.get("inquiryId") ?? "");
  const status = String(form.get("status") ?? "");

  if (!id || !isInquiryStatus(status)) return { error: "Unknown status." };

  await setInquiryStatus(id, status);
  revalidatePath("/admin");
  revalidatePath(`/admin/inquiries/${id}`);
  return { notice: "Status updated." };
}

export async function addNoteAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = String(form.get("inquiryId") ?? "");
  const body = typeof form.get("body") === "string" ? String(form.get("body")).trim() : "";

  if (!id) return { error: "Missing inquiry." };
  if (!body) return { error: "Write something first." };
  if (body.length > 4000) return { error: "Keep notes under 4000 characters." };

  await addNote({ inquiryId: id, authorId: admin.id, authorName: admin.name, body });
  revalidatePath(`/admin/inquiries/${id}`);
  return { notice: "Note saved. Only you can see it." };
}

export async function sendReplyAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = String(form.get("inquiryId") ?? "");
  const subjectRaw =
    typeof form.get("subject") === "string"
      ? String(form.get("subject")).replace(/[\r\n]+/g, " ").trim().slice(0, 200)
      : "";
  const body =
    typeof form.get("body") === "string" ? String(form.get("body")).trim() : "";

  if (!id) return { error: "Missing inquiry." };
  if (!body) return { error: "Write the reply first." };
  if (body.length > 10_000) return { error: "That reply is too long to send." };

  const inquiry = await getInquiry(id);
  if (!inquiry) return { error: "That inquiry no longer exists." };

  const env = await getEnv();
  const headerList = await headers();
  const site = siteUrl(env, headerList.get("origin") ?? undefined);
  const subject = subjectRaw || `Re: your note about ${inquiry.business}`;

  const message = replyEmail(
    {
      to: inquiry.email,
      recipientName: inquiry.name,
      subject,
      body,
      authorName: admin.name,
    },
    site,
  );

  const result = await sendEmail(env, {
    to: inquiry.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: env.MAIL_REPLY_TO || admin.email,
  });

  await recordReply({
    inquiryId: id,
    authorId: admin.id,
    authorName: admin.name,
    subject,
    body,
    delivery: result.ok ? "sent" : "failed",
    providerId: result.ok ? result.id : null,
    error: result.ok ? null : result.error,
  });

  if (!result.ok) {
    revalidatePath(`/admin/inquiries/${id}`);
    return { error: `The reply was saved but not sent — ${result.error}` };
  }

  await setInquiryStatus(id, "replied");
  revalidatePath("/admin");
  revalidatePath(`/admin/inquiries/${id}`);

  return {
    notice:
      result.mode === "sent"
        ? `Sent to ${inquiry.email}.`
        : `Saved, but no email provider is configured — nothing was actually sent to ${inquiry.email}.`,
  };
}
