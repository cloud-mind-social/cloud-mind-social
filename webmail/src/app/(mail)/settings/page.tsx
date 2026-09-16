"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { Button, ErrorText, Input, Label, Spinner } from "@/components/ui";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ComposerToolbar } from "@/components/composer-toolbar";
import { DevicePasswords } from "@/components/device-passwords";
import { cn } from "@/lib/cn";

/** The windows on offer. Anything longer stops being "undo". */
const UNDO_WINDOWS = [
  { seconds: 0, label: "Off" },
  { seconds: 5, label: "5 seconds" },
  { seconds: 10, label: "10 seconds" },
  { seconds: 20, label: "20 seconds" },
  { seconds: 30, label: "30 seconds" },
];

/** Plain text, as paragraphs, for a signature saved before rich ones existed. */
function escapeToParagraphs(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export default function SettingsPage() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [signature, setSignature] = useState("");

  /**
   * The signature editor is the composer's editor.
   *
   * A signature is a fragment of a message, so writing one should feel like
   * writing one — same toolbar, same shortcuts, same result. Two different
   * rich-text experiences in one product is one too many.
   */
  const signatureEditor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Best,\nYour name" })],
    content: "",
    immediatelyRender: false,
    editorProps: { attributes: { class: "min-h-28 px-3 py-2" } },
  });
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureSuccess, setSignatureSuccess] = useState(false);
  const [signatureSubmitting, setSignatureSubmitting] = useState(false);

  const [undoSeconds, setUndoSeconds] = useState(10);
  const [undoSaved, setUndoSaved] = useState(false);
  const signatureLoaded = useRef(false);

  useEffect(() => {
    if (!me) return;
    setSignature(me.signature ?? "");
    setUndoSeconds(me.undoSendSeconds);
    if (signatureEditor && !signatureLoaded.current) {
      // Already sanitised server-side; this is the round trip of what was
      // stored, not of what was typed.
      signatureEditor.commands.setContent(me.signatureHtml ?? escapeToParagraphs(me.signature ?? ""));
      signatureLoaded.current = true;
    }
  }, [me, signatureEditor]);

  /**
   * Saves on the click rather than behind a Save button: it is one number
   * from a short list, and a radio group that needs confirming is a radio
   * group people leave unconfirmed.
   */
  async function chooseUndoWindow(seconds: number) {
    const previous = undoSeconds;
    setUndoSeconds(seconds);
    setUndoSaved(false);
    try {
      await auth.updateUndoSend(seconds);
      setUndoSaved(true);
    } catch {
      setUndoSeconds(previous);
    }
  }

  async function onSignatureSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignatureError(null);
    setSignatureSuccess(false);
    setSignatureSubmitting(true);
    try {
      const html = signatureEditor?.getHTML() ?? "";
      const text = signatureEditor?.getText() ?? signature;
      // An empty editor serialises to "<p></p>", which is markup for nothing.
      const meaningful = text.trim() ? html : "";
      const saved = await auth.updateSignature(text.trim(), meaningful);
      setSignature(saved.signature);
      setSignatureSuccess(true);
    } catch {
      setSignatureError("Couldn't save your signature. Try again.");
    } finally {
      setSignatureSubmitting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Current password is incorrect.");
      } else {
        setError("Couldn't change your password. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !me) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="fade-in h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">{me.displayName} &middot; {me.addresses[0]}</p>

        <div className="mb-6 rounded-sm border border-hairline bg-paper-raised p-6">
          <h2 className="mb-1 font-display text-lg text-ink">Undo send</h2>
          <p className="mb-4 text-sm text-ink-faint">
            How long a message waits in your Outbox before it goes. Nothing leaves until the
            time is up, so you can still take it back.
          </p>
          <div className="flex flex-wrap gap-2">
            {UNDO_WINDOWS.map((option) => (
              <button
                key={option.seconds}
                onClick={() => void chooseUndoWindow(option.seconds)}
                aria-pressed={undoSeconds === option.seconds}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  undoSeconds === option.seconds
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-hairline text-ink-soft hover:border-hairline-strong hover:text-ink",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {undoSaved && (
            <p className="mt-3 text-sm text-accent-strong">
              {undoSeconds === 0
                ? "Messages will now send straight away."
                : `Messages will wait ${undoSeconds} seconds.`}
            </p>
          )}
        </div>

        <div className="mb-6 rounded-sm border border-hairline bg-paper-raised p-6">
          <h2 className="mb-1 font-display text-lg text-ink">Signature</h2>
          <p className="mb-4 text-sm text-ink-faint">Automatically added to new messages you compose.</p>
          <form onSubmit={onSignatureSubmit} className="flex flex-col gap-4">
            <div className="rounded-sm border border-hairline bg-paper">
              <ComposerToolbar editor={signatureEditor} />
              <EditorContent editor={signatureEditor} />
            </div>
            <ErrorText>{signatureError}</ErrorText>
            {signatureSuccess && (
              <p className="rounded-sm border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-strong">
                Signature saved.
              </p>
            )}
            <Button type="submit" disabled={signatureSubmitting} className="self-start">
              {signatureSubmitting && <Spinner />}
              Save signature
            </Button>
          </form>
        </div>

        <DevicePasswords address={me.addresses[0] ?? ""} />

        <div className="rounded-sm border border-hairline bg-paper-raised p-6">
          <h2 className="mb-4 font-display text-lg text-ink">Change password</h2>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={12}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <ErrorText>{error}</ErrorText>
            {success && (
              <p className="rounded-sm border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-strong">
                Password changed. Your other sessions have been signed out.
              </p>
            )}
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting && <Spinner />}
              Change password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
