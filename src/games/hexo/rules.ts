/**
 * Extra HeXO tables. A plain two-player hex game never comes through here.
 * Placements, the duck, and lifts share one log so every browser plays the
 * same sequence.
 */

import type { BoardSize, Coord } from "./logic.ts";
import { gameBoard, type GameBoard, type Grid } from "./grids.ts";

export type Side = "X" | "O" | "Y" | "Z";

export type Rules = {
  grid: Grid;
  players: 2 | 3 | 4;
  duck: boolean;
  king: boolean;
  cap: number;
  echo: boolean;
  orbit: boolean;
  meteor: boolean;
  rift: boolean;
  raid: boolean;
  slide: boolean;
  frost: boolean;
  pair: boolean;
  scatter: boolean;
  siege: boolean;
  pendulum: boolean;
  mine: boolean;
};

export type Act = {
  kind: "place" | "duck" | "remove" | "pass" | "steal" | "slide" | "mine";
  key: string;
  letter: string;
  number: number;
  from?: string;
};

type Ghost = { key: string; owner: Side; born: number };
type Echo = { due: number; kind: "place" | "duck"; key: string; owner: Side };

export type Table = {
  stones: Record<string, Side>;
  duck: string | null;
  ghosts: Ghost[];
  rifts: string[];
  turn: Side;
  winner: Side | "draw" | null;
  lines: Coord[][];
  phase: "place" | "trim" | "duck" | "steal";
  removesLeft: number;
  stonesLeft: number;
  panic: string[];
  threats: string[];
  legal: Act[];
  halo: string[];
  placedTotal: number;
  placedThisTurn: string[];
  mines: string[];
  turnCount: number;
};

type Raw = {
  stones: Record<string, Side>;
  duck: string | null;
  ghosts: Ghost[];
  rifts: string[];
  echoes: Echo[];
  turnCount: number;
  phase: "place" | "trim" | "duck" | "steal";
  actor: Side;
  placedTotal: number;
  placedThisTurn: string[];
  spent: number;
  mines: string[];
  removesLeft: number;
  winner: Side | "draw" | null;
};

const ORDER: Side[] = ["X", "O", "Y", "Z"];

export function plainRules(): Rules {
  return {
    grid: "hex",
    players: 2,
    duck: false,
    king: false,
    cap: 0,
    echo: false,
    orbit: false,
    meteor: false,
    rift: false,
    raid: false,
    slide: false,
    frost: false,
    pair: false,
    scatter: false,
    siege: false,
    pendulum: false,
    mine: false,
  };
}

export function isPlain(rules: Rules): boolean {
  return (
    rules.grid === "hex" &&
    rules.players === 2 &&
    !rules.duck &&
    !rules.king &&
    !rules.cap &&
    !rules.echo &&
    !rules.orbit &&
    !rules.meteor &&
    !rules.rift &&
    !rules.raid &&
    !rules.slide &&
    !rules.frost &&
    !rules.pair &&
    !rules.scatter &&
    !rules.siege &&
    !rules.pendulum &&
    !rules.mine
  );
}

export function encodeAlt(rules: Rules): string {
  if (isPlain(rules)) return "";
  const parts: string[] = [];
  if (rules.grid !== "hex") parts.push(rules.grid);
  if (rules.players !== 2) parts.push(String(rules.players));
  if (rules.king) parts.push("king");
  else if (rules.duck) parts.push("duck");
  if (rules.cap > 0) parts.push(`cap${rules.cap}`);
  if (rules.echo) parts.push("echo");
  if (rules.orbit) parts.push("orbit");
  if (rules.meteor) parts.push("meteor");
  if (rules.rift) parts.push("rift");
  if (rules.raid) parts.push("raid");
  if (rules.slide) parts.push("slide");
  if (rules.frost) parts.push("frost");
  if (rules.pair) parts.push("pair");
  if (rules.scatter) parts.push("scatter");
  if (rules.siege) parts.push("siege");
  if (rules.pendulum) parts.push("pendulum");
  if (rules.mine) parts.push("mine");
  return parts.join("-");
}

