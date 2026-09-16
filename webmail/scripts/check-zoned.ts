/**
 * The timezone arithmetic the calendar is drawn with.
 *
 * Worth its own check rather than trusting it: every failure here is one that
 * looks fine on the day it is written and wrong twice a year, or wrong only
 * for the person who is travelling. There is no test runner in this app, so
 * this runs as a script — `npm run test:zoned`.
 */
import {
  instantFromZoned, dayKey, minutesIntoDay, startOfWeek, addDays, toLocalInput, fromLocalInput,
} from "../src/lib/zoned";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  if (cond) { pass++; console.log(` ok   ${name}`); }
  else { fail++; console.log(`FAIL  ${name}  ${detail}`); }
};

const TZ = "America/New_York";

// Standard time: UTC-5.
ok("a winter wall clock is the right instant",
  instantFromZoned({ year: 2026, month: 1, day: 15, hour: 9, minute: 0 }, TZ).toISOString()
    === "2026-01-15T14:00:00.000Z",
  instantFromZoned({ year: 2026, month: 1, day: 15, hour: 9, minute: 0 }, TZ).toISOString());

// Daylight time: UTC-4.
ok("a summer one accounts for the clocks going forward",
  instantFromZoned({ year: 2026, month: 7, day: 15, hour: 9, minute: 0 }, TZ).toISOString()
    === "2026-07-15T13:00:00.000Z",
  instantFromZoned({ year: 2026, month: 7, day: 15, hour: 9, minute: 0 }, TZ).toISOString());

// 2026-03-08 is the US spring forward. 9am the morning after must still be 9am.
ok("the morning after a clock change is still nine o'clock",
  minutesIntoDay(instantFromZoned({ year: 2026, month: 3, day: 9, hour: 9, minute: 0 }, TZ), TZ) === 540);

// Adding a day across the change is a calendar day, not 24 hours.
const beforeChange = instantFromZoned({ year: 2026, month: 3, day: 7, hour: 9, minute: 0 }, TZ);
ok("a day later is the next date, not 24 hours later",
  dayKey(addDays(beforeChange, 1, TZ), TZ) === "2026-03-08",
  dayKey(addDays(beforeChange, 1, TZ), TZ));
ok("  and two days later crosses it cleanly",
  dayKey(addDays(beforeChange, 2, TZ), TZ) === "2026-03-09",
  dayKey(addDays(beforeChange, 2, TZ), TZ));

// The zone decides the day, not the browser. 2026-09-01T02:00Z is still
// 31 August, 10pm, in New York.
ok("late-evening UTC is still the previous day in the zone",
  dayKey(new Date("2026-09-01T02:00:00Z"), TZ) === "2026-08-31",
  dayKey(new Date("2026-09-01T02:00:00Z"), TZ));

// Weeks start on Monday.
const week = startOfWeek(new Date("2026-09-03T15:00:00Z"), TZ); // a Thursday
ok("a week starts on the Monday", dayKey(week, TZ) === "2026-08-31", dayKey(week, TZ));
ok("  at midnight in the zone", minutesIntoDay(week, TZ) === 0, String(minutesIntoDay(week, TZ)));

// A datetime-local input round-trips through the zone unchanged.
const instant = new Date("2026-11-05T18:30:00Z");
const roundTripped = fromLocalInput(toLocalInput(instant, TZ), TZ);
ok("an input round-trips to the same instant",
  roundTripped?.toISOString() === instant.toISOString(),
  String(roundTripped?.toISOString()));

// A zone far from the browser's, to prove nothing is falling back to local.
ok("Tokyo is read as Tokyo",
  instantFromZoned({ year: 2026, month: 9, day: 1, hour: 9, minute: 0 }, "Asia/Tokyo").toISOString()
    === "2026-09-01T00:00:00.000Z",
  instantFromZoned({ year: 2026, month: 9, day: 1, hour: 9, minute: 0 }, "Asia/Tokyo").toISOString());

ok("a malformed input is refused rather than guessed at", fromLocalInput("not a date", TZ) === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
