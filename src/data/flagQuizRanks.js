function scoreOf(row) {
  return Number(row?.score) || 0;
}

function percentageOf(row) {
  return Number(row?.percentage) || 0;
}

function timeOf(row) {
  const time = Date.parse(row?.created_at || "");
  return Number.isFinite(time) ? time : 0;
}

function nameKey(row) {
  return String(row?.name || "a guy").trim().toLowerCase().slice(0, 30) || "a guy";
}

function isBetterRun(candidate, current) {
  if (scoreOf(candidate) !== scoreOf(current)) {
    return scoreOf(candidate) > scoreOf(current);
  }
  if (percentageOf(candidate) !== percentageOf(current)) {
    return percentageOf(candidate) > percentageOf(current);
  }
  return timeOf(candidate) < timeOf(current);
}

export function rankFlagQuizScores(rows, limit = 50) {
  const cap = Math.max(1, Math.min(50, Math.floor(limit) || 50));
  const best = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const key = nameKey(row);
    const current = best.get(key);
    if (!current || isBetterRun(row, current)) best.set(key, row);
  }

  return [...best.values()]
    .sort((a, b) => {
      if (isBetterRun(a, b)) return -1;
      if (isBetterRun(b, a)) return 1;
      return 0;
    })
    .slice(0, cap);
}
