/**
 * Shapes and labels shared by server queries and client components. Kept apart
 * from inquiries.ts so the client bundle never pulls in `server-only`.
 */
import type { InquiryRoute, QualificationOutcome } from "@/lib/intake";

export const INQUIRY_STATUSES = ["new", "reading", "replied", "archived"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  reading: "Looking at it",
  replied: "Replied",
  archived: "Archived",
};

export function isInquiryStatus(value: string): value is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(value);
}

export type InquiryFilter = InquiryStatus | "all" | "open";

/** `logged` is local development, where there is no EMAIL binding to send with. */
export type AckDelivery = "sent" | "failed" | "logged";

export type Inquiry = {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string | null;
  stage: string;
  message: string | null;
  status: InquiryStatus;
  source: string;
  /**
   * How the acknowledgement email went. NULL for inquiries taken before this
   * was recorded — unknown rather than failed, so they show no warning.
   */
  ack_delivery: AckDelivery | null;
  ack_error: string | null;
  /** Entry route. Rows from before routes existed read `conversation`. */
  route: InquiryRoute;
  profile: string | null;
  role: string | null;
  consequence: string | null;
  why_now: string | null;
  decision: string | null;
  timing: string | null;
  signal_category: string | null;
  signal_answers: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_path: string | null;
  qualification: QualificationOutcome;
  owner: string | null;
  next_action: string | null;
  /** YYYY-MM-DD. */
  next_action_due: string | null;
  follow_up_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FollowUpInput = {
  qualification: QualificationOutcome;
  owner: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
};

export type InquiryReply = {
  id: string;
  inquiry_id: string;
  author_name: string;
  subject: string;
  body: string;
  delivery: "sent" | "failed";
  error: string | null;
  created_at: string;
};

export type InquiryNote = {
  id: string;
  inquiry_id: string;
  author_name: string;
  body: string;
  created_at: string;
};
