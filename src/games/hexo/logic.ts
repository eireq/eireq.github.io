/**
 * HeXO board math.
 *
 * Letters run one diagonal (screen: up-right). Numbers run the other
 * (screen: down-right). Base 8 is the 169-cell hex, center h8.
 * Base 13 is the 469-cell hex, center m13.
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

export const BOARD_SIZES = [8, 13] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

type Metrics = {
  size: BoardSize;
  letters: string;
  span: number;
  centerIndex: number;
  centerNumber: number;
  radius: number;
  center: string;
};

export function asSize(value: unknown): BoardSize {
  return value === 13 || value === "13" ? 13 : 8;
}

function metrics(size: BoardSize = 8): Metrics {
  const span = size * 2 - 1;
  const letters = ALPHABET.slice(0, span);
  const centerIndex = size - 1;
  const centerNumber = size;
  return {
    size,
    letters,
    span,
    centerIndex,
    centerNumber,
    radius: size - 1,
    center: `${letters[centerIndex]}${centerNumber}`,
  };
}

/** Letters of the base-8 board. */
export const LETTERS = metrics(8).letters;

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

export function isValidHex(letter: string, number: number, size: BoardSize = 8): boolean {
  if (typeof letter !== "string" || typeof number !== "number") return false;
  if (!Number.isInteger(number) || letter.length !== 1) return false;
  const spec = metrics(asSize(size));
  const index = spec.letters.indexOf(letter.toLowerCase());
  if (index < 0) return false;
  const min = Math.max(1, index - (spec.radius - 1));
  const max = Math.min(spec.span, index + spec.size);
  return number >= min && number <= max;
}

export function keyOf(letter: string, number: number): string {
  return `${letter.toLowerCase()}${number}`;
}

/** X opens with one stone. Every later turn is two stones, and O goes first. */
export function playerOf(index: number): Player {
  if (index <= 0) return "X";
  const pair = Math.floor((index - 1) / 2);
  return pair % 2 === 0 ? "O" : "X";
}

/** Stones the side to move still has to place. The opening turn is one stone. */
export function stonesLeft(moveCount: number): number {
  if (moveCount <= 0) return 1;
  return 2 - ((moveCount - 1) % 2);
}

/** Index of the first stone in the turn that contains `index`. */
export function turnStart(index: number): number {
  if (index <= 0) return 0;
  return 1 + Math.floor((index - 1) / 2) * 2;
}

function letterIndex(letter: string, size: BoardSize): number {
  return metrics(size).letters.indexOf(letter.toLowerCase());
}

