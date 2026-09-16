/**
 * The times people actually pick when they schedule mail.
 *
 * Almost every scheduled send is one of a handful of intentions — "not until
 * the morning", "start of next week", "this afternoon". Offering those as one
 * click, with the exact date and time spelled out beside each, is faster and
 * less error-prone than a date picker, which stays available for the rest.
 */

const MORNING = 8;
const AFTERNOON = 13;

function at(date: Date, hour: number): Date {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Preset times that are still in the future, given `now`. */
export function schedulePresets(now = new Date()): { label: string; at: Date }[] {
  const options: { label: string; at: Date }[] = [];

  const laterToday = at(now, AFTERNOON);
  if (laterToday > now) options.push({ label: "This afternoon", at: laterToday });

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  options.push({ label: "Tomorrow morning", at: at(tomorrow, MORNING) });
  options.push({ label: "Tomorrow afternoon", at: at(tomorrow, AFTERNOON) });

  // The next Monday that isn't today: "Monday morning" said on a Monday means
  // next week, not eight hours ago.
  const monday = new Date(now);
  const daysUntilMonday = (8 - monday.getDay()) % 7 || 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  options.push({ label: "Monday morning", at: at(monday, MORNING) });

  return options;
}

/** "Tue, Aug 26 at 8:00 AM" — the whole answer, no mental arithmetic. */
export function formatScheduled(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} at ${time}`;
}

/** The value a `datetime-local` input wants, in local time. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    "-", pad(date.getMonth() + 1),
    "-", pad(date.getDate()),
    "T", pad(date.getHours()),
    ":", pad(date.getMinutes()),
  ].join("");
}

/**
 * Snooze presets — the same idea as the send ones, different intentions.
 *
 * "Later today" is the one that doesn't map onto a send preset: mail you want
 * out of the way for a few hours, not until a named day. It disappears once
 * there is no meaningful "later today" left.
 */
export function snoozePresets(now = new Date()): { label: string; at: Date }[] {
  const options: { label: string; at: Date }[] = [];

  const laterToday = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  if (laterToday.getHours() >= 6 && laterToday.getDate() === now.getDate()) {
    options.push({ label: "Later today", at: laterToday });
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  options.push({ label: "Tomorrow", at: at(tomorrow, MORNING) });

  // The coming Saturday. Said on a Saturday it means the next one, for the
  // same reason "Monday morning" on a Monday means next week.
  const weekend = new Date(now);
  weekend.setDate(weekend.getDate() + ((6 - weekend.getDay() + 7) % 7 || 7));
  options.push({ label: "This weekend", at: at(weekend, MORNING) });

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + ((8 - nextWeek.getDay()) % 7 || 7));
  options.push({ label: "Next week", at: at(nextWeek, MORNING) });

  return options;
}

/**
 * The same wall clock, in a named zone rather than the browser's.
 *
 * A `datetime-local` input has no timezone: it shows and returns whatever the
 * browser calls local. That is wrong here, because the mailbox has its own
 * zone and the times around this input are rendered in it — a reader whose
 * laptop is set to somewhere else would see 2:00 PM on the row and 6:00 PM in
 * the box for the same appointment, which is how someone arrives an hour late.
 */
export function toDateTimeLocalInZone(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  // en-CA gives zero-padded parts; hour can come back as "24" at midnight.
  const hour = String(Number(parts.hour) % 24).padStart(2, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

/** The instant a wall-clock value means in a named zone. */
export function fromDateTimeLocalInZone(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return new Date(NaN);
  const [, y, mo, d, h, mi] = match;

  // Guess UTC, then correct by the offset that guess actually lands on. Right
  // except in the hour daylight saving removes, where any answer is arguable.
  const guess = Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!);
  const seen = toDateTimeLocalInZone(new Date(guess), timeZone);
  const seenMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(seen);
  if (!seenMatch) return new Date(guess);
  const [, sy, smo, sd, sh, smi] = seenMatch;
  const seenAsUtc = Date.UTC(+sy!, +smo! - 1, +sd!, +sh!, +smi!);
  return new Date(guess + (guess - seenAsUtc));
}
