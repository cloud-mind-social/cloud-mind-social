export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.cloudmindsocial.com";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON (e.g. an empty body); fall back to statusText.
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- Auth ----

export type Role = "owner" | "admin" | "member";

export interface Me {
  id: string;
  displayName: string;
  jobTitle: string | null;
  signature: string | null;
  /** The rich version, already sanitised server-side. Null when plain-only. */
  signatureHtml: string | null;
  /** IANA zone the person works in; times in mail are read against it. */
  timeZone: string;
  /** Seconds a sent message waits in the Outbox before it leaves; 0 is off. */
  undoSendSeconds: number;
  role: Role;
  addresses: string[];
}

export type RsvpResponse = "ACCEPTED" | "DECLINED" | "TENTATIVE";

export interface CalendarEvent {
  id: string;
  uid: string;
  method: "REQUEST" | "REPLY" | "CANCEL" | "PUBLISH" | "COUNTER" | "OTHER";
  summary: string;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  organizer: { address: string; name: string | null } | null;
  attendees: { address: string; name?: string; status?: string; rsvp: boolean }[];
  /** True when the event repeats. The rule is not expanded server-side. */
  repeats: boolean;
  recurrenceRule: string | null;
  timeZone: string | null;
  status: string | null;
  /** `created` means we made it, so there is nothing to RSVP to. */
  source: "received" | "created";
  rsvpResponse: RsvpResponse | null;
  rsvpAt: string | null;
}

/** A time found in the prose, resolved in the reader's own zone. */
export interface ProposedTime {
  /** The words that were matched, so the UI can show what it read. */
  text: string;
  at: string;
  /** True when a day was named but no clock time — the hour is our reading. */
  dayOnly: boolean;
}

/** Where a message is on its way out. Null once it has arrived or never left. */
export type SendState = "queued" | "sending" | "failed" | null;

export const auth = {
  login: (address: string, password: string) =>
    request<{ user: { id: string; displayName: string; role: Role } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ address, password }),
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => request<Me>("/api/auth/me"),
  acceptInvite: (token: string, password: string) =>
    request<{ user: { id: string; displayName: string; role: Role } }>("/api/invites/accept", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ ok: true }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
  /**
   * Saves both halves. The HTML is sanitised server-side and the reply carries
   * back what was actually stored, which may be less than what was sent.
   */
  updateSignature: (signature: string, signatureHtml?: string) =>
    request<{ ok: true; signature: string; signatureHtml: string | null }>(
      "/api/auth/signature",
      { method: "PATCH", body: JSON.stringify({ signature, signatureHtml }) },
    ),
  updateTimeZone: (timeZone: string) =>
    request<{ ok: true; timeZone: string }>("/api/settings/time-zone", {
      method: "PATCH",
      body: JSON.stringify({ timeZone }),
    }),
  updateUndoSend: (undoSendSeconds: number) =>
    request<{ ok: true; undoSendSeconds: number }>("/api/auth/undo-send", {
      method: "PATCH",
      body: JSON.stringify({ undoSendSeconds }),
    }),
};

// ---- Mailbox ----

export type SystemFolder =
  | "inbox"
  | "outbox"
  | "snoozed"
  | "sent"
  | "drafts"
  | "trash"
  | "spam";

export interface Folder {
  id: string;
  name: string;
  systemType: SystemFolder | "custom";
  unreadCount: number;
}

export interface Label {
  id: string;
  name: string;
  color: string | null;
}

export interface LabelWithCount extends Label {
  messageCount: number;
}

export interface MessageSummary {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  fromAddr: string;
  toAddrs: string[];
  subject: string;
  snippet: string;
  sizeBytes: number;
  hasAttachments: boolean;
  isRead: boolean;
  isStarred: boolean;
  receivedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  labels: Label[];
  sendState: SendState;
  sendAfter: string | null;
  sendError: string | null;
  /** When a put-away message comes back. Null unless it is snoozed. */
  snoozedUntil: string | null;
}

