const TERRITORY_NAMES = new Set([
  "Flag of Aruba",
  "Flag of Cook Islands",
  "Flag of Curaçao",
  "Flag of Greenland",
  "Flag of Niue",
  "Flag of Sint Maarten",
]);

export const SUBDIVISION_CATEGORIES = new Set([
  "Autonomous community",
  "Canton",
  "County",
  "Federal district",
  "Federal territory",
  "Province",
  "Region",
  "Republic",
  "State",
  "US State",
]);

let flagsPromise = null;
let indexPromise = null;

export function loadFlags() {
  if (!flagsPromise) {
    flagsPromise = import("../assets/master_flags.json").then(
      (module) => module.default,
    );
  }

  return flagsPromise;
}

export function loadFlagIndex() {
  if (!indexPromise) {
    indexPromise = import("../assets/flag_index.json").then(
      (module) => module.default,
    );
  }

  return indexPromise;
}

export function shortName(flag) {
  return String(flag?.name || "")
    .replace(/^Flag of /i, "")
    .trim();
}

function slugPart(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugHash(value) {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

// the url id for a flag page. it has to stay the same between builds, or shared
// links break. really old links used the array index, findFlag still takes those
export function flagSlug(flag) {
  const file = String(flag?.svgUrl || flag?.image || "").split("/").pop();
  const name = slugPart(`${flag?.category || ""}-${flag?.name || ""}`);
  const stem = slugPart(file);
  const body = [name, stem].filter(Boolean).join("--").slice(0, 96);
  return `${body || "flag"}-${slugHash(flag?.svgUrl || flag?.name)}`;
}

export function findFlag(flags, id) {
  const text = decodeURIComponent(String(id || ""));
  if (/^\d+$/.test(text)) {
    const index = Number(text);
    if (Number.isInteger(index) && flags[index]) return flags[index];
  }
  return flags.find((flag) => flagSlug(flag) === text) || null;
}

export function imageUrl(url) {
  return url?.replace(/^http:/, "https:") || "";
}

export function isTerritory(flag) {
  return flag?.category === "Territory" || TERRITORY_NAMES.has(flag?.name);
}

export function isSubdivision(flag) {
  return SUBDIVISION_CATEGORIES.has(flag?.category);
}

export function isCountry(flag) {
  return flag?.category === "Country";
}

export function isHistorical(flag) {
  return String(flag?.category || "")
    .toLowerCase()
    .includes("historical");
}

export function isOrganization(flag) {
  return /organization|humanitarian|international \/ symbolic|sports flag|maritime/i.test(
    String(flag?.category || ""),
  );
}

export function isPride(flag) {
  return flag?.category === "Pride flag";
}

export function displayCategory(flag) {
  if (isTerritory(flag)) return "Territory / dependency";
  if (isSubdivision(flag)) return "Subdivision";
  return flag?.category || "Uncategorized";
}

const CANADIAN_PROVINCES = new Set([
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
]);

const DUTCH_PROVINCES = new Set([
  "Groningen",
  "Friesland",
  "Drenthe",
  "Overijssel",
  "Gelderland",
  "Utrecht",
  "North Holland",
  "South Holland",
  "Zeeland",
  "North Brabant",
  "Limburg",
  "Flevoland",
]);

const STATE_COUNTRY = new Map([
  ...[
    "Acre",
    "Alagoas",
    "Amapá",
    "Amazonas",
    "Bahia",
    "Ceará",
    "Espírito Santo",
    "Goiás",
    "Maranhão",
    "Mato Grosso",
    "Mato Grosso do Sul",
    "Minas Gerais",
    "Pará",
    "Paraíba",
    "Paraná",
    "Pernambuco",
    "Piauí",
    "Rio de Janeiro",
    "Rio Grande do Norte",
    "Rio Grande do Sul",
    "Rondônia",
    "Roraima",
    "Santa Catarina",
    "São Paulo",
    "Sergipe",
    "Tocantins",
  ].map((name) => [name, "Brazil"]),
  ...[
    "Baden-Württemberg",
    "Bavaria",
    "Berlin",
    "Brandenburg",
    "Bremen",
    "Hamburg",
    "Hesse",
    "Lower Saxony",
    "Mecklenburg-Vorpommern",
    "North Rhine-Westphalia",
    "Rhineland-Palatinate",
    "Saarland",
    "Saxony",
    "Saxony-Anhalt",
    "Schleswig-Holstein",
    "Thuringia",
  ].map((name) => [name, "Germany"]),
  ...[
    "Johor",
    "Kedah",
    "Kelantan",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Penang",
    "Perak",
    "Perlis",
    "Sabah",
    "Sarawak",
    "Selangor",
    "Terengganu",
  ].map((name) => [name, "Malaysia"]),
  ...[
    "New South Wales",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ].map((name) => [name, "Australia"]),
  ...["Chuuk", "Kosrae", "Pohnpei", "Yap"].map((name) => [name, "Federated States of Micronesia"]),
]);

// "" means we don't know, and the flag db leaves it out of the country picker
export function subdivisionCountry(flag) {
  const name = (flag.name || "").replace(/^Flag of /, "");
  switch (flag.category) {
    case "Autonomous community":
      return "Spain";
    case "Canton":
      return "Switzerland";
    case "County":
      return "United Kingdom";
    case "Federal district":
      return "Brazil";
    case "Federal territory":
      return "Malaysia";
    case "Region":
      return "Belgium";
    case "US State":
      return "United States";
    case "Province":
      if (DUTCH_PROVINCES.has(name)) return "Netherlands";
      if (CANADIAN_PROVINCES.has(name)) return "Canada";
      return "";
    case "Republic":
      return name === "Crimea" ? "Ukraine" : "Russia";
    case "State":
      return STATE_COUNTRY.get(name) || "";
    default:
      return "";
  }
}

export const QUIZ_MODE_VALUES = [
  "countries",
  "territorial",
  "historical",
  "subdivisions",
  "organizations",
  "all",
];

export function filterFlagsByMode(flags, mode) {
  switch (mode) {
    case "territorial":
      return flags.filter(isTerritory);
    case "historical":
      return flags.filter(isHistorical);
    case "subdivisions":
      return flags.filter(isSubdivision);
    case "organizations":
      return flags.filter(isOrganization);
    case "all":
      return flags.filter((flag) => flag.svgUrl && flag.name);
    default:
      return flags.filter(isCountry);
  }
}

export function normalizeAnswer(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SHORT_ALIASES = {
  "united states": ["usa", "u s a", "us", "u s"],
  "united kingdom": ["uk", "u k"],
};

export function answersForFlag(flag) {
  const name = shortName(flag);
  const full = flag?.name || "";
  const answers = new Set([name, full]);

  if (name.includes("(")) {
    answers.add(name.replace(/\s*\([^)]*\)\s*/g, " ").trim());
  }

  if (/^the /i.test(name)) {
    answers.add(name.replace(/^the /i, ""));
  }

  const aliases = SHORT_ALIASES[normalizeAnswer(name)];
  if (aliases) {
    for (const alias of aliases) answers.add(alias);
  }

  return [...answers].filter(Boolean);
}

export function isCorrectFlagAnswer(answer, flag) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  return answersForFlag(flag).some(
    (accepted) => normalizeAnswer(accepted) === normalized,
  );
}

export function colorHex(color) {
  if (typeof color === "string") {
    return color.startsWith("#") ? color.toUpperCase() : "";
  }
  if (color && typeof color === "object") {
    const hex = color.hex || color.color || color.value || "";
    return String(hex).startsWith("#") ? String(hex).toUpperCase() : "";
  }
  return "";
}

export function colorLabel(color) {
  if (typeof color === "string") return color;
  if (color && typeof color === "object") {
    return color.name || color.meaning || colorHex(color) || "";
  }
  return "";
}

export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function seededIndex(seed, length) {
  if (!length) return 0;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % length;
}

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
