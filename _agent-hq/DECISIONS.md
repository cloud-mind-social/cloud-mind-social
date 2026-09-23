# Decisions Log

Append-only record of decisions made during this project and why — so
nobody re-litigates something that was already settled, and so the
reasoning isn't lost when it's not obvious from the repo alone.

Entry format:
```markdown
## YYYY-MM-DD — <short decision title>
**Why:** the reasoning
**Revisit when:** the condition under which this should be reconsidered (if any)
```

---

## 2026-09-03 — Phase 1 (Strategic Foundation) approved
**Why:** Approved by Seul Yekha as the strategic foundation before content development begins.
**Revisit when:** Not expected to be revisited; treat as locked. See `Social-Media-Structure/PHASE 1 Approved by Seul Yekha.md`.

## 2026-09-05 — Phase 2 Audience Strategy (Parts 1 & 2) approved & locked
**Why:** Audience strategy and the supporting evidence base (53 classified items across 4 research tracks) were finalized and approved by Seul Yekha.
**Revisit when:** Not expected to be revisited; treat as locked. Note: the master task checklist was never updated to reflect this — don't mistake unchecked boxes there for unfinished work.

## 2026-09-13 — Tagline decision deferred
**Why:** Two candidates still under consideration ("We build the bridge
from unknown to impact." vs "From unknown to unforgettable."); visual
identity work depends on this being final.
**Revisit when:** Brand/strategy owner makes a call.

## 2026-09-14 — www/ folder placed off-limits to AI sessions by default
**Why:** This project's active work is Brand & Strategy; the website/admin
app involves live infrastructure (Cloudflare D1, email sending, secrets)
that shouldn't be touched incidentally by an AI working on marketing tasks.
**Revisit when:** The user explicitly reopens the Engineering track for a
specific session.

## 2026-09-14 — A6 research file located (was temporarily missing from the working copy)
**Why:** Earlier review flagged Track A6 as apparently missing (A7 referenced "Track A1–A6" but no file was present). It turned out to just not have been uploaded yet — Track-A6-Strategy-vs-Execution-Market-Gap.md was added Sept 14 and is now confirmed in the repo, dated to Sept 13 research. No content needs to be reconstructed.
**Revisit when:** N/A — resolved. Note for future reference: it carries the same "Draft for review, not yet merged into Phase 2" status as A1–A5 and A7, so the whole A-series is still pending formal review as a batch.


## 2026-09-17 — Phase 2.5.2 first buyer architecture approved
**Why:** The Western growth-stage, owner-led expertise and high-value service business remains CMS's primary commercial beachhead. Western early-stage owner-operators are added as a secondary development ICP because CMS can provide right-sized strategic guidance early, grow with those owners, and develop future partnership and referral relationships. The Philippine audience remains a separate secondary geographic market.
**Revisit when:** Live validation shows that the early-stage relationship model is commercially unsuitable, or a different buyer cohort produces stronger conversion, delivery, proof, and partnership results. See Social-Media-Structure/PHASE_2.5.2_First_Buyer_Architecture_Approved_Direction.md.


## 2026-09-17 — Phase 2.5.5 hook offer and lead generation architecture approved
**Why:** CMS needs a lead path that reflects diagnosis before prescription, business before content, and right-sized help. One diagnostic ladder creates a coherent path from recognition to conversation to paid engagement without turning CMS into a generic posting-volume agency or an open-ended free consultancy. The approved ladder is Social Signal Check for ToFu, Signal-to-Strategy Review for MoFu, and Social Clarity Intensive for BoFu, followed by an appropriately scoped strategy or execution engagement.
**Revisit when:** Live hook testing shows a different entry sequence produces stronger qualified conversations, paid diagnostic acceptance, delivery fit, or retention. See Social-Media-Structure/PHASE_2.5.5_Hook_Offer_and_Lead_Generation_Architecture.md.


## 2026-09-17 — À La Carte service structure approved as working direction
**Why:** À La Carte services give prospects a finite, low-commitment way to try CMS while preserving the distinction between execution, management, strategy, and strategic partnership. Approved examples include Reels, carousels, infographics, static posts, captions, repurposing, profile optimization, limited social branding direction, scheduling-only, limited community management, analytics reports, content calendars, and bounded diagnostic services. Full social media management, full branding, ongoing strategy, continuous optimization, and growth leadership remain in the core service-depth tiers.
**Revisit when:** Phase 2.5.6 pricing and scope decisions are finalized, or live sales and delivery data show that a service should be removed, re-scoped, bundled, or moved into a deeper tier. The current menu must be treated as updateable until then. See Social-Media-Structure/PHASE_2.5.5_Hook_Offer_and_Lead_Generation_Architecture.md.


## 2026-09-17 — Phase 2.5 phase attribution corrected
**Why:** The hook and lead-generation ladder belongs to Phase 2.5.5. The À La Carte service menu, service-depth boundaries, and pricing architecture developed after that file was created belong to Phase 2.5.6. This correction keeps the source-of-truth sequence clear.
**Revisit when:** N/A; this is a record correction. Phase 2.5.6 remains updateable until figures and scope are finalized.

## 2026-09-17 — Phase 2.5.6 offer and pricing architecture working draft created
**Why:** The approved CMS hook ladder now needs a commercial offer structure that distinguishes finite À La Carte services from Presence, Momentum, Authority, and Growth Partner engagements. The working draft uses the repository's Pricing Rate Research and Target Market Research as directional inputs while preserving Western-first pricing, separate Philippine reference ranges, diagnosis before prescription, and no generic posting-volume positioning.
**Revisit when:** Figures, scope, qualification, capacity, and margin are finalized through pricing approval and paid pilot evidence. See Social-Media-Structure/PHASE_2.5.6_Offer_and_Pricing_Architecture.md.


## 2026-09-22 — Phase 3.1–3.9 planning architecture synchronized
**Why:** The current repository records Phase 3.1 through Phase 3.9 as the planning and documentation system for evidence, brand alignment, methodology, offer routing, messaging, proof governance, visual implementation, website and conversion architecture, and social operating controls. These documents preserve the approved ICP, commercial guardrails, evidence limits, and explicit assumptions; they do not authorize production, publication, account activation, live conversion claims, or whole-Phase-3 closure.
**Revisit when:** Phase 3.10 Measurement and Validation is developed and the owner makes the formal Phase 3 readiness decision.

## 2026-09-22 — Canonical CMS repository moved to the organization
**Why:** The active repository is now `https://github.com/cloud-mind-social/cloud-mind-social`. Agent HQ references should use this organization URL. The CMS public repository remains separate from the initially planned private client-work repository.
**Revisit when:** Repository ownership, visibility, or client-work access requirements change.

## 2026-09-22 — Content writing rule remains content-scoped
**Why:** The proposed real-person writing rule applies to audience-facing content only. Strategy, research, brand foundation, phase documents, governance, briefs, proposals, reports, and Agent HQ files retain their structured formats. The content standard file, draft-post deletion, and pointer-edit batch remain unexecuted until separately authorized.
**Revisit when:** Content/ is formally opened and the owner authorizes that batch.


## 2026-09-22 — Tagline approved
**Why:** The approved CMS tagline is “We build the bridge from unknown to impact.” The README status and candidate section must reflect the owner's decision rather than continue showing the tagline as pending.
**Revisit when:** The brand owner explicitly reopens the tagline decision.

## 2026-09-22 — CMS access roster and developer boundaries clarified
**Why:** CMS repository collaboration is limited to the Elli, Seul, and Merille access identities. Developer-owned work is outside this plan. Exact permissions, labels, and path ownership remain undecided until the owner completes the access discussion.
**Revisit when:** The owner confirms exact GitHub usernames, permissions, and any required labeling model.

## 2026-09-22 — .github/workflows/ placed under no-touch boundaries
**Why:** Workflow changes can affect repository automation and deployment behavior. The folder may be viewed read-only when necessary, but it must not be edited, run, deployed, reorganized, or otherwise modified unless the user explicitly reopens it.
**Revisit when:** The user explicitly reopens .github/workflows/ for a specific session.


## 2026-09-22; Batch 1 correction and consolidated owner decisions

Recorded from Seul's decisions; this does not claim new settings or live validation.

| # | Decision | Approved direction |
|---|---|---|
| 1 | Repository visibility | CMS remains public; client work is private. |
| 2 | Locked brand phrases | Identity only; meaning-preserving content paraphrases allowed, with no formulaic slogan skeleton. |
| 3 | Task tracker | Keep the Strategy Task List authoritative; HQ TASKS supplies pointers. |
| 4 | Phase 3 status | Planning and documentation open under explicit assumptions; production and publication separately gated. |
| 5 | Tagline | Approved by Seul: “We build the bridge from unknown to impact.” |
| 6 | Handoffs | Timestamped handoffs plus a latest pointer; no automatic HQ writes. |
| 7 | Pull requests | Required for locked and approved files; working drafts may go directly to main when authorized. |
| 8 | Track A review | Seul reviews all ten with AI-prepared notes. Track A1–A10 findings are approved by Seul as evidence input; review notes are a separate pending task. |
| 9 | Renames | Rename existing files and update active references together in a dedicated batch. |
| 10 | Client repositories | One private clients repository initially; split when access requirements differ. |
| 11 | AI authorship | Use the [AI-assisted] commit prefix only; no required coauthor marker or initials. |

**Educational-content scope:** The content writing standard includes educational posts, carousels, scripts, articles, and newsletters for CMS and client brands. Calling content educational does not exempt it. Separately scoped utility assets and internal strategy, research, governance, brand foundation, briefs, proposals, reports, and Agent HQ retain structured formats. Locked phrases remain valid identity; meaning-preserving paraphrases may be used in content without making slogans its structural skeleton.

**Phase 3 adjustment priority:** Agreed future Phase 3 adjustment order: 3.3 + 3.5 first; 3.8 + 3.9 second; 3.6 + 3.7 third; 3.1 + 3.2 + 3.4 last. This records the sequence only; those source-file adjustments require the later authorized batch.

**Protected folders:** The entire `.github/` folder, including `.github/workflows/`, is off-limits for edits, creation, deletion, renaming, reorganization, workflow dispatch, or deployment. Read-only viewing is allowed when necessary unless the user prohibits it. `www/` and `webmail/` remain off-limits even for reading. Changes require explicit reopening for the specific session.

**Roster clarification:** Elli, Seul, Merille are the CMS planning roster; exact account mappings, roles and permissions are not inferred or changed. Ownership labels remain deferred. This replaces any implication that the plan revokes other existing access.

**Actual outcome:** PR #17 merged but implemented only part of Batch 1. Its completion claim was too broad. This follow-up prepares the missing source and closeout corrections for PR review; main is not updated by preparation alone. Track A approval is recorded without inventing completed review notes or validation.

**Revisit when:** Seul changes a decision, explicitly reopens a protected area, or live evidence requires reconsideration.


## 2026-09-22T13:26:54.487Z; Batch 2 content standard adopted

Seul approved the complete proposed standard with A, B and C combined as **Grounded human perspective**: documented grounding, an internally accountable human with appropriate public attribution, and natural expression without formulaic construction. Educational content is covered; research may originate ideas without becoming fabricated firsthand experience. Locked identity remains intact and meaning-preserving paraphrasing remains allowed. Blank intake templates and scoped pointers are authorized. Production and publication remain gated.

**Revisit when:** Seul changes scope or review experience exposes ambiguity.

## 2026-09-22T13:26:54.487Z; Premature drafts retired in Batch 2 branch

The implementation removes exactly:
- `Social-Media-Structure/CMS_First_Posts_Pilot.md`
- `Social-Media-Structure/CMS_First_Introduction_Posts.md`
- `Social-Media-Structure/CMS_Carousel_Post_Ideas_Phase1.md`

Deletion takes effect on main only after PR merge. Historical records remain; no replacement content is created. PR #18 is merged, completing the Batch 1 correction. Batch 2 implementation is prepared for review; no merge is claimed.

**Revisit when:** Content production is explicitly opened; do not restore retired drafts as approved source material.


## 2026-09-22T13:43:10.255Z; Batch 3 scoped Phase 3 alignment

Seul authorized Batch 3. Apply the approved content standard in order: 3.3 + 3.5; 3.8 + 3.9; 3.6 + 3.7; 3.1 + 3.2 + 3.4. Grounded human perspective governs source grounding, accountability and natural expression, including educational content. Strategic frameworks stay internal; source/voice brief fields, Gate 4 review, attribution and per-version adaptation review are required. Flexible templates must not impose repeated writing structures.

Preserve approved ICP, offers, pricing, pillars, identity and evidence limits. Batch 3 writing-standard alignment prepared for PR review; merge pending. Batch 2 PR #19 is confirmed merged. No production, publication, activation or Phase 3 completion is authorized.

**Revisit when:** Seul reopens the standard or evidence identifies a specific conflict. Later batches require separate authorization.


## 2026-09-23T01:57:44.914Z; Batch 4 filename mapping and historical-path correction

Seul authorized the dedicated rename batch. The seven current file paths below supersede earlier paths when this PR merges. Earlier logs, decisions and archived handoffs preserve the names in use at their dates; those mentions are historical, not active links.

| Historical path | Current path after merge |
|---|---|
| `Social-Media-Structure/PHASE 1 Approved by Seul Yekha.md` | `Social-Media-Structure/PHASE_1_Strategic_Foundation.md` |
| `Social-Media-Structure/PHASE 2 Audience Strategy Part 1 Approved by Seul Yekha.md` | `Social-Media-Structure/PHASE_2_Audience_Strategy_Part_1.md` |
| `Social-Media-Structure/PHASE 2 Audience Strategy Part 2 — Audience Intelligence & Evidence Research Presentation.md` | `Social-Media-Structure/PHASE_2_Audience_Strategy_Part_2.md` |
| `Social-Media-Structure/Platform Research.md` | `Social-Media-Structure/Platform_Research.md` |
| `Social-Media-Structure/Phase-2.5/PHASE_2.5.2_First_Buyer_Architecture_Approved_Direction.md` | `Social-Media-Structure/Phase-2.5/PHASE_2.5.2_First_Buyer_Architecture.md` |
| `CMS-Branding/CMS_Brand_Guidelines_v0.1.md` | `CMS-Branding/CMS_Brand_Guidelines.md` |
| `CMS-Branding/CMS_Brand_Kit_Field_Guide_v0.2.md` | `CMS-Branding/CMS_Brand_Kit_Field_Guide.md` |

No approved strategic or research content is reopened. The Brand Guidelines remain the central application guide and the Field Guide remains its Canva companion; those roles were consolidated in merged PR #21. No developer review requirement applies to this scoped PR. External bookmarks must be updated after merge.

**Revisit when:** A remaining active repository reference to a renamed path is found or Seul authorizes another naming decision.
