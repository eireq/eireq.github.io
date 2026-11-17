// 300 basic english words, plus a lingojam-style swap translator.
// inflections (goes, went, cats, bigger) follow the word you name,
// until a phrase says otherwise.

export const STORAGE_KEY = "eireLingo";

export const CATEGORIES = [
  "people",
  "grammar",
  "numbers",
  "time",
  "qualities",
  "verbs",
  "things",
];

function words(cat, ids) {
  return ids.map((id) => ({ id, cat }));
}

export const WORDS = [
  ...words("people", [
    "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their",
    "person", "people", "man", "woman", "child", "baby",
    "friend", "family", "mother", "father", "name", "body",
  ]),
  ...words("grammar", [
    "a", "an", "the", "this", "that", "these", "those",
    "some", "any", "no", "not", "all", "every",
    "many", "much", "few", "more", "most", "other", "same",
    "who", "what", "where", "when", "why", "how", "which",
    "and", "or", "but", "if", "because", "so", "then",
    "yes", "hello", "goodbye", "please", "thanks", "sorry", "ok",
    "in", "on", "at", "to", "from", "of", "with", "without",
    "for", "by", "about", "into", "over", "under",
    "between", "before", "after", "near", "through",
    "will", "would", "can", "could", "should", "must",
    "here", "there", "up", "down", "out", "back",
  ]),
  ...words("numbers", [
    "zero", "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten", "twenty", "hundred",
    "thousand", "first", "second",
  ]),
  ...words("time", [
    "now", "today", "tomorrow", "yesterday",
    "day", "night", "morning", "evening",
    "week", "month", "year", "time",
    "always", "never", "again", "soon",
  ]),
  ...words("qualities", [
    "good", "bad", "big", "small", "long", "short",
    "new", "old", "young", "hot", "cold", "hard", "soft",
    "fast", "slow", "high", "low", "right", "wrong", "true",
    "happy", "sad", "angry", "beautiful", "clean", "dirty",
    "full", "empty", "strong", "weak", "easy", "dark",
    "early", "late", "real", "only", "free", "whole",
    "different", "kind",
  ]),
  ...words("verbs", [
    "be", "have", "do", "go", "come", "get", "make", "take", "give", "see",
    "look", "hear", "say", "tell", "speak", "know", "think", "want", "need", "like",
    "love", "hate", "eat", "drink", "sleep", "walk", "run", "sit", "stand", "live",
    "die", "work", "play", "read", "write", "learn", "teach", "buy", "sell", "find",
    "lose", "open", "close", "start", "stop", "help", "use", "try", "ask", "answer",
    "call", "wait", "leave", "stay", "put", "keep", "bring", "send", "show", "feel",
    "become", "let", "remember", "forget", "understand", "believe", "hope", "happen", "begin",
  ]),
  ...words("things", [
    "world", "earth", "sun", "moon", "star", "sky",
    "water", "fire", "air", "land", "sea", "river",
    "mountain", "tree", "plant", "flower", "stone", "rain", "snow", "wind", "light",
    "house", "home", "room", "door", "city", "country", "place", "road", "school",
    "food", "bread", "meat", "fruit", "money", "book", "word", "language", "story",
    "thing", "way", "hand", "head", "eye", "mouth", "heart", "life",
    "animal", "dog", "cat", "bird", "fish",
    "ground", "ice", "salt", "wood", "song",
  ]),
];

export const WORD_COUNT = WORDS.length;
export const PHRASE_LIMIT = 200;

const WORD_IDS = new Set(WORDS.map((word) => word.id));
const WORD_BY_ID = new Map(WORDS.map((word) => [word.id, word]));

