"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  calendarEvents,
  type CalendarCollection,
  type CalendarEntry,
} from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { Button, ErrorText, Spinner } from "@/components/ui";
import { EventEditor, type EventDraft } from "@/components/event-editor";
import { cn } from "@/lib/cn";
import {
  addDays,
  dayKey,
  formatIn,
  minutesIntoDay,
  startOfDay,
  startOfWeek,
} from "@/lib/zoned";

/**
 * The week.
 *
 * A calendar is mostly a question about a shape: where does this sit, and what
 * is next to it. So this is a grid rather than a list — an hour of height is
 * an hour of time, and a clash is something you see rather than something you
 * work out.
 *
 * Everything is drawn in the mailbox's timezone rather than the browser's.
 * They are usually the same, but a week view that quietly redraws itself
 * around whichever airport somebody landed at is the kind of bug that costs
 * trust in the whole product.
 */

/** Hour rows are 48px; a half-hour is still comfortably clickable. */
const HOUR_PX = 48;
const DAY_MINUTES = 24 * 60;

/** A new event dragged from nothing defaults to the length most meetings are. */
const DEFAULT_MINUTES = 60;

export default function CalendarPage() {
  const { me, loading } = useMe();
  const timeZone = me?.timeZone ?? "America/New_York";

  const [anchor, setAnchor] = useState(() => new Date());
  const [days, setDays] = useState(7);
  const [entries, setEntries] = useState<CalendarEntry[] | null>(null);
  const [collections, setCollections] = useState<CalendarCollection[]>([]);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // A phone cannot show seven columns and stay legible; one day is the honest
  // answer there rather than a week nobody can read.
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const apply = () => setDays(narrow.matches ? 1 : 7);
    apply();
    narrow.addEventListener("change", apply);
    return () => narrow.removeEventListener("change", apply);
  }, []);

  const start = useMemo(
    () => (days === 1 ? startOfDay(anchor, timeZone) : startOfWeek(anchor, timeZone)),
    [anchor, days, timeZone],
  );
  const columns = useMemo(
    () => Array.from({ length: days }, (_, i) => addDays(start, i, timeZone)),
    [start, days, timeZone],
  );
  const end = useMemo(() => addDays(start, days, timeZone), [start, days, timeZone]);

  const load = useCallback(async () => {
    try {
      const res = await calendarEvents.inWindow(start, end);
      setEntries(res.events);
      setError(null);
    } catch {
      setError("Couldn't load your calendar.");
      setEntries([]);
    }
  }, [start, end]);

  useEffect(() => {
    if (!me) return;
    void load();
  }, [me, load]);

  useEffect(() => {
    if (!me) return;
    void calendarEvents.collections().then((res) => setCollections(res.calendars)).catch(() => {});
  }, [me]);

  // Open on the working day rather than at midnight, which is eight hours of
  // nothing before anything a person came here to see.
  useEffect(() => {
    if (entries && scroller.current) scroller.current.scrollTop = 7 * HOUR_PX;
  }, [entries !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries ?? []) {
      if (!entry.startsAt || !entry.endsAt) continue;
      // An event spanning midnight appears on each day it touches, clipped to
      // that column — the alternative is a block running off the bottom of
      // Tuesday and never appearing on Wednesday at all.
      for (const column of columns) {
        const dayStart = column;
        const dayEnd = addDays(column, 1, timeZone);
        if (new Date(entry.startsAt) < dayEnd && new Date(entry.endsAt) > dayStart) {
          const key = dayKey(column, timeZone);
          map.set(key, [...(map.get(key) ?? []), entry]);
        }
      }
    }
    return map;
  }, [entries, columns, timeZone]);

  function openSlot(column: Date, minutes: number) {
    const startsAt = new Date(column.getTime() + minutes * 60_000);
    setDraft({
      startsAt,
      endsAt: new Date(startsAt.getTime() + DEFAULT_MINUTES * 60_000),
    });
  }

  if (loading || !me) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const title = formatIn(start, timeZone, { month: "long", year: "numeric" });

  return (
    <div className="fade-in flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-hairline px-6 py-4">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        <div className="flex items-center gap-1">
          <NavButton label="Previous" onClick={() => setAnchor(addDays(start, -days, timeZone))}>
            &lsaquo;
          </NavButton>
          <NavButton label="Next" onClick={() => setAnchor(addDays(start, days, timeZone))}>
            &rsaquo;
          </NavButton>
        </div>
        <button
          onClick={() => setAnchor(new Date())}
          className="rounded-full border border-hairline px-3 py-1 text-xs font-medium text-ink-soft hover:border-hairline-strong hover:text-ink"
        >
          Today
        </button>
        <Button
          className="ml-auto"
          onClick={() => {
            const now = new Date();
            const at = new Date(now);
            at.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
            setDraft({ startsAt: at, endsAt: new Date(at.getTime() + DEFAULT_MINUTES * 60_000) });
          }}
        >
          New event
        </Button>
      </header>

      <ErrorText>{error}</ErrorText>

      <div className="flex shrink-0 border-b border-hairline pl-14">
        {columns.map((column) => (
          <div key={column.toISOString()} className="flex-1 px-2 py-2 text-center">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">
              {formatIn(column, timeZone, { weekday: "short" })}
            </p>
            <p
              className={cn(
                "font-display text-lg",
                dayKey(column, timeZone) === dayKey(new Date(), timeZone)
                  ? "text-accent-strong"
                  : "text-ink",
              )}
            >
              {formatIn(column, timeZone, { day: "numeric" })}
            </p>
          </div>
        ))}
      </div>

      <div ref={scroller} className="relative flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: (DAY_MINUTES / 60) * HOUR_PX }}>
          <div className="w-14 shrink-0">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                style={{ height: HOUR_PX }}
                className="relative border-t border-hairline/60 pr-2 text-right"
              >
                <span className="absolute -top-2 right-2 text-[10px] tabular-nums text-ink-faint">
                  {hour === 0 ? "" : formatIn(
                    new Date(Date.UTC(2026, 0, 1, hour)),
                    "UTC",
                    { hour: "numeric" },
                  )}
                </span>
              </div>
            ))}
          </div>

          {columns.map((column) => (
            <DayColumn
              key={column.toISOString()}
              column={column}
              timeZone={timeZone}
              entries={byDay.get(dayKey(column, timeZone)) ?? []}
              onPickSlot={(minutes) => openSlot(column, minutes)}
              onPickEvent={(entry) =>
                setDraft({
                  event: entry,
                  startsAt: new Date(entry.startsAt!),
                  endsAt: new Date(entry.endsAt!),
                })
              }
            />
          ))}
        </div>
      </div>

      {draft && (
        <EventEditor
          draft={draft}
          timeZone={timeZone}
          collections={collections}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            void load();
          }}
          onDeleted={() => {
            setDraft(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="h-7 w-7 rounded-sm text-lg leading-none text-ink-faint hover:bg-paper hover:text-ink"
    >
      {children}
    </button>
  );
}

function DayColumn({
  column,
  timeZone,
  entries,
  onPickSlot,
  onPickEvent,
}: {
  column: Date;
  timeZone: string;
  entries: CalendarEntry[];
  onPickSlot: (minutes: number) => void;
  onPickEvent: (entry: CalendarEntry) => void;
}) {
  const dayEnd = addDays(column, 1, timeZone);

  return (
    <div
      data-day={dayKey(column, timeZone)}
      className="relative flex-1 border-l border-hairline/60"
      onClick={(e) => {
        // Only the background makes a slot; a click that landed on an event
        // has already been handled by it.
        if (e.target !== e.currentTarget) return;
        const box = e.currentTarget.getBoundingClientRect();
        const minutes = ((e.clientY - box.top) / HOUR_PX) * 60;
        // Snapped to the half hour, because nobody means 14:07.
        onPickSlot(Math.max(0, Math.floor(minutes / 30) * 30));
      }}
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <div
          key={hour}
          style={{ height: HOUR_PX }}
          className="pointer-events-none border-t border-hairline/60"
        />
      ))}

      {entries.map((entry) => {
        const startsAt = new Date(entry.startsAt!);
        const endsAt = new Date(entry.endsAt!);
        // Clipped to this column, so a meeting that began yesterday starts at
        // the top of today rather than above it.
        const top = startsAt < column ? 0 : minutesIntoDay(startsAt, timeZone);
        const bottom = endsAt > dayEnd ? DAY_MINUTES : minutesIntoDay(endsAt, timeZone);
        const height = Math.max(bottom - top, 20);
        const free = entry.transp === "transparent";

        return (
          <button
            key={`${entry.id}-${dayKey(column, timeZone)}`}
            data-event-id={entry.id}
            onClick={() => onPickEvent(entry)}
            style={{
              top: (top / 60) * HOUR_PX,
              height: (height / 60) * HOUR_PX,
              borderColor: entry.calendarColor,
              background: free ? "transparent" : `${entry.calendarColor}1f`,
            }}
            className={cn(
              "absolute inset-x-1 overflow-hidden rounded-sm border-l-2 px-2 py-1 text-left",
              // A cancelled event stays visible and struck through: it was on
              // somebody's day, and having it vanish is how people turn up.
              entry.status === "cancelled" && "line-through opacity-60",
              free && "border border-dashed",
            )}
          >
            <span className="block truncate text-xs font-medium text-ink">{entry.summary}</span>
            <span className="block truncate text-[10px] text-ink-faint">
              {formatIn(startsAt, timeZone, { hour: "numeric", minute: "2-digit" })}
              {entry.location ? ` · ${entry.location}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
