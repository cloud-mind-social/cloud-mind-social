"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { compose } from "@/lib/api";
import { subscribePendingSend, setPendingSend, type PendingSend } from "@/lib/pending-send";

/**
 * "Sent. Undo" — the whole point of the outbox, in one strip.
 *
 * The countdown is shown rather than implied. A bare "Undo" with no clock
 * makes people hesitate over whether it still works, which is exactly the
 * moment the window runs out; a visible number tells them how long they have
 * to decide.
 *
 * The toast disappears on its own when the window closes. It does not claim
 * the message was recalled unless the server said so — undo can lose, and a
 * button that lies about it is worse than one that isn't there.
 */
export function UndoToast() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingSend | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [outcome, setOutcome] = useState<"recalled" | "too-late" | null>(null);

  useEffect(() => subscribePendingSend(setPending), []);

  useEffect(() => {
    if (!pending) return;
    setOutcome(null);
    const tick = () => {
      const left = Math.ceil((pending.expiresAt - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) setPendingSend(null);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [pending]);

  // The outcome message stands on its own for a moment after the offer goes.
  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => setOutcome(null), 4000);
    return () => clearTimeout(timer);
  }, [outcome]);

  async function undo() {
    if (!pending) return;
    const { id } = pending;
    setPendingSend(null);
    try {
      await compose.undoSend(id);
      setOutcome("recalled");
      router.push(`/compose?draftId=${id}`);
    } catch {
      // 409: the flush got there first. Say so plainly.
      setOutcome("too-late");
      router.refresh();
    }
  }

  if (!pending && !outcome) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-sm border border-hairline bg-ink px-4 py-2.5 text-sm text-paper shadow-lg">
        {pending ? (
          <>
            <span className="min-w-0 truncate">
              Sending{pending.subject ? ` “${pending.subject}”` : ""}
            </span>
            <span className="shrink-0 tabular-nums text-paper/60">{remaining}s</span>
            <button
              onClick={() => void undo()}
              className="shrink-0 font-semibold text-paper underline underline-offset-4 hover:text-paper/80"
            >
              Undo
            </button>
          </>
        ) : (
          <span>
            {outcome === "recalled"
              ? "Pulled back — it's in your drafts."
              : "Too late — that message has already gone."}
          </span>
        )}
      </div>
    </div>
  );
}
