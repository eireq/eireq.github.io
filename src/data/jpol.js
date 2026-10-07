/** jPol quiz metadata — question copy lives in i18n under jpol.q.<id> */

export const AXIS_KEYS = [
  "equality",
  "coordination",
  "power",
  "autonomy",
  "identity",
  "progress",
];

export const AXIS_META = {
  equality: { color: "#e74c3c" },
  coordination: { color: "#9b59b6" },
  power: { color: "#3498db" },
  autonomy: { color: "#f1c40f" },
  identity: { color: "#e91e8c" },
  progress: { color: "#2ecc71" },
};

export const ISSUE_TAGS = [
  "economy",
  "welfare",
  "labor",
  "speech",
  "privacy",
  "order",
  "immigration",
  "nation",
  "tradition",
  "science",
];

/**
 * direction −1: agree → left pole; +1: agree → right pole
 * express: included in the 18-question short path (3 per axis)
 */
export const QUESTION_BANK = [
  // equality
  { id: "eq1", key: "equality", direction: -1, tags: ["economy", "welfare"], express: true },
  { id: "eq2", key: "equality", direction: -1, tags: ["welfare"], express: true },
  { id: "eq3", key: "equality", direction: -1, tags: ["economy", "welfare"] },
  { id: "eq4", key: "equality", direction: -1, tags: ["labor"] },
  { id: "eq5", key: "equality", direction: -1, tags: ["economy"] },
  { id: "eq6", key: "equality", direction: -1, tags: ["economy", "welfare"] },
  { id: "eq7", key: "equality", direction: 1, tags: ["economy"], express: true },
  { id: "eq8", key: "equality", direction: 1, tags: ["economy"] },
  { id: "eq9", key: "equality", direction: 1, tags: ["economy"] },
  { id: "eq10", key: "equality", direction: 1, tags: ["economy"] },
  // coordination / economy
  { id: "co1", key: "coordination", direction: 1, tags: ["economy"], express: true },
  { id: "co2", key: "coordination", direction: 1, tags: ["economy"], express: true },
  { id: "co3", key: "coordination", direction: 1, tags: ["economy"] },
  { id: "co4", key: "coordination", direction: 1, tags: ["economy"] },
  { id: "co5", key: "coordination", direction: 1, tags: ["economy"] },
  { id: "co6", key: "coordination", direction: -1, tags: ["economy"], express: true },
  { id: "co7", key: "coordination", direction: -1, tags: ["labor"] },
  { id: "co8", key: "coordination", direction: -1, tags: ["welfare"] },
  { id: "co9", key: "coordination", direction: -1, tags: ["economy"] },
  { id: "co10", key: "coordination", direction: -1, tags: ["economy"] },
  // power / authority
  { id: "po1", key: "power", direction: 1, tags: ["order"], express: true },
  { id: "po2", key: "power", direction: 1, tags: ["order"], express: true },
  { id: "po3", key: "power", direction: 1, tags: ["order"] },
  { id: "po4", key: "power", direction: 1, tags: ["order"] },
  { id: "po5", key: "power", direction: 1, tags: ["order"] },
  { id: "po6", key: "power", direction: -1, tags: ["speech"], express: true },
  { id: "po7", key: "power", direction: -1, tags: ["order"] },
  { id: "po8", key: "power", direction: -1, tags: ["order"] },
  { id: "po9", key: "power", direction: -1, tags: ["speech"] },
  { id: "po10", key: "power", direction: -1, tags: ["order"] },
  // autonomy / freedom
  { id: "au1", key: "autonomy", direction: -1, tags: ["speech"], express: true },
  { id: "au2", key: "autonomy", direction: -1, tags: ["privacy"], express: true },
  { id: "au3", key: "autonomy", direction: -1, tags: ["speech"] },
  { id: "au4", key: "autonomy", direction: -1, tags: ["privacy"] },
  { id: "au5", key: "autonomy", direction: -1, tags: ["privacy"] },
  { id: "au6", key: "autonomy", direction: 1, tags: ["order"], express: true },
  { id: "au7", key: "autonomy", direction: 1, tags: ["speech"] },
  { id: "au8", key: "autonomy", direction: 1, tags: ["privacy"] },
  { id: "au9", key: "autonomy", direction: 1, tags: ["order"] },
  { id: "au10", key: "autonomy", direction: 1, tags: ["speech"] },
  // identity
  { id: "id1", key: "identity", direction: -1, tags: ["immigration", "nation"], express: true },
  { id: "id2", key: "identity", direction: -1, tags: ["nation"], express: true },
  { id: "id3", key: "identity", direction: -1, tags: ["immigration"] },
  { id: "id4", key: "identity", direction: -1, tags: ["nation"] },
  { id: "id5", key: "identity", direction: -1, tags: ["nation"] },
  { id: "id6", key: "identity", direction: 1, tags: ["nation"], express: true },
  { id: "id7", key: "identity", direction: 1, tags: ["immigration"] },
  { id: "id8", key: "identity", direction: 1, tags: ["nation"] },
  { id: "id9", key: "identity", direction: 1, tags: ["immigration"] },
  { id: "id10", key: "identity", direction: 1, tags: ["nation"] },
  // progress
  { id: "pr1", key: "progress", direction: 1, tags: ["science"], express: true },
  { id: "pr2", key: "progress", direction: 1, tags: ["tradition"], express: true },
  { id: "pr3", key: "progress", direction: 1, tags: ["science"] },
  { id: "pr4", key: "progress", direction: 1, tags: ["science"] },
  { id: "pr5", key: "progress", direction: 1, tags: ["tradition"] },
  { id: "pr6", key: "progress", direction: -1, tags: ["tradition"], express: true },
  { id: "pr7", key: "progress", direction: -1, tags: ["tradition"] },
  { id: "pr8", key: "progress", direction: -1, tags: ["tradition"] },
  { id: "pr9", key: "progress", direction: -1, tags: ["tradition"] },
  { id: "pr10", key: "progress", direction: -1, tags: ["tradition"] },
];

