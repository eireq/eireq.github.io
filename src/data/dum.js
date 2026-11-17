// Dum Languag course. The glosses live in dum-languag.lingo.json.
// Lessons, grading, hearts, and the streak are pure so the page can stay thin.

import rawLanguage from "./dum-languag.lingo.json" with { type: "json" };
import { WORDS, normalizeLanguage, translate } from "./lingo.js";

export const STORAGE_KEY = "eireDum";
export const HEARTS = 5;
export const LESSON_LENGTH = 10;
export const XP_PER_CORRECT = 10;
export const XP_PERFECT = 20;

export const DUM_LANGUAGE = normalizeLanguage(rawLanguage);

export const UNITS = [
  {
    id: "hello",
    lessons: [
      {
        words: ["hello", "goodbye", "yes", "please", "thanks"],
        sentences: ["yes please", "hello friend"],
      },
      {
        words: ["sorry", "ok", "no", "not", "but", "same"],
        sentences: ["yes please"],
      },
    ],
  },
  {
    id: "people",
    lessons: [
      {
        words: ["i", "you", "he", "she", "we", "they", "my"],
        sentences: ["i and you", "we and they", "my name"],
      },
      {
        words: ["me", "him", "her", "your", "his", "our", "their"],
        sentences: ["my friend", "his name", "our family"],
      },
    ],
  },
  {
    id: "questions",
    lessons: [
      {
        words: ["who", "what", "where", "when"],
        sentences: ["what is that", "where is my friend"],
      },
      {
        words: ["why", "how", "which"],
        sentences: ["what is that", "where is my friend"],
      },
    ],
  },
  {
    id: "family",
    lessons: [
      {
        words: ["mother", "father", "child", "baby", "family", "friend"],
        sentences: ["my mother and my father", "my family is good"],
      },
      {
        words: ["man", "woman", "person", "name", "home", "door"],
        sentences: ["a man and a woman", "the child and the baby", "my home", "the door"],
      },
    ],
  },
  {
    id: "numbers",
    lessons: [
      {
        words: ["one", "two", "three", "four", "five", "ten"],
        sentences: ["one and two", "five and ten"],
      },
      {
        words: ["today", "tomorrow", "now", "day", "night", "soon"],
        sentences: ["today and tomorrow", "good night", "the first day"],
      },
    ],
  },
  {
    id: "place",
    lessons: [
      {
        words: ["here", "there", "in", "on", "to", "with"],
        sentences: ["here and there", "in my home", "on the road"],
      },
      {
        words: ["from", "over", "under", "before", "after", "up", "down"],
        sentences: ["to school", "with my friend"],
      },
    ],
  },
  {
    id: "qualities",
    lessons: [
      {
        words: ["good", "bad", "big", "small", "hot", "new", "old"],
        sentences: ["good and bad", "the sun is hot", "a big dog"],
      },
      {
        words: ["happy", "sad", "angry", "fast", "slow", "hard", "easy"],
        sentences: ["i am happy", "new and old"],
      },
    ],
  },
  {
    id: "verbs",
    lessons: [
      {
        words: ["go", "eat", "drink", "want", "see", "be", "have"],
        sentences: ["i eat", "i drink water", "i want food", "i go home"],
      },
      {
        words: ["sleep", "help", "love", "read", "live", "come", "work"],
        sentences: ["we sleep", "please help"],
      },
    ],
  },
  {
    id: "world",
    lessons: [
      {
        words: ["sun", "moon", "water", "fire", "dog", "cat", "tree"],
        sentences: ["the sun and the moon", "water and fire", "my dog and my cat"],
      },
      {
        words: ["bread", "food", "language", "song", "book", "sea"],
        sentences: ["a song", "the language", "bread is good"],
      },
    ],
  },
  {
    id: "sentences",
    lessons: [
      {
        words: [],
        sentences: [
          "i live in a small house",
          "my name is good",
          "the sun is hot today",
          "hello my name is ada",
          "i see the moon",
          "where is the school",
          "can you help",
        ],
      },
      {
        words: [],
        sentences: [
          "i want to learn this language",
          "we eat bread and drink water",
          "i am happy",
          "please help",
          "what is that",
          "with my friend",
          "good night",
        ],
      },
      {
        words: [],
        sentences: [
          "i will not go",
          "she can help",
          "close the door",
          "i hear a song",
          "give me water",
          "i need food",
          "the dog can run",
          "i love you",
          "what is your name",
          "this is my home",
          "they can see us",
          "i like the cat",
        ],
      },
    ],
  },
  {
    id: "more",
    lessons: [
      {
        words: ["zero", "six", "seven", "eight", "nine", "can", "will", "must"],
        sentences: ["zero and one", "six and seven", "eight and nine", "i can see", "i will go", "you must eat"],
      },
      {
        words: ["say", "know", "sit", "open", "bird", "fish", "city", "hand"],
        sentences: ["i say yes", "i know you", "sit here", "open the door", "a bird and a fish", "the city is big", "my hand"],
      },
    ],
  },
];

