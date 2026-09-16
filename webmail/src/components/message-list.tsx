"use client";

import { useEffect, useState } from "react";
import type { MessageSort, MessageSummary, SortOrder } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatScheduled } from "@/lib/schedule-times";
import { SnoozeMenu } from "@/components/snooze-menu";
import { Avatar } from "@/components/avatar";
import { LabelChip } from "@/components/label-chip";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

function otherParty(m: MessageSummary): string {
  if (m.direction === "outbound") return m.toAddrs.join(", ") || "(no recipients)";
  return m.fromAddr;
}

interface SortHeaderProps {
  label: string;
  field: MessageSort;
  sort: MessageSort;
  order: SortOrder;
  onChange: (field: MessageSort) => void;
  className?: string;
}

function SortHeader({ label, field, sort, order, onChange, className }: SortHeaderProps) {
  const active = sort === field;
  return (
    <button
      onClick={() => onChange(field)}
      className={cn(
        "flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
        active ? "text-ink" : "text-ink-faint hover:text-ink-soft",
        className,
      )}
    >
      {label}
      {active && <span className="text-brass">{order === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

/**
 * What an outbound message is doing, for the rows that aren't finished.
 *
 * The countdown ticks so the Outbox is not a page you have to refresh to
 * understand; a failure states what went wrong rather than just sitting there
 * looking sent.
 */
function SendStatus({ message, onUndo, onReschedule }: {
  message: MessageSummary;
  onUndo: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const [remaining, setRemaining] = useState(() => secondsLeft(message.sendAfter));

  useEffect(() => {
    if (message.sendState !== "queued") return;
    const tick = () => setRemaining(secondsLeft(message.sendAfter));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [message.sendState, message.sendAfter]);

  if (message.sendState === "failed") {
    return (
      <div className="mt-1 text-[11px] text-danger">
        Not sent — {message.sendError ?? "the mail server refused it"}
      </div>
    );
  }

  if (message.sendState === "sending") {
    return <div className="mt-1 text-[11px] text-ink-faint">Sending…</div>;
  }

  // Far enough out that a ticking countdown would be absurd: say the date.
  const scheduled = remaining > COUNTDOWN_LIMIT_SECONDS;

  return (
    <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
      <span>
        {scheduled
          ? `Scheduled for ${formatScheduled(message.sendAfter!)}`
          : remaining > 0
            ? `Sending in ${remaining}s`
            : "Sending…"}
      </span>
      {remaining > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUndo(message.id);
          }}
          className="font-medium text-accent hover:underline"
        >
          {scheduled ? "Cancel" : "Undo"}
        </button>
      )}
      {scheduled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReschedule(message.id);
          }}
          className="font-medium text-accent hover:underline"
        >
          Change time
        </button>
      )}
    </div>
  );
}

/**
 * Past this, a countdown stops being useful. Two minutes covers every undo
 * window the server allows with room to spare, so anything longer is
 * something the person deliberately scheduled and wants to see as a date.
 */
const COUNTDOWN_LIMIT_SECONDS = 120;

function secondsLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
}

