/**
 * Edge-connection games: bluD!NG, Hex, TwixT, PÜNCT, Star, *Star, and Y.
 * Stones are 0 empty, 1 red, 2 blue. Red moves first.
 */

const DIRS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

const KNIGHT = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
];

export const GAMES = [
  {
    id: "bluding",
    name: "bluD!NG",
    aka: "bridg-it",
    sizes: [3, 5, 7],
    sizeDefault: 5,
    pie: true,
    blurb: "link your own dots. red joins top to bottom, blue joins the sides.",
  },
  {
    id: "hex",
    name: "Hex",
    sizes: [5, 7, 9, 11, 13],
    sizeDefault: 11,
    pie: true,
    blurb: "red joins left to right. blue joins top to bottom.",
  },
  {
    id: "twixt",
    name: "TwixT",
    sizes: [12, 18, 24],
    sizeDefault: 12,
    pie: true,
    blurb: "place a peg, then knight's-move links. links cannot cross.",
  },
  {
    id: "punct",
    name: "PÜNCT",
    sizes: [0],
    sizeDefault: 0,
    pie: false,
    blurb: "three-dot pieces. join any opposite sides. the center is only entered by moving.",
  },
  {
    id: "star",
    name: "Star",
    sizes: [3, 4, 5],
    sizeDefault: 4,
    pie: true,
    blurb: "a group on three or more border cells scores two less than it touches.",
  },
  {
    id: "sstar",
    name: "*Star",
    sizes: [4, 6, 8],
    sizeDefault: 6,
    pie: true,
    blurb: "own the edge with as few stars as you can. the center bridge joins both colors.",
  },
  {
    id: "y",
    name: "Y",
    sizes: [6, 8, 11],
    sizeDefault: 8,
    pie: true,
    blurb: "both players join all three sides. a corner counts for both edges.",
  },
];

const GAME_IDS = new Set(GAMES.map((game) => game.id));

export function gameInfo(id) {
  return GAMES.find((game) => game.id === id) || GAMES[1];
}

export function sizeLabel(id, size) {
  if (id === "star") return { 3: "3–6", 4: "4–7", 5: "5–8" }[size] || String(size);
  if (id === "sstar") return `${size} rings`;
  if (id === "punct") return "211";
  if (id === "bluding") return `${size}`;
  return `${size}`;
}

const cache = new Map();

export function boardOf(game, size) {
  const key = `${game}:${size}`;
  let board = cache.get(key);
  if (!board) {
    board = buildBoard(game, size);
    cache.set(key, board);
  }
  return board;
}

function buildBoard(game, size) {
  if (game === "hex") return buildHex(size);
  if (game === "y") return buildY(size);
  if (game === "star") return buildStar(size);
  if (game === "sstar") return buildSStar(size);
  if (game === "bluding") return buildBluding(size);
  if (game === "twixt") return buildTwixt(size);
  if (game === "punct") return buildPunct();
  return buildHex(11);
}

function columnName(index) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    n -= 1;
    name = String.fromCharCode(97 + (n % 26)) + name;
    n = Math.floor(n / 26);
  }
  return name;
}

function hexPoint(q, r, scale) {
  return [scale * Math.sqrt(3) * (q + r / 2), scale * 1.5 * r];
}

function hexPoly(x, y, scale) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3;
    pts.push(`${x + scale * Math.cos(ang)},${y + scale * Math.sin(ang)}`);
  }
  return pts.join(" ");
}

function fileAfter(a, b) {
  return a.length !== b.length ? a.length > b.length : a > b;
}

function labelAxial(cells, scale, blockers = []) {
  if (!cells.some((cell) => cell.file)) return [];
  const files = new Map();
  const ranks = new Map();
  for (const cell of cells) {
    if (!cell.file) continue;
    if (!files.has(cell.file)) files.set(cell.file, []);
    files.get(cell.file).push(cell);
    const rank = String(cell.rank);
    if (!ranks.has(rank)) ranks.set(rank, []);
    ranks.get(rank).push(cell);
  }
  const stepFile = { x: scale * Math.sqrt(3), y: 0 };
  const stepRank = { x: (scale * Math.sqrt(3)) / 2, y: scale * 1.5 };

  function extreme(list, end, byRank) {
    return list.reduce((best, cell) => {
      if (byRank) {
        if (end === "max") return cell.rank > best.rank ? cell : best;
        return cell.rank < best.rank ? cell : best;
      }
      const after = fileAfter(cell.file, best.file);
      if (end === "max") return after ? cell : best;
      return after ? best : cell;
    });
  }

  function build(fileEnd, rankEnd, out) {
    const labels = [];
    const fileDir = fileEnd === "max" ? 1 : -1;
    const rankDir = rankEnd === "max" ? 1 : -1;
    for (const [file, list] of files) {
      const edge = extreme(list, fileEnd, true);
      labels.push({
        text: file,
        x: edge.x + stepRank.x * fileDir * out,
        y: edge.y + stepRank.y * fileDir * out,
        ux: stepRank.x * fileDir,
        uy: stepRank.y * fileDir,
      });
    }
    for (const [rank, list] of ranks) {
      const edge = extreme(list, rankEnd, false);
      labels.push({
        text: rank,
        x: edge.x + stepFile.x * rankDir * out,
        y: edge.y + stepFile.y * rankDir * out,
        ux: stepFile.x * rankDir,
        uy: stepFile.y * rankDir,
      });
    }
    for (const label of labels) {
      const len = Math.hypot(label.ux, label.uy) || 1;
      label.ux /= len;
      label.uy /= len;
    }
    return labels;
  }

  // A triangle and a clipped hex put the max-file edge and the max-rank edge
  // on the same side, so the two alphabets land on top of each other.
  // Keep the usual far edges when they are actually apart.
  let choice = null;
  for (const fileEnd of ["max", "min"]) {
    for (const rankEnd of ["max", "min"]) {
      const labels = build(fileEnd, rankEnd, 1);
      let gap = Infinity;
      const letters = labels.filter((label) => /[a-z]/.test(label.text));
      const numbers = labels.filter((label) => /^\d/.test(label.text));
      for (const letter of letters) {
        for (const number of numbers) {
          gap = Math.min(gap, Math.hypot(letter.x - number.x, letter.y - number.y));
        }
      }
      if (!choice || gap > choice.gap + 6) choice = { fileEnd, rankEnd, gap };
    }
  }

  const circles = blockers.map((item) => ({ x: item.x, y: item.y, r: item.r }));
  for (const cell of cells) circles.push({ x: cell.x, y: cell.y, r: scale });

  const labels = build(choice.fileEnd, choice.rankEnd, 0.92);
  let cx = 0;
  let cy = 0;
  for (const cell of cells) {
    cx += cell.x;
    cy += cell.y;
  }
  cx /= cells.length;
  cy /= cells.length;
  const half = (text) => Math.max(6, text.length * 3.8);
  const gapTo = (label, circle) => {
    const hw = half(label.text);
    const dx = Math.max(Math.abs(label.x - circle.x) - hw, 0);
    const dy = Math.max(Math.abs(label.y - circle.y) - 7, 0);
    return Math.hypot(dx, dy) - circle.r;
  };
  const blocked = (label) => circles.some((circle) => gapTo(label, circle) < 4);
  const pushOut = (label, step) => {
    const dx = label.x - cx;
    const dy = label.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    label.x += (dx / len) * step;
    label.y += (dy / len) * step;
  };
  const clearBoard = () => {
    for (let pass = 0; pass < 24; pass += 1) {
      let moved = false;
      for (const label of labels) {
        if (!blocked(label)) continue;
        pushOut(label, 4);
        moved = true;
      }
      if (!moved) break;
    }
  };
  clearBoard();
  // Where a letter and a number share a corner, park the number one step further out.
  const onTop = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 28;
  for (let pass = 0; pass < 4; pass += 1) {
    for (const label of labels) {
      if (!/^\d/.test(label.text)) continue;
      const hit = labels.some((other) => /[a-z]/.test(other.text) && onTop(label, other));
      if (hit) pushOut(label, 10);
    }
  }
  clearBoard();
  return labels.map(({ text, x, y }) => ({ text, x, y }));
}

