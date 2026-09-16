"use client";

import type { ProposedTime } from "@/lib/api";

/**
 * Times someone suggested in the body of a message.
 *
 * Presented as an offer, never as a fact. The words that were matched are
 * shown next to what we read them as, so a wrong reading is obvious at a
 * glance rather than something you discover on the day — "Tuesday at 2 →
 * Tue, Sep 1 at 2:00 PM" is checkable; a bare button saying "Add to calendar"
 * is not.
 *
 * A phrase that named a day but no clock time says so, because nine in the
 * morning is our assumption and not the sender's word.
 *
 * Nothing here creates anything. "Add to calendar" opens a confirmation where
 * every field can be corrected first — the detection is good enough to offer
 * and not good enough to act on.
 */

function formatAt(iso: string, timeZone: string): string {
  const at = new Date(iso);
  const day = at.toLocaleDateString(undefined, {
    timeZone, weekday: "short", month: "short", day: "numeric",
  });
  const time = at.toLocaleTimeString(undefined, {
    timeZone, hour: "numeric", minute: "2-digit",
  });
  return `${day} at ${time}`;
}

export function ProposedTimes({
  times,
  timeZone,
  onSchedule,
  onReply,
  onAddToCalendar,
}: {
  times: ProposedTime[];
  timeZone: string;
  /** Offers the time to the composer's schedule picker. */
  onSchedule: (at: Date) => void;
  /** Starts a reply confirming the time. */
  onReply: (time: ProposedTime) => void;
  /** Opens the confirmation dialog — nothing is created before that. */
  onAddToCalendar: (time: ProposedTime) => void;
}) {
  if (times.length === 0) return null;

  return (
    <div className="rounded-sm border border-hairline bg-paper-raised px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {times.length === 1 ? "A time was suggested" : "Times were suggested"}
      </p>

      <ul className="mt-2 flex flex-col gap-2">
        {times.map((time) => (
          <li key={`${time.at}-${time.text}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm text-ink">
              {/* What they wrote, then what we read it as. Both, so a wrong
                  reading is caught here and not on the day. */}
              <span className="text-ink-faint">“{time.text}”</span>
              {" → "}
              {formatAt(time.at, timeZone)}
              {time.dayOnly && <span className="text-ink-faint"> (no time given)</span>}
            </span>
            <span className="flex items-center gap-3 text-xs font-medium">
              {/* First, because it is what people came here to do. The other
                  two are useful and secondary. */}
              <button onClick={() => onAddToCalendar(time)} className="text-accent hover:underline">
                Add to calendar
              </button>
              <button onClick={() => onReply(time)} className="text-accent hover:underline">
                Reply to confirm
              </button>
              <button onClick={() => onSchedule(new Date(time.at))} className="text-ink-faint hover:text-ink">
                Send a note then
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
