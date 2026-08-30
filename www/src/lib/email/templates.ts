/**
 * Branded email templates.
 *
 * Table-based, inline-styled HTML — the only thing email clients agree on.
 * Colours are lifted straight from globals.css so mail matches the site, and
 * the type stack falls back to system serifs since Google Fonts don't load in
 * mail clients.
 */

const C = {
  ink: "#121309",
  inkSoft: "#191b12",
  inkRaised: "#21241a",
  cream: "#f4efe0",
  creamDim: "#b6b29b",
  creamFaint: "#8c886f",
  sage: "#93a67c",
  amber: "#dd9440",
  line: "#2c2e22",
} as const;

const DISPLAY = "'Iowan Old Style', Georgia, 'Times New Roman', serif";
const BODY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Turns typed plain text into escaped paragraphs, preserving line breaks. */
function paragraphs(text: string, color = C.cream): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 18px;font-family:${BODY};font-size:16px;line-height:1.65;color:${color};">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

type ShellOptions = {
  preheader: string;
  body: string;
  siteUrl: string;
  footerNote?: string;
};

/** The outer chrome every CMS email shares. */
function shell({ preheader, body, siteUrl, footerNote }: ShellOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>Cloud Mind Social</title>
</head>
<body style="margin:0;padding:0;background-color:${C.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${escapeHtml(
    preheader,
  )}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.ink};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">

          <tr>
            <td style="padding:0 0 24px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <span style="font-family:${MONO};font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:${C.cream};">Cloud Mind Social</span>
              </a>
            </td>
          </tr>

          <tr>
            <td style="background-color:${C.inkSoft};border:1px solid ${C.line};border-radius:16px;padding:40px 36px;">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="padding:24px 4px 0;">
              ${
                footerNote
                  ? `<p style="margin:0 0 14px;font-family:${BODY};font-size:13px;line-height:1.6;color:${C.creamFaint};">${footerNote}</p>`
                  : ""
              }
              <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${C.creamFaint};">
                Cloud &middot; Mind &middot; Social
              </p>
              <p style="margin:8px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${C.creamFaint};">
                <a href="${siteUrl}" style="color:${C.creamFaint};text-decoration:none;">cloudmindsocial.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-family:${DISPLAY};font-weight:400;font-size:30px;line-height:1.15;color:${C.cream};">${escapeHtml(
    text,
  )}</h1>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 18px;font-family:${MONO};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.sage};">${escapeHtml(
    text,
  )}</p>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;">
    <tr>
      <td style="background-color:${C.amber};border-radius:999px;">
        <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:${MONO};font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${C.ink};text-decoration:none;">${escapeHtml(
          label,
        )}</a>
      </td>
    </tr>
  </table>`;
}

type Row = [label: string, value: string];

function detailRows(rows: Row[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};">
    ${rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding:14px 0;border-bottom:1px solid ${C.line};vertical-align:top;width:34%;">
        <span style="font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.creamFaint};">${escapeHtml(
          label,
        )}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${C.line};vertical-align:top;">
        <span style="font-family:${BODY};font-size:15px;line-height:1.6;color:${C.cream};">${escapeHtml(
          value,
        ).replace(/\n/g, "<br />")}</span>
      </td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

export type InquirySummary = {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string | null;
  stage: string;
  message: string | null;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* 1. Auto-response to the person who submitted the form               */
/* ------------------------------------------------------------------ */

const NEXT_STEPS: Array<[string, string]> = [
  [
    "A conversation, not a pitch",
    "We'll ask where the business actually stands right now. No slide deck, no package waiting at the end of it.",
  ],
  [
    "A real diagnosis",
    "What's working, what isn't, and why — looked at before anything gets recommended.",
  ],
  [
    "A scope built for this business",
    "Sized to the budget and stage in front of us. If you need less than you think, we'll tell you that.",
  ],
];

export function inquiryReceivedEmail(
  inquiry: InquirySummary,
  site: string,
): { subject: string; html: string; text: string } {
  const name = firstName(inquiry.name);

  const steps = NEXT_STEPS.map(
    ([title, copy], index) => `<tr>
      <td style="padding:0 16px 0 0;vertical-align:top;width:34px;">
        <span style="font-family:${MONO};font-size:12px;color:${C.amber};">0${index + 1}</span>
      </td>
      <td style="padding:0 0 22px;vertical-align:top;">
        <p style="margin:0 0 5px;font-family:${BODY};font-size:15px;font-weight:600;color:${C.cream};">${escapeHtml(
          title,
        )}</p>
        <p style="margin:0;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.creamDim};">${escapeHtml(
          copy,
        )}</p>
      </td>
    </tr>`,
  ).join("");

  const body = `
    ${eyebrow("Request received")}
    ${heading(`Thanks, ${name}. We've got it.`)}
    <p style="margin:0 0 18px;font-family:${BODY};font-size:16px;line-height:1.65;color:${C.creamDim};">
      Your note about ${escapeHtml(inquiry.business)} came through. Someone here will read it
      properly &mdash; not skim it &mdash; and reply within one business day to find a time to talk.
    </p>
    <p style="margin:0 0 30px;font-family:${BODY};font-size:16px;line-height:1.65;color:${C.creamDim};">
      Nothing is expected from you before then.
    </p>

    <p style="margin:0 0 18px;font-family:${MONO};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.sage};">What happens next</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>

    <div style="height:1px;background-color:${C.line};margin:14px 0 28px;"></div>

    <p style="margin:0 0 16px;font-family:${MONO};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.sage};">What you sent us</p>
    ${detailRows([
      ["Business", inquiry.business],
      ["Stage", inquiry.stage],
      ...(inquiry.phone ? [["Phone", inquiry.phone] satisfies Row] : []),
      ...(inquiry.message ? [["In your words", inquiry.message] satisfies Row] : []),
    ])}

    <p style="margin:28px 0 0;font-family:${BODY};font-size:15px;line-height:1.65;color:${C.creamDim};">
      If anything above is wrong, just reply to this email and we'll fix it.
    </p>
  `;

  const text = `CLOUD MIND SOCIAL

