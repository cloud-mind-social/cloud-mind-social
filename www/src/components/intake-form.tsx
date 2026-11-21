"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { submitInquiry } from "@/actions/inquiry";
import { initialInquiryState } from "@/lib/form-state";
import {
  FIELD_HINTS,
  FIELD_LABELS,
  RESPONSE_EXPECTATION,
  ROLES,
  ROUTE_COPY,
  ROUTE_FIELDS,
  ROUTE_LABELS,
  TIMINGS,
  journeyStages,
  type IntakeField,
  type IntakeRoute,
} from "@/lib/intake";
import { SIGNAL_COPY, type SignalResultKey } from "@/lib/signal-check";
import { Burst } from "@/components/lineart/burst";
import { TraceFrame } from "@/components/lineart/trace-frame";

/** What the Signal Check hands over when someone asks a person to look. */
export type SignalHandoff = { category: SignalResultKey; answers: string };

// Fields are a single line each — no boxes, nothing filled in. The line
// under the active one races out from the left as soon as it has focus.
const inputClasses =
  "w-full border-b border-rule bg-transparent px-1 py-3 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-500 focus:border-rule-strong";

const errorClasses = "border-amber/70";

const labelClasses = "block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mid";

const DEFAULT_LABELS: Record<IntakeField, string> = {
  profile: "Website or social profile",
  role: "Your role in the business",
  stage: "Where's its social media right now?",
  situation: "What's going on?",
  consequence: "What is it costing the business?",
  whyNow: "Why now?",
  decision: "What decision do you need to make?",
  timing: "Timing",
  phone: "Phone",
};

const FORM_NAMES: Record<IntakeField, string> = {
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

const CHOICES: Partial<Record<IntakeField, readonly string[]>> = {
  role: ROLES,
  stage: journeyStages,
  timing: TIMINGS,
};

const MULTILINE: readonly IntakeField[] = ["situation", "consequence", "whyNow", "decision"];

const AUTOCOMPLETE: Partial<Record<IntakeField, string>> = {
  profile: "url",
  phone: "tel",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-[13px] text-amber-deep">
      {message}
    </p>
  );
}

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={labelClasses}>
      {children}
      {optional ? <span className="ml-2 normal-case tracking-normal text-ink-faint">(optional)</span> : null}
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cms-live relative justify-self-start rounded-full px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep transition-transform duration-500 ease-overshoot hover:scale-[1.04] disabled:opacity-60"
    >
      <TraceFrame
        radius={999}
        strokeWidth={1.2}
        duration={1100}
        runner
        runnerDuration={pending ? 900 : 4600}
        className="text-amber/60"
        runnerClassName="text-amber"
      />
      {pending ? "Sending…" : label}
    </button>
  );
}

const ATTRIBUTION_KEY = "cms:attribution";
const ATTRIBUTION_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "referrer",
  "landing_path",
] as const;

/**
 * Where the visitor came from: UTM tags on the landing URL, the referring
 * page, and the path they landed on. Captured once per visit, on first load,
 * and kept for the session so a later click still credits the right source.
 * The server validates and trims every value before storing it.
 */
export function rememberAttribution(): Record<string, string> {
  try {
    const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null");
    if (stored && typeof stored === "object") return stored;
  } catch {
    // Fall through and capture afresh.
  }
  const params = new URLSearchParams(window.location.search);
  const referrer =
    document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer
      : "";
  const captured: Record<string, string> = {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    referrer,
    landing_path: window.location.pathname,
  };
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(captured));
  } catch {
    // Private browsing: attribution just isn't remembered across reloads.
  }
  return captured;
}

/** Writes the remembered attribution into the form's hidden inputs after mount. */
function useAttribution() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const values = rememberAttribution();
    for (const name of ATTRIBUTION_FIELDS) {
      const input = ref.current?.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (input) input.value = values[name] ?? "";
    }
  }, []);
  return ref;
}

