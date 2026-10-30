import {
  apply,
  boardOf,
  orientCount,
  rayCells,
  scoreStar,
  scoreSStar,
  twixtCandidates,
} from "./logic.js";

function code(color) {
  return color === "red" ? 1 : 2;
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

function pick(pool) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)].move;
}

export function chooseMove(state) {
  if (!state || state.result) return null;
  if (state.pieOpen && state.turn === "blue" && shouldSwap(state)) return { t: "swap" };
  if (state.game === "bluding") return chooseBluding(state);
  if (state.game === "twixt") return chooseTwixt(state);
  if (state.game === "punct") return choosePunct(state);
  if (state.game === "star" || state.game === "sstar") return chooseScore(state);
  return chooseRace(state);
}

function shouldSwap(state) {
  const board = boardOf(state.game, state.size);
  if (state.game === "hex") {
    const id = state.stones.findIndex(Boolean);
    if (id < 0) return false;
    const cell = board.cells[id];
    const mid = (state.size - 1) / 2;
    return Math.abs(cell.q - mid) + Math.abs(cell.r - mid) <= state.size / 3;
  }
  if (state.game === "y") {
    const id = state.stones.findIndex(Boolean);
    if (id < 0) return false;
    const cell = board.cells[id];
    const n = state.size;
    return cell.q > n / 6 && cell.r > n / 6 && cell.q + cell.r < n * 0.72;
  }
  if (state.game === "bluding") {
    const id = state.taken.findIndex(Boolean);
    const bridge = board.bridges[id];
    return Boolean(bridge && bridge.cross != null);
  }
  if (state.game === "twixt") {
    const id = state.pegs.findIndex(Boolean);
    const hole = board.holes[id];
    const mid = (state.size - 1) / 2;
    return Math.abs(hole.r - mid) + Math.abs(hole.c - mid) < state.size / 3;
  }
  if (state.game === "sstar") {
    const id = state.stones.findIndex(Boolean);
    return (board.cells[id]?.ring || 9) <= Math.max(2, Math.floor(state.size / 3));
  }
  if (state.game === "star") {
    const id = state.stones.findIndex(Boolean);
    return (board.neighbors[id]?.length || 0) >= 6;
  }
  return false;
}

function sideDist(board, stones, code, sideA, sideB) {
  const opp = code === 1 ? 2 : 1;
  const dist = Array(stones.length).fill(1e9);
  const dq = [];
  const push = (id, next, free) => {
    if (next >= dist[id]) return;
    dist[id] = next;
    if (free) dq.unshift(id);
    else dq.push(id);
  };
  for (let i = 0; i < stones.length; i += 1) {
    if (!board.cells[i].sides.includes(sideA) || stones[i] === opp) continue;
    const free = stones[i] === code;
    push(i, free ? 0 : 1, free);
  }
  while (dq.length) {
    const id = dq.shift();
    for (const nb of board.neighbors[id] || []) {
      if (stones[nb] === opp) continue;
      const free = stones[nb] === code;
      push(nb, dist[id] + (free ? 0 : 1), free);
    }
  }
  let best = 1e9;
  for (let i = 0; i < stones.length; i += 1) {
    if (board.cells[i].sides.includes(sideB)) best = Math.min(best, dist[i]);
  }
  return best;
}

function goalDist(board, stones, code) {
  const goals = board.goals[code === 1 ? "red" : "blue"];
  let best = 1e9;
  for (const sides of goals) {
    let total = 0;
    for (let i = 1; i < sides.length; i += 1) {
      total += sideDist(board, stones, code, sides[0], sides[i]);
    }
    best = Math.min(best, total);
  }
  return best;
}