export function decodeAlt(raw: string): Rules {
  const rules = plainRules();
  if (!raw) return rules;
  for (const part of raw.split("-")) {
    if (part === "tri" || part === "sq" || part === "oct" || part === "rad" || part === "pen") rules.grid = part;
    else if (part === "3") rules.players = 3;
    else if (part === "4") rules.players = 4;
    else if (part === "duck") rules.duck = true;
    else if (part === "king") {
      rules.king = true;
      rules.duck = true;
    } else if (part === "echo") rules.echo = true;
    else if (part === "orbit") rules.orbit = true;
    else if (part === "meteor") rules.meteor = true;
    else if (part === "rift") rules.rift = true;
    else if (part === "raid") rules.raid = true;
    else if (part === "slide") rules.slide = true;
    else if (part === "frost") rules.frost = true;
    else if (part === "pair") rules.pair = true;
    else if (part === "scatter") rules.scatter = true;
    else if (part === "siege") rules.siege = true;
    else if (part === "pendulum") rules.pendulum = true;
    else if (part === "mine") rules.mine = true;
    else {
      const cap = /^cap(\d+)$/.exec(part);
      if (cap) rules.cap = Math.max(1, Math.min(40, Number(cap[1])));
    }
  }
  return rules;
}

export function playerAt(index: number, players: number): Side {
  const count = players === 3 || players === 4 ? players : 2;
  if (index <= 0) return "X";
  const pair = Math.floor((index - 1) / 2);
  return ORDER[(pair + 1) % count];
}

export function actionCode(act: Act): string {
  if (act.kind === "pass") return "*";
  if (act.kind === "duck") return `~${act.key}`;
  if (act.kind === "remove") return `-${act.key}`;
  if (act.kind === "steal") return `>${act.key}`;
  if (act.kind === "mine") return `&${act.key}`;
  if (act.kind === "slide") return `${act.from}^${act.key}`;
  return act.key;
}

function cellOf(body: string): Act | null {
  const match = /^([a-z])(\d+)$/.exec(body);
  if (!match) return null;
  return { kind: "place", key: body, letter: match[1], number: Number(match[2]) };
}

export function parseCode(code: string): Act | null {
  if (code === "*") return { kind: "pass", key: "", letter: "", number: 0 };
  const slide = code.split("^");
  if (slide.length === 2) {
    const from = cellOf(slide[0]);
    const to = cellOf(slide[1]);
    if (!from || !to) return null;
    return { kind: "slide", key: to.key, letter: to.letter, number: to.number, from: from.key };
  }
  let kind: Act["kind"] = "place";
  let body = code;
  if (code.startsWith("~")) {
    kind = "duck";
    body = code.slice(1);
  } else if (code.startsWith("-")) {
    kind = "remove";
    body = code.slice(1);
  } else if (code.startsWith(">")) {
    kind = "steal";
    body = code.slice(1);
  } else if (code.startsWith("&")) {
    kind = "mine";
    body = code.slice(1);
  }
  const match = /^([a-z])(\d+)$/.exec(body);
  if (!match) return null;
  return { kind, key: body, letter: match[1], number: Number(match[2]) };
}

export function encodeLog(actions: Act[]): string {
  if (!actions.length) return "";
  const raw = actions.map(actionCode).join(".");
  return btoa(raw).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function decodeLog(value: string): Act[] | null {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const raw = atob(padded).toLowerCase();
    if (!raw) return [];
    const actions: Act[] = [];
    for (const part of raw.split(".")) {
      const act = parseCode(part);
      if (!act) return null;
      actions.push(act);
    }
    return actions;
  } catch {
    return null;
  }
}

export function project(actions: Act[], rules: Rules, board: GameBoard): Table | null {
  let raw = fresh(board, rules);
  for (const act of actions) {
    const next = step(raw, act, board, rules);
    if (!next) return null;
    raw = next;
  }
  return present(raw, board, rules);
}

export function botPick(table: Table, board: GameBoard, rules: Rules): Act | null {
  const acts = table.legal;
  if (!acts.length || table.winner) return null;
  if (table.phase === "trim") {
    const own = Object.values(table.stones).filter((side) => side === table.turn).length;
    const lifts = acts.filter((act) => act.kind === "remove");
    if (own > rules.cap && lifts.length) {
      lifts.sort((a, b) => (board.ring[b.key] ?? 0) - (board.ring[a.key] ?? 0));
      return lifts[0];
    }
    return acts.find((act) => act.kind === "pass") ?? acts[0];
  }
  if (table.phase === "steal") {
    const takes = acts.filter((act) => act.kind === "steal");
    takes.sort((a, b) => stealRank(table, board, b.key) - stealRank(table, board, a.key));
    return takes[0] ?? null;
  }
  if (table.phase === "duck") {
    const spots = acts.filter((act) => act.kind === "duck");
    spots.sort((a, b) => (board.ring[a.key] ?? 0) - (board.ring[b.key] ?? 0));
    return spots[0] ?? null;
  }
  const places = acts.filter((act) => act.kind === "place");
  const aimed = aimStone(table, board, rules, places, acts);
  if (aimed) return aimed;
  const pool = places.length ? places : acts.filter((act) => act.kind === "slide");
  const using = pool.length ? pool : acts;
  let best = using[0];
  let bestScore = -Infinity;
  for (const act of using) {
    let score = ((board.radius || 0) - (board.ring[act.key] ?? 0)) * 6;
    for (const near of board.touch[act.key] ?? []) {
      if (table.stones[near] === table.turn) score += 8;
      else if (table.stones[near]) score += 3;
    }
    if (act.kind === "mine") score -= 40;
    if (score > bestScore) {
      best = act;
      bestScore = score;
    }
  }
  return best;
}

