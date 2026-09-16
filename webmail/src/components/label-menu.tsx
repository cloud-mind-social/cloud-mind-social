"use client";

import { useEffect, useRef, useState } from "react";
import type { Label, LabelWithCount } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * The "Label as" menu.
 *
 * Filing is a two-second job, so the menu does the whole of it without leaving:
 * type to narrow, click to toggle, and if nothing matches what you typed, the
 * same box offers to make that label and apply it. Anything more ceremonious
 * and people stop labelling.
 */
export function LabelMenu({
  labels,
  applied,
  onToggle,
  onCreate,
  onOpen,
}: {
  labels: LabelWithCount[];
  applied: Label[];
  onToggle: (label: Label, on: boolean) => void | Promise<void>;
  onCreate: (name: string) => Promise<Label | null>;
  /** Re-reads the label list — one made in the sidebar must show up here. */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      setError(null);
    }
  }, [open]);

  const appliedIds = new Set(applied.map((l) => l.id));
  const needle = filter.trim().toLowerCase();
  const shown = needle ? labels.filter((l) => l.name.toLowerCase().includes(needle)) : labels;
  const exact = labels.some((l) => l.name.toLowerCase() === needle);

  async function create() {
    const name = filter.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const made = await onCreate(name);
      if (made) {
        setFilter("");
        setOpen(false);
      } else {
        setError("Couldn't create that label.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
      >
        Label as
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-60 rounded-sm border border-hairline bg-paper p-1 shadow-lg">
          <input
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && needle && !exact) void create();
            }}
            placeholder="Filter or create…"
            className="mb-1 w-full rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-hairline-strong"
          />

          <div className="max-h-56 overflow-y-auto">
            {shown.map((l) => {
              const on = appliedIds.has(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => void onToggle(l, !on)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-ink-soft hover:bg-paper-raised"
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border text-[9px] leading-none",
                      on ? "border-accent bg-accent text-paper" : "border-hairline-strong",
                    )}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {l.color && (
                    <span
                      style={{ backgroundColor: l.color }}
                      className="h-2 w-2 shrink-0 rounded-full"
                    />
                  )}
                  <span className="truncate">{l.name}</span>
                </button>
              );
            })}

            {shown.length === 0 && !needle && (
              <p className="px-2 py-3 text-center text-[11px] text-ink-faint">
                No labels yet. Type a name to make one.
              </p>
            )}
          </div>

          {needle && !exact && (
            <button
              onClick={() => void create()}
              disabled={busy}
              className="mt-1 flex w-full items-center gap-1 border-t border-hairline px-2 py-2 text-left text-xs font-medium text-accent hover:bg-paper-raised disabled:opacity-50"
            >
              <span aria-hidden>+</span>
              <span className="truncate">Create “{filter.trim()}” and apply</span>
            </button>
          )}

          {error && <p className="px-2 pb-1.5 text-[11px] text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
