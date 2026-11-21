/**
 * The website's entry routes and the progressive qualification they capture.
 *
 * Source: Phase 3.8, "Website and Conversion Architecture" (approved by Seul,
 * September 24, 2026), its "Focused first release" list, and the route
 * definitions it inherits from Phase 2.5.5 and Phase 3.5. Three diagnostic
 * routes are alternatives, not steps: a visitor starts wherever they are.
 *
 * Pure data and pure functions only, so the form, the server action, the
 * emails, the inbox and the tests all read the same definitions. No imports,
 * so `node --test` can load this file directly.
 */

/**
 * The response expectation the site states. Phase 3.8 says not to repeat the
 * one-business-day promise as a guarantee until someone owns it and has the
 * capacity for it, so it is worded as an expectation and kept in one place.
 * Change it here and every page, email and the inbox follow.
 */
export const RESPONSE_EXPECTATION = "usually within one business day";

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

/** Routes a visitor can submit through the intake form. */
export const INTAKE_ROUTES = ["review", "intensive", "scoped"] as const;
export type IntakeRoute = (typeof INTAKE_ROUTES)[number];

/**
 * Every route an inquiry row can carry. `conversation` is the single
 * discovery-call form that came before this release; rows taken by it keep
 * that label rather than being re-filed under a route they never chose.
 */
export const ALL_ROUTES = [...INTAKE_ROUTES, "conversation"] as const;
export type InquiryRoute = (typeof ALL_ROUTES)[number];

export function isIntakeRoute(value: string): value is IntakeRoute {
  return (INTAKE_ROUTES as readonly string[]).includes(value);
}

export function isInquiryRoute(value: string): value is InquiryRoute {
  return (ALL_ROUTES as readonly string[]).includes(value);
}

export const ROUTE_LABELS: Record<InquiryRoute, string> = {
  review: "Signal-to-Strategy Review",
  intensive: "Social Clarity Intensive",
  scoped: "Specific piece of work",
  conversation: "Discovery call (earlier form)",
};

/** Short labels for chips in the inbox. */
export const ROUTE_SHORT_LABELS: Record<InquiryRoute, string> = {
  review: "Review",
  intensive: "Intensive",
  scoped: "Scoped task",
  conversation: "Discovery call",
};

export type RouteStep = readonly [title: string, copy: string];

export type RouteCopy = {
  /** The button that opens this route's form. */
  cta: string;
  /** The form's submit button. */
  submit: string;
  /** One line above the form, so nobody wonders what they're asking for. */
  formIntro: string;
  /** What the confirmation says, on the page and in the email. */
  confirmation: string;
  /** What happens next, in the acknowledgement email. */
  nextSteps: readonly RouteStep[];
  /** The alert email's one line on what was promised to them. */
  promised: string;
};

export const ROUTE_COPY: Record<InquiryRoute, RouteCopy> = {
  review: {
    cta: "Request a review",
    submit: "Request the review",
    formIntro:
      "A short, bounded read of one specific situation: the likely underlying constraint and the one decision to make next. Not a full strategy.",
    confirmation:
      "A person reads every request. If the review is a fit, we'll reply to confirm what it covers, and whether there's any fee, before anything happens.",
    nextSteps: [
      [
        "A person reads it",
        "Your request goes to a person, not into an automated sequence.",
      ],
      [
        "We confirm the review",
        "If it's a fit, we'll reply to confirm what the review covers, and whether there's any fee, before anything happens. If it isn't, we'll say so and point you somewhere useful.",
      ],
      [
        "You get one clear priority",
        "The likely underlying constraint, what it's costing the business, and the next decision to make. Not a full strategy, and no package attached.",
      ],
    ],
    promised:
      "They asked for a Signal-to-Strategy Review and were told we'd confirm scope and any fee before anything happens.",
  },
  intensive: {
    cta: "Ask about the Intensive",
    submit: "Ask about the Intensive",
    formIntro:
      "The paid diagnosis. Tell us the decision in front of you and we'll come back with scope, inputs, timing and price before anything is booked.",
    confirmation:
      "We'll reply to check the Intensive is the right depth for you. If something smaller would do, we'll say so. Nothing is booked or charged through this website.",
    nextSteps: [
      ["A person reads it", "Your request goes to a person, not into an automated sequence."],
      [
        "A short fit conversation",
        "We check the Intensive is the right depth before anything is booked. If something smaller would do, we'll tell you that.",
      ],
      [
        "Scope and price, in writing",
        "You'll see the scope, what we'd need from you, the timing and the price before you commit. Nothing is charged through the website.",
      ],
    ],
    promised:
      "They asked about the Social Clarity Intensive and were told they'd see scope and price in writing before anything is booked.",
  },
  scoped: {
    cta: "Scope a specific task",
    submit: "Send the task",
    formIntro:
      "Already know the exact piece of work? Describe it and we'll come back with the deliverable, what we'd need from you, revisions and where it stops.",
    confirmation:
      "We'll reply with a scope for the task, or tell you plainly if it isn't something we'd do well.",
    nextSteps: [
      ["A person reads it", "Your request goes to a person, not into an automated sequence."],
      [
        "We scope the task",
        "The deliverable, what we'd need from you, the number of revisions, and exactly where the work stops.",
      ],
      [
        "You decide",
        "Nothing starts until you've seen the scope and said yes. No retainer is needed for a finite piece of work.",
      ],
    ],
    promised:
      "They described a specific piece of work and were told they'd get a written scope before anything starts.",
  },
  conversation: {
    cta: "Start a conversation",
    submit: "Request a discovery call",
    formIntro: "",
    confirmation: "We'll follow up to find a time for the conversation.",
    nextSteps: [
      [
        "A conversation about fit",
        "Where the business actually stands right now. No slide deck, no package waiting at the end of it.",
      ],
      [
        "Diagnosis comes after",
        "Recommendations come once the business has actually been looked at, not on the first call.",
      ],
      [
        "A scope built for this business",
        "Sized to the budget and stage in front of us. If you need less than you think, we'll tell you that.",
      ],
    ],
    promised: "They asked for a discovery call through the earlier single form.",
  },
};

