/**
 * The colours a label can take, and how the next one is picked.
 *
 * A colour is the whole point of the dot beside a label name — without one,
 * every label looks the same and the list stops being scannable. So a label
 * always gets one, whether or not the person choosing the name thought about
 * it. The palette is deliberately small: eight distinguishable dots, not a
 * colour wheel nobody wants to operate in a sidebar.
 */
export const LABEL_COLORS = [
  "#0d98ba",
  "#c2410c",
  "#15803d",
  "#7c3aed",
  "#b91c1c",
  "#a16207",
  "#0e7490",
  "#be185d",
] as const;

/** The first colour nothing is using yet, falling back to a rotation. */
export function nextLabelColor(used: { color: string | null }[]): string {
  const free = LABEL_COLORS.find((c) => !used.some((l) => l.color === c));
  return free ?? LABEL_COLORS[used.length % LABEL_COLORS.length]!;
}