const IRREGULAR = {
  be: ["am", "is", "are", "was", "were", "been", "being"],
  have: ["has", "had", "having"],
  do: ["does", "did", "doing", "done"],
  go: ["goes", "went", "going", "gone"],
  come: ["comes", "came", "coming"],
  get: ["gets", "got", "getting", "gotten"],
  make: ["makes", "made", "making"],
  take: ["takes", "took", "taking", "taken"],
  give: ["gives", "gave", "giving", "given"],
  see: ["sees", "saw", "seeing", "seen"],
  say: ["says", "said", "saying"],
  tell: ["tells", "told", "telling"],
  know: ["knows", "knew", "knowing", "known"],
  think: ["thinks", "thought", "thinking"],
  eat: ["eats", "ate", "eating", "eaten"],
  drink: ["drinks", "drank", "drinking", "drunk"],
  sleep: ["sleeps", "slept", "sleeping"],
  run: ["runs", "ran", "running"],
  sit: ["sits", "sat", "sitting"],
  stand: ["stands", "stood", "standing"],
  write: ["writes", "wrote", "writing", "written"],
  find: ["finds", "found", "finding"],
  buy: ["buys", "bought", "buying"],
  sell: ["sells", "sold", "selling"],
  speak: ["speaks", "spoke", "speaking", "spoken"],
  begin: ["begins", "began", "beginning", "begun"],
  feel: ["feels", "felt", "feeling"],
  leave: ["leaves", "left", "leaving"],
  keep: ["keeps", "kept", "keeping"],
  bring: ["brings", "brought", "bringing"],
  send: ["sends", "sent", "sending"],
  become: ["becomes", "became", "becoming"],
  forget: ["forgets", "forgot", "forgetting", "forgotten"],
  understand: ["understands", "understood", "understanding"],
  hear: ["hears", "heard", "hearing"],
  teach: ["teaches", "taught", "teaching"],
  read: ["reads", "reading"],
  put: ["puts", "putting"],
  let: ["lets", "letting"],
  lose: ["loses", "lost", "losing"],
};

const COMPARE = {
  good: ["better", "best"],
  bad: ["worse", "worst"],
};

const NO_COMPARE = new Set([
  "right", "wrong", "true", "real", "only", "whole", "different",
]);

const PLURAL_IDS = new Set([
  "person", "man", "woman", "child", "friend", "family",
  "mother", "father", "name", "baby", "body",
  "day", "night", "morning", "evening", "week", "month", "year", "time",
]);

const PLURAL = {
  man: ["men"],
  woman: ["women"],
  child: ["children"],
};

const DIGITS = {
  zero: ["0"],
  one: ["1"],
  two: ["2"],
  three: ["3"],
  four: ["4"],
  five: ["5"],
  six: ["6"],
  seven: ["7"],
  eight: ["8"],
  nine: ["9"],
  ten: ["10"],
  twenty: ["20"],
  hundred: ["100"],
  thousand: ["1000"],
  first: ["1st"],
  second: ["2nd"],
};

const CONTRACTIONS = {
  "i'm": "i am",
  "you're": "you are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "we're": "we are",
  "they're": "they are",
  "that's": "that is",
  "what's": "what is",
  "who's": "who is",
  "where's": "where is",
  "how's": "how is",
  "there's": "there is",
  "here's": "here is",
  "let's": "let us",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will",
  "won't": "will not",
  "can't": "can not",
  "cannot": "can not",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "wouldn't": "would not",
  "couldn't": "could not",
  "shouldn't": "should not",
  "mustn't": "must not",
};

export const SAMPLE_TEXT =
  "Hello. My name is Ada and I live in a small house with my family. We eat bread and drink water. The sun is hot today. I want to learn this language.";

function oneSyllable(word) {
  const groups = word.match(/[aeiouy]+/g);
  return Boolean(groups && groups.length === 1);
}

function syllables(word) {
  return (word.match(/[aeiouy]+/g) || []).length;
}

function shouldDouble(word) {
  return oneSyllable(word) && /[^aeiou][aeiou][^aeiouwxy]$/.test(word);
}

