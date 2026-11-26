const BINS = 17;

export function titleFor(wpm) {
  const bands = [
    [120, "onion god", true],
    [100, "blistering", true],
    [80, "frantic", true],
    [60, "speedy", true],
    [40, "sizzling", false],
    [20, "chopping", false],
    [0, "raw", false],
  ];
  const found = bands.find(([min]) => wpm >= min) || bands[bands.length - 1];
  return { name: found[1], flame: found[2] };
}

export function ranked(scores, board) {
  return scores
    .filter((row) => row.board === board)
    .slice()
    .sort(
      (a, b) =>
        b.wpm - a.wpm ||
        String(a.createdAt).localeCompare(String(b.createdAt)) ||
        String(a.id).localeCompare(String(b.id)),
    );
}

export function standings(scores, row) {
  const pool = scores.filter((score) => score.board === row.board);
  const all = pool.some((score) => score.id === row.id) ? pool : [...pool, row];
  const better = all.filter((score) => score.wpm > row.wpm).length;
  const worse = all.filter((score) => score.wpm < row.wpm).length;
  const others = all.length - 1;
  return {
    rank: better + 1,
    total: all.length,
    beat: others <= 0 ? 100 : Math.round((100 * worse) / others),
    histogram: histogram(all, row),
  };
}

export function playerCount(total) {
  const n = Math.max(0, Math.floor(total))
    .toLocaleString("en-US")
    .replace(/,/g, "\u202f");
  return total === 1 ? `${n} keyboard player` : `${n} keyboard players`;
}

function histogram(scores, row) {
  const peakScore = scores.reduce((max, score) => Math.max(max, score.wpm), row.wpm);
  const cap = Math.max(130, Math.ceil(peakScore / 10) * 10);
  const counts = Array.from({ length: BINS }, () => 0);
  let mine = 0;

  for (const score of scores) {
    const index = binIndex(score.wpm, cap);
    counts[index] += 1;
    if (score.id === row.id) mine = index;
  }

  const peak = Math.max(1, ...counts);
  return {
    cap,
    mid: Math.round(cap / 2),
    bars: counts.map((count, index) => ({
      count,
      mine: index === mine,
      height: count === 0 ? 0 : Math.max(0.22, count / peak),
    })),
  };
}

function binIndex(wpm, cap) {
  if (wpm >= cap) return BINS - 1;
  return Math.max(0, Math.min(BINS - 1, Math.floor((wpm / cap) * BINS)));
}
