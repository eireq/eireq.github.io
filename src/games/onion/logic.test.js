import test from "node:test";
import assert from "node:assert/strict";
import {
  createRun,
  press,
  ROUND_MS,
  summarize,
  targetChar,
  tick,
  windowCells,
  wpmFor,
} from "./logic.js";
import { playerCount, standings, titleFor } from "./ranks.js";

function type(text, run = createRun(), start = 5_000) {
  [...text].forEach((char, index) => press(run, char, start + index));
  return run;
}

test("the target is onion with a space between words", () => {
  assert.equal(targetChar(0), "o");
  assert.equal(targetChar(4), "n");
  assert.equal(targetChar(5), " ");
  assert.equal(targetChar(6), "o");
});

test("a clean onion finishes on the onion board", () => {
  const run = type("onion onion ");
  tick(run, run.startedAt + ROUND_MS);
  const result = summarize(run);
  assert.equal(result.board, "onion");
  assert.equal(result.mistakes, 0);
  assert.equal(result.onions, 2);
  assert.equal(result.slips.length, 0);
  assert.equal(result.wpm, wpmFor(12, ROUND_MS));
});

test("a wrong letter stays on the letter you still owe", () => {
  const run = type("onip");
  assert.equal(run.index, 3);
  assert.equal(run.tape.at(-1).ok, false);
  assert.equal(run.tape.at(-1).expected, "o");
  press(run, "o", run.startedAt + 50);
  assert.equal(run.index, 4);
});

test("backspace can take the mistake back", () => {
  const run = type("onip");
  press(run, "Backspace", run.startedAt + 40);
  press(run, "o", run.startedAt + 50);
  press(run, "n", run.startedAt + 60);
  press(run, " ", run.startedAt + 70);
  tick(run, run.startedAt + ROUND_MS);
  const result = summarize(run);
  assert.equal(result.board, "onion");
  assert.equal(result.onions, 1);
  assert.equal(result.tape.map((cell) => cell.char).join(""), "onion ");
});

test("a run with a mistake goes to the mistake board and keeps the text", () => {
  const run = type("oniXon ");
  tick(run, run.startedAt + ROUND_MS);
  const result = summarize(run);
  assert.equal(result.board, "mistake");
  assert.equal(result.mistakes, 1);
  assert.equal(result.onions, 1);
  assert.deepEqual(
    result.slips.map((slip) => [slip.typedLabel, slip.expectedLabel]),
    [["X", "o"]],
  );
  assert.equal(result.tape.map((cell) => cell.char).join(""), "oniXon ");
});

test("wrong letters in a row count as one slip", () => {
  const result = summarize(type("onXYZ"));
  assert.equal(result.slips[0].typedLabel, "XYZ");
  assert.equal(result.slips[0].expectedLabel, "iii");
});

test("the clock starts on the first letter and ignores keys after 30s", () => {
  const run = createRun();
  press(run, "Backspace", 1_000);
  assert.equal(run.startedAt, null);

  press(run, "o", 2_000);
  assert.equal(run.startedAt, 2_000);
  press(run, "n", 2_000 + ROUND_MS);
  assert.equal(run.finished, true);
  assert.equal(run.tape.map((cell) => cell.char).join(""), "o");
});

test("75 wpm is speedy", () => {
  assert.equal(titleFor(75).name, "speedy");
  assert.equal(titleFor(75).flame, true);
  assert.equal(titleFor(19).name, "raw");
  assert.equal(titleFor(20).name, "chopping");
  assert.equal(titleFor(59).name, "sizzling");
  assert.equal(titleFor(60).name, "speedy");
  assert.equal(titleFor(120).name, "onion god");
});

test("rank, percentile, and the highlighted bar use only that board", () => {
  const mine = { id: "me", board: "mistake", wpm: 75, createdAt: "2026-01-03" };
  const scores = [
    { id: "a", board: "mistake", wpm: 90, createdAt: "2026-01-01" },
    { id: "b", board: "mistake", wpm: 40, createdAt: "2026-01-02" },
    mine,
    { id: "clean", board: "onion", wpm: 200, createdAt: "2026-01-01" },
  ];
  const place = standings(scores, mine);
  assert.equal(place.rank, 2);
  assert.equal(place.total, 3);
  assert.equal(place.beat, 50);
  assert.equal(place.histogram.cap, 130);
  assert.equal(place.histogram.mid, 65);
  assert.equal(place.histogram.bars.filter((bar) => bar.mine).length, 1);
  assert.equal(playerCount(2947), "2\u202f947 keyboard players");
  assert.equal(playerCount(1), "1 keyboard player");
});

test("the caret sits after the typed letters", () => {
  const run = type("oni");
  const view = windowCells(run, 10, 4);
  assert.equal(view.caret, 3);
  assert.deepEqual(
    view.cells.map((cell) => cell.char),
    ["o", "n", "i", "o", "n", " ", "o"],
  );
});
