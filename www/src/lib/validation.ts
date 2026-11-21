/*
 * Relative `.ts` imports, not the `@/` alias, so `node --test` can load this
 * module directly (tsconfig allows importing .ts extensions).
 */
import {
  ROLES,
  ROUTE_FIELDS,
  TIMINGS,
  isIntakeRoute,
  journeyStages,
  type IntakeField,
  type IntakeRoute,
} from "./intake.ts";
import {
  decodeAnswers,
  encodeAnswers,
  isSignalResultKey,
  type SignalResultKey,
} from "./signal-check.ts";

export type FieldErrors = Record<string, string>;

/** Where the visitor came from, when the browser told us. Never required. */
export type Attribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  referrer: string | null;
  landingPath: string | null;
};

export type InquiryInput = {
  route: IntakeRoute;
  name: string;
  business: string;
  email: string;
  phone: string | null;
  /** Empty when the route didn't ask; the column predates optional stages. */
  stage: string;
  profile: string | null;
  role: string | null;
  /** "What's going on", in the visitor's own words. Kept in `message`. */
  message: string | null;
  consequence: string | null;
  whyNow: string | null;
  decision: string | null;
  timing: string | null;
  signalCategory: SignalResultKey | null;
  signalAnswers: string | null;
  attribution: Attribution;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = {
  name: 120,
  business: 160,
  email: 254,
  phone: 40,
  profile: 300,
  message: 4000,
  consequence: 2000,
  whyNow: 2000,
  decision: 2000,
  utm: 120,
  referrer: 500,
  landingPath: 300,
} as const;

/** Each intake field's input name in the form. */
export const FORM_KEYS: Record<IntakeField, string> = {
  profile: "profile",
  role: "role",
  stage: "stage",
  situation: "message",
  consequence: "consequence",
  whyNow: "why_now",
  decision: "decision",
  timing: "timing",
  phone: "phone",
};

const MULTILINE: readonly IntakeField[] = ["situation", "consequence", "whyNow", "decision"];

const TEXT_LIMITS: Partial<Record<IntakeField, number>> = {
  phone: LIMITS.phone,
  profile: LIMITS.profile,
  situation: LIMITS.message,
  consequence: LIMITS.consequence,
  whyNow: LIMITS.whyNow,
  decision: LIMITS.decision,
};

const CHOICES: Partial<Record<IntakeField, readonly string[]>> = {
  role: ROLES,
  stage: journeyStages,
  timing: TIMINGS,
};

const REQUIRED_MESSAGES: Record<IntakeField, string> = {
  profile: "Add a website or social profile.",
  role: "Pick the option closest to your role.",
  stage: "Pick where the business is right now.",
  situation: "Tell us a little about what's going on.",
  consequence: "Tell us what it's costing the business.",
  whyNow: "Tell us why now.",
  decision: "Tell us the decision in front of you.",
  timing: "Pick a timeframe.",
  phone: "Add a phone number.",
};

const ROUTE_REQUIRED_MESSAGES: Partial<Record<IntakeRoute, Partial<Record<IntakeField, string>>>> = {
  scoped: { situation: "Describe the piece of work." },
};

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function cleanMultiline(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Tracking values: printable, single line, bounded. Anything else is dropped. */
function cleanToken(value: FormDataEntryValue | null, max: number): string | null {
  const text = clean(value).replace(/[^\x20-\x7E]/g, "");
  return text ? text.slice(0, max) : null;
}

/**
 * Keeps only the origin and path of the referring page. Its query string can
 * carry someone else's identifiers, and nothing downstream needs it.
 */
export function cleanReferrer(value: FormDataEntryValue | null): string | null {
  const raw = clean(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}${url.pathname}`.slice(0, LIMITS.referrer);
  } catch {
    return null;
  }
}

/** A same-site path, without its query string or fragment. */
export function cleanLandingPath(value: FormDataEntryValue | null): string | null {
  const raw = clean(value);
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0];
  return path.slice(0, LIMITS.landingPath) || null;
}

function parseAttribution(form: FormData): Attribution {
  return {
    utmSource: cleanToken(form.get("utm_source"), LIMITS.utm),
    utmMedium: cleanToken(form.get("utm_medium"), LIMITS.utm),
    utmCampaign: cleanToken(form.get("utm_campaign"), LIMITS.utm),
    utmContent: cleanToken(form.get("utm_content"), LIMITS.utm),
    referrer: cleanReferrer(form.get("referrer")),
    landingPath: cleanLandingPath(form.get("landing_path")),
  };
}

export function parseInquiry(form: FormData): {
  data?: InquiryInput;
  errors: FieldErrors;
} {
  const routeRaw = clean(form.get("route"));
  if (!isIntakeRoute(routeRaw)) {
    return { errors: { route: "Pick what you'd like to ask for." } };
  }
  const route = routeRaw;
  const { asks, requires } = ROUTE_FIELDS[route];
  const errors: FieldErrors = {};

  const name = clean(form.get("name"));
  const business = clean(form.get("business"));
  const email = clean(form.get("email")).toLowerCase();

  if (!name) errors.name = "Tell us who we're talking to.";
  else if (name.length > LIMITS.name) errors.name = "That name is too long.";

  if (!business) errors.business = "Add the business name.";
  else if (business.length > LIMITS.business)
    errors.business = "That business name is too long.";

  if (!email) errors.email = "We need an email to reply to.";
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email))
    errors.email = "That email address doesn't look right.";

  // Only the fields this route asks for are read; anything else is ignored.
  const values = {} as Record<IntakeField, string>;
  for (const field of Object.keys(FORM_KEYS) as IntakeField[]) {
    const raw = form.get(FORM_KEYS[field]);
    values[field] = !asks.includes(field)
      ? ""
      : MULTILINE.includes(field)
        ? cleanMultiline(raw)
        : clean(raw);
  }

  for (const field of asks) {
    const key = FORM_KEYS[field];
    const value = values[field];
    const max = TEXT_LIMITS[field];
    const choices = CHOICES[field];

    if (!value) {
      if (requires.includes(field)) {
        errors[key] = ROUTE_REQUIRED_MESSAGES[route]?.[field] ?? REQUIRED_MESSAGES[field];
      }
    } else if (max !== undefined && value.length > max) {
      errors[key] =
        field === "phone" || field === "profile"
          ? "That's too long."
          : `Please keep this under ${max} characters.`;
    } else if (choices && !choices.includes(value)) {
      errors[key] = "Pick one of the listed options.";
    }
  }

  // The Signal Check result rides along only on a review, and only as known ids.
  let signalCategory: SignalResultKey | null = null;
  let signalAnswers: string | null = null;
  if (route === "review") {
    const category = clean(form.get("signal_category"));
    if (category && isSignalResultKey(category)) {
      signalCategory = category;
      signalAnswers = encodeAnswers(decodeAnswers(clean(form.get("signal_answers")))) || null;
    }
  }

  if (Object.keys(errors).length > 0) return { errors };

  const orNull = (value: string) => value || null;

  return {
    data: {
      route,
      name,
      business,
      email,
      phone: orNull(values.phone),
      stage: values.stage,
      profile: orNull(values.profile),
      role: orNull(values.role),
      message: orNull(values.situation),
      consequence: orNull(values.consequence),
      whyNow: orNull(values.whyNow),
      decision: orNull(values.decision),
      timing: orNull(values.timing),
      signalCategory,
      signalAnswers,
      attribution: parseAttribution(form),
    },
    errors: {},
  };
}

export function parseEmail(value: FormDataEntryValue | null): string | null {
  const email = clean(value).toLowerCase();
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) return null;
  return email;
}
