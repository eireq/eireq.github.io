import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptScore,
  fromDiagram,
  pass,
  play,
  resume,
  toggleDead,
  undo,
} from "./logic.js";

function mustPlay(game, row, col) {
  const result = play(game, row, col);
  assert.equal(result.ok, true, result.reason);
  return result.game;
}

test("players alternate and a corner stone can be captured", () => {
  let game = fromDiagram([".....", ".....", ".....", ".....", "....."]);
  game = mustPlay(game, 0, 0);
  assert.equal(game.turn, "white");
  game = mustPlay(game, 0, 1);
  game = mustPlay(game, 4, 4);
  game = mustPlay(game, 1, 0);
  assert.equal(game.board[0], 0);
  assert.equal(game.captures.white, 1);
  assert.equal(game.turn, "black");
});

test("a group with a liberty left is not captured", () => {
  const game = fromDiagram(["BB.", "...", "..."], "white");
  const next = mustPlay(game, 0, 2);
  assert.equal(next.board[0], "black");
  assert.equal(next.board[1], "black");
  assert.equal(next.captures.white, 0);
});

test("one move can capture several groups and a connected pair", () => {
  const around = mustPlay(
    fromDiagram(["BWB", "W.W", "BWB"]),
    1,
    1,
  );
  assert.equal(around.captures.black, 4);
  assert.equal(around.board[1 * 3 + 1], "black");

  const pair = mustPlay(fromDiagram(["WW.B", "BBB.", "....", "...."]), 0, 2);
  assert.equal(pair.captures.black, 2);
  assert.equal(pair.board[0], 0);
  assert.equal(pair.board[1], 0);
});

test("suicide is illegal, including filling your own last eye", () => {
  const game = fromDiagram(["BBB", "B.B", "BBB"]);
  const result = play(game, 1, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "suicide");
  assert.equal(game.board[1 * 3 + 1], 0);
});

test("a capture that saves the new stone is legal", () => {
  const game = mustPlay(fromDiagram(["BBBB", "BW.B", "BBBB", "...."]), 1, 2);
  assert.equal(game.board[1 * 4 + 1], 0);
  assert.equal(game.board[1 * 4 + 2], "black");
  assert.equal(game.captures.black, 1);
});

test("positional superko forbids the immediate recapture and allows it after tenuki", () => {
  const start = fromDiagram([".BW.", "BW.W", ".BW.", "...."]);
  const captured = mustPlay(start, 1, 2);
  assert.equal(captured.board[1 * 4 + 1], 0);
  const ko = play(captured, 1, 1);
  assert.equal(ko.ok, false);
  assert.equal(ko.reason, "ko");
  assert.equal(captured.board[1 * 4 + 1], 0);

  let game = mustPlay(captured, 3, 3);
  game = mustPlay(game, 3, 0);
  game = mustPlay(game, 1, 1);
  assert.equal(game.board[1 * 4 + 1], "white");
  assert.equal(game.board[1 * 4 + 2], 0);
  assert.equal(game.captures.white, 1);
});

test("an occupied point is rejected without changing the board", () => {
  const game = fromDiagram(["B.", ".."], "white");
  const result = play(game, 0, 0);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "occupied");
  assert.equal(game.turn, "white");
});

test("undo restores the previous stone and whose turn it is", () => {
  let game = mustPlay(fromDiagram(["...", "...", "..."]), 0, 0);
  game = mustPlay(game, 1, 1);
  game = undo(game);
  assert.equal(game.board[0], "black");
  assert.equal(game.board[1 * 3 + 1], 0);
  assert.equal(game.turn, "white");
  game = undo(game);
  assert.equal(game.board[0], 0);
  assert.equal(game.turn, "black");
  assert.equal(undo(game), game);
});

test("two passes open scoring, empty board is white by komi, and undo returns to play", () => {
  let game = pass(fromDiagram(["..", ".."]));
  assert.equal(game.phase, "play");
  assert.equal(game.passes, 1);
  assert.equal(game.turn, "white");
  game = pass(game);
  assert.equal(game.phase, "mark");
  assert.equal(game.score.black, 0);
  assert.equal(game.score.white, 7.5);
  const done = acceptScore(game);
  assert.equal(done.phase, "done");
  assert.equal(done.winner, "white");
  assert.equal(undo(done).phase, "mark");
  assert.equal(undo(game).passes, 1);
});

test("area scoring counts eyes, dame, and stones marked dead", () => {
  let game = pass(fromDiagram(["BBB", "B.B", "BBW"]));
  game = pass(game);
  assert.equal(game.score.black, 8);
  assert.equal(game.score.white, 8.5);
  assert.equal(game.score.territory[1 * 3 + 1], "black");

  game = toggleDead(game, 2, 2);
  assert.deepEqual(game.dead, [2 * 3 + 2]);
  assert.equal(game.score.black, 9);
  assert.equal(game.score.white, 7.5);
  game = toggleDead(game, 2, 2);
  assert.deepEqual(game.dead, []);
  assert.equal(game.score.black, 8);

  const dame = pass(pass(fromDiagram(["BW", ".."])));
  assert.equal(dame.score.black, 1);
  assert.equal(dame.score.white, 8.5);
  assert.equal(dame.score.territory[2], 0);
});

test("resume keeps playing and undo can return to the score", () => {
  let game = pass(pass(fromDiagram(["BW", ".."])));
  game = toggleDead(game, 0, 0);
  const marked = game.score.black;
  game = resume(game);
  assert.equal(game.phase, "play");
  assert.equal(game.passes, 0);
  assert.equal(game.dead.length, 0);
  game = undo(game);
  assert.equal(game.phase, "mark");
  assert.equal(game.score.black, marked);
  assert.deepEqual(game.dead, [0]);
});
