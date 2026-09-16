/**
 * Helpers for treating the search box as the single source of truth for
 * filtering.
 *
 * The quick-filter chips used to be separate query parameters, which meant two
 * filter systems that couldn't see each other: typing `is:unread` left the
 * "Unread" chip dark, and clicking the chip didn't show up in the box. Now the
 * chips add and remove tokens in the query itself, so what filters the list is
 * always exactly what's written.
 */

/** Splits a query into tokens, keeping quoted runs intact. */
export function splitTokens(query: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (const ch of query) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** True when `token` is already present in the query. */
export function hasToken(query: string, token: string): boolean {
  return splitTokens(query).some((t) => eq(t, token));
}

/**
 * Adds `token` if absent, removes it if present.
 *
 * Adding also drops the token's opposite — `is:read` and `is:unread` are one
 * control with two positions, not two independent filters.
 */
export function toggleToken(query: string, token: string, opposite?: string): string {
  const tokens = splitTokens(query);
  const present = tokens.some((t) => eq(t, token));
  const kept = tokens.filter((t) => !eq(t, token) && (!opposite || !eq(t, opposite)));
  const next = present ? kept : [...kept, token];
  return next.join(" ");
}

/** Replaces any existing `field:` token with `field:value`, or removes it. */
export function setFieldToken(query: string, field: string, value: string | null): string {
  const prefix = `${field.toLowerCase()}:`;
  const kept = splitTokens(query).filter((t) => !t.toLowerCase().startsWith(prefix));
  return (value ? [...kept, `${field}:${value}`] : kept).join(" ");
}

/**
 * The operator reference shown under the search box. `insert: false` marks an
 * entry that is a pattern to imitate rather than a token to paste — appending a
 * literal `-word` would search for the word "word".
 */
export const SEARCH_HELP: { token: string; label: string; insert?: false }[] = [
  { token: "from:", label: "sender" },
  { token: "to:", label: "recipient" },
  { token: "cc:", label: "copied" },
  { token: "subject:", label: "subject only" },
  { token: "filename:", label: "attachment name" },
  { token: "label:", label: "labelled" },
  { token: "has:attachment", label: "has a file" },
  { token: "is:unread", label: "unread" },
  { token: "is:starred", label: "starred" },
  { token: "in:anywhere", label: "every folder" },
  { token: "newer_than:7d", label: "last 7 days" },
  { token: "older_than:1y", label: "over a year old" },
  { token: "before:2026-01-01", label: "before a date" },
  { token: "larger:5M", label: "over a size" },
  { token: "-word", label: "exclude", insert: false },
];
