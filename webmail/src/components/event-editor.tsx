"use client";

import { useEffect, useState } from "react";
import {
  calendarEvents,
  type CalendarCollection,
  type CalendarEntry,
} from "@/lib/api";
import { Button, ErrorText, Input, Label, Spinner, Textarea } from "@/components/ui";
import { toLocalInput, fromLocalInput } from "@/lib/zoned";

/**
 * Making and changing an event.
 *
 * One panel for both, because they are the same act — a person who has just
 * dragged out a slot and a person correcting a time both want the same five
 * fields — and two panels would be two places for the timezone handling to go
 * subtly differently.
 *
 * Times are entered as wall clock in the mailbox's zone and sent as instants.
 * A datetime-local input has no zone at all, so reading its value with the
 * browser's is exactly the bug that puts an event an hour out for anyone
 * travelling.
 */

export interface EventDraft {
  event?: CalendarEntry;
  startsAt: Date;
  endsAt: Date;
}

export function EventEditor({
  draft,
  timeZone,
  collections,
  onClose,
  onSaved,
  onDeleted,
}: {
  draft: EventDraft;
  timeZone: string;
  collections: CalendarCollection[];
  onClose: () => void;
  onSaved: (event: CalendarEntry) => void;
  onDeleted: (id: string) => void;
}) {
  const existing = draft.event;
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [start, setStart] = useState(toLocalInput(draft.startsAt, timeZone));
  const [end, setEnd] = useState(toLocalInput(draft.endsAt, timeZone));
  const [busy, setBusy] = useState((existing?.transp ?? "opaque") === "opaque");
  const [calendarId, setCalendarId] = useState(
    existing?.calendarId ?? collections.find((c) => c.isDefault)?.id ?? collections[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const startsAt = fromLocalInput(start, timeZone);
    const endsAt = fromLocalInput(end, timeZone);
    if (!startsAt || !endsAt) return setError("Those times don't look right.");
    if (endsAt <= startsAt) return setError("It has to end after it starts.");
    if (!summary.trim()) return setError("Give it a title.");

    setSaving(true);
    try {
      const body = {
        summary: summary.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        location: location.trim(),
        description: description.trim(),
        transp: busy ? ("opaque" as const) : ("transparent" as const),
      };
      const res = existing
        ? await calendarEvents.update(existing.id, body)
        : await calendarEvents.create({ ...body, calendarId });
      onSaved(res.event);
    } catch {
      setError("Couldn't save it. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setSaving(true);
    try {
      await calendarEvents.remove(existing.id);
      onDeleted(existing.id);
    } catch {
      setError("Couldn't delete it.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-label={existing ? "Edit event" : "New event"}
        data-event-editor
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-sm border border-hairline bg-paper-raised p-6 shadow-2xl"
      >
        <h2 className="mb-4 font-display text-lg text-ink">
          {existing ? "Edit event" : "New event"}
        </h2>

        <form onSubmit={save} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="event-summary">Title</Label>
            <Input
              id="event-summary"
              autoFocus
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event-start">Starts</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="event-end">Ends</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-ink-faint">Times are in {timeZone.replace(/_/g, " ")}.</p>

          <div>
            <Label htmlFor="event-location">Where</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="event-notes">Notes</Label>
            <Textarea
              id="event-notes"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          {!existing && collections.length > 1 && (
            <div>
              <Label htmlFor="event-calendar">Calendar</Label>
              <select
                id="event-calendar"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={busy}
              onChange={(e) => setBusy(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Takes up the time
              <span className="block text-xs text-ink-faint">
                Leave this on and nobody can book you during it. Turn it off for reminders and
                birthdays, which sit on the calendar without claiming the slot.
              </span>
            </span>
          </label>

          <ErrorText>{error}</ErrorText>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <Spinner />}
              {existing ? "Save" : "Add to calendar"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-ink-faint underline hover:text-ink"
            >
              Cancel
            </button>
            {existing && (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={saving}
                className="ml-auto text-sm text-danger underline hover:opacity-80"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
