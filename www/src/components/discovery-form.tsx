"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { journeyStages } from "@/lib/data";
import { submitInquiry } from "@/actions/inquiry";
import { initialInquiryState } from "@/lib/form-state";
import { Burst } from "@/components/lineart/burst";
import { TraceFrame } from "@/components/lineart/trace-frame";

// Fields are a single line each — no boxes, nothing filled in. The line
// under the active one races out from the left as soon as it has focus.
const inputClasses =
  "w-full border-b border-rule bg-transparent px-1 py-3 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-500 focus:border-rule-strong";

const errorClasses = "border-amber/70";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-[13px] text-amber-deep">
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cms-live relative mt-2 justify-self-start rounded-full px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep transition-transform duration-500 ease-overshoot hover:scale-[1.04] disabled:opacity-60"
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
      {pending ? "Sending…" : "Request a discovery call"}
    </button>
  );
}

export function DiscoveryForm() {
  const [state, formAction] = useActionState(submitInquiry, initialInquiryState);

  if (state.status === "success") {
    return (
      <div className="relative rounded-2xl p-10 text-center">
        <TraceFrame
          radius={18}
          strokeWidth={1.2}
          duration={1600}
          runner
          runnerDuration={7000}
          className="text-sage/50"
          runnerClassName="text-amber"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 block h-0 w-0"
        >
          <Burst size={280} spokes={14} className="text-amber/60" />
        </span>
        <p className="font-display text-2xl text-ink md:text-3xl">
          That&apos;s everything we need to start.
        </p>
        <p className="mx-auto mt-3 max-w-[46ch] text-ink-mid">
          A confirmation is on its way to your inbox. We&apos;ll follow up within
          one business day to find a time for the conversation.
        </p>
      </div>
    );
  }

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-amber/35 bg-amber/8 px-4 py-3 text-[14px] text-amber-deep"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="cms-field">
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            placeholder="Your name"
            className={`${inputClasses} ${errors.name ? errorClasses : ""}`}
          />
          <FieldError message={errors.name} />
        </div>
        <div className="cms-field">
          <label htmlFor="business" className="sr-only">
            Business name
          </label>
          <input
            id="business"
            name="business"
            type="text"
            required
            autoComplete="organization"
            aria-invalid={Boolean(errors.business)}
            placeholder="Business name"
            className={`${inputClasses} ${errors.business ? errorClasses : ""}`}
          />
          <FieldError message={errors.business} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="cms-field">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            placeholder="Email address"
            className={`${inputClasses} ${errors.email ? errorClasses : ""}`}
          />
          <FieldError message={errors.email} />
        </div>
        <div className="cms-field">
          <label htmlFor="phone" className="sr-only">
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            placeholder="Phone (optional)"
            className={`${inputClasses} ${errors.phone ? errorClasses : ""}`}
          />
          <FieldError message={errors.phone} />
        </div>
      </div>

      <div className="cms-field">
        <label htmlFor="stage" className="sr-only">
          Where&apos;s the business right now?
        </label>
        <select
          id="stage"
          name="stage"
          required
          defaultValue=""
          aria-invalid={Boolean(errors.stage)}
          className={`${inputClasses} appearance-none ${errors.stage ? errorClasses : ""}`}
        >
          <option value="" disabled>
            Where&apos;s the business right now?
          </option>
          {journeyStages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <FieldError message={errors.stage} />
      </div>

      <div className="cms-field">
        <label htmlFor="message" className="sr-only">
          What&apos;s going on?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          aria-invalid={Boolean(errors.message)}
          placeholder="What's going on, in your own words?"
          className={`${inputClasses} resize-none ${errors.message ? errorClasses : ""}`}
        />
        <FieldError message={errors.message} />
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

      <SubmitButton />
    </form>
  );
}