function finishCells(family, cells, scale, extra = {}) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const neighbors = cells.map(() => []);
  const at = new Map(cells.map((cell) => [`${cell.q},${cell.r}`, cell.id]));
  for (const cell of cells) {
    const [x, y] = hexPoint(cell.q, cell.r, scale);
    cell.x = x;
    cell.y = y;
    cell.points = hexPoly(x, y, scale);
    minX = Math.min(minX, x - scale);
    minY = Math.min(minY, y - scale);
    maxX = Math.max(maxX, x + scale);
    maxY = Math.max(maxY, y + scale);
  }
  const labels = labelAxial(cells, scale);
  for (const label of labels) {
    minX = Math.min(minX, label.x - scale * 0.7);
    minY = Math.min(minY, label.y - scale * 0.7);
    maxX = Math.max(maxX, label.x + scale * 0.7);
    maxY = Math.max(maxY, label.y + scale * 0.7);
  }
  for (const cell of cells) {
    for (const [dq, dr] of DIRS) {
      const id = at.get(`${cell.q + dq},${cell.r + dr}`);
      if (id != null) neighbors[cell.id].push(id);
    }
  }
  const pad = scale * 0.35;
  return {
    family,
    cells,
    neighbors,
    at,
    scale,
    labels,
    bounds: {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    },
    ...extra,
  };
}

function buildHex(n) {
  const cells = [];
  for (let q = 0; q < n; q += 1) {
    for (let r = 0; r < n; r += 1) {
      const sides = [];
      if (q === 0) sides.push("W");
      if (q === n - 1) sides.push("E");
      if (r === 0) sides.push("N");
      if (r === n - 1) sides.push("S");
      const file = columnName(q);
      const rank = r + 1;
      cells.push({
        id: cells.length,
        q,
        r,
        sides,
        file,
        rank,
        name: `${file}${rank}`,
      });
    }
  }
  const board = finishCells("cell", cells, 22, {
    game: "hex",
    goals: {
      red: [["W", "E"]],
      blue: [["N", "S"]],
    },
  });
  paintEdges(board);
  return board;
}

function buildY(n) {
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let q = 0; q < n - r; q += 1) {
      const sides = [];
      if (q === 0) sides.push("A");
      if (r === 0) sides.push("B");
      if (q + r === n - 1) sides.push("C");
      const file = columnName(q);
      const rank = r + 1;
      cells.push({
        id: cells.length,
        q,
        r,
        sides,
        file,
        rank,
        name: `${file}${rank}`,
      });
    }
  }
  const board = finishCells("cell", cells, 26, {
    game: "y",
    goals: {
      red: [["A", "B", "C"]],
      blue: [["A", "B", "C"]],
    },
  });
  paintEdges(board);
  return board;
}

function buildStar(size) {
  const pair = { 3: [3, 4], 4: [4, 5], 5: [5, 6] }[size] || [4, 5];
  const [lo, hi] = pair;
  const raw = [];
  for (let q = -lo; q <= hi; q += 1) {
    for (let r = -lo; r <= hi; r += 1) {
      const s = -q - r;
      if (s < -lo || s > hi) continue;
      raw.push({ q, r, s });
    }
  }
  const q0 = Math.min(...raw.map((cell) => cell.q));
  const r0 = Math.min(...raw.map((cell) => cell.r));
  const cells = raw.map((cell, id) => {
    const file = columnName(cell.q - q0);
    const rank = cell.r - r0 + 1;
    return {
      id,
      q: cell.q,
      r: cell.r,
      s: cell.s,
      sides: [],
      file,
      rank,
      name: `${file}${rank}`,
    };
  });
  const board = finishCells("cell", cells, 20, { game: "star", goals: null });
  const partials = [];
  const partialAt = new Map();
  const cellPartials = cells.map(() => []);
  for (const cell of cells) {
    for (const [dq, dr] of DIRS) {
      const q = cell.q + dq;
      const r = cell.r + dr;
      if (board.at.has(`${q},${r}`)) continue;
      const key = `${q},${r}`;
      let partial = partialAt.get(key);
      if (!partial) {
        const [x, y] = hexPoint(q, r, board.scale);
        partial = {
          id: partials.length,
          q,
          r,
          x,
          y,
          points: hexPoly(x, y, board.scale),
          touches: [],
        };
        partials.push(partial);
        partialAt.set(key, partial);
      }
      partial.touches.push(cell.id);
      cellPartials[cell.id].push(partial.id);
    }
  }
  board.partials = partials;
  board.cellPartials = cellPartials;
  board.labels = labelAxial(
    cells,
    board.scale,
    partials.map((partial) => ({ x: partial.x, y: partial.y, r: board.scale })),
  );
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x, y, extra) => {
    minX = Math.min(minX, x - extra);
    minY = Math.min(minY, y - extra);
    maxX = Math.max(maxX, x + extra);
    maxY = Math.max(maxY, y + extra);
  };
  for (const cell of cells) grow(cell.x, cell.y, board.scale);
  for (const partial of partials) grow(partial.x, partial.y, board.scale);
  for (const label of board.labels) grow(label.x, label.y, 12);
  const pad = board.scale * 0.35;
  board.bounds = {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
  return board;
}