function cube(index: number, number: number, size: BoardSize) {
  const spec = metrics(size);
  const q = index - spec.centerIndex;
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

function at(index: number, number: number, size: BoardSize): Coord | null {
  const spec = metrics(size);
  if (index < 0 || index >= spec.letters.length) return null;
  const letter = spec.letters[index];
  if (!isValidHex(letter, number, size)) return null;
  return { letter, number };
}

export type Board = ReturnType<typeof buildBoard>;

function buildBoard(size: BoardSize = 8) {
  const spec = metrics(size);
  const cells: Cell[] = [];
  const byKey: Record<string, Cell> = {};

  for (let index = 0; index < spec.letters.length; index += 1) {
    const letter = spec.letters[index];
    for (let number = 1; number <= spec.span; number += 1) {
      if (!isValidHex(letter, number, size)) continue;
      const { q, r, s } = cube(index, number, size);
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
  for (const letter of spec.letters) {
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

  for (let number = 1; number <= spec.span; number += 1) {
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
  for (const label of labels) include(label.x, label.y, 22);

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    size,
    center: spec.center,
    letters: spec.letters,
    span: spec.span,
    radius: spec.radius,
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

export const BOARD = buildBoard(8);
const BOARD13 = buildBoard(13);

export function boardFor(size: BoardSize = 8): Board {
  return asSize(size) === 13 ? BOARD13 : BOARD;
}

export function winningLines(
  stones: Record<string, Player>,
  letter: string,
  number: number,
  size: BoardSize = 8,
): Coord[][] {
  const spec = metrics(asSize(size));
  const key = keyOf(letter, number);
  const player = stones[key];
  if (!player) return [];
  const origin = letterIndex(letter, spec.size);
  const lines: Coord[][] = [];

  for (const [dL, dN] of AXES) {
    const back: Coord[] = [];
    for (let step = 1; ; step += 1) {
      const next = at(origin - dL * step, number - dN * step, spec.size);
      if (!next || stones[keyOf(next.letter, next.number)] !== player) break;
      back.push(next);
    }
    const forward: Coord[] = [];
    for (let step = 1; ; step += 1) {
      const next = at(origin + dL * step, number + dN * step, spec.size);
      if (!next || stones[keyOf(next.letter, next.number)] !== player) break;
      forward.push(next);
    }
    const run = [...back.reverse(), { letter: letter.toLowerCase(), number }, ...forward];
    if (run.length >= 6) lines.push(run);
  }

  return lines;
}

/**
 * Stones already on the board that the side to move can turn into a line of
 * 6 with the stones they have left this turn. Empty winning squares are left out.
 */
export function threatKeys(
  stones: Record<string, Player>,
  player: Player,
  left: number,
  size: BoardSize = 8,
): string[] {
  if (left <= 0) return [];
  const spec = metrics(asSize(size));
  const marked = new Set<string>();

  for (const [dL, dN] of AXES) {
    for (const cell of boardFor(spec.size).cells) {
      const index = letterIndex(cell.letter, spec.size);
      if (at(index - dL, cell.number - dN, spec.size)) continue;

      const line: string[] = [];
      for (let step = 0; ; step += 1) {
        const next = at(index + dL * step, cell.number + dN * step, spec.size);
        if (!next) break;
        line.push(keyOf(next.letter, next.number));
      }

      for (let start = 0; start < line.length; start += 1) {
        let empties = 0;
        let own = 0;
        for (let end = start; end < line.length; end += 1) {
          const owner = stones[line[end]];
          if (owner && owner !== player) break;
          if (owner === player) own += 1;
          else empties += 1;
          if (empties > left) break;
          if (end - start + 1 >= 6 && own > 0 && empties > 0) {
            for (let cursor = start; cursor <= end; cursor += 1) {
              if (stones[line[cursor]] === player) marked.add(line[cursor]);
            }
          }
        }
      }
    }
  }

  return [...marked];
}

export function applyMoves(moves: Coord[], size: BoardSize = 8): Position | null {
  const spec = metrics(asSize(size));
  const board = boardFor(spec.size);
  const stones: Record<string, Player> = {};
  let lines: Coord[][] = [];
  let winner: Position["winner"] = null;

  for (let i = 0; i < moves.length; i += 1) {
    if (winner) return null;
    const letter = moves[i].letter.toLowerCase();
    const number = moves[i].number;
    if (!isValidHex(letter, number, spec.size)) return null;
    const key = keyOf(letter, number);
    if (i === 0 && key !== spec.center) return null;
    if (stones[key]) return null;
    const player = playerOf(i);
    stones[key] = player;
    lines = winningLines(stones, letter, number, spec.size);
    if (lines.length) winner = player;
    else if (Object.keys(stones).length === board.cells.length) winner = "draw";
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

export function decodeReplay(value: string, size: BoardSize = 8): Coord[] | null {
  try {
    const spec = metrics(asSize(size));
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const raw = atob(padded).toLowerCase();
    if (!raw) return [];
    const moves: Coord[] = [];
    const pattern = new RegExp(`^([${spec.letters}])(\\d{1,2})$`);
    for (const part of raw.split(".")) {
      const match = pattern.exec(part);
      if (!match) return null;
      moves.push({ letter: match[1], number: Number(match[2]) });
    }
    return applyMoves(moves, spec.size) ? moves : null;
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
  size: BoardSize,
): number {
  let total = 0;
  for (let step = 1; ; step += 1) {
    const next = at(index + dL * step, number + dN * step, size);
    if (!next || stones[keyOf(next.letter, next.number)] !== player) break;
    total += 1;
  }
  return total;
}

function scoreMove(
  stones: Record<string, Player>,
  cell: Cell,
  player: Player,
  opponent: Player,
  size: BoardSize,
): number {
  const spec = metrics(size);
  const index = letterIndex(cell.letter, size);
  let score = (spec.radius - radiusOf(cell)) * 6;
  let threats = 0;

  for (const [dL, dN] of AXES) {
    const own =
      countDirection(stones, index, cell.number, dL, dN, player, size) +
      countDirection(stones, index, cell.number, -dL, -dN, player, size);
    const block =
      countDirection(stones, index, cell.number, dL, dN, opponent, size) +
      countDirection(stones, index, cell.number, -dL, -dN, opponent, size);
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

/**
 * Empty cells in a run the player can finish with exactly `want` more stones.
 * `want` 1 is a single move. `want` 2 is a pair played on the same turn.
 */
function holeCoverage(
  stones: Record<string, Player>,
  player: Player,
  want: number,
  size: BoardSize,
): Map<string, number> {
  const spec = metrics(asSize(size));
  const counts = new Map<string, number>();
  const seen = new Set<string>();

  for (const [dL, dN] of AXES) {
    for (const cell of boardFor(spec.size).cells) {
      const index = letterIndex(cell.letter, spec.size);
      if (at(index - dL, cell.number - dN, spec.size)) continue;

      const line: string[] = [];
      for (let step = 0; ; step += 1) {
        const next = at(index + dL * step, cell.number + dN * step, spec.size);
        if (!next) break;
        line.push(keyOf(next.letter, next.number));
      }

      for (let start = 0; start < line.length; start += 1) {
        const empties: string[] = [];
        let own = 0;
        for (let end = start; end < line.length; end += 1) {
          const owner = stones[line[end]];
          if (owner && owner !== player) break;
          if (owner === player) own += 1;
          else empties.push(line[end]);
          if (empties.length > want) break;
          if (end - start + 1 >= 6 && empties.length === want && own >= 6 - want) {
            const id = `${dL},${dN}:${[...empties].sort().join(".")}`;
            if (!seen.has(id)) {
              seen.add(id);
              for (const hole of empties) counts.set(hole, (counts.get(hole) ?? 0) + 1);
            }
            break;
          }
        }
      }
    }
  }

  return counts;
}

function bestCovered(
  counts: Map<string, number>,
  stones: Record<string, Player>,
  player: Player,
  opponent: Player,
  size: BoardSize,
): Cell | null {
  const board = boardFor(size);
  let best: Cell | null = null;
  let bestCount = 0;
  let bestScore = -Infinity;
  for (const [key, count] of counts) {
    const cell = board.byKey[key];
    if (!cell) continue;
    const score = scoreMove(stones, cell, player, opponent, size);
    const closer = best ? radiusOf(cell) < radiusOf(best) : false;
    if (
      !best ||
      count > bestCount ||
      (count === bestCount && (score > bestScore || (score === bestScore && closer)))
    ) {
      best = cell;
      bestCount = count;
      bestScore = score;
    }
  }
  return best;
}

/** Practice opponent. Takes a win, blocks a loss, otherwise builds toward the center. */
export function chooseBotMove(
  stones: Record<string, Player>,
  player: Player,
  size: BoardSize = 8,
): Coord | null {
  const spec = metrics(asSize(size));
  const board = boardFor(spec.size);
  const empties = board.cells.filter((cell) => !stones[cell.key]);
  if (!empties.length) return null;
  const opening = board.byKey[spec.center];
  if (Object.keys(stones).length === 0 && opening) {
    return { letter: opening.letter, number: opening.number };
  }

  const opponent: Player = player === "X" ? "O" : "X";
  const left = stonesLeft(Object.keys(stones).length);
  const pick = (counts: Map<string, number>) => {
    const cell = bestCovered(counts, stones, player, opponent, spec.size);
    return cell ? { letter: cell.letter, number: cell.number } : null;
  };

  const ownNow = holeCoverage(stones, player, 1, spec.size);
  if (ownNow.size) return pick(ownNow);
  if (left >= 2) {
    const ownPair = holeCoverage(stones, player, 2, spec.size);
    if (ownPair.size) return pick(ownPair);
  }

  const blockNow = holeCoverage(stones, opponent, 1, spec.size);
  if (blockNow.size) return pick(blockNow);
  const blockPair = holeCoverage(stones, opponent, 2, spec.size);
  if (blockPair.size) return pick(blockPair);

  let best = empties[0];
  let bestScore = -Infinity;
  for (const cell of empties) {
    const score = scoreMove(stones, cell, player, opponent, spec.size);
    const closer = radiusOf(cell) < radiusOf(best);
    if (score > bestScore || (score === bestScore && closer)) {
      bestScore = score;
      best = cell;
    }
  }

  return { letter: best.letter, number: best.number };
}