function aimStone(
  table: Table,
  board: GameBoard,
  rules: Rules,
  places: Act[],
  acts: Act[],
): Act | null {
  const blocked = breakSet(table);
  const placeKeys = new Set(places.map((act) => act.key));
  const rank = (act: Act) => {
    let score = ((board.radius || 0) - (board.ring[act.key] ?? 0)) * 6;
    for (const near of board.touch[act.key] ?? []) {
      if (table.stones[near] === table.turn) score += 8;
      else if (table.stones[near]) score += 3;
    }
    return score;
  };
  const best = (list: Act[], cover?: Map<string, number>) =>
    list.reduce((top, act) => {
      const count = cover?.get(act.key) ?? 0;
      const topCount = cover?.get(top.key) ?? 0;
      if (count !== topCount) return count > topCount ? act : top;
      return rank(act) > rank(top) ? act : top;
    });

  const placeWins = places.filter((act) => hasRun({ ...table.stones, [act.key]: table.turn }, table.turn, board, blocked));
  if (placeWins.length) return best(placeWins);

  const slideWins = acts.filter((act) => {
    if (act.kind !== "slide" || !act.from) return false;
    const stones = { ...table.stones };
    delete stones[act.from];
    stones[act.key] = table.turn;
    return hasRun(stones, table.turn, board, blocked);
  });
  if (slideWins.length) return best(slideWins);

  if (table.stonesLeft >= 2) {
    const pairs = holePairs(table.stones, table.turn, board, blocked);
    const starts = places.filter((act) =>
      pairs.some(([a, b]) => {
        const other = act.key === a ? b : act.key === b ? a : "";
        return Boolean(other && placeKeys.has(other) && canFollow(board, rules, act.key, other));
      }),
    );
    if (starts.length) return best(starts);
  }

  const next = playerAt(table.placedTotal + table.stonesLeft, rules.players);
  const blockNow = holeCoverage(table.stones, next, 1, board, blocked);
  const blockNowActs = places.filter((act) => blockNow.has(act.key));
  if (blockNowActs.length) return best(blockNowActs, blockNow);
  const blockPair = holeCoverage(table.stones, next, 2, board, blocked);
  const blockPairActs = places.filter((act) => blockPair.has(act.key));
  if (blockPairActs.length) return best(blockPairActs, blockPair);
  return null;
}

function breakSet(table: Table): Set<string> {
  const blocked = new Set<string>(table.panic);
  if (table.duck) blocked.add(table.duck);
  for (const ghost of table.ghosts) blocked.add(ghost.key);
  for (const mine of table.mines) blocked.add(mine);
  return blocked;
}

function canFollow(board: GameBoard, rules: Rules, first: string, second: string): boolean {
  const touch = (board.touch[first] ?? []).includes(second);
  if (rules.pair && !touch) return false;
  if (rules.scatter && touch) return false;
  return true;
}

function hasRun(
  stones: Record<string, Side | undefined>,
  owner: Side,
  board: GameBoard,
  blocked: Set<string>,
): boolean {
  for (const line of board.lines) {
    for (const keys of scans(line, board)) {
      let run = 0;
      for (const key of keys) {
        if (blocked.has(key) || stones[key] !== owner) {
          if (run >= 6) return true;
          run = 0;
          continue;
        }
        run += 1;
      }
      if (run >= 6) return true;
    }
  }
  return false;
}