export function MessageList({
  messages,
  selectedId,
  selectedIds,
  sort,
  order,
  onSelect,
  onSort,
  onToggleStar,
  onToggleCheck,
  onToggleCheckAll,
  onBulkMarkRead,
  onBulkStar,
  onBulkDelete,
  loadingMore,
  hasMore,
  onLoadMore,
  onUndoSend,
  onReschedule,
  onBulkSnooze,
  onUnsnooze,
}: {
  messages: MessageSummary[];
  selectedId: string | null;
  selectedIds: Set<string>;
  sort: MessageSort;
  order: SortOrder;
  onSelect: (id: string) => void;
  onSort: (field: MessageSort) => void;
  onToggleStar: (id: string, starred: boolean) => void;
  onToggleCheck: (id: string) => void;
  onToggleCheckAll: () => void;
  onBulkMarkRead: (read: boolean) => void;
  onBulkStar: (starred: boolean) => void;
  onBulkDelete: () => void;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  /** Recalls a message still waiting in the Outbox. */
  onUndoSend: (id: string) => void;
  /** Moves a scheduled message to a different time. */
  onReschedule: (id: string) => void;
  /** Puts every checked message away until a time. */
  onBulkSnooze: (until: Date) => void | Promise<void>;
  /** Brings snoozed messages back now. */
  onUnsnooze: (ids: string[]) => void | Promise<void>;
}) {
  const allChecked = messages.length > 0 && messages.every((m) => selectedIds.has(m.id));
  const someChecked = selectedIds.size > 0;

  const threadCounts = new Map<string, number>();
  for (const m of messages) threadCounts.set(m.threadId, (threadCounts.get(m.threadId) ?? 0) + 1);

  return (
    <div className="flex h-full flex-col">
      {someChecked ? (
        <div className="flex items-center gap-3 border-b border-hairline bg-accent-soft px-4 py-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={onToggleCheckAll}
            className="h-3.5 w-3.5 accent-accent"
          />
          <span className="text-xs font-medium text-accent-strong">{selectedIds.size} selected</span>
          <div className="ml-auto flex items-center gap-3 text-xs font-medium text-accent-strong">
            <button onClick={() => onBulkMarkRead(true)} className="hover:underline">
              Mark read
            </button>
            <button onClick={() => onBulkMarkRead(false)} className="hover:underline">
              Mark unread
            </button>
            <button onClick={() => onBulkStar(true)} className="hover:underline">
              Star
            </button>
            <SnoozeMenu onSnooze={onBulkSnooze} align="right" className="leading-none" />
            <button onClick={onBulkDelete} className="text-danger hover:underline">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={onToggleCheckAll}
            className="h-3.5 w-3.5 shrink-0 accent-accent"
          />
          <span className="w-6 shrink-0" />
          <span className="w-4 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <SortHeader label="From" field="from" sort={sort} order={order} onChange={onSort} className="w-28 shrink-0" />
            <SortHeader label="Subject" field="subject" sort={sort} order={order} onChange={onSort} />
          </div>
          <SortHeader
            label="Date"
            field="date"
            sort={sort}
            order={order}
            onChange={onSort}
            className="w-16 shrink-0 justify-end"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="h-px w-8 bg-hairline-strong" />
            <p className="text-sm text-ink-faint">Nothing here.</p>
          </div>
        )}
        {messages.map((m, i) => {
          const selected = m.id === selectedId;
          const checked = selectedIds.has(m.id);
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(m.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(m.id);
              }}
              style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
              className={cn(
                "rise-in flex w-full cursor-pointer items-start gap-3 border-b border-l-[3px] border-hairline/60 px-4 py-2.5 text-left text-sm transition-colors",
                selected ? "border-l-accent bg-accent-soft" : "border-l-transparent hover:bg-paper-raised",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleCheck(m.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 h-3.5 w-3.5 shrink-0 accent-accent"
              />
              <span className="relative mt-0.5 flex shrink-0 items-center justify-center">
                <Avatar label={otherParty(m)} outbound={m.direction === "outbound"} className="h-6 w-6 text-[11px]" />
                {!m.isRead && (
                  <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-brass ring-2 ring-paper" />
                )}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(m.id, !m.isStarred);
                }}
                className={cn(
                  "mt-0.5 shrink-0 text-base leading-none",
                  m.isStarred ? "text-brass" : "text-hairline-strong hover:text-brass",
                )}
              >
                {m.isStarred ? "★" : "☆"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn("truncate", !m.isRead ? "font-semibold text-ink" : "text-ink-soft")}>
                    {otherParty(m)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      !m.isRead ? "font-semibold text-ink" : "text-ink-faint",
                    )}
                  >
                    {formatDate(m.receivedAt ?? m.sentAt ?? m.createdAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  {(threadCounts.get(m.threadId) ?? 0) > 1 && (
                    <span className="shrink-0 rounded-full bg-paper-raised px-1.5 py-0.5 text-[11px] font-medium text-ink-faint">
                      {threadCounts.get(m.threadId)}
                    </span>
                  )}
                  <span className="min-w-0 truncate">
                    <span className={cn(!m.isRead ? "font-semibold text-ink" : "text-ink-soft")}>
                      {m.subject || "(no subject)"}
                    </span>
                    <span className="text-ink-faint"> — {m.snippet}</span>
                  </span>
                  {m.hasAttachments && <span className="shrink-0 text-ink-faint">{"\u{1F4CE}"}</span>}
                </div>
                {m.snoozedUntil && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                    <span>Comes back {formatScheduled(m.snoozedUntil)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void onUnsnooze([m.id]);
                      }}
                      className="font-medium text-accent hover:underline"
                    >
                      Bring it back
                    </button>
                  </div>
                )}
                {m.sendState && (
                  <SendStatus message={m} onUndo={onUndoSend} onReschedule={onReschedule} />
                )}
                {m.labels.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {m.labels.map((l) => (
                      <LabelChip key={l.id} label={l} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {hasMore && (
          <div className="p-4 text-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="text-xs font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent-strong disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
