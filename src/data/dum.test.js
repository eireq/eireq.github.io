import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { WORDS, translate, normalizeLanguage } from "./lingo.js";
import {
  DUM_LANGUAGE,
  HEARTS,
  LESSON_LENGTH,
  STORAGE_KEY,
  UNITS,
  XP_PERFECT,
  XP_PER_CORRECT,
  applyAnswer,
  buildLesson,
  canTypeGloss,
  emptyProgress,
  finishLesson,
  gradeExercise,
  isLessonOpen,
  lessonCleared,
  lessonKey,
  loadProgress,
  newSession,
  normalizeAnswer,
  previousDay,
  saveProgress,
} from "./dum.js";

const WORD_HASH = "525b1b4567d05f969dfe11e00b770e2fa409e08ae001a5a0edd406be70bcf8f6";

function memory() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
}

test("the uploaded glosses are unchanged and every phrase fits lingo", () => {
  const canon = WORDS.map((word) => `${word.id}=${DUM_LANGUAGE.words[word.id]}`).join("\n");
  assert.equal(createHash("sha256").update(canon).digest("hex"), WORD_HASH);
  assert.equal(DUM_LANGUAGE.name, "dum languag");
  assert.equal(Object.keys(DUM_LANGUAGE.words).length, 300);
  assert.equal(DUM_LANGUAGE.words.body, "holy sigma rizz 💀😭 is bro fr??? no cap 💀😭");
  assert.equal(DUM_LANGUAGE.words.but, "🍑");
  assert.equal(DUM_LANGUAGE.words.same, "=");
  assert.equal(DUM_LANGUAGE.words.soon, "👀");
  assert.equal(DUM_LANGUAGE.words.seven, "67");
  assert.equal(DUM_LANGUAGE.words.bread, "BUDE CHLIEB  LACNEJŠÍ? NEMYSLÍM SI.");
  assert.equal(DUM_LANGUAGE.words.if, "IMAGINARY FRIENDS");
  assert.equal(DUM_LANGUAGE.phrases.length, 122);
  assert.equal(translate("what is your name", DUM_LANGUAGE), "?Dacho bi q'yt Nam");
  assert.equal(translate("six and seven", DUM_LANGUAGE), "anglicka cislovka y 67");
  assert.equal(translate("i will not go", DUM_LANGUAGE), "ay bud niort i");
  const bare = normalizeLanguage({ ...DUM_LANGUAGE, phrases: [] });
  for (const phrase of DUM_LANGUAGE.phrases) {
    assert.ok(phrase.from.length <= 120);
    assert.ok(phrase.to.length <= 120);
    assert.equal(phrase.to, translate(phrase.from, bare));
    assert.equal(translate(phrase.from, DUM_LANGUAGE), phrase.to);
  }
});

test("typing is for short letter glosses, not emoji or digits", () => {
  assert.equal(canTypeGloss("hai!!"), true);
  assert.equal(canTypeGloss("q'ay"), true);
  assert.equal(canTypeGloss("pyat'"), true);
  assert.equal(canTypeGloss("plox plox"), true);
  assert.equal(canTypeGloss("🍑"), false);
  assert.equal(canTypeGloss("="), false);
  assert.equal(canTypeGloss("👀"), false);
  assert.equal(canTypeGloss("67"), false);
  assert.equal(canTypeGloss("9/11"), false);
  assert.equal(canTypeGloss("h2o2"), false);
  assert.equal(canTypeGloss("holy sigma rizz 💀😭 is bro fr??? no cap 💀😭"), false);
});