function holeCoverage(
  stones: Record<string, Side | undefined>,
  owner: Side,
  want: number,
  board: GameBoard,
  blocked: Set<string>,
): Map<string, number> {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const empties of holePairs(stones, owner, board, blocked, want)) {
    const id = [...empties].sort().join(".");
    if (seen.has(id)) continue;
    seen.add(id);
    for (const key of empties) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function holePairs(
  stones: Record<string, Side | undefined>,
  owner: Side,
  board: GameBoard,
  blocked: Set<string>,
  want = 2,
): Array<string[]> {
  const pairs: Array<string[]> = [];
  for (const line of board.lines) {
    for (const keys of scans(line, board)) {
      for (let start = 0; start < keys.length; start += 1) {
        const empties: string[] = [];
        let own = 0;
        for (let end = start; end < keys.length; end += 1) {
          const key = keys[end];
          if (blocked.has(key)) break;
          const stone = stones[key];
          if (stone && stone !== owner) break;
          if (stone === owner) own += 1;
          else empties.push(key);
          if (empties.length > want) break;
          if (end - start + 1 >= 6 && empties.length === want && own >= 6 - want) {
            pairs.push([...empties]);
          }
        }
      }
    }
  }
  return pairs;
}

function stealRank(table: Table, board: GameBoard, key: string): number {
  const owner = table.stones[key];
  let score = 0;
  for (const near of board.touch[key] ?? []) {
    if (table.stones[near] === owner) score += 5;
    if (table.stones[near] === table.turn) score += 2;
  }
  return score + ((board.radius || 0) - (board.ring[key] ?? 0));
}

function fresh(board: GameBoard, rules: Rules): Raw {
  return {
    stones: {},
    duck: null,
    ghosts: [],
    rifts: rules.rift ? seedRifts(board) : [],
    echoes: [],
    turnCount: 0,
    phase: "place",
    actor: "X",
    placedTotal: 0,
    placedThisTurn: [],
    spent: 0,
    mines: [],
    removesLeft: 0,
    winner: null,
  };
}

function seedRifts(board: GameBoard): string[] {
  const keys = board.cells.map((cell) => cell.key).sort();
  const picks: string[] = [];
  for (let i = 1; i <= 4; i += 1) {
    let index = Math.floor((keys.length * i) / 5);
    if (keys[index] === board.center) index = Math.min(keys.length - 1, index + 1);
    const key = keys[index];
    if (key && !picks.includes(key)) picks.push(key);
  }
  return picks;
}

function step(raw: Raw, act: Act, board: GameBoard, rules: Rules): Raw | null {
  if (raw.winner) return null;
  const legal = choices(raw, board, rules);
  if (!legal.some((item) => item.kind === act.kind && item.key === act.key && (item.from || "") === (act.from || ""))) return null;
  const next = clone(raw);
  if (act.kind === "place") return placed(next, act, board, rules);
  if (act.kind === "mine") return planted(next, act, board, rules);
  if (act.kind === "slide") return slid(next, act, board, rules);
  if (act.kind === "remove") return lifted(next, act, board, rules);
  if (act.kind === "steal") return taken(next, act, board, rules);
  if (act.kind === "pass") return afterStones(next, board, rules);
  next.duck = act.key;
  if (rules.echo) {
    next.echoes.push({ due: next.turnCount + 2, kind: "duck", key: act.key, owner: next.actor });
  }
  return finishTurn(next, board, rules);
}

function placed(raw: Raw, act: Act, board: GameBoard, rules: Rules): Raw {
  const opening = raw.placedTotal === 0;
  raw.placedTotal += 1;
  raw.spent += 1;
  const trapped = raw.mines.includes(act.key);
  raw.stones[act.key] = raw.actor;
  if (trapped) {
    delete raw.stones[act.key];
    raw.mines = raw.mines.filter((key) => key !== act.key);
    return continueTurn(raw, board, rules, opening);
  }
  raw.placedThisTurn.push(act.key);
  if (rules.rift && raw.rifts.includes(act.key)) growGhost(raw, act.key, board);
  const win = winnerOf(raw, board, rules);
  if (win) {
    raw.winner = win;
    return raw;
  }
  return continueTurn(raw, board, rules, opening);
}

function planted(raw: Raw, act: Act, board: GameBoard, rules: Rules): Raw {
  const opening = raw.placedTotal === 0;
  raw.placedTotal += 1;
  raw.spent += 1;
  if (!raw.mines.includes(act.key)) raw.mines.push(act.key);
  return continueTurn(raw, board, rules, opening);
}

function slid(raw: Raw, act: Act, board: GameBoard, rules: Rules): Raw {
  const opening = raw.placedTotal === 0;
  if (act.from) delete raw.stones[act.from];
  raw.stones[act.key] = raw.actor;
  raw.placedTotal += 1;
  raw.spent += 1;
  const at = act.from ? raw.placedThisTurn.indexOf(act.from) : -1;
  if (at >= 0) raw.placedThisTurn[at] = act.key;
  const win = winnerOf(raw, board, rules);
  if (win) {
    raw.winner = win;
    return raw;
  }
  return continueTurn(raw, board, rules, opening);
}

function continueTurn(raw: Raw, board: GameBoard, rules: Rules, opening: boolean): Raw {
  if (raw.spent < (opening ? 1 : 2)) {
    // The second action has nowhere to go. Raid, lift, or move the duck if
    // those are still open; otherwise hand the turn over. A draw waits until
    // the next seat has no move either.
    if (!choices(raw, board, rules).length) return afterStones(raw, board, rules);
    return raw;
  }
  return afterStones(raw, board, rules);
}

function growGhost(raw: Raw, key: string, board: GameBoard) {
  const dest = board.mirror[key];
  if (!dest || dest === key) return;
  if (raw.stones[dest] || raw.duck === dest || raw.ghosts.some((ghost) => ghost.key === dest)) return;
  raw.ghosts.push({ key: dest, owner: raw.actor, born: raw.turnCount });
}

function lifted(raw: Raw, act: Act, board: GameBoard, rules: Rules): Raw {
  delete raw.stones[act.key];
  raw.removesLeft -= 1;
  if (raw.removesLeft <= 0) return afterStones(raw, board, rules);
  return raw;
}

function taken(raw: Raw, act: Act, board: GameBoard, rules: Rules): Raw {
  raw.stones[act.key] = raw.actor;
  const win = winnerOf(raw, board, rules);
  if (win) {
    raw.winner = win;
    return raw;
  }
  return afterStones(raw, board, rules);
}

function afterStones(raw: Raw, board: GameBoard, rules: Rules): Raw {
  if (raw.phase === "place" && rules.raid && foeKeys(raw).length) {
    raw.phase = "steal";
    return raw;
  }
  if ((raw.phase === "place" || raw.phase === "steal") && rules.cap > 0) {
    const own = Object.entries(raw.stones).filter(([, side]) => side === raw.actor);
    const spare = own.filter(([key]) => !raw.placedThisTurn.includes(key));
    if (own.length > rules.cap && spare.length) {
      raw.phase = "trim";
      raw.removesLeft = 2;
      return raw;
    }
  }
  if ((rules.duck || rules.king) && duckSpots(raw, board).length) {
    raw.phase = "duck";
    raw.removesLeft = 0;
    return raw;
  }
  return finishTurn(raw, board, rules);
}

function finishTurn(raw: Raw, board: GameBoard, rules: Rules): Raw {
  if (rules.echo) {
    for (const key of raw.placedThisTurn) {
      raw.echoes.push({ due: raw.turnCount + 2, kind: "place", key, owner: raw.actor });
    }
  }
  let born = applyEchoes(raw, board);
  if (!raw.winner) raw.winner = winnerOf(raw, board, rules);
  if (!raw.winner && rules.orbit) {
    born = remapBorn(born, shiftStones(raw, board, (key) => board.orbit[key] || key));
    raw.winner = winnerOf(raw, board, rules);
  }
  if (!raw.winner && rules.meteor && (raw.turnCount + 1) % 3 === 0) sweep(raw, board, born);
  if (!raw.winner) {
    anchorGhosts(raw, board);
    raw.winner = winnerOf(raw, board, rules);
  }
  if (!raw.winner) {
    raw.ghosts = raw.ghosts.filter((ghost) => raw.turnCount < ghost.born + 2);
    raw.rifts = raw.rifts.map((key) => board.orbit[key] || key);
  }
  if (!raw.winner && rules.pendulum && (raw.turnCount + 1) % rules.players === 0) pullStones(raw, board);
  if (!raw.winner) raw.winner = winnerOf(raw, board, rules);
  raw.placedThisTurn = [];
  if (!raw.winner && rules.frost) raw.winner = winnerOf(raw, board, rules);
  raw.turnCount += 1;
  raw.phase = "place";
  // A skipped second action leaves an even count. Turn order counts in pairs,
  // so step over the stone that could not be played.
  if (raw.placedTotal > 0 && raw.placedTotal % 2 === 0) raw.placedTotal += 1;
  raw.actor = playerAt(raw.placedTotal, rules.players);
  raw.spent = 0;
  raw.removesLeft = 0;
  if (!raw.winner && !choices(raw, board, rules).length) raw.winner = "draw";
  return raw;
}

function applyEchoes(raw: Raw, board: GameBoard): Set<string> {
  const born = new Set<string>();
  const due = raw.echoes.filter((echo) => echo.due === raw.turnCount);
  raw.echoes = raw.echoes.filter((echo) => echo.due !== raw.turnCount);
  for (const echo of due) {
    const dest = board.mirror[echo.key];
    if (!dest || raw.stones[dest] || raw.ghosts.some((ghost) => ghost.key === dest)) continue;
    if (echo.kind === "place") {
      if (dest === raw.duck) continue;
      if (raw.mines.includes(dest)) {
        raw.mines = raw.mines.filter((key) => key !== dest);
        continue;
      }
      raw.stones[dest] = echo.owner;
      born.add(dest);
    } else if (raw.duck === echo.key && dest !== echo.key) {
      raw.duck = dest;
    }
  }
  return born;
}

function remapBorn(born: Set<string>, went: Map<string, string>): Set<string> {
  if (!went.size || !born.size) return born;
  const next = new Set<string>();
  for (const key of born) next.add(went.get(key) || key);
  return next;
}

function pullStones(raw: Raw, board: GameBoard) {
  shiftStones(raw, board, (key) => inward(board, key));
}

function inward(board: GameBoard, key: string): string {
  const ring = board.ring[key] ?? 0;
  if (ring <= 0) return key;
  let best = "";
  let bestD = Infinity;
  for (const near of board.touch[key] ?? []) {
    if ((board.ring[near] ?? 0) >= ring) continue;
    const cell = board.byKey[near];
    if (!cell) continue;
    const dist = cell.x * cell.x + cell.y * cell.y;
    if (dist < bestD - 0.01 || (Math.abs(dist - bestD) <= 0.01 && (best === "" || near < best))) {
      best = near;
      bestD = dist;
    }
  }
  return best || key;
}

function shiftStones(raw: Raw, board: GameBoard, destOf: (key: string) => string) {
  const plan = Object.entries(raw.stones).map(([key, owner]) => ({
    key,
    owner,
    dest: destOf(key),
  }));
  const count = new Map<string, number>();
  for (const item of plan) count.set(item.dest, (count.get(item.dest) ?? 0) + 1);
  const stay = new Set<string>();
  const ghosted = new Set(raw.ghosts.map((ghost) => ghost.key));
  const mined = new Set(raw.mines);
  for (const item of plan) {
    if (item.dest === item.key || (count.get(item.dest) ?? 0) > 1) stay.add(item.key);
    else if (item.dest === raw.duck || ghosted.has(item.dest) || mined.has(item.dest)) stay.add(item.key);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of plan) {
      if (stay.has(item.key)) continue;
      if (plan.some((other) => other.key === item.dest && stay.has(other.key))) {
        stay.add(item.key);
        changed = true;
      }
    }
  }
  const stones: Record<string, Side> = {};
  const went = new Map<string, string>();
  for (const item of plan) {
    const dest = stay.has(item.key) ? item.key : item.dest;
    stones[dest] = item.owner;
    if (dest !== item.key) went.set(item.key, dest);
  }
  raw.stones = stones;
  if (went.size) raw.placedThisTurn = raw.placedThisTurn.map((key) => went.get(key) || key);
  return went;
}

