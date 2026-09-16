/**
 * Shapes and labels shared by server queries and client components. Kept apart
 * from inquiries.ts so the client bundle never pulls in `server-only`.
 */

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
  created_at: string;
  updated_at: string;
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