const HISTORY_KEY = "jpol-history";
const HISTORY_LIMIT = 6;

export function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function buildQuiz(mode = "full") {
  const pool =
    mode === "express"
      ? QUESTION_BANK.filter((question) => question.express)
      : QUESTION_BANK;
  return shuffle(pool.map((question) => ({ ...question })));
}

export function clampScore(value) {
  return Math.max(-1, Math.min(1, value));
}

export function axisScore(questions, answers, key) {
  const pairs = questions
    .map((question, index) =>
      question.key === key
        ? { value: answers[index], direction: question.direction }
        : null,
    )
    .filter((entry) => entry && entry.value !== null && entry.value !== undefined);
  if (!pairs.length) return 0;
  const total = pairs.reduce(
    (sum, entry) => sum + entry.value * entry.direction,
    0,
  );
  return clampScore(total / (pairs.length * 2));
}

export function scoreQuiz(questions, answers) {
  const axes = Object.fromEntries(
    AXIS_KEYS.map((key) => [key, axisScore(questions, answers, key)]),
  );
  const economic = clampScore((axes.equality + axes.coordination) / 2);
  const authority = clampScore((axes.power + axes.autonomy) / 2);
  const progressive = clampScore(-axes.progress);
  return { axes, economic, authority, progressive };
}

export function issuePulls(questions, answers) {
  const totals = Object.fromEntries(ISSUE_TAGS.map((tag) => [tag, 0]));
  const weights = Object.fromEntries(ISSUE_TAGS.map((tag) => [tag, 0]));

  questions.forEach((question, index) => {
    const value = answers[index];
    if (value === null || value === undefined) return;
    const pull = Math.abs(value) / 2;
    for (const tag of question.tags || []) {
      totals[tag] += pull;
      weights[tag] += 1;
    }
  });

  return ISSUE_TAGS.map((tag) => ({
    tag,
    score: weights[tag] ? totals[tag] / weights[tag] : 0,
  }))
    .filter((entry) => entry.score > 0.15)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

export function calibrationNote(answers) {
  const filled = answers.filter((value) => value !== null && value !== undefined);
  if (filled.length < 5) return null;
  const absMean =
    filled.reduce((sum, value) => sum + Math.abs(value), 0) / filled.length;
  const extremeShare =
    filled.filter((value) => Math.abs(value) === 2).length / filled.length;
  const neutralShare = filled.filter((value) => value === 0).length / filled.length;
  if (neutralShare >= 0.45) return "neutral";
  if (extremeShare >= 0.7) return "extreme";
  if (absMean < 0.35) return "flat";
  return null;
}

export function ideologyKey({ economic, authority, progressive }) {
  const econ =
    economic < -0.22 ? "left" : economic > 0.22 ? "right" : "center";
  const auth =
    authority < -0.22
      ? "libertarian"
      : authority > 0.22
        ? "authoritarian"
        : "moderate";

  if (auth === "authoritarian" && econ === "left") {
    return progressive < -0.15 ? "authLeftProgressive" : "authLeft";
  }
  if (auth === "authoritarian" && econ === "right") {
    return progressive > 0.15 ? "authRightConservative" : "authRight";
  }
  if (auth === "libertarian" && econ === "left") {
    return progressive < -0.15 ? "libLeftProgressive" : "libLeft";
  }
  if (auth === "libertarian" && econ === "right") {
    return progressive > 0.15 ? "libRightConservative" : "libRight";
  }
  if (auth === "moderate" && econ === "left") return "centerLeft";
  if (auth === "moderate" && econ === "right") return "centerRight";
  if (auth === "authoritarian" && econ === "center") return "authCenter";
  if (auth === "libertarian" && econ === "center") return "libCenter";
  if (Math.abs(progressive) > 0.35) {
    return progressive > 0 ? "centristConservative" : "centristProgressive";
  }
  return "centrist";
}

function toByte(score) {
  return Math.round(((clampScore(score) + 1) / 2) * 255);
}

function fromByte(byte) {
  return clampScore((byte / 255) * 2 - 1);
}

/** Compact shareable result token */
export function encodeResult(result) {
  const bytes = new Uint8Array([
    1,
    result.mode === "express" ? 1 : 0,
    toByte(result.economic),
    toByte(result.authority),
    toByte(result.progressive),
    ...AXIS_KEYS.map((key) => toByte(result.axes[key])),
  ]);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeResult(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (bytes.length < 11 || bytes[0] !== 1) return null;
    const axes = {};
    AXIS_KEYS.forEach((key, index) => {
      axes[key] = fromByte(bytes[5 + index]);
    });
    return {
      mode: bytes[1] === 1 ? "express" : "full",
      economic: fromByte(bytes[2]),
      authority: fromByte(bytes[3]),
      progressive: fromByte(bytes[4]),
      axes,
    };
  } catch {
    return null;
  }
}

export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function pushHistory(entry) {
  const next = [
    entry,
    ...loadHistory().filter((item) => item.code !== entry.code),
  ].slice(0, HISTORY_LIMIT);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

export function percentage(score) {
  return Math.round(((clampScore(score) + 1) / 2) * 100);
}

export function signedLabel(score, negative, positive, balanced = "balanced") {
  const amount = Math.abs(Math.round(clampScore(score) * 100));
  if (amount < 8) return balanced;
  return `${amount}% ${score < 0 ? negative : positive}`;
}
