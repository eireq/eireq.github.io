/**
 * HeXO board math.
 *
 * Letters a–o run one diagonal (screen: up-right). Numbers 1–15 run the
 * other (screen: down-right). h8 is the center of the radius-7 hex.
 * Cube coords satisfy q + r + s = 0, and a straight line holds one of them fixed.
 */

export type Player = "X" | "O";

export type Coord = {
  letter: string;
  number: number;
};

export type Cell = Coord & {
  key: string;
  q: number;
  r: number;
  s: number;
  x: number;
  y: number;
  points: string;
};

export type Label = {
  text: string;
  x: number;
  y: number;
};

export type Position = {
  stones: Record<string, Player>;
  turn: Player;
  winner: Player | "draw" | null;
  lines: Coord[][];
};

export const LETTERS = "abcdefghijklmno";
const HEX = 20;
const DRAW = HEX * 0.93;
const SQRT3 = Math.sqrt(3);

const STEP_LETTER = { x: HEX * (SQRT3 / 2), y: -HEX * 1.5 };
const STEP_NUMBER = { x: HEX * (SQRT3 / 2), y: HEX * 1.5 };

/** One positive step along each of the three hex axes, in (letter, number). */
const AXES: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
];

export function isValidHex(letter: string, number: number): boolean {
  if (typeof letter !== "string" || typeof number !== "number") return false;
  if (!Number.isInteger(number) || letter.length !== 1) return false;
  const index = LETTERS.indexOf(letter.toLowerCase());
  if (index < 0) return false;
  const min = Math.max(1, index - 6);
  const max = Math.min(15, index + 8);
  return number >= min && number <= max;
}

export function keyOf(letter: string, number: number): string {
  return `${letter.toLowerCase()}${number}`;
}

export function playerOf(index: number): Player {
  return index % 2 === 0 ? "X" : "O";
}

function letterIndex(letter: string): number {
  return LETTERS.indexOf(letter.toLowerCase());
}

function cube(index: number, number: number) {
  const q = index - 7;
  const r = number - 1 - index;
  const s = -q - r;
  return { q, r, s };
}

function pixel(q: number, r: number) {
  return {
    x: HEX * (SQRT3 * q + (SQRT3 / 2) * r),
    y: HEX * 1.5 * r,
  };
}

