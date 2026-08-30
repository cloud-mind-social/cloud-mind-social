"use client";

import { useState } from "react";
import { nav } from "@/lib/data";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4 md:px-10">
        <a
          href="#top"
          className="font-mono text-[13px] uppercase tracking-[0.22em] text-cream"
        >
          Cloud Mind Social
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-[12px] uppercase tracking-[0.14em] text-cream-dim transition-colors hover:text-cream"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#start"
            className="rounded-full bg-amber px-5 py-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-transform hover:scale-[1.03]"
          >
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
            className={`h-px w-5 bg-cream transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-cream transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
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
            className="mt-2 rounded-full bg-amber px-5 py-3 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-ink"
          >
            Start a conversation
          </a>
        </nav>
      )}
    </header>
  );
}
