import { test } from "node:test";
import assert from "node:assert/strict";

import { cleanLandingPath, cleanReferrer, parseInquiry } from "./validation.ts";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const contact = { name: "Ada Owner", business: "Harbor Bakery", email: "Ada@Example.com" };

test("a missing or unknown route is rejected", () => {
  assert.ok(parseInquiry(form(contact)).errors.route);
  assert.ok(parseInquiry(form({ ...contact, route: "conversation" })).errors.route);
});

test("review requires stage and situation", () => {
  const { errors, data } = parseInquiry(form({ ...contact, route: "review" }));
  assert.equal(data, undefined);
  assert.ok(errors.stage);
  assert.ok(errors.message);
  assert.equal(errors.decision, undefined);
});

test("a valid review parses and lowercases the email", () => {
  const { errors, data } = parseInquiry(
    form({
      ...contact,
      route: "review",
      stage: "Posting, but not consistent",
      message: "We post weekly and nothing comes of it.",
    }),
  );
  assert.deepEqual(errors, {});
  assert.equal(data?.route, "review");
  assert.equal(data?.email, "ada@example.com");
  assert.equal(data?.decision, null);
});

test("choice fields must be one of the listed options", () => {
  const { errors } = parseInquiry(
    form({ ...contact, route: "review", stage: "Something else", message: "x" }),
  );
  assert.ok(errors.stage);
});

test("intensive requires role, stage and decision", () => {
  const { errors } = parseInquiry(form({ ...contact, route: "intensive", message: "x" }));
  assert.ok(errors.role);
  assert.ok(errors.stage);
  assert.ok(errors.decision);
});

test("fields a route doesn't ask for are ignored", () => {
  const { data } = parseInquiry(
    form({
      ...contact,
      route: "scoped",
      message: "A refresh of our profile graphics.",
      decision: "should not be kept",
      role: "Owner or founder",
    }),
  );
  assert.equal(data?.decision, null);
  assert.equal(data?.role, null);
  assert.equal(data?.stage, "");
});

test("over-long text is rejected", () => {
  const { errors } = parseInquiry(
    form({ ...contact, route: "scoped", message: "x".repeat(4001) }),
  );
  assert.ok(errors.message);
});

test("Signal Check data rides along on a review only, as known ids", () => {
  const base = {
    ...contact,
    stage: "Just getting started",
    message: "Following up on my check.",
    signal_category: "capacity",
    signal_answers: "offer:a,time:c,evil:x",
  };
  const review = parseInquiry(form({ ...base, route: "review" })).data;
  assert.equal(review?.signalCategory, "capacity");
  assert.equal(review?.signalAnswers, "offer:a,time:c");

  const scoped = parseInquiry(form({ ...base, route: "scoped" })).data;
  assert.equal(scoped?.signalCategory, null);
  assert.equal(scoped?.signalAnswers, null);

  const bad = parseInquiry(form({ ...base, route: "review", signal_category: "nope" })).data;
  assert.equal(bad?.signalCategory, null);
});

test("attribution is cleaned", () => {
  const { data } = parseInquiry(
    form({
      ...contact,
      route: "scoped",
      message: "x",
      utm_source: "linkedin\u0000",
      utm_campaign: "a".repeat(500),
      referrer: "https://www.example.com/post/1?token=secret#frag",
      landing_path: "/?utm_source=linkedin",
    }),
  );
  assert.equal(data?.attribution.utmSource, "linkedin");
  assert.equal(data?.attribution.utmCampaign?.length, 120);
  assert.equal(data?.attribution.utmMedium, null);
  assert.equal(data?.attribution.referrer, "https://www.example.com/post/1");
  assert.equal(data?.attribution.landingPath, "/");
});

test("cleanReferrer and cleanLandingPath reject what they can't trust", () => {
  assert.equal(cleanReferrer("javascript:alert(1)"), null);
  assert.equal(cleanReferrer("not a url"), null);
  assert.equal(cleanLandingPath("//evil.example/path"), null);
  assert.equal(cleanLandingPath("https://evil.example/"), null);
  assert.equal(cleanLandingPath("/paths#faq"), "/paths");
});