function sweep(raw: Raw, board: GameBoard, spare: Set<string> = new Set()) {
  const keys = Object.keys(raw.stones);
  if (!keys.length) return;
  const far = Math.max(...keys.map((key) => board.ring[key] ?? 0));
  for (const key of keys) {
    if (spare.has(key)) continue;
    if ((board.ring[key] ?? 0) === far) delete raw.stones[key];
  }
}

function anchorGhosts(raw: Raw, board: GameBoard) {
  const kept: Ghost[] = [];
  for (const ghost of raw.ghosts) {
    if (raw.stones[ghost.key] || raw.duck === ghost.key) {
      kept.push(ghost);
      continue;
    }
    const friends = (board.touch[ghost.key] ?? []).filter((key) => raw.stones[key] === ghost.owner).length;
    if (friends >= 2) raw.stones[ghost.key] = ghost.owner;
    else kept.push(ghost);
  }
  raw.ghosts = kept;
}

function foeKeys(raw: Raw): string[] {
  return Object.entries(raw.stones)
    .filter(([, side]) => side !== raw.actor)
    .map(([key]) => key);
}

function choices(raw: Raw, board: GameBoard, rules: Rules): Act[] {
  if (raw.winner) return [];
  if (raw.phase === "steal") {
    return foeKeys(raw).flatMap((key) => {
      const cell = board.byKey[key];
      if (!cell) return [];
      return [{ kind: "steal" as const, key, letter: cell.letter, number: cell.number }];
    });
  }
  if (raw.phase === "trim") {
    const acts: Act[] = [{ kind: "pass", key: "", letter: "", number: 0 }];
    for (const [key, side] of Object.entries(raw.stones)) {
      if (side !== raw.actor || raw.placedThisTurn.includes(key)) continue;
      const cell = board.byKey[key];
      if (!cell) continue;
      acts.push({ kind: "remove", key, letter: cell.letter, number: cell.number });
    }
    return acts;
  }
  if (raw.phase === "duck") {
    return duckSpots(raw, board).map((cell) => ({
      kind: "duck" as const,
      key: cell.key,
      letter: cell.letter,
      number: cell.number,
    }));
  }
  const left = stonesLeft(raw);
  if (left <= 0) return [];
  const blocked = blockedKeys(raw, board, rules);
  const opening = raw.placedTotal === 0;
  const second = raw.spent === 1 && raw.placedTotal > 1;
  const first = raw.placedThisTurn.find((key) => raw.stones[key] === raw.actor);
  const acts: Act[] = [];
  for (const cell of board.cells) {
    if (blocked.has(cell.key) || raw.stones[cell.key]) continue;
    if (opening && cell.key !== board.center) continue;
    if (!opening && rules.siege && !touchesSide(board, cell.key, raw, raw.actor, false)) continue;
    if (second && first && rules.pair && !(board.touch[cell.key] ?? []).includes(first)) continue;
    if (second && first && rules.scatter && (board.touch[cell.key] ?? []).includes(first)) continue;
    acts.push({ kind: "place", key: cell.key, letter: cell.letter, number: cell.number });
  }
  if (second && rules.mine) {
    for (const cell of board.cells) {
      if (blocked.has(cell.key) || raw.stones[cell.key] || raw.mines.includes(cell.key)) continue;
      acts.push({ kind: "mine", key: cell.key, letter: cell.letter, number: cell.number });
    }
  }
  if (second && rules.slide) {
    for (const [key, side] of Object.entries(raw.stones)) {
      if (side !== raw.actor) continue;
      const from = board.byKey[key];
      if (!from) continue;
      for (const near of board.touch[key] ?? []) {
        if (blocked.has(near) || raw.stones[near] || raw.mines.includes(near)) continue;
        const dest = board.byKey[near];
        if (!dest) continue;
        acts.push({ kind: "slide", key: near, letter: dest.letter, number: dest.number, from: key });
      }
    }
  }
  return acts;
}

