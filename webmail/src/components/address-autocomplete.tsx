"use client";

import { useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui";
import type { DirectoryContact } from "@/lib/api";
import { cn } from "@/lib/cn";

function currentToken(value: string): string {
  const parts = value.split(",");
  return parts[parts.length - 1].trim();
}

function replaceLastToken(value: string, address: string): string {
  const idx = value.lastIndexOf(",");
  const prefix = idx === -1 ? "" : `${value.slice(0, idx + 1)} `;
  return `${prefix}${address}, `;
}

export function AddressAutocomplete({
  value,
  onChange,
  contacts,
  className,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  contacts: DirectoryContact[];
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const token = currentToken(value).toLowerCase();

  /**
   * Matches, best first.
   *
   * The list arrives ranked by how much this mailbox actually corresponds
   * with each person, and that order is kept — except that something
   * *starting* with what you typed beats something merely containing it.
   * Typing "sam" should offer sam@ before wesample@, however often the latter
   * has been written to.
   */
  const matches = token
    ? contacts
        .map((c, index) => {
          const address = c.address.toLowerCase();
          const name = c.displayName.toLowerCase();
          if (address.startsWith(token) || name.startsWith(token)) return { c, rank: 0, index };
          if (address.includes(token) || name.includes(token)) return { c, rank: 1, index };
          return null;
        })
        .filter((m): m is { c: DirectoryContact; rank: number; index: number } => m !== null)
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .slice(0, 6)
        .map((m) => m.c)
    : [];

  useEffect(() => {
    setHighlighted(0);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function pick(address: string) {
    onChange(replaceLastToken(value, address));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => (h + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => (h - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            pick(matches[highlighted].address);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={className}
        {...props}
      />
      {open && matches.length > 0 && (
        <ul className="absolute left-0 top-full z-20 mt-1 w-full min-w-64 rounded-sm border border-hairline bg-paper-raised py-1 shadow-lg">
          {matches.map((c, i) => (
            <li key={c.address}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c.address)}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-1.5 text-left text-sm",
                  i === highlighted ? "bg-accent-soft text-accent-strong" : "text-ink hover:bg-paper",
                )}
              >
                <span className="font-medium">{c.displayName || c.address}</span>
                <span className="flex w-full items-baseline justify-between gap-2 text-xs text-ink-faint">
                  {/* Only worth repeating the address when the name isn't it. */}
                  <span className="truncate">{c.displayName ? c.address : ""}</span>
                  {/* Says why this one is being offered. A suggestion with no
                      reason behind it is a suggestion you second-guess. */}
                  {c.sentCount > 0 && (
                    <span className="shrink-0">
                      {c.sentCount === 1 ? "written once" : `written ${c.sentCount} times`}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
