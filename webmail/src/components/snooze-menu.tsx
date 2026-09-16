"use client";

import { useEffect, useRef, useState } from "react";
import { formatScheduled, snoozePresets, toDateTimeLocal } from "@/lib/schedule-times";
import { cn } from "@/lib/cn";

/**
 * "Snooze until…" — presets, then a picker.
 *
 * Same shape as the send-later menu on purpose: putting a message away and
 * sending one later are the same gesture pointed in opposite directions, and
 * two different-looking time pickers in one mailbox would be two things to
 * learn instead of one.
 */
export function SnoozeMenu({
  onSnooze,
  label = "Snooze",
  align = "left",
  className,
}: {
  onSnooze: (until: Date) => void | Promise<void>;
  label?: string;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
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

  function openMenu() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    setCustom(toDateTimeLocal(tomorrow));
    setError(null);
    setOpen(true);
  }

  function chooseCustom() {
    const at = new Date(custom);
    if (Number.isNaN(at.getTime())) return setError("That isn't a date I can read.");
    if (at.getTime() <= Date.now()) return setError("Pick a time in the future.");
    setOpen(false);
    void onSnooze(at);
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <button
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
      >
        {label}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full z-30 mt-2 w-64 rounded-sm border border-hairline bg-paper p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {snoozePresets().map((option) => (
            <button
              key={option.label}
              onClick={() => {
                setOpen(false);
                void onSnooze(option.at);
              }}
              className="flex w-full items-baseline justify-between gap-3 rounded-sm px-2 py-2 text-left text-xs hover:bg-paper-raised"
            >
              <span className="whitespace-nowrap text-ink-soft">{option.label}</span>
              <span className="shrink-0 text-[11px] text-ink-faint">{formatScheduled(option.at)}</span>
            </button>
          ))}

          <div className="mt-1 border-t border-hairline px-2 pt-2 pb-1">
            <label className="mb-1 block text-[11px] font-medium text-ink-faint">
              Or pick a time
            </label>
            <input
              type="datetime-local"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-xs text-ink outline-none focus:border-hairline-strong"
            />
            {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
            <button
              onClick={chooseCustom}
              className="mt-2 w-full rounded-sm bg-accent px-2 py-1.5 text-xs font-semibold text-paper hover:bg-accent-strong"
            >
              Snooze until then
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
