# Multi-account collaboration protocol; review handoff

**Prepared:** 2026-10-17; Asia/Manila  
**Track:** Brand & Strategy; Agent HQ governance  
**Authorization:** Merille requested an Agent HQ update and a reusable project instruction for collaboration with other ChatGPT accounts or Claude. This account is to act as main commander and prepare prompts for tasks that Merille branches out to other chats.  
**Branch:** `cms/multi-account-merille-commander-2026-10-17`  
**Status:** Proposed; not integrated into `main` until the review PR is merged.

## Outcome

Created `_agent-hq/MULTI_ACCOUNT_COLLABORATION.md` as a reusable operating protocol. It defines:

- Merille Nacino / Seul as task commander and owner approver.
- The main commander account’s responsibility to check canonical sources, prepare self-contained delegation prompts, review returned work, and integrate only authorized changes.
- Delegated accounts as scoped contributors, not independent CMS authorities.
- Source precedence, exact-version approvals, brand and evidence rules, access boundaries, and honest reporting of contribution and tool outcomes.
- A standardized prompt package and a factual return handoff.
- A workflow for Merille to request ready-to-paste prompts without repeatedly restating context already recorded in Agent HQ.

Linked the protocol from `START_HERE.md`, `AI_PROJECT_INSTRUCTIONS.md`, `STATUS.md`, and `TASKS.md`; appended the governance decision and session record.

## Controls and limits

This governance change does not itself grant any account repository, Drive, Canva, or platform access. Permissions do not transfer across ChatGPT accounts or Claude. It does not authorize publishing, deployment, client contact, permission changes, protected-folder access, or any new client/marketing approval. Existing CMS source authority and exact-version approval rules remain unchanged.

No client repositories, Drive assets, Canva designs, live posts, or protected technical files were changed. Review and merge are separate from branch creation and file commits.

## Verification to complete

- Confirm all changed paths exist on the review branch.
- Confirm the protocol links resolve relative to the `_agent-hq` folder.
- Review the PR diff and merge only if the proposed governance wording is accepted.
- After merge, verify the merged state before treating this protocol as canonical.

## Next action

Review the PR for `cms/multi-account-merille-commander-2026-10-17`. Once merged, use the protocol to generate task-specific prompts in the main commander chat.


## Amendment; 2026-10-18

**DATE-TIME-MDS: 2026-10-18 09:08 Asia/Manila — Expanded the collaborator protocol with a discovery-first workflow, task checklist, limitations and alternatives, batch sizing, validation, main-commander-only Agent HQ update request, and required activity stamp.**

The protocol now instructs collaborators to read the full task prompt first, enter through Agent HQ's documented reading order, scan only the relevant repository evidence, map findings to the task, create a checklist, state access/evidence/tool limitations and practical alternatives, execute all at once only when reasonably small or one checkpoint at a time when heavy, and validate against acceptance criteria. Every handoff must include a ready-to-use proposed Agent HQ update section; only the main commander applies changes to canonical Agent HQ. The required activity stamp is `DATE-TIME-MDS: YYYY-MM-DD HH:mm Asia/Manila — [report what you did here]`.
