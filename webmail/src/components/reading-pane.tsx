"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  mail,
  type Label,
  type LabelWithCount,
  type MessageDetail,
  type ProposedTime,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { Button, Spinner } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { LabelChip } from "@/components/label-chip";
import { LabelMenu } from "@/components/label-menu";
import { SnoozeMenu } from "@/components/snooze-menu";
import { InvitationCard } from "@/components/invitation-card";
import { ProposedTimes } from "@/components/proposed-times";
import { formatScheduled } from "@/lib/schedule-times";

function formatFull(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function baseSubject(subject: string): string {
  return subject.replace(/^(re|fwd):\s*/i, "");
}

function HtmlBody({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  // Every link must open a NEW tab: navigating inside the sandboxed frame
  // both breaks the target page (it renders as a blocked framed document)
  // and silently burns one-time links like sign-in magic links. The <base>
  // covers links without an explicit target; allow-popups-to-escape-sandbox
  // in the sandbox list lets the new tab open unsandboxed.
  //
  // The canvas is deliberately NEUTRAL, not themed: email HTML is designed
  // against a white client background, so the frame gets white + dark text
  // regardless of the app's light/dark theme. Every rule is wrapped in
  // :where() (zero specificity) so the email's own styles always win.
  const framedHtml = `<base target="_blank"><meta name="color-scheme" content="light"><style>
    :where(html){background:#ffffff}
    :where(body){margin:0;padding:16px;background:#ffffff;color:#202124;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      font-size:14px;line-height:1.6;overflow-wrap:break-word}
    :where(a){color:#0b57d0}
    :where(img){max-width:100%;height:auto}
    :where(table){max-width:100%}
    :where(blockquote){margin:0 0 0 .5em;padding-left:.9em;border-left:2px solid #dadce0;color:#5f6368}
  </style>${html}`;

  return (
    <iframe
      ref={ref}
      srcDoc={framedHtml}
      // No allow-scripts, ever: this renders untrusted sender-controlled HTML.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="w-full rounded-sm border-0 bg-white"
      style={{ height }}
      onLoad={() => {
        try {
          const doc = ref.current?.contentWindow?.document;
          if (doc) setHeight(Math.min(doc.documentElement.scrollHeight + 16, 4000));
        } catch {
          // Cross-origin access failed; keep the fallback height.
        }
      }}
      title="Message body"
    />
  );
}

export function ReadingPane({
  message,
  thread,
  loading,
  onToggleRead,
  onToggleStar,
  onDelete,
  labels,
  onSnooze,
  onUnsnooze,
  onRefresh,
  onScheduleReply,
  onAddToCalendar,
  onToggleLabel,
  onCreateLabel,
  onLabelMenuOpen,
}: {
  message: MessageDetail | null;
  /** Every message in the conversation, chronological, including `message` itself. */
  thread: MessageDetail[];
  loading: boolean;
  onToggleRead: (read: boolean) => void;
  onToggleStar: (starred: boolean) => void;
  onDelete: () => void;
  /** Every label in the mailbox, for the "Label as" menu. */
  labels: LabelWithCount[];
  onSnooze: (until: Date) => void | Promise<void>;
  onUnsnooze: () => void | Promise<void>;
  /** Re-reads the message, after an RSVP changes what it says. */
  onRefresh: () => void;
  /** Opens a reply, optionally scheduled for a time found in the body. */
  onScheduleReply: (options: { at?: Date; confirming?: string }) => void;
  /** Opens the confirmation dialog for a detected time. */
  onAddToCalendar: (time: ProposedTime) => void;
  onToggleLabel: (label: Label, on: boolean) => void | Promise<void>;
  onCreateLabel: (name: string) => Promise<Label | null>;
  onLabelMenuOpen?: () => void;
}) {
  const [showSource, setShowSource] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setShowSource(false);
    setSource(null);
    setExpandedId(message?.id ?? null);
  }, [message?.id]);

  async function toggleSource() {
    if (!message) return;
    const next = !showSource;
    setShowSource(next);
    if (next && source === null) {
      setSourceLoading(true);
      try {
        const res = await fetch(mail.sourceUrl(message.id), { credentials: "include" });
        setSource(await res.text());
      } finally {
        setSourceLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="h-px w-10 bg-hairline-strong" />
        <p className="font-display text-lg text-ink-faint">Select a letter to read it.</p>
      </div>
    );
  }

  const replyHref =
    message.direction === "inbound"
      ? `/compose?replyTo=${message.id}`
      : `/compose?forwardOf=${message.id}`;

  const orderedThread = thread.length > 0 ? thread : [message];

  /**
   * Saves every attachment. Downloads are staggered: browsers drop
   * simultaneous programmatic downloads, and a small gap makes a five-file
   * message actually produce five files.
   */
  function downloadAll(m: MessageDetail) {
    m.attachments.forEach((a, i) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = mail.attachmentDownloadUrl(m.id, a.id);
        link.download = a.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, i * 250);
    });
  }

  const hasMultiple = orderedThread.length > 1;

  /**
   * Attachments: images preview inline (that is what they are for), everything
   * else stays a named download chip. "Download all" triggers each download in
   * turn — the browser is the only thing that can write to the user's disk, and
   * zipping server-side would mean re-fetching and re-encoding every part.
   */
  function renderAttachments(m: MessageDetail) {
    if (m.attachments.length === 0) return null;
    const images = m.attachments.filter((a) => a.contentType.startsWith("image/"));
    const files = m.attachments.filter((a) => !a.contentType.startsWith("image/"));

    return (
      <div className="border-t border-hairline px-4 py-4 md:px-6">
        <div className="mb-2 flex items-baseline gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            {m.attachments.length} attachment{m.attachments.length > 1 ? "s" : ""}
          </p>
          {m.attachments.length > 1 && (
            <button
              onClick={() => downloadAll(m)}
              className="text-[11px] font-medium text-accent hover:underline"
            >
              Download all
            </button>
          )}
        </div>

        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((a) => (
              <a
                key={a.id}
                href={mail.attachmentUrl(m.id, a.id)}
                target="_blank"
                rel="noreferrer"
                title={`${a.filename} · ${formatSize(a.sizeBytes)}`}
                className="block w-28 overflow-hidden rounded-sm border border-hairline hover:border-hairline-strong"
              >
                <img
                  src={mail.attachmentUrl(m.id, a.id)}
                  alt={a.filename}
                  loading="lazy"
                  className="h-28 w-28 bg-paper-raised object-cover"
                />
                {/* Several screenshots in one message look identical cropped;
                    the name is what tells them apart. */}
                <span className="block truncate border-t border-hairline bg-paper-raised px-1.5 py-1 text-[10px] text-ink-faint">
                  {a.filename}
                </span>
              </a>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((a) => (
              <a
                key={a.id}
                href={mail.attachmentDownloadUrl(m.id, a.id)}
                download={a.filename}
                className="flex items-center gap-2 rounded-sm border border-hairline bg-paper-raised px-3 py-2 text-xs text-ink-soft hover:border-hairline-strong hover:text-ink"
              >
                <span>{"\u{1F4CE}"}</span>
                <span className="max-w-[12rem] truncate">{a.filename}</span>
                <span className="text-ink-faint">{formatSize(a.sizeBytes)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-hairline px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            label={message.fromAddr}
            outbound={message.direction === "outbound"}
            className="mt-0.5 h-10 w-10 shrink-0 text-sm"
          />
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight text-ink">
              {(hasMultiple ? baseSubject(message.subject) : message.subject) || "(no subject)"}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              <span className="font-medium text-ink">{message.fromAddr}</span>
              {" → "}
              {message.toAddrs.join(", ")}
              {message.ccAddrs.length > 0 && <span className="text-ink-faint"> · cc {message.ccAddrs.join(", ")}</span>}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {formatFull(message.receivedAt ?? message.sentAt)}
              {hasMultiple && ` · ${orderedThread.length} messages in this conversation`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-hairline bg-paper-raised p-1">
          <button
            onClick={() => onToggleStar(!message.isStarred)}
            title={message.isStarred ? "Unstar" : "Star"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-base transition-colors hover:bg-paper",
              message.isStarred ? "text-brass" : "text-hairline-strong hover:text-brass",
            )}
          >
            {message.isStarred ? "★" : "☆"}
          </button>
          <span className="h-4 w-px bg-hairline" />
          <button
            onClick={() => onToggleRead(!message.isRead)}
            title={message.isRead ? "Mark unread" : "Mark read"}
            className="rounded-full px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-paper hover:text-ink"
          >
            {message.isRead ? "Mark unread" : "Mark read"}
          </button>
          <span className="h-4 w-px bg-hairline" />
          <button
            onClick={onDelete}
            title="Move to Trash"
            className="rounded-full px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger-soft"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-hairline bg-paper-raised px-6 py-2.5">
        <Link href={replyHref}>
          <Button className="h-8 px-4 text-xs">{message.direction === "inbound" ? "Reply" : "Forward"}</Button>
        </Link>
        <button
          onClick={toggleSource}
          className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
        >
          {showSource ? "Hide source" : "View source"}
        </button>
        {message.snoozedUntil ? (
          <span className="flex items-center gap-2 text-xs text-ink-faint">
            <span>Comes back {formatScheduled(message.snoozedUntil)}</span>
            <button
              onClick={() => void onUnsnooze()}
              className="font-medium text-accent hover:underline"
            >
              Bring it back now
            </button>
          </span>
        ) : (
          <SnoozeMenu onSnooze={onSnooze} />
        )}
        <LabelMenu
          labels={labels}
          applied={message.labels}
          onToggle={onToggleLabel}
          onCreate={onCreateLabel}
          onOpen={onLabelMenuOpen}
        />
        {/* The chips sit beside the menu rather than under the subject: taking
            a label off is the same gesture as putting one on. */}
        {message.labels.length > 0 && (
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {message.labels.map((l) => (
              <LabelChip key={l.id} label={l} onRemove={() => void onToggleLabel(l, false)} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {showSource ? (
          <div className="p-6">
            {sourceLoading ? (
              <Spinner className="h-5 w-5 text-ink-faint" />
            ) : (
              <pre className="overflow-x-auto rounded-sm border border-hairline bg-paper-raised p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ink-soft">
                {source}
              </pre>
            )}
          </div>
        ) : hasMultiple ? (
          orderedThread.map((m) => {
            const expanded = m.id === expandedId;
            return (
              <div
                key={m.id}
                className={cn(
                  "border-b border-hairline",
                  m.direction === "outbound" && "bg-accent-soft/25",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-6 py-3 text-left",
                    !expanded && "hover:bg-paper-raised",
                  )}
                >
                  <Avatar
                    label={m.fromAddr}
                    outbound={m.direction === "outbound"}
                    className="mt-0.5 h-7 w-7 shrink-0 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className={cn("font-medium", !m.isRead ? "text-ink" : "text-ink-soft")}>{m.fromAddr}</span>
                      {expanded && (
                        <span className="text-ink-faint">
                          {" → "}
                          {m.toAddrs.join(", ")}
                          {m.ccAddrs.length > 0 && ` · cc ${m.ccAddrs.join(", ")}`}
                        </span>
                      )}
                    </p>
                    {!expanded && (
                      <p className="mt-0.5 truncate text-xs text-ink-faint">
                        {m.textBody?.replace(/\s+/g, " ").trim().slice(0, 140) || "(empty message)"}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.isStarred && <span className="text-brass">★</span>}
                    <span className="text-xs text-ink-faint">{formatFull(m.receivedAt ?? m.sentAt)}</span>
                  </div>
                </button>
                {expanded && (
                  <div>
                    {m.htmlBody ? (
                      <HtmlBody html={m.htmlBody} />
                    ) : (
                      <pre className="whitespace-pre-wrap p-6 font-body text-sm leading-relaxed text-ink">
                        {m.textBody || "(empty message)"}
                      </pre>
                    )}
                    {renderAttachments(m)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <>
            {/* Above the body on purpose: when a message carries an invitation,
                the invitation is the message. Underneath the prose it reads as
                a footnote to something the reader has already had to decode. */}
            {(message.events.length > 0 || message.proposedTimes.length > 0) && (
              <div className="flex flex-col gap-3 border-b border-hairline px-4 py-4 md:px-6">
                {message.events.map((event) => (
                  <InvitationCard
                    key={event.id}
                    event={event}
                    timeZone={message.timeZone}
                    onAnswered={onRefresh}
                  />
                ))}
                <ProposedTimes
                  times={message.proposedTimes}
                  timeZone={message.timeZone}
                  onSchedule={(at) => onScheduleReply({ at })}
                  onReply={(time) => onScheduleReply({ confirming: time.text })}
                  onAddToCalendar={onAddToCalendar}
                />
              </div>
            )}
            {message.htmlBody ? (
              <HtmlBody html={message.htmlBody} />
            ) : (
              <pre className="whitespace-pre-wrap p-6 font-body text-sm leading-relaxed text-ink">
                {message.textBody || "(empty message)"}
              </pre>
            )}
            {renderAttachments(message)}
          </>
        )}
      </div>
    </div>
  );
}
