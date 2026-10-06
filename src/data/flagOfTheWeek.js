import { filterFlagsByMode, seededIndex, shortName, utcDateKey } from "./flags.js";

/** ISO-like week key: YYYY-Www */
export function utcWeekKey(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const EDITORIALS = {
  "Saint Pierre and Miquelon":
    "A tiny French overseas collectivity with a flag that somehow fits half of Europe into one canton. Basque, Breton, and Norman ships ride a green field under a tricolour sky — colonial nostalgia, island identity, and pure vexillological maximalism in one banner.",
  Armenia:
    "Three bands of colour and a quiet argument about mountains. Armenia’s flag is simple until you learn the orange is for the land and the red for the blood that held it — a national story told without a single emblem.",
  Slovakia:
    "Pan-Slavic colours with a double cross that refuses to be background decoration. Slovakia’s flag looks related to its neighbours until the coat of arms locks the hoist and makes it unmistakably its own.",
  Ireland:
    "Green, white, and orange as a peace proposal that became an identity. The Irish tricolour is short on ornament and long on meaning — union, not conquest, written as fabric.",
  Bhutan:
    "One of the only national flags that divides on a diagonal and still looks inevitable. A white dragon grips jewels across orange and yellow — Buddhism, sovereignty, and absolute refusal to be a boring rectangle.",
  Nepal:
    "The world’s only non-rectangular national flag. Two stacked pennons, a moon and a sun, and a silhouette that still makes every other flag look like it gave up early.",
  "South Africa":
    "A flag designed as a peace treaty in cloth. The Y-shape pulls colours from several past banners into one converging path — unity as geometry.",
  Mozambique:
    "An AK-47 on a national flag is rare for a reason. Mozambique keeps the weapon, the hoe, and the book as a blunt statement of how independence was won and what it was supposed to build.",
  Wales:
    "A red dragon on a green-and-white field, older than most national mythologies still in rotation. No stars, no mottos — just y Ddraig Goch, looking permanently unimpressed.",
  Kiribati:
    "A frigatebird over a rising sun and ocean waves. Kiribati’s flag is a map of an island nation that is mostly water, drawn with the confidence of a postage stamp that became a country.",
};

export function pickFlagOfTheWeek(flags, weekKey = utcWeekKey()) {
  const pool = filterFlagsByMode(flags, "countries");
  if (!pool.length) return null;

  const preferred = Object.keys(EDITORIALS)
    .map((name) =>
      pool.find((flag) => shortName(flag).toLowerCase() === name.toLowerCase()),
    )
    .filter(Boolean);

  const source = preferred.length ? preferred : pool;
  const flag = source[seededIndex(`flag-of-the-week:${weekKey}`, source.length)];
  const name = shortName(flag);

  return {
    weekKey,
    flag,
    name,
    blurb:
      EDITORIALS[name] ||
      flag.funFact ||
      flag.emblemMeaning ||
      "A flag worth staring at for longer than usual.",
  };
}
