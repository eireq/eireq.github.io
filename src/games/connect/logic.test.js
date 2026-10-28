import test from "node:test";
import assert from "node:assert/strict";
import {
  apply,
  boardOf,
  decodeMoves,
  encodeMoves,
  footprint,
  initialState,
  replay,
  sameGroup,
  scoreSStar,
  scoreStar,
} from "./logic.js";

function must(state, move) {
  const next = apply(state, move);
  assert.equal(next.ok, true, next.reason);
  return next.state;
}

test("hex connects the two sides and a corner is shared", () => {
  let state = initialState({ game: "hex", size: 2, pie: false });
  state = must(state, { t: "cell", id: 0 });
  assert.equal(state.result, null);
  state = must(state, { t: "cell", id: 3 });
  state = must(state, { t: "cell", id: 2 });
  assert.equal(state.result.winner, "red");
  assert.ok(state.winIds.includes(0));
  assert.ok(state.winIds.includes(2));
});

test("y corners count twice and two stones can win", () => {
  const board = boardOf("y", 2);
  assert.equal(board.cells.length, 3);
  let state = initialState({ game: "y", size: 2, pie: false });
  const corner = board.cells.find((cell) => cell.q === 0 && cell.r === 0);
  state = must(state, { t: "cell", id: corner.id });
  assert.equal(state.result, null);
  const far = board.cells.find((cell) => cell.q === 1);
  state = must(state, { t: "cell", id: board.cells.find((cell) => cell !== corner && cell.q === 0).id });
  state = must(state, { t: "cell", id: far.id });
  assert.equal(state.result.winner, "red");
});

test("the pie rule swaps seats and leaves the stone", () => {
  let state = initialState({ game: "hex", size: 5, pie: true });
  state = must(state, { t: "cell", id: 0 });
  assert.equal(state.pieOpen, true);
  assert.equal(state.turn, "blue");
  state = must(state, { t: "swap" });
  assert.equal(state.seats.red, "B");
  assert.equal(state.seats.blue, "A");
  assert.equal(state.turn, "blue");
  assert.equal(state.stones[0], 1);
  assert.equal(state.pieOpen, false);
});

test("gale's crossing bridges block, and the short board connects", () => {
  let tiny = initialState({ game: "gale", size: 1, pie: false });
  const small = boardOf("gale", 1);
  const red = small.bridges.find((bridge) => bridge.color === "red");
  tiny = must(tiny, { t: "bridge", id: red.id });
  assert.equal(tiny.result.winner, "red");

  const board = boardOf("gale", 2);
  const bridge = board.bridges.find((item) => item.color === "red" && item.cross != null);
  let state = initialState({ game: "gale", size: 2, pie: false });
  state = must(state, { t: "bridge", id: bridge.id });
  const blocked = apply(state, { t: "bridge", id: bridge.cross });
  assert.equal(blocked.ok, false);
});

test("twixt links cross and a knight path joins the borders", () => {
  const board = boardOf("twixt", 8);
  const at = (r, c) => board.holeAt.get(`${r},${c}`);
  let state = initialState({ game: "twixt", size: 8, pie: false });
  const a = at(2, 2);
  const b = at(4, 3);
  const c = at(2, 3);
  const d = at(4, 2);
  state = must(state, { t: "twixt", hole: a, add: [], remove: [] });
  state = must(state, { t: "twixt", hole: c, add: [], remove: [] });
  state = must(state, { t: "twixt", hole: b, add: [[a, b]], remove: [] });
  const cross = apply(state, { t: "twixt", hole: d, add: [[c, d]], remove: [] });
  assert.equal(cross.ok, false);

  const path = [
    [0, 1],
    [2, 2],
    [4, 3],
    [6, 4],
    [7, 6],
  ].map(([r, c]) => at(r, c));
  const fillers = [at(1, 5), at(2, 6), at(3, 6), at(4, 6)];
  let game = initialState({ game: "twixt", size: 8, pie: false });
  for (let i = 0; i < path.length; i += 1) {
    const add = i === 0 ? [] : [[path[i - 1], path[i]]];
    game = must(game, { t: "twixt", hole: path[i], add, remove: [] });
    if (!game.result && i < fillers.length) {
      game = must(game, { t: "twixt", hole: fillers[i], add: [], remove: [] });
    }
  }
  assert.equal(game.result.winner, "red");
});

test("star scores a full board as every border cell minus two", () => {
  const board = boardOf("star", 3);
  const stones = Array(board.cells.length).fill(1);
  const scores = scoreStar(board, stones);
  assert.ok(board.partials.length >= 3);
  assert.equal(scores.red, board.partials.length - 2);
  assert.equal(scores.blue, 0);
});

