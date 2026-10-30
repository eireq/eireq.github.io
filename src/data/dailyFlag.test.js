import test from "node:test";
import assert from "node:assert/strict";
import { recordDailyGuess } from "./dailyFlag.js";

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  },
};

function reset() {
  store.clear();
}

function miss(dateKey, answerName) {
  let result;
  for (let i = 0; i < 6; i += 1) {
    result = recordDailyGuess({
      dateKey,
      guess: `nope ${i}`,
      correct: false,
      answerName,
    });
  }
  return result;
}

test("a lost daily flag clears the streak, and the next win starts at 1", () => {
  reset();
  const won = recordDailyGuess({
    dateKey: "2026-10-24",
    guess: "Ireland",
    correct: true,
    answerName: "Ireland",
  });
  assert.equal(won.streak, 1);

  const lost = miss("2026-10-25", "France");
  assert.equal(lost.failed, true);
  assert.equal(lost.streak, 0);
  assert.equal(lost.lastWin, null);

  const again = recordDailyGuess({
    dateKey: "2026-10-26",
    guess: "France",
    correct: true,
    answerName: "France",
  });
  assert.equal(again.streak, 1);
  assert.equal(again.lastWin, "2026-10-26");
});

test("a wrong guess before the last try keeps the streak", () => {
  reset();
  recordDailyGuess({
    dateKey: "2026-10-24",
    guess: "Ireland",
    correct: true,
    answerName: "Ireland",
  });
  const mid = recordDailyGuess({
    dateKey: "2026-10-25",
    guess: "nope",
    correct: false,
    answerName: "France",
  });
  assert.equal(mid.failed, false);
  assert.equal(mid.streak, 1);
  assert.equal(mid.lastWin, "2026-10-24");
});

test("wins on back to back days extend the streak", () => {
  reset();
  recordDailyGuess({
    dateKey: "2026-10-24",
    guess: "Ireland",
    correct: true,
    answerName: "Ireland",
  });
  const next = recordDailyGuess({
    dateKey: "2026-10-25",
    guess: "France",
    correct: true,
    answerName: "France",
  });
  assert.equal(next.streak, 2);
});
