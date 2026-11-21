import "server-only";

import { getDb } from "@/lib/env";
import { newId } from "@/lib/id";
import type { InquiryInput } from "@/lib/validation";
import type { InquiryRoute } from "@/lib/intake";
import type {
  AckDelivery,
  FollowUpInput,
  Inquiry,
  InquiryFilter,
  InquiryNote,
  InquiryReply,
  InquiryStatus,
} from "@/lib/inquiry-status";

const INQUIRY_COLUMNS = `id, name, business, email, phone, stage, message,
  status, source, ack_delivery, ack_error,
  route, profile, role, consequence, why_now, decision, timing,
  signal_category, signal_answers,
  utm_source, utm_medium, utm_campaign, utm_content, referrer, landing_path,
  qualification, owner, next_action, next_action_due, follow_up_updated_at,
  created_at, updated_at`;

export async function createInquiry(
  input: InquiryInput & { ipHash: string | null; userAgent: string | null },
): Promise<Inquiry> {
  const db = await getDb();
  const id = newId("inq");

  const a = input.attribution;
  await db
    .prepare(
      `INSERT INTO inquiries
         (id, name, business, email, phone, stage, message, ip_hash, user_agent,
          route, profile, role, consequence, why_now, decision, timing,
          signal_category, signal_answers,
          utm_source, utm_medium, utm_campaign, utm_content, referrer, landing_path)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9,
               ?10, ?11, ?12, ?13, ?14, ?15, ?16,
               ?17, ?18,
               ?19, ?20, ?21, ?22, ?23, ?24)`,
    )
    .bind(
      id,
      input.name,
      input.business,
      input.email,
      input.phone,
      input.stage,
      input.message,
      input.ipHash,
      input.userAgent,
      input.route,
      input.profile,
      input.role,
      input.consequence,
      input.whyNow,
      input.decision,
      input.timing,
      input.signalCategory,
      input.signalAnswers,
      a.utmSource,
      a.utmMedium,
      a.utmCampaign,
      a.utmContent,
      a.referrer,
      a.landingPath,
    )
    .run();

  const row = await db
    .prepare(`SELECT ${INQUIRY_COLUMNS} FROM inquiries WHERE id = ?1`)
    .bind(id)
    .first<Inquiry>();

  if (!row) throw new Error("Inquiry could not be read back after insert.");
  return row;
}

/**
 * Notes how the acknowledgement went, after the fact — the inquiry row is
 * written and returned before any mail is attempted, so this never sits
 * between a submission and its being saved. A failure here is swallowed for
 * the same reason: losing the record of a send must not lose the inquiry.
 */
export async function recordAcknowledgement(
  id: string,
  delivery: AckDelivery,
  error: string | null,
): Promise<void> {
  try {
    const db = await getDb();
    await db
      .prepare(`UPDATE inquiries SET ack_delivery = ?2, ack_error = ?3 WHERE id = ?1`)
      .bind(id, delivery, error)
      .run();
  } catch (cause) {
    console.error("[inquiry] could not record acknowledgement delivery", cause);
  }
}

