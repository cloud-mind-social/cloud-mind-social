"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { mail, type MessageDetail } from "@/lib/api";
import { Composer } from "@/components/composer";
import { Spinner } from "@/components/ui";

function ComposeInner() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const replyToId = searchParams.get("replyTo");
  const forwardOfId = searchParams.get("forwardOf");
  /** A time picked out of the message being replied to; see ProposedTimes. */
  const sendAt = searchParams.get("sendAt");
  const confirming = searchParams.get("confirming");

  const [draft, setDraft] = useState<MessageDetail | null>(null);
  const [replyTo, setReplyTo] = useState<MessageDetail | null>(null);
  const [forwardOf, setForwardOf] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(draftId || replyToId || forwardOfId));

  useEffect(() => {
    const id = draftId ?? replyToId ?? forwardOfId;
    if (!id) {
      setLoading(false);
      return;
    }
    mail
      .get(id)
      .then((m) => {
        if (draftId) setDraft(m);
        else if (replyToId) setReplyTo(m);
        else if (forwardOfId) setForwardOf(m);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, replyToId, forwardOfId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <Composer
      draft={draft}
      replyTo={replyTo}
      forwardOf={forwardOf}
      sendAt={sendAt ? new Date(sendAt) : undefined}
      confirming={confirming ?? undefined}
    />
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-ink-faint">
          <Spinner className="h-5 w-5" />
        </div>
      }
    >
      <ComposeInner />
    </Suspense>
  );
}
