import test from "node:test";
import assert from "node:assert/strict";
import {
  SIZE,
  analyze,
  applyMove,
  cellByKey,
  cells,
  chooseBotMove,
  legalMoves,
  makePosition,
  positionKey,
  startPosition,
} from "./logic.js";

function dests(pos, from) {
  return legalMoves(pos)
    .filter((move) => cells[move.from].key === from)
    .map((move) => cells[move.to].key);
}

function play(pos, from, to, promotion = null) {
  const moves = legalMoves(pos).filter((move) => {
    return (
      cells[move.from].key === from &&
      cells[move.to].key === to &&
      (move.promotion || null) === promotion
    );
  });
  const available = dests(pos, from).join(" ");
  assert.equal(moves.length, 1, `${from}-${to}${promotion ? "=" + promotion : ""} available: ${available}`);
  return applyMove(pos, moves[0]);
}

test("the board is the 91-cell glinski hex", () => {
  assert.equal(cells.length, 91);
  assert.equal(cellByKey.f6.q, 0);
  assert.equal(cellByKey.f6.r, 0);
  assert.equal(cellByKey.f6.key, "f6");
  assert.equal(cells.some((cell) => cell.file === "j"), false);
  assert.equal(new Set(cells.map((cell) => cell.key)).size, 91);
  assert.ok(cellByKey.f1.y > cellByKey.f11.y);
  const dist = Math.hypot(cellByKey.f6.x - cellByKey.f7.x, cellByKey.f6.y - cellByKey.f7.y);
  assert.ok(Math.abs(dist - SIZE * Math.sqrt(3)) < 0.02);
});

test("the three bishops start on three colours", () => {
  const colors = ["f1", "f2", "f3"].map((key) => cellByKey[key].color);
  assert.equal(new Set(colors).size, 3);
});

test("white has fifty-one legal moves at the start", () => {
  const moves = legalMoves(startPosition());
  const counts = {};
  for (const move of moves) {
    const key = cells[move.from].key;
    counts[key] = (counts[key] || 0) + 1;
  }
  assert.equal(moves.length, 51, JSON.stringify(counts));
});

test("the white king starts with two moves", () => {
  assert.deepEqual(dests(startPosition(), "g1").sort(), ["g2", "h2"]);
});

test("the f5 pawn cannot double-step through the black pawn", () => {
  assert.deepEqual(dests(startPosition(), "f5"), ["f6"]);
});

test("a knight in the center has twelve leaps", () => {
  const pos = makePosition(
    [
      ["f6", "w", "n"],
      ["a1", "w", "k"],
      ["l6", "b", "k"],
    ],
    "w",
  );
  assert.equal(dests(pos, "f6").length, 12);
});

test("a bishop stays on one colour", () => {
  const pos = makePosition(
    [
      ["f6", "w", "b"],
      ["a1", "w", "k"],
      ["l1", "b", "k"],
    ],
    "w",
  );
  const moves = legalMoves(pos).filter((move) => cells[move.from].key === "f6");
  assert.equal(moves.length, 12);
  for (const move of moves) assert.equal(cells[move.to].color, cellByKey.f6.color);
});

test("a pinned bishop cannot leave the king's file", () => {
  const pos = makePosition(
    [
      ["f1", "w", "k"],
      ["f6", "w", "b"],
      ["f11", "b", "r"],
      ["a6", "b", "k"],
    ],
    "w",
  );
  assert.deepEqual(dests(pos, "f6"), []);
});

test("a pawn on a friendly start cell may step two", () => {
  const pos = makePosition(
    [
      ["f5", "w", "p"],
      ["f2", "w", "k"],
      ["a6", "b", "k"],
    ],
    "w",
  );
  const squares = dests(pos, "f5");
  assert.ok(squares.includes("f6"));
  assert.ok(squares.includes("f7"));
});

test("a double step can be taken en passant", () => {
  let pos = makePosition(
    [
      ["b5", "w", "p"],
      ["c7", "b", "p"],
      ["a1", "w", "k"],
      ["l6", "b", "k"],
    ],
    "b",
  );
  pos = play(pos, "c7", "c5");
  assert.equal(cells[pos.ep].key, "c6");
  pos = play(pos, "b5", "c6");
  assert.equal(pos.board[cellByKey.c5.index], null);
  assert.equal(pos.board[cellByKey.c6.index].color, "w");
  assert.equal(pos.board[cellByKey.b5.index], null);
});

test("a pawn promotes on the last cell of the file", () => {
  const pos = makePosition(
    [
      ["e9", "w", "p"],
      ["a1", "w", "k"],
      ["l6", "b", "k"],
    ],
    "w",
  );
  const moves = legalMoves(pos).filter((move) => cells[move.from].key === "e9");
  assert.deepEqual(
    [...new Set(moves.map((move) => cells[move.to].key))],
    ["e10"],
  );
  assert.deepEqual(
    moves.map((move) => move.promotion).sort(),
    ["b", "n", "q", "r"],
  );
});

test("a black pawn promotes on rank 1", () => {
  const pos = makePosition(
    [
      ["c2", "b", "p"],
      ["a6", "b", "k"],
      ["l6", "w", "k"],
    ],
    "b",
  );
  const moves = legalMoves(pos).filter(
    (move) => cells[move.from].key === "c2" && cells[move.to].key === "c1",
  );
  assert.equal(moves.length, 4);
});

test("fool's mate", () => {
  let pos = startPosition();
  const line = [
    ["e1", "c3"],
    ["e10", "c6"],
    ["b1", "b2"],
    ["b7", "b6"],
    ["f3", "b1"],
    ["e7", "e6"],
    ["c3", "f9"],
  ];
  for (const [from, to] of line) pos = play(pos, from, to);
  const result = analyze(pos);
  assert.equal(result.type, "mate");
  assert.equal(result.winner, "w");
});

test("stalemate wins for the side that delivered it", () => {
  const pos = makePosition(
    [
      ["a6", "b", "k"],
      ["c6", "w", "k"],
      ["b1", "w", "q"],
    ],
    "b",
  );
  const result = analyze(pos);
  assert.equal(result.type, "stalemate");
  assert.equal(result.winner, "w");
  assert.equal(result.check, false);
});

test("draws", () => {
  const lone = makePosition(
    [
      ["a1", "w", "k"],
      ["l6", "b", "k"],
    ],
    "w",
  );
  assert.equal(analyze(lone).type, "material");

  const queen = makePosition(
    [
      ["a1", "w", "k"],
      ["d4", "w", "q"],
      ["l6", "b", "k"],
    ],
    "w",
  );
  assert.equal(analyze(queen).type, "play");

  const aged = startPosition();
  aged.halfmove = 100;
  assert.equal(analyze(aged).type, "fifty");

  const key = positionKey(startPosition());
  assert.equal(analyze(startPosition(), [key, key]).type, "play");
  assert.equal(analyze(startPosition(), [key, key, key]).type, "repeat");
});

test("the practice bot returns a legal opening move", () => {
  const pos = startPosition();
  const started = Date.now();
  const move = chooseBotMove(pos);
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 2500, `bot took ${elapsed}ms`);
  assert.ok(
    legalMoves(pos).some((item) => item.from === move.from && item.to === move.to && item.promotion === move.promotion),
  );
});
