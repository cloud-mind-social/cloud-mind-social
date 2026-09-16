"use client";

import { useEffect, useState } from "react";
import { formatScheduled, schedulePresets, toDateTimeLocal } from "@/lib/schedule-times";

/**
 * Moving a scheduled message.
 *
 * The same presets as the composer, because "actually, Monday" is the same
 * thought whether you have it before or after pressing Schedule. Opens on the
 * time the message currently has, so the picker starts from what is true.
 */
export function RescheduleDialog({
  current,
  onPick,
  onClose,
}: {
  current: string;
  onPick: (at: Date) => void | Promise<void>;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState(() => toDateTimeLocal(new Date(current)));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  function chooseCustom() {
    const at = new Date(custom);
    if (Number.isNaN(at.getTime())) return setError("That isn't a date I can read.");
    if (at.getTime() <= Date.now()) return setError("Pick a time in the future.");
    void onPick(at);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-label="Change send time"
        className="relative w-full max-w-sm rounded-sm border border-hairline bg-paper p-4 shadow-xl"
      >
        <h2 className="font-display text-lg text-ink">Change send time</h2>
        <p className="mt-0.5 mb-3 text-xs text-ink-faint">
          Currently {formatScheduled(current)}.
        </p>

        {schedulePresets().map((option) => (
          <button
            key={option.label}
            onClick={() => void onPick(option.at)}
            className="flex w-full items-baseline justify-between gap-3 rounded-sm px-2 py-2 text-left text-xs hover:bg-paper-raised"
          >
            <span className="whitespace-nowrap text-ink-soft">{option.label}</span>
            <span className="shrink-0 text-[11px] text-ink-faint">{formatScheduled(option.at)}</span>
          </button>
        ))}

        <div className="mt-2 border-t border-hairline pt-3">
          <label className="mb-1 block text-[11px] font-medium text-ink-faint">Or pick a time</label>
          <input
            type="datetime-local"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-xs text-ink outline-none focus:border-hairline-strong"
          />
          {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={chooseCustom}
              className="rounded-sm bg-accent px-3 py-1.5 text-xs font-semibold text-paper hover:bg-accent-strong"
            >
              Move it
            </button>
            <button onClick={onClose} className="text-xs font-medium text-ink-faint hover:text-ink">
              Leave it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
