"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { journeyStages } from "@/lib/data";
import { submitInquiry } from "@/actions/inquiry";
import { initialInquiryState } from "@/lib/form-state";

const inputClasses =
  "w-full rounded-lg border border-line bg-ink-raised/60 px-4 py-3 text-[15px] text-cream placeholder:text-cream-faint outline-none transition-colors focus:border-amber";

const errorClasses = "border-amber/70";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-[13px] text-amber-soft">
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
      className="mt-2 justify-self-start rounded-full bg-amber px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-transform hover:scale-[1.03] disabled:opacity-60"
    >
      {pending ? "Sending…" : "Request a discovery call"}
    </button>
  );
}

export function DiscoveryForm() {
  const [state, formAction] = useActionState(submitInquiry, initialInquiryState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-line bg-ink-soft/60 p-10 text-center">
        <p className="font-display text-2xl text-cream md:text-3xl">
          That&apos;s everything we need to start.
        </p>
        <p className="mx-auto mt-3 max-w-[46ch] text-cream-dim">
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
          className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-[14px] text-amber-soft"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
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
        <div>
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
        <div>
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
        <div>
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

      <div>
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

      <div>
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
