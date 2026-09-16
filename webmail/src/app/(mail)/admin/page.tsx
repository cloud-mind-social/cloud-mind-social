"use client";

import { useCallback, useEffect, useState } from "react";
import { admin, ApiError, type OrgUser } from "@/lib/api";
import { useRequireAdmin } from "@/lib/use-admin";
import { Button, ErrorText, Input, Label, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function InviteForm({
  isOwner,
  orgDomain,
  onInvited,
}: {
  isOwner: boolean;
  orgDomain: string;
  onInvited: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [localPart, setLocalPart] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    setSubmitting(true);
    try {
      const email = `${localPart}@${orgDomain}`;
      const res = await admin.invite({ email, notifyEmail, firstName, lastName, jobTitle, role });
      setInviteLink(`${window.location.origin}/invite/accept?token=${res.token}`);
      setEmailSent(res.emailSent);
      setSentTo(res.notifyEmail);
      setFirstName("");
      setLastName("");
      setJobTitle("");
      setLocalPart("");
      setNotifyEmail("");
      onInvited();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send that invite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-sm border border-hairline bg-paper-raised p-5">
      <h2 className="mb-3 font-display text-lg text-ink">Invite someone</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="invite-first">First name</Label>
            <Input
              id="invite-first"
              placeholder="Sarah"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="invite-last">Last name</Label>
            <Input
              id="invite-last"
              placeholder="Chen"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="invite-title">Job title</Label>
            <Input
              id="invite-title"
              placeholder="Sales Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[10rem]">
            <Label htmlFor="invite-local">New address</Label>
            <div className="flex items-center rounded-sm border border-hairline bg-paper-raised focus-within:border-accent">
              <Input
                id="invite-local"
                placeholder="sarah"
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value.toLowerCase())}
                required
                pattern="[a-z0-9._-]+"
                className="border-0"
              />
              <span className="pr-3 text-sm text-ink-faint">@{orgDomain}</span>
            </div>
          </div>
          <div className="min-w-[14rem] flex-1">
            <Label htmlFor="invite-notify">Notify at (their current email)</Label>
            <Input
              id="invite-notify"
              type="email"
              placeholder="sarah@wherever-they-are-now.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              className="rounded-sm border border-hairline bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="member">Member</option>
              {isOwner && <option value="admin">Admin</option>}
            </select>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner />}
            Send invite
          </Button>
        </div>
      </form>
      <div className="mt-3">
        <ErrorText>{error}</ErrorText>
      </div>
      {inviteLink && (
        <div className="mt-3 rounded-sm border border-accent/30 bg-accent-soft px-3 py-2 text-sm">
          <p className="mb-1.5 text-accent-strong">
            {emailSent
              ? `Invite emailed to ${sentTo}.`
              : `Couldn't auto-send to ${sentTo} — copy this link and send it yourself.`}
          </p>
          <div className="flex items-center gap-2">
            <span className="truncate text-xs text-ink-soft">{inviteLink}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="ml-auto shrink-0 rounded-sm border border-accent/40 px-2 py-1 text-xs font-medium text-accent-strong hover:bg-paper"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { me, loading } = useRequireAdmin();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ name: string; link: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  const refresh = useCallback(() => {
    admin
      .listUsers()
      .then((res) => setUsers(res.users))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && me) refresh();
  }, [loading, me, refresh]);

  async function toggleSuspend(user: OrgUser) {
    setBusyId(user.id);
    try {
      await admin.patchUser(user.id, { status: user.status === "suspended" ? "active" : "suspended" });
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleRole(user: OrgUser) {
    setBusyId(user.id);
    try {
      await admin.patchUser(user.id, { role: user.role === "admin" ? "member" : "admin" });
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: OrgUser) {
    setBusyId(user.id);
    setResetLink(null);
    try {
      const res = await admin.resetPassword(user.id);
      setResetLink({
        name: user.displayName,
        link: `${window.location.origin}/reset-password?token=${res.token}`,
      });
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !me) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const isOwner = me.role === "owner";
  const orgDomain = me.addresses[0]?.split("@")[1] ?? "cloudmindsocial.com";

  return (
    <div className="fade-in h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl text-ink">People &amp; addresses</h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">Manage who has a mailbox on cloudmindsocial.com.</p>

        <InviteForm isOwner={isOwner} orgDomain={orgDomain} onInvited={refresh} />

        <div className="mt-8 overflow-hidden rounded-sm border border-hairline">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-paper-raised text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Address</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last login</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                    <Spinner className="mx-auto h-4 w-4" />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === me.id;
                  const isTargetOwner = u.role === "owner";
                  return (
                    <tr key={u.id} className="border-b border-hairline/60 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-ink">{u.displayName}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{u.jobTitle ?? "—"}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{u.addresses[0] ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            u.role === "owner" && "bg-brass-soft text-brass",
                            u.role === "admin" && "bg-accent-soft text-accent-strong",
                            u.role === "member" && "text-ink-faint",
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            u.status === "active" && "bg-accent-soft text-accent-strong",
                            u.status === "invited" && "bg-brass-soft text-brass",
                            u.status === "suspended" && "bg-danger-soft text-danger",
                          )}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-ink-faint">{formatLastLogin(u.lastLoginAt)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {!isTargetOwner && !isSelf && (
                          <div className="flex justify-end gap-2">
                            {isOwner && (
                              <button
                                onClick={() => toggleRole(u)}
                                disabled={busyId === u.id}
                                className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink disabled:opacity-50"
                              >
                                {u.role === "admin" ? "Make member" : "Make admin"}
                              </button>
                            )}
                            <button
                              onClick={() => resetPassword(u)}
                              disabled={busyId === u.id}
                              className="text-xs font-medium text-ink-faint underline decoration-hairline-strong underline-offset-2 hover:text-ink disabled:opacity-50"
                            >
                              Reset password
                            </button>
                            <button
                              onClick={() => toggleSuspend(u)}
                              disabled={busyId === u.id}
                              className={cn(
                                "text-xs font-medium underline decoration-hairline-strong underline-offset-2 disabled:opacity-50",
                                u.status === "suspended" ? "text-accent hover:text-accent-strong" : "text-danger hover:opacity-80",
                              )}
                            >
                              {u.status === "suspended" ? "Reactivate" : "Suspend"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {resetLink && (
          <div className="mt-4 rounded-sm border border-accent/30 bg-accent-soft px-3 py-2 text-sm">
            <p className="mb-1.5 text-accent-strong">
              Password reset link for {resetLink.name} — share this with them out of band.
            </p>
            <div className="flex items-center gap-2">
              <span className="truncate text-xs text-ink-soft">{resetLink.link}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetLink.link);
                  setResetCopied(true);
                  setTimeout(() => setResetCopied(false), 1500);
                }}
                className="ml-auto shrink-0 rounded-sm border border-accent/40 px-2 py-1 text-xs font-medium text-accent-strong hover:bg-paper"
              >
                {resetCopied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