function chooseRace(state) {
  const board = boardOf(state.game, state.size);
  const me = code(state.turn);
  const opp = me === 1 ? 2 : 1;
  let pool = [];
  for (let id = 0; id < state.stones.length; id += 1) {
    if (state.stones[id]) continue;
    const stones = state.stones.slice();
    stones[id] = me;
    const mine = goalDist(board, stones, me);
    if (mine === 0) return { t: "cell", id };
    const score = mine * 100 - goalDist(board, stones, opp);
    if (!pool.length || score < pool[0].score) pool = [{ move: { t: "cell", id }, score }];
    else if (score === pool[0].score) pool.push({ move: { t: "cell", id }, score });
  }
  return pick(pool);
}

function chooseScore(state) {
  const board = boardOf(state.game, state.size);
  const me = code(state.turn);
  let pool = [];
  for (let id = 0; id < state.stones.length; id += 1) {
    if (state.stones[id]) continue;
    const stones = state.stones.slice();
    stones[id] = me;
    const scores = state.game === "star" ? scoreStar(board, stones) : scoreSStar(board, stones);
    const score = scores[state.turn] - scores[state.turn === "red" ? "blue" : "red"];
    const move = { t: "cell", id };
    if (!pool.length || score > pool[0].score) pool = [{ move, score }];
    else if (score === pool[0].score) pool.push({ move, score });
  }
  return pick(pool);
}

function bludingDist(board, taken, color) {
  const dots = color === "red" ? board.red : board.blue;
  const dist = Array(dots.length).fill(1e9);
  const dq = [];
  const push = (id, next, free) => {
    if (id < 0 || id >= dist.length || next >= dist[id]) return;
    dist[id] = next;
    if (free) dq.unshift(id);
    else dq.push(id);
  };
  for (const dot of dots) {
    if (dot.border === "start") push(dot.id, 0, true);
  }
  const edges = board.bridges.filter((bridge) => bridge.color === color);
  while (dq.length) {
    const id = dq.shift();
    for (const bridge of edges) {
      const other = bridge.a === id ? bridge.b : bridge.b === id ? bridge.a : -1;
      if (other < 0) continue;
      if (taken[bridge.id]) push(other, dist[id], true);
      else if (bridge.cross == null || !taken[bridge.cross]) push(other, dist[id] + 1, false);
    }
  }
  let best = 1e9;
  for (const dot of dots) {
    if (dot.border === "end") best = Math.min(best, dist[dot.id]);
  }
  return best;
}

function chooseBluding(state) {
  const board = boardOf("bluding", state.size);
  const me = state.turn;
  const opp = me === "red" ? "blue" : "red";
  let pool = [];
  for (const bridge of board.bridges) {
    if (bridge.color !== me || state.taken[bridge.id]) continue;
    if (bridge.cross != null && state.taken[bridge.cross]) continue;
    const taken = state.taken.slice();
    taken[bridge.id] = code(me);
    const mine = bludingDist(board, taken, me);
    if (mine === 0) return { t: "bridge", id: bridge.id };
    const score = mine * 100 - bludingDist(board, taken, opp);
    const move = { t: "bridge", id: bridge.id };
    if (!pool.length || score < pool[0].score) pool = [{ move, score }];
    else if (score === pool[0].score) pool.push({ move, score });
  }
  return pick(pool);
}

function twixtDist(state, color) {
  const board = boardOf("twixt", state.size);
  const me = code(color);
  const opp = me === 1 ? 2 : 1;
  const n = board.holes.length;
  const dist = Array(n).fill(1e9);
  const dq = [];
  const push = (id, next, free) => {
    if (next >= dist[id]) return;
    dist[id] = next;
    if (free) dq.unshift(id);
    else dq.push(id);
  };
  const linked = new Set(state.links.map(([a, b]) => (a < b ? `${a},${b}` : `${b},${a}`)));
  for (const hole of board.holes) {
    const home = color === "red" ? hole.r === 0 : hole.c === 0;
    if (!home || state.pegs[hole.id] === opp) continue;
    const free = state.pegs[hole.id] === me;
    push(hole.id, free ? 0 : 1, free);
  }
  const targets = board.holes.map((hole) => {
    const out = [];
    for (const [dr, dc] of [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ]) {
      const id = board.holeAt.get(`${hole.r + dr},${hole.c + dc}`);
      if (id != null) out.push(id);
    }
    return out;
  });
  while (dq.length) {
    const id = dq.shift();
    for (const nb of targets[id]) {
      if (state.pegs[nb] === opp) continue;
      const key = id < nb ? `${id},${nb}` : `${nb},${id}`;
      const free = linked.has(key) || state.pegs[nb] === me;
      push(nb, dist[id] + (free ? 0 : 1), free);
    }
  }
  let best = 1e9;
  for (const hole of board.holes) {
    const far = color === "red" ? hole.r === board.n - 1 : hole.c === board.n - 1;
    if (far) best = Math.min(best, dist[hole.id]);
  }
  return best;
}

