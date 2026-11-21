-- Entry routes, progressive qualification and accountable follow-up.
--
-- Phase 3.8's first release replaces the single discovery-call form with
-- three alternative routes, and asks every captured lead to carry its route,
-- the context it supplied, where it came from, a qualification outcome, an
-- owner, and a next action with a due date.
--
-- Every column is additive. Existing rows become route 'conversation' (the
-- earlier single form) and qualification 'unreviewed'; nothing is rewritten.

-- Which route the request came through: review | intensive | scoped | conversation
ALTER TABLE inquiries ADD COLUMN route TEXT NOT NULL DEFAULT 'conversation';

-- Progressive qualification. All optional at the database level; which ones
-- a route requires is enforced by the form's validation.
ALTER TABLE inquiries ADD COLUMN profile     TEXT;  -- website or social profile
ALTER TABLE inquiries ADD COLUMN role        TEXT;  -- decision authority
ALTER TABLE inquiries ADD COLUMN consequence TEXT;  -- what it's costing them
ALTER TABLE inquiries ADD COLUMN why_now     TEXT;  -- the trigger, in their words
ALTER TABLE inquiries ADD COLUMN decision    TEXT;  -- Intensive: the decision in front of them
ALTER TABLE inquiries ADD COLUMN timing      TEXT;  -- readiness

-- A Social Signal Check result the visitor chose to send with a review.
ALTER TABLE inquiries ADD COLUMN signal_category TEXT;
ALTER TABLE inquiries ADD COLUMN signal_answers  TEXT;  -- "offer:b,purpose:c,…"

-- Source, when the browser supplied it. Referrer is origin + path only.
ALTER TABLE inquiries ADD COLUMN utm_source   TEXT;
ALTER TABLE inquiries ADD COLUMN utm_medium   TEXT;
ALTER TABLE inquiries ADD COLUMN utm_campaign TEXT;
ALTER TABLE inquiries ADD COLUMN utm_content  TEXT;
ALTER TABLE inquiries ADD COLUMN referrer     TEXT;
ALTER TABLE inquiries ADD COLUMN landing_path TEXT;

-- Follow-up, set by a person in the inbox.
-- unreviewed | diagnostic | nurture | foundation | a-la-carte | deferred | declined | no-response
ALTER TABLE inquiries ADD COLUMN qualification TEXT NOT NULL DEFAULT 'unreviewed';
ALTER TABLE inquiries ADD COLUMN owner           TEXT;
ALTER TABLE inquiries ADD COLUMN next_action     TEXT;
ALTER TABLE inquiries ADD COLUMN next_action_due TEXT;  -- YYYY-MM-DD
ALTER TABLE inquiries ADD COLUMN follow_up_updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_inquiries_route ON inquiries(route, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_due   ON inquiries(next_action_due);