export function IntakeForm({
  route,
  signal,
  onClearSignal,
}: {
  route: IntakeRoute;
  signal: SignalHandoff | null;
  onClearSignal: () => void;
}) {
  const [state, formAction] = useActionState(submitInquiry, initialInquiryState);
  const attribution = useAttribution();
  const copy = ROUTE_COPY[route];
  const { asks, requires } = ROUTE_FIELDS[route];

  if (state.status === "success") {
    const done = ROUTE_COPY[state.route ?? route];
    return (
      <div className="relative rounded-2xl p-8 text-center md:p-10" role="status">
        <TraceFrame
          radius={18}
          strokeWidth={1.2}
          duration={1600}
          runner
          runnerDuration={7000}
          className="text-sage/50"
          runnerClassName="text-amber"
        />
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 block h-0 w-0">
          <Burst size={280} spokes={14} className="text-amber/60" />
        </span>
        <p className="font-display text-2xl text-ink md:text-3xl">
          That&apos;s everything we need.
        </p>
        <p className="mx-auto mt-4 max-w-[48ch] text-ink-mid">{done.confirmation}</p>
        <p className="mx-auto mt-4 max-w-[48ch] text-ink-mid">
          A person replies by email, {RESPONSE_EXPECTATION}. A copy of what you sent
          should reach your inbox; if it doesn&apos;t, your request is still saved and
          we&apos;ll reply either way.
        </p>
      </div>
    );
  }

  const failed = state.status === "error" && state.route === route;
  const errors = failed ? (state.errors ?? {}) : {};
  const values = failed ? (state.values ?? {}) : {};
  const describedBy = (key: string, hint?: boolean) =>
    [hint ? `${key}-hint` : null, errors[key] ? `${key}-error` : null].filter(Boolean).join(" ") ||
    undefined;

  const renderField = (field: IntakeField) => {
    const name = FORM_NAMES[field];
    const id = `intake-${name}`;
    const label = FIELD_LABELS[route][field] ?? DEFAULT_LABELS[field];
    const required = requires.includes(field);
    const hint = FIELD_HINTS[field];
    const choices = CHOICES[field];
    const invalid = Boolean(errors[name]);
    const shared = {
      id,
      name,
      required,
      "aria-invalid": invalid,
      "aria-describedby": describedBy(name, Boolean(hint)),
    };

    return (
      <div key={field} className="cms-field">
        <Label htmlFor={id} optional={!required}>
          {label}
        </Label>
        {choices ? (
          <select
            {...shared}
            defaultValue={values[name] ?? ""}
            className={`${inputClasses} appearance-none ${invalid ? errorClasses : ""}`}
          >
            <option value="" disabled={required}>
              {required ? "Choose one" : "Choose one, if you like"}
            </option>
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        ) : MULTILINE.includes(field) ? (
          <textarea
            {...shared}
            defaultValue={values[name] ?? ""}
            rows={field === "situation" || field === "decision" ? 4 : 3}
            className={`${inputClasses} resize-y ${invalid ? errorClasses : ""}`}
          />
        ) : (
          <input
            {...shared}
            defaultValue={values[name] ?? ""}
            type={field === "phone" ? "tel" : "text"}
            autoComplete={AUTOCOMPLETE[field]}
            inputMode={field === "profile" ? "url" : undefined}
            className={`${inputClasses} ${invalid ? errorClasses : ""}`}
          />
        )}
        {hint ? (
          <p id={`${name}-hint`} className="mt-2 text-[13px] text-ink-faint">
            {hint}
          </p>
        ) : null}
        <FieldError id={`${name}-error`} message={errors[name]} />
      </div>
    );
  };

  const longFields = asks.filter((f) => MULTILINE.includes(f));
  const shortFields = asks.filter((f) => !MULTILINE.includes(f) && f !== "phone");

  return (
    <form action={formAction} className="grid gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sage">
          {ROUTE_LABELS[route]}
        </p>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-mid">
          {copy.formIntro}
        </p>
      </div>

      {state.status === "error" && state.message && state.route === route ? (
        <p
          role="alert"
          className="rounded-lg border border-amber/35 bg-amber/8 px-4 py-3 text-[14px] text-amber-deep"
        >
          {state.message}
        </p>
      ) : null}

      {signal && route === "review" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage/40 bg-sage/8 px-4 py-3">
          <p className="text-[14px] text-ink">
            Your Signal Check answers go with this request (it pointed at{" "}
            <strong className="font-medium">{SIGNAL_COPY[signal.category].title.toLowerCase()}</strong>
            ), so you won&apos;t have to repeat them.
          </p>
          <button
            type="button"
            onClick={onClearSignal}
            className="cms-link font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mid"
          >
            Don&apos;t include them
          </button>
          <input type="hidden" name="signal_category" value={signal.category} />
          <input type="hidden" name="signal_answers" value={signal.answers} />
        </div>
      ) : null}

      <input type="hidden" name="route" value={route} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="cms-field">
          <Label htmlFor="intake-name">Your name</Label>
          <input
            id="intake-name"
            name="name"
            defaultValue={values.name ?? ""}
            type="text"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            className={`${inputClasses} ${errors.name ? errorClasses : ""}`}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>
        <div className="cms-field">
          <Label htmlFor="intake-email">Email</Label>
          <input
            id="intake-email"
            name="email"
            defaultValue={values.email ?? ""}
            type="email"
            required
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            className={`${inputClasses} ${errors.email ? errorClasses : ""}`}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
        <div className="cms-field">
          <Label htmlFor="intake-business">Business name</Label>
          <input
            id="intake-business"
            name="business"
            defaultValue={values.business ?? ""}
            type="text"
            required
            autoComplete="organization"
            aria-invalid={Boolean(errors.business)}
            aria-describedby={describedBy("business")}
            className={`${inputClasses} ${errors.business ? errorClasses : ""}`}
          />
          <FieldError id="business-error" message={errors.business} />
        </div>
        {shortFields.map(renderField)}
      </div>

      {longFields.map(renderField)}

      {asks.includes("phone") ? <div className="md:max-w-[50%]">{renderField("phone")}</div> : null}

      {/* Where they came from, filled in after mount. Never shown, never required. */}
      <div ref={attribution} hidden>
        {ATTRIBUTION_FIELDS.map((name) => (
          <input key={name} type="hidden" name={name} />
        ))}
      </div>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Leave this field empty</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4">
        <SubmitButton label={copy.submit} />
        <p className="max-w-[60ch] text-[13px] leading-relaxed text-ink-faint">
          A person reads every request and replies by email, {RESPONSE_EXPECTATION}. We
          use what you send only to reply to it. There&apos;s no mailing list behind this form.
        </p>
      </div>
    </form>
  );
}
