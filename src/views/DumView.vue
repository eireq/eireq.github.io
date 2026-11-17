<template>
  <main class="dum">
    <template v-if="phase === 'path'">
      <header class="top">
        <h1>{{ t("dum.title") }}</h1>
        <p class="intro">{{ t("dum.intro") }}</p>
        <p class="meta">
          {{ t("dum.streak") }}: <strong>{{ progress.streak }}</strong>
          · {{ t("dum.xp") }}: <strong>{{ progress.xp }}</strong>
          · {{ HEARTS }} {{ t("dum.hearts") }}
        </p>
        <p class="links">
          <router-link to="/lingo">{{ t("dum.openLingo") }}</router-link>
        </p>
      </header>

      <ol class="path">
        <li v-for="(unit, unitIndex) in UNITS" :key="unit.id" class="unit">
          <h2>{{ t(`dum.units.${unit.id}`) }}</h2>
          <p class="tip">{{ t(`dum.tips.${unit.id}`) }}</p>
          <div class="nodes">
            <button
              v-for="(lesson, lessonIndex) in unit.lessons"
              :key="lessonIndex"
              type="button"
              class="node"
              :class="{
                crowned: crowned(unit.id, lessonIndex),
                locked: !isLessonOpen(progress, unitIndex, lessonIndex),
              }"
              :disabled="!isLessonOpen(progress, unitIndex, lessonIndex)"
              @click="startLesson(unitIndex, lessonIndex)"
            >
              <span>{{ t("dum.lesson") }} {{ lessonIndex + 1 }}</span>
              <small>{{ nodeLabel(unit.id, unitIndex, lessonIndex) }}</small>
            </button>
          </div>
        </li>
      </ol>
    </template>

    <template v-else-if="phase === 'lesson' && exercise">
      <header class="lesson-top">
        <button type="button" class="ghost" @click="phase = 'path'">
          {{ t("dum.back") }}
        </button>
        <p class="meta">
          {{ t(`dum.units.${UNITS[unitAt].id}`) }}
          · {{ t("dum.lesson") }} {{ lessonAt + 1 }}
          · {{ cursor + (answered ? 1 : 0) }} / {{ exercises.length }}
          · {{ session.hearts }} {{ t("dum.hearts") }}
        </p>
        <div class="bar" aria-hidden="true">
          <span :style="{ width: `${bar}%` }"></span>
        </div>
      </header>

      <p class="ask">{{ promptFor(exercise) }}</p>
      <p class="prompt">{{ exercise.prompt }}</p>

      <div
        v-if="exercise.type === 'choose-dum' || exercise.type === 'choose-en'"
        class="choices"
      >
        <button
          v-for="choice in exercise.choices"
          :key="choice"
          type="button"
          :class="{
            on: picked === choice && !answered,
            good: answered && choice === exercise.answer,
            bad: answered && picked === choice && choice !== exercise.answer,
          }"
          :disabled="answered"
          :aria-pressed="picked === choice"
          @click="picked = choice"
        >
          {{ choice }}
        </button>
      </div>

      <label v-else-if="exercise.type === 'type'" class="type">
        <span class="sr">{{ t("dum.type") }}</span>
        <input
          v-model="typed"
          :disabled="answered"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          @keydown.enter.prevent="primary"
        />
      </label>

      <div v-else-if="exercise.type === 'tap'" class="tap">
        <div class="built" :aria-label="t('dum.tap')">
          <button
            v-for="(tile, index) in built"
            :key="`${tile.id}-built`"
            type="button"
            :disabled="answered"
            @click="removeTile(index)"
          >
            {{ tile.text }}
          </button>
          <span v-if="!built.length" class="ghost-text">{{ t("dum.tap") }}</span>
        </div>
        <div class="bank">
          <button
            v-for="tile in bank"
            :key="tile.id"
            type="button"
            :disabled="answered || tile.used"
            @click="useTile(tile)"
          >
            {{ tile.text }}
          </button>
        </div>
      </div>

      <div v-else class="match">
        <div class="col">
          <button
            v-for="en in exercise.left"
            :key="en"
            type="button"
            :class="{ on: arm === en || pairForEn(en) }"
            :disabled="answered"
            :aria-pressed="arm === en"
            @click="selectEn(en)"
          >
            {{ en }}
            <small v-if="pairForEn(en)">{{ pairForEn(en) }}</small>
          </button>
        </div>
        <div class="col">
          <button
            v-for="dum in exercise.right"
            :key="dum"
            type="button"
            :class="{ on: pairForDum(dum) }"
            :disabled="answered || !arm"
            :aria-pressed="Boolean(pairForDum(dum))"
            @click="selectDum(dum)"
          >
            {{ dum }}
          </button>
        </div>
      </div>

      <p v-if="answered" class="feedback" :class="lastOk ? 'good' : 'bad'" role="status">
        {{ lastOk ? t("dum.correct") : t("dum.wrong") }}
        <span v-if="!lastOk">{{ t("dum.answer") }}: {{ shownAnswer }}</span>
      </p>

      <div class="actions">
        <button type="button" :disabled="!answered && !canCheck" @click="primary">
          {{ answered ? t("dum.continue") : t("dum.check") }}
        </button>
      </div>
    </template>

    <template v-else-if="phase === 'done'">
      <header class="top">
        <h1>{{ t("dum.complete") }}</h1>
        <p class="intro">+{{ xpGain }} {{ t("dum.gained") }}</p>
        <p v-if="perfect" class="meta">{{ t("dum.perfect") }}</p>
        <p class="meta">
          {{ t("dum.streak") }}: <strong>{{ progress.streak }}</strong>
          · {{ t("dum.xp") }}: <strong>{{ progress.xp }}</strong>
        </p>
        <div class="actions">
          <button type="button" @click="phase = 'path'">{{ t("dum.continue") }}</button>
        </div>
      </header>
    </template>

    <template v-else>
      <header class="top">
        <h1>{{ t("dum.out") }}</h1>
        <div class="actions">
          <button type="button" @click="startLesson(unitAt, lessonAt)">
            {{ t("dum.tryAgain") }}
          </button>
          <button type="button" class="ghost" @click="phase = 'path'">
            {{ t("dum.back") }}
          </button>
        </div>
      </header>
    </template>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";