export interface MessageDetail {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  fromAddr: string;
  toAddrs: string[];
  ccAddrs: string[];
  bccAddrs: string[];
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  isRead: boolean;
  isStarred: boolean;
  receivedAt: string | null;
  sentAt: string | null;
  attachments: Attachment[];
  labels: Label[];
  sendState: SendState;
  sendAfter: string | null;
  sendError: string | null;
  snoozedUntil: string | null;
  events: CalendarEvent[];
  proposedTimes: ProposedTime[];
  /** The zone the times above were resolved in. */
  timeZone: string;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  isInline: boolean;
  contentId: string | null;
}

export type MessageSort = "date" | "from" | "subject" | "size" | "read" | "starred";
export type SortOrder = "asc" | "desc";

export const mail = {
  /**
   * Puts messages away until a time. Takes a list, so one message and a
   * checkbox selection are the same call.
   */
  snooze: (messageIds: string[], until: string) =>
    request<{ ok: true; snoozed: number; until: string }>("/api/messages/snooze", {
      method: "POST",
      body: JSON.stringify({ messageIds, until }),
    }),

  /** Brings them back now. */
  unsnooze: (messageIds: string[]) =>
    request<{ ok: true; woken: number }>("/api/messages/unsnooze", {
      method: "POST",
      body: JSON.stringify({ messageIds }),
    }),

  folders: () => request<{ folders: Folder[] }>("/api/folders"),

  list: (params: {
    folder: string;
    sort?: MessageSort;
    order?: SortOrder;
    q?: string;
    cursor?: string;
    limit?: number;
    unread?: boolean;
    starred?: boolean;
    hasAttachments?: boolean;
  }) => {
    const qs = new URLSearchParams();
    qs.set("folder", params.folder);
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    if (params.q) qs.set("q", params.q);
    if (params.cursor) qs.set("cursor", params.cursor);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.unread) qs.set("unread", "true");
    if (params.starred) qs.set("starred", "true");
    if (params.hasAttachments) qs.set("hasAttachments", "true");
    return request<{
      messages: MessageSummary[];
      nextCursor: string | null;
      /** How the server read the query — the effective folder, and any typos. */
      search?: { scope: string; unknownOperators: string[] };
    }>(`/api/messages?${qs.toString()}`);
  },

  get: (id: string) => request<MessageDetail>(`/api/messages/${id}`),

  sourceUrl: (id: string) => `${API_BASE_URL}/api/messages/${id}/source`,

  attachmentUrl: (id: string, attachmentId: string) =>
    `${API_BASE_URL}/api/messages/${id}/attachments/${attachmentId}`,

  /**
   * Same object, but asking the API for a save rather than a preview. A link's
   * `download` attribute is ignored cross-origin and the API is a different
   * origin from this app, so the server's Content-Disposition is what decides —
   * `?download=1` makes it `attachment` even for inline images.
   */
  attachmentDownloadUrl: (id: string, attachmentId: string) =>
    `${API_BASE_URL}/api/messages/${id}/attachments/${attachmentId}?download=1`,

  patch: (id: string, body: { isRead?: boolean; isStarred?: boolean; folderId?: string }) =>
    request<{ ok: true }>(`/api/messages/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  remove: (id: string) => request<{ ok: true }>(`/api/messages/${id}`, { method: "DELETE" }),

  markAllRead: (folder: string) =>
    request<{ ok: true }>(`/api/folders/${folder}/mark-all-read`, { method: "POST" }),

  thread: (threadId: string) => request<{ messages: MessageDetail[] }>(`/api/threads/${threadId}`),
};

/**
 * Labels are the cross-cutting half of filing: a message sits in one folder
 * and carries any number of these. Applying and removing are idempotent, so
 * an impatient double-click is harmless.
 */
export interface RuleActions {
  addLabelIds?: string[];
  moveToFolderId?: string;
  markRead?: boolean;
  star?: boolean;
  trash?: boolean;
  stop?: boolean;
}

export interface Rule {
  id: string;
  name: string;
  /** A search query — the same grammar as the search box. */
  query: string;
  position: number;
  enabled: boolean;
  actions: RuleActions;
}

/**
 * Filters.
 *
 * A rule's condition is a search query, matched server-side by the same code
 * that answers the search box — so `preview` shows exactly what the rule will
 * catch, not an approximation of it.
 */
export const rules = {
  list: () => request<{ rules: Rule[] }>("/api/rules"),

  preview: (q: string) =>
    request<{ matches: number; unknownOperators: string[] }>(
      `/api/rules/preview?q=${encodeURIComponent(q)}`,
    ),

  create: (body: {
    name: string;
    query: string;
    actions: RuleActions;
    applyToExisting?: boolean;
  }) =>
    request<Rule & { applied: number }>("/api/rules", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, patch: Partial<Pick<Rule, "name" | "query" | "enabled" | "actions">>) =>
    request<Rule>(`/api/rules/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  remove: (id: string) => request<{ ok: true }>(`/api/rules/${id}`, { method: "DELETE" }),

  run: (id: string) =>
    request<{ applied: number; limited: boolean }>(`/api/rules/${id}/run`, { method: "POST" }),
};

