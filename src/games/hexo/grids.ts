/**
 * Boards for the other HeXO tables.
 * Hex stays the algebraic board. Triangle, square, and octagon-and-diamond
 * are the same bases with different cells.
 */

import { boardFor, type BoardSize, type Cell } from "./logic.ts";

export type Grid = "hex" | "tri" | "sq" | "oct";

export type GameCell = Cell & { m: number };

export type GameBoard = {
  kind: Grid;
  size: BoardSize;
  center: string;
  letters: string;
  span: number;
  radius: number;
  hex: number;
  width: number;
  height: number;
  viewBox: string;
  cells: GameCell[];
  labels: { text: string; x: number; y: number }[];
  byKey: Record<string, GameCell>;
  guides: Record<string, string[]>;
  lines: string[][];
  touch: Record<string, string[]>;
  mirror: Record<string, string>;
  orbit: Record<string, string>;
  ring: Record<string, number>;
};

const cache = new Map<string, GameBoard>();

export function gameBoard(kind: Grid, size: BoardSize): GameBoard {
  const key = `${kind}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const board = kind === "hex" ? fromHex(size) : kind === "sq" ? squareBoard(size) : kind === "tri" ? triangleBoard(size) : octagonBoard(size);
  cache.set(key, board);
  return board;
}

function fromHex(size: BoardSize): GameBoard {
  const raw = boardFor(size);
  const cells: GameCell[] = raw.cells.map((cell) => ({ ...cell, m: 7.1 }));
  const byKey: Record<string, GameCell> = {};
  for (const cell of cells) byKey[cell.key] = cell;
  const touch: Record<string, string[]> = {};
  for (const cell of cells) touch[cell.key] = [];
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      const a = cells[i];
      const b = cells[j];
      const dist = (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
      if (dist !== 1) continue;
      touch[a.key].push(b.key);
      touch[b.key].push(a.key);
    }
  }
  const lines = groupLines(cells, [
    (cell) => cell.q,
    (cell) => cell.r,
    (cell) => cell.s,
  ]);
  return finish("hex", size, raw.center, raw.letters, raw.span, raw.radius, raw.hex, cells, raw.labels, lines, touch, 60);
}

function squareBoard(size: BoardSize): GameBoard {
  const span = size === 8 ? 15 : 25;
  const letters = "abcdefghijklmnopqrstuvwxyz".slice(0, span);
  const step = 28;
  const mid = (span - 1) / 2;
  const cells: GameCell[] = [];
  for (let col = 0; col < span; col += 1) {
    for (let row = 0; row < span; row += 1) {
      const x = (col - mid) * step;
      const y = (mid - row) * step;
      const letter = letters[col];
      const number = row + 1;
      cells.push({
        letter,
        number,
        key: `${letter}${number}`,
        q: col - Math.floor(mid),
        r: row - Math.floor(mid),
        s: 0,
        x,
        y,
        m: 8,
        points: rect(x, y, step * 0.46),
      });
    }
  }
  const byKey = index(cells);
  const touch: Record<string, string[]> = {};
  const lineNeighbors: Record<string, string[]> = {};
  for (const cell of cells) {
    touch[cell.key] = [];
    lineNeighbors[cell.key] = [];
  }
  for (const cell of cells) {
    for (const other of cells) {
      if (other === cell) continue;
      const dc = Math.abs(cell.q - other.q);
      const dr = Math.abs(cell.r - other.r);
      if (dc + dr === 1) touch[cell.key].push(other.key);
      if (Math.max(dc, dr) === 1) lineNeighbors[cell.key].push(other.key);
    }
  }
  const labels = [];
  const edge = (mid + 0.78) * step;
  for (let col = 0; col < span; col += 1) {
    labels.push({ text: letters[col], x: (col - mid) * step, y: edge });
  }
  for (let row = 0; row < span; row += 1) {
    labels.push({ text: String(row + 1), x: edge, y: (mid - row) * step });
  }
  const center = `${letters[Math.floor(mid)]}${Math.floor(mid) + 1}`;
  return finish("sq", size, center, letters, span, Math.floor(mid), step, cells, labels, walkLines(cells, lineNeighbors), touch, 90);
}

function triangleBoard(size: BoardSize): GameBoard {
  const bound = size;
  const unit = size === 8 ? 26 : 18;
  const cells: GameCell[] = [];
  const inside = (i: number, j: number) => Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j)) <= bound;
  const point = (i: number, j: number) => ({
    x: unit * (i + j / 2),
    y: unit * ((j * Math.sqrt(3)) / 2),
  });
  for (let i = -bound - 1; i <= bound; i += 1) {
    for (let j = -bound - 1; j <= bound; j += 1) {
      if (inside(i, j) && inside(i + 1, j) && inside(i, j + 1)) {
        const a = point(i, j);
        const b = point(i + 1, j);
        const c = point(i, j + 1);
        cells.push(triCell(a, b, c, i, j, 0));
      }
      if (inside(i + 1, j) && inside(i + 1, j + 1) && inside(i, j + 1)) {
        const a = point(i + 1, j);
        const b = point(i + 1, j + 1);
        const c = point(i, j + 1);
        cells.push(triCell(a, b, c, i, j, 1));
      }
    }
  }
  nameCells(cells);
  const touch = nearestTouch(cells, 1.35);
  return finish(
    "tri",
    size,
    closestKey(cells),
    "abcdefghijklmnopqrstuvwxyz",
    40,
    bound,
    unit,
    cells,
    [],
    triangleLines(cells),
    touch,
    60,
    { x: 0, y: 0 },
  );
}

function triangleLines(cells: GameCell[]): string[][] {
  const ups = cells.filter((cell) => cell.s === 0);
  const downs = cells.filter((cell) => cell.s === 1);
  return [ups, downs].flatMap((group) => [
    ...axisLines(group, (cell) => cell.r),
    ...axisLines(group, (cell) => cell.q),
    ...axisLines(group, (cell) => cell.q + cell.r),
  ]);
}

function axisLines(cells: GameCell[], id: (cell: GameCell) => number): string[][] {
  const groups = new Map<number, GameCell[]>();
  for (const cell of cells) {
    const key = id(cell);
    const list = groups.get(key);
    if (list) list.push(cell);
    else groups.set(key, [cell]);
  }
  const lines: string[][] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => a.x - b.x || a.y - b.y);
    let run = [list[0]];
    for (let index = 1; index < list.length; index += 1) {
      const prev = run[run.length - 1];
      const dist = Math.hypot(list[index].x - prev.x, list[index].y - prev.y);
      const step = Math.hypot(list[1].x - list[0].x, list[1].y - list[0].y) || dist;
      if (dist > step * 1.6) {
        if (run.length >= 2) lines.push(run.map((cell) => cell.key));
        run = [list[index]];
      } else run.push(list[index]);
    }
    if (run.length >= 2) lines.push(run.map((cell) => cell.key));
  }
  return lines;
}

function triCell(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  i: number,
  j: number,
  flip: number,
): GameCell {
  return {
    letter: "a",
    number: 1,
    key: `t${i}_${j}_${flip}`,
    q: i,
    r: j,
    s: flip,
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
    m: 4.4,
    points: `${a.x.toFixed(2)},${a.y.toFixed(2)} ${b.x.toFixed(2)},${b.y.toFixed(2)} ${c.x.toFixed(2)},${c.y.toFixed(2)}`,
  };
}

function octagonBoard(size: BoardSize): GameBoard {
  const n = size === 8 ? 9 : 13;
  const step = 40;
  const rad = 16;
  const mid = (n - 1) / 2;
  const cells: GameCell[] = [];
  const at = (col: number, row: number) => ({
    x: (col - mid) * step,
    y: (mid - row) * step,
  });
  for (let col = 0; col < n; col += 1) {
    for (let row = 0; row < n; row += 1) {
      const { x, y } = at(col, row);
      cells.push({
        letter: "a",
        number: 1,
        key: `o${col}_${row}`,
        q: col,
        r: row,
        s: 0,
        x,
        y,
        m: 7,
        points: polygon(x, y, rad, 8, Math.PI / 8),
      });
    }
  }
  for (let col = 0; col < n - 1; col += 1) {
    for (let row = 0; row < n; row += 1) {
      const left = at(col, row);
      const right = at(col + 1, row);
      cells.push(diamondCell((left.x + right.x) / 2, (left.y + right.y) / 2, true, col, row));
    }
  }
  for (let col = 0; col < n; col += 1) {
    for (let row = 0; row < n - 1; row += 1) {
      const top = at(col, row + 1);
      const bottom = at(col, row);
      cells.push(diamondCell((top.x + bottom.x) / 2, (top.y + bottom.y) / 2, false, col, row));
    }
  }
  nameCells(cells);
  const touch = nearestTouch(cells, 1.2);
  return finish("oct", size, closestKey(cells.filter((cell) => cell.s === 0)), "abcdefghijklmnopqrstuvwxyz", 40, n, step, cells, [], walkLines(cells, touch), touch, 90);
}

function diamondCell(x: number, y: number, horizontal: boolean, col: number, row: number): GameCell {
  const long = 9;
  const short = 5;
  const points = horizontal
    ? `${x - short},${y} ${x},${y - long} ${x + short},${y} ${x},${y + long}`
    : `${x},${y - short} ${x + long},${y} ${x},${y + short} ${x - long},${y}`;
  return {
    letter: "a",
    number: 1,
    key: horizontal ? `h${col}_${row}` : `v${col}_${row}`,
    q: col,
    r: row,
    s: horizontal ? 1 : 2,
    x,
    y,
    m: 3.6,
    points,
  };
}

function finish(
  kind: Grid,
  size: BoardSize,
  center: string,
  letters: string,
  span: number,
  radius: number,
  hex: number,
  cells: GameCell[],
  labels: { text: string; x: number; y: number }[],
  lines: string[][],
  touch: Record<string, string[]>,
  turn: number,
  pivot?: { x: number; y: number },
): GameBoard {
  const byKey = index(cells);
  const guides: Record<string, string[]> = {};
  for (const cell of cells) guides[cell.key] = [];
  for (const line of lines) {
    for (const key of line) guides[key].push(...line);
  }
  for (const key of Object.keys(guides)) guides[key] = [...new Set(guides[key])];
  const board = {
    kind,
    size,
    center,
    letters,
    span,
    radius,
    hex,
    width: 1,
    height: 1,
    viewBox: "0 0 1 1",
    cells,
    labels,
    byKey,
    guides,
    lines,
    touch,
    mirror: {},
    orbit: {},
    ring: {},
  };
  if (kind === "hex") {
    const raw = boardFor(size);
    board.width = raw.width;
    board.height = raw.height;
    board.viewBox = raw.viewBox;
  } else {
    frame(board);
  }
  const origin = pivot ?? byKey[center] ?? cells[0];
  const spacing = spacingOf(cells);
  for (const cell of cells) {
    board.mirror[cell.key] = snap(cells, 2 * origin.x - cell.x, 2 * origin.y - cell.y, spacing) ?? cell.key;
    const stepped = rotate(cell.x, cell.y, origin.x, origin.y, turn);
    board.orbit[cell.key] = snap(cells, stepped.x, stepped.y, spacing) ?? cell.key;
    board.ring[cell.key] = Math.round(Math.hypot(cell.x - origin.x, cell.y - origin.y) / spacing);
  }
  return board;
}

function frame(board: GameBoard) {
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
  for (const cell of board.cells) include(cell.x, cell.y, board.kind === "tri" ? 16 : 20);
  for (const label of board.labels) include(label.x, label.y, 16);
  board.width = maxX - minX;
  board.height = maxY - minY;
  board.viewBox = `${minX} ${minY} ${board.width} ${board.height}`;
}

function groupLines(cells: GameCell[], ids: Array<(cell: GameCell) => number>): string[][] {
  const lines: string[][] = [];
  for (const id of ids) {
    const groups = new Map<number, GameCell[]>();
    for (const cell of cells) {
      const key = id(cell);
      const list = groups.get(key);
      if (list) list.push(cell);
      else groups.set(key, [cell]);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.x - b.x || a.y - b.y);
      if (list.length >= 2) lines.push(list.map((cell) => cell.key));
    }
  }
  return lines;
}

function walkLines(cells: GameCell[], neighbors: Record<string, string[]>): string[][] {
  const byKey = index(cells);
  const lines: string[][] = [];
  const seen = new Set<string>();
  for (const cell of cells) {
    for (const next of neighbors[cell.key] ?? []) {
      const forward = unit(cell, byKey[next]);
      let start = true;
      for (const other of neighbors[cell.key] ?? []) {
        if (other === next) continue;
        if (dot(unit(cell, byKey[other]), forward) < -0.96) start = false;
      }
      if (!start) continue;
      const line = [cell.key];
      let prev = cell;
      let cur = byKey[next];
      while (cur) {
        line.push(cur.key);
        const aim = unit(prev, cur);
        const onward = (neighbors[cur.key] ?? [])
          .map((key) => byKey[key])
          .find((candidate) => candidate && candidate.key !== prev.key && dot(unit(cur, candidate), aim) > 0.96);
        prev = cur;
        cur = onward ?? null;
      }
      const id = [line[0], line[line.length - 1]].sort().join(">") + ":" + line.length;
      if (line.length >= 2 && !seen.has(id)) {
        seen.add(id);
        lines.push(line);
      }
    }
  }
  return lines;
}

function nearestTouch(cells: GameCell[], factor: number): Record<string, string[]> {
  const nearest = cells.map(() => Infinity);
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      const dist = Math.hypot(cells[i].x - cells[j].x, cells[i].y - cells[j].y);
      nearest[i] = Math.min(nearest[i], dist);
      nearest[j] = Math.min(nearest[j], dist);
    }
  }
  const spacing = nearest.slice().sort((a, b) => a - b)[Math.floor(nearest.length / 2)] || 1;
  const touch: Record<string, string[]> = {};
  for (const cell of cells) touch[cell.key] = [];
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      const dist = Math.hypot(cells[i].x - cells[j].x, cells[i].y - cells[j].y);
      if (dist <= spacing * factor) {
        touch[cells[i].key].push(cells[j].key);
        touch[cells[j].key].push(cells[i].key);
      }
    }
  }
  return touch;
}

function nameCells(cells: GameCell[]) {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const ordered = cells.slice().sort((a, b) => a.y - b.y || a.x - b.x);
  ordered.forEach((cell, index) => {
    const letter = letters[index % letters.length];
    const number = Math.floor(index / letters.length) + 1;
    cell.letter = letter;
    cell.number = number;
    cell.key = `${letter}${number}`;
  });
}

function closestKey(cells: GameCell[]): string {
  let best = cells[0];
  let bestD = Infinity;
  for (const cell of cells) {
    const dist = cell.x * cell.x + cell.y * cell.y;
    if (dist < bestD) {
      best = cell;
      bestD = dist;
    }
  }
  return best.key;
}

function spacingOf(cells: GameCell[]): number {
  let best = Infinity;
  const sample = cells.slice(0, Math.min(cells.length, 40));
  for (const cell of sample) {
    for (const other of cells) {
      if (other === cell) continue;
      best = Math.min(best, Math.hypot(cell.x - other.x, cell.y - other.y));
    }
  }
  return best === Infinity ? 20 : best;
}

function snap(cells: GameCell[], x: number, y: number, spacing: number): string | null {
  let best: GameCell | null = null;
  let bestD = (spacing * 0.45) ** 2;
  for (const cell of cells) {
    const dist = (cell.x - x) ** 2 + (cell.y - y) ** 2;
    if (dist < bestD) {
      best = cell;
      bestD = dist;
    }
  }
  return best?.key ?? null;
}

function rotate(x: number, y: number, ox: number, oy: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  const dx = x - ox;
  const dy = y - oy;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: ox + dx * cos - dy * sin, y: oy + dx * sin + dy * cos };
}

function index(cells: GameCell[]): Record<string, GameCell> {
  const byKey: Record<string, GameCell> = {};
  for (const cell of cells) byKey[cell.key] = cell;
  return byKey;
}

function rect(x: number, y: number, r: number): string {
  return `${x - r},${y - r} ${x + r},${y - r} ${x + r},${y + r} ${x - r},${y + r}`;
}

function polygon(x: number, y: number, radius: number, sides: number, spin: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = spin + (i * 2 * Math.PI) / sides;
    pts.push(`${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function unit(a: GameCell, b: GameCell) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function dot(a: { x: number; y: number }, b: { x: number; y: number }) {
  return a.x * b.x + a.y * b.y;
}