function buildSStar(rings) {
  const R = rings;
  const cells = [];
  const index = new Map();
  const key = (s, a, b) => `${s},${a},${b}`;
  for (let s = 0; s < 5; s += 1) {
    for (let a = 0; a < R; a += 1) {
      for (let b = 0; b < R - a; b += 1) {
        const id = cells.length;
        const cell = {
          id,
          s,
          a,
          b,
          ring: a + b + 1,
          q: a,
          r: b,
          sides: [],
          name: "",
        };
        cells.push(cell);
        index.set(key(s, a, b), id);
      }
    }
  }
  const at = (s, a, b) => {
    const wrapped = ((s % 5) + 5) % 5;
    if (a < 0 || b < 0 || a + b >= R) return null;
    const id = index.get(key(wrapped, a, b));
    return id == null ? null : id;
  };
  const neighbors = cells.map(() => []);
  const link = (i, j) => {
    if (i == null || j == null || i === j) return;
    if (!neighbors[i].includes(j)) neighbors[i].push(j);
    if (!neighbors[j].includes(i)) neighbors[j].push(i);
  };
  for (const cell of cells) {
    for (const [da, db] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, -1],
      [-1, 1],
    ]) {
      link(cell.id, at(cell.s, cell.a + da, cell.b + db));
    }
  }
  for (let s = 0; s < 5; s += 1) {
    for (let b = 0; b < R; b += 1) {
      link(at(s, 0, b), at(s - 1, b, 0));
      if (b + 1 < R) link(at(s, 0, b), at(s - 1, b + 1, 0));
    }
  }
  const perimeter = [];
  const corners = [];
  for (let s = 0; s < 5; s += 1) {
    for (let k = 0; k < R; k += 1) {
      const id = at(s, k, R - 1 - k);
      perimeter.push(id);
      if (k === 0) {
        cells[id].corner = true;
        corners.push(id);
      }
      cells[id].edge = true;
      cells[id].sides = ["edge"];
    }
  }
  const perimIndex = new Map(perimeter.map((id, index) => [id, index]));
  const hub = cells.filter((cell) => cell.ring === 1).map((cell) => cell.id);
  const scale = 18;
  for (let ring = 1; ring <= R; ring += 1) {
    const onRing = cells.filter((cell) => cell.ring === ring);
    onRing.sort((a, b) => a.s - b.s || a.a - b.a);
    const count = onRing.length;
    onRing.forEach((cell, order) => {
      const ang = -Math.PI / 2 + ((order + 0.5) * 2 * Math.PI) / count;
      const rad = ring * scale * 1.28;
      cell.x = Math.cos(ang) * rad;
      cell.y = Math.sin(ang) * rad;
      cell.points = hexPoly(cell.x, cell.y, scale * 0.7);
      cell.name = `${"abcde"[cell.s]}${cell.ring}${columnName(cell.a)}`;
    });
  }
  const reach = scale * 0.7;
  const labels = [];
  for (const cell of cells) {
    if (cell.ring !== R) continue;
    const ang = Math.atan2(cell.y, cell.x);
    const column = columnName(cell.a);
    labels.push({
      text: column,
      x: cell.x + Math.cos(ang) * (reach + 14),
      y: cell.y + Math.sin(ang) * (reach + 14),
    });
    if (cell.corner) {
      labels.push({
        text: "abcde"[cell.s],
        x: cell.x + Math.cos(ang) * (reach + 36),
        y: cell.y + Math.sin(ang) * (reach + 36),
      });
    }
  }
  const outer = R * scale * 1.28;
  for (let ring = 1; ring <= R; ring += 1) {
    labels.push({
      text: String(ring),
      x: -(outer + reach + 46),
      y: -ring * scale * 1.28,
    });
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const cell of cells) {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
  }
  for (const label of labels) {
    minX = Math.min(minX, label.x);
    minY = Math.min(minY, label.y);
    maxX = Math.max(maxX, label.x);
    maxY = Math.max(maxY, label.y);
  }
  const pad = scale * 1.7;
  return {
    family: "cell",
    game: "sstar",
    cells,
    neighbors,
    scale,
    perimeter,
    perimIndex,
    corners,
    hub,
    labels,
    goals: null,
    bounds: {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    },
  };
}

function paintEdges(board) {
  for (const cell of board.cells) {
    const tint = [];
    if (cell.sides.includes("W") || cell.sides.includes("E")) tint.push("red");
    if (cell.sides.includes("N") || cell.sides.includes("S")) tint.push("blue");
    cell.tint = tint;
  }
}

function buildBluding(n) {
  const red = [];
  for (let y = 0; y <= n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      red.push({
        id: red.length,
        x,
        y,
        border: y === 0 ? "start" : y === n ? "end" : null,
      });
    }
  }
  const blue = [];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x <= n; x += 1) {
      blue.push({
        id: blue.length,
        x: x - 0.5,
        y: y + 0.5,
        border: x === 0 ? "start" : x === n ? "end" : null,
      });
    }
  }
  const bridges = [];
  const linkName = (x1, y1, x2, y2) =>
    `${columnName(x1)}${y1}${columnName(x2)}${y2}`;
  const add = (color, a, b, x1, y1, x2, y2, name) => {
    bridges.push({
      id: bridges.length,
      color,
      a,
      b,
      x1,
      y1,
      x2,
      y2,
      cross: null,
      name,
    });
  };
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      add("red", y * n + x, (y + 1) * n + x, x, y, x, y + 1, linkName(x, y + 1, x, y + 2));
    }
  }
  for (let y = 0; y <= n; y += 1) {
    for (let x = 0; x < n - 1; x += 1) {
      add(
        "red",
        y * n + x,
        y * n + x + 1,
        x,
        y,
        x + 1,
        y,
        linkName(x, y + 1, x + 1, y + 1),
      );
    }
  }
  const redCount = bridges.length;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      add(
        "blue",
        y * (n + 1) + x,
        y * (n + 1) + x + 1,
        x - 0.5,
        y + 0.5,
        x + 0.5,
        y + 0.5,
        linkName(x, y + 1, x + 1, y + 1),
      );
    }
  }
  const blueVert = bridges.length;
  for (let y = 0; y < n - 1; y += 1) {
    for (let x = 0; x <= n; x += 1) {
      add(
        "blue",
        y * (n + 1) + x,
        (y + 1) * (n + 1) + x,
        x - 0.5,
        y + 0.5,
        x - 0.5,
        y + 1.5,
        linkName(x, y + 1, x, y + 2),
      );
    }
  }
  for (let i = 0; i < n * n; i += 1) {
    bridges[i].cross = redCount + i;
    bridges[redCount + i].cross = i;
  }
  for (let y = 1; y <= n - 1; y += 1) {
    for (let x = 0; x < n - 1; x += 1) {
      const redId = n * n + y * (n - 1) + x;
      const blueId = blueVert + (y - 1) * (n + 1) + (x + 1);
      bridges[redId].cross = blueId;
      bridges[blueId].cross = redId;
    }
  }
  const scale = 46;
  const map = (x, y) => [x * scale, y * scale];
  for (const dot of red) {
    const [px, py] = map(dot.x, dot.y);
    dot.px = px;
    dot.py = py;
  }
  for (const dot of blue) {
    const [px, py] = map(dot.x, dot.y);
    dot.px = px;
    dot.py = py;
  }
  for (const bridge of bridges) {
    const [x1, y1] = map(bridge.x1, bridge.y1);
    const [x2, y2] = map(bridge.x2, bridge.y2);
    bridge.px1 = x1;
    bridge.py1 = y1;
    bridge.px2 = x2;
    bridge.py2 = y2;
  }
  const labels = [];
  for (let x = 0; x < n; x += 1) labels.push({ text: columnName(x), x: x * scale, y: -scale * 0.9 });
  for (let y = 0; y <= n; y += 1) labels.push({ text: String(y + 1), x: -scale * 1.05, y: y * scale });
  let minX = -0.55 * scale;
  let minY = 0;
  let maxX = (n - 0.45) * scale;
  let maxY = n * scale;
  for (const label of labels) {
    minX = Math.min(minX, label.x);
    minY = Math.min(minY, label.y);
    maxX = Math.max(maxX, label.x);
    maxY = Math.max(maxY, label.y);
  }
  const pad = scale * 0.55;
  return {
    family: "bluding",
    game: "bluding",
    n,
    red,
    blue,
    bridges,
    scale,
    labels,
    bounds: {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    },
  };
}

