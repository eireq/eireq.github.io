// Go (baduk), Chinese rules.
// Area scoring: living stones plus empty points those stones enclose.
// White receives 7.5 komi. Positional superko: a move may not restore
// any earlier arrangement of stones. Suicide is illegal.

export const BLACK = "black";
export const WHITE = "white";
export const SIZES = [9, 13, 19];
export const KOMI = 7.5;

const COLS = "ABCDEFGHJKLMNOPQRST";

export function other(color) {
  return color === BLACK ? WHITE : BLACK;
}

export function columnLabel(c) {
  return COLS[c] || "";
}

export function starPoints(size) {
  const lines =
    size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : size === 19 ? [3, 9, 15] : [];
  const points = [];
  for (const r of lines) {
    for (const c of lines) points.push([r, c]);
  }
  return points;
}

function hashBoard(board) {
  let key = "";
  for (let i = 0; i < board.length; i += 1) {
    const value = board[i];
    key += value === BLACK ? "1" : value === WHITE ? "2" : "0";
  }
  return key;
}

export function createGame({ size = 9 } = {}) {
  const n = Number.isInteger(size) && size >= 2 && size <= 19 ? size : 9;
  const board = new Array(n * n).fill(0);
  return {
    size: n,
    komi: KOMI,
    board,
    turn: BLACK,
    captures: { black: 0, white: 0 },
    seen: [hashBoard(board)],
    history: [],
    passes: 0,
    phase: "play",
    dead: [],
    last: null,
    winner: null,
    resigned: null,
    score: null,
  };
}

export function fromDiagram(rows, turn = BLACK) {
  const size = rows.length;
  if (size < 2 || size > 19) throw new Error("board size");
  const board = [];
  for (const row of rows) {
    if (row.length !== size) throw new Error("diagram is not square");
    for (const cell of row) {
      if (cell === "B") board.push(BLACK);
      else if (cell === "W") board.push(WHITE);
      else if (cell === ".") board.push(0);
      else throw new Error(`bad cell ${cell}`);
    }
  }
  return {
    ...createGame({ size }),
    board,
    turn: turn === WHITE ? WHITE : BLACK,
    seen: [hashBoard(board)],
  };
}

function neighbors(size, index) {
  const row = Math.floor(index / size);
  const col = index - row * size;
  const out = [];
  if (row > 0) out.push(index - size);
  if (row + 1 < size) out.push(index + size);
  if (col > 0) out.push(index - 1);
  if (col + 1 < size) out.push(index + 1);
  return out;
}

function groupAt(board, size, start) {
  const color = board[start];
  const stones = [];
  const libs = new Set();
  if (!color) return { stones, libs };
  const stack = [start];
  const seen = new Uint8Array(board.length);
  seen[start] = 1;
  while (stack.length) {
    const index = stack.pop();
    stones.push(index);
    for (const next of neighbors(size, index)) {
      const value = board[next];
      if (!value) libs.add(next);
      else if (value === color && !seen[next]) {
        seen[next] = 1;
        stack.push(next);
      }
    }
  }
  return { stones, libs };
}

function snapshot(game) {
  return {
    size: game.size,
    komi: game.komi,
    board: game.board.slice(),
    turn: game.turn,
    captures: { black: game.captures.black, white: game.captures.white },
    seen: game.seen.slice(),
    passes: game.passes,
    phase: game.phase,
    dead: game.dead.slice(),
    last: game.last,
    winner: game.winner,
    resigned: game.resigned,
    score: game.score,
  };
}

function tryPlace(game, row, col) {
  const { size, board } = game;
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= size || col >= size) {
    return { ok: false, reason: "off" };
  }
  const index = row * size + col;
  if (board[index]) return { ok: false, reason: "occupied" };

  const next = board.slice();
  const color = game.turn;
  const foe = other(color);
  next[index] = color;

  let captured = 0;
  const checked = new Uint8Array(next.length);
  for (const neighbor of neighbors(size, index)) {
    if (next[neighbor] !== foe || checked[neighbor]) continue;
    const group = groupAt(next, size, neighbor);
    for (const stone of group.stones) checked[stone] = 1;
    if (group.libs.size === 0) {
      for (const stone of group.stones) next[stone] = 0;
      captured += group.stones.length;
    }
  }

  if (groupAt(next, size, index).libs.size === 0) return { ok: false, reason: "suicide" };

  const key = hashBoard(next);
  if (game.seen.includes(key)) return { ok: false, reason: "ko" };
  return { ok: true, board: next, captured, key };
}

