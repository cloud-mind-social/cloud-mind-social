"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { compose, directory, mail, type DirectoryContact, type MessageDetail } from "@/lib/api";
import { setPendingSend } from "@/lib/pending-send";
import { ScheduleMenu } from "@/components/schedule-menu";
import { ComposerToolbar } from "@/components/composer-toolbar";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useMe } from "@/lib/use-me";

type PendingAttachment = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  /**
   * Object URL for an image chosen in THIS composer session. Pending
   * attachments have no content endpoint on the server, so a thumbnail can
   * only come from the local file; a draft reopened later shows the name
   * without a preview rather than a broken image.
   */
  previewUrl?: string | null;
};

/**
 * An upload in flight. Kept separately from PendingAttachment because it has
 * no server id yet — a queue of these is what makes progress and per-file
 * cancellation possible instead of one global "Uploading…" flag.
 */
type UploadTask = {
  key: string;
  filename: string;
  sizeBytes: number;
  contentType: string;
  /** 0..1, or null while the transfer size is still unknown. */
  progress: number | null;
  /** Local object URL for an image, so the thumbnail shows before it lands. */
  previewUrl: string | null;
  error: string | null;
  abort: () => void;
};

const isImage = (contentType: string) => contentType.startsWith("image/");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

function parseAddresses(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((a) => a.trim())
    .filter(Boolean);
}

