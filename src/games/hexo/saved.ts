// reading back games that come from somewhere else, like a saved room in localStorage
// or a move list a peer sent over. none of it is trusted, so a bad
// entry anywhere throws the whole thing out instead of half-loading it

import { applyMoves, asSize, boardFor, type Coord } from "./logic.ts";
import { gameBoard } from "./grids.ts";
import { actionCode, decodeAlt, isPlain, parseCode, project, type Act, type Side } from "./rules.ts";

export const SIDES: Side[] = ["X", "O", "Y", "Z"];

export function isSide(value: unknown): value is Side {
  return SIDES.includes(value as Side);
}

function parseMoveList(list: unknown, boardSize: unknown): Coord[] | null {
  if (!Array.isArray(list)) return null;
  const size = asSize(boardSize);
  const pattern = new RegExp(`^([${boardFor(size).letters}])(\\d{1,2})$`);
  const moves: Coord[] = [];
  for (const part of list) {
    const found = pattern.exec(String(part));
    if (!found) return null;
    moves.push({ letter: found[1], number: Number(found[2]) });
  }
  return applyMoves(moves, size) ? moves : null;
}

// plain games are a list like ["h8", "g7"], variants are action codes
export function historyFrom(list: unknown, boardSize: unknown, alt: string): (Coord | Act)[] | null {
  const rules = decodeAlt(alt || "");
  if (isPlain(rules)) return parseMoveList(list, boardSize);
  if (!Array.isArray(list)) return null;
  const table = gameBoard(rules.grid, asSize(boardSize));
  const acts: Act[] = [];
  for (const part of list) {
    const act = parseCode(String(part));
    if (!act) return null;
    if (act.kind !== "pass" && !table.byKey[act.key]) return null;
    acts.push(act);
  }
  return project(acts, rules, table) ? acts : null;
}

export function codeOf(move: Coord | Act): string {
  if ("kind" in move && move.kind) return actionCode(move);
  return `${move.letter}${move.number}`;
}

export function cleanRoom(raw: unknown): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

// no 0/o or 1/l/i so a code read out loud still works
export function makeCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

export function freshClock(ms: number): Record<Side, number> {
  return { X: ms, O: ms, Y: ms, Z: ms };
}