"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatScheduled, schedulePresets, toDateTimeLocal } from "@/lib/schedule-times";

/**
 * "Send later" — presets first, a picker for everything else.
 *
 * Each preset spells out the date and time it means, because "Monday morning"
 * is only unambiguous to the person who wrote the label. The custom field
 * starts at tomorrow morning rather than empty, so the picker opens on a
 * plausible answer instead of on 1970.
 */
export function ScheduleMenu({ onSchedule, disabled }: {
  onSchedule: (at: Date) => void;
  disabled?: boolean;
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
    if (Number.isNaN(at.getTime())) {
      setError("That isn't a date I can read.");
      return;
    }
    if (at.getTime() <= Date.now()) {
      setError("Pick a time in the future.");
      return;
    }
    setOpen(false);
    onSchedule(at);
  }

  const presets = schedulePresets();

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => (open ? setOpen(false) : openMenu())}
        disabled={disabled}
        aria-expanded={open}
        className="rounded-sm border border-hairline px-3 py-2 text-xs font-medium text-ink-soft hover:border-hairline-strong hover:text-ink disabled:opacity-50"
      >
        Send later
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-sm border border-hairline bg-paper p-1 shadow-lg">
          {presets.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                setOpen(false);
                onSchedule(option.at);
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
              className={cn(
                "mt-2 w-full rounded-sm bg-accent px-2 py-1.5 text-xs font-semibold text-paper",
                "hover:bg-accent-strong",
              )}
            >
              Schedule send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
