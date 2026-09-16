"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  mail,
  compose as composeApi,
  labels as labelsApi,
  type Label,
  type LabelWithCount,
  type MessageDetail,
  type MessageSort,
  type MessageSummary,
  type ProposedTime,
  type SortOrder,
} from "@/lib/api";
import { MessageList } from "@/components/message-list";
import { ReadingPane } from "@/components/reading-pane";
import { Input } from "@/components/ui";
import { FOLDER_LABELS } from "@/components/sidebar";
import { hasToken, toggleToken, SEARCH_HELP } from "@/lib/search-tokens";
import { cn } from "@/lib/cn";
import { nextLabelColor } from "@/lib/label-colors";
import { setPendingSend } from "@/lib/pending-send";
import { isSignedOut, loginHref } from "@/lib/use-me";
import { RescheduleDialog } from "@/components/reschedule-dialog";
import { ConfirmEventDialog } from "@/components/confirm-event-dialog";

/**
 * The quick-filter chips are shorthand for search operators, so clicking one
 * and typing it by hand are the same act.
 */
const CHIPS = [
  { label: "Unread", token: "is:unread", opposite: "is:read" },
  { label: "Starred", token: "is:starred", opposite: "-is:starred" },
  { label: "Attachments", token: "has:attachment", opposite: "-has:attachment" },
  { label: "All folders", token: "in:anywhere" },
] as const;