const glossOwners = new Map();
for (const word of WORDS) {
  const key = normalizeAnswer(DUM_LANGUAGE.words[word.id]);
  const list = glossOwners.get(key) || [];
  list.push(word.id);
  glossOwners.set(key, list);
}

const phraseByFrom = new Map(DUM_LANGUAGE.phrases.map((phrase) => [phrase.from, phrase]));

export function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function canTypeGloss(gloss) {
  const text = String(gloss ?? "").trim();
  if (!text || text.length > 24) return false;
  if (!/^[\p{L}\p{M}!' ]+$/u.test(text)) return false;
  return /\p{L}/u.test(text);
}

export function isUniqueGloss(id) {
  const gloss = DUM_LANGUAGE.words[id];
  if (!gloss) return false;
  return glossOwners.get(normalizeAnswer(gloss))?.length === 1;
}

export function lessonKey(unitId, lessonIndex) {
  return `${unitId}:${lessonIndex}`;
}

export function emptyProgress() {
  return { xp: 0, streak: 0, lastDay: "", crowns: {} };
}

const LESSON_KEYS = new Set(
  UNITS.flatMap((unit) => unit.lessons.map((_, index) => lessonKey(unit.id, index))),
);

export function normalizeProgress(input) {
  const source = input && typeof input === "object" ? input : {};
  const crowns = {};
  const rawCrowns = source.crowns && typeof source.crowns === "object" ? source.crowns : {};
  for (const key of LESSON_KEYS) {
    if (rawCrowns[key]) crowns[key] = true;
  }
  const xp = Number.isFinite(source.xp) ? Math.max(0, Math.floor(source.xp)) : 0;
  const streak = Number.isFinite(source.streak) ? Math.max(0, Math.floor(source.streak)) : 0;
  const lastDay = /^\d{4}-\d{2}-\d{2}$/.test(source.lastDay) ? source.lastDay : "";
  return { xp, streak, lastDay, crowns };
}

export function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function previousDay(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day || "");
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() - 1);
  return localDay(date);
}

export function isLessonOpen(progress, unitIndex, lessonIndex) {
  const unit = UNITS[unitIndex];
  if (!unit || lessonIndex < 0 || lessonIndex >= unit.lessons.length) return false;
  const current = normalizeProgress(progress);
  if (lessonIndex > 0) return Boolean(current.crowns[lessonKey(unit.id, lessonIndex - 1)]);
  if (unitIndex === 0) return true;
  const prev = UNITS[unitIndex - 1];
  return prev.lessons.every((_, index) => current.crowns[lessonKey(prev.id, index)]);
}

export function finishLesson(progress, unitId, lessonIndex, details = {}) {
  const current = normalizeProgress(progress);
  const correct = Math.max(0, Math.floor(details.correct || 0));
  const heartsLeft = Math.max(0, Math.floor(details.heartsLeft || 0));
  const perfect = heartsLeft === HEARTS;
  const xpGain = correct * XP_PER_CORRECT + (perfect ? XP_PERFECT : 0);
  const today = details.today || localDay();
  let streak = current.streak;
  let lastDay = current.lastDay;
  if (today && today !== lastDay) {
    streak = lastDay && lastDay === previousDay(today) ? streak + 1 : 1;
    lastDay = today;
  }
  return {
    xpGain,
    perfect,
    progress: {
      xp: current.xp + xpGain,
      streak,
      lastDay,
      crowns: { ...current.crowns, [lessonKey(unitId, lessonIndex)]: true },
    },
  };
}

function defaultStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadProgress(storage = defaultStorage()) {
  if (!storage) return emptyProgress();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage = defaultStorage()) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
}

export function newSession() {
  return { hearts: HEARTS, correct: 0, index: 0, failed: false };
}

export function applyAnswer(session, correct) {
  if (!session || session.failed) return session;
  if (correct) {
    return { ...session, correct: session.correct + 1, index: session.index + 1 };
  }
  const hearts = session.hearts - 1;
  return {
    ...session,
    hearts,
    index: session.index + 1,
    failed: hearts <= 0,
  };
}

export function lessonCleared(session, length) {
  return Boolean(session) && session.hearts > 0 && !session.failed && session.index >= length;
}

export function gradeExercise(exercise, input) {
  if (!exercise) return false;
  if (exercise.type === "match") {
    if (!Array.isArray(input) || input.length !== exercise.pairs.length) return false;
    const want = exercise.pairs.map(pairKey).sort();
    const got = input.map(pairKey).sort();
    return want.every((item, index) => item === got[index]);
  }
  if (exercise.type === "tap") {
    const text = Array.isArray(input) ? input.join(" ") : String(input ?? "");
    const accepted = exercise.accepted?.length ? exercise.accepted : [exercise.answer];
    return accepted.some((item) => normalizeAnswer(item) === normalizeAnswer(text));
  }
  return normalizeAnswer(input) === normalizeAnswer(exercise.answer);
}

function pairKey(pair) {
  return `${normalizeAnswer(pair?.en)}=${normalizeAnswer(pair?.dum)}`;
}

