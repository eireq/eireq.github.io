import { applyMoves } from "./logic.ts";
import { gameBoard } from "./grids.ts";
import { botPick, decodeAlt, encodeAlt, isPlain, parseCode, project, type Act, type Rules } from "./rules.ts";

function counts(kind: "hex" | "tri" | "sq" | "oct", size: 8 | 13) {
  const board = gameBoard(kind, size);
  const touch = board.cells.map((cell) => board.touch[cell.key]?.length ?? 0);
  const mirrorMiss = board.cells.filter((cell) => !board.byKey[board.mirror[cell.key]]).length;
  const orbitMiss = board.cells.filter((cell) => !board.byKey[board.orbit[cell.key]]).length;
  const mirrorDup = new Set(Object.values(board.mirror)).size !== board.cells.length;
  const orbitDup = new Set(Object.values(board.orbit)).size !== board.cells.length;
  return {
    kind,
    size,
    cells: board.cells.length,
    center: board.center,
    lines: board.lines.length,
    touch: [Math.min(...touch), Math.max(...touch)],
    mirrorMiss,
    orbitMiss,
    mirrorDup,
    orbitDup,
    centerOrbit: board.orbit[board.center] === board.center,
  };
}

function play(rules: Rules, keys: string[][]) {
  const board = gameBoard(rules.grid, 8);
  const acts: Act[] = [];
  for (const turn of keys) {
    for (const key of turn) {
      const cell = board.byKey[key];
      if (!cell) throw new Error(`missing ${key} on ${rules.grid}`);
      acts.push({ kind: "place", key, letter: cell.letter, number: cell.number });
    }
  }
  return project(acts, rules, board);
}

const boards = [
  counts("hex", 8),
  counts("hex", 13),
  counts("tri", 8),
  counts("tri", 13),
  counts("sq", 8),
  counts("sq", 13),
  counts("oct", 8),
  counts("oct", 13),
];

const hex = gameBoard("hex", 8);
const line = hex.lines.find((item) => item.includes("h8") && item.length >= 6);
if (!line) throw new Error("no hex line");
const centerAt = line.indexOf("h8");
const xSpots = line.slice(centerAt, centerAt + 6);
if (xSpots.length < 6 || xSpots[0] !== "h8") throw new Error(`line ${line.join(" ")}`);
const oSpots = hex.cells.map((cell) => cell.key).filter((key) => !xSpots.includes(key)).slice(0, 6);
const hexWin = play(
  { grid: "hex", players: 2, duck: false, king: false, cap: 0, echo: false, orbit: false, meteor: false, rift: false },
  [[xSpots[0]], [oSpots[0], oSpots[1]], [xSpots[1], xSpots[2]], [oSpots[2], oSpots[3]], [xSpots[3], xSpots[4]], [oSpots[4], oSpots[5]], [xSpots[5]]],
);

const sq = gameBoard("sq", 8);
const row = sq.lines.find((item) => item.includes("h8") && item.every((key) => key[0] === "h" || key.startsWith("h")));
const file = sq.cells.filter((cell) => cell.letter === "h").sort((a, b) => a.number - b.number).map((cell) => cell.key);
const sqWin = play(
  { grid: "sq", players: 2, duck: false, king: false, cap: 0, echo: false, orbit: false, meteor: false, rift: false },
  [[file[7]], ["a1", "a2"], [file[8], file[9]], ["b1", "b2"], [file[10], file[11]], ["c1", "c2"], [file[12]]],
);

const duckRules: Rules = { grid: "hex", players: 2, duck: true, king: false, cap: 0, echo: false, orbit: false, meteor: false, rift: false };
const duckBoard = gameBoard("hex", 8);
const duckActs: Act[] = [
  { kind: "place", key: "h8", letter: "h", number: 8 },
  { kind: "duck", key: "h9", letter: "h", number: 9 },
];
const ducked = project(duckActs, duckRules, duckBoard);
const blocked = project([...duckActs, { kind: "place", key: "h9", letter: "h", number: 9 }], duckRules, duckBoard);

const kingRules: Rules = { ...duckRules, king: true };
const kinged = project(duckActs, kingRules, duckBoard);
const ringBlocked = project([...duckActs, { kind: "place", key: kinged?.halo[0] ?? "a1", letter: "a", number: 1 }], kingRules, duckBoard);

const egypt: Rules = { grid: "hex", players: 2, duck: false, king: false, cap: 2, echo: false, orbit: false, meteor: false, rift: false };
const egyptBoard = gameBoard("hex", 8);
const egyptLead: Act[] = [
  { kind: "place", key: "h8", letter: "h", number: 8 },
  { kind: "place", key: "a1", letter: "a", number: 1 },
  { kind: "place", key: "a2", letter: "a", number: 2 },
  { kind: "place", key: "b1", letter: "b", number: 1 },
  { kind: "place", key: "b2", letter: "b", number: 2 },
];
const egyptState = project(egyptLead, egypt, egyptBoard);
const over = egyptState
  ? project(
      [...egyptLead, { kind: "place", key: "a3", letter: "a", number: 3 }, { kind: "place", key: "a4", letter: "a", number: 4 }],
      egypt,
      egyptBoard,
    )
  : null;
const lifted = over
  ? project(
      [
        ...egyptLead,
        { kind: "place", key: "a3", letter: "a", number: 3 },
        { kind: "place", key: "a4", letter: "a", number: 4 },
        { kind: "remove", key: "a4", letter: "a", number: 4 },
      ],
      egypt,
      egyptBoard,
    )
  : null;