/* ------------------------------------------------------------------ */
/* Qualification fields                                                */
/* ------------------------------------------------------------------ */

/** Where the business's social media stands. Unchanged from the first form. */
export const journeyStages = [
  "Just getting started",
  "Posting, but not consistent",
  "Consistent, but not growing",
  "Ready to scale with a partner",
] as const;

/** Decision authority: the alignment register notes the first form never asked. */
export const ROLES = [
  "Owner or founder",
  "Co-owner or partner",
  "Manager or team member",
  "Advisor or someone helping the business",
] as const;

/** Readiness, asked only where it changes what happens next. */
export const TIMINGS = [
  "Within the next month",
  "In the next one to three months",
  "Just exploring for now",
] as const;

/**
 * Which fields each route asks for, and which of them it needs. Name, email
 * and business are always required; everything else is progressive, so the
 * first interaction never turns into an onboarding questionnaire.
 */
export type IntakeField =
  | "profile"
  | "role"
  | "stage"
  | "situation"
  | "consequence"
  | "whyNow"
  | "decision"
  | "timing"
  | "phone";

export const ROUTE_FIELDS: Record<
  IntakeRoute,
  { asks: readonly IntakeField[]; requires: readonly IntakeField[] }
> = {
  review: {
    asks: ["profile", "role", "stage", "situation", "consequence", "whyNow", "phone"],
    requires: ["stage", "situation"],
  },
  intensive: {
    asks: ["profile", "role", "stage", "decision", "situation", "timing", "phone"],
    requires: ["role", "stage", "decision"],
  },
  scoped: {
    asks: ["profile", "stage", "situation", "timing", "phone"],
    requires: ["situation"],
  },
};

/** Field labels, per route where the question reads differently. */
export const FIELD_LABELS: Record<IntakeRoute, Partial<Record<IntakeField, string>>> = {
  review: {
    situation: "What's happening right now?",
    consequence: "What is it costing the business?",
    whyNow: "Why look at it now?",
  },
  intensive: {
    decision: "What decision do you need to make?",
    situation: "Anything else we should know?",
    timing: "When do you need to decide?",
  },
  scoped: {
    situation: "What's the piece of work?",
    timing: "When do you need it?",
  },
};

export const FIELD_HINTS: Partial<Record<IntakeField, string>> = {
  profile: "Your website or the social profile you most want looked at.",
  consequence: "Missed enquiries, time it takes, money spent with nothing to show for it.",
  decision: "For example: whether to hire, change providers, or what social media should do this year.",
};

/* ------------------------------------------------------------------ */
/* Follow-up: the accountable process behind every capture route       */
/* ------------------------------------------------------------------ */

/**
 * Qualification outcomes. These are Phase 3.8's lead-routing table, plus the
 * deferred, declined and no-response outcomes it says to define alongside
 * success. Nothing here is a score: a person sets it after reading.
 */
export const QUALIFICATION_OUTCOMES = [
  "unreviewed",
  "diagnostic",
  "nurture",
  "foundation",
  "a-la-carte",
  "deferred",
  "declined",
  "no-response",
] as const;
export type QualificationOutcome = (typeof QUALIFICATION_OUTCOMES)[number];

export function isQualificationOutcome(value: string): value is QualificationOutcome {
  return (QUALIFICATION_OUTCOMES as readonly string[]).includes(value);
}

export const QUALIFICATION_LABELS: Record<QualificationOutcome, string> = {
  unreviewed: "Not reviewed yet",
  diagnostic: "Strong fit, active need: review or diagnostic",
  nurture: "Strong fit, low urgency: resource for now",
  foundation: "Early-stage foundation need",
  "a-la-carte": "Clear finite need: scope À La Carte",
  deferred: "Deferred or redirected",
  declined: "Declined: not a fit",
  "no-response": "No response from them",
};

/** Outcomes that close the loop; anything else still needs a next action. */
export const CLOSED_OUTCOMES: readonly QualificationOutcome[] = [
  "deferred",
  "declined",
  "no-response",
];