test("*star perimeter, bridge, and score total", () => {
  const board = boardOf("sstar", 4);
  assert.equal(board.cells.length, 50);
  assert.equal(board.perimeter.length, 20);
  assert.equal(board.hub.length, 5);
  for (let i = 0; i < board.perimeter.length; i += 1) {
    const a = board.perimeter[i];
    const b = board.perimeter[(i + 1) % board.perimeter.length];
    assert.ok(board.neighbors[a].includes(b), `perimeter break at ${i}`);
  }
  const stones = Array(board.cells.length).fill(0);
  stones[board.hub[0]] = 1;
  stones[board.hub[2]] = 1;
  const state = initialState({ game: "sstar", size: 4, pie: false });
  state.stones = stones;
  assert.equal(board.neighbors[board.hub[0]].includes(board.hub[2]), false);
  assert.equal(sameGroup(state, board.hub[0], board.hub[2]), true);

  const filled = Array(board.cells.length).fill(0);
  for (const id of board.perimeter) filled[id] = 1;
  const scores = scoreSStar(board, filled);
  assert.equal(scores.red + scores.blue, board.perimeter.length + 1);
});

test("punct board, shapes, center, and a straight slide", () => {
  const board = boardOf("punct", 0);
  assert.equal(board.cells.length, 211);
  const adj = (a, b) => board.neighbors[a].includes(b);
  let bent = null;
  let tri = null;
  let line = null;
  for (const cell of board.cells) {
    bent = bent || footprint(board, "al", 0, cell.id);
    tri = tri || footprint(board, "tri", 0, cell.id);
    line = line || footprint(board, "se", 0, cell.id);
  }
  assert.equal(adj(bent[0], bent[1]) && adj(bent[1], bent[2]) && !adj(bent[0], bent[2]), true);
  assert.equal(adj(tri[0], tri[1]) && adj(tri[1], tri[2]) && adj(tri[0], tri[2]), true);
  assert.equal(adj(line[0], line[1]) && adj(line[1], line[2]) && !adj(line[0], line[2]), true);

  const center = board.cells.find((cell) => cell.center);
  let banned = initialState({ game: "punct", size: 0, punctRules: "standard" });
  assert.equal(apply(banned, { t: "place", kind: "tri", orient: 0, id: center.id }).ok, false);

  const anchor = board.cells.find((cell) => footprint(board, "se", 0, cell.id) && !cell.center);
  let state = initialState({ game: "punct", size: 0, punctRules: "standard" });
  state = must(state, { t: "place", kind: "se", orient: 0, id: anchor.id });
  assert.equal(state.pieces[0].cells.length, 3);
  assert.equal(state.supply.red.se, 3);
  const again = apply(state, { t: "place", kind: "se", orient: 0, id: anchor.id });
  assert.equal(again.ok, false);
  const piece = state.pieces[0];
  const step = board.cells.find(
    (cell) => cell.q === board.cells[piece.cells[0]].q + 1 && cell.r === board.cells[piece.cells[0]].r,
  );
  const blueAnchor = board.cells.find((cell) => {
    const cells = footprint(board, "tri", 0, cell.id);
    if (!cells) return false;
    return !cells.some((id) => piece.cells.includes(id) || id === step?.id);
  });
  state = must(state, { t: "place", kind: "tri", orient: 0, id: blueAnchor.id });
  if (step && footprint(board, "se", 0, step.id)) {
    state = must(state, { t: "shift", id: piece.id, to: step.id, orient: 0 });
    assert.equal(state.pieces[0].cells[0], step.id);
  }
});

test("a link round-trips through the move text", () => {
  const moves = [
    { t: "cell", id: 4 },
    { t: "swap" },
    { t: "cell", id: 12 },
  ];
  const text = encodeMoves(moves);
  const back = decodeMoves(text);
  assert.deepEqual(back, moves);
  const played = replay({ game: "hex", size: 5, pie: true }, back);
  assert.equal(played.error, null);
  assert.equal(played.state.stones[4], 1);
  assert.equal(played.state.seats.red, "B");
});

test("squares read like h3 and gale links name both ends", () => {
  const hex = boardOf("hex", 11);
  const cell = hex.cells.find((item) => item.name === "h3");
  assert.equal(cell.q, 7);
  assert.equal(cell.r, 2);
  assert.ok(hex.labels.some((label) => label.text === "h"));
  assert.ok(hex.labels.some((label) => label.text === "3"));
  const gale = boardOf("gale", 5);
  assert.equal(gale.bridges[0].name, "a1a2");
  assert.ok(gale.labels.some((label) => label.text === "a"));
});
