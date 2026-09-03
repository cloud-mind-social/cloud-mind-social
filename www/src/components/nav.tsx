"use client";

import { useState } from "react";

import { nav } from "@/lib/data";
import { LogoMark } from "@/components/lineart/logo-mark";
import { useScrollNodeRef } from "@/components/lineart/scroll-store";
import { TraceFrame } from "@/components/lineart/trace-frame";

export function Nav() {
  const [open, setOpen] = useState(false);
  const edge = useScrollNodeRef<HTMLDivElement>();

  return (
    <header className="sticky top-0 z-50 bg-paper md:bg-paper/90 md:backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4 md:px-10">
        <a
          href="#top"
          className="cms-logo group flex items-center gap-3 font-mono text-[13px] uppercase tracking-[0.22em] text-ink"
        >
          <LogoMark />
          <span className="cms-link">Cloud Mind Social</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="cms-link font-mono text-[12px] uppercase tracking-[0.14em] text-ink-mid transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#start"
            className="cms-live relative rounded-full px-5 py-2 font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep transition-transform duration-500 ease-overshoot hover:scale-[1.04]"
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
        <nav className="flex flex-col gap-1 border-t border-rule px-6 pb-6 md:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3 font-mono text-[13px] uppercase tracking-[0.14em] text-ink-mid"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#start"
            onClick={() => setOpen(false)}
            className="relative mt-2 rounded-full px-5 py-3 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep"
          >
            <TraceFrame radius={999} duration={900} className="text-amber/50" />
            Start a conversation
          </a>
        </nav>
      )}

      {/* The header's own edge, drawn in as far as you have read. */}
      <div
        ref={edge}
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-rule"
      >
        <div className="cms-nav-progress h-full w-full origin-left bg-amber" />
      </div>
    </header>
  );
}
