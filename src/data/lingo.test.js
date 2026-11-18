import test from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  SAMPLE_TEXT,
  STORAGE_KEY,
  WORD_COUNT,
  WORDS,
  definedCount,
  fillEmpty,
  inflections,
  lemmaOf,
  loadLanguage,
  normalizeLanguage,
  parseLanguage,
  saveLanguage,
  translate,
} from "./lingo.js";

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  },
};

function lang(words, extra = {}) {
  return normalizeLanguage({ words, ...extra });
}

test("the list is 500 unique basic words", () => {
  assert.equal(WORD_COUNT, 500);
  assert.equal(WORDS.length, 500);
  const ids = WORDS.map((word) => word.id);
  assert.equal(new Set(ids).size, 500);
  for (const word of WORDS) {
    assert.match(word.id, /^[a-z]+$/);
    assert.ok(CATEGORIES.includes(word.cat));
  }
  for (const cat of CATEGORIES) {
    assert.ok(WORDS.some((word) => word.cat === cat));
  }
});

test("inflections follow the root and never steal another listed word", () => {
  assert.equal(lemmaOf("is"), "be");
  assert.equal(lemmaOf("am"), "be");
  assert.equal(lemmaOf("were"), "be");
  assert.equal(lemmaOf("went"), "go");
  assert.equal(lemmaOf("going"), "go");
  assert.equal(lemmaOf("goes"), "go");
  assert.equal(lemmaOf("goed"), null);
  assert.equal(lemmaOf("died"), "die");
  assert.equal(lemmaOf("dying"), "die");
  assert.equal(lemmaOf("dieing"), null);
  assert.equal(lemmaOf("tried"), "try");
  assert.equal(lemmaOf("tries"), "try");
  assert.equal(lemmaOf("stopped"), "stop");
  assert.equal(lemmaOf("stopping"), "stop");
  assert.equal(lemmaOf("happened"), "happen");
  assert.equal(lemmaOf("opening"), "open");
  assert.equal(lemmaOf("beginning"), "begin");
  assert.equal(lemmaOf("begining"), null);
  assert.equal(lemmaOf("cats"), "cat");
  assert.equal(lemmaOf("men"), "man");
  assert.equal(lemmaOf("children"), "child");
  assert.equal(lemmaOf("families"), "family");
  assert.equal(lemmaOf("days"), "day");
  assert.equal(lemmaOf("better"), "good");
  assert.equal(lemmaOf("biggest"), "big");
  assert.equal(lemmaOf("lives"), "live");
  assert.equal(lemmaOf("1"), "one");
  assert.equal(lemmaOf("2nd"), "second");
  assert.equal(lemmaOf("people"), "people");
  assert.equal(lemmaOf("flew"), "fly");
  assert.equal(lemmaOf("feet"), "foot");
  assert.equal(lemmaOf("mice"), "mouse");
  assert.equal(lemmaOf("meant"), "mean");
  assert.equal(lemmaOf("will"), "will");
  assert.equal(lemmaOf("most"), "most");
  assert.equal(lemmaOf("back"), "back");
  assert.equal(lemmaOf("into"), "into");
  assert.equal(lemmaOf("today"), "today");
  assert.ok(!inflections("will").includes("wills"));
  assert.ok(inflections("go").includes("went"));
  for (const [surface, lemma] of inflections("be").map((form) => [form, "be"])) {
    assert.equal(lemmaOf(surface), lemma);
    assert.equal(WORDS.some((word) => word.id === surface), false);
  }
});

test("translates words, inflections, case, and punctuation", () => {
  const speech = lang({
    i: "mi",
    be: "es",
    go: "nara",
    home: "dom",
    she: "sha",
    the: "lo",
    sun: "sol",
    hot: "kal",
  });
  assert.equal(translate("I am going home.", speech), "Mi es nara dom.");
  assert.equal(translate("SHE IS HOT!", speech), "SHA ES KAL!");
  assert.equal(translate("the sun, the sun.", speech), "lo sol, lo sol.");
  assert.equal(translate("something", lang({ some: "x", thing: "y" })), "something");
  assert.equal(translate("a cat", lang({ a: "x", cat: "miau" })), "x miau");
  assert.equal(translate("animal", lang({ a: "x" })), "animal");
  assert.equal(translate("today", lang({ to: "a", today: "hoy" })), "hoy");
  assert.equal(translate("into", lang({ in: "en", into: "entro" })), "entro");
});