/**
 * Answering an invitation.
 *
 * A rejection here means the reply did not go out, so the UI must not show
 * the answer as recorded — the server refuses to record one it could not send.
 */
export const calendar = {
  rsvp: (eventId: string, response: RsvpResponse) =>
    request<{ ok: true; response: RsvpResponse }>(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),

  /**
   * Creates an event from a confirmed suggestion.
   *
   * Every field is sent explicitly: the person has just been shown what was
   * detected and given the chance to correct it, and what they approved is
   * what should be stored.
   */
  createEvent: (
    messageId: string,
    body: {
      summary: string;
      startsAt: string;
      endsAt: string;
      location?: string;
      invite?: boolean;
    },
  ) =>
    request<{ id: string; uid: string; invited: boolean }>(
      `/api/messages/${messageId}/events`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  /** The event as a file. Served with a disposition that forces a save. */
  icsUrl: (eventId: string) => `${API_BASE_URL}/api/events/${eventId}/ics`,
};

export interface DevicePassword {
  id: string;
  name: string;
  /** The first four characters, so two of them can be told apart in a list. */
  hint: string;
  scope: "calendar";
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * Passwords for the devices that sync a calendar.
 *
 * A calendar client authenticates on every request with nothing but a name and
 * a password — no cookie, no login page, no second factor. So each device gets
 * its own, and revoking one stops that device and nothing else.
 *
 * `create` is the only place a secret ever exists. There is no endpoint that
 * returns one afterwards, which is the point: a password that can be read back
 * is a password stored in the clear.
 */
export const devicePasswords = {
  list: () => request<{ appPasswords: DevicePassword[] }>("/api/app-passwords"),

  create: (name: string) =>
    request<{ appPassword: DevicePassword; secret: string }>("/api/app-passwords", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  revoke: (id: string) =>
    request<{ ok: true }>(`/api/app-passwords/${id}`, { method: "DELETE" }),
};

export interface CalendarCollection {
  id: string;
  name: string;
  color: string;
  timeZone: string;
  isDefault: boolean;
}

export interface CalendarEntry {
  id: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  transp: "opaque" | "transparent";
  status: "confirmed" | "tentative" | "cancelled";
  organizer: { address: string; name: string | null } | null;
  attendees: { address: string; name?: string; status?: string; rsvp: boolean }[];
  /** Whether it was scheduled here, arrived as mail, or came from a device. */
  source: "received" | "created" | "caldav";
  /** Set when it arrived as mail, so the screen can link back to the message. */
  messageId: string | null;
  rsvpResponse: string | null;
  isRecurring: boolean;
}

export interface CalendarEntryInput {
  summary: string;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string;
  description?: string;
  calendarId?: string;
  transp?: "opaque" | "transparent";
}

/**
 * The calendar itself, as opposed to invitations arriving in mail.
 *
 * The same collections a phone syncs over CalDAV — this is a view of one
 * calendar, not a second one that looks similar, which is why every write here
 * turns up on a synced device without anything else happening.
 */
export const calendarEvents = {
  collections: () => request<{ calendars: CalendarCollection[] }>("/api/calendars"),

  inWindow: (from: Date, to: Date) =>
    request<{ events: CalendarEntry[] }>(
      `/api/calendar/events?from=${encodeURIComponent(from.toISOString())}` +
        `&to=${encodeURIComponent(to.toISOString())}`,
    ),

  create: (input: CalendarEntryInput) =>
    request<{ event: CalendarEntry }>("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, patch: Partial<CalendarEntryInput>) =>
    request<{ event: CalendarEntry }>(`/api/calendar/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  remove: (id: string) =>
    request<{ ok: true }>(`/api/calendar/events/${id}`, { method: "DELETE" }),
};

export const labels = {
  list: () => request<{ labels: LabelWithCount[] }>("/api/labels"),

  create: (name: string, color?: string | null) =>
    request<Label>("/api/labels", { method: "POST", body: JSON.stringify({ name, color }) }),

  update: (id: string, patch: { name?: string; color?: string | null }) =>
    request<Label>(`/api/labels/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  remove: (id: string) => request<{ ok: true }>(`/api/labels/${id}`, { method: "DELETE" }),

  apply: (messageId: string, labelId: string) =>
    request<{ ok: true }>(`/api/messages/${messageId}/labels/${labelId}`, { method: "PUT" }),

  detach: (messageId: string, labelId: string) =>
    request<{ ok: true }>(`/api/messages/${messageId}/labels/${labelId}`, { method: "DELETE" }),
};

export interface DirectoryContact {
  displayName: string;
  address: string;
  /**
   * Where the suggestion comes from: someone this mailbox corresponds with,
   * or a colleague from the org directory who has never been written to.
   */
  source: "history" | "directory";
  /** How many messages have gone to them. Zero for directory-only entries. */
  sentCount: number;
}

export const directory = {
  list: () => request<{ contacts: DirectoryContact[] }>("/api/directory"),
};

// ---- Compose ----

export interface ComposeInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachmentIds?: string[];
}

export const compose = {
  saveDraft: (body: ComposeInput) =>
    request<{ id: string }>("/api/drafts", { method: "POST", body: JSON.stringify(body) }),

  updateDraft: (id: string, body: ComposeInput) =>
    request<{ ok: true }>(`/api/drafts/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  /**
   * Sends — which normally means "puts in the Outbox".
   *
   * A reply carrying `queued: true` has not gone anywhere yet and can still
   * be recalled for `undoSeconds`; one without has already left. Omitting
   * `undoSeconds` uses the person's own setting.
   */
  send: (
    body: ComposeInput & {
      draftId?: string;
      inReplyTo?: string;
      undoSeconds?: number;
      /** Send at this moment instead of now. Beats `undoSeconds`. */
      sendAt?: string;
    },
  ) =>
    request<{
      id: string;
      providerMessageId?: string | null;
      queued?: true;
      scheduled?: true;
      undoSeconds?: number;
      sendAfter?: string;
    }>("/api/messages/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Takes a queued message back. Rejects once it has gone — 409. */
  undoSend: (id: string) =>
    request<{ ok: true; draftId: string }>(`/api/messages/${id}/undo-send`, { method: "POST" }),

  /** Moves a scheduled message. Rejects once it has gone — 409. */
  reschedule: (id: string, sendAt: string) =>
    request<{ ok: true; sendAfter: string }>(`/api/messages/${id}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ sendAt }),
    }),

  uploadAttachment: (file: File) => {
    const form = new FormData();
    form.set("file", file);
    return request<UploadedAttachment>("/api/attachments", { method: "POST", body: form });
  },

  /**
   * Same upload, but reporting progress — which needs XMLHttpRequest: fetch
   * exposes no upload-progress events, so a big attachment on a slow line
   * would otherwise sit at "Uploading…" with nothing moving.
   *
   * Returns an abort handle so a queued upload can be cancelled.
   */
  uploadAttachmentWithProgress: (
    file: File,
    onProgress: (fraction: number) => void,
  ): { promise: Promise<UploadedAttachment>; abort: () => void } => {
    const xhr = new XMLHttpRequest();
    const promise = new Promise<UploadedAttachment>((resolve, reject) => {
      const form = new FormData();
      form.set("file", file);
      xhr.open("POST", `${API_BASE_URL}/api/attachments`);
      xhr.withCredentials = true;
      xhr.upload.addEventListener("progress", (e) => {
        // Not every transfer reports a total; fall back to indeterminate.
        if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
      });
      xhr.addEventListener("load", () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`Upload failed (${xhr.status})`));
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText) as UploadedAttachment);
        } catch {
          reject(new Error("Upload returned an unreadable response"));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      xhr.send(form);
    });
    return { promise, abort: () => xhr.abort() };
  },
};