export default function FolderPage({ params }: { params: Promise<{ folder: string }> }) {
  const { folder } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const searchRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<MessageSort>("date");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [showHelp, setShowHelp] = useState(false);
  const [unknownOperators, setUnknownOperators] = useState<string[]>([]);
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [thread, setThread] = useState<MessageDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allLabels, setAllLabels] = useState<LabelWithCount[]>([]);
  const [rescheduling, setRescheduling] = useState<MessageSummary | null>(null);
  /** The time awaiting confirmation before it becomes an appointment. */
  const [confirmingTime, setConfirmingTime] = useState<ProposedTime | null>(null);

  const refreshLabels = useCallback(() => {
    labelsApi.list().then((res) => setAllLabels(res.labels)).catch(() => {});
  }, []);

  const refresh = useCallback(() => {
    mail
      .list({ folder, sort, order, q: query || undefined })
      .then((res) => {
        setMessages(res.messages);
        setNextCursor(res.nextCursor);
        setUnknownOperators(res.search?.unknownOperators ?? []);
        setCheckedIds(new Set());
      })
      .catch((err) => {
        // The session can die between loads — signed out elsewhere, expired.
        // That is a trip to the login page, not an error in the console.
        if (!isSignedOut(err)) throw err;
        router.replace(loginHref());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, sort, order, query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * `?q=` is how everything outside this page hands over a search — the label
   * links in the sidebar, a bookmark, the back button. It is adopted only when
   * it *changes*, so typing in the box (which never touches the URL) isn't
   * fought by a stale parameter, and clearing the box by hand stays cleared.
   */
  const urlQuery = searchParams.get("q") ?? "";
  const adoptedQuery = useRef(urlQuery);
  useEffect(() => {
    if (urlQuery !== adoptedQuery.current) {
      adoptedQuery.current = urlQuery;
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    refreshLabels();
  }, [refreshLabels]);

  /**
   * While something is about to go out, the list is a live view: the countdown
   * runs down and the row moves to Sent by itself.
   *
   * "About to" is the operative word — a message scheduled for next Tuesday is
   * also queued, and polling every three seconds until Tuesday would be a
   * waste of a battery. Only the last couple of minutes are worth watching.
   */
  const hasOutbound = messages.some(
    (m) =>
      m.sendState === "sending" ||
      (m.sendState === "queued" &&
        m.sendAfter !== null &&
        Date.parse(m.sendAfter) - Date.now() < 120_000),
  );
  useEffect(() => {
    if (!hasOutbound) return;
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [hasOutbound, refresh]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setThread([]);
      return;
    }
    setDetailLoading(true);
    mail
      .get(selectedId)
      .then((m) => {
        setDetail(m);
        if (!m.isRead) {
          mail.patch(selectedId, { isRead: true }).then(refresh);
        }
        mail
          .thread(m.threadId)
          .then((res) => setThread(res.messages))
          .catch(() => setThread([m]));
      })
      .catch((err) => {
        if (!isSignedOut(err)) throw err;
        router.replace(loginHref());
      })
      .finally(() => setDetailLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Gmail-familiar shortcuts: c=compose, r=reply/forward, /=focus search.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "c") {
        e.preventDefault();
        router.push("/compose");
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "r" && detail) {
        e.preventDefault();
        router.push(detail.direction === "inbound" ? `/compose?replyTo=${detail.id}` : `/compose?forwardOf=${detail.id}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, detail]);

  /** A URL for this folder that keeps the current search alive. */
  function folderHref(id?: string) {
    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    return `/mail/${folder}${qs ? `?${qs}` : ""}`;
  }

  function select(id: string) {
    if (folder === "drafts") {
      router.push(`/compose?draftId=${id}`);
      return;
    }
    router.push(folderHref(id));
  }

  function onSort(field: MessageSort) {
    if (field === sort) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
  }

  function toggleChip(token: string, opposite?: string) {
    setQuery((prev) => toggleToken(prev, token, opposite));
  }

  /** Appends an operator from the help list and puts the cursor after it. */
  function insertOperator(token: string) {
    setQuery((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
    searchRef.current?.focus();
  }

  async function toggleStar(id: string, starred: boolean) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStarred: starred } : m)));
    await mail.patch(id, { isStarred: starred });
    if (detail?.id === id) setDetail({ ...detail, isStarred: starred });
  }

  async function toggleRead(read: boolean) {
    if (!detail) return;
    setDetail({ ...detail, isRead: read });
    await mail.patch(detail.id, { isRead: read });
    refresh();
  }

  /**
   * Filing is optimistic in both places at once: the open message and its row
   * in the list. A label applied from the reading pane that only showed up
   * after the next poll would read as a click that did nothing.
   */
  async function toggleLabel(label: Label, on: boolean) {
    if (!detail) return;
    const id = detail.id;
    const next = on
      ? [...detail.labels, label].filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i)
      : detail.labels.filter((l) => l.id !== label.id);
    setDetail({ ...detail, labels: next });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, labels: next } : m)));
    try {
      if (on) await labelsApi.apply(id, label.id);
      else await labelsApi.detach(id, label.id);
    } finally {
      refreshLabels();
    }
  }

  /** Creates a label from the "Label as" box and puts it on straight away. */
  async function createAndApplyLabel(name: string): Promise<Label | null> {
    try {
      const made = await labelsApi.create(name, nextLabelColor(allLabels));
      await toggleLabel(made, true);
      return made;
    } catch {
      return null;
    }
  }

  /**
   * Recalls a message from the Outbox row.
   *
   * A 409 means the flush won: the mail is gone, and the honest thing is to
   * refresh so the row moves to Sent rather than to pretend otherwise.
   */
  async function undoSend(id: string) {
    try {
      await composeApi.undoSend(id);
      setPendingSend(null);
      router.push(`/compose?draftId=${id}`);
    } catch {
      refresh();
    }
  }

  /** Opens the "change send time" dialog for a scheduled message. */
  function startReschedule(id: string) {
    setRescheduling(messages.find((m) => m.id === id) ?? null);
  }

  async function moveSchedule(at: Date) {
    if (!rescheduling) return;
    const id = rescheduling.id;
    setRescheduling(null);
    try {
      await composeApi.reschedule(id, at.toISOString());
    } finally {
      // Either it moved or it had already gone; both are answered by the list.
      refresh();
    }
  }

  /**
   * Puts messages away. Navigating off the open one is deliberate: it has
   * just left this folder, and leaving it on screen would show mail that is
   * no longer here.
   */
  async function snoozeMessages(ids: string[], until: Date) {
    if (ids.length === 0) return;
    await mail.snooze(ids, until.toISOString());
    if (detail && ids.includes(detail.id)) router.push(folderHref());
    refresh();
  }

  async function unsnoozeMessages(ids: string[]) {
    if (ids.length === 0) return;
    await mail.unsnooze(ids);
    if (folder === "snoozed" && detail && ids.includes(detail.id)) router.push(folderHref());
    refresh();
  }

  /** Re-reads the open message — an RSVP changes what its card says. */
  function refreshDetail() {
    if (!selectedId) return;
    mail.get(selectedId).then(setDetail).catch(() => {});
  }

  /**
   * Opens a reply from a time found in the message.
   *
   * "Send a note then" schedules the reply for that moment; "Reply to confirm"
   * opens it now with the time quoted, so the words that were matched are the
   * words that go back — if the reading was wrong, the recipient sees it.
   */
  function scheduleReply({ at, confirming }: { at?: Date; confirming?: string }) {
    if (!detail) return;
    const params = new URLSearchParams({ replyTo: detail.id });
    if (at) params.set("sendAt", at.toISOString());
    if (confirming) params.set("confirming", confirming);
    router.push(`/compose?${params.toString()}`);
  }

  async function removeMessage() {
    if (!detail) return;
    await mail.remove(detail.id);
    router.push(folderHref());
    refresh();
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCheckAll() {
    setCheckedIds((prev) => (prev.size === messages.length ? new Set() : new Set(messages.map((m) => m.id))));
  }

  async function bulkMarkRead(read: boolean) {
    const ids = [...checkedIds];
    setMessages((prev) => prev.map((m) => (checkedIds.has(m.id) ? { ...m, isRead: read } : m)));
    await Promise.all(ids.map((id) => mail.patch(id, { isRead: read })));
    refresh();
  }

  async function bulkStar(starred: boolean) {
    const ids = [...checkedIds];
    setMessages((prev) => prev.map((m) => (checkedIds.has(m.id) ? { ...m, isStarred: starred } : m)));
    await Promise.all(ids.map((id) => mail.patch(id, { isStarred: starred })));
    refresh();
  }

  async function bulkDelete() {
    const ids = [...checkedIds];
    await Promise.all(ids.map((id) => mail.remove(id)));
    if (detail && ids.includes(detail.id)) router.push(folderHref());
    refresh();
  }

  async function markAllRead() {
    await mail.markAllRead(folder);
    refresh();
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await mail.list({ folder, sort, order, q: query || undefined, cursor: nextCursor });
      setMessages((prev) => [...prev, ...res.messages]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const folderLabel = FOLDER_LABELS[folder] ?? "Messages";

  return (
    <div className="flex h-full">
      {/* Phone: one pane at a time — the list, or (when a message is open)
          the reading pane with a back bar. md+ keeps the two-pane split. */}
      <div
        className={cn(
          "w-full flex-col border-r border-hairline md:flex md:w-[30rem] md:shrink-0",
          selectedId ? "hidden" : "flex",
        )}
      >
        <div className="border-b border-hairline px-5 pt-4 pb-3">
          <div className="mb-3 flex items-baseline justify-between">
            <h1 className="font-display text-xl text-ink">{folderLabel}</h1>
            <p className="text-xs text-ink-faint">
              {messages.length} message{messages.length === 1 ? "" : "s"}
              {unreadCount > 0 && <span className="text-brass"> · {unreadCount} unread</span>}
            </p>
          </div>
          <Input
            ref={searchRef}
            placeholder="Search, or try from:sue has:attachment (press / to focus)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
            {CHIPS.map((chip) => {
              const on = hasToken(query, chip.token);
              return (
                <button
                  key={chip.token}
                  onClick={() => toggleChip(chip.token, "opposite" in chip ? chip.opposite : undefined)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-hairline text-ink-faint hover:border-hairline-strong hover:text-ink",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
            </div>
            {/* The two text actions travel together, so a narrow pane wraps
                them as a pair instead of stranding one below the chips. */}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setShowHelp((v) => !v)}
                aria-expanded={showHelp}
                className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
              >
                {showHelp ? "Hide operators" : "Operators"}
              </button>
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
              >
                Mark all read
              </button>
            </div>
          </div>

          {/* A typo like `colour:blue` silently returns nothing useful unless we
              say so — the server tells us which operators it didn't know. */}
          {unknownOperators.length > 0 && (
            <p className="mt-2 text-[11px] text-brass">
              Searched literally: {unknownOperators.map((o) => `${o}:`).join(", ")} {""}
              {unknownOperators.length === 1 ? "isn't an operator" : "aren't operators"}.
            </p>
          )}

          {showHelp && (
            <div className="mt-2 rounded-sm border border-hairline bg-paper-raised p-2.5">
              <div className="flex flex-wrap gap-1.5">
                {SEARCH_HELP.map((h) =>
                  h.insert === false ? (
                    <span
                      key={h.token}
                      className="flex items-baseline gap-1 rounded-sm border border-dashed border-hairline px-1.5 py-0.5 text-[11px]"
                    >
                      <code className="font-mono text-ink">{h.token}</code>
                      <span className="text-ink-faint">{h.label}</span>
                    </span>
                  ) : (
                    <button
                      key={h.token}
                      onClick={() => insertOperator(h.token)}
                      title={`Add ${h.token}`}
                      className="flex items-baseline gap-1 rounded-sm border border-hairline px-1.5 py-0.5 text-left text-[11px] hover:border-hairline-strong"
                    >
                      <code className="font-mono text-ink">{h.token}</code>
                      <span className="text-ink-faint">{h.label}</span>
                    </button>
                  ),
                )}
              </div>
              <p className="mt-2 text-[11px] text-ink-faint">
                Terms combine with AND. Quote phrases: <code className="font-mono">subject:&quot;out of office&quot;</code>.
              </p>
            </div>
          )}
        </div>
        <MessageList
          messages={messages}
          selectedId={selectedId}
          selectedIds={checkedIds}
          sort={sort}
          order={order}
          onSelect={select}
          onSort={onSort}
          onToggleStar={toggleStar}
          onToggleCheck={toggleCheck}
          onToggleCheckAll={toggleCheckAll}
          onBulkMarkRead={bulkMarkRead}
          onBulkStar={bulkStar}
          onBulkDelete={bulkDelete}
          hasMore={Boolean(nextCursor)}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          onUndoSend={undoSend}
          onReschedule={startReschedule}
          onBulkSnooze={(until) => snoozeMessages([...checkedIds], until)}
          onUnsnooze={unsnoozeMessages}
        />
      </div>
      {confirmingTime && detail && (
        <ConfirmEventDialog
          messageId={detail.id}
          time={confirmingTime}
          suggestedTitle={detail.subject}
          otherParty={
            detail.direction === "inbound" ? detail.fromAddr : (detail.toAddrs[0] ?? null)
          }
          timeZone={detail.timeZone}
          onCreated={() => {
            // The dialog stays up to say what happened — whether the
            // invitation went and whether the business diary has it. Closing
            // here would swallow both. The event now hangs off the message,
            // so re-reading it is what makes the card appear where the
            // suggestion was.
            refreshDetail();
          }}
          onClose={() => setConfirmingTime(null)}
        />
      )}

      {rescheduling?.sendAfter && (
        <RescheduleDialog
          current={rescheduling.sendAfter}
          onPick={moveSchedule}
          onClose={() => setRescheduling(null)}
        />
      )}

      <div className={cn("min-w-0 flex-1 flex-col md:flex", selectedId ? "flex" : "hidden")}>
        {selectedId && (
          <button
            onClick={() => router.push(folderHref())}
            className="flex shrink-0 items-center gap-1.5 border-b border-hairline px-4 py-2.5 text-left text-sm font-medium text-ink-soft hover:text-ink md:hidden"
          >
            <span aria-hidden>←</span> {folderLabel}
          </button>
        )}
        <div className="min-h-0 flex-1">
          <ReadingPane
            message={detail}
            thread={thread}
            loading={detailLoading}
            onToggleRead={toggleRead}
            onToggleStar={(starred) => toggleStar(detail!.id, starred)}
            onDelete={removeMessage}
            labels={allLabels}
            onSnooze={(until) => snoozeMessages(detail ? [detail.id] : [], until)}
            onRefresh={refreshDetail}
            onScheduleReply={scheduleReply}
            onAddToCalendar={setConfirmingTime}
            onUnsnooze={() => unsnoozeMessages(detail ? [detail.id] : [])}
            onToggleLabel={toggleLabel}
            onCreateLabel={createAndApplyLabel}
            onLabelMenuOpen={refreshLabels}
          />
        </div>
      </div>
    </div>
  );
}
