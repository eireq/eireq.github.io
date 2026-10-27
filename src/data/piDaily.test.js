import test from "node:test";
import assert from "node:assert/strict";
import { PI_DECIMALS } from "./piDigits.js";
import {
  ATTEMPTS,
  batchSize,
  beginPiQuiz,
  gradeAnswer,
  lessonPlan,
  loadPiProgress,
  prefixCuts,
  savePiProgress,
  submitPiAnswer,
  visibleStreak,
} from "./piDaily.js";

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

const TODAY = "2026-10-27";
const YESTERDAY = "2026-10-26";

function reset() {
  store.clear();
}

function freshQuiz(overrides = {}) {
  return {
    mastered: 0,
    streak: 0,
    lastWin: null,
    dateKey: TODAY,
    status: "quiz",
    step: 0,
    misses: 0,
    gained: 0,
    log: [],
    ...overrides,
  };
}

test("pi decimals match the known expansion", () => {
  assert.equal(PI_DECIMALS.length, 1000);
  assert.equal(
    PI_DECIMALS.startsWith(
      "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679",
    ),
    true,
  );
});

test("lessons add more digits as you learn, then stop at the end", () => {
  assert.equal(batchSize(0), 3);
  assert.equal(batchSize(11), 3);
  assert.equal(batchSize(12), 4);
  assert.equal(batchSize(32), 5);
  assert.equal(batchSize(150), 8);
  assert.equal(batchSize(PI_DECIMALS.length - 2), 2);
  assert.equal(batchSize(PI_DECIMALS.length), 0);
  assert.deepEqual(prefixCuts(3), [3]);
  assert.deepEqual(prefixCuts(5), [3, 5]);
  assert.deepEqual(prefixCuts(8), [3, 6, 8]);
});

test("the first lesson is a short learn step, later lessons quiz older digits", () => {
  const first = lessonPlan(0, TODAY);
  assert.equal(first.fresh, PI_DECIMALS.slice(0, 3));
  assert.equal(first.steps.length, 1);
  assert.equal(first.steps[0].type, "learn");
  assert.equal(first.steps[0].answer, first.fresh);

  const later = lessonPlan(32, TODAY);
  assert.equal(later.fresh.length, 5);
  assert.equal(later.steps[0].type, "learn");
  assert.equal(later.steps[1].type, "learn");
  assert.equal(later.steps[1].answer.startsWith(later.steps[0].answer), true);
  assert.equal(later.steps.some((step) => step.type === "recall"), true);
  const tail = later.steps[later.steps.length - 1];
  assert.equal(tail.answer.endsWith(later.fresh), true);

  const review = lessonPlan(PI_DECIMALS.length, TODAY);
  assert.equal(review.fresh, "");
  assert.equal(review.steps.length > 0, true);
  assert.equal(
    review.steps.every((step) => step.type !== "learn"),
    true,
  );
});

test("grading marks each digit and rejects a different length", () => {
  assert.equal(gradeAnswer("141", "141").correct, true);
  assert.deepEqual(gradeAnswer("1 4 2", "142").marks, ["ok", "ok", "ok"]);
  assert.deepEqual(gradeAnswer("149", "141").marks, ["ok", "ok", "bad"]);
  assert.equal(gradeAnswer("14", "141").correct, false);
  assert.equal(gradeAnswer("1415", "141").correct, false);
});

test("a passed lesson locks the digits in and continues a streak", () => {
  reset();
  const plan = lessonPlan(0, TODAY);
  let progress = freshQuiz({
    lastWin: YESTERDAY,
    streak: 4,
  });
  progress = submitPiAnswer(progress, TODAY, plan.steps[0].answer);
  assert.equal(progress.status, "done");
  assert.equal(progress.mastered, 3);
  assert.equal(progress.streak, 5);
  assert.equal(progress.lastWin, TODAY);
  assert.equal(progress.gained, 3);

  const again = submitPiAnswer(progress, TODAY, "000");
  assert.equal(again.mastered, 3);
  assert.equal(again.status, "done");
});

test("a gap before the next win starts the streak over", () => {
  reset();
  const answer = lessonPlan(0, TODAY).steps[0].answer;
  const progress = submitPiAnswer(
    freshQuiz({ lastWin: "2026-10-20", streak: 9 }),
    TODAY,
    answer,
  );
  assert.equal(progress.streak, 1);
});

test("three misses fail the day without teaching the digits", () => {
  reset();
  let progress = freshQuiz({ lastWin: YESTERDAY, streak: 2 });
  for (let i = 0; i < ATTEMPTS - 1; i += 1) {
    progress = submitPiAnswer(progress, TODAY, "000");
    assert.equal(progress.status, "quiz");
    assert.equal(progress.mastered, 0);
    assert.equal(progress.streak, 2);
  }
  progress = submitPiAnswer(progress, TODAY, "999");
  assert.equal(progress.status, "failed");
  assert.equal(progress.mastered, 0);
  assert.equal(progress.streak, 0);
  assert.equal(progress.lastWin, null);
});

test("a new utc day keeps what you know and opens the next lesson", () => {
  reset();
  savePiProgress({
    mastered: 6,
    streak: 2,
    lastWin: YESTERDAY,
    dateKey: YESTERDAY,
    status: "done",
    step: 2,
    misses: 0,
    gained: 3,
    log: [0, 1],
  });
  const today = loadPiProgress(TODAY);
  assert.equal(today.dateKey, TODAY);
  assert.equal(today.mastered, 6);
  assert.equal(today.status, "study");
  assert.equal(today.step, 0);
  assert.equal(today.gained, 0);
  assert.equal(visibleStreak(today, TODAY), 2);

  const cold = {
    ...today,
    lastWin: "2026-10-01",
    streak: 8,
  };
  assert.equal(visibleStreak(cold, TODAY), 0);
});

test("study has to start before an answer counts", () => {
  reset();
  const studying = freshQuiz({ status: "study" });
  const ignored = submitPiAnswer(studying, TODAY, "141");
  assert.equal(ignored.status, "study");
  const quizzing = beginPiQuiz(studying);
  assert.equal(quizzing.status, "quiz");
  const done = submitPiAnswer(quizzing, TODAY, PI_DECIMALS.slice(0, 3));
  assert.equal(done.status, "done");
});

test("a finished review day does not invent new digits", () => {
  reset();
  let progress = freshQuiz({
    mastered: PI_DECIMALS.length,
    status: "quiz",
  });
  const plan = lessonPlan(PI_DECIMALS.length, TODAY);
  for (const step of plan.steps) {
    if (progress.status === "study") progress = beginPiQuiz(progress);
    progress = submitPiAnswer(progress, TODAY, step.answer);
  }
  assert.equal(progress.status, "done");
  assert.equal(progress.mastered, PI_DECIMALS.length);
  assert.equal(progress.gained, 0);
});
