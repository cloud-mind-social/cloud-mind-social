import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { Eyebrow, QualificationNote, RouteChip, StatusChip } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { countByStatus, countNeedingFollowUp, listInquiries } from "@/lib/inquiries";
import {
  ALL_ROUTES,
  CLOSED_OUTCOMES,
  RESPONSE_EXPECTATION,
  ROUTE_SHORT_LABELS,
  isInquiryRoute,
  isQualificationOutcome,
  type InquiryRoute,
} from "@/lib/intake";
import type { InquiryFilter, InquiryStatus } from "@/lib/inquiry-status";

export const dynamic = "force-dynamic";

const FILTERS: Array<{ key: InquiryFilter; label: string }> = [
  { key: "open", label: "Open" },
  { key: "new", label: "New" },
  { key: "reading", label: "Looking at it" },
  { key: "replied", label: "Replied" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "Everything" },
];

function FollowUpLine({
  inquiry,
  today,
}: {
  inquiry: Awaited<ReturnType<typeof listInquiries>>[number];
  today: string;
}) {
  const outcome = isQualificationOutcome(inquiry.qualification)
    ? inquiry.qualification
    : "unreviewed";
  const closed = CLOSED_OUTCOMES.includes(outcome);
  const due = inquiry.next_action_due;
  const late = Boolean(due && !closed && due <= today);

  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em]">
      <span className={outcome === "unreviewed" ? "text-amber-soft" : "text-sage"}>
        <QualificationNote outcome={outcome} />
      </span>
      {inquiry.stage ? <span className="text-cream-faint">{inquiry.stage}</span> : null}
      {inquiry.owner ? <span className="text-cream-faint">Owner: {inquiry.owner}</span> : null}
      {inquiry.next_action && !closed ? (
        <span className={late ? "text-amber-soft" : "text-cream-faint"}>
          Next: {inquiry.next_action}
          {due ? ` · ${late ? "due " : "by "}${due}` : ""}
        </span>
      ) : null}
    </p>
  );
}

function isFilter(value: string): value is InquiryFilter {
  return FILTERS.some((filter) => filter.key === value);
}

/** Builds an inbox link that keeps the other filter as it is. */
function inboxHref(filter: InquiryFilter, route: InquiryRoute | null): string {
  const query = new URLSearchParams();
  if (filter !== "open") query.set("filter", filter);
  if (route) query.set("route", route);
  const qs = query.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function InboxPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const raw = typeof params.filter === "string" ? params.filter : "open";
  const filter: InquiryFilter = isFilter(raw) ? raw : "open";
  const rawRoute = typeof params.route === "string" ? params.route : "";
  const route: InquiryRoute | null = isInquiryRoute(rawRoute) ? rawRoute : null;

  // Sign-in should return to the exact view that was asked for.
  const admin = await requireAdmin(inboxHref(filter, route));

  // Due dates are calendar days; UTC is close enough to flag what's slipping.
  const today = new Date().toISOString().slice(0, 10);

  const [inquiries, counts, followUp] = await Promise.all([
    listInquiries(filter, route),
    countByStatus(),
    countNeedingFollowUp(today),
  ]);

  return (
    <AdminShell admin={admin}>
      <Eyebrow>Inquiries</Eyebrow>
      <h1 className="mt-4 font-display text-4xl leading-tight text-cream md:text-5xl">
        {counts.new > 0
          ? `${counts.new} waiting on you.`
          : "Nothing waiting on you."}
      </h1>
      <p className="mt-4 max-w-[60ch] text-cream-dim">
        Everyone here was told a person replies by email, {RESPONSE_EXPECTATION}.
        {followUp.unreviewed > 0
          ? ` ${followUp.unreviewed} ${followUp.unreviewed === 1 ? "has" : "have"} no follow-up outcome yet.`
          : ""}
        {followUp.overdue > 0
          ? ` ${followUp.overdue} ${followUp.overdue === 1 ? "next action is" : "next actions are"} due or overdue.`
          : ""}
      </p>

      <nav className="mt-10 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = key === filter;
          const count = counts[key] ?? 0;
          return (
            <Link
              key={key}
              href={inboxHref(key, route)}
              className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "border-amber bg-amber text-ink"
                  : "border-line text-cream-faint hover:border-line-strong hover:text-cream"
              }`}
            >
              {label}
              <span className={active ? "ml-2 opacity-70" : "ml-2 opacity-60"}>
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Filter by route" className="mt-3 flex flex-wrap gap-2">
        {[null, ...ALL_ROUTES].map((key) => {
          const active = key === route;
          return (
            <Link
              key={key ?? "any"}
              href={inboxHref(filter, key)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "border-sage bg-sage/20 text-cream"
                  : "border-line text-cream-faint hover:border-line-strong hover:text-cream"
              }`}
            >
              {key ? ROUTE_SHORT_LABELS[key] : "Any route"}
            </Link>
          );
        })}
      </nav>

      {inquiries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-ink-soft/50 p-12 text-center">
          <p className="font-display text-2xl text-cream">Nothing here.</p>
          <p className="mx-auto mt-3 max-w-[40ch] text-cream-dim">
            New requests from the site land here the moment they&apos;re sent.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-soft/50">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                href={`/admin/inquiries/${inquiry.id}`}
                className="block px-6 py-5 transition-colors hover:bg-ink-raised/50"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl text-cream">
                    {inquiry.name}
                  </span>
                  <span className="text-cream-faint">·</span>
                  <span className="text-cream-dim">{inquiry.business}</span>
                  <StatusChip status={inquiry.status as InquiryStatus} />
                  <RouteChip
                    route={isInquiryRoute(inquiry.route) ? inquiry.route : "conversation"}
                  />
                  <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.1em] text-cream-faint">
                    {timeAgo(inquiry.created_at)}
                  </span>
                </div>
                <FollowUpLine inquiry={inquiry} today={today} />
                {inquiry.message ? (
                  <p className="mt-3 line-clamp-2 max-w-[75ch] text-[15px] leading-relaxed text-cream-dim">
                    {inquiry.message}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