function touchesSide(board: GameBoard, key: string, raw: Raw, actor: Side, friendly: boolean): boolean {
  return (board.touch[key] ?? []).some((near) => {
    const side = raw.stones[near];
    if (!side) return false;
    return friendly ? side === actor : side !== actor;
  });
}

function duckSpots(raw: Raw, board: GameBoard) {
  const ghosted = new Set(raw.ghosts.map((ghost) => ghost.key));
  return board.cells.filter(
    (cell) => cell.key !== raw.duck && !raw.stones[cell.key] && !ghosted.has(cell.key) && !raw.mines.includes(cell.key),
  );
}

function stonesLeft(raw: Raw): number {
  if (raw.phase !== "place" || raw.winner) return 0;
  const quota = raw.placedTotal === 0 ? 1 : 2;
  return quota - raw.spent;
}

function blockedKeys(raw: Raw, board: GameBoard, rules: Rules): Set<string> {
  const blocked = new Set<string>();
  for (const ghost of raw.ghosts) blocked.add(ghost.key);
  if (raw.duck) blocked.add(raw.duck);
  if (rules.king && raw.duck) {
    for (const key of board.touch[raw.duck] ?? []) blocked.add(key);
  }
  return blocked;
}

function panicKeys(raw: Raw, board: GameBoard, rules: Rules): string[] {
  if (!rules.king || !raw.duck) return [];
  return (board.touch[raw.duck] ?? []).filter((key) => raw.stones[key]);
}

