import { cn } from "@/lib/cn";

/**
 * Direction-coded monogram, not hash-coded: green matches the sidebar's own-
 * account avatar (outbound = you), brass marks a correspondent (inbound).
 * Two already-established tints stay cohesive instead of adding new hues.
 */
export function Avatar({
  label,
  outbound,
  className,
}: {
  label: string;
  outbound?: boolean;
  className?: string;
}) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display leading-none",
        outbound ? "bg-accent-soft text-accent-strong" : "bg-brass-soft text-brass",
        className,
      )}
    >
      {initial}
    </span>
  );
}
