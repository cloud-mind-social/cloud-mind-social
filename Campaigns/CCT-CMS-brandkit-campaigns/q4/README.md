# Q4 2026 · Laguna Starter Package campaign kit

**Prepared by:** Coastal Carolina Tech (CCT) for Cloud Mind Social · October 8, 2026
**Status:** Draft kit for Seul's review. **Nothing here is approved for printing, posting, ads or outreach** until Seul records approval for that specific asset (see [Approval gates](#approval-gates)).

A complete marketing kit for CMS's introductory **₱1,000 Starter Package**, aimed at owner-led businesses in Laguna and nearby towns during the Q4 Christmas season. It uses the locked CMS palette and typefaces ([Brand Guidelines §8–10](../../../CMS-Branding/CMS_Brand_Guidelines.md)) and the [Content Writing Standard](../../../CMS-Branding/CMS_Content_Writing_Standard.md).

**Before editing any copy, read the [voice notes](./04-social/captions.md#voice-notes-read-before-editing).** The first draft sounded like AI, and those notes record what changed and why.

## The offer

**₱1,000 · one platform · 30 days:** social media review, page optimization, content calendar, scheduling 30 days of content, static post creation, basic carousel creation, basic reel editing, caption writing, and engagement 10 minutes per day.

## What's in the kit

| Folder | Contents | Type |
|---|---|---|
| [01-strategy](./01-strategy/) | [Campaign brief](./01-strategy/campaign-brief.md): objective, audience, PH competitive climate, pricing check, positioning, Q4 timing, channels, proof plan, open decisions · [Competitive positioning + objection handling](./01-strategy/competitive-positioning.md) | Internal |
| [02-offer](./02-offer/) | **Offer sheet** (A4 PDF + PNG) · [Scope and terms](./02-offer/offer-terms.md) (quantities to confirm) | Client-facing / internal |
| [03-print](./03-print/) | **A4 flyer** · **3×2 ft tarpaulin** · **calling card** (front/back, 3.5×2 in), each as PDF + PNG | Print |
| [04-social](./04-social/) | 6 feed posts (4:5) · 7-slide carousel · 3 stories (9:16) · square ad · Facebook cover → [exports](./04-social/exports/) · [Captions](./04-social/captions.md) (English + Taglish) · [Reel/TikTok scripts](./04-social/reel-scripts.md) · [Meta ads plan](./04-social/ads.md) | Social |
| [05-outreach](./05-outreach/) | [Messenger auto-replies + FAQ](./05-outreach/messenger-scripts.md) · [Walk-in, partner, bazaar, referral, email](./05-outreach/walk-in-and-referral.md) · [Laguna Facebook groups](./05-outreach/community-groups.md) | Scripts |
| [06-calendar](./06-calendar/) | [Q4 calendar Oct 19–Dec 31](./06-calendar/q4-campaign-calendar.md) + [CSV](./06-calendar/q4-campaign-calendar.csv) for the Google Sheet | Plan |
| [07-landing](./07-landing/) | [Landing page draft](./07-landing/starter-package.html) (standalone HTML; not deployed, does not touch `www/`) | Web |
| [08-sales](./08-sales/) | [Discovery questions, intake, proof permission, onboarding checklist, day-30 wrap-up](./08-sales/discovery-and-intake.md) (blank template) | Sales ops |
| [_design](./_design/) | Shared brand tokens, social canvas styles, render script | Source |

## Editing and re-rendering

All print and social graphics are HTML sources. Edit the copy in the `.html` file, then re-render from the repository root:

```bash
NODE_PATH=/path/to/node_modules node Campaigns/CCT-CMS-brandkit-campaigns/q4/_design/render.mjs
```

It needs Playwright and internet access for Google Fonts (Fraunces, Inter, Space Mono). It prints `OVERFLOW` if any page or canvas spills; fix before using. The files can also be rebuilt in Canva from the PNGs using the Brand Kit.

## Approval gates

| Gate | Owner | Status |
|---|---|---|
| ₱1,000 price as a first-cycle introductory price; month-two price | Seul | Open |
| Quantities and limits in [offer-terms.md](./02-offer/offer-terms.md) | Seul | Open |
| Running on the main CMS pages vs ads/groups/print only ([brief §3](./01-strategy/campaign-brief.md#3-where-this-sits-in-cms-strategy)) | Seul | Open |
| Copy and voice review, including Taglish read-aloud | Seul / native-speaker reviewer | Open |
| Each asset's release (print, post, ad, outreach) | Seul | Open |
| Logo: drafts use the ink/coral icon test variants and plain brand text; final master still open (Guidelines §12) | Seul | Open |
| Base town for "based in Laguna" wording; payment methods; Messenger/phone to print | Seul | Open |

## Guardrails used throughout

- No invented clients, testimonials, results, statistics or photos of people presented as CMS staff or clients.
- No "best", "No. 1" or guaranteed outcomes. Scope, including exclusions, is always stated.
- Laguna/PH work is a separate secondary-market track; it does not change the Western ICP or the October 120-slot plan.
- Completed client intakes and permissions go to the private clients repository, never this public repo.
- `_agent-hq/` was not updated (no HQ action was requested).
