/**
 * Dates in the mailbox's timezone, rather than the browser's.
 *
 * A calendar has to be drawn in the zone the person works in. Those are
 * usually the same, but not when somebody is travelling — and a week view that
 * silently redraws itself around whatever airport they landed at is the kind
 * of bug people distrust the whole product over. Mail here is already read
 * against the mailbox's zone; the calendar follows it.
 *
 * Everything below goes through Intl rather than the Date methods, because the
 * Date methods only ever know two zones: UTC and the machine's.
 */

interface Zoned {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let found = formatterCache.get(timeZone);
  if (!found) {
    found = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timeZone, found);
  }
  return found;
}

/** The wall-clock reading in a zone, for an instant. */
export function zonedParts(date: Date, timeZone: string): Zoned {
  const parts = Object.fromEntries(
    formatter(timeZone).formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Some environments render midnight as "24" under hour12: false.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/** How far ahead of UTC a zone is, at a given instant. DST included. */
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const seconds = Number(
    Object.fromEntries(
      formatter(timeZone).formatToParts(date).map((x) => [x.type, x.value]),
    ).second ?? 0,
  );
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, seconds) - date.getTime();
}

/**
 * The instant at which a zone's clock reads this.
 *
 * Two passes, not one. The offset depends on the instant, and the instant is
 * what is being solved for — so the first guess is corrected by the offset
 * that actually applies there. Without the second pass, an event created in
 * the week a clock changes lands an hour out.
 */
export function instantFromZoned(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): Date {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

/** "2026-09-01", in the zone — the key a day column is grouped by. */
export function dayKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Minutes since the zone's midnight, which is where an event sits in a column. */
export function minutesIntoDay(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  return p.hour * 60 + p.minute;
}

/** Midnight, in the zone, on the day an instant falls. */
export function startOfDay(date: Date, timeZone: string): Date {
  const p = zonedParts(date, timeZone);
  return instantFromZoned({ ...p, hour: 0, minute: 0 }, timeZone);
}

/** Midnight on the Monday of the week an instant falls in, in the zone. */
export function startOfWeek(date: Date, timeZone: string): Date {
  const midnight = startOfDay(date, timeZone);
  // getUTCDay on a zone's midnight can read as the previous day, so the
  // weekday comes from the zone's own calendar rather than the instant's.
  const p = zonedParts(date, timeZone);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const backTo = (weekday + 6) % 7; // Monday is the first column.
  return addDays(midnight, -backTo, timeZone);
}

/**
 * Whole days later, in the zone.
 *
 * Not by adding milliseconds: the day a clock changes is 23 or 25 hours long,
 * and a week view built on 24-hour arithmetic drifts an hour twice a year and
 * then shows the wrong dates entirely.
 */
export function addDays(date: Date, days: number, timeZone: string): Date {
  const p = zonedParts(date, timeZone);
  const shifted = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return instantFromZoned(
    {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: p.hour,
      minute: p.minute,
    },
    timeZone,
  );
}

/** A label in the zone, e.g. "Tue 1 Sep" or "14:30". */
export function formatIn(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(undefined, { timeZone, ...options }).format(date);
}

/** The value an `<input type="datetime-local">` wants, read in the zone. */
export function toLocalInput(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** The instant such an input names, read as a wall clock in the zone. */
export function fromLocalInput(value: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return instantFromZoned(
    {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
    },
    timeZone,
  );
}