function formatDateForQuote(iso: string | null): string {
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

function replySubject(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}

function forwardSubject(subject: string): string {
  return /^fwd:/i.test(subject.trim()) ? subject : `Fwd: ${subject}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function signatureToHtml(signature: string): string {
  return signature
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

interface InitialState {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  html: string;
  draftId: string | null;
  inReplyTo: string | null;
  attachments: PendingAttachment[];
}

function buildInitialState(
  mode: { draft: MessageDetail | null; replyTo: MessageDetail | null; forwardOf: MessageDetail | null },
): InitialState {
  if (mode.draft) {
    const d = mode.draft;
    return {
      to: d.toAddrs.join(", "),
      cc: d.ccAddrs.join(", "),
      bcc: d.bccAddrs.join(", "),
      subject: d.subject,
      html: d.htmlBody ?? (d.textBody ? `<p>${d.textBody}</p>` : ""),
      draftId: d.id,
      inReplyTo: null,
      attachments: d.attachments.map((a) => ({ id: a.id, filename: a.filename, contentType: a.contentType, sizeBytes: a.sizeBytes })),
    };
  }
  if (mode.replyTo) {
    const original = mode.replyTo;
    const quote = `<blockquote><p>On ${formatDateForQuote(original.receivedAt ?? original.sentAt)}, ${original.fromAddr} wrote:</p>${original.htmlBody ?? `<p>${original.textBody ?? ""}</p>`}</blockquote>`;
    return {
      to: original.fromAddr,
      cc: "",
      bcc: "",
      subject: replySubject(original.subject),
      html: `<p></p>${quote}`,
      draftId: null,
      inReplyTo: original.id,
      attachments: [],
    };
  }
  if (mode.forwardOf) {
    const original = mode.forwardOf;
    const quote = `<blockquote><p>---- Forwarded message ----<br/>From: ${original.fromAddr}<br/>Date: ${formatDateForQuote(original.receivedAt ?? original.sentAt)}<br/>Subject: ${original.subject}<br/>To: ${original.toAddrs.join(", ")}</p>${original.htmlBody ?? `<p>${original.textBody ?? ""}</p>`}</blockquote>`;
    return {
      to: "",
      cc: "",
      bcc: "",
      subject: forwardSubject(original.subject),
      html: `<p></p>${quote}`,
      draftId: null,
      inReplyTo: null,
      attachments: [],
    };
  }
  return { to: "", cc: "", bcc: "", subject: "", html: "", draftId: null, inReplyTo: null, attachments: [] };
}

export function Composer({
  draft,
  replyTo,
  forwardOf,
  sendAt,
  confirming,
}: {
  draft: MessageDetail | null;
  replyTo: MessageDetail | null;
  forwardOf: MessageDetail | null;
  /** Pre-arm the schedule, from a time found in the message being answered. */
  sendAt?: Date;
  /** The words that were read as a time, quoted back into the reply. */
  confirming?: string;
}) {
  const router = useRouter();
  const { me } = useMe();
  const initial = useMemo(() => buildInitialState({ draft, replyTo, forwardOf }), [draft, replyTo, forwardOf]);

  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [to, setTo] = useState(initial.to);
  const [cc, setCc] = useState(initial.cc);
  const [bcc, setBcc] = useState(initial.bcc);
  const [showCcBcc, setShowCcBcc] = useState(Boolean(initial.cc || initial.bcc));
  const [subject, setSubject] = useState(initial.subject);
  const [attachments, setAttachments] = useState<PendingAttachment[]>(initial.attachments);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [dragging, setDragging] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initial.draftId);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipNextAutosave = useRef(true);
  const signatureInserted = useRef(false);
  /** A schedule handed over from the message being replied to; droppable. */
  const [armedSendAt, setArmedSendAt] = useState<Date | undefined>(sendAt);

  // Object URLs outlive the component unless revoked; a composer opened and
  // closed repeatedly with screenshots would otherwise leak them.
  const liveUrls = useRef<Set<string>>(new Set());
  useEffect(() => () => {
    liveUrls.current.forEach((url) => URL.revokeObjectURL(url));
    liveUrls.current.clear();
  }, []);

  useEffect(() => {
    directory
      .list()
      .then((res) => setContacts(res.contacts))
      .catch(() => {});
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your message…" }),
    ],
    content: initial.html,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "px-4 py-3" },
    },
  });

  const buildPayload = useCallback(
    () => ({
      to: parseAddresses(to),
      cc: parseAddresses(cc),
      bcc: parseAddresses(bcc),
      subject,
      html: editor?.getHTML() ?? "",
      text: editor?.getText() ?? "",
      attachmentIds: attachments.map((a) => a.id),
    }),
    [to, cc, bcc, subject, editor, attachments],
  );

  // Prepend the user's signature into a brand-new blank message once it loads.
  useEffect(() => {
    if (!editor || signatureInserted.current) return;
    if (draft || replyTo || forwardOf) return;
    // The rich signature is already sanitised server-side, so it goes in as
    // markup; the plain one is escaped here, since it never was.
    const signature = me?.signatureHtml || (me?.signature ? signatureToHtml(me.signature) : "");
    // A reply confirming a suggested time opens with that time already said,
    // in the sender's own words — if we read them wrongly, the recipient sees
    // it before the day rather than on it.
    const opening = confirming
      ? `<p>${escapeHtml(`That works — ${confirming}.`)}</p>`
      : "<p></p>";
    if (!signature && !confirming) return;
    editor.commands.setContent(`${opening}${signature}`);
    signatureInserted.current = true;
  }, [editor, me, draft, replyTo, forwardOf]);

  // Debounced autosave whenever meaningful fields change.
  useEffect(() => {
    if (!editor) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setSaveState("saving");
      const payload = buildPayload();
      try {
        if (currentDraftId) {
          await compose.updateDraft(currentDraftId, payload);
        } else if (payload.to.length || payload.subject || payload.html.replace(/<[^>]*>/g, "").trim()) {
          const res = await compose.saveDraft(payload);
          setCurrentDraftId(res.id);
        } else {
          setSaveState("idle");
          return;
        }
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, cc, bcc, subject, attachments, editor?.state.doc]);

  /**
   * Uploads each file with its own progress and its own failure. One bad file
   * used to abort the whole batch and report "one of those files failed"
   * without saying which; now every file reports for itself and the others
   * still land.
   */
  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);

    for (const file of list) {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = isImage(file.type) ? URL.createObjectURL(file) : null;
      if (previewUrl) liveUrls.current.add(previewUrl);
      const { promise, abort } = compose.uploadAttachmentWithProgress(file, (fraction) => {
        setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, progress: fraction } : u)));
      });

      setUploads((prev) => [
        ...prev,
        {
          key,
          filename: file.name,
          sizeBytes: file.size,
          contentType: file.type || "application/octet-stream",
          progress: 0,
          previewUrl,
          error: null,
          abort,
        },
      ]);

      promise
        .then((res) => {
          // Hand the preview over to the finished chip rather than revoking it.
          setAttachments((prev) => [...prev, { ...res, previewUrl }]);
          setUploads((prev) => prev.filter((u) => u.key !== key));
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            // Cancelled on purpose: drop it quietly.
            setUploads((prev) => prev.filter((u) => u.key !== key));
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            return;
          }
          setUploads((prev) =>
            prev.map((u) => (u.key === key ? { ...u, error: "Upload failed", progress: null } : u)),
          );
        });
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const going = prev.find((a) => a.id === id);
      if (going?.previewUrl) URL.revokeObjectURL(going.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  function cancelUpload(key: string) {
    const task = uploads.find((u) => u.key === key);
    task?.abort();
    setUploads((prev) => prev.filter((u) => u.key !== key));
    if (task?.previewUrl) URL.revokeObjectURL(task.previewUrl);
  }

  /**
   * Paste-to-attach: a screenshot on the clipboard is the single most common
   * thing people paste into mail, and pasting it as a file is what every
   * other client does. Text pastes are left entirely alone.
   */
  /** Files on a clipboard/drag payload, if any. */
  function filesFrom(data: DataTransfer | null): File[] {
    if (!data) return [];
    const fromItems = Array.from(data.items ?? [])
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    return fromItems.length > 0 ? fromItems : Array.from(data.files ?? []);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const files = filesFrom(e.clipboardData);
    if (files.length === 0) return;
    e.preventDefault();
    handleFiles(files);
  }

  async function onSend(sendAt?: Date) {
    if (parseAddresses(to).length === 0) {
      setError("Add at least one recipient.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const payload = buildPayload();
      const result = await compose.send({
        ...payload,
        draftId: currentDraftId ?? undefined,
        inReplyTo: initial.inReplyTo ?? undefined,
        ...(sendAt ? { sendAt: sendAt.toISOString() } : {}),
      });
      if (result.scheduled) {
        // A schedule is not something to offer an undo on — the message is
        // going in six hours, and the Outbox row is where it gets changed.
        router.push("/mail/outbox");
      } else if (result.queued) {
        // Not gone yet. Hand the offer to take it back to the toast in the
        // layout, which outlives this component, and land where the message
        // actually is rather than where it is going.
        setPendingSend({
          id: result.id,
          subject: payload.subject,
          expiresAt: Date.parse(result.sendAfter ?? "") || Date.now() + (result.undoSeconds ?? 0) * 1000,
        });
        router.push("/mail/outbox");
      } else {
        router.push("/mail/sent");
      }
    } catch {
      setError("Couldn't send that. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  async function onDiscard() {
    if (currentDraftId) {
      await mail.remove(currentDraftId).catch(() => {});
    }
    router.back();
  }

  return (
    <div
      className={cn("fade-in relative flex h-full flex-col", dragging && "ring-2 ring-inset ring-accent")}
      onPaste={handlePaste}
      onDragOver={(e) => {
        e.preventDefault();
        // Only react to actual files; dragging selected text must not arm the
        // drop target.
        if (Array.from(e.dataTransfer.types).includes("Files")) setDragging(true);
      }}
      onDragLeave={(e) => {
        // Fires for children too; ignore unless the pointer really left.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/80">
          <p className="rounded-sm border border-accent bg-paper-raised px-4 py-2 text-sm font-medium text-ink">
            Drop to attach
          </p>
        </div>
      )}
      <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <h1 className="font-display text-2xl text-ink">
          {replyTo ? "Reply" : forwardOf ? "Forward" : "New message"}
        </h1>
        <span className="text-xs text-ink-faint">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : " "}
        </span>
      </div>

      <div className="border-b border-hairline px-6 py-3">
        <div className="flex items-center gap-3 border-b border-hairline/60 py-1.5">
          <label className="w-10 shrink-0 text-xs font-medium text-ink-faint">To</label>
          <AddressAutocomplete
            value={to}
            onChange={setTo}
            contacts={contacts}
            placeholder="name@example.com, another@example.com"
            className="border-0 bg-transparent px-0 py-1 focus:border-0"
          />
          {!showCcBcc && (
            <button
              onClick={() => setShowCcBcc(true)}
              className="shrink-0 text-xs font-medium text-ink-faint hover:text-ink"
            >
              Cc/Bcc
            </button>
          )}
        </div>
        {showCcBcc && (
          <>
            <div className="flex items-center gap-3 border-b border-hairline/60 py-1.5">
              <label className="w-10 shrink-0 text-xs font-medium text-ink-faint">Cc</label>
              <AddressAutocomplete
                value={cc}
                onChange={setCc}
                contacts={contacts}
                className="border-0 bg-transparent px-0 py-1"
              />
            </div>
            <div className="flex items-center gap-3 border-b border-hairline/60 py-1.5">
              <label className="w-10 shrink-0 text-xs font-medium text-ink-faint">Bcc</label>
              <AddressAutocomplete
                value={bcc}
                onChange={setBcc}
                contacts={contacts}
                className="border-0 bg-transparent px-0 py-1"
              />
            </div>
          </>
        )}
        <div className="flex items-center gap-3 py-1.5">
          <label className="w-10 shrink-0 text-xs font-medium text-ink-faint">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-0 bg-transparent px-0 py-1"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ComposerToolbar editor={editor} />
        <EditorContent editor={editor} className="flex-1" />

        {(attachments.length > 0 || uploads.length > 0) && (
          <div className="flex flex-wrap gap-2 border-t border-hairline px-4 py-3">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-2 rounded-sm border border-hairline bg-paper-raised px-2.5 py-1.5 text-xs text-ink-soft"
              >
                {a.previewUrl && (
                  <img src={a.previewUrl} alt="" className="h-8 w-8 rounded-sm object-cover" />
                )}
                <span className="max-w-[12rem] truncate">{a.filename}</span>
                <span className="text-ink-faint">{formatBytes(a.sizeBytes)}</span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  aria-label={`Remove ${a.filename}`}
                  className="text-ink-faint hover:text-danger"
                >
                  ✕
                </button>
              </span>
            ))}

            {uploads.map((u) => (
              <span
                key={u.key}
                className={cn(
                  "flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-xs",
                  u.error ? "border-danger/40 bg-danger-soft text-danger" : "border-hairline bg-paper-raised text-ink-soft",
                )}
              >
                {u.previewUrl && <img src={u.previewUrl} alt="" className="h-8 w-8 rounded-sm object-cover" />}
                <span className="max-w-[10rem] truncate">{u.filename}</span>
                {u.error ? (
                  <span>{u.error}</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span
                      role="progressbar"
                      aria-label={`Uploading ${u.filename}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={u.progress === null ? undefined : Math.round(u.progress * 100)}
                      className="block h-1 w-16 overflow-hidden rounded-full bg-hairline"
                    >
                      <span
                        className="block h-1 rounded-full bg-accent transition-[width] duration-150"
                        style={{ width: `${Math.round((u.progress ?? 0) * 100)}%` }}
                      />
                    </span>
                    <span className="tabular-nums text-ink-faint">
                      {u.progress === null ? "…" : `${Math.round(u.progress * 100)}%`}
                    </span>
                  </span>
                )}
                <button
                  onClick={() => cancelUpload(u.key)}
                  aria-label={`Cancel ${u.filename}`}
                  className="text-ink-faint hover:text-danger"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {armedSendAt && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline bg-accent-soft px-6 py-2.5 text-xs text-accent-strong">
          <span>
            Scheduled for{" "}
            {armedSendAt.toLocaleDateString(undefined, {
              weekday: "short", month: "short", day: "numeric",
            })}{" "}
            at{" "}
            {armedSendAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
          <button
            onClick={() => setArmedSendAt(undefined)}
            className="font-medium underline underline-offset-2"
          >
            Send now instead
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-hairline px-6 py-4">
        <Button onClick={() => void onSend(armedSendAt)} disabled={sending || uploads.some((u) => !u.error)}>
          {sending ? "Sending…" : uploads.some((u) => !u.error) ? "Waiting for uploads…" : "Send"}
        </Button>
        <ScheduleMenu
          onSchedule={(at) => void onSend(at)}
          disabled={sending || uploads.some((u) => !u.error)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-sm border border-hairline px-3 py-2 text-xs font-medium text-ink-soft hover:border-hairline-strong hover:text-ink"
        >
          Attach files
        </button>
        <span className="hidden text-[11px] text-ink-faint sm:inline">
          or drop files here · paste a screenshot
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <button onClick={onDiscard} className="ml-auto text-xs font-medium text-ink-faint hover:text-danger">
          Discard
        </button>
      </div>

      {error && (
        <div className={cn("border-t border-danger/30 bg-danger-soft px-6 py-2 text-sm text-danger")}>{error}</div>
      )}
    </div>
  );
}