function winnerOf(raw: Raw, board: GameBoard, rules: Rules): Side | "draw" | null {
  const found = findLines(raw, board, rules);
  if (!found.length) return null;
  if (found.some((line) => line.owner === raw.actor)) return raw.actor;
  const owners = new Set(found.map((line) => line.owner));
  if (owners.size > 1) return "draw";
  return found[0].owner;
}

function findLines(raw: Raw, board: GameBoard, rules: Rules): { owner: Side; keys: string[] }[] {
  const panic = new Set(panicKeys(raw, board, rules));
  const ghosted = new Set(raw.ghosts.map((ghost) => ghost.key));
  const lines: { owner: Side; keys: string[] }[] = [];
  for (const line of board.lines) {
    for (const keys of scans(line, board)) {
    let owner: Side | null = null;
    let run: string[] = [];
    const flush = () => {
      if (owner && run.length >= 6) lines.push({ owner, keys: run });
      owner = null;
      run = [];
    };
    for (const key of keys) {
      const stone = raw.stones[key];
      if (!stone || panic.has(key) || ghosted.has(key) || key === raw.duck || (rules.frost && raw.placedThisTurn.includes(key))) {
        flush();
        continue;
      }
      if (owner && owner !== stone) flush();
      owner = stone;
      run.push(key);
    }
    flush();
    }
  }
  return lines;
}