test("every lesson is ten exercises and grades cleanly", () => {
  const emoji = new Set(["but", "same", "soon"]);
  for (const unit of UNITS) {
    for (let index = 0; index < unit.lessons.length; index += 1) {
      for (const seed of ["course", "retry-2", "retry-3"]) {
        const lesson = buildLesson(unit.id, index, `${unit.id}:${index}:${seed}`);
        assert.equal(lesson.length, LESSON_LENGTH, `${unit.id}:${index}`);
        const prompts = new Set(lesson.map((exercise) => exercise.prompt));
        for (const word of unit.lessons[index].words) {
          assert.ok(prompts.has(word), `${unit.id}:${index} missing ${word}`);
        }
        if (!unit.lessons[index].words.length) {
          assert.ok(lesson.some((exercise) => exercise.type === "tap"));
          assert.ok(lesson.some((exercise) => exercise.type === "choose-dum"));
        }
        for (const exercise of lesson) {
          if (exercise.type === "type") {
            assert.equal(canTypeGloss(exercise.answer), true);
            assert.equal(emoji.has(exercise.prompt), false);
          }
          if (exercise.type === "choose-dum") {
            const hits = exercise.choices.filter(
              (choice) => normalizeAnswer(choice) === normalizeAnswer(exercise.answer),
            );
            assert.equal(hits.length, 1);
            assert.equal(gradeExercise(exercise, exercise.answer), true);
            assert.equal(gradeExercise(exercise, exercise.choices.find((choice) => normalizeAnswer(choice) !== normalizeAnswer(exercise.answer))), false);
          }
          if (exercise.type === "choose-en") {
            const owners = new Map();
            for (const word of WORDS) {
              const key = normalizeAnswer(DUM_LANGUAGE.words[word.id]);
              owners.set(key, (owners.get(key) || 0) + 1);
            }
            assert.equal(owners.get(normalizeAnswer(exercise.prompt)), 1);
            const same = exercise.choices.filter(
              (choice) => normalizeAnswer(DUM_LANGUAGE.words[choice]) === normalizeAnswer(exercise.prompt),
            );
            assert.deepEqual(same, [exercise.answer]);
            assert.equal(gradeExercise(exercise, exercise.answer.toUpperCase()), true);
            assert.equal(gradeExercise(exercise, "not-a-choice"), false);
          }
          if (exercise.type === "match") {
            assert.equal(exercise.pairs.length, 4);
            const glosses = exercise.pairs.map((pair) => normalizeAnswer(pair.dum));
            assert.equal(new Set(glosses).size, 4);
            assert.equal(gradeExercise(exercise, exercise.pairs), true);
            assert.equal(gradeExercise(exercise, exercise.pairs.slice(0, 3)), false);
          }
          if (exercise.type === "tap") {
            const parts = exercise.answer.trim().split(/\s+/);
            assert.equal(gradeExercise(exercise, parts), true);
            assert.equal(gradeExercise(exercise, parts.map((part) => part.toUpperCase())), true);
            assert.equal(gradeExercise(exercise, [...parts, "nope"]), false);
            for (const part of parts) {
              assert.ok(
                exercise.tiles.some((tile) => normalizeAnswer(tile) === normalizeAnswer(part)),
              );
            }
          }
        }
      }
    }
  }
});

test("hearts end a lesson unsaved and a clear lesson can be crowned", () => {
  let session = newSession();
  for (let miss = 0; miss < HEARTS; miss += 1) session = applyAnswer(session, false);
  assert.equal(session.hearts, 0);
  assert.equal(session.failed, true);
  assert.equal(lessonCleared(session, LESSON_LENGTH), false);
  assert.equal(applyAnswer(session, true).failed, true);

  session = newSession();
  for (let hit = 0; hit < LESSON_LENGTH; hit += 1) session = applyAnswer(session, true);
  assert.equal(lessonCleared(session, LESSON_LENGTH), true);

  session = newSession();
  for (let miss = 0; miss < HEARTS - 1; miss += 1) session = applyAnswer(session, false);
  for (let hit = session.index; hit < LESSON_LENGTH; hit += 1) session = applyAnswer(session, true);
  assert.equal(session.hearts, 1);
  assert.equal(lessonCleared(session, LESSON_LENGTH), true);
});

test("units open in order and a finished lesson updates xp and the streak", () => {
  const fresh = emptyProgress();
  assert.equal(isLessonOpen(fresh, 0, 0), true);
  assert.equal(isLessonOpen(fresh, 0, 1), false);
  assert.equal(isLessonOpen(fresh, 1, 0), false);

  let progress = fresh;
  progress = finishLesson(progress, "hello", 0, { correct: 10, heartsLeft: HEARTS, today: "2026-03-01" }).progress;
  assert.equal(isLessonOpen(progress, 0, 1), true);
  assert.equal(isLessonOpen(progress, 1, 0), false);
  progress = finishLesson(progress, "hello", 1, { correct: 8, heartsLeft: 3, today: "2026-03-01" }).progress;
  assert.equal(isLessonOpen(progress, 1, 0), true);
  assert.equal(progress.streak, 1);
  assert.equal(progress.xp, 10 * XP_PER_CORRECT + XP_PERFECT + 8 * XP_PER_CORRECT);

  const next = finishLesson(progress, "people", 0, { correct: 10, heartsLeft: 5, today: "2026-03-02" });
  assert.equal(next.progress.streak, 2);
  assert.equal(next.perfect, true);
  const gap = finishLesson(progress, "people", 0, { correct: 10, heartsLeft: 5, today: "2026-04-01" });
  assert.equal(gap.progress.streak, 1);
  assert.equal(previousDay("2026-03-01"), "2026-02-28");
  assert.equal(progress.crowns[lessonKey("hello", 0)], true);
});

test("progress round-trips through storage", () => {
  const storage = memory();
  assert.deepEqual(loadProgress(storage), emptyProgress());
  const done = finishLesson(emptyProgress(), "hello", 0, {
    correct: 10,
    heartsLeft: 4,
    today: "2026-11-17",
  }).progress;
  saveProgress({ ...done, xp: 12.9, crowns: { ...done.crowns, bogus: true } }, storage);
  const loaded = loadProgress(storage);
  assert.equal(loaded.xp, 12);
  assert.equal(loaded.crowns.bogus, undefined);
  assert.equal(loaded.crowns[lessonKey("hello", 0)], true);
  assert.equal(storage.getItem(STORAGE_KEY).includes("hello:0"), true);
  storage.setItem(STORAGE_KEY, "{");
  assert.deepEqual(loadProgress(storage), emptyProgress());
});