function polygon(x: number, y: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    pts.push(
      `${(x + DRAW * Math.cos(angle)).toFixed(2)},${(y + DRAW * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

function at(index: number, number: number): Coord | null {
  if (index < 0 || index >= LETTERS.length) return null;
  const letter = LETTERS[index];
  if (!isValidHex(letter, number)) return null;
  return { letter, number };
}

function buildBoard() {
  const cells: Cell[] = [];
  const byKey: Record<string, Cell> = {};

  for (let index = 0; index < LETTERS.length; index += 1) {
    const letter = LETTERS[index];
    for (let number = 1; number <= 15; number += 1) {
      if (!isValidHex(letter, number)) continue;
      const { q, r, s } = cube(index, number);
      const { x, y } = pixel(q, r);
      const cell: Cell = {
        letter,
        number,
        key: keyOf(letter, number),
        q,
        r,
        s,
        x,
        y,
        points: polygon(x, y),
      };
      cells.push(cell);
      byKey[cell.key] = cell;
    }
  }

  const byQ = new Map<number, string[]>();
  const byR = new Map<number, string[]>();
  const byS = new Map<number, string[]>();
  for (const cell of cells) {
    pushGroup(byQ, cell.q, cell.key);
    pushGroup(byR, cell.r, cell.key);
    pushGroup(byS, cell.s, cell.key);
  }

  const guides: Record<string, string[]> = {};
  for (const cell of cells) {
    guides[cell.key] = [
      ...new Set([
        ...(byQ.get(cell.q) ?? []),
        ...(byR.get(cell.r) ?? []),
        ...(byS.get(cell.s) ?? []),
      ]),
    ];
  }

  const labels: Label[] = [];
  const out = 0.92;
  for (const letter of LETTERS) {
    let edge: Cell | null = null;
    for (const cell of cells) {
      if (cell.letter !== letter) continue;
      if (!edge || cell.number > edge.number) edge = cell;
    }
    if (!edge) continue;
    labels.push({
      text: letter,
      x: edge.x + STEP_NUMBER.x * out,
      y: edge.y + STEP_NUMBER.y * out,
    });
  }

  for (let number = 1; number <= 15; number += 1) {
    let edge: Cell | null = null;
    for (const cell of cells) {
      if (cell.number !== number) continue;
      if (!edge || cell.letter > edge.letter) edge = cell;
    }
    if (!edge) continue;
    labels.push({
      text: String(number),
      x: edge.x + STEP_LETTER.x * out,
      y: edge.y + STEP_LETTER.y * out,
    });
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number, pad: number) => {
    minX = Math.min(minX, x - pad);
    minY = Math.min(minY, y - pad);
    maxX = Math.max(maxX, x + pad);
    maxY = Math.max(maxY, y + pad);
  };
  for (const cell of cells) {
    for (let i = 0; i < 6; i += 1) {
      const angle = ((60 * i - 30) * Math.PI) / 180;
      include(cell.x + HEX * Math.cos(angle), cell.y + HEX * Math.sin(angle), 0);
    }
  }
  for (const label of labels) include(label.x, label.y, 18);

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    hex: HEX,
    width,
    height,
    viewBox: `${minX} ${minY} ${width} ${height}`,
    cells,
    labels,
    guides,
    byKey,
  };
}

function pushGroup(map: Map<number, string[]>, id: number, key: string) {
  const list = map.get(id);
  if (list) list.push(key);
  else map.set(id, [key]);
}

export const BOARD = buildBoard();

export function winningLines(
  stones: Record<string, Player>,
  letter: string,
  number: number,
): Coord[][] {
  const key = keyOf(letter, number);
  const player = stones[key];
  if (!player) return [];
  const origin = letterIndex(letter);
  const lines: Coord[][] = [];

  for (const [dL, dN] of AXES) {
    const back: Coord[] = [];
    for (let step = 1; ; step += 1) {
      const next = at(origin - dL * step, number - dN * step);
      if (!next || stones[keyOf(next.letter, next.number)] !== player) break;
      back.push(next);
    }
    const forward: Coord[] = [];
    for (let step = 1; ; step += 1) {
      const next = at(origin + dL * step, number + dN * step);
      if (!next || stones[keyOf(next.letter, next.number)] !== player) break;
      forward.push(next);
    }
    const run = [...back.reverse(), { letter: letter.toLowerCase(), number }, ...forward];
    if (run.length >= 6) lines.push(run);
  }

  return lines;
}

export function applyMoves(moves: Coord[]): Position | null {
  const stones: Record<string, Player> = {};
  let lines: Coord[][] = [];
  let winner: Position["winner"] = null;

  for (let i = 0; i < moves.length; i += 1) {
    if (winner) return null;
    const letter = moves[i].letter.toLowerCase();
    const number = moves[i].number;
    if (!isValidHex(letter, number)) return null;
    const key = keyOf(letter, number);
    if (stones[key]) return null;
    const player = playerOf(i);
    stones[key] = player;
    lines = winningLines(stones, letter, number);
    if (lines.length) winner = player;
    else if (Object.keys(stones).length === BOARD.cells.length) winner = "draw";
  }

  return {
    stones,
    turn: playerOf(moves.length),
    winner,
    lines: winner && winner !== "draw" ? lines : [],
  };
}

export function encodeReplay(moves: Coord[]): string {
  if (!moves.length) return "";
  const raw = moves.map((move) => `${move.letter}${move.number}`).join(".");
  return btoa(raw).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function decodeReplay(value: string): Coord[] | null {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const raw = atob(padded).toLowerCase();
    if (!raw) return [];
    const moves: Coord[] = [];
    for (const part of raw.split(".")) {
      const match = /^([a-o])(\d{1,2})$/.exec(part);
      if (!match) return null;
      moves.push({ letter: match[1], number: Number(match[2]) });
    }
    return applyMoves(moves) ? moves : null;
  } catch {
    return null;
  }
}

function radiusOf(cell: Cell): number {
  return Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.s));
}

function countDirection(
  stones: Record<string, Player>,
  index: number,
  number: number,
  dL: number,
  dN: number,
  player: Player,
): number {
  let total = 0;
  for (let step = 1; ; step += 1) {
    const next = at(index + dL * step, number + dN * step);
    if (!next || stones[keyOf(next.letter, next.number)] !== player) break;
    total += 1;
  }
  return total;
}

function winsIf(
  stones: Record<string, Player>,
  cell: Cell,
  player: Player,
): boolean {
  const draft = { ...stones, [cell.key]: player };
  return winningLines(draft, cell.letter, cell.number).length > 0;
}

function scoreMove(
  stones: Record<string, Player>,
  cell: Cell,
  player: Player,
  opponent: Player,
): number {
  const index = letterIndex(cell.letter);
  let score = (7 - radiusOf(cell)) * 6;
  let threats = 0;

  for (const [dL, dN] of AXES) {
    const own =
      countDirection(stones, index, cell.number, dL, dN, player) +
      countDirection(stones, index, cell.number, -dL, -dN, player);
    const block =
      countDirection(stones, index, cell.number, dL, dN, opponent) +
      countDirection(stones, index, cell.number, -dL, -dN, opponent);
    const ownLen = own + 1;
    const blockLen = block + 1;
    score += ownLen * ownLen * 10;
    score += blockLen * blockLen * 7;
    if (ownLen >= 5) threats += 1;
    if (ownLen >= 4) score += 40;
    if (blockLen >= 5) score += 220;
    else if (blockLen >= 4) score += 70;
  }

  if (threats >= 2) score += 1800;
  else if (threats === 1) score += 260;
  return score;
}

/** Practice opponent. Takes a win, blocks a loss, otherwise builds toward the center. */
export function chooseBotMove(
  stones: Record<string, Player>,
  player: Player,
): Coord | null {
  const empties = BOARD.cells.filter((cell) => !stones[cell.key]);
  if (!empties.length) return null;
  if (Object.keys(stones).length === 0 && BOARD.byKey.h8) {
    return { letter: "h", number: 8 };
  }

  const opponent: Player = player === "X" ? "O" : "X";

  for (const cell of empties) {
    if (winsIf(stones, cell, player)) {
      return { letter: cell.letter, number: cell.number };
    }
  }

  const blocks = empties.filter((cell) => winsIf(stones, cell, opponent));
  const pool = blocks.length ? blocks : empties;
  let best = pool[0];
  let bestScore = -Infinity;

  for (const cell of pool) {
    const score = scoreMove(stones, cell, player, opponent);
    const closer = radiusOf(cell) < radiusOf(best);
    if (score > bestScore || (score === bestScore && closer)) {
      bestScore = score;
      best = cell;
    }
  }

  return { letter: best.letter, number: best.number };
}