test("contractions expand before the word list", () => {
  const speech = lang({ it: "ta", be: "es", hot: "kal", do: "fa", not: "ne", go: "nara" });
  assert.equal(translate("It's hot.", speech), "Ta es kal.");
  assert.equal(translate("Don't go!", speech), "Fa ne nara!");
  assert.equal(
    translate("Don't go!", speech, "forward"),
    "Fa ne nara!",
  );
  const overridden = lang(
    { go: "nara" },
    { phrases: [{ from: "don't", to: "nepa" }] },
  );
  assert.equal(translate("Don't go!", overridden), "Nepa nara!");
});

test("longer phrases win, and a dash leaves a word out", () => {
  const speech = lang(
    { good: "bon", morning: "mat", night: "nox", the: "-", a: "-" },
    { phrases: [{ from: "good morning", to: "saliden" }] },
  );
  assert.equal(translate("good morning", speech), "saliden");
  assert.equal(translate("Good morning", speech), "Saliden");
  assert.equal(translate("GOOD MORNING", speech), "SALIDEN");
  assert.equal(translate("good   morning", speech), "saliden");
  assert.equal(translate("good night", speech), "bon nox");
  assert.equal(translate("the sun is a star", lang({ the: "-", a: "-", sun: "sol", be: "es", star: "stel" })), "sol es stel");
});

test("missing words can stay, leave, or be marked", () => {
  const words = { hello: "sali" };
  assert.equal(translate("hello Ada", lang(words)), "sali Ada");
  assert.equal(translate("hello Ada", lang(words, { missing: "skip" })), "sali");
  assert.equal(translate("hello Ada", lang(words, { missing: "mark" })), "sali 〔Ada〕");
});

test("reverse uses the root, and the earlier word wins a tie", () => {
  const speech = lang(
    { i: "mi", me: "mi", go: "nara", she: "sha" },
    { phrases: [{ from: "good morning", to: "sali den" }] },
  );
  assert.equal(translate("nara", speech, "back"), "go");
  assert.equal(translate("Nara", speech, "back"), "Go");
  assert.equal(translate("mi", speech, "back"), "i");
  assert.equal(translate("sha nara", speech, "back"), "she go");
  assert.equal(translate("sali den", speech, "back"), "good morning");
  assert.equal(translate("goes", speech, "back"), "goes");
});

test("digits and plurals use the named word", () => {
  const speech = lang({ one: "un", cat: "miau", second: "duo" });
  assert.equal(translate("1 cat and 2 cats", speech), "un miau and 2 miau");
  assert.equal(translate("2nd", speech), "duo");
});

test("fill the blanks keeps words you already named", () => {
  const filled = fillEmpty(lang({ i: "mi", the: "-" }));
  assert.equal(filled.words.i, "mi");
  assert.equal(filled.words.the, "-");
  assert.equal(definedCount(filled), WORD_COUNT);
  const spoken = new Set(Object.values(filled.words).map((value) => value.toLowerCase()));
  assert.equal(spoken.size, WORD_COUNT);
});

test("save and load round-trip, and a bad file is refused", () => {
  store.clear();
  const speech = lang(
    { i: "mi", go: "nara" },
    { name: "Nara", phrases: [{ id: "p1", from: "good morning", to: "sali" }], missing: "mark" },
  );
  saveLanguage(speech);
  assert.equal(store.has(STORAGE_KEY), true);
  const loaded = loadLanguage();
  assert.equal(loaded.name, "Nara");
  assert.equal(loaded.words.i, "mi");
  assert.equal(loaded.words.go, "nara");
  assert.equal(loaded.missing, "mark");
  assert.equal(loaded.phrases[0].from, "good morning");
  assert.equal(loaded.phrases[0].to, "sali");
  store.set(STORAGE_KEY, "{");
  assert.deepEqual(loadLanguage().words, {});
  assert.throws(() => parseLanguage(["nope"]));
  assert.throws(() => parseLanguage({ words: ["nope"] }));
  const odd = parseLanguage({ name: "x", words: { i: "mi", notAWord: "zzz" }, extra: true });
  assert.equal(odd.words.i, "mi");
  assert.equal(odd.words.notAWord, undefined);
});

test("the sample sentence only needs words from the list, plus a name", () => {
  const known = new Set(WORDS.map((word) => word.id));
  const leftovers = SAMPLE_TEXT
    .replace(/[’']/g, "")
    .split(/[^A-Za-z]+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word && !known.has(word) && lemmaOf(word) == null);
  assert.deepEqual(leftovers, ["ada"]);
});
