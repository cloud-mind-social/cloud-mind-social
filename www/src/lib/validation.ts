import { journeyStages } from "@/lib/data";

export type FieldErrors = Record<string, string>;

export type InquiryInput = {
  name: string;
  business: string;
  email: string;
  phone: string | null;
  stage: string;
  message: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = {
  name: 120,
  business: 160,
  email: 254,
  phone: 40,
  message: 4000,
} as const;

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function cleanMultiline(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseInquiry(form: FormData): {
  data?: InquiryInput;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};

  const name = clean(form.get("name"));
  const business = clean(form.get("business"));
  const email = clean(form.get("email")).toLowerCase();
  const phone = clean(form.get("phone"));
  const stage = clean(form.get("stage"));
  const message = cleanMultiline(form.get("message"));

  if (!name) errors.name = "Tell us who we're talking to.";
  else if (name.length > LIMITS.name) errors.name = "That name is too long.";

  if (!business) errors.business = "Add the business name.";
  else if (business.length > LIMITS.business)
    errors.business = "That business name is too long.";

  if (!email) errors.email = "We need an email to reply to.";
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email))
    errors.email = "That email address doesn't look right.";

  if (phone && phone.length > LIMITS.phone)
    errors.phone = "That phone number is too long.";

  if (!stage) errors.stage = "Pick where the business is right now.";
  else if (!(journeyStages as readonly string[]).includes(stage))
    errors.stage = "Pick one of the listed options.";

  if (message.length > LIMITS.message)
    errors.message = "Please keep this under 4000 characters.";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      name,
      business,
      email,
      phone: phone || null,
      stage,
      message: message || null,
    },
    errors: {},
  };
}

export function parseEmail(value: FormDataEntryValue | null): string | null {
  const email = clean(value).toLowerCase();
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) return null;
  return email;
}
