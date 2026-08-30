"use client";

import { useState, type FormEvent } from "react";
import { journeyStages } from "@/lib/data";

type Status = "idle" | "submitting" | "submitted";

// TODO(CRM integration): replace this stub with a real submission — a
// server action or API route call into the CRM once it's selected. The
// form below already collects everything that hand-off will need.
async function submitDiscoveryRequest(data: FormData) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  void data;
}

const inputClasses =
  "w-full rounded-lg border border-line bg-ink-raised/60 px-4 py-3 text-[15px] text-cream placeholder:text-cream-faint outline-none transition-colors focus:border-amber";

export function DiscoveryForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    await submitDiscoveryRequest(new FormData(event.currentTarget));
    setStatus("submitted");
  }

  if (status === "submitted") {
    return (
      <div className="rounded-2xl border border-line bg-ink-soft/60 p-10 text-center">
        <p className="font-display text-2xl text-cream md:text-3xl">
          That&apos;s everything we need to start.
        </p>
        <p className="mx-auto mt-3 max-w-[46ch] text-cream-dim">
          We&apos;ll follow up within one business day to find a time for
          the conversation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
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
            placeholder="Your name"
            className={inputClasses}
          />
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
            placeholder="Business name"
            className={inputClasses}
          />
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
            placeholder="Email address"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Phone (optional)"
            className={inputClasses}
          />
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
          className={`${inputClasses} appearance-none`}
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
      </div>

      <div>
        <label htmlFor="message" className="sr-only">
          What&apos;s going on?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="What's going on, in your own words?"
          className={`${inputClasses} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 justify-self-start rounded-full bg-amber px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Request a discovery call"}
      </button>
    </form>
  );
}
