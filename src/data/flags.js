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

export function loadFlags() {
  if (!flagsPromise) {
    flagsPromise = import("../assets/master_flags.json").then(
      (module) => module.default,
    );
  }

  return flagsPromise;
}

export function shortName(flag) {
  return String(flag?.name || "")
    .replace(/^Flag of /i, "")
    .trim();
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

export function subdivisionCountry(flag) {
  const name = flag?.name || "";
  const subdivisionName = name.replace(/^Flag of /i, "");

  if (flag.category === "Autonomous community") return "Spain";
  if (flag.category === "Canton") return "Switzerland";
  if (flag.category === "County") return "United Kingdom";
  if (flag.category === "Federal district") return "Brazil";
  if (flag.category === "Federal territory") return "Malaysia";
  if (flag.category === "Region") return "Belgium";
  if (flag.category === "US State") return "United States";

  if (flag.category === "Province") {
    if (/canada|alberta|ontario|quebec|manitoba|saskatchewan|british columbia|nova scotia|new brunswick|newfoundland|prince edward|nunavut|yukon|northwest territories/i.test(name)) {
      return "Canada";
    }
    if (/netherlands|holland|friesland|gelderland|limburg|utrecht|zeeland|drenthe|overijssel|flevoland|groningen/i.test(name)) {
      return "Netherlands";
    }
    return "Other";
  }

  if (flag.category === "State") {
    if (/germany|bayer|baden|berlin|hamburg|hessen|niedersachsen|nordrhein|rheinland|saarland|sachsen|schleswig|thüringen|thuringen|bremen|brandenburg|mecklenburg/i.test(name)) {
      return "Germany";
    }
    if (/brazil|brasil/i.test(name)) return "Brazil";
    if (/india|pradesh|bengal|gujarat|rajasthan|maharashtra|kerala|punjab|tamil|karnataka/i.test(name)) {
      return "India";
    }
    return "Other";
  }

  if (flag.category === "Republic") {
    if (/russia|russian|dagestan|tatarstan|chechnya|bashkortostan|yakutia|sakha|karelia|kalmykia|buryatia|tuva|altai|adygea|ingushetia|kabardino|karachay|mordovia|udmurt|chuvash|mari el|komi|khakassia|north ossetia/i.test(name)) {
      return "Russia";
    }
    return "Other";
  }

  return subdivisionName.split(",")[0] || "Other";
}

export const QUIZ_MODE_VALUES = [
  "countries",
  "territorial",
  "historical",
  "subdivisions",
  "organizations",
  "all",
];

/** Modes that already exist in production Supabase check constraints. */
export const LEGACY_QUIZ_MODES = [
  "countries",
  "territorial",
  "historical",
  "all",
];

export function filterFlagsByMode(flags, mode) {
  const list = Array.isArray(flags) ? flags : [];

  switch (mode) {
    case "countries":
      return list.filter(isCountry);
    case "territorial":
      return list.filter(isTerritory);
    case "historical":
      return list.filter(isHistorical);
    case "subdivisions":
      return list.filter(isSubdivision);
    case "organizations":
      return list.filter(isOrganization);
    case "all":
      return list.filter((flag) => Boolean(flag?.svgUrl && flag?.name));
    default:
      return list.filter(isCountry);
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
