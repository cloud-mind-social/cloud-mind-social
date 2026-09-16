import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/shell";
import { NoteForm } from "@/components/admin/note-form";
import { ReplyComposer } from "@/components/admin/reply-composer";
import { StatusControl } from "@/components/admin/status-control";
import { Eyebrow, StatusChip } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { fullDate, timeAgo } from "@/lib/format";
import {
  getInquiry,
  listNotes,
  listReplies,
  markInquirySeen,
} from "@/lib/inquiries";
import type { InquiryStatus } from "@/lib/inquiry-status";

export const dynamic = "force-dynamic";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-ink-soft/50 p-7 md:p-8">
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream-faint sm:w-32 sm:shrink-0 sm:pt-0.5">
        {label}
      </span>
      <span className="text-[15px] leading-relaxed text-cream">{children}</span>
    </div>
  );
}

export default async function InquiryPage({
  params,
}: PageProps<"/admin/inquiries/[id]">) {
  const { id } = await params;
  const admin = await requireAdmin(`/admin/inquiries/${id}`);

  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  // Opening an unread inquiry counts as picking it up.
  await markInquirySeen(id);

  const [replies, notes] = await Promise.all([listReplies(id), listNotes(id)]);
  const status: InquiryStatus =
    inquiry.status === "new" ? "reading" : (inquiry.status as InquiryStatus);

  return (
    <AdminShell admin={admin}>
      <Link
        href="/admin"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream-faint transition-colors hover:text-amber"
      >
        ← All inquiries
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl leading-tight text-cream md:text-5xl">
          {inquiry.name}
        </h1>
        <StatusChip status={status} />
      </div>
      <p className="mt-3 text-cream-dim">
        {inquiry.business} · arrived {timeAgo(inquiry.created_at)} ·{" "}
        {fullDate(inquiry.created_at)} UTC
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div className="grid gap-6">
          <Panel title="What they sent">
            <div className="grid">
              <DetailRow label="Business">{inquiry.business}</DetailRow>
              <DetailRow label="Email">
                <a
                  href={`mailto:${inquiry.email}`}
                  className="text-sage underline-offset-4 hover:text-amber hover:underline"
                >
                  {inquiry.email}
                </a>
              </DetailRow>
              {inquiry.phone ? (
                <DetailRow label="Phone">
                  <a
                    href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}
                    className="text-sage underline-offset-4 hover:text-amber hover:underline"
                  >
                    {inquiry.phone}
                  </a>
                </DetailRow>
              ) : null}
              <DetailRow label="Stage">{inquiry.stage}</DetailRow>
            </div>

            <div className="mt-7 rounded-xl border border-line bg-ink-raised/40 p-6">
              {inquiry.message ? (
                <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-cream">
                  {inquiry.message}
                </p>
              ) : (
                <p className="text-[15px] text-cream-faint">
                  They didn&apos;t add a message — the form fields are all there is.
                </p>
              )}
            </div>
          </Panel>

          {inquiry.ack_delivery === "failed" ? (
            <div className="rounded-2xl border border-amber/50 bg-amber/10 p-6">
              <p className="text-[15px] leading-relaxed text-cream">
                <strong className="font-medium">
                  {inquiry.name} never got the acknowledgement.
                </strong>{" "}
                The inquiry was saved, but the automatic reply the site promises
                did not go out — so as far as they know, nothing happened.
              </p>
              {inquiry.ack_error ? (
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-amber-soft">
                  {inquiry.ack_error}
                </p>
              ) : null}
            </div>
          ) : null}

          <Panel title="Reply">
            <ReplyComposer
              inquiryId={inquiry.id}
              recipient={inquiry.email}
              defaultSubject={`Re: your note about ${inquiry.business}`}
            />
          </Panel>

          {replies.length > 0 ? (
            <Panel title={`Sent ${replies.length === 1 ? "reply" : "replies"}`}>
              <ul className="grid gap-5">
                {replies.map((reply) => (
                  <li
                    key={reply.id}
                    className="rounded-xl border border-line bg-ink-raised/40 p-6"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[15px] font-medium text-cream">
                        {reply.subject}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-cream-faint">
                        {reply.author_name} · {timeAgo(reply.created_at)}
                      </span>
                      {reply.delivery === "failed" ? (
                        <span className="rounded-full border border-amber/50 bg-amber/15 px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-soft">
                          Not delivered
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.7] text-cream-dim">
                      {reply.body}
                    </p>
                    {reply.error ? (
                      <p className="mt-3 font-mono text-[11px] text-amber-soft">
                        {reply.error}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <div className="grid gap-6">
          <Panel title="Status">
            <StatusControl inquiryId={inquiry.id} current={status} />
          </Panel>

          <Panel title="Private notes">
            {notes.length > 0 ? (
              <ul className="mb-6 grid gap-4">
                {notes.map((note) => (
                  <li key={note.id} className="border-l-2 border-sage-dim pl-4">
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-cream-dim">
                      {note.body}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cream-faint">
                      {note.author_name} · {timeAgo(note.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <NoteForm inquiryId={inquiry.id} />
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
