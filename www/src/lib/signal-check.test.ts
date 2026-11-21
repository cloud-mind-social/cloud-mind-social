import { test } from "node:test";
import assert from "node:assert/strict";

import {
  NO_CLEAR_SIGNAL,
  SIGNAL_COPY,
  SIGNAL_CATEGORIES,
  SIGNAL_QUESTIONS,
  decodeAnswers,
  describeAnswers,
  encodeAnswers,
  isComplete,
  isSignalResultKey,
  scoreSignalCheck,
} from "./signal-check.ts";

const allA = Object.fromEntries(SIGNAL_QUESTIONS.map((q) => [q.id, "a"]));
/** A business where social media mostly works: "it runs fine", one provider. */
const healthy = { ...allA, breakdown: "d", tried: "d" };

test("there are seven questions, each with unique option ids", () => {
  assert.equal(SIGNAL_QUESTIONS.length, 7);
  for (const q of SIGNAL_QUESTIONS) {
    const ids = q.options.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, q.id);
  }
});

test("every result key has copy", () => {
  for (const key of [...SIGNAL_CATEGORIES, NO_CLEAR_SIGNAL]) {
    assert.ok(SIGNAL_COPY[key].title, key);
    assert.ok(SIGNAL_COPY[key].examine.length > 0, key);
  }
});

test("isComplete needs a known option for every question", () => {
  assert.equal(isComplete(allA), true);
  assert.equal(isComplete({ ...allA, offer: "z" }), false);
  const missing: Record<string, string> = { ...allA };
  delete missing.offer;
  assert.equal(isComplete(missing), false);
});

test("a healthy set of answers points at nothing in particular", () => {
  const result = scoreSignalCheck(healthy);
  assert.equal(result.primary, NO_CLEAR_SIGNAL);
  assert.equal(result.secondary, null);
});

test("a capacity-heavy set points at capacity", () => {
  const result = scoreSignalCheck({ ...healthy, breakdown: "a", time: "c" });
  assert.equal(result.primary, "capacity");
  assert.equal(result.scores.capacity, 6);
});

test("a strong second area is surfaced as secondary", () => {
  const result = scoreSignalCheck({ ...healthy, purpose: "c", owner: "c" });
  assert.equal(result.primary, "direction");
  assert.equal(result.secondary, "coordination");
});

test("ties go to the more upstream area", () => {
  // foundation 3 (offer c) vs measurement 3 (measure c); coordination 2 stays below
  const result = scoreSignalCheck({ ...healthy, offer: "c", measure: "c", breakdown: "b" });
  assert.equal(result.primary, "foundation");
  assert.equal(result.secondary, "measurement");
});

test("encodeAnswers keeps known ids only, in question order", () => {
  const encoded = encodeAnswers({ time: "b", offer: "c", nonsense: "x", purpose: "zz" });
  assert.equal(encoded, "offer:c,time:b");
});

test("decodeAnswers drops unknown questions and options", () => {
  assert.deepEqual(decodeAnswers("offer:c,purpose:zz,evil:<b>,time:b"), {
    offer: "c",
    time: "b",
  });
  assert.deepEqual(decodeAnswers(""), {});
});

test("round trip and description", () => {
  const encoded = encodeAnswers(allA);
  assert.deepEqual(decodeAnswers(encoded), allA);
  assert.equal(describeAnswers(encoded).length, 7);
});

test("isSignalResultKey", () => {
  assert.equal(isSignalResultKey("capacity"), true);
  assert.equal(isSignalResultKey("steady"), true);
  assert.equal(isSignalResultKey("anything"), false);
});