import {
  HEARTS,
  UNITS,
  applyAnswer,
  buildLesson,
  finishLesson,
  gradeExercise,
  isLessonOpen,
  lessonCleared,
  lessonKey,
  loadProgress,
  newSession,
  saveProgress,
} from "../data/dum.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const progress = ref(loadProgress());
const phase = ref("path");
const unitAt = ref(0);
const lessonAt = ref(0);
const exercises = ref([]);
const session = ref(newSession());
const cursor = ref(0);
const answered = ref(false);
const lastOk = ref(false);
const picked = ref("");
const typed = ref("");
const bank = ref([]);
const built = ref([]);
const pairs = ref([]);
const arm = ref("");
const xpGain = ref(0);
const perfect = ref(false);

const exercise = computed(() => exercises.value[cursor.value] || null);
const bar = computed(() => {
  if (!exercises.value.length) return 0;
  const done = cursor.value + (answered.value ? 1 : 0);
  return (done / exercises.value.length) * 100;
});
const canCheck = computed(() => {
  const item = exercise.value;
  if (!item || answered.value) return false;
  if (item.type === "choose-dum" || item.type === "choose-en") return Boolean(picked.value);
  if (item.type === "type") return typed.value.trim().length > 0;
  if (item.type === "tap") return built.value.length > 0;
  if (item.type === "match") return pairs.value.length === item.pairs.length;
  return false;
});
const shownAnswer = computed(() => {
  const item = exercise.value;
  if (!item) return "";
  if (item.type === "match") {
    return item.pairs.map((pair) => `${pair.en} — ${pair.dum}`).join(", ");
  }
  return item.answer;
});

function crowned(unitId, lessonIndex) {
  return Boolean(progress.value.crowns[lessonKey(unitId, lessonIndex)]);
}

function nodeLabel(unitId, unitIndex, lessonIndex) {
  if (!isLessonOpen(progress.value, unitIndex, lessonIndex)) return t("dum.locked");
  if (crowned(unitId, lessonIndex)) return `${t("dum.done")} · ${t("dum.practice")}`;
  return t("dum.start");
}

function promptFor(item) {
  if (item.type === "choose-en") return t("dum.chooseEn");
  if (item.type === "type") return t("dum.type");
  if (item.type === "tap") return t("dum.tap");
  if (item.type === "match") return t("dum.match");
  return t("dum.chooseDum");
}

function layout(item) {
  picked.value = "";
  typed.value = "";
  arm.value = "";
  pairs.value = [];
  built.value = [];
  bank.value = (item?.tiles || []).map((text, index) => ({
    id: `${index}-${text}`,
    text,
    used: false,
  }));
}

function startLesson(unitIndex, lessonIndex) {
  if (!isLessonOpen(progress.value, unitIndex, lessonIndex)) return;
  const unit = UNITS[unitIndex];
  unitAt.value = unitIndex;
  lessonAt.value = lessonIndex;
  exercises.value = buildLesson(unit.id, lessonIndex, `${unit.id}:${lessonIndex}:${Date.now()}`);
  session.value = newSession();
  cursor.value = 0;
  answered.value = false;
  phase.value = "lesson";
  layout(exercises.value[0]);
}

function useTile(tile) {
  if (answered.value || tile.used) return;
  tile.used = true;
  built.value.push(tile);
}

function removeTile(index) {
  if (answered.value) return;
  const [tile] = built.value.splice(index, 1);
  if (tile) tile.used = false;
}

