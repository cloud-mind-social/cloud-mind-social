/** D1 stores `datetime('now')` as "YYYY-MM-DD HH:MM:SS" in UTC. */
export function parseSqlDate(value: string): Date {
  return new Date(`${value.replace(" ", "T")}Z`);
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function timeAgo(value: string, now = Date.now()): string {
  const seconds = Math.round((parseSqlDate(value).getTime() - now) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 45) return "just now";

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (absolute >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return formatter.format(Math.round(seconds / 60), "minute");
}

export function fullDate(value: string): string {
  return parseSqlDate(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}