export async function listInquiries(
  filter: InquiryFilter = "open",
  route: InquiryRoute | null = null,
): Promise<Inquiry[]> {
  const db = await getDb();

  const clauses: string[] = [];
  const binds: string[] = [];

  if (filter === "open") {
    clauses.push("status != 'archived'");
  } else if (filter !== "all") {
    binds.push(filter);
    clauses.push(`status = ?${binds.length}`);
  }
  if (route) {
    binds.push(route);
    clauses.push(`route = ?${binds.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const statement = db.prepare(
    `SELECT ${INQUIRY_COLUMNS} FROM inquiries ${where}
     ORDER BY created_at DESC LIMIT 200`,
  );

  const { results } = await (binds.length ? statement.bind(...binds) : statement).all<Inquiry>();
  return results ?? [];
}

/**
 * Open inquiries whose next action is due on or before `today` (YYYY-MM-DD),
 * or that nobody has reviewed yet. This is what "accountable follow-up"
 * looks like on the inbox's front page.
 */
export async function countNeedingFollowUp(today: string): Promise<{ overdue: number; unreviewed: number }> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN next_action_due IS NOT NULL AND next_action_due <= ?1
                   AND qualification NOT IN ('deferred','declined','no-response') THEN 1 ELSE 0 END) AS overdue,
         SUM(CASE WHEN qualification = 'unreviewed' THEN 1 ELSE 0 END) AS unreviewed
       FROM inquiries WHERE status != 'archived'`,
    )
    .bind(today)
    .first<{ overdue: number | null; unreviewed: number | null }>();
  return { overdue: row?.overdue ?? 0, unreviewed: row?.unreviewed ?? 0 };
}

export async function updateFollowUp(id: string, input: FollowUpInput): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `UPDATE inquiries
          SET qualification = ?2, owner = ?3, next_action = ?4, next_action_due = ?5,
              follow_up_updated_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?1`,
    )
    .bind(id, input.qualification, input.owner, input.nextAction, input.nextActionDue)
    .run();
}

export async function countByStatus(): Promise<Record<string, number>> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT status, COUNT(*) AS n FROM inquiries GROUP BY status")
    .all<{ status: string; n: number }>();

  const counts: Record<string, number> = { new: 0, reading: 0, replied: 0, archived: 0 };
  for (const row of results ?? []) counts[row.status] = row.n;
  counts.open = counts.new + counts.reading + counts.replied;
  counts.all = counts.open + counts.archived;
  return counts;
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const db = await getDb();
  return db
    .prepare(`SELECT ${INQUIRY_COLUMNS} FROM inquiries WHERE id = ?1`)
    .bind(id)
    .first<Inquiry>();
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const db = await getDb();
  await db
    .prepare(
      "UPDATE inquiries SET status = ?2, updated_at = datetime('now') WHERE id = ?1",
    )
    .bind(id, status)
    .run();
}

/** Moves `new` to `reading` on first open, without disturbing later states. */
export async function markInquirySeen(id: string) {
  const db = await getDb();
  await db
    .prepare(
      `UPDATE inquiries SET status = 'reading', updated_at = datetime('now')
        WHERE id = ?1 AND status = 'new'`,
    )
    .bind(id)
    .run();
}

export async function listReplies(inquiryId: string): Promise<InquiryReply[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT id, inquiry_id, author_name, subject, body, delivery, error, created_at
         FROM inquiry_replies WHERE inquiry_id = ?1 ORDER BY created_at ASC`,
    )
    .bind(inquiryId)
    .all<InquiryReply>();
  return results ?? [];
}

export async function recordReply(input: {
  inquiryId: string;
  authorId: string;
  authorName: string;
  subject: string;
  body: string;
  delivery: "sent" | "failed";
  providerId: string | null;
  error: string | null;
}) {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO inquiry_replies
         (id, inquiry_id, author_id, author_name, subject, body, delivery, provider_id, error)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      newId("rep"),
      input.inquiryId,
      input.authorId,
      input.authorName,
      input.subject,
      input.body,
      input.delivery,
      input.providerId,
      input.error,
    )
    .run();
}

export async function listNotes(inquiryId: string): Promise<InquiryNote[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT id, inquiry_id, author_name, body, created_at
         FROM inquiry_notes WHERE inquiry_id = ?1 ORDER BY created_at ASC`,
    )
    .bind(inquiryId)
    .all<InquiryNote>();
  return results ?? [];
}

export async function addNote(input: {
  inquiryId: string;
  authorId: string;
  authorName: string;
  body: string;
}) {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO inquiry_notes (id, inquiry_id, author_id, author_name, body)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(newId("not"), input.inquiryId, input.authorId, input.authorName, input.body)
    .run();
}
