"use client";

import { useState } from "react";

import { nav } from "@/lib/data";
import { TraceFrame } from "@/components/lineart/trace-frame";

/** Cloud, Mind, Social — three strokes, one continuous idea. */
function Mark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 34 20"
      className="h-5 w-[34px] overflow-visible text-sage"
      fill="none"
    >
      <path
        d="M2 13 C 2 7, 8 4, 12 7 C 14 2, 22 2, 23 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="cms-lap"
        d="M2 13 C 2 7, 8 4, 12 7 C 14 2, 22 2, 23 8"
        pathLength={1}
        stroke="var(--color-amber)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="0.16 0.84"
        data-boost="true"
        style={{ "--lap-dur": "5.5s" } as React.CSSProperties}
      />
      <circle cx="27" cy="13" r="4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="27" cy="13" r="1.4" fill="var(--color-amber)" />
      <path
        d="M6 17 H 20"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 4"
        className="cms-drift"
        style={{ "--drift-dur": "6s" } as React.CSSProperties}
      />
    </svg>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4 md:px-10">
        <a
          href="#top"
          className="group flex items-center gap-3 font-mono text-[13px] uppercase tracking-[0.22em] text-cream"
        >
          <Mark />
          <span className="cms-link">Cloud Mind Social</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="cms-link font-mono text-[12px] uppercase tracking-[0.14em] text-cream-dim transition-colors hover:text-cream"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#start"
            className="relative rounded-full px-5 py-2 font-mono text-[12px] uppercase tracking-[0.14em] text-amber transition-transform duration-500 ease-overshoot hover:scale-[1.04]"
          >
            <TraceFrame
              radius={999}
              duration={1000}
              delay={700}
              runner
              runnerDuration={5200}
              className="text-amber/50"
              runnerClassName="text-amber"
            />
            Start a conversation
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-px w-5 bg-cream transition-transform duration-500 ease-overshoot ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-cream transition-transform duration-500 ease-overshoot ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 pb-6 md:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3 font-mono text-[13px] uppercase tracking-[0.14em] text-cream-dim"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#start"
            onClick={() => setOpen(false)}
            className="relative mt-2 rounded-full px-5 py-3 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-amber"
          >
            <TraceFrame radius={999} duration={900} className="text-amber/50" />
            Start a conversation
          </a>
        </nav>
      )}

      {/* The header's own edge, drawn in as far as you have read. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-line"
      >
        <div className="cms-nav-progress h-full w-full origin-left bg-amber" />
      </div>
    </header>
  );
}
