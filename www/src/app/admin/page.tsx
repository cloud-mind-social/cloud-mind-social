import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { Eyebrow, StatusChip } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { countByStatus, listInquiries } from "@/lib/inquiries";
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

function isFilter(value: string): value is InquiryFilter {
  return FILTERS.some((filter) => filter.key === value);
}

export default async function InboxPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const raw = typeof params.filter === "string" ? params.filter : "open";
  const filter: InquiryFilter = isFilter(raw) ? raw : "open";

  // Sign-in should return to the exact view that was asked for.
  const admin = await requireAdmin(
    filter === "open" ? "/admin" : `/admin?filter=${filter}`,
  );

  const [inquiries, counts] = await Promise.all([
    listInquiries(filter),
    countByStatus(),
  ]);

  return (
    <AdminShell admin={admin}>
      <Eyebrow>Inquiries</Eyebrow>
      <h1 className="mt-4 font-display text-4xl leading-tight text-cream md:text-5xl">
        {counts.new > 0
          ? `${counts.new} waiting on you.`
          : "Nothing waiting on you."}
      </h1>
      <p className="mt-4 max-w-[52ch] text-cream-dim">
        Everyone here was told they&apos;d hear back within one business day.
      </p>

      <nav className="mt-10 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = key === filter;
          const count = counts[key] ?? 0;
          return (
            <Link
              key={key}
              href={key === "open" ? "/admin" : `/admin?filter=${key}`}
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
                  <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.1em] text-cream-faint">
                    {timeAgo(inquiry.created_at)}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-sage">
                  {inquiry.stage}
                </p>
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