function pairForEn(en) {
  return pairs.value.find((pair) => pair.en === en)?.dum || "";
}

function pairForDum(dum) {
  return pairs.value.some((pair) => pair.dum === dum);
}

function selectEn(en) {
  if (answered.value) return;
  pairs.value = pairs.value.filter((pair) => pair.en !== en);
  arm.value = arm.value === en ? "" : en;
}

function selectDum(dum) {
  if (answered.value || !arm.value) return;
  pairs.value = pairs.value.filter((pair) => pair.dum !== dum && pair.en !== arm.value);
  pairs.value.push({ en: arm.value, dum });
  arm.value = "";
}

function payload() {
  const item = exercise.value;
  if (item.type === "choose-dum" || item.type === "choose-en") return picked.value;
  if (item.type === "type") return typed.value;
  if (item.type === "tap") return built.value.map((tile) => tile.text);
  return pairs.value;
}

function check() {
  const ok = gradeExercise(exercise.value, payload());
  lastOk.value = ok;
  answered.value = true;
  session.value = applyAnswer(session.value, ok);
}

function complete() {
  const result = finishLesson(progress.value, UNITS[unitAt.value].id, lessonAt.value, {
    correct: session.value.correct,
    heartsLeft: session.value.hearts,
  });
  progress.value = result.progress;
  xpGain.value = result.xpGain;
  perfect.value = result.perfect;
  saveProgress(progress.value);
  phase.value = "done";
}

function next() {
  if (session.value.failed || session.value.hearts <= 0) {
    phase.value = "failed";
    return;
  }
  if (lessonCleared(session.value, exercises.value.length)) {
    complete();
    return;
  }
  cursor.value = session.value.index;
  answered.value = false;
  layout(exercises.value[cursor.value]);
}

function primary() {
  if (!answered.value) {
    if (!canCheck.value) return;
    check();
    return;
  }
  next();
}
</script>

<style scoped>
.dum {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 72px 30px 100px;
}

h1 {
  font-size: clamp(48px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 16px;
  letter-spacing: -3px;
}

h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
}

.intro {
  max-width: 640px;
  margin: 0 0 12px;
  color: #ccc;
  font-size: 18px;
  line-height: 1.6;
}

.meta,
.tip,
.links,
.feedback {
  margin: 0 0 14px;
  color: #888;
  line-height: 1.5;
}

.meta strong {
  color: #fff;
  font-weight: 600;
}

.links a {
  color: #fff;
}

.path {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}

.unit {
  padding: 22px 0;
  border-top: 1px solid #222;
}

.tip {
  max-width: 640px;
}

.nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.node,
.choices button,
.actions button,
.ghost,
.bank button,
.built button,
.col button,
.type input {
  font: inherit;
}

.node,
.choices button,
.actions button,
.bank button,
.built button,
.col button {
  cursor: pointer;
}

.node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 1 180px;
  padding: 16px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  text-align: left;
}

.node small {
  color: #888;
}

.node.crowned {
  border-color: #fff;
}

.node:disabled,
button:disabled {
  opacity: 0.4;
  cursor: default;
}

.lesson-top {
  margin-bottom: 22px;
}

.bar {
  height: 2px;
  background: #222;
}

.bar span {
  display: block;
  height: 100%;
  background: #fff;
}

.ask {
  margin: 0 0 8px;
  color: #888;
}

.prompt {
  margin: 0 0 18px;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.15;
  letter-spacing: -1px;
  word-break: break-word;
}

.choices,
.bank,
.built,
.col,
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choices button,
.bank button,
.built button,
.col button,
.actions button,
.type input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  text-align: left;
  word-break: break-word;
}

.choices button.on,
.col button.on,
.built button {
  border-color: #fff;
}

.choices button.good {
  border-color: #fff;
  background: #fff;
  color: #000;
}

.choices button.bad {
  border-color: #555;
  color: #888;
}

.actions {
  margin-top: 18px;
}

.actions button {
  width: auto;
  background: #fff;
  color: #000;
  border-color: #fff;
}

.ghost {
  width: auto;
  background: transparent;
  color: #fff;
  border: 1px solid #333;
  padding: 12px 16px;
}

.match {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.col button {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.col small,
.ghost-text {
  color: #888;
}

.tap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.built,
.bank {
  flex-direction: row;
  flex-wrap: wrap;
}

.built {
  min-height: 58px;
  padding-bottom: 8px;
  border-bottom: 1px solid #222;
}

.built button,
.bank button {
  width: auto;
}

.type input {
  font-size: 18px;
  color-scheme: dark;
}

.feedback.good {
  color: #fff;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 800px) {
  .dum {
    padding: 48px 18px 80px;
  }

  h1 {
    letter-spacing: -2px;
  }

  .match {
    grid-template-columns: 1fr;
  }
}
</style>
