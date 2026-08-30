export const nav = [
  { label: "How we think", href: "#diagnosis" },
  { label: "Paths", href: "#paths" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "FAQ", href: "#faq" },
];

export const processSteps = [
  {
    n: "01",
    title: "A conversation, not a pitch",
    body: "Where the business actually stands right now, described in plain terms. No slide deck.",
  },
  {
    n: "02",
    title: "A real diagnosis",
    body: "What's working, what isn't, and why — looked at before anything gets recommended.",
  },
  {
    n: "03",
    title: "A scope built for this business",
    body: "Sized to the budget and stage in front of us, not picked off a tier list.",
  },
  {
    n: "04",
    title: "Named specialists",
    body: "Whoever does the work is who you talk to about it — not a rotating account team.",
  },
  {
    n: "05",
    title: "Reporting that includes what didn't work",
    body: "And a straight answer on whether it's time to add more, or leave it alone.",
  },
] as const;

export const diagnosisExample = {
  label: "Illustrative example — not an actual client",
  situation:
    "A three-person skincare studio, steady word-of-mouth clients, posting on Instagram whenever someone has a spare hour.",
  reality:
    "The inconsistent posting isn't the actual problem. Nothing being posted is tied to what fills the appointment book — reach looks fine, bookings don't move.",
  recommendNow:
    "A monthly content system built around the services that already sell in person, plus someone reading and answering DMs and comments — that's usually where bookings start.",
  recommendLater:
    "A full brand overhaul, or paid ads. There's no signal yet on what messaging works organically, and spending to amplify a guess is how a budget disappears.",
};

export type ServicePath = {
  index: string;
  name: string;
  description: string;
  examples: string[];
  billing: string;
};

export const servicePaths: ServicePath[] = [
  {
    index: "01",
    name: "Content & Execution",
    description:
      "Content made and delivered on schedule — reels, carousels, captions, graphics — without hiring someone to manage it.",
    examples: [
      "Reel & carousel production",
      "Caption & hashtag sets",
      "Story graphics",
      "Photo retouching",
      "Content repurposing",
      "Thumbnail design",
    ],
    billing: "Priced per deliverable",
  },
  {
    index: "02",
    name: "Managed Presence",
    description:
      "Strategy, content, posting, and reporting run as one system every month, without needing to be managed.",
    examples: [
      "Content calendar & production",
      "Community management",
      "Monthly performance reporting",
      "UGC collection & curation",
      "Cross-platform repurposing",
      "Seasonal campaign creative",
    ],
    billing: "Monthly package",
  },
  {
    index: "03",
    name: "Strategy & Growth",
    description:
      "Positioning, campaigns, and the systems to prove what's working — for a business past 'just post consistently.'",
    examples: [
      "Brand voice & pillar strategy",
      "Audience & persona mapping",
      "Paid social strategy & management",
      "Brand style guide",
      "Analytics dashboards",
      "Campaign copywriting",
    ],
    billing: "Project fee, scoped to the engagement",
  },
  {
    index: "04",
    name: "Strategic Partnership",
    description:
      "Ongoing leadership across every channel, for a founder who needs someone thinking about the whole business, not just the feed.",
    examples: [
      "Fractional marketing leadership",
      "Multi-channel growth strategy",
      "Brand identity systems",
      "Specialist team oversight",
      "Launch management",
      "Investor & board reporting",
    ],
    billing: "Ongoing retainer",
  },
];

export const capabilityGroups = [
  {
    label: "Content production",
    items: [
      "Reels & short-form video",
      "Carousel & static design",
      "Photo & product imagery",
      "Story graphics",
      "Motion & thumbnail design",
      "Podcast clipping",
    ],
  },
  {
    label: "Brand & strategy documents",
    items: [
      "Brand style guides & brand books",
      "Competitor & SWOT audits",
      "Persona & journey mapping",
      "Performance & QBR reports",
      "Case studies",
      "SOPs & playbooks",
    ],
  },
  {
    label: "Promotional & ad visuals",
    items: [
      "Product & lifestyle photography direction",
      "Ad creative & A/B variant sets",
      "Seasonal & launch campaigns",
      "Testimonial & carousel ad design",
    ],
  },
  {
    label: "Growth & paid systems",
    items: [
      "Paid social strategy & management",
      "Email funnels & sequences",
      "Landing pages & conversion paths",
      "Local SEO & review management",
    ],
  },
  {
    label: "Leadership & operations",
    items: [
      "Fractional marketing leadership",
      "Specialist team oversight",
      "Launch & program management",
      "Growth systems architecture",
    ],
  },
] as const;

export const commitments = [
  {
    n: "01",
    title: "Right-sized, not resized to fit a package",
    body: "If a smaller scope is the honest answer, that's what gets recommended — even later, once the business changes and needs more or less.",
  },
  {
    n: "02",
    title: "Named specialists, not a rotating pool",
    body: "Work goes to someone chosen for that specific task, and it stays with them — not reassigned to whoever's free that week.",
  },
  {
    n: "03",
    title: "Diagnosis before any pitch",
    body: "Nothing gets recommended on the first call. That comes after the business has actually been looked at.",
  },
  {
    n: "04",
    title: "A system, not one person",
    body: "The network exists so one specialist becoming unavailable doesn't end the relationship.",
  },
] as const;

export const faqs = [
  {
    q: "Why not just do this myself?",
    a: "Plenty of businesses do, for a while. What shows up later is the cost of the time it took to get good at it — this exists to skip that part.",
  },
  {
    q: "How do I know you won't disappear after onboarding?",
    a: "There's a reporting cadence built into every engagement, and it runs for as long as the work does. That's the actual answer, not a policy on paper.",
  },
  {
    q: "Will this feel generic, or do you actually get my business?",
    a: "The diagnosis happens before any recommendation, and the specialists on an account are matched to that specific work, not assigned out of a template.",
  },
  {
    q: "What if my budget is limited right now?",
    a: "Say so on the first call. Right-sized means starting with what makes sense today, not the largest package on offer.",
  },
  {
    q: "Will this feel like a relationship, or just a transaction?",
    a: "The people on an account are named specialists, not a rotating team. That's what makes the difference — not a tone of voice.",
  },
] as const;

export const journeyStages = [
  "Just getting started",
  "Posting, but not consistent",
  "Consistent, but not growing",
  "Ready to scale with a partner",
] as const;