function thirdPerson(word) {
  if (/(s|x|z|ch|sh)$/.test(word) || /[^aeiou]o$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

function pastTense(word) {
  if (/e$/.test(word)) return `${word}d`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ied`;
  if (shouldDouble(word)) return `${word}${word.slice(-1)}ed`;
  return `${word}ed`;
}

function gerund(word) {
  if (/ie$/.test(word)) return `${word.slice(0, -2)}ying`;
  if (/e$/.test(word) && !/ee$/.test(word)) return `${word.slice(0, -1)}ing`;
  if (shouldDouble(word)) return `${word}${word.slice(-1)}ing`;
  return `${word}ing`;
}

function regularVerbForms(word) {
  return [thirdPerson(word), pastTense(word), gerund(word)];
}

function comparative(word) {
  if (/[^aeiou]y$/.test(word)) {
    const stem = word.slice(0, -1);
    return [`${stem}ier`, `${stem}iest`];
  }
  if (/e$/.test(word)) return [`${word}r`, `${word}st`];
  if (shouldDouble(word)) {
    const stem = `${word}${word.slice(-1)}`;
    return [`${stem}er`, `${stem}est`];
  }
  return [`${word}er`, `${word}est`];
}

function pluralForms(word) {
  if (PLURAL[word]) return PLURAL[word];
  if (/(s|x|z|ch|sh)$/.test(word)) return [`${word}es`];
  if (/fe$/.test(word) || /f$/.test(word)) {
    const stem = /fe$/.test(word) ? word.slice(0, -2) : word.slice(0, -1);
    return [`${stem}ves`];
  }
  if (/[^aeiou]y$/.test(word)) return [`${word.slice(0, -1)}ies`];
  return [`${word}s`];
}

function claim(map, surface, lemma) {
  if (!surface || surface === lemma) return;
  if (WORD_IDS.has(surface)) return;
  if (map.has(surface)) return;
  map.set(surface, lemma);
}

function buildAliases() {
  const map = new Map();
  for (const word of WORDS) {
    if (word.cat !== "verbs") continue;
    const forms = IRREGULAR[word.id] || regularVerbForms(word.id);
    for (const form of forms) claim(map, form, word.id);
  }
  for (const word of WORDS) {
    if (word.cat !== "qualities" || NO_COMPARE.has(word.id)) continue;
    const forms = COMPARE[word.id] || (syllables(word.id) <= 2 ? comparative(word.id) : []);
    for (const form of forms) claim(map, form, word.id);
  }
  for (const word of WORDS) {
    const countable = word.cat === "things" || PLURAL_IDS.has(word.id);
    if (!countable) continue;
    for (const form of pluralForms(word.id)) claim(map, form, word.id);
  }
  for (const word of WORDS) {
    for (const form of DIGITS[word.id] || []) claim(map, form, word.id);
  }
  return map;
}

const ALIASES = buildAliases();

export function lemmaOf(surface) {
  const key = String(surface || "").toLowerCase().replace(/’/g, "'");
  if (WORD_IDS.has(key)) return key;
  return ALIASES.get(key) || null;
}

export function inflections(id) {
  const forms = [];
  for (const [surface, lemma] of ALIASES) {
    if (lemma === id) forms.push(surface);
  }
  return forms.sort();
}

function isBaseWordChar(char) {
  return /[\p{L}\p{M}\p{N}]/u.test(char || "");
}

export function readWord(text, index) {
  if (!isBaseWordChar(text[index])) return "";
  let end = index + 1;
  while (end < text.length) {
    if (isBaseWordChar(text[end])) {
      end += 1;
      continue;
    }
    const joiner = text[end] === "'" || text[end] === "’" || text[end] === "-";
    if (joiner && isBaseWordChar(text[end + 1])) {
      end += 1;
      continue;
    }
    break;
  }
  return text.slice(index, end);
}

function normToken(word) {
  return word.toLowerCase().replace(/’/g, "'");
}

function tokensOf(value) {
  const text = String(value || "");
  const parts = [];
  let index = 0;
  while (index < text.length) {
    const word = readWord(text, index);
    if (!word) {
      index += 1;
      continue;
    }
    parts.push(normToken(word));
    index += word.length;
  }
  return parts;
}

function emptyLanguage() {
  return {
    version: 1,
    name: "",
    words: {},
    phrases: [],
    missing: "keep",
  };
}

export function interpret(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (trimmed === "-" || trimmed === "—" || trimmed === "–") return "";
  return trimmed;
}

function clip(value, max) {
  return String(value ?? "").slice(0, max);
}

function normalizePhrase(phrase, index) {
  if (!phrase || typeof phrase !== "object") return null;
  const from = clip(phrase.from, 120);
  const to = clip(phrase.to, 120);
  if (!from.trim() && !to.trim()) return null;
  const id = typeof phrase.id === "string" && phrase.id ? clip(phrase.id, 40) : `p${index}`;
  return { id, from, to };
}

export function normalizeLanguage(input) {
  const source = input && typeof input === "object" ? input : {};
  const words = {};
  const incoming = source.words && typeof source.words === "object" ? source.words : {};
  for (const word of WORDS) {
    const raw = incoming[word.id];
    if (typeof raw !== "string") continue;
    const stored = clip(raw, 80);
    if (!stored.trim()) continue;
    words[word.id] = stored;
  }
  const phrases = [];
  if (Array.isArray(source.phrases)) {
    for (const phrase of source.phrases) {
      if (phrases.length >= PHRASE_LIMIT) break;
      const next = normalizePhrase(phrase, phrases.length);
      if (next) phrases.push(next);
    }
  }
  const missing = source.missing === "skip" || source.missing === "mark" ? source.missing : "keep";
  return {
    version: 1,
    name: clip(source.name, 60).trim(),
    words,
    phrases,
    missing,
  };
}

export function parseLanguage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("not a language");
  }
  if (input.words != null && (typeof input.words !== "object" || Array.isArray(input.words))) {
    throw new Error("not a language");
  }
  return normalizeLanguage(input);
}

export function definedCount(language) {
  const words = language?.words || {};
  let count = 0;
  for (const word of WORDS) {
    if (interpret(words[word.id]) !== null) count += 1;
  }
  return count;
}

function hashWord(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const TOY_CONSONANTS = ["m", "n", "p", "t", "k", "s", "l", "r", "b", "d", "f", "h", "v", "w"];
const TOY_VOWELS = ["a", "e", "i", "o", "u"];

export function toyWord(id) {
  let hash = hashWord(id);
  let word = "";
  for (let i = 0; i < 2; i += 1) {
    word += TOY_CONSONANTS[hash % TOY_CONSONANTS.length];
    hash = Math.floor(hash / TOY_CONSONANTS.length);
    word += TOY_VOWELS[hash % TOY_VOWELS.length];
    hash = Math.floor(hash / TOY_VOWELS.length);
  }
  return word;
}

export function fillEmpty(language) {
  const current = normalizeLanguage(language);
  const used = new Set();
  for (const value of Object.values(current.words)) {
    const spoken = interpret(value);
    if (spoken) used.add(spoken.toLowerCase());
  }
  const words = { ...current.words };
  for (const word of WORDS) {
    if (interpret(words[word.id]) !== null) continue;
    let salt = 0;
    let spoken = toyWord(word.id);
    while (used.has(spoken)) {
      salt += 1;
      spoken = toyWord(`${word.id}:${salt}`);
    }
    used.add(spoken);
    words[word.id] = spoken;
  }
  return { ...current, words };
}

function defaultStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadLanguage(storage = defaultStorage()) {
  if (!storage) return emptyLanguage();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyLanguage();
    return parseLanguage(JSON.parse(raw));
  } catch {
    return emptyLanguage();
  }
}

export function saveLanguage(language, storage = defaultStorage()) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeLanguage(language)));
}

let phraseSerial = 0;

export function newPhrase() {
  phraseSerial += 1;
  return {
    id: `p${Date.now().toString(36)}${phraseSerial}`,
    from: "",
    to: "",
  };
}

function ruleFrom(from, to) {
  const parts = tokensOf(from);
  if (!parts.length) return null;
  return {
    parts,
    to: interpret(to) === null ? String(to ?? "") : interpret(to),
    chars: parts.join(" ").length,
  };
}

function indexRules(rules) {
  const map = new Map();
  for (const rule of rules) {
    const list = map.get(rule.parts[0]) || [];
    list.push(rule);
    map.set(rule.parts[0], list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => b.parts.length - a.parts.length || b.chars - a.chars);
  }
  return map;
}

function lexicalRules(language, direction) {
  const rules = [];
  if (direction === "forward") {
    const seen = new Set();
    const add = (surface, to) => {
      const rule = ruleFrom(surface, to);
      if (!rule || seen.has(rule.parts.join(" "))) return;
      seen.add(rule.parts.join(" "));
      rules.push(rule);
    };
    for (const word of WORDS) {
      const spoken = interpret(language.words[word.id]);
      if (spoken === null) continue;
      add(word.id, spoken);
      for (const [surface, lemma] of ALIASES) {
        if (lemma === word.id) add(surface, spoken);
      }
    }
    return rules;
  }

  const seen = new Set();
  for (const word of WORDS) {
    const spoken = interpret(language.words[word.id]);
    if (!spoken) continue;
    const key = tokensOf(spoken).join(" ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const rule = ruleFrom(spoken, word.id);
    if (rule) rules.push(rule);
  }
  return rules;
}

function phraseRules(language, direction) {
  const rules = [];
  for (const phrase of language.phrases) {
    const from = direction === "forward" ? phrase.from : phrase.to;
    const to = direction === "forward" ? phrase.to : phrase.from;
    if (!String(from || "").trim()) continue;
    const rule = ruleFrom(from, to ?? "");
    if (rule) rules.push(rule);
  }
  return rules;
}

function applyCase(source, replacement) {
  if (!replacement) return "";
  const letters = source.match(/\p{L}/gu) || [];
  if (!letters.length) return replacement;
  const cased = letters.filter((char) => char.toLowerCase() !== char.toUpperCase());
  if (cased.length > 1 && cased.every((char) => char === char.toUpperCase())) {
    return replacement.toLocaleUpperCase();
  }
  const first = letters[0];
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    const chars = [...replacement];
    for (let i = 0; i < chars.length; i += 1) {
      if (/\p{L}/u.test(chars[i])) {
        chars[i] = chars[i].toLocaleUpperCase();
        return chars.join("");
      }
    }
  }
  return replacement;
}

function matchRule(text, index, rules) {
  if (!rules) return null;
  for (const rule of rules) {
    let cursor = index;
    let ok = true;
    for (let part = 0; part < rule.parts.length; part += 1) {
      if (part > 0) {
        if (cursor >= text.length || !/\s/.test(text[cursor])) {
          ok = false;
          break;
        }
        while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
      }
      const word = readWord(text, cursor);
      if (!word || normToken(word) !== rule.parts[part]) {
        ok = false;
        break;
      }
      cursor += word.length;
    }
    if (ok) return { rule, end: cursor };
  }
  return null;
}

function tidy(text) {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+|[ \t]+$/g, "");
}

function render(text, ctx) {
  let index = 0;
  let out = "";
  while (index < text.length) {
    const word = readWord(text, index);
    if (!word) {
      out += text[index];
      index += 1;
      continue;
    }
    const key = normToken(word);
    const phrase = matchRule(text, index, ctx.phrases.get(key));
    if (phrase) {
      out += applyCase(text.slice(index, phrase.end), phrase.rule.to);
      index = phrase.end;
      continue;
    }
    if (ctx.direction === "forward" && CONTRACTIONS[key]) {
      out += render(applyCase(word, CONTRACTIONS[key]), ctx);
      index += word.length;
      continue;
    }
    const lexical = matchRule(text, index, ctx.lexical.get(key));
    if (lexical) {
      out += applyCase(text.slice(index, lexical.end), lexical.rule.to);
      index = lexical.end;
      continue;
    }
    if (ctx.missing === "skip") {
      // the surrounding spaces collapse in tidy()
    } else if (ctx.missing === "mark") {
      out += `〔${word}〕`;
    } else {
      out += word;
    }
    index += word.length;
  }
  return out;
}

export function translate(text, language, direction = "forward") {
  const current = normalizeLanguage(language);
  const way = direction === "back" ? "back" : "forward";
  const ctx = {
    direction: way,
    missing: current.missing,
    phrases: indexRules(phraseRules(current, way)),
    lexical: indexRules(lexicalRules(current, way)),
  };
  return tidy(render(String(text ?? ""), ctx));
}
