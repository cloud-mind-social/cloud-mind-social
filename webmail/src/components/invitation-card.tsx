"use client";

import { useState } from "react";
import { calendar, type CalendarEvent, type RsvpResponse } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * An invitation, shown as an invitation.
 *
 * The whole point is that an `.ics` attachment is unreadable — a file chip
 * called invite.ics tells you nothing about when, where, or who. This puts the
 * four things a person needs to decide on screen, and the decision next to them.
 *
 * Times are rendered in the reader's own zone with the zone named, because an
 * invitation from another state is exactly the case where an unlabelled time
 * gets someone to a site an hour late.
 */

const ANSWERS: { response: RsvpResponse; label: string }[] = [
  { response: "ACCEPTED", label: "Yes" },
  { response: "TENTATIVE", label: "Maybe" },
  { response: "DECLINED", label: "No" },
];

const ANSWER_WORDS: Record<RsvpResponse, string> = {
  ACCEPTED: "You accepted",
  TENTATIVE: "You answered maybe",
  DECLINED: "You declined",
};

function formatWhen(event: CalendarEvent, timeZone: string): string {
  if (!event.startsAt) return "Time not given";
  const start = new Date(event.startsAt);

  if (event.allDay) {
    return start.toLocaleDateString(undefined, {
      timeZone, weekday: "long", month: "long", day: "numeric",
    });
  }

  const day = start.toLocaleDateString(undefined, {
    timeZone, weekday: "long", month: "long", day: "numeric",
  });
  const from = start.toLocaleTimeString(undefined, {
    timeZone, hour: "numeric", minute: "2-digit",
  });

  if (!event.endsAt) return `${day} at ${from}`;
  const to = new Date(event.endsAt).toLocaleTimeString(undefined, {
    timeZone, hour: "numeric", minute: "2-digit",
  });
  return `${day}, ${from} – ${to}`;
}

/** The zone's short name, so a time from elsewhere reads as one. */
function zoneLabel(timeZone: string, at: string | null): string {
  if (!at) return "";
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone, timeZoneName: "short",
    }).formatToParts(new Date(at));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function InvitationCard({
  event,
  timeZone,
  onAnswered,
}: {
  event: CalendarEvent;
  timeZone: string;
  onAnswered: () => void;
}) {
  const [answering, setAnswering] = useState<RsvpResponse | null>(null);
  const [answered, setAnswered] = useState<RsvpResponse | null>(event.rsvpResponse);
  const [error, setError] = useState<string | null>(null);

  async function answer(response: RsvpResponse) {
    setAnswering(response);
    setError(null);
    try {
      await calendar.rsvp(event.id, response);
      setAnswered(response);
      onAnswered();
    } catch {
      // The server refuses to record an answer it could not send, so the card
      // must not show one either.
      setError("Couldn't send your reply. Nothing was sent — try again.");
    } finally {
      setAnswering(null);
    }
  }

  const cancelled = event.method === "CANCEL" || event.status === "CANCELLED";
  /** Our own event. There is nobody to answer, and asking would be nonsense. */
  const ours = event.source === "created";
  const zone = zoneLabel(timeZone, event.startsAt);

  return (
    <div
      className={cn(
        "rounded-sm border bg-paper-raised px-4 py-3",
        cancelled ? "border-danger/40" : "border-hairline",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          {cancelled
            ? "Cancelled"
            : ours
              ? "You scheduled this"
              : event.method === "REPLY"
                ? "Reply"
                : "Invitation"}
        </span>
        {event.repeats && (
          // The rule is kept but not expanded, so this says that it repeats
          // and stops short of claiming to know when.
          <span className="text-[11px] text-ink-faint">Repeats</span>
        )}
      </div>

      <h3
        className={cn(
          "mt-0.5 font-display text-lg leading-tight text-ink",
          cancelled && "line-through decoration-danger/60",
        )}
      >
        {event.summary}
      </h3>

      <p className="mt-1 text-sm text-ink-soft">
        {formatWhen(event, timeZone)}
        {zone && !event.allDay && <span className="text-ink-faint"> {zone}</span>}
      </p>

      {event.location && (
        <p className="mt-0.5 text-sm text-ink-soft">{event.location}</p>
      )}

      {event.organizer && (
        <p className="mt-0.5 text-xs text-ink-faint">
          From {event.organizer.name || event.organizer.address}
          {event.attendees.length > 1 && ` · ${event.attendees.length} people`}
        </p>
      )}

      {cancelled ? (
        <p className="mt-3 text-sm text-danger">
          The organiser cancelled this. Nothing to answer.
        </p>
      ) : ours ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <a
            href={calendar.icsUrl(event.id)}
            className="font-medium text-accent hover:underline"
          >
            Add to my calendar app
          </a>
          {event.attendees.length > 0 && (
            <span className="text-ink-faint">
              {event.attendees[0]?.address} was invited
            </span>
          )}
        </div>
      ) : event.method === "REQUEST" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ANSWERS.map(({ response, label }) => (
            <button
              key={response}
              onClick={() => void answer(response)}
              disabled={answering !== null}
              aria-pressed={answered === response}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                answered === response
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-hairline text-ink-soft hover:border-hairline-strong hover:text-ink",
              )}
            >
              {answering === response ? "Sending…" : label}
            </button>
          ))}
          {answered && (
            <span className="text-xs text-ink-faint">
              {ANSWER_WORDS[answered]} — the organiser has been told.
            </span>
          )}
        </div>
      ) : null}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
