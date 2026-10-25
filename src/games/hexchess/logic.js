// Gliński's hexagonal chess.
// 91 cells, files a–l with j skipped, ranks 1–11. Center is f6.
// White sits at the bottom. Pawns capture 60° off the file. No castling.

export const SIZE = 34;
export const FILES = "abcdefghikl";

const ROOK = [
  [1, -1, 0],
  [1, 0, -1],
  [0, 1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [0, -1, 1],
];

const BISHOP = [
  [2, -1, -1],
  [-1, 2, -1],
  [-1, -1, 2],
  [-2, 1, 1],
  [1, -2, 1],
  [1, 1, -2],
];

const KING = [...ROOK, ...BISHOP];

const KNIGHT = [
  [1, 2, -3],
  [2, 1, -3],
  [1, -3, 2],
  [2, -3, 1],
  [-3, 1, 2],
  [-3, 2, 1],
  [-1, -2, 3],
  [-2, -1, 3],
  [-1, 3, -2],
  [-2, 3, -1],
  [3, -1, -2],
  [3, -2, -1],
];

const WHITE_FORWARD = [0, 1, -1];
const BLACK_FORWARD = [0, -1, 1];
const WHITE_CAPTURE = [
  [1, 0, -1],
  [-1, 1, 0],
];
const BLACK_CAPTURE = [
  [1, -1, 0],
  [-1, 0, 1],
];

const PAWN_START = {
  w: new Set(["b1", "c2", "d3", "e4", "f5", "g4", "h3", "i2", "k1"]),
  b: new Set(["b7", "c7", "d7", "e7", "f7", "g7", "h7", "i7", "k7"]),
};

const VALUE = { q: 900, r: 500, b: 310, n: 300, p: 100, k: 0 };
const MATE = 100000;

const WHITE_BACK = [
  ["g1", "k"],
  ["e1", "q"],
  ["c1", "r"],
  ["i1", "r"],
  ["d1", "n"],
  ["h1", "n"],
  ["f1", "b"],
  ["f2", "b"],
  ["f3", "b"],
  ["b1", "p"],
  ["c2", "p"],
  ["d3", "p"],
  ["e4", "p"],
  ["f5", "p"],
  ["g4", "p"],
  ["h3", "p"],
  ["i2", "p"],
  ["k1", "p"],
];

const BLACK_BACK = [
  ["g10", "k"],
  ["e10", "q"],
  ["c8", "r"],
  ["i8", "r"],
  ["d9", "n"],
  ["h9", "n"],
  ["f9", "b"],
  ["f10", "b"],
  ["f11", "b"],
  ["b7", "p"],
  ["c7", "p"],
  ["d7", "p"],
  ["e7", "p"],
  ["f7", "p"],
  ["g7", "p"],
  ["h7", "p"],
  ["i7", "p"],
  ["k7", "p"],
];

function hexPoints(x, y) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i;
    pts.push(
      `${(x + SIZE * Math.cos(angle)).toFixed(2)},${(y + SIZE * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

function pixel(q, r) {
  return {
    x: SIZE * 1.5 * q,
    y: -SIZE * Math.sqrt(3) * (q / 2 + r),
  };
}

const built = [];
const lookup = Array.from({ length: 11 }, () => Array(11).fill(-1));
const byKey = {};

for (let q = -5; q <= 5; q += 1) {
  const low = q >= 0 ? -5 : -5 - q;
  const high = q >= 0 ? 5 - q : 5;
  for (let r = low; r <= high; r += 1) {
    const rank = r - low + 1;
    const file = FILES[q + 5];
    const key = `${file}${rank}`;
    const { x, y } = pixel(q, r);
    const cell = {
      index: built.length,
      q,
      r,
      s: -q - r,
      file,
      rank,
      key,
      x,
      y,
      color: (((q - r) % 3) + 3) % 3,
      points: hexPoints(x, y),
    };
    lookup[q + 5][r + 5] = cell.index;
    byKey[key] = cell;
    built.push(cell);
  }
}

export const cells = built;
export const cellByKey = byKey;

export const fileLabels = FILES.split("").map((file) => {
  const cell = byKey[`${file}1`];
  return { text: file, x: cell.x, y: cell.y + SIZE + 16 };
});

export const rankLabels = [];
for (let rank = 1; rank <= 11; rank += 1) {
  let west = null;
  for (const cell of cells) {
    if (cell.rank === rank && (!west || cell.q < west.q)) west = cell;
  }
  rankLabels.push({
    text: String(rank),
    x: west.x - SIZE - 14,
    y: west.y,
  });
}

let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
for (const cell of cells) {
  minX = Math.min(minX, cell.x - SIZE);
  maxX = Math.max(maxX, cell.x + SIZE);
  minY = Math.min(minY, cell.y - SIZE);
  maxY = Math.max(maxY, cell.y + SIZE);
}
const pad = 42;
export const boardBox = {
  viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
  width: maxX - minX + pad * 2,
  height: maxY - minY + pad * 2,
};

function step(index, dir) {
  const cell = cells[index];
  const q = cell.q + dir[0];
  const r = cell.r + dir[1];
  if (q < -5 || q > 5 || r < -5 || r > 5) return -1;
  return lookup[q + 5][r + 5];
}

function opposite(color) {
  return color === "w" ? "b" : "w";
}

function kingIndex(board, color) {
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (piece && piece.color === color && piece.kind === "k") return i;
  }
  return -1;
}

function isPiece(board, index, color, kind) {
  const piece = board[index];
  return Boolean(piece && piece.color === color && piece.kind === kind);
}

function rayHits(board, index, by, dirs, kind) {
  for (const dir of dirs) {
    let to = step(index, dir);
    while (to >= 0) {
      const piece = board[to];
      if (piece) {
        if (piece.color === by && (piece.kind === kind || piece.kind === "q")) return true;
        break;
      }
      to = step(to, dir);
    }
  }
  return false;
}

export function attacked(board, index, by) {
  for (const dir of KNIGHT) {
    const to = step(index, dir);
    if (to >= 0 && isPiece(board, to, by, "n")) return true;
  }
  const captures = by === "w" ? WHITE_CAPTURE : BLACK_CAPTURE;
  for (const dir of captures) {
    const to = step(index, [-dir[0], -dir[1], -dir[2]]);
    if (to >= 0 && isPiece(board, to, by, "p")) return true;
  }
  for (const dir of KING) {
    const to = step(index, dir);
    if (to >= 0 && isPiece(board, to, by, "k")) return true;
  }
  if (rayHits(board, index, by, ROOK, "r")) return true;
  if (rayHits(board, index, by, BISHOP, "b")) return true;
  return false;
}

export function inCheck(pos) {
  const king = kingIndex(pos.board, pos.turn);
  if (king < 0) return true;
  return attacked(pos.board, king, opposite(pos.turn));
}

function blankMove(from, to, kind) {
  return {
    from,
    to,
    kind,
    capture: false,
    promotion: null,
    enPassant: false,
    epCapture: -1,
    doubleStep: false,
    epSquare: -1,
  };
}

function isPromotion(color, index) {
  const cell = cells[index];
  if (color === "w") return cell.rank === 11 - Math.abs(cell.q);
  return cell.rank === 1;
}

function pushPawn(moves, color, from, to, fields) {
  const base = { ...blankMove(from, to, "p"), ...fields };
  if (isPromotion(color, to)) {
    for (const promotion of ["q", "r", "b", "n"]) {
      moves.push({ ...base, promotion, doubleStep: false, epSquare: -1 });
    }
    return;
  }
  moves.push(base);
}

function pushSlider(moves, board, color, from, dirs, kind) {
  for (const dir of dirs) {
    let to = step(from, dir);
    while (to >= 0) {
      const occupant = board[to];
      if (!occupant) {
        moves.push(blankMove(from, to, kind));
      } else {
        if (occupant.color !== color && occupant.kind !== "k") {
          moves.push({ ...blankMove(from, to, kind), capture: true });
        }
        break;
      }
      to = step(to, dir);
    }
  }
}

function pushLeaper(moves, board, color, from, dirs, kind) {
  for (const dir of dirs) {
    const to = step(from, dir);
    if (to < 0) continue;
    const occupant = board[to];
    if (!occupant) moves.push(blankMove(from, to, kind));
    else if (occupant.color !== color && occupant.kind !== "k") {
      moves.push({ ...blankMove(from, to, kind), capture: true });
    }
  }
}

function pseudoMoves(pos) {
  const board = pos.board;
  const color = pos.turn;
  const moves = [];
  const forward = color === "w" ? WHITE_FORWARD : BLACK_FORWARD;
  const captures = color === "w" ? WHITE_CAPTURE : BLACK_CAPTURE;
  const enemyForward = color === "w" ? BLACK_FORWARD : WHITE_FORWARD;
  for (let from = 0; from < board.length; from += 1) {
    const piece = board[from];
    if (!piece || piece.color !== color) continue;
    if (piece.kind === "p") {
      const one = step(from, forward);
      if (one >= 0 && !board[one]) {
        pushPawn(moves, color, from, one, {});
        if (PAWN_START[color].has(cells[from].key)) {
          const two = step(one, forward);
          if (two >= 0 && !board[two]) {
            pushPawn(moves, color, from, two, { doubleStep: true, epSquare: one });
          }
        }
      }
      for (const dir of captures) {
        const to = step(from, dir);
        if (to < 0) continue;
        const occupant = board[to];
        if (occupant && occupant.color !== color && occupant.kind !== "k") {
          pushPawn(moves, color, from, to, { capture: true });
        } else if (!occupant && pos.ep === to) {
          const capAt = step(to, enemyForward);
          const victim = capAt >= 0 ? board[capAt] : null;
          if (victim && victim.color !== color && victim.kind === "p") {
            pushPawn(moves, color, from, to, {
              capture: true,
              enPassant: true,
              epCapture: capAt,
            });
          }
        }
      }
    } else if (piece.kind === "n") {
      pushLeaper(moves, board, color, from, KNIGHT, "n");
    } else if (piece.kind === "k") {
      pushLeaper(moves, board, color, from, KING, "k");
    } else if (piece.kind === "r") {
      pushSlider(moves, board, color, from, ROOK, "r");
    } else if (piece.kind === "b") {
      pushSlider(moves, board, color, from, BISHOP, "b");
    } else if (piece.kind === "q") {
      pushSlider(moves, board, color, from, ROOK, "q");
      pushSlider(moves, board, color, from, BISHOP, "q");
    }
  }
  return moves;
}

function playOnto(board, move) {
  const fromPiece = board[move.from];
  const toPiece = board[move.to];
  const epPiece = move.enPassant ? board[move.epCapture] : null;
  board[move.from] = null;
  if (move.enPassant) board[move.epCapture] = null;
  board[move.to] = move.promotion
    ? { color: fromPiece.color, kind: move.promotion }
    : fromPiece;
  return () => {
    board[move.from] = fromPiece;
    board[move.to] = toPiece;
    if (move.enPassant) board[move.epCapture] = epPiece;
  };
}

export function legalMoves(pos) {
  const color = pos.turn;
  const enemy = opposite(color);
  const moves = pseudoMoves(pos);
  const legal = [];
  for (const move of moves) {
    const undo = playOnto(pos.board, move);
    const king = kingIndex(pos.board, color);
    if (king >= 0 && !attacked(pos.board, king, enemy)) legal.push(move);
    undo();
  }
  return legal;
}

export function applyMove(pos, move) {
  const piece = pos.board[move.from];
  const board = pos.board.slice();
  playOnto(board, move);
  return {
    board,
    turn: opposite(piece.color),
    ep: move.doubleStep ? move.epSquare : null,
    halfmove: piece.kind === "p" || move.capture ? 0 : pos.halfmove + 1,
    fullmove: piece.color === "b" ? pos.fullmove + 1 : pos.fullmove,
  };
}

function placeAll(board, color, list) {
  for (const [key, kind] of list) {
    board[byKey[key].index] = { color, kind };
  }
}

export function startPosition() {
  const board = cells.map(() => null);
  placeAll(board, "w", WHITE_BACK);
  placeAll(board, "b", BLACK_BACK);
  return { board, turn: "w", ep: null, halfmove: 0, fullmove: 1 };
}

export function makePosition(list, turn = "w", epKey = null) {
  const board = cells.map(() => null);
  for (const [key, color, kind] of list) {
    const cell = byKey[key];
    if (!cell) throw new Error(`unknown square ${key}`);
    board[cell.index] = { color, kind };
  }
  return {
    board,
    turn,
    ep: epKey ? byKey[epKey].index : null,
    halfmove: 0,
    fullmove: 1,
  };
}

export function positionKey(pos) {
  let text = pos.turn;
  text += pos.ep == null ? "-" : cells[pos.ep].key;
  for (const piece of pos.board) {
    text += piece ? (piece.color === "w" ? piece.kind.toUpperCase() : piece.kind) : ".";
  }
  return text;
}

function insufficient(board) {
  const rest = { w: [], b: [] };
  for (const piece of board) {
    if (!piece || piece.kind === "k") continue;
    rest[piece.color].push(piece.kind);
  }
  const weak = (list) =>
    list.length === 0 || (list.length === 1 && (list[0] === "n" || list[0] === "b"));
  return weak(rest.w) && weak(rest.b);
}

export function analyze(pos, keys = []) {
  const moves = legalMoves(pos);
  const check = inCheck(pos);
  if (!moves.length) {
    return check
      ? { type: "mate", winner: opposite(pos.turn), check: true, moves }
      : { type: "stalemate", winner: opposite(pos.turn), check: false, moves };
  }
  if (pos.halfmove >= 100) return { type: "fifty", winner: null, check, moves };
  const key = positionKey(pos);
  let seen = 0;
  for (const item of keys) if (item === key) seen += 1;
  if (seen >= 3) return { type: "repeat", winner: null, check, moves };
  if (insufficient(pos.board)) return { type: "material", winner: null, check, moves };
  return { type: "play", winner: null, check, moves };
}

const LETTER = { k: "K", q: "Q", r: "R", b: "B", n: "N", p: "" };

export function notation(before, move, after) {
  const from = cells[move.from];
  const to = cells[move.to];
  const piece = before.board[move.from];
  const siblings = legalMoves(before).filter((other) => {
    if (other.from === move.from || other.to !== move.to) return false;
    return before.board[other.from]?.kind === piece.kind;
  });
  let mark = "";
  if (piece.kind !== "p" && siblings.length) {
    const sameFile = siblings.some((other) => cells[other.from].file === from.file);
    if (!sameFile) mark = from.file;
    else if (siblings.some((other) => cells[other.from].rank === from.rank)) mark = from.key;
    else mark = String(from.rank);
  } else if (piece.kind === "p" && move.capture) {
    mark = from.file;
  }
  const result = analyze(after);
  const suffix = result.type === "mate" ? "#" : result.check ? "+" : "";
  const promo = move.promotion ? `=${LETTER[move.promotion]}` : "";
  const capture = move.capture ? "x" : "";
  if (piece.kind === "p" && !capture) return `${to.key}${promo}${suffix}`;
  return `${LETTER[piece.kind]}${mark}${capture}${to.key}${promo}${suffix}`;
}

function bishopBonus(count) {
  if (count >= 3) return 40;
  if (count === 2) return 18;
  return 0;
}

function evaluate(pos) {
  let white = 0;
  const bishops = { w: 0, b: 0 };
  for (let i = 0; i < pos.board.length; i += 1) {
    const piece = pos.board[i];
    if (!piece) continue;
    const cell = cells[i];
    let value = VALUE[piece.kind];
    const dist = Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.s));
    if (piece.kind === "p") {
      const span = 11 - Math.abs(cell.q);
      const forward = piece.color === "w" ? cell.rank : span + 1 - cell.rank;
      value += forward * 4;
    } else if (piece.kind !== "k") {
      value += (5 - dist) * 2;
    }
    if (piece.kind === "b") bishops[piece.color] += 1;
    white += piece.color === "w" ? value : -value;
  }
  white += bishopBonus(bishops.w);
  white -= bishopBonus(bishops.b);
  let score = pos.turn === "w" ? white : -white;
  if (inCheck(pos)) score -= 28;
  return score;
}

function moveRank(pos, move) {
  let score = 0;
  if (move.promotion === "q") score += 900;
  else if (move.promotion) score += 400;
  if (move.capture) {
    const victim = move.enPassant ? "p" : pos.board[move.to]?.kind || "p";
    score += 10 * VALUE[victim] - VALUE[move.kind];
  }
  return score;
}

function orderMoves(pos, moves) {
  return moves.slice().sort((a, b) => moveRank(pos, b) - moveRank(pos, a));
}

function quiesce(pos, alpha, beta, ply, qdepth) {
  const moves = legalMoves(pos);
  if (!moves.length) return inCheck(pos) ? -MATE + ply : -7000;
  if (pos.halfmove >= 100) return 0;
  const stand = evaluate(pos);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qdepth <= 0) return alpha;
  const loud = orderMoves(
    pos,
    moves.filter((move) => move.capture || move.promotion),
  );
  for (const move of loud) {
    const score = -quiesce(applyMove(pos, move), -beta, -alpha, ply + 1, qdepth - 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function search(pos, depth, alpha, beta, ply) {
  if (depth <= 0) return quiesce(pos, alpha, beta, ply, 1);
  const moves = orderMoves(pos, legalMoves(pos));
  if (!moves.length) return inCheck(pos) ? -MATE + ply : -7000;
  if (pos.halfmove >= 100) return 0;
  let best = -Infinity;
  for (const move of moves) {
    const score = -search(applyMove(pos, move), depth - 1, -beta, -alpha, ply + 1);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export function chooseBotMove(pos) {
  const moves = orderMoves(pos, legalMoves(pos));
  if (!moves.length) return null;
  let best = -Infinity;
  let alpha = -Infinity;
  const scored = [];
  for (const move of moves) {
    const score = -search(applyMove(pos, move), 1, -Infinity, -alpha, 1);
    scored.push({ move, score });
    if (score > best) best = score;
    if (score > alpha) alpha = score;
  }
  const pool = scored.filter((item) => item.score >= best - 12);
  return pool[Math.floor(Math.random() * pool.length)].move;
}
