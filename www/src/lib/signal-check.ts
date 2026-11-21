/**
 * The Social Signal Check: a short self-assessment that points at what to
 * examine first. Phase 2.5.5 defines it as identifying a problem category,
 * "not a complete strategy"; Phase 3.8 says to show the basic result at once
 * and label it an indication, not a diagnosis. Nothing here is a validated
 * score, and the result never says otherwise.
 *
 * It runs entirely in the browser. Answers leave the page only if the visitor
 * chooses to send them with a review request.
 *
 * Pure data and pure functions, no imports, so `node --test` loads it directly.
 */

export const SIGNAL_CATEGORIES = [
  "foundation",
  "direction",
  "coordination",
  "capacity",
  "measurement",
  "content",
] as const;
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

/** The result when no single area stands out. */
export const NO_CLEAR_SIGNAL = "steady" as const;
export type SignalResultKey = SignalCategory | typeof NO_CLEAR_SIGNAL;

export function isSignalResultKey(value: string): value is SignalResultKey {
  return value === NO_CLEAR_SIGNAL || (SIGNAL_CATEGORIES as readonly string[]).includes(value);
}

type Weights = Partial<Record<SignalCategory, number>>;

export type SignalOption = { id: string; label: string; weights: Weights };
export type SignalQuestion = { id: string; prompt: string; options: readonly SignalOption[] };

/**
 * Seven questions, drawn from the areas Phase 2.5.5 and Phase 3.8 list: offer
 * and customers, what social media is for, who owns decisions, where it breaks
 * down, what gets measured, what it costs the owner, and what's been tried.
 */
export const SIGNAL_QUESTIONS: readonly SignalQuestion[] = [
  {
    id: "offer",
    prompt: "Which is closest to where the business is?",
    options: [
      { id: "a", label: "A clear offer, and customers who come back or refer others", weights: {} },
      { id: "b", label: "Paying customers, but what we sell is still shifting", weights: { foundation: 2 } },
      { id: "c", label: "Still working out the offer, or who it's really for", weights: { foundation: 3 } },
    ],
  },
  {
    id: "purpose",
    prompt: "What is social media supposed to do for the business right now?",
    options: [
      { id: "a", label: "Something specific, like bringing in enquiries for one service", weights: {} },
      { id: "b", label: "Generally get us out there", weights: { direction: 2 } },
      { id: "c", label: "Honestly, we're not sure", weights: { direction: 3 } },
    ],
  },
  {
    id: "owner",
    prompt: "Who decides what gets posted, and approves it?",
    options: [
      { id: "a", label: "One named person, and everyone knows it", weights: {} },
      { id: "b", label: "Whoever has time, or it depends on the week", weights: { coordination: 2, capacity: 1 } },
      { id: "c", label: "Several people or providers, each doing their own part", weights: { coordination: 3 } },
    ],
  },
  {
    id: "breakdown",
    prompt: "Where does it usually break down?",
    options: [
      { id: "a", label: "Finding the time to do it at all", weights: { capacity: 3 } },
      { id: "b", label: "Handoffs between people or providers", weights: { coordination: 2 } },
      { id: "c", label: "We post consistently, but it doesn't land", weights: { content: 3 } },
      { id: "d", label: "It runs fine; we just can't tell if it's working", weights: { measurement: 2 } },
    ],
  },
  {
    id: "measure",
    prompt: "What do you look at to judge whether it's working?",
    options: [
      { id: "a", label: "Enquiries, bookings or sales we can trace back to it", weights: {} },
      { id: "b", label: "Likes, followers and reach", weights: { measurement: 2 } },
      { id: "c", label: "Nothing, regularly", weights: { measurement: 3 } },
    ],
  },
  {
    id: "time",
    prompt: "How much of the owner's week does it take?",
    options: [
      { id: "a", label: "Very little; someone else has it handled", weights: {} },
      { id: "b", label: "A few hours, and it's a stretch", weights: { capacity: 2 } },
      { id: "c", label: "More than it should, and it crowds out other work", weights: { capacity: 3 } },
    ],
  },
  {
    id: "tried",
    prompt: "What have you already tried?",
    options: [
      { id: "a", label: "Nothing structured yet", weights: { foundation: 1 } },
      { id: "b", label: "Doing it ourselves", weights: { capacity: 1 } },
      { id: "c", label: "Freelancers or an agency, more than once", weights: { coordination: 1, direction: 1 } },
      { id: "d", label: "One provider, and it's mostly worked", weights: { content: 1 } },
    ],
  },
];

export type SignalAnswers = Record<string, string>;

export type SignalResult = {
  primary: SignalResultKey;
  /** A second area worth a look, when it scored strongly too. */
  secondary: SignalCategory | null;
  scores: Record<SignalCategory, number>;
};

/**
 * Upstream problems first: a foundation or direction gap makes every later
 * fix guesswork, so it wins a tie. Same order the method diagnoses in.
 */
const TIE_ORDER: readonly SignalCategory[] = SIGNAL_CATEGORIES;