function hashCode(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function answerParts(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function glossChoices(answer, rng, avoid = []) {
  const choices = [answer];
  const seen = new Set([normalizeAnswer(answer), ...avoid.map(normalizeAnswer)]);
  const bag = shuffle(
    WORDS.map((word) => DUM_LANGUAGE.words[word.id]),
    rng,
  );
  for (const gloss of bag) {
    const key = normalizeAnswer(gloss);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    choices.push(gloss);
    if (choices.length === 4) break;
  }
  return shuffle(choices, rng);
}

function makeChooseDum(prompt, answer, rng) {
  return {
    type: "choose-dum",
    prompt,
    answer,
    choices: glossChoices(answer, rng),
  };
}

function makeType(id) {
  return {
    type: "type",
    prompt: id,
    answer: DUM_LANGUAGE.words[id],
  };
}

function makeChooseEn(id, pool, rng) {
  if (!isUniqueGloss(id)) return null;
  const prompt = DUM_LANGUAGE.words[id];
  const choices = [id];
  const seen = new Set([id]);
  const bags = [shuffle(pool.filter(isUniqueGloss), rng), shuffle(WORDS.map((word) => word.id).filter(isUniqueGloss), rng)];
  for (const bag of bags) {
    for (const other of bag) {
      if (seen.has(other)) continue;
      if (normalizeAnswer(DUM_LANGUAGE.words[other]) === normalizeAnswer(prompt)) continue;
      seen.add(other);
      choices.push(other);
      if (choices.length === 4) return {
        type: "choose-en",
        prompt,
        answer: id,
        choices: shuffle(choices, rng),
      };
    }
  }
  return null;
}

function makeMatch(pool, rng) {
  const picked = [];
  const glosses = new Set();
  for (const id of shuffle(pool.filter(isUniqueGloss), rng)) {
    const gloss = DUM_LANGUAGE.words[id];
    const key = normalizeAnswer(gloss);
    if (!key || glosses.has(key)) continue;
    glosses.add(key);
    picked.push({ en: id, dum: gloss });
    if (picked.length === 4) break;
  }
  if (picked.length < 4) return null;
  return {
    type: "match",
    pairs: picked,
    left: shuffle(picked.map((pair) => pair.en), rng),
    right: shuffle(picked.map((pair) => pair.dum), rng),
  };
}

function makeSentence(sentence, siblings, rng, preferChoose) {
  const answer = translate(sentence, DUM_LANGUAGE);
  const phrase = phraseByFrom.get(sentence);
  const accepted = [answer];
  if (phrase && normalizeAnswer(phrase.to) !== normalizeAnswer(answer)) accepted.push(phrase.to);
  const parts = answerParts(answer);
  const choose = preferChoose || parts.length < 2 || parts.length > 8;
  if (choose) {
    const otherAnswers = siblings
      .filter((item) => item !== sentence)
      .map((item) => translate(item, DUM_LANGUAGE));
    const choices = [answer];
    const seen = new Set([normalizeAnswer(answer)]);
    for (const gloss of shuffle(otherAnswers, rng)) {
      const key = normalizeAnswer(gloss);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      choices.push(gloss);
      if (choices.length === 4) break;
    }
    if (choices.length < 4) {
      for (const gloss of glossChoices(answer, rng, choices)) {
        const key = normalizeAnswer(gloss);
        if (seen.has(key)) continue;
        seen.add(key);
        choices.push(gloss);
        if (choices.length === 4) break;
      }
    }
    return {
      type: "choose-dum",
      prompt: sentence,
      answer,
      accepted,
      choices: shuffle(choices, rng),
    };
  }
  return {
    type: "tap",
    prompt: sentence,
    answer,
    accepted,
    tiles: withDistractor(parts, rng),
  };
}

function withDistractor(parts, rng) {
  const used = new Set(parts.map(normalizeAnswer));
  let extra = "";
  const bag = shuffle(WORDS.map((word) => DUM_LANGUAGE.words[word.id]), rng);
  for (const gloss of bag) {
    for (const part of answerParts(gloss)) {
      if (used.has(normalizeAnswer(part))) continue;
      extra = part;
      break;
    }
    if (extra) break;
  }
  return shuffle(extra ? [...parts, extra] : [...parts], rng);
}

function sentenceDrill(sentences, rng) {
  const out = [];
  while (out.length < LESSON_LENGTH) {
    const sentence = sentences[out.length % sentences.length];
    out.push(makeSentence(sentence, sentences, rng, out.length % 2 === 1));
  }
  return out;
}

function locate(unitId, lessonIndex) {
  const unit = UNITS.find((item) => item.id === unitId);
  const lesson = unit?.lessons[lessonIndex];
  if (!lesson) return null;
  return { unit, lesson };
}

export function buildLesson(unitId, lessonIndex, seed = `${unitId}:${lessonIndex}`) {
  const found = locate(unitId, lessonIndex);
  if (!found) throw new Error("no lesson");
  const { unit, lesson } = found;
  const rng = mulberry32(hashCode(String(seed)));
  if (!lesson.words.length) return sentenceDrill(lesson.sentences, rng);

  const pool = unit.lessons.flatMap((item) => item.words);
  const required = [];
  let types = 0;
  for (const id of lesson.words) {
    if (canTypeGloss(DUM_LANGUAGE.words[id]) && types < 2) {
      required.push(makeType(id));
      types += 1;
    } else {
      required.push(makeChooseDum(id, DUM_LANGUAGE.words[id], rng));
    }
  }

  const extra = [];
  const match = makeMatch(pool, rng);
  if (match) extra.push(match);
  let english = 0;
  for (const id of shuffle(pool.filter(isUniqueGloss), rng)) {
    if (english >= 2) break;
    const exercise = makeChooseEn(id, pool, rng);
    if (!exercise) continue;
    extra.push(exercise);
    english += 1;
  }

  let sentenceCount = Math.min(2, lesson.sentences.length);
  let extraRoom = LESSON_LENGTH - required.length - sentenceCount;
  if (extraRoom < 0) {
    sentenceCount += extraRoom;
    extraRoom = 0;
  }
  const sentences = shuffle(lesson.sentences, rng)
    .slice(0, sentenceCount)
    .map((sentence) => makeSentence(sentence, lesson.sentences, rng, false));
  const keptExtra = extra.slice(0, Math.max(0, extraRoom));
  const exercises = [...required, ...keptExtra, ...sentences];
  while (exercises.length < LESSON_LENGTH) {
    const id = lesson.words[exercises.length % lesson.words.length];
    exercises.push(makeChooseDum(id, DUM_LANGUAGE.words[id], rng));
  }
  return shuffle(exercises.slice(0, LESSON_LENGTH), rng);
}
