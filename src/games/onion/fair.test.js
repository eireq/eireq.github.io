import test from "node:test";
import assert from "node:assert/strict";
import { createTrace, pushDown, pushHold } from "./fair.js";
import { standings } from "./ranks.js";

function typeGaps(gaps, hold = 45) {
  const trace = createTrace();
  let at = 1000;
  pushDown(trace, at);
  for (const gap of gaps) {
    at += gap;
    pushDown(trace, at);
    pushHold(trace, hold);
  }
  return trace;
}

test("ordinary typing is allowed", () => {
  const gaps = [70, 110, 55, 90, 130, 80, 60, 140, 75, 100, 95, 120];
  const trace = typeGaps(gaps, 50);
  assert.equal(trace.voided, null);
});

test("a word dumped in one burst is a script", () => {
  const trace = typeGaps([2, 1, 3, 2, 4, 80]);
  assert.equal(trace.voided, "script");
});

test("keys held for only a few milliseconds are a script", () => {
  const gaps = Array.from({ length: 16 }, () => 40);
  const trace = typeGaps(gaps, 4);
  assert.equal(trace.voided, "script");
});

test("the same gap every time is a script", () => {
  const trace = typeGaps(Array.from({ length: 30 }, () => 35), 40);
  assert.equal(trace.voided, "script");
});

test("global counts decide the rank", () => {
  const row = { id: "me", board: "onion", wpm: 75, createdAt: "2026-01-02" };
  const place = standings([row], row, { total: 2947, better: 2299, worse: 600 });
  assert.equal(place.rank, 2300);
  assert.equal(place.total, 2947);
  assert.equal(place.beat, 20);
});
