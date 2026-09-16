"use client";

import type { Label } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * A label as it appears on a message.
 *
 * Labels carry a user-chosen colour, so the chip is tinted from that hex rather
 * than from the theme: the same eight-character trick gives a wash for the fill
 * and a slightly stronger edge, which keeps an arbitrary colour legible against
 * both paper and its raised variant. A label with no colour falls back to the
 * neutral chip the rest of the list already uses.
 */
export function LabelChip({
  label,
  onRemove,
  className,
}: {
  label: Label;
  onRemove?: () => void;
  className?: string;
}) {
  const tinted = label.color
    ? { backgroundColor: `${label.color}1f`, borderColor: `${label.color}66`, color: label.color }
    : undefined;

  return (
    <span
      style={tinted}
      title={label.name}
      className={cn(
        "inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        !label.color && "border-hairline-strong bg-paper-raised text-ink-faint",
        className,
      )}
    >
      <span className="truncate">{label.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove label ${label.name}`}
          className="shrink-0 leading-none opacity-60 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