const liftOld = over
  ? project(
      [
        ...egyptLead,
        { kind: "place", key: "a3", letter: "a", number: 3 },
        { kind: "place", key: "a4", letter: "a", number: 4 },
        { kind: "remove", key: "a1", letter: "a", number: 1 },
        { kind: "pass", key: "", letter: "", number: 0 },
      ],
      egypt,
      egyptBoard,
    )
  : null;

const echoRules: Rules = { grid: "hex", players: 2, duck: false, king: false, cap: 0, echo: true, orbit: false, meteor: false, rift: false };
const echoBoard = gameBoard("hex", 8);
const echoActs: Act[] = [{ kind: "place", key: "h8", letter: "h", number: 8 }];
const mirror = echoBoard.mirror.a1;
const echoed = project(
  [
    ...echoActs,
    { kind: "place", key: "a1", letter: "a", number: 1 },
    { kind: "place", key: "a2", letter: "a", number: 2 },
    { kind: "place", key: "b1", letter: "b", number: 1 },
    { kind: "place", key: "b2", letter: "b", number: 2 },
    { kind: "place", key: "c1", letter: "c", number: 1 },
    { kind: "place", key: "c2", letter: "c", number: 2 },
  ],
  echoRules,
  echoBoard,
);

const orbitRules: Rules = { grid: "sq", players: 2, duck: true, king: false, cap: 0, echo: false, orbit: true, meteor: false, rift: false };
const orbitBoard = gameBoard("sq", 8);
const orbitActs: Act[] = [
  { kind: "place", key: "h8", letter: "h", number: 8 },
  { kind: "duck", key: "a1", letter: "a", number: 1 },
  { kind: "place", key: "i8", letter: "i", number: 8 },
  { kind: "place", key: "i9", letter: "i", number: 9 },
  { kind: "duck", key: "a2", letter: "a", number: 2 },
];
const orbited = project(orbitActs, orbitRules, orbitBoard);

const meteorRules: Rules = { grid: "hex", players: 2, duck: false, king: false, cap: 0, echo: false, orbit: false, meteor: true, rift: false };
const meteorBoard = gameBoard("hex", 8);
const far = meteorBoard.cells.slice().sort((a, b) => b.ring - a.ring)[0];
const meteorActs: Act[] = [
  { kind: "place", key: "h8", letter: "h", number: 8 },
  { kind: "place", key: far.key, letter: far.letter, number: far.number },
  { kind: "place", key: "a2", letter: "a", number: 2 },
  { kind: "place", key: "b1", letter: "b", number: 1 },
  { kind: "place", key: "b2", letter: "b", number: 2 },
  { kind: "place", key: "c1", letter: "c", number: 1 },
  { kind: "place", key: "c2", letter: "c", number: 2 },
];
const meteor = project(meteorActs, meteorRules, meteorBoard);

const riftRules: Rules = { grid: "hex", players: 2, duck: false, king: false, cap: 0, echo: false, orbit: false, meteor: false, rift: true };
const riftBoard = gameBoard("hex", 8);
const rift = riftBoard.cells.find((cell) => cell.key !== "h8");
const seeded = project([], riftRules, riftBoard);
const riftKey = seeded?.rifts[0] ?? "";
const ghosted = project(
  [
    { kind: "place", key: "h8", letter: "h", number: 8 },
    { kind: "place", key: riftKey, letter: riftBoard.byKey[riftKey].letter, number: riftBoard.byKey[riftKey].number },
    { kind: "place", key: "a2", letter: "a", number: 2 },
  ],
  riftRules,
  riftBoard,
);

const plain = applyMoves([{ letter: "h", number: 8 }], 8);
const bad = applyMoves([{ letter: "a", number: 1 }], 8);

console.log(JSON.stringify({
  boards,
  hexWin: hexWin?.winner,
  hexLine: line.slice(0, 6),
  row: row?.slice(0, 3),
  sqWin: sqWin?.winner,
  sqStones: sqWin ? Object.keys(sqWin.stones).length : null,
  ducked: { duck: ducked?.duck, turn: ducked?.turn, phase: ducked?.phase, legalH9: ducked?.legal.some((act) => act.key === "h9") },
  blocked: blocked?.winner ?? "rejected",
  kingHalo: kinged?.halo.length,
  ringBlocked: ringBlocked == null ? "rejected" : "accepted",
  egyptPhase: egyptState?.phase,
  over: { phase: over?.phase, removes: over?.removesLeft, stones: over ? Object.keys(over.stones) : null, legal: over?.legal.map((act) => `${act.kind}${act.key}`) },
  lifted: lifted == null ? "rejected" : Object.keys(lifted.stones),
  liftOld: liftOld ? Object.keys(liftOld.stones) : null,
  echoMirror: mirror,
  echoed: echoed ? { stones: echoed.stones, turn: echoed.turnCount } : null,
  orbited: orbited ? { stones: orbited.stones, duck: orbited.duck, orbitOfI8: orbitBoard.orbit.i8 } : null,
  meteor: meteor ? { gone: !meteor.stones[far.key], far: far.key, stones: Object.keys(meteor.stones) } : null,
  rift: { seed: seeded?.rifts, ghost: ghosted?.ghosts, placed: riftKey, sample: rift?.key },
  plain: plain?.stones.h8,
  bad: bad,
  alt: encodeAlt(kingRules),
  decoded: decodeAlt("oct-4-king-cap12-echo-orbit-meteor-rift"),
  plainAlt: isPlain(decodeAlt("")),
  code: parseCode("~h8"),
  bot: botPick(project([], duckRules, duckBoard)!, duckBoard, duckRules),
}, null, 2));
