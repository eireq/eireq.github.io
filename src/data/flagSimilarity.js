import { colorHex, displayCategory, shortName } from "./flags.js";

const DESIGN_TAGS = [
  ["nordic-cross", /nordic|scandinavian cross|dannebrog/i],
  ["cross", /\bcross\b|saltire|crux/i],
  ["tricolor", /tricolou?r|three horizontal|three vertical/i],
  ["crescent", /crescent/i],
  ["stars", /\bstars?\b|mullet/i],
  ["canton", /canton/i],
  ["pan-slavic", /pan-?slavic/i],
  ["pan-arab", /pan-?arab/i],
  ["pan-african", /pan-?african/i],
  ["union-jack", /union jack|union flag/i],
  ["eagle", /eagle|double-headed/i],
  ["sun", /\bsun\b|solar/i],
  ["stripe", /stripe|band/i],
];

function textBlob(flag) {
  return [flag?.name, flag?.category, flag?.emblemMeaning, flag?.funFact]
    .filter(Boolean)
    .join(" ");
}

export function designTags(flag) {
  const text = textBlob(flag);
  return DESIGN_TAGS.filter(([, pattern]) => pattern.test(text)).map(
    ([tag]) => tag,
  );
}

function yearValue(flag) {
  const raw = flag?.adoptionDate;
  if (!raw) return null;
  const year = Number(String(raw).slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function paletteOf(flag, extraColors = []) {
  const stored = Array.isArray(flag?.colors)
    ? flag.colors.map(colorHex).filter(Boolean)
    : [];
  return [...new Set([...stored, ...extraColors])];
}

function colorDistance(a, b) {
  const parse = (hex) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  try {
    const [ar, ag, ab] = parse(a);
    const [br, bg, bb] = parse(b);
    return Math.hypot(ar - br, ag - bg, ab - bb);
  } catch {
    return 999;
  }
}

function paletteScore(left, right) {
  if (!left.length || !right.length) return 0;
  let hits = 0;
  for (const color of left) {
    if (right.some((other) => colorDistance(color, other) < 55)) hits += 1;
  }
  return hits * 3;
}

export function similarityScore(source, candidate, sourceColors = []) {
  if (!source || !candidate || source === candidate) return -1;

  let score = 0;
  if (source.category === candidate.category) score += 6;
  if (displayCategory(source) === displayCategory(candidate)) score += 2;
  if (
    source.proportions &&
    candidate.proportions &&
    source.proportions === candidate.proportions
  ) {
    score += 1;
  }

  const sourceYear = yearValue(source);
  const candidateYear = yearValue(candidate);
  if (sourceYear && candidateYear) {
    const gap = Math.abs(sourceYear - candidateYear);
    if (gap <= 10) score += 3;
    else if (gap <= 40) score += 1;
  }

  const sourceTags = new Set(designTags(source));
  const candidateTags = designTags(candidate);
  for (const tag of candidateTags) {
    if (sourceTags.has(tag)) score += 4;
  }

  const sourceName = shortName(source).toLowerCase();
  const candidateName = shortName(candidate).toLowerCase();
  const sharedTokens = sourceName
    .split(/\s+/)
    .filter((token) => token.length > 3 && candidateName.includes(token));
  score += Math.min(sharedTokens.length, 2);

  score += paletteScore(paletteOf(source, sourceColors), paletteOf(candidate));

  return score;
}

export function findSimilarFlags(source, flags, { limit = 6, colors = [] } = {}) {
  if (!source) return [];
  return [...flags]
    .map((candidate) => ({
      flag: candidate,
      score: similarityScore(source, candidate, colors),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        shortName(left.flag).localeCompare(shortName(right.flag)),
    )
    .slice(0, limit)
    .map((entry) => entry.flag);
}

export function flagIndexInList(flags, flag) {
  return flags.indexOf(flag);
}