/** Below this, nothing stands out enough to point at. */
const MIN_SIGNAL = 3;

export function isComplete(answers: SignalAnswers): boolean {
  return SIGNAL_QUESTIONS.every((q) => q.options.some((o) => o.id === answers[q.id]));
}

export function scoreSignalCheck(answers: SignalAnswers): SignalResult {
  const scores = Object.fromEntries(SIGNAL_CATEGORIES.map((c) => [c, 0])) as Record<
    SignalCategory,
    number
  >;

  for (const question of SIGNAL_QUESTIONS) {
    const option = question.options.find((o) => o.id === answers[question.id]);
    if (!option) continue;
    for (const [category, weight] of Object.entries(option.weights) as [SignalCategory, number][]) {
      scores[category] += weight;
    }
  }

  const ranked = [...TIE_ORDER].sort(
    (a, b) => scores[b] - scores[a] || TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b),
  );
  const [first, second] = ranked;

  if (scores[first] < MIN_SIGNAL) {
    return { primary: NO_CLEAR_SIGNAL, secondary: null, scores };
  }

  return {
    primary: first,
    secondary: scores[second] >= MIN_SIGNAL ? second : null,
    scores,
  };
}

/**
 * Compact, stable encoding for the inbox: "offer:b,purpose:c,…". Only known
 * question and option ids survive, so nothing free-form rides along.
 */
export function encodeAnswers(answers: SignalAnswers): string {
  return SIGNAL_QUESTIONS.filter((q) => q.options.some((o) => o.id === answers[q.id]))
    .map((q) => `${q.id}:${answers[q.id]}`)
    .join(",");
}

export function decodeAnswers(encoded: string): SignalAnswers {
  const answers: SignalAnswers = {};
  for (const pair of encoded.split(",")) {
    const [qid, oid] = pair.split(":");
    const question = SIGNAL_QUESTIONS.find((q) => q.id === qid);
    if (question && question.options.some((o) => o.id === oid)) answers[qid] = oid;
  }
  return answers;
}

/** Turns stored answers back into readable question-and-answer pairs. */
export function describeAnswers(encoded: string): Array<[question: string, answer: string]> {
  const answers = decodeAnswers(encoded);
  return SIGNAL_QUESTIONS.flatMap((q) => {
    const option = q.options.find((o) => o.id === answers[q.id]);
    return option ? [[q.prompt, option.label] as [string, string]] : [];
  });
}

export type SignalCopy = {
  title: string;
  summary: string;
  examine: readonly string[];
};

export const SIGNAL_COPY: Record<SignalResultKey, SignalCopy> = {
  foundation: {
    title: "Foundation",
    summary:
      "The offer or the customer it's for is still settling. Social media can only amplify what's already clear, so this tends to come before anything about posting.",
    examine: [
      "Which offer you most want more of, and who buys it today",
      "What existing customers say made them choose you",
      "Whether a simple, steady presence is enough while the offer settles",
    ],
  },
  direction: {
    title: "Direction",
    summary:
      "Social media hasn't been given a specific job. Without one, every post is a guess, and there's no way to tell good activity from busy activity.",
    examine: [
      "The one business result social media should support this quarter",
      "Which audience that result depends on",
      "What you'd stop doing if it doesn't serve that job",
    ],
  },
  coordination: {
    title: "Coordination",
    summary:
      "Nobody clearly owns the decisions, or several people and providers are each doing their own part. Work gets done; it just doesn't add up to one direction.",
    examine: [
      "Who decides, and who approves, in one sentence each",
      "Where work changes hands, and what gets lost there",
      "Whether everyone involved is working from the same brief",
    ],
  },
  capacity: {
    title: "Capacity",
    summary:
      "The work is landing on whoever has a spare hour, often the owner. The issue is less what to post than who can realistically keep it going.",
    examine: [
      "How many hours it takes now, and whose they are",
      "Which parts only you can do, and which could be handed off",
      "The smallest consistent rhythm you could actually sustain",
    ],
  },
  measurement: {
    title: "Measurement",
    summary:
      "There isn't a clear way to tell whether it's working. Reach and likes say something, but not whether social media is moving the business.",
    examine: [
      "Where enquiries and bookings actually come from today",
      "One or two numbers that would tell you it's working",
      "A simple monthly look-back you'd actually keep",
    ],
  },
  content: {
    title: "Content",
    summary:
      "The setup sounds sound and the posting is consistent, but it isn't landing. That usually points at what's being said, and to whom, more than how often.",
    examine: [
      "Which posts led to real conversations or enquiries",
      "Whether the content speaks to the customer you most want",
      "What a customer would need to hear to take the next step",
    ],
  },
  steady: {
    title: "No single area stands out",
    summary:
      "Your answers don't point clearly at one area. That's either good news, or a sign the real issue is more specific than seven questions can catch.",
    examine: [
      "What specifically made you take this check today",
      "What you'd most want to be different in three to six months",
    ],
  },
};