function buildTwixt(n) {
  const holes = [];
  const holeAt = new Map();
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if ((r === 0 || r === n - 1) && (c === 0 || c === n - 1)) continue;
      let border = null;
      if (r === 0 || r === n - 1) border = "red";
      else if (c === 0 || c === n - 1) border = "blue";
      const id = holes.length;
      const hole = {
        id,
        r,
        c,
        border,
        name: `${columnName(c)}${r + 1}`,
      };
      holes.push(hole);
      holeAt.set(`${r},${c}`, id);
    }
  }
  const scale = n > 18 ? 28 : 36;
  for (const hole of holes) {
    hole.x = hole.c * scale;
    hole.y = hole.r * scale;
  }
  const labels = [];
  for (let c = 0; c < n; c += 1) labels.push({ text: columnName(c), x: c * scale, y: -scale * 0.95 });
  for (let r = 0; r < n; r += 1) labels.push({ text: String(r + 1), x: -scale * 1.2, y: r * scale });
  let minX = 0;
  let minY = 0;
  let maxX = (n - 1) * scale;
  let maxY = (n - 1) * scale;
  for (const label of labels) {
    const half = Math.max(8, label.text.length * 5);
    minX = Math.min(minX, label.x - half);
    minY = Math.min(minY, label.y - 9);
    maxX = Math.max(maxX, label.x + half);
    maxY = Math.max(maxY, label.y + 9);
  }
  const pad = scale * 0.45;
  return {
    family: "twixt",
    game: "twixt",
    n,
    holes,
    holeAt,
    scale,
    labels,
    bounds: {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    },
  };
}

function buildPunct() {
  const radius = 8;
  const raw = [];
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;
      const corner =
        (Math.abs(q) === radius && Math.abs(r) === radius) ||
        (Math.abs(q) === radius && Math.abs(s) === radius) ||
        (Math.abs(r) === radius && Math.abs(s) === radius);
      if (corner) continue;
      raw.push({ q, r, s });
    }
  }
  const q0 = Math.min(...raw.map((cell) => cell.q));
  const r0 = Math.min(...raw.map((cell) => cell.r));
  const cells = raw.map((cell, id) => {
    const sides = [];
    if (cell.q === radius) sides.push("q+");
    if (cell.q === -radius) sides.push("q-");
    if (cell.r === radius) sides.push("r+");
    if (cell.r === -radius) sides.push("r-");
    if (cell.s === radius) sides.push("s+");
    if (cell.s === -radius) sides.push("s-");
    const center = Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.s)) <= 2;
    return {
      id,
      q: cell.q,
      r: cell.r,
      s: cell.s,
      sides,
      center,
      file: columnName(cell.q - q0),
      rank: cell.r - r0 + 1,
      name: `${columnName(cell.q - q0)}${cell.r - r0 + 1}`,
    };
  });
  const board = finishCells("cell", cells, 16, {
    game: "punct",
    goals: {
      red: [
        ["q+", "q-"],
        ["r+", "r-"],
        ["s+", "s-"],
      ],
      blue: [
        ["q+", "q-"],
        ["r+", "r-"],
        ["s+", "s-"],
      ],
    },
  });
  board.pairs = [
    ["q+", "q-"],
    ["r+", "r-"],
    ["s+", "s-"],
  ];
  return board;
}

const PUNCT_SUPPLY = { sm: 2, se: 4, am: 2, al: 2, ar: 2, tri: 6 };

export const PUNCT_KINDS = [
  { id: "se", name: "straight", hint: "end" },
  { id: "sm", name: "straight", hint: "middle" },
  { id: "al", name: "angle", hint: "left" },
  { id: "ar", name: "angle", hint: "right" },
  { id: "am", name: "angle", hint: "corner" },
  { id: "tri", name: "triangle", hint: "" },
];

function shapeDots(kind, orient) {
  const o = ((orient % 6) + 6) % 6;
  if (kind === "sm") {
    const d = o % 3;
    return [
      [0, 0],
      DIRS[d],
      DIRS[d + 3],
    ];
  }
  if (kind === "se") {
    const d = DIRS[o];
    return [
      [0, 0],
      d,
      [d[0] * 2, d[1] * 2],
    ];
  }
  if (kind === "am") {
    const mirror = orient >= 6;
    const step = mirror ? 4 : 2;
    return [
      [0, 0],
      DIRS[o],
      DIRS[(o + step) % 6],
    ];
  }
  if (kind === "al" || kind === "ar") {
    const turn = kind === "al" ? 2 : 4;
    const vertex = DIRS[(o + 3) % 6];
    const otherDir = DIRS[(o + turn) % 6];
    return [
      [0, 0],
      vertex,
      [vertex[0] + otherDir[0], vertex[1] + otherDir[1]],
    ];
  }
  return [
    [0, 0],
    DIRS[o],
    DIRS[(o + 1) % 6],
  ];
}

function shapeMeta(kind) {
  if (kind === "sm" || kind === "am") return { ends: [1, 2], mid: 0, bridge: false };
  if (kind === "tri") return { ends: null, mid: null, bridge: false };
  return { ends: [0, 2], mid: 1, bridge: true };
}

export function orientCount(kind) {
  if (kind === "sm") return 3;
  if (kind === "am") return 12;
  return 6;
}

export function footprint(board, kind, orient, anchorId) {
  const anchor = board.cells[anchorId];
  if (!anchor) return null;
  const dots = shapeDots(kind, orient);
  const ids = [];
  for (const [dq, dr] of dots) {
    const id = board.at.get(`${anchor.q + dq},${anchor.r + dr}`);
    if (id == null) return null;
    ids.push(id);
  }
  if (new Set(ids).size !== 3) return null;
  return ids;
}

function resolveSize(info, requested) {
  if (info.id === "punct") return 0;
  if (info.sizes.includes(requested)) return requested;
  if (Number.isInteger(requested) && requested >= 1 && requested <= 30) {
    if (info.id === "star" || info.id === "sstar") return info.sizeDefault;
    return requested;
  }
  return info.sizeDefault;
}

export function initialState(options) {
  const info = gameInfo(options.game);
  const game = info.id;
  const size = resolveSize(info, options.size);
  const board = boardOf(game, size);
  const pie = Boolean(options.pie) && info.pie;
  return {
    game,
    size,
    pie,
    punctRules: options.punctRules === "basic" ? "basic" : "standard",
    mode: options.mode === "practice" ? "practice" : "hotseat",
    humanSeat: options.human === "blue" ? "B" : "A",
    seats: { red: "A", blue: "B" },
    turn: "red",
    stones: board.family === "cell" && game !== "punct" ? Array(board.cells.length).fill(0) : null,
    taken: game === "bluding" ? Array(board.bridges.length).fill(0) : null,
    pegs: game === "twixt" ? Array(board.holes.length).fill(0) : null,
    links: [],
    pieces: [],
    nextId: 1,
    supply:
      game === "punct"
        ? { red: { ...PUNCT_SUPPLY }, blue: { ...PUNCT_SUPPLY } }
        : null,
    pieOpen: false,
    passes: 0,
    moveCount: 0,
    result: null,
    last: null,
    winIds: [],
  };
}

