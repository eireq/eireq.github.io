const KEY = "eire-onion-scores";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value, max) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(max, n));
}

export function sanitizeScore(row) {
  if (!row || typeof row !== "object") return null;
  const board = row.board === "mistake" ? "mistake" : row.board === "onion" ? "onion" : null;
  if (!board) return null;
  const mistakes = clamp(row.mistakes, 999);
  if (board === "onion" && mistakes !== 0) return null;
  if (board === "mistake" && mistakes < 1) return null;

  const name = String(row.name || "a guy").trim().slice(0, 30) || "a guy";
  return {
    id: String(row.id || makeId()),
    name,
    wpm: clamp(row.wpm, 400),
    onions: clamp(row.onions, 200),
    mistakes,
    board,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
  };
}

export function fromRemote(row) {
  return sanitizeScore({
    id: `remote-${row.id}`,
    name: row.name,
    wpm: row.wpm,
    onions: row.onions,
    mistakes: row.mistakes,
    board: row.board,
    createdAt: row.created_at,
  });
}

export function loadScores() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map(sanitizeScore).filter(Boolean);
  } catch {
    return [];
  }
}

export function rememberScore(entry) {
  const row = sanitizeScore({
    id: makeId(),
    createdAt: new Date().toISOString(),
    ...entry,
  });
  if (!row) return null;

  const scores = [...loadScores(), row].slice(-300);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(scores));
  } catch {
    // a private window can still show this run
  }
  return row;
}
