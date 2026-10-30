// Otrio: a 3×3 board, three ring sizes, four colors.
// A win is one color only — teammates' colors never combine.
// 1. Three rings of one size in a row, column, or diagonal.
// 2. Small, medium, large in that order along a line, either direction.
// 3. All three sizes stacked in one circle.

export const COLOR_IDS = ["tan", "white", "black", "blue"];
export const SIZE_NAMES = ["small", "medium", "large"];

export function winPhrase(win) {
  if (win?.type === "same") {
    return `three ${SIZE_NAMES[win.size]} rings in a row`;
  }
  if (win?.type === "order") {
    return win.rising
      ? "three in a row, smallest to biggest"
      : "three in a row, biggest to smallest";
  }
  return "three stacked in one circle";
}

export function winSummary(wins) {
  const lines = (Array.isArray(wins) ? wins : []).map(winPhrase);
  if (lines.length < 2) return lines[0] ? `${lines[0]}.` : "";
  if (lines.length === 2) return `${lines[0]} and ${lines[1]}.`;
  return `${lines.slice(0, -1).join(", ")}, and ${lines.at(-1)}.`;
}

const LINES = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

function emptyBoard() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => [null, null, null]),
  );
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => [...cell]));
}

function cloneStock(stock) {
  return Object.fromEntries(
    Object.entries(stock).map(([id, counts]) => [id, [...counts]]),
  );
}

export function activeColors(players, sittingOut) {
  if (players === 3 && COLOR_IDS.includes(sittingOut)) {
    return COLOR_IDS.filter((id) => id !== sittingOut);
  }
  return [...COLOR_IDS];
}

export function ownersFor(players, sittingOut) {
  if (players === 2) {
    return { tan: 0, black: 0, white: 1, blue: 1 };
  }
  const owners = {};
  activeColors(players, sittingOut).forEach((id, index) => {
    owners[id] = index;
  });
  return owners;
}

function canColorMove(board, stock, color) {
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      for (let size = 0; size < 3; size += 1) {
        if (!board[r][c][size] && stock[color][size] > 0) return true;
      }
    }
  }
  return false;
}

function firstMover(active, from, board, stock) {
  const skipped = [];
  const start = active.indexOf(from);
  if (start < 0) return { color: null, skipped };
  for (let step = 0; step < active.length; step += 1) {
    const color = active[(start + step) % active.length];
    if (canColorMove(board, stock, color)) return { color, skipped };
    skipped.push(color);
  }
  return { color: null, skipped };
}

export function createMatch({
  players = 2,
  sittingOut = "tan",
  start = "tan",
} = {}) {
  const count = players === 3 || players === 4 ? players : 2;
  const out = count === 3 && COLOR_IDS.includes(sittingOut) ? sittingOut : null;
  const active = activeColors(count, out);
  const startColor = active.includes(start) ? start : active[0];
  const board = emptyBoard();
  const stock = {};
  for (const id of COLOR_IDS) {
    stock[id] = active.includes(id) ? [3, 3, 3] : [0, 0, 0];
  }
  const moved = firstMover(active, startColor, board, stock);
  return {
    players: count,
    sittingOut: out,
    start: startColor,
    active,
    owners: ownersFor(count, out),
    board,
    stock,
    turn: moved.color,
    skipped: [],
    history: [],
    winner: null,
    wins: [],
    draw: !moved.color,
  };
}

export function canPlace(state, r, c, size) {
  if (!state || state.winner || state.draw || !state.turn) return false;
  if (!Number.isInteger(r) || r < 0 || r > 2) return false;
  if (!Number.isInteger(c) || c < 0 || c > 2) return false;
  if (size !== 0 && size !== 1 && size !== 2) return false;
  if (state.board[r][c][size]) return false;
  return state.stock[state.turn][size] > 0;
}

export function findWins(board) {
  const wins = [];
  for (const line of LINES) {
    for (let size = 0; size < 3; size += 1) {
      const colors = line.map(([r, c]) => board[r][c][size]);
      if (colors[0] && colors.every((color) => color === colors[0])) {
        wins.push({
          type: "same",
          color: colors[0],
          size,
          rising: null,
          cells: line.map(([r, c]) => ({ r, c, size })),
        });
      }
    }
    for (const sizes of [
      [0, 1, 2],
      [2, 1, 0],
    ]) {
      const colors = line.map(([r, c], index) => board[r][c][sizes[index]]);
      if (colors[0] && colors.every((color) => color === colors[0])) {
        wins.push({
          type: "order",
          color: colors[0],
          size: null,
          rising: sizes[0] === 0,
          cells: line.map(([r, c], index) => ({ r, c, size: sizes[index] })),
        });
      }
    }
  }
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const colors = [0, 1, 2].map((size) => board[r][c][size]);
      if (colors[0] && colors.every((color) => color === colors[0])) {
        wins.push({
          type: "stack",
          color: colors[0],
          size: null,
          rising: null,
          cells: [0, 1, 2].map((size) => ({ r, c, size })),
        });
      }
    }
  }
  return wins;
}

export function place(state, r, c, size) {
  if (!canPlace(state, r, c, size)) return state;
  const board = cloneBoard(state.board);
  board[r][c][size] = state.turn;
  const stock = cloneStock(state.stock);
  stock[state.turn][size] -= 1;
  const history = state.history.concat([{ r, c, size, color: state.turn }]);
  const wins = findWins(board).filter((win) => win.color === state.turn);
  const next = {
    ...state,
    board,
    stock,
    history,
    skipped: [],
    winner: null,
    wins: [],
    draw: false,
  };
  if (wins.length) {
    return { ...next, winner: state.turn, wins };
  }
  const index = state.active.indexOf(state.turn);
  const from = state.active[(index + 1) % state.active.length];
  const moved = firstMover(state.active, from, board, stock);
  if (!moved.color) return { ...next, draw: true, skipped: moved.skipped };
  return { ...next, turn: moved.color, skipped: moved.skipped };
}

export function undo(state) {
  if (!state.history.length) return state;
  return state.history.slice(0, -1).reduce(
    (current, move) => place(current, move.r, move.c, move.size),
    createMatch({
      players: state.players,
      sittingOut: state.sittingOut ?? "tan",
      start: state.start,
    }),
  );
}
