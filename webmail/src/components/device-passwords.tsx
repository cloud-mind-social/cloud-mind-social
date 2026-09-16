"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, devicePasswords, type DevicePassword } from "@/lib/api";
import { Button, ErrorText, Input, Label, Spinner } from "@/components/ui";

/**
 * Putting a calendar on somebody's phone.
 *
 * The whole screen is shaped by one fact about CalDAV: a client authenticates
 * with a name and a password on every request, with no login page to redirect
 * to and no second factor to ask for. So a device holds a credential
 * permanently, and it must not be the account password — a phone in a drawer
 * would then open the whole mailbox, and changing that password would break
 * every synced device at once.
 *
 * The secret appears exactly once, at the moment it is made. Nothing can
 * return it afterwards. That is worth stating on the screen rather than
 * leaving people to discover it, and it is why the panel below stays put until
 * it is dismissed instead of fading after a moment.
 */

/** What a person types into their phone, right next to the password. */
const SETTINGS = [
  { label: "Server address", value: API_BASE_URL.replace(/^https?:\/\//, "") },
];

export function DevicePasswords({ address }: { address: string }) {
  const [items, setItems] = useState<DevicePassword[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ secret: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void devicePasswords
      .list()
      .then((res) => setItems(res.appPasswords))
      .catch(() => setError("Couldn't load your device passwords."));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      const res = await devicePasswords.create(name.trim());
      setIssued({ secret: res.secret, name: res.appPassword.name });
      setItems((current) => [res.appPassword, ...(current ?? [])]);
      setName("");
      setCopied(false);
    } catch {
      setError("Couldn't create a device password. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(item: DevicePassword) {
    setError(null);
    // Optimistic: the row goes now. A failure puts it back, which is a clearer
    // sequence than a row that sits there looking live while a request runs.
    setItems((current) => (current ?? []).filter((x) => x.id !== item.id));
    try {
      await devicePasswords.revoke(item.id);
    } catch {
      setItems((current) => [item, ...(current ?? [])]);
      setError(`Couldn't revoke ${item.name}.`);
    }
  }

  return (
    <div className="mb-6 rounded-sm border border-hairline bg-paper-raised p-6">
      <h2 className="mb-1 font-display text-lg text-ink">Calendar on your devices</h2>
      <p className="mb-4 text-sm text-ink-faint">
        Add your calendar to the Calendar app on a phone, tablet or laptop. Each device gets its
        own password, so you can stop one without touching the others. Your account password
        won&rsquo;t work for this.
      </p>

      {issued && (
        <div
          data-issued-secret
          className="mb-5 rounded-sm border border-accent/30 bg-accent-soft p-4"
        >
          <p className="text-sm font-medium text-accent-strong">
            Password for {issued.name}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Copy it now &mdash; this is the only time it will be shown.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="select-all rounded-sm border border-hairline bg-paper px-3 py-2 font-mono text-base tracking-wide text-ink">
              {issued.secret}
            </code>
            <Button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(issued.secret).then(() => setCopied(true));
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <dl className="mt-4 grid gap-1 text-sm">
            {[...SETTINGS, { label: "Username", value: address }].map((row) => (
              <div key={row.label} className="flex gap-2">
                <dt className="w-32 shrink-0 text-ink-faint">{row.label}</dt>
                <dd className="select-all font-mono text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={() => setIssued(null)}
            className="mt-4 text-sm text-ink-faint underline hover:text-ink"
          >
            I&rsquo;ve saved it
          </button>
        </div>
      )}

      {items === null ? (
        <Spinner className="h-4 w-4" />
      ) : items.length === 0 ? (
        <p className="mb-4 text-sm text-ink-faint">No devices yet.</p>
      ) : (
        <ul className="mb-5 divide-y divide-hairline border-y border-hairline">
          {items.map((item) => (
            <li
              key={item.id}
              data-device-id={item.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{item.name}</p>
                <p className="text-xs text-ink-faint">
                  {item.hint}&hellip; &middot; {describeLastUse(item.lastUsedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void revoke(item)}
                className="shrink-0 text-sm text-ink-faint underline hover:text-ink"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Label htmlFor="device-name">Device name</Label>
          <Input
            id="device-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My phone"
            maxLength={60}
          />
        </div>
        <Button type="submit" disabled={creating || !name.trim()}>
          {creating && <Spinner />}
          Create password
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/**
 * When a device last used its password.
 *
 * This is the line that makes the list worth reading: a password nobody can
 * account for and nothing has used in months is the one to revoke, and there
 * is no other way to tell which that is.
 */
function describeLastUse(lastUsedAt: string | null): string {
  if (!lastUsedAt) return "never used";
  const days = Math.floor((Date.now() - new Date(lastUsedAt).getTime()) / 86_400_000);
  if (days < 1) return "used today";
  if (days === 1) return "used yesterday";
  if (days < 30) return `used ${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "used a month ago" : `used ${months} months ago`;
}