Thanks, ${name}. We've got it.

Your note about ${inquiry.business} came through. Someone here will read it
properly — not skim it — and reply within one business day to find a time to
talk. Nothing is expected from you before then.

WHAT HAPPENS NEXT
${NEXT_STEPS.map(([title, copy], i) => `0${i + 1}  ${title}\n    ${copy}`).join("\n\n")}

WHAT YOU SENT US
Business: ${inquiry.business}
Stage: ${inquiry.stage}${inquiry.phone ? `\nPhone: ${inquiry.phone}` : ""}${
    inquiry.message ? `\nIn your words: ${inquiry.message}` : ""
  }

If anything above is wrong, just reply to this email and we'll fix it.

Cloud · Mind · Social
${site}
`;

  return {
    subject: "We've got your note — here's what happens next",
    html: shell({
      preheader: `We'll reply within one business day about ${inquiry.business}.`,
      body,
      siteUrl: site,
      footerNote:
        "You're getting this because you asked for a discovery call at cloudmindsocial.com.",
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Internal alert so she knows something came in                    */
/* ------------------------------------------------------------------ */

export function inquiryAlertEmail(
  inquiry: InquirySummary,
  site: string,
): { subject: string; html: string; text: string } {
  const link = `${site}/admin/inquiries/${inquiry.id}`;

  const body = `
    ${eyebrow("New inquiry")}
    ${heading(`${inquiry.name} — ${inquiry.business}`)}
    ${detailRows([
      ["Name", inquiry.name],
      ["Business", inquiry.business],
      ["Email", inquiry.email],
      ...(inquiry.phone ? [["Phone", inquiry.phone] satisfies Row] : []),
      ["Stage", inquiry.stage],
      ["In their words", inquiry.message || "— nothing added —"],
    ])}
    <div style="height:26px;"></div>
    ${button("Open in the inbox", link)}
    <p style="margin:22px 0 0;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.creamFaint};">
      They've already had the automatic acknowledgement. The promise made to them is a
      reply within one business day.
    </p>
  `;

  const text = `NEW INQUIRY — ${inquiry.name} (${inquiry.business})

Name: ${inquiry.name}
Business: ${inquiry.business}
Email: ${inquiry.email}${inquiry.phone ? `\nPhone: ${inquiry.phone}` : ""}
Stage: ${inquiry.stage}

In their words:
${inquiry.message || "— nothing added —"}

Open in the inbox: ${link}

They've already had the automatic acknowledgement. The promise made to them is a
reply within one business day.
`;

  return {
    subject: `New inquiry — ${inquiry.name}, ${inquiry.business}`,
    html: shell({
      preheader: `${inquiry.stage} · ${inquiry.email}`,
      body,
      siteUrl: site,
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Her reply, sent from the admin inbox                             */
/* ------------------------------------------------------------------ */

export function replyEmail(
  input: {
    to: string;
    recipientName: string;
    subject: string;
    body: string;
    authorName: string;
  },
  site: string,
): { subject: string; html: string; text: string } {
  // No eyebrow here — the wordmark is already directly above, and a reply
  // should read like a message from a person, not a notification.
  const body = `
    ${paragraphs(input.body)}
    <div style="height:1px;background-color:${C.line};margin:30px 0 24px;"></div>
    <p style="margin:0;font-family:${BODY};font-size:15px;line-height:1.6;color:${C.cream};">${escapeHtml(
      input.authorName,
    )}</p>
    <p style="margin:4px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.creamFaint};">
      Cloud Mind Social
    </p>
  `;

  const text = `${input.body}

—
${input.authorName}
Cloud Mind Social
${site}
`;

  return {
    subject: input.subject,
    html: shell({
      preheader: input.body.replace(/\s+/g, " ").slice(0, 140),
      body,
      siteUrl: site,
      footerNote: "Reply to this email and it goes straight back to us.",
    }),
    text,
  };
}
