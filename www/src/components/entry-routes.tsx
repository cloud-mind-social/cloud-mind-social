"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { Reveal } from "@/components/reveal";
import { IntakeForm, rememberAttribution, type SignalHandoff } from "@/components/intake-form";
import { SignalCheck } from "@/components/signal-check";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";
import { ROUTE_COPY } from "@/lib/intake";

/**
 * The three diagnostic entry routes from Phase 3.8, plus the scoped-task
 * route for a clearly finite need. They are alternatives, not steps: each
 * card says who it is for, what it gives and what it isn't, and opens its own
 * form. The Social Signal Check is the default, because it asks the least.
 *
 * The open route lives in the URL hash (#signal-check, #review, #intensive,
 * #scoped), so any link on the page, or in a social post, can open one.
 */
const PANELS = ["signal-check", "review", "intensive", "scoped"] as const;
type Panel = (typeof PANELS)[number];

function isPanel(value: string): value is Panel {
  return (PANELS as readonly string[]).includes(value);
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readHash(): Panel | null {
  const hash = window.location.hash.slice(1);
  return isPanel(hash) ? hash : null;
}

const ROUTES: Array<{
  panel: Exclude<Panel, "scoped">;
  situation: string;
  name: string;
  gives: string;
  isnt: string;
  meta: string;
  cta: string;
}> = [
  {
    panel: "signal-check",
    situation: "Something's off, but you can't say what",
    name: "Social Signal Check",
    gives: "Seven questions and an immediate pointer at what to examine first: direction, capacity, coordination, measurement, foundation or content.",
    isnt: "A diagnosis or an audit. It points; it doesn't prescribe.",
    meta: "On this page · about two minutes · free",
    cta: "Take the check",
  },
  {
    panel: "review",
    situation: "You can describe a specific situation",
    name: "Signal-to-Strategy Review",
    gives: "A bounded read of that situation: the likely underlying constraint, what it's costing, and the one decision to make next.",
    isnt: "Unlimited consulting or a full strategy project.",
    meta: "By request · any fee confirmed before it happens",
    cta: ROUTE_COPY.review.cta,
  },
  {
    panel: "intensive",
    situation: "There's a decision in front of you",
    name: "Social Clarity Intensive",
    gives: "A paid diagnosis and a concise decision brief: what social media needs next, what it doesn't, and what level of support makes sense.",
    isnt: "A retainer in disguise. Buying it commits you to nothing after it.",
    meta: "Paid · scope and price in writing before booking",
    cta: ROUTE_COPY.intensive.cta,
  },
];

export function EntryRoutes() {
  const hash = useSyncExternalStore(subscribe, readHash, () => null);
  const active: Panel = hash ?? "signal-check";
  const [signal, setSignal] = useState<SignalHandoff | null>(null);

  // Note the source on first load, before any hash change or scroll.
  useEffect(() => {
    rememberAttribution();
  }, []);

  const open = (panel: Panel) => {
    // Put the route in the URL, tell the store, and bring the panel into view.
    window.history.pushState(null, "", `#${panel}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    document.getElementById(panel)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="start" className="grain relative border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            Where to start
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[20ch] font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            Three ways in. Start where you actually are.
          </h2>
        </Reveal>
        <Reveal delay={130}>
          <div className="mt-6 max-w-[20rem]">
            <SparkRule duration={1300} className="text-amber/60" span={28} />
          </div>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-4 max-w-[58ch] text-ink-mid">
            These are alternatives, not steps. Nobody has to go through all three, and
            if you pick the wrong one we&apos;ll point you to the right one.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {ROUTES.map((route, i) => {
            const selected = active === route.panel;
            return (
              <article key={route.panel} className="relative flex h-full flex-col rounded-2xl p-7">
                <TraceFrame
                  radius={16}
                  duration={1300 + i * 240}
                  delay={i * 90}
                  direction={i % 2 ? "rev" : "fwd"}
                  className={selected ? "text-amber/70" : "text-rule"}
                />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  {route.situation}
                </p>
                <h3 className="mt-4 font-display text-2xl text-ink">{route.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-mid">{route.gives}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-faint">
                  <span className="font-medium text-ink-mid">What it isn&apos;t:</span> {route.isnt}
                </p>
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-sage">
                  {route.meta}
                </p>
                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => open(route.panel)}
                    aria-controls="route-panel"
                    aria-pressed={selected}
                    className={`rounded-full border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      selected
                        ? "border-amber bg-amber/10 text-amber-deep"
                        : "border-rule-strong text-ink hover:border-amber hover:text-amber-deep"
                    }`}
                  >
                    {route.cta}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-6 text-[15px] text-ink-mid">
          Already know the exact piece of work you need?{" "}
          <button
            type="button"
            onClick={() => open("scoped")}
            aria-controls="route-panel"
            aria-pressed={active === "scoped"}
            className="cms-link font-medium text-ink"
          >
            Scope a specific task →
          </button>
        </p>

        <div className="relative mt-12">
          {/* Anchors for each route, so #review etc. scroll here from anywhere. */}
          {PANELS.map((panel) => (
            <span key={panel} id={panel} aria-hidden className="absolute -top-24 block h-0 w-0" />
          ))}
          <div id="route-panel" className="relative overflow-hidden rounded-2xl p-6 md:p-10">
            <TraceFrame
              radius={18}
              strokeWidth={1.2}
              duration={2200}
              runner
              runnerDuration={10000}
              corners
              className="text-rule"
              runnerClassName="text-amber"
            />
            {active === "signal-check" ? (
              <SignalCheck
                onAskForReview={(handoff) => {
                  setSignal(handoff);
                  open("review");
                }}
              />
            ) : (
              <IntakeForm
                key={active}
                route={active}
                signal={active === "review" ? signal : null}
                onClearSignal={() => setSignal(null)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
