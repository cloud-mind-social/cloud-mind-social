"use client";

import { useState } from "react";
import { calendar, type ProposedTime } from "@/lib/api";
import { fromDateTimeLocalInZone, toDateTimeLocalInZone } from "@/lib/schedule-times";
import { cn } from "@/lib/cn";

/**
 * Confirming a time before it becomes an appointment.
 *
 * This dialog is the feature, not a formality in front of it. A regex reading
 * "Tuesday at 2" out of a sentence is right most of the time, and most of the
 * time is fine for an offer and nowhere near good enough for something that
 * puts a van outside a customer's house.
 *
 * So it opens on what was read — never blank, never already saved — and every
 * field is editable, including the ones that were guessed. The phrase that was
 * matched is shown at the top so the person can see what we thought they meant
 * before deciding whether they meant it.
 */

const DURATIONS = [30, 60, 90, 120];

export function ConfirmEventDialog({
  messageId,
  time,
  suggestedTitle,
  otherParty,
  timeZone,
  onCreated,
  onClose,
}: {
  messageId: string;
  time: ProposedTime;
  /** The message's subject, which is usually what the appointment is about. */
  suggestedTitle: string;
  /** Who the message is with; they get the invitation if one is sent. */
  otherParty: string | null;
  timeZone: string;
  onCreated: (result: { id: string; invited: boolean }) => void;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState<{ invited: boolean } | null>(null);
  const [summary, setSummary] = useState(suggestedTitle || "Appointment");
  // In the mailbox's zone, not the browser's — the times shown around this
  // input are in the mailbox's, and two readings of one appointment is how
  // somebody turns up an hour late.
  const [startsAt, setStartsAt] = useState(() =>
    toDateTimeLocalInZone(new Date(time.at), timeZone),
  );
  const [minutes, setMinutes] = useState(60);
  const [location, setLocation] = useState("");
  const [invite, setInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    const start = fromDateTimeLocalInZone(startsAt, timeZone);
    if (Number.isNaN(start.getTime())) return setError("That isn't a date I can read.");
    if (!summary.trim()) return setError("Give it a name.");

    setSaving(true);
    try {
      const created = await calendar.createEvent(messageId, {
        summary: summary.trim(),
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + minutes * 60_000).toISOString(),
        location: location.trim() || undefined,
        invite,
      });
      // Shown rather than closed over: an invitation may or may not have gone
      // out, and saying nothing leaves the person to infer it from a card
      // appearing.
      setSaved({ invited: created.invited });
      onCreated(created);
    } catch {
      // The server saves nothing when the invitation fails, so neither of the
      // two things this dialog promised has happened.
      setError(
        invite
          ? "Couldn't send the invitation, so nothing was saved. Try again, or add it without inviting them."
          : "Couldn't save that. Try again in a moment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-label="Add to calendar"
        className="relative w-full max-w-md rounded-sm border border-hairline bg-paper p-5 shadow-xl"
      >
        {saved ? (
          <>
            <h2 className="font-display text-lg text-ink">Added to your calendar</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {saved.invited
                ? `${otherParty} has been sent an invitation.`
                : "Nobody was invited."}
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-paper hover:bg-accent-strong"
            >
              Done
            </button>
          </>
        ) : (
          <>
        <h2 className="font-display text-lg text-ink">Add to calendar</h2>
        {/* What we read, before anything is committed to. */}
        <p className="mt-0.5 mb-4 text-xs text-ink-faint">
          From “{time.text}” in this message
          {time.dayOnly && " — no time was given, so this is a guess"}.
        </p>

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          What
        </label>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={200}
          className="w-full rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-sm text-ink outline-none focus:border-hairline-strong"
        />

        <label className="mt-3 mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          When
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-sm text-ink outline-none focus:border-hairline-strong"
          />
          <select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="How long"
            className="rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-sm text-ink"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d < 60 ? `${d} minutes` : d === 60 ? "1 hour" : `${d / 60} hours`}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">Times are in {timeZone.replace("_", " ")}.</p>

        <label className="mt-3 mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Where <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={500}
          placeholder="1420 Ocean Blvd"
          className="w-full rounded-sm border border-hairline bg-paper-raised px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-hairline-strong"
        />

        {otherParty && (
          <label className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={invite}
              onChange={(e) => setInvite(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-accent"
            />
            <span>
              Send {otherParty} an invitation
              <span className="block text-[11px] text-ink-faint">
                They get accept and decline buttons, and it lands in their calendar too.
              </span>
            </span>
          </label>
        )}

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => void confirm()}
            disabled={saving}
            className={cn(
              "rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-paper",
              "hover:bg-accent-strong disabled:opacity-50",
            )}
          >
            {saving ? "Saving…" : invite ? "Add and invite" : "Add to calendar"}
          </button>
          <button onClick={onClose} className="text-xs font-medium text-ink-faint hover:text-ink">
            Cancel
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