function chooseTwixt(state) {
  const board = boardOf("twixt", state.size);
  let holes = [];
  for (const hole of board.holes) {
    if (state.pegs[hole.id]) continue;
    if (hole.border && hole.border !== state.turn) continue;
    holes.push(hole.id);
  }
  if (holes.length > 42) holes = shuffle(holes).slice(0, 42);
  const opp = state.turn === "red" ? "blue" : "red";
  let pool = [];
  for (const hole of holes) {
    const add = twixtCandidates(state, hole, [], true);
    const move = { t: "twixt", hole, add, remove: [] };
    const next = apply(state, move);
    if (!next.ok) continue;
    if (next.state.result?.winner === state.turn) return move;
    const score = twixtDist(next.state, state.turn) * 100 - twixtDist(next.state, opp);
    if (!pool.length || score < pool[0].score) pool = [{ move, score }];
    else if (score === pool[0].score) pool.push({ move, score });
  }
  return pick(pool);
}

function choosePunct(state) {
  const board = boardOf("punct", 0);
  const me = code(state.turn);
  const opp = me === 1 ? 2 : 1;
  let pool = [];
  let won = null;
  const consider = (move) => {
    if (won) return;
    const next = apply(state, move);
    if (!next.ok) return;
    if (next.state.result?.winner === state.turn) {
      won = move;
      return;
    }
    if (next.state.result) return;
    const stones = visible(next.state, board);
    const score = goalDist(board, stones, me) * 40 - goalDist(board, stones, opp);
    if (!pool.length || score < pool[0].score) pool = [{ move, score }];
    else if (score === pool[0].score && pool.length < 8) pool.push({ move, score });
  };
  const kinds = Object.entries(state.supply[state.turn]).filter(([, n]) => n > 0);
  const anchors = shuffle(board.cells.map((cell) => cell.id)).slice(0, 28);
  for (const [kind] of kinds) {
    for (const id of anchors) {
      for (let orient = 0; orient < orientCount(kind); orient += 1) {
        consider({ t: "place", kind, orient, id });
      }
    }
  }
  if (won) return won;
  for (const piece of state.pieces) {
    if (piece.color !== state.turn) continue;
    for (const to of rayCells(board, piece.cells[0])) {
      for (let orient = 0; orient < orientCount(piece.kind); orient += 1) {
        if (piece.kind === "am" && (orient >= 6) !== (piece.orient >= 6)) continue;
        consider({ t: "shift", id: piece.id, to, orient });
      }
    }
    if (won) return won;
  }
  if (won) return won;
  if (pool.length) return pick(pool);
  for (const [kind] of kinds) {
    for (const cell of board.cells) {
      for (let orient = 0; orient < orientCount(kind); orient += 1) {
        const move = { t: "place", kind, orient, id: cell.id };
        if (apply(state, move).ok) return move;
      }
    }
  }
  return null;
}

function visible(state, board) {
  const stones = Array(board.cells.length).fill(0);
  const level = Array(board.cells.length).fill(-1);
  for (const piece of state.pieces) {
    const mark = code(piece.color);
    for (const id of piece.cells) {
      if (piece.level >= level[id]) {
        level[id] = piece.level;
        stones[id] = mark;
      }
    }
  }
  return stones;
}