export interface UploadedAttachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

// ---- Admin ----

export interface OrgUser {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  role: Role;
  status: "active" | "invited" | "suspended";
  lastLoginAt: string | null;
  addresses: string[];
}

export interface OrgAddress {
  id: string;
  address: string;
  userId: string;
  type: "primary" | "alias";
}

export interface InviteInput {
  email: string;
  notifyEmail: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  role: "admin" | "member";
}

export const admin = {
  listUsers: () => request<{ users: OrgUser[] }>("/api/admin/users"),

  patchUser: (id: string, body: { role?: "admin" | "member"; status?: "active" | "suspended" }) =>
    request<{ ok: true }>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  invite: (input: InviteInput) =>
    request<{ inviteId: string; token: string; expiresAt: string; notifyEmail: string; emailSent: boolean }>(
      "/api/admin/invites",
      { method: "POST", body: JSON.stringify(input) },
    ),

  resetPassword: (userId: string) =>
    request<{ resetId: string; token: string; expiresAt: string }>(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
    }),

  listAddresses: () => request<{ addresses: OrgAddress[] }>("/api/admin/addresses"),

  createAddress: (userId: string, localPart: string) =>
    request<{ address: { id: string; address: string } }>("/api/admin/addresses", {
      method: "POST",
      body: JSON.stringify({ userId, localPart }),
    }),

  deleteAddress: (id: string) =>
    request<{ ok: true }>(`/api/admin/addresses/${id}`, { method: "DELETE" }),
};

// ---- Analytics ----

export interface LoginAnalytics {
  range: { days: number; since: string };
  byDay: { day: string; ok: number; failed: number }[];
  byUser: { userId: string; displayName: string; ok: number; failed: number; lastLoginAt: string | null }[];
}

export interface EmailAnalytics {
  range: { days: number; since: string };
  groupBy: "user" | "day";
  series: Array<
    | { day: string; sent: number; received: number; bounced: number; rejected: number }
    | { userId: string; displayName: string; sent: number; received: number; bounced: number; rejected: number }
  >;
}

export interface OverviewAnalytics {
  range: { days: number; since: string };
  users: { total: number; active: number };
  email: { sent: number; received: number; bounced: number; rejected: number };
  logins: { ok: number; failed: number };
}

export const analytics = {
  logins: (range = 30) => request<LoginAnalytics>(`/api/admin/analytics/logins?range=${range}`),
  email: (range = 30, groupBy: "user" | "day" = "day") =>
    request<EmailAnalytics>(`/api/admin/analytics/email?range=${range}&groupBy=${groupBy}`),
  overview: (range = 30) => request<OverviewAnalytics>(`/api/admin/analytics/overview?range=${range}`),
};