function fail(reason, state) {
  return { ok: false, reason, state };
}

function codeOf(color) {
  return color === "red" ? 1 : 2;
}

function colorOf(code) {
  if (code === 1) return "red";
  if (code === 2) return "blue";
  return null;
}

function other(color) {
  return color === "red" ? "blue" : "red";
}

export function apply(state, move) {
  if (!move || state.result) return fail(state.result ? "over" : "bad", state);
  if (move.t === "resign") return resign(state);
  if (move.t === "swap") return swap(state);
  if (move.t === "pass") return pass(state);
  if (move.t === "count") return countNow(state);
  if (state.game === "bluding") return playBluding(state, move);
  if (state.game === "twixt") return playTwixt(state, move);
  if (state.game === "punct") return playPunct(state, move);
  return playCell(state, move);
}

export function replay(options, moves) {
  let state = initialState(options);
  for (const move of moves) {
    const next = apply(state, move);
    if (!next.ok) return { state, error: next.reason };
    state = next.state;
  }
  return { state, error: null };
}

function clone(state) {
  return {
    ...state,
    seats: { ...state.seats },
    stones: state.stones ? state.stones.slice() : null,
    taken: state.taken ? state.taken.slice() : null,
    pegs: state.pegs ? state.pegs.slice() : null,
    links: state.links.map((link) => link.slice()),
    pieces: state.pieces.map((piece) => ({ ...piece, cells: piece.cells.slice() })),
    supply: state.supply
      ? { red: { ...state.supply.red }, blue: { ...state.supply.blue } }
      : null,
    winIds: [],
  };
}

function finishTurn(state, last) {
  state.last = last;
  state.passes = 0;
  state.moveCount += 1;
  if (state.moveCount === 1 && state.pie && state.turn === "red") state.pieOpen = true;
  else state.pieOpen = false;
  state.turn = other(state.turn);
  return { ok: true, state };
}

function resign(state) {
  const next = clone(state);
  next.pieOpen = false;
  next.result = { winner: other(state.turn), reason: "resign", red: null, blue: null };
  next.last = { t: "resign" };
  return { ok: true, state: next };
}

function swap(state) {
  if (!state.pieOpen || state.turn !== "blue") return fail("swap", state);
  const next = clone(state);
  const red = next.seats.red;
  next.seats.red = next.seats.blue;
  next.seats.blue = red;
  next.pieOpen = false;
  next.last = { t: "swap" };
  next.moveCount += 1;
  return { ok: true, state: next };
}

function pass(state) {
  if (state.game !== "star" && state.game !== "sstar") return fail("pass", state);
  const next = clone(state);
  next.passes += 1;
  next.pieOpen = false;
  next.last = { t: "pass", color: state.turn };
  next.moveCount += 1;
  next.turn = other(state.turn);
  if (next.passes >= 2) closeScore(next, "pass");
  return { ok: true, state: next };
}

function countNow(state) {
  if (state.game !== "star" && state.game !== "sstar") return fail("count", state);
  const next = clone(state);
  next.pieOpen = false;
  next.last = { t: "count" };
  closeScore(next, "count");
  return { ok: true, state: next };
}

function closeScore(state, reason) {
  const scores = scoreState(state);
  let winner = "draw";
  if (scores.red > scores.blue) winner = "red";
  else if (scores.blue > scores.red) winner = "blue";
  state.result = { winner, reason, red: scores.red, blue: scores.blue };
}

function playCell(state, move) {
  if (move.t !== "cell") return fail("bad", state);
  const board = boardOf(state.game, state.size);
  const id = move.id;
  if (id < 0 || id >= state.stones.length || state.stones[id]) return fail("occupied", state);
  const next = clone(state);
  next.stones[id] = codeOf(state.turn);
  const won = winningIds(board, next.stones, codeOf(state.turn));
  if (won) {
    next.winIds = won;
    next.result = { winner: state.turn, reason: "connect", red: null, blue: null };
    next.last = { t: "cell", id, color: state.turn };
    next.pieOpen = false;
    next.moveCount += 1;
    return { ok: true, state: next };
  }
  if (state.game === "star" || state.game === "sstar") {
    if (next.stones.every((stone) => stone !== 0)) {
      next.last = { t: "cell", id, color: state.turn };
      next.pieOpen = false;
      next.moveCount += 1;
      closeScore(next, "full");
      return { ok: true, state: next };
    }
  }
  const done = finishTurn(next, { t: "cell", id, color: state.turn });
  return done;
}

function playBluding(state, move) {
  if (move.t !== "bridge") return fail("bad", state);
  const board = boardOf("bluding", state.size);
  const bridge = board.bridges[move.id];
  if (!bridge || bridge.color !== state.turn) return fail("color", state);
  if (state.taken[bridge.id]) return fail("taken", state);
  if (bridge.cross != null && state.taken[bridge.cross]) return fail("cross", state);
  const next = clone(state);
  next.taken[bridge.id] = codeOf(state.turn);
  const won = bludingWins(board, next.taken, state.turn);
  if (won) {
    next.winIds = won;
    next.result = { winner: state.turn, reason: "connect", red: null, blue: null };
    next.last = { t: "bridge", id: bridge.id, color: state.turn };
    next.pieOpen = false;
    next.moveCount += 1;
    return { ok: true, state: next };
  }
  return finishTurn(next, { t: "bridge", id: bridge.id, color: state.turn });
}

function playTwixt(state, move) {
  if (move.t !== "twixt") return fail("bad", state);
  const board = boardOf("twixt", state.size);
  const hole = board.holes[move.hole];
  if (!hole || state.pegs[hole.id]) return fail("occupied", state);
  if (hole.border && hole.border !== state.turn) return fail("border", state);
  const removed = normalizePairs(move.remove || []);
  const added = normalizePairs(move.add || []);
  for (const [a, b] of removed) {
    if (!hasLink(state.links, a, b)) return fail("link", state);
    if (state.pegs[a] !== codeOf(state.turn) || state.pegs[b] !== codeOf(state.turn)) {
      return fail("link", state);
    }
  }
  const links = state.links.filter((link) => !removed.some((pair) => samePair(link, pair)));
  const pegs = state.pegs.slice();
  pegs[hole.id] = codeOf(state.turn);
  for (const [a, b] of added) {
    if (a === b) return fail("link", state);
    if (pegs[a] !== codeOf(state.turn) || pegs[b] !== codeOf(state.turn)) return fail("link", state);
    if (!isKnight(board, a, b)) return fail("link", state);
    if (linkBlocked(board, links, a, b)) return fail("cross", state);
    if (hasLink(links, a, b)) return fail("link", state);
    links.push([a, b]);
  }
  const next = clone(state);
  next.pegs = pegs;
  next.links = links;
  const won = twixtWins(board, next.pegs, next.links, state.turn);
  if (won) {
    next.winIds = won;
    next.result = { winner: state.turn, reason: "connect", red: null, blue: null };
    next.last = { t: "twixt", hole: hole.id, add: added, remove: removed, color: state.turn };
    next.pieOpen = false;
    next.moveCount += 1;
    return { ok: true, state: next };
  }
  return finishTurn(next, {
    t: "twixt",
    hole: hole.id,
    add: added,
    remove: removed,
    color: state.turn,
  });
}

