"use client";

import { useState } from "react";

import {
  SIGNAL_COPY,
  SIGNAL_QUESTIONS,
  encodeAnswers,
  isComplete,
  scoreSignalCheck,
  type SignalAnswers,
  type SignalResult,
} from "@/lib/signal-check";
import type { SignalHandoff } from "@/components/intake-form";
import { TraceFrame } from "@/components/lineart/trace-frame";

/**
 * Seven questions, answered on the page. The result appears at once and is
 * labelled an indication, not a diagnosis. Nothing is sent anywhere unless
 * the visitor chooses to ask a person to look at it.
 */
export function SignalCheck({ onAskForReview }: { onAskForReview: (h: SignalHandoff) => void }) {
  const [answers, setAnswers] = useState<SignalAnswers>({});
  const [result, setResult] = useState<SignalResult | null>(null);

  const answered = SIGNAL_QUESTIONS.filter((q) => answers[q.id]).length;
  const complete = isComplete(answers);

  if (result) {
    const copy = SIGNAL_COPY[result.primary];
    const secondary = result.secondary ? SIGNAL_COPY[result.secondary] : null;
    return (
      <div className="grid gap-6" aria-live="polite">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
            An indication, not a diagnosis
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            Your answers point at
          </p>
          <h3 className="mt-2 font-display text-3xl text-ink md:text-4xl">{copy.title}</h3>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-mid md:text-base">
            {copy.summary}
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mid">
            Worth examining first
          </p>
          <ul className="mt-3 grid gap-2">
            {copy.examine.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                <span aria-hidden className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-sage" />
                {item}
              </li>
            ))}
          </ul>
          {secondary ? (
            <p className="mt-4 text-[14px] text-ink-mid">
              Also worth a look: <strong className="font-medium text-ink">{secondary.title}</strong>.
            </p>
          ) : null}
        </div>

        <p className="max-w-[60ch] text-[13px] leading-relaxed text-ink-faint">
          Seven questions can only point. They can&apos;t see your numbers, your
          customers or what you&apos;ve already tried in detail, which is what a person
          looks at.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() =>
              onAskForReview({ category: result.primary, answers: encodeAnswers(answers) })
            }
            className="cms-live relative rounded-full px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep transition-transform duration-500 ease-overshoot hover:scale-[1.04]"
          >
            <TraceFrame
              radius={999}
              strokeWidth={1.2}
              duration={1000}
              runner
              runnerDuration={4600}
              className="text-amber/60"
              runnerClassName="text-amber"
            />
            Ask a person to look at this
          </button>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
            className="cms-link font-mono text-[12px] uppercase tracking-[0.14em] text-ink-mid"
          >
            Start again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) setResult(scoreSignalCheck(answers));
      }}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sage">
          Social Signal Check
        </p>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-mid">
          Seven quick questions about how social media works in the business today.
          You&apos;ll see what they point at straight away. Your answers stay in your
          browser unless you choose to send them.
        </p>
      </div>

      {SIGNAL_QUESTIONS.map((question, qi) => (
        <fieldset key={question.id} className="grid gap-3">
          <legend className="mb-3 font-display text-xl leading-snug text-ink md:text-2xl">
            <span className="mr-3 font-mono text-[12px] text-ink-faint">0{qi + 1}</span>
            {question.prompt}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const id = `signal-${question.id}-${option.id}`;
              const checked = answers[question.id] === option.id;
              return (
                <label
                  key={option.id}
                  htmlFor={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[15px] leading-snug transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber/60 ${
                    checked
                      ? "border-amber/60 bg-amber/8 text-ink"
                      : "border-rule text-ink-mid hover:border-rule-strong hover:text-ink"
                  }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={checked}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                    className="mt-1 accent-[var(--color-amber)]"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={!complete}
          className="cms-live relative rounded-full px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep transition-transform duration-500 ease-overshoot enabled:hover:scale-[1.04] disabled:opacity-50"
        >
          <TraceFrame
            radius={999}
            strokeWidth={1.2}
            duration={1000}
            className="text-amber/60"
          />
          See what it points at
        </button>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint" aria-live="polite">
          {answered} of {SIGNAL_QUESTIONS.length} answered
        </p>
      </div>
    </form>
  );
}
