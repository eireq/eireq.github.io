import test from "node:test";
import assert from "node:assert/strict";
import {
  COLOR_IDS,
  canPlace,
  createMatch,
  findWins,
  place,
  undo,
} from "./logic.js";

function blankBoard() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => [null, null, null]),
  );
}

function withStock(state, counts) {
  const stock = Object.fromEntries(
    COLOR_IDS.map((id) => [id, [...state.stock[id]]]),
  );
  Object.assign(stock, counts);
  return { ...state, stock };
}

test("two players alternate opposite colors around the board", () => {
  let state = createMatch({ players: 2, start: "tan" });
  assert.deepEqual(state.owners, { tan: 0, black: 0, white: 1, blue: 1 });
  assert.equal(state.turn, "tan");
  state = place(state, 0, 0, 2);
  assert.equal(state.turn, "white");
  state = place(state, 1, 0, 2);
  assert.equal(state.turn, "black");
  state = place(state, 2, 0, 2);
  assert.equal(state.turn, "blue");
  state = place(state, 2, 2, 0);
  assert.equal(state.turn, "tan");
  assert.equal(state.winner, null);
});

test("starting on white sends player 2 first, then black", () => {
  const state = createMatch({ players: 2, start: "white" });
  assert.equal(state.turn, "white");
  assert.equal(state.owners.white, 1);
  assert.equal(place(state, 0, 0, 0).turn, "black");
});

test("three players skip the color that sits out", () => {
  let state = createMatch({ players: 3, sittingOut: "blue", start: "tan" });
  assert.deepEqual(state.active, ["tan", "white", "black"]);
  assert.equal(state.stock.blue[0], 0);
  for (let step = 0; step < 6; step += 1) {
    assert.notEqual(state.turn, "blue");
    state = place(state, step % 3, Math.floor(step / 3), 0);
  }
  assert.equal(state.winner, null);
  assert.ok(state.history.every((move) => move.color !== "blue"));
});

test("same-size three in a row wins and stops the turn", () => {
  let state = createMatch({ players: 4, start: "blue" });
  const script = [
    [0, 0, 2],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [0, 1, 2],
    [2, 0, 0],
    [2, 1, 0],
    [2, 2, 1],
    [0, 2, 2],
  ];
  for (const move of script) state = place(state, ...move);
  assert.equal(state.winner, "blue");
  assert.equal(state.wins[0].type, "same");
  assert.equal(state.wins[0].size, 2);
  assert.equal(state.turn, "blue");
  assert.equal(state.stock.blue[2], 0);
});

test("smallest to biggest and the reverse both win", () => {
  let rising = createMatch({ players: 4, start: "blue" });
  const risingScript = [
    [0, 0, 0],
    [2, 0, 2],
    [2, 1, 0],
    [2, 2, 1],
    [0, 1, 1],
    [1, 0, 2],
    [1, 1, 2],
    [1, 2, 0],
    [0, 2, 2],
  ];
  for (const move of risingScript) rising = place(rising, ...move);
  assert.equal(rising.winner, "blue");
  assert.equal(rising.wins[0].type, "order");
  assert.equal(rising.wins[0].rising, true);

  let falling = createMatch({ players: 4, start: "blue" });
  const fallingScript = risingScript.map(([r, c, size]) =>
    r === 0 ? [r, c, 2 - size] : [r, c, size],
  );
  for (const move of fallingScript) falling = place(falling, ...move);
  assert.equal(falling.winner, "blue");
  assert.equal(falling.wins[0].type, "order");
  assert.equal(falling.wins[0].rising, false);
});

test("three sizes in one circle win", () => {
  let state = createMatch({ players: 4, start: "blue" });
  const script = [
    [1, 1, 0],
    [0, 0, 2],
    [0, 2, 2],
    [2, 0, 2],
    [1, 1, 1],
    [0, 1, 0],
    [1, 0, 0],
    [1, 2, 0],
    [1, 1, 2],
  ];
  for (const move of script) state = place(state, ...move);
  assert.equal(state.winner, "blue");
  assert.equal(state.wins[0].type, "stack");
});

test("a scrambled size order is not a line", () => {
  const board = blankBoard();
  board[0][0][0] = "blue";
  board[0][1][2] = "blue";
  board[0][2][1] = "blue";
  assert.equal(findWins(board).length, 0);
});

test("mixed colors do not win, including a two-player team", () => {
  const board = blankBoard();
  board[0][0][2] = "tan";
  board[0][1][2] = "black";
  board[0][2][2] = "tan";
  board[1][1] = ["tan", "white", "black"];
  assert.equal(findWins(board).length, 0);

  let state = createMatch({ players: 2, start: "tan" });
  state = place(state, 0, 0, 2);
  state = place(state, 2, 2, 0);
  state = place(state, 0, 1, 2);
  state = place(state, 2, 1, 0);
  state = place(state, 0, 2, 2);
  assert.equal(state.winner, null);
});

test("diagonals and columns count", () => {
  const diagonal = blankBoard();
  diagonal[0][0][0] = "black";
  diagonal[1][1][1] = "black";
  diagonal[2][2][2] = "black";
  assert.equal(findWins(diagonal)[0].type, "order");

  const column = blankBoard();
  column[0][1][1] = "white";
  column[1][1][1] = "white";
  column[2][1][1] = "white";
  assert.equal(findWins(column)[0].type, "same");
  assert.equal(findWins(column)[0].size, 1);
});

test("a taken groove and an empty hand are refused", () => {
  const state = createMatch({ players: 4, start: "tan" });
  const next = place(state, 0, 0, 0);
  assert.equal(place(next, 0, 0, 0), next);
  const blocked = withStock(state, { tan: [0, 0, 0] });
  assert.equal(canPlace(blocked, 0, 0, 0), false);
  assert.equal(place(blocked, 0, 0, 0), blocked);
});

test("a color with no ring left is skipped", () => {
  const state = withStock(createMatch({ players: 4, start: "tan" }), {
    white: [0, 0, 0],
  });
  const next = place(state, 0, 0, 0);
  assert.equal(next.turn, "black");
  assert.deepEqual(next.skipped, ["white"]);
});

test("nobody left who can play is a draw", () => {
  const state = withStock(createMatch({ players: 4, start: "tan" }), {
    tan: [1, 0, 0],
    white: [0, 0, 0],
    black: [0, 0, 0],
    blue: [0, 0, 0],
  });
  const next = place(state, 1, 1, 0);
  assert.equal(next.draw, true);
  assert.equal(next.winner, null);
});

test("undo walks the last ring back, including after a win", () => {
  let state = createMatch({ players: 4, start: "blue" });
  state = place(state, 0, 0, 2);
  state = place(state, 1, 0, 0);
  const once = undo(state);
  assert.equal(once.history.length, 1);
  assert.equal(once.turn, "tan");
  assert.equal(once.board[1][0][0], null);
  assert.equal(undo(once).history.length, 0);
  assert.equal(undo(createMatch()).history.length, 0);

  const script = [
    [0, 0, 2],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [0, 1, 2],
    [2, 0, 0],
    [2, 1, 0],
    [2, 2, 1],
    [0, 2, 2],
  ];
  let won = createMatch({ players: 4, start: "blue" });
  for (const move of script) won = place(won, ...move);
  const back = undo(won);
  assert.equal(back.winner, null);
  assert.equal(back.turn, "blue");
  assert.equal(back.board[0][2][2], null);
});