function playPunct(state, move) {
  if (move.t === "place") return placePunct(state, move);
  if (move.t === "shift") return shiftPunct(state, move);
  return fail("bad", state);
}

function placePunct(state, move) {
  const board = boardOf("punct", 0);
  const bucket = state.supply[state.turn];
  if (!bucket?.[move.kind]) return fail("supply", state);
  const cells = footprint(board, move.kind, move.orient, move.id);
  if (!cells) return fail("off", state);
  if (cells.some((id) => cellSurface(state.pieces, id) > 0)) return fail("occupied", state);
  const touchesCenter = cells.some((id) => board.cells[id].center);
  const opening = state.pieces.length === 0;
  if (state.punctRules === "standard" && touchesCenter) return fail("center", state);
  if (state.punctRules === "basic" && opening && touchesCenter) return fail("center", state);
  const next = clone(state);
  next.supply[state.turn][move.kind] -= 1;
  next.pieces.push({
    id: state.nextId,
    color: state.turn,
    kind: move.kind,
    orient: move.orient % orientCount(move.kind),
    cells,
    level: 0,
  });
  next.nextId += 1;
  return settlePunct(next, state.turn, {
    t: "place",
    kind: move.kind,
    orient: move.orient,
    id: move.id,
    color: state.turn,
  });
}

function shiftPunct(state, move) {
  const board = boardOf("punct", 0);
  const piece = state.pieces.find((item) => item.id === move.id);
  if (!piece || piece.color !== state.turn) return fail("piece", state);
  if (pieceCovered(state.pieces, piece)) return fail("covered", state);
  const from = board.cells[piece.cells[0]];
  const to = board.cells[move.to];
  if (!from || !to || !onLine(from, to)) return fail("line", state);
  const kind = piece.kind;
  const orient = move.orient;
  if (!orientAllowed(kind, piece.orient, orient)) return fail("flip", state);
  const cells = footprint(board, kind, orient, move.to);
  if (!cells) return fail("off", state);
  const rest = state.pieces.filter((item) => item.id !== piece.id);
  const landing = landingLevel(rest, cells, kind, piece.color);
  if (!landing.ok) return fail(landing.reason, state);
  const same =
    piece.cells.length === cells.length &&
    piece.cells.every((id, index) => id === cells[index]) &&
    piece.orient === orient &&
    piece.level === landing.level;
  if (same) return fail("same", state);
  const next = clone(state);
  const target = next.pieces.find((item) => item.id === piece.id);
  target.cells = cells;
  target.orient = orient;
  target.level = landing.level;
  return settlePunct(next, state.turn, {
    t: "shift",
    id: piece.id,
    to: move.to,
    orient,
    color: state.turn,
  });
}

function settlePunct(state, color, last) {
  const board = boardOf("punct", 0);
  const stones = punctStones(state, board);
  const won = winningIds(board, stones, codeOf(color));
  if (won) {
    state.winIds = won;
    state.result = { winner: color, reason: "connect", red: null, blue: null };
    state.last = last;
    state.pieOpen = false;
    state.moveCount += 1;
    return { ok: true, state };
  }
  const revealed = winningIds(board, stones, codeOf(other(color)));
  if (revealed) {
    state.winIds = revealed;
    state.result = { winner: other(color), reason: "connect", red: null, blue: null };
    state.last = last;
    state.pieOpen = false;
    state.moveCount += 1;
    return { ok: true, state };
  }
  const placedLast = last.t === "place" && supplyCount(state.supply[color]) === 0;
  if (placedLast) {
    if (state.punctRules === "basic") {
      state.result = { winner: "draw", reason: "draw", red: null, blue: null };
    } else {
      const red = centerCount(board, stones, 1);
      const blue = centerCount(board, stones, 2);
      let winner = "draw";
      if (red > blue) winner = "red";
      else if (blue > red) winner = "blue";
      state.result = { winner, reason: "center", red, blue };
    }
    state.last = last;
    state.pieOpen = false;
    state.moveCount += 1;
    return { ok: true, state };
  }
  return finishTurn(state, last);
}

function supplyCount(bucket) {
  return Object.values(bucket).reduce((sum, n) => sum + n, 0);
}

function centerCount(board, stones, code) {
  let n = 0;
  for (const cell of board.cells) {
    if (cell.center && stones[cell.id] === code) n += 1;
  }
  return n;
}

function cellSurface(pieces, id) {
  let height = 0;
  for (const piece of pieces) {
    if (piece.cells.includes(id)) height = Math.max(height, piece.level + 1);
  }
  return height;
}

function topColor(pieces, id) {
  let best = null;
  for (const piece of pieces) {
    if (!piece.cells.includes(id)) continue;
    if (!best || piece.level > best.level) best = piece;
  }
  return best ? best.color : null;
}

function pieceCovered(pieces, piece) {
  for (const id of piece.cells) {
    for (const other of pieces) {
      if (other.id === piece.id) continue;
      if (other.level > piece.level && other.cells.includes(id)) return true;
    }
  }
  return false;
}

function orientAllowed(kind, from, to) {
  if (kind !== "am") return to >= 0 && to < orientCount(kind);
  const fromMirror = from >= 6;
  const toMirror = to >= 6;
  return fromMirror === toMirror;
}

function onLine(from, to) {
  if (from.id === to.id) return true;
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  const ds = -dq - dr;
  const g = gcd(gcd(Math.abs(dq), Math.abs(dr)), Math.abs(ds));
  if (!g) return true;
  const uq = dq / g;
  const ur = dr / g;
  return DIRS.some(([dq0, dr0]) => dq0 === uq && dr0 === ur);
}