function scans(line: string[], board: GameBoard): string[][] {
  const circular = line.length >= 6 && (board.touch[line[0]] ?? []).includes(line[line.length - 1]);
  if (!circular) return [line];
  return [line, line.slice(-5).concat(line.slice(0, 5))];
}

function present(raw: Raw, board: GameBoard, rules: Rules): Table {
  const panic = panicKeys(raw, board, rules);
  const found = raw.winner && raw.winner !== "draw" ? findLines(raw, board, rules).filter((line) => line.owner === raw.winner) : [];
  return {
    stones: raw.stones,
    duck: raw.duck,
    ghosts: raw.ghosts.map((ghost) => ({ ...ghost })),
    rifts: [...raw.rifts],
    turn: raw.actor,
    winner: raw.winner,
    lines: found.map((line) => line.keys.map((key) => coordOf(board, key))),
    phase: raw.phase,
    removesLeft: raw.removesLeft,
    stonesLeft: stonesLeft(raw),
    panic,
    threats: raw.winner ? [] : threats(raw, board, rules),
    legal: choices(raw, board, rules),
    halo: rules.king && raw.duck ? [...(board.touch[raw.duck] ?? [])] : [],
    placedTotal: raw.placedTotal,
    placedThisTurn: [...raw.placedThisTurn],
    mines: [...raw.mines],
    turnCount: raw.turnCount,
  };
}

function threats(raw: Raw, board: GameBoard, rules: Rules): string[] {
  const left = stonesLeft(raw);
  if (left <= 0) return [];
  const blocked = blockedKeys(raw, board, rules);
  if (rules.frost) for (const key of raw.placedThisTurn) blocked.add(key);
  const marked = new Set<string>();
  for (const line of board.lines) {
    for (const keys of scans(line, board)) {
    for (let start = 0; start < keys.length; start += 1) {
      let empties = 0;
      let own = 0;
      for (let end = start; end < keys.length; end += 1) {
        const key = keys[end];
        if (blocked.has(key)) break;
        const owner = raw.stones[key];
        if (owner && owner !== raw.actor) break;
        if (owner === raw.actor) own += 1;
        else empties += 1;
        if (empties > left) break;
        if (end - start + 1 >= 6 && own > 0 && empties > 0) {
          for (let cursor = start; cursor <= end; cursor += 1) {
            if (raw.stones[keys[cursor]] === raw.actor) marked.add(keys[cursor]);
          }
        }
      }
    }
    }
  }
  return [...marked];
}

function coordOf(board: GameBoard, key: string): Coord {
  const cell = board.byKey[key];
  return { letter: cell?.letter ?? key[0] ?? "a", number: cell?.number ?? 0 };
}

function clone(raw: Raw): Raw {
  return {
    stones: { ...raw.stones },
    duck: raw.duck,
    ghosts: raw.ghosts.map((ghost) => ({ ...ghost })),
    rifts: [...raw.rifts],
    echoes: raw.echoes.map((echo) => ({ ...echo })),
    turnCount: raw.turnCount,
    phase: raw.phase,
    actor: raw.actor,
    placedTotal: raw.placedTotal,
    placedThisTurn: [...raw.placedThisTurn],
    spent: raw.spent,
    mines: [...raw.mines],
    removesLeft: raw.removesLeft,
    winner: raw.winner,
  };
}

export function tableBoard(rules: Rules, size: BoardSize): GameBoard {
  return gameBoard(rules.grid, size);
}
