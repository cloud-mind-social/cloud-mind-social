"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, labels as labelsApi, mail, type Folder, type LabelWithCount, type Me } from "@/lib/api";
import { cn } from "@/lib/cn";
import { LABEL_COLORS, nextLabelColor } from "@/lib/label-colors";
import { isSignedOut, loginHref } from "@/lib/use-me";
import { Button } from "@/components/ui";

export const FOLDER_LABELS: Record<string, string> = {
  inbox: "Inbox",
  outbox: "Outbox",
  snoozed: "Snoozed",
  sent: "Sent",
  drafts: "Drafts",
  trash: "Trash",
  spam: "Spam",
};

// Outbox sits between Drafts and Sent: it is the stage between the two.
const FOLDER_ORDER = ["inbox", "snoozed", "drafts", "outbox", "sent", "spam", "trash"];

function sortFolders(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => {
    const ai = FOLDER_ORDER.indexOf(a.systemType);
    const bi = FOLDER_ORDER.indexOf(b.systemType);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function Sidebar({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [labels, setLabels] = useState<LabelWithCount[]>([]);
  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [newColor, setNewColor] = useState<string>(LABEL_COLORS[0]!);

  useEffect(() => {
    let cancelled = false;
    function load() {
      mail
        .folders()
        .then((res) => {
          if (!cancelled) setFolders(sortFolders(res.folders));
        })
        .catch((err) => {
          // This polls every 30 seconds, so it is usually the first to notice
          // a session that has gone. Back to the login page, keeping the URL.
          if (!isSignedOut(err)) throw err;
          if (!cancelled) router.replace(loginHref());
        });
      labelsApi.list().then((res) => {
        if (!cancelled) setLabels(res.labels);
      }).catch(() => {
        // A mail stack without labels yet is not an error worth shouting about.
      });
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  async function onLogout() {
    await auth.logout();
    router.replace("/login");
    router.refresh();
  }

  const isAdmin = me.role === "owner" || me.role === "admin";

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-hairline bg-paper-raised">
      <div className="border-b border-hairline px-5 py-5">
        <div className="mb-1 flex items-center gap-2 text-brass">
          <span className="h-px w-5 bg-brass" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.3em]">Cloud Mind Social</span>
        </div>
        <h1 className="font-display text-xl text-ink">Cloud Mind Social Mail</h1>
      </div>

      <div className="px-4 pt-4">
        <Link href="/compose" className="block" onClick={onNavigate}>
          <Button className="w-full">Compose</Button>
        </Link>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {folders.map((folder) => {
          const href = `/mail/${folder.systemType === "custom" ? folder.id : folder.systemType}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={folder.id}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-soft font-medium text-accent-strong"
                  : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
            >
              <span>{FOLDER_LABELS[folder.systemType] ?? folder.name}</span>
              {folder.unreadCount > 0 && (
                <span
                  className={cn(
                    "min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold",
                    active ? "bg-accent text-paper" : "bg-brass-soft text-brass",
                  )}
                >
                  {folder.unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Labels cut across folders: clicking one searches every folder for it,
            which is what "show me everything about the roof job" means. */}
        <div className="mt-5 mb-1 flex items-center justify-between px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-faint">
            Labels
          </span>
          <button
            onClick={() => {
              setNewColor(nextLabelColor(labels));
              setAddingLabel((v) => !v);
              setLabelError(null);
            }}
            aria-label={addingLabel ? "Cancel new label" : "New label"}
            className="text-sm leading-none text-ink-faint hover:text-ink"
          >
            {addingLabel ? "\u00d7" : "+"}
          </button>
        </div>

        {addingLabel && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = newLabel.trim();
              if (!name) return;
              try {
                await labelsApi.create(name, newColor);
                setNewLabel("");
                setAddingLabel(false);
                setLabelError(null);
                setLabels((await labelsApi.list()).labels);
              } catch {
                // The server refuses a duplicate name; say which problem it is.
                setLabelError(`"${name}" already exists`);
              }
            }}
            className="px-3 pb-1"
          >
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label name"
              maxLength={60}
              className="w-full rounded-sm border border-hairline bg-paper px-2 py-1 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
            <div className="mt-1.5 flex items-center gap-1.5">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={newColor === c}
                  style={{ background: c }}
                  className={cn(
                    "h-3.5 w-3.5 rounded-full transition-transform",
                    newColor === c ? "scale-125 ring-2 ring-ink/25" : "hover:scale-110",
                  )}
                />
              ))}
            </div>
            {labelError && <p className="mt-1 text-[11px] text-danger">{labelError}</p>}
          </form>
        )}

        {labels.length === 0 && !addingLabel && (
          <p className="px-3 pb-1 text-[11px] text-ink-faint">
            None yet — labels group mail across folders.
          </p>
        )}

        {labels.map((label) => {
          const href = `/mail/inbox?q=${encodeURIComponent(`in:anywhere label:"${label.name}"`)}`;
          return (
            <Link
              key={label.id}
              href={href}
              onClick={onNavigate}
              className="group flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink"
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: label.color ?? "var(--color-hairline-strong, #9aa5b1)" }}
              />
              <span className="min-w-0 flex-1 truncate">{label.name}</span>
              {label.messageCount > 0 && (
                <span className="text-[11px] tabular-nums text-ink-faint">{label.messageCount}</span>
              )}
            </Link>
          );
        })}

        <Link
          href="/calendar"
          onClick={onNavigate}
          className={cn(
            "mt-3 flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors",
            pathname.startsWith("/calendar")
              ? "bg-accent-soft font-medium text-accent-strong"
              : "text-ink-soft hover:bg-paper hover:text-ink",
          )}
        >
          Calendar
        </Link>

        <Link
          href="/filters"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink"
        >
          Filters
        </Link>

        {isAdmin && (
          <>
            <div className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-faint">
              Owner tools
            </div>
            <Link
              href="/admin"
              onClick={onNavigate}
              className={cn(
                "rounded-sm px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-accent-soft font-medium text-accent-strong"
                  : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
            >
              People &amp; addresses
            </Link>
            <Link
              href="/analytics"
              onClick={onNavigate}
              className={cn(
                "rounded-sm px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/analytics")
                  ? "bg-accent-soft font-medium text-accent-strong"
                  : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
            >
              Analytics
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-hairline px-4 py-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-display text-sm text-accent-strong">
            {me.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{me.displayName}</p>
            <p className="truncate text-xs text-ink-faint">{me.jobTitle ?? me.addresses[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            onClick={onNavigate}
            className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
          >
            Settings
          </Link>
          <button
            onClick={onLogout}
            className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