function gcd(a, b) {
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function landingLevel(pieces, cells, kind, color) {
  const surfaces = cells.map((id) => cellSurface(pieces, id));
  const meta = shapeMeta(kind);
  const same = surfaces.every((height) => height === surfaces[0]);
  if (same) {
    const height = surfaces[0];
    if (height > 0 && topColor(pieces, cells[0]) !== color) return { ok: false, reason: "punct" };
    return { ok: true, level: height };
  }
  if (!meta.bridge) return { ok: false, reason: "support" };
  const [e1, e2] = meta.ends;
  const mid = meta.mid;
  if (surfaces[e1] !== surfaces[e2]) return { ok: false, reason: "support" };
  const height = surfaces[e1];
  if (height < 1 || surfaces[mid] >= height) return { ok: false, reason: "bridge" };
  const punctCell = cells[0];
  if (punctCell !== cells[e1] && punctCell !== cells[e2]) return { ok: false, reason: "punct" };
  if (topColor(pieces, punctCell) !== color) return { ok: false, reason: "punct" };
  return { ok: true, level: height };
}

function punctStones(state, board) {
  const stones = Array(board.cells.length).fill(0);
  const level = Array(board.cells.length).fill(-1);
  for (const piece of state.pieces) {
    const code = codeOf(piece.color);
    piece.cells.forEach((id) => {
      if (piece.level > level[id]) {
        level[id] = piece.level;
        stones[id] = code;
      }
    });
  }
  return stones;
}

export function punctView(state) {
  const board = boardOf("punct", 0);
  const level = Array(board.cells.length).fill(-1);
  const top = Array(board.cells.length).fill(null);
  for (const piece of state.pieces) {
    piece.cells.forEach((id) => {
      if (piece.level > level[id]) {
        level[id] = piece.level;
        top[id] = piece.id;
      }
    });
  }
  return state.pieces.map((piece) => ({
    ...piece,
    covered: piece.cells.some((id) => top[id] !== piece.id),
  }));
}

export function rayCells(board, fromId) {
  const from = board.cells[fromId];
  const ids = [fromId];
  for (const [dq, dr] of DIRS) {
    let q = from.q + dq;
    let r = from.r + dr;
    while (board.at.has(`${q},${r}`)) {
      ids.push(board.at.get(`${q},${r}`));
      q += dq;
      r += dr;
    }
  }
  return ids;
}

function winningIds(board, stones, code) {
  const goals = board.goals?.[colorOf(code)];
  if (!goals) return null;
  for (const sides of goals) {
    const hit = componentTouching(board, stones, code, sides);
    if (hit) return hit;
  }
  return null;
}

function componentTouching(board, stones, code, sides) {
  const need = new Set(sides);
  const parent = Array.from({ length: board.cells.length }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const uni = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };
  for (let i = 0; i < stones.length; i += 1) {
    if (stones[i] !== code) continue;
    for (const j of board.neighbors[i]) {
      if (stones[j] === code) uni(i, j);
    }
  }
  if (board.hub) {
    const mine = board.hub.filter((id) => stones[id] === code);
    for (let i = 1; i < mine.length; i += 1) uni(mine[0], mine[i]);
  }
  const bags = new Map();
  for (let i = 0; i < stones.length; i += 1) {
    if (stones[i] !== code) continue;
    const root = find(i);
    let bag = bags.get(root);
    if (!bag) {
      bag = { cells: [], sides: new Set() };
      bags.set(root, bag);
    }
    bag.cells.push(i);
    for (const side of board.cells[i].sides) bag.sides.add(side);
  }
  for (const bag of bags.values()) {
    if ([...need].every((side) => bag.sides.has(side))) return bag.cells;
  }
  return null;
}

function bludingWins(board, taken, color) {
  const dots = color === "red" ? board.red : board.blue;
  const parent = Array.from({ length: dots.length + 2 }, (_, i) => i);
  const start = dots.length;
  const end = dots.length + 1;
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const uni = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };
  for (const dot of dots) {
    if (dot.border === "start") uni(dot.id, start);
    if (dot.border === "end") uni(dot.id, end);
  }
  const used = [];
  for (const bridge of board.bridges) {
    if (bridge.color !== color || !taken[bridge.id]) continue;
    uni(bridge.a, bridge.b);
    used.push(bridge.id);
  }
  if (find(start) !== find(end)) return null;
  const root = find(start);
  return used.filter((id) => find(board.bridges[id].a) === root);
}

function twixtWins(board, pegs, links, color) {
  const code = codeOf(color);
  const n = board.holes.length;
  const parent = Array.from({ length: n + 2 }, (_, i) => i);
  const start = n;
  const end = n + 1;
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const uni = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };
  for (const hole of board.holes) {
    if (pegs[hole.id] !== code || hole.border !== color) continue;
    if (color === "red") {
      if (hole.r === 0) uni(hole.id, start);
      if (hole.r === board.n - 1) uni(hole.id, end);
    } else {
      if (hole.c === 0) uni(hole.id, start);
      if (hole.c === board.n - 1) uni(hole.id, end);
    }
  }
  for (const [a, b] of links) {
    if (pegs[a] !== code || pegs[b] !== code) continue;
    uni(a, b);
  }
  if (find(start) !== find(end)) return null;
  const root = find(start);
  const ids = [];
  for (let i = 0; i < n; i += 1) {
    if (pegs[i] === code && find(i) === root) ids.push(i);
  }
  return ids;
}

function isKnight(board, a, b) {
  const pa = board.holes[a];
  const pb = board.holes[b];
  const dr = Math.abs(pa.r - pb.r);
  const dc = Math.abs(pa.c - pb.c);
  return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
}

function orient2(p, q, r) {
  return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
}

