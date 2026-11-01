import test from "node:test";
import assert from "node:assert/strict";
import { isCorrectFlagAnswer } from "./flags.js";

const unitedStates = { name: "Flag of United States" };
const unitedKingdom = { name: "Flag of United Kingdom" };
const colombia = { name: "Flag of United States of Colombia" };

test("USA and UK match those countries, including dotted forms", () => {
  assert.equal(isCorrectFlagAnswer("USA", unitedStates), true);
  assert.equal(isCorrectFlagAnswer("U.S.A.", unitedStates), true);
  assert.equal(isCorrectFlagAnswer("US", unitedStates), true);
  assert.equal(isCorrectFlagAnswer("UK", unitedKingdom), true);
  assert.equal(isCorrectFlagAnswer("U.K.", unitedKingdom), true);
});

test("those abbreviations do not match a longer name, and a blank does not count", () => {
  assert.equal(isCorrectFlagAnswer("USA", colombia), false);
  assert.equal(isCorrectFlagAnswer("UK", unitedStates), false);
  assert.equal(isCorrectFlagAnswer("   ", unitedStates), false);
  assert.equal(isCorrectFlagAnswer("United States", unitedStates), true);
});
