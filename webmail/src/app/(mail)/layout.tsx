"use client";

import { useState } from "react";
import Link from "next/link";
import { useMe } from "@/lib/use-me";
import { Sidebar } from "@/components/sidebar";
import { Button, Spinner } from "@/components/ui";
import { UndoToast } from "@/components/undo-toast";

export default function MailLayout({ children }: { children: React.ReactNode }) {
  const { me, loading, error, retry } = useMe();
  const [navOpen, setNavOpen] = useState(false);

  // The profile request failed for a reason other than being signed out (that
  // case has already gone to the login page). Say so; a spinner that never
  // stops reads as a crash.
  if (!loading && !me && error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <div>
          <p className="text-sm font-medium text-ink">Couldn&apos;t load your mailbox.</p>
          <p className="mt-1 text-xs text-ink-faint">{error}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={retry}>
            Try again
          </Button>
          <Link href="/login" className="text-xs font-medium text-ink-faint underline underline-offset-2 hover:text-ink">
            Sign in again
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !me) {
    return (
      <div className="flex h-dvh items-center justify-center bg-paper text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink md:flex-row">
      {/* Phone: the sidebar becomes a top bar + slide-over drawer. */}
      <header className="flex shrink-0 items-center gap-3 border-b border-hairline bg-paper-raised px-4 py-3 md:hidden">
        <button
          aria-label="Open folders"
          onClick={() => setNavOpen(true)}
          className="-ml-1 rounded-sm p-1 text-ink-soft hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-display text-lg text-ink">Cloud Mind Social Mail</span>
        <Link
          href="/compose"
          className="ml-auto rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-paper"
        >
          Compose
        </Link>
      </header>

      <div className="hidden h-full md:block">
        <Sidebar me={me} />
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            aria-hidden
            onClick={() => setNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 h-full shadow-2xl">
            <Sidebar me={me} onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-h-0 min-w-0 flex-1">{children}</div>

      {/* Outlives the composer, which navigates away the moment you press Send. */}
      <UndoToast />
    </div>
  );
}