function segmentsCross(a, b, c, d) {
  const o1 = orient2(a, b, c);
  const o2 = orient2(a, b, d);
  const o3 = orient2(c, d, a);
  const o4 = orient2(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function holePoint(board, id) {
  const hole = board.holes[id];
  return { x: hole.c, y: hole.r };
}

export function linksCross(board, a, b, c, d) {
  if (a === c || a === d || b === c || b === d) return false;
  return segmentsCross(holePoint(board, a), holePoint(board, b), holePoint(board, c), holePoint(board, d));
}

function linkBlocked(board, links, a, b) {
  for (const [c, d] of links) {
    if (linksCross(board, a, b, c, d)) return true;
  }
  return false;
}

function hasLink(links, a, b) {
  return links.some((link) => samePair(link, [a, b]));
}

function samePair(a, b) {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}

function normalizePairs(pairs) {
  return pairs.map(([a, b]) => (a < b ? [a, b] : [b, a]));
}

export function twixtCandidates(state, hole, removed, touchOnly = false) {
  const board = boardOf("twixt", state.size);
  const code = codeOf(state.turn);
  const removedPairs = normalizePairs(removed || []);
  const links = state.links.filter((link) => !removedPairs.some((pair) => samePair(link, pair)));
  const pegs = state.pegs.slice();
  pegs[hole] = code;
  const found = [];
  for (let i = 0; i < pegs.length; i += 1) {
    if (pegs[i] !== code) continue;
    for (let j = i + 1; j < pegs.length; j += 1) {
      if (pegs[j] !== code) continue;
      if (!isKnight(board, i, j)) continue;
      if (hasLink(links, i, j) || hasLink(found, i, j)) continue;
      if (linkBlocked(board, links, i, j) || linkBlocked(board, found, i, j)) continue;
      if (touchOnly && i !== hole && j !== hole) continue;
      found.push([i, j]);
    }
  }
  return found;
}

export function scoreState(state) {
  if (state.game === "star") return scoreStar(boardOf("star", state.size), state.stones);
  if (state.game === "sstar") return scoreSStar(boardOf("sstar", state.size), state.stones);
  return null;
}

export function scoreStar(board, stones) {
  const scores = { red: 0, blue: 0, touch: [[], []] };
  for (const code of [1, 2]) {
    const groups = groupsOf(board, stones, code);
    for (const group of groups) {
      const touched = new Set();
      for (const id of group) {
        for (const partial of board.cellPartials[id]) touched.add(partial);
      }
      if (touched.size >= 3) scores[colorOf(code)] += touched.size - 2;
      scores.touch[code - 1].push(...touched);
    }
  }
  return scores;
}

export function scoreSStar(board, stones) {
  const perim = board.perimeter;
  const stars = { 1: [], 2: [] };
  const direct = new Map();
  for (const code of [1, 2]) {
    for (const group of groupsOf(board, stones, code)) {
      const edges = group.filter((id) => board.perimIndex.has(id));
      if (edges.length < 2) continue;
      const star = { code, cells: group, edges };
      stars[code].push(star);
      for (const id of edges) direct.set(id, code);
    }
  }
  const owned = new Map();
  for (const [id, code] of direct) owned.set(id, code);
  for (const code of [1, 2]) {
    for (const star of stars[code]) {
      const contacts = star.edges
        .map((id) => board.perimIndex.get(id))
        .sort((a, b) => a - b);
      const walls = new Set(star.cells);
      for (let i = 0; i < contacts.length; i += 1) {
        const a = contacts[i];
        const b = contacts[(i + 1) % contacts.length];
        const arc = [];
        let k = (a + 1) % perim.length;
        let guard = 0;
        while (k !== b && guard <= perim.length) {
          arc.push(k);
          k = (k + 1) % perim.length;
          guard += 1;
        }
        if (!arc.length || arc.length * 2 >= perim.length) continue;
        if (!pocket(board, walls, arc)) continue;
        for (const index of arc) {
          const id = perim[index];
          if (direct.has(id) || owned.has(id)) continue;
          owned.set(id, code);
        }
      }
    }
  }
  const scores = { red: 0, blue: 0, owned };
  for (const code of [1, 2]) {
    let n = 0;
    let quarks = 0;
    for (const [id, owner] of owned) {
      if (owner !== code) continue;
      n += 1;
      if (board.cells[id].corner) quarks += 1;
    }
    if (quarks >= 3) n += 1;
    scores[colorOf(code)] = n;
  }
  const redStars = stars[1].length;
  const blueStars = stars[2].length;
  const diff = Math.abs(redStars - blueStars);
  if (redStars < blueStars) {
    scores.red += diff * 2;
    scores.blue -= diff * 2;
  } else if (blueStars < redStars) {
    scores.blue += diff * 2;
    scores.red -= diff * 2;
  }
  scores.stars = { red: redStars, blue: blueStars };
  return scores;
}

function pocket(board, walls, arc) {
  const arcSet = new Set(arc);
  const seen = new Set();
  const stack = [];
  for (const index of arc) {
    const id = board.perimeter[index];
    if (walls.has(id) || seen.has(id)) continue;
    seen.add(id);
    stack.push(id);
  }
  while (stack.length) {
    const id = stack.pop();
    if (board.cells[id].ring === 1) return false;
    const index = board.perimIndex.get(id);
    if (index != null && !arcSet.has(index) && !walls.has(id)) return false;
    for (const next of board.neighbors[id]) {
      if (walls.has(next) || seen.has(next)) continue;
      seen.add(next);
      stack.push(next);
    }
  }
  return true;
}

function groupsOf(board, stones, code) {
  const parent = Array.from({ length: stones.length }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const uni = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };
  for (let i = 0; i < stones.length; i += 1) {
    if (stones[i] !== code) continue;
    for (const j of board.neighbors[i]) {
      if (stones[j] === code) uni(i, j);
    }
  }
  if (board.hub) {
    const mine = board.hub.filter((id) => stones[id] === code);
    for (let i = 1; i < mine.length; i += 1) uni(mine[0], mine[i]);
  }
  const groups = new Map();
  for (let i = 0; i < stones.length; i += 1) {
    if (stones[i] !== code) continue;
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }
  return [...groups.values()];
}

export function sameGroup(state, a, b) {
  const board = boardOf(state.game, state.size);
  const stones =
    state.game === "punct" ? punctStones(state, board) : state.stones;
  if (!stones || stones[a] === 0 || stones[a] !== stones[b]) return false;
  return groupsOf(board, stones, stones[a]).some((group) => group.includes(a) && group.includes(b));
}

export function botToMove(state) {
  if (state.mode !== "practice" || state.result) return false;
  return state.seats[state.turn] !== state.humanSeat;
}

export function describeMove(state, move) {
  if (!move) return "";
  if (move.t === "swap") return "swap";
  if (move.t === "pass") return "pass";
  if (move.t === "resign") return "resign";
  if (move.t === "count") return "score";
  const board = boardOf(state.game, state.size);
  if (move.t === "cell") return board.cells[move.id]?.name || String(move.id);
  if (move.t === "bridge") return board.bridges[move.id]?.name || String(move.id);
  if (move.t === "twixt") {
    const hole = board.holes[move.hole];
    const extra = (move.add || []).length ? `+${move.add.length}` : "";
    return `${hole?.name || move.hole}${extra}`;
  }
  if (move.t === "place") {
    const kind = PUNCT_KINDS.find((item) => item.id === move.kind);
    return `${kind?.name || move.kind} ${board.cells[move.id]?.name || ""}`.trim();
  }
  if (move.t === "shift") return `move ${board.cells[move.to]?.name || ""}`.trim();
  return "";
}

export function encodeMoves(moves) {
  return moves.map(encodeMove).join("~");
}

export function decodeMoves(text) {
  if (!text) return [];
  return String(text)
    .split("~")
    .filter(Boolean)
    .map(decodeMove);
}

function encodeMove(move) {
  if (move.t === "cell") return `c${move.id}`;
  if (move.t === "bridge") return `g${move.id}`;
  if (move.t === "swap") return "s";
  if (move.t === "pass") return "p";
  if (move.t === "resign") return "r";
  if (move.t === "count") return "e";
  if (move.t === "place") return `a${move.kind}.${move.orient}.${move.id}`;
  if (move.t === "shift") return `m${move.id}.${move.to}.${move.orient}`;
  if (move.t === "twixt") {
    const add = (move.add || []).map((pair) => pair.join("-")).join(".");
    const remove = (move.remove || []).map((pair) => pair.join("-")).join(".");
    return `w${move.hole}:${add}:${remove}`;
  }
  return "";
}

function decodeMove(text) {
  if (text === "s") return { t: "swap" };
  if (text === "p") return { t: "pass" };
  if (text === "r") return { t: "resign" };
  if (text === "e") return { t: "count" };
  if (text.startsWith("c")) return { t: "cell", id: Number(text.slice(1)) };
  if (text.startsWith("g")) return { t: "bridge", id: Number(text.slice(1)) };
  if (text.startsWith("a")) {
    const [kind, orient, id] = text.slice(1).split(".");
    return { t: "place", kind, orient: Number(orient), id: Number(id) };
  }
  if (text.startsWith("m")) {
    const [id, to, orient] = text.slice(1).split(".");
    return { t: "shift", id: Number(id), to: Number(to), orient: Number(orient) };
  }
  if (text.startsWith("w")) {
    const [hole, add, remove] = text.slice(1).split(":");
    const pairs = (value) =>
      value
        ? value.split(".").filter(Boolean).map((item) => item.split("-").map(Number))
        : [];
    return { t: "twixt", hole: Number(hole), add: pairs(add), remove: pairs(remove) };
  }
  return { t: "bad" };
}

export function stonesLeft(state, color) {
  if (state.game !== "punct") return null;
  return supplyCount(state.supply[color]);
}

export function publicOptions(state) {
  return {
    game: state.game,
    size: state.size,
    pie: state.pie,
    punctRules: state.punctRules,
    mode: state.mode,
    human: state.humanSeat === "B" ? "blue" : "red",
  };
}

export function knownGame(id) {
  return GAME_IDS.has(id);
}