export function canPlay(game, row, col) {
  if (game.phase !== "play") return false;
  return tryPlace(game, row, col).ok;
}

export function play(game, row, col) {
  if (game.phase !== "play") return { ok: false, reason: "over" };
  const placed = tryPlace(game, row, col);
  if (!placed.ok) return placed;
  const color = game.turn;
  return {
    ok: true,
    game: {
      ...game,
      board: placed.board,
      turn: other(color),
      captures: {
        black: game.captures.black,
        white: game.captures.white,
        [color]: game.captures[color] + placed.captured,
      },
      seen: game.seen.concat(placed.key),
      history: game.history.concat(snapshot(game)),
      passes: 0,
      phase: "play",
      dead: [],
      last: { row, col },
      winner: null,
      resigned: null,
      score: null,
    },
  };
}

export function scorePosition(board, size, komi, dead) {
  const stones = board.slice();
  for (const index of dead) {
    if (stones[index]) stones[index] = 0;
  }

  let black = 0;
  let white = komi;
  const territory = new Array(board.length).fill(0);
  for (let index = 0; index < stones.length; index += 1) {
    if (stones[index] === BLACK) black += 1;
    else if (stones[index] === WHITE) white += 1;
  }

  const visited = new Uint8Array(stones.length);
  for (let index = 0; index < stones.length; index += 1) {
    if (stones[index] || visited[index]) continue;
    const region = [];
    let touchBlack = false;
    let touchWhite = false;
    const stack = [index];
    visited[index] = 1;
    while (stack.length) {
      const current = stack.pop();
      region.push(current);
      for (const neighbor of neighbors(size, current)) {
        const value = stones[neighbor];
        if (!value) {
          if (!visited[neighbor]) {
            visited[neighbor] = 1;
            stack.push(neighbor);
          }
        } else if (value === BLACK) touchBlack = true;
        else touchWhite = true;
      }
    }
    if (touchBlack === touchWhite) continue;
    const owner = touchBlack ? BLACK : WHITE;
    if (owner === BLACK) black += region.length;
    else white += region.length;
    for (const point of region) territory[point] = owner;
  }

  return { black, white, komi, territory };
}

function withScore(game, dead) {
  return scorePosition(game.board, game.size, game.komi, dead);
}

export function pass(game) {
  if (game.phase !== "play") return game;
  const next = {
    ...game,
    turn: other(game.turn),
    history: game.history.concat(snapshot(game)),
    passes: game.passes + 1,
    last: { pass: true },
    dead: [],
    score: null,
    winner: null,
    resigned: null,
  };
  if (next.passes < 2) return next;
  return { ...next, phase: "mark", score: withScore(next, []) };
}

export function undo(game) {
  if (!game.history.length) return game;
  const previous = game.history[game.history.length - 1];
  return { ...previous, history: game.history.slice(0, -1) };
}

export function resign(game, color) {
  if (game.phase === "done") return game;
  if (color !== BLACK && color !== WHITE) return game;
  return {
    ...game,
    history: game.history.concat(snapshot(game)),
    phase: "done",
    resigned: color,
    winner: other(color),
  };
}

export function toggleDead(game, row, col) {
  if (game.phase !== "mark") return game;
  const index = row * game.size + col;
  if (!game.board[index]) return game;
  const { stones } = groupAt(game.board, game.size, index);
  const dead = new Set(game.dead);
  const clear = stones.every((stone) => dead.has(stone));
  for (const stone of stones) {
    if (clear) dead.delete(stone);
    else dead.add(stone);
  }
  const list = [...dead];
  return { ...game, dead: list, score: withScore(game, dead) };
}

export function acceptScore(game) {
  if (game.phase !== "mark" || !game.score) return game;
  const { black, white } = game.score;
  const winner = black > white ? BLACK : white > black ? WHITE : "draw";
  return {
    ...game,
    history: game.history.concat(snapshot(game)),
    phase: "done",
    winner,
    resigned: null,
  };
}

export function resume(game) {
  if (game.phase !== "mark") return game;
  return {
    ...game,
    history: game.history.concat(snapshot(game)),
    phase: "play",
    passes: 0,
    dead: [],
    score: null,
  };
}
