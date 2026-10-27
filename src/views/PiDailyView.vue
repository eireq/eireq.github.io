<template>
  <main class="pi">
    <h1>{{ t("pi.title") }}</h1>
    <p class="intro">{{ t("pi.intro") }}</p>
    <p class="meta">
      {{ dateKey }}
      · {{ t("pi.streak") }}: <strong>{{ streak }}</strong>
      · {{ t("pi.known") }}: <strong>{{ progress.mastered }}</strong>
    </p>

    <template v-if="hold || progress.status === 'quiz'">
      <div v-if="displayLesson.steps.length > 1" class="pips" aria-hidden="true">
        <span
          v-for="(item, index) in displayLesson.steps"
          :key="`${item.type}-${index}`"
          :class="{
            done: index < questionIndex,
            now: index === questionIndex,
          }"
        />
      </div>
      <p class="qmeta">
        {{ t("pi.question") }} {{ questionIndex + 1 }} {{ t("pi.of") }}
        {{ displayLesson.steps.length }}
      </p>
      <p class="prompt">{{ prompt }}</p>
      <div class="slots">
        <input
          v-for="(slot, index) in slots"
          :key="index"
          :ref="(el) => setSlotRef(el, index)"
          class="slot"
          :class="[slot.state, { gap: slot.gap }]"
          :value="slot.char"
          inputmode="numeric"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          maxlength="1"
          :aria-label="`${prompt} ${index + 1}`"
          @input="onSlot(index, $event)"
          @keydown.enter.prevent="submit"
          @keydown.backspace="onBackspace(index, $event)"
          @paste="onPaste(index, $event)"
        />
      </div>
      <div class="actions">
        <button type="button" :disabled="!canSubmit" @click="submit">
          {{ t("pi.check") }}
        </button>
      </div>
      <p class="feedback" :class="feedbackTone" aria-live="polite">
        {{ feedback }}
      </p>
    </template>

    <template v-else-if="progress.status === 'done' || progress.status === 'failed'">
      <div class="card">
        <p class="eyebrow">
          {{ progress.status === "done" ? t("pi.doneTitle") : t("pi.failedTitle") }}
        </p>
        <div class="pi-hero">
          <span class="pi-three">3.</span>
          <p class="pi-frac">
            <span v-if="lockedDigits.hiddenCount" class="pi-ellipsis">…</span>
            <span
              v-for="(cell, index) in lockedDigits.cells"
              :key="`${cell.kind}-${index}`"
              class="pi-digit"
              :class="[cell.kind, { gap: cell.gap }]"
            >{{ cell.char }}</span>
          </p>
        </div>
        <p class="hint">
          {{ progress.status === "done" ? t("pi.doneText") : t("pi.failedText") }}
        </p>
      </div>
      <p class="countdown">{{ t("pi.nextIn") }} {{ countdown }}</p>
      <div class="actions">
        <button
          v-if="canToggleLocked"
          type="button"
          class="ghost"
          @click="showAll = !showAll"
        >
          {{ showAll ? t("pi.hideAll") : t("pi.showAll") }}
        </button>
        <button type="button" class="ghost" @click="shareResult">
          {{ shareLabel }}
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="lesson.steps.length > 1" class="pips" aria-hidden="true">
        <span
          v-for="(item, index) in lesson.steps"
          :key="`${item.type}-${index}`"
          :class="{
            done: index < progress.step,
            now: index === progress.step,
          }"
        />
      </div>
      <div class="card">
        <p class="eyebrow">{{ studyLabel }}</p>
        <div class="pi-hero">
          <span class="pi-three">3.</span>
          <p class="pi-frac">
            <span v-if="studyDigits.hiddenCount" class="pi-ellipsis">…</span>
            <span
              v-for="(cell, index) in studyDigits.cells"
              :key="`${cell.kind}-${index}`"
              class="pi-digit"
              :class="[cell.kind, { gap: cell.gap }]"
            >{{ cell.char }}</span>
          </p>
        </div>
        <p class="hint">{{ studyHint }}</p>
      </div>
      <div class="actions">
        <button type="button" @click="startQuiz">{{ t("pi.quizMe") }}</button>
        <button
          v-if="canToggleStudy"
          type="button"
          class="ghost"
          @click="showAll = !showAll"
        >
          {{ showAll ? t("pi.hideAll") : t("pi.showAll") }}
        </button>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { utcDateKey } from "@/data/flags.js";
import { PI_DECIMALS } from "@/data/piDigits.js";
import {
  ATTEMPTS,
  beginPiQuiz,
  gradeAnswer,
  lessonPlan,
  loadPiProgress,
  msUntilUtcMidnight,
  sharePiText,
  submitPiAnswer,
  visibleStreak,
} from "@/data/piDaily.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const dateKey = ref(utcDateKey());
const progress = ref(loadPiProgress(dateKey.value));
const typed = ref([]);
const marks = ref([]);
const showAll = ref(false);
const hold = ref(false);
const frozenStep = ref(null);
const frozenIndex = ref(0);
const frozenLesson = ref(null);
const slotRefs = ref([]);
const countdown = ref("");
const shareLabel = ref("");
let dayTimer = 0;
let clockTimer = 0;
let holdTimer = 0;

const lesson = computed(() => lessonPlan(progress.value.mastered, dateKey.value));
const displayLesson = computed(() => frozenLesson.value || lesson.value);
const displayStep = computed(() => {
  if (frozenStep.value) return frozenStep.value;
  return lesson.value.steps[progress.value.step] || null;
});
const questionIndex = computed(() =>
  hold.value ? frozenIndex.value : progress.value.step,
);
const streak = computed(() => visibleStreak(progress.value, dateKey.value));

const studyStep = computed(
  () => lesson.value.steps[progress.value.step] || lesson.value.steps[0] || null,
);

const studyDigits = computed(() => {
  const step = studyStep.value;
  const reveal = step?.type === "learn" ? step.answer : "";
  const added = step?.type === "learn" ? step.added : 0;
  return buildReadout(lesson.value.known, reveal, added, 30);
});

const doneDigits = computed(() => {
  const all = PI_DECIMALS.slice(0, progress.value.mastered);
  const gained = progress.value.gained || 0;
  const known = gained ? all.slice(0, all.length - gained) : all;
  const reveal = gained ? all.slice(all.length - gained) : "";
  return buildReadout(known, reveal, gained, 40);
});

const failedDigits = computed(() =>
  buildReadout(lesson.value.known, lesson.value.fresh, lesson.value.fresh.length, 40),
);

const lockedDigits = computed(() =>
  progress.value.status === "done" ? doneDigits.value : failedDigits.value,
);

const canToggleStudy = computed(() => lesson.value.known.length > 30);
const canToggleLocked = computed(() => {
  if (progress.value.status === "done") return progress.value.mastered > 40;
  return lesson.value.known.length + lesson.value.fresh.length > 40;
});

const studyLabel = computed(() => {
  const step = studyStep.value;
  if (!step || step.type !== "learn") return t("pi.reviewTitle");
  if (step.added === step.answer.length) return `+${step.added} ${t("pi.today")}`;
  return `+${step.added} ${t("pi.more")}`;
});

const studyHint = computed(() =>
  lesson.value.fresh.length ? t("pi.studyHint") : t("pi.reviewHint"),
);

const prompt = computed(() => {
  const step = displayStep.value;
  if (!step) return "";
  if (step.type === "learn") {
    return step.added === step.answer.length ? t("pi.promptNew") : t("pi.promptGrow");
  }
  if (step.type === "all") return t("pi.promptAll");
  const range = `${step.from}–${step.to}`;
  const label = step.type === "recall" ? t("pi.promptRecall") : t("pi.promptTail");
  return `${label} ${range}.`;
});

const answerDigits = computed(() => typed.value.join(""));

const slots = computed(() => {
  const answer = displayStep.value?.answer || "";
  const nextEmpty = typed.value.findIndex((digit) => !digit);
  return answer.split("").map((_, index) => {
    const char = typed.value[index] || "";
    let state = "empty";
    if (marks.value.length) state = marks.value[index] || "empty";
    else if (char) state = "filled";
    else if (index === (nextEmpty === -1 ? typed.value.length : nextEmpty)) state = "current";
    return {
      char,
      state,
      gap: index > 0 && index % 5 === 0,
    };
  });
});

const canSubmit = computed(() => {
  const answer = displayStep.value?.answer || "";
  return (
    !hold.value &&
    progress.value.status === "quiz" &&
    answer.length > 0 &&
    answerDigits.value.length === answer.length &&
    /^\d+$/.test(answerDigits.value)
  );
});

const feedback = computed(() => {
  if (hold.value) return t("pi.correct");
  if (!marks.value.length) return `${t("pi.tryLabel")} ${progress.value.misses + 1} / ${ATTEMPTS}`;
  if (progress.value.misses >= ATTEMPTS - 1) return t("pi.lastTry");
  return t("pi.wrong");
});

const feedbackTone = computed(() => {
  if (hold.value) return "ok";
  if (marks.value.length) return "bad";
  return "";
});

function buildReadout(known, reveal, added, limit) {
  const hidden = !showAll.value && known.length > limit;
  const shownKnown = hidden ? known.slice(-limit) : known;
  const hiddenCount = hidden ? known.length - shownKnown.length : 0;
  const cells = [];
  const contextFrom = known.length - 12;
  for (let index = 0; index < shownKnown.length; index += 1) {
    const absolute = hiddenCount + index;
    cells.push({
      char: shownKnown[index],
      kind: absolute >= contextFrom ? "context" : "old",
      gap: cells.length > 0 && cells.length % 5 === 0,
    });
  }
  const newestFrom = reveal.length - added;
  for (let index = 0; index < reveal.length; index += 1) {
    cells.push({
      char: reveal[index],
      kind: index >= newestFrom ? "newest" : "learned",
      gap: cells.length > 0 && cells.length % 5 === 0,
    });
  }
  return { cells, hiddenCount };
}

function formatCountdown(ms) {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function syncDay() {
  const nextKey = utcDateKey();
  if (nextKey === dateKey.value) return;
  window.clearTimeout(holdTimer);
  hold.value = false;
  frozenStep.value = null;
  frozenLesson.value = null;
  typed.value = [];
  marks.value = [];
  showAll.value = false;
  dateKey.value = nextKey;
  progress.value = loadPiProgress(nextKey);
  shareLabel.value = t("pi.share");
}

function tickClock() {
  const remaining = msUntilUtcMidnight();
  countdown.value = formatCountdown(remaining);
  if (remaining < 1000) syncDay();
}

function onVisible() {
  if (document.visibilityState === "visible") syncDay();
}

function setSlotRef(el, index) {
  if (el) slotRefs.value[index] = el;
}

function focusSlot(index) {
  const max = displayStep.value?.answer.length || 1;
  const next = Math.max(0, Math.min(index, max - 1));
  slotRefs.value[next]?.focus();
}

function blankDigits() {
  const max = displayStep.value?.answer.length || 0;
  return Array.from({ length: max }, (_, index) => typed.value[index] || "");
}

function focusField() {
  if (progress.value.status !== "quiz" || hold.value) return;
  const index = typed.value.findIndex((digit) => !digit);
  focusSlot(index === -1 ? 0 : index);
}

function startQuiz() {
  progress.value = beginPiQuiz(progress.value);
  typed.value = [];
  marks.value = [];
  nextTick(focusField);
}

function writeDigits(chars, focusIndex) {
  typed.value = chars;
  if (marks.value.length) marks.value = [];
  nextTick(() => focusSlot(focusIndex));
}

function onSlot(index, event) {
  if (hold.value) {
    event.target.value = typed.value[index] || "";
    return;
  }
  const incoming = event.target.value.replace(/\D/g, "");
  const chars = blankDigits();
  if (!incoming) {
    chars[index] = "";
    writeDigits(chars, index);
    return;
  }
  chars[index] = incoming.slice(-1);
  writeDigits(chars, index + 1);
}

function onBackspace(index, event) {
  if (hold.value || typed.value[index]) return;
  event.preventDefault();
  const chars = blankDigits();
  if (index > 0) chars[index - 1] = "";
  writeDigits(chars, index - 1);
}

function onPaste(index, event) {
  event.preventDefault();
  if (hold.value) return;
  const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "");
  const chars = blankDigits();
  pasted.split("").forEach((digit, offset) => {
    if (index + offset < chars.length) chars[index + offset] = digit;
  });
  writeDigits(chars, index + pasted.length);
}

function submit() {
  if (!canSubmit.value) return;
  const step = displayStep.value;
  const guess = answerDigits.value;
  const grade = gradeAnswer(guess, step.answer);
  marks.value = grade.marks;
  const beforeStep = progress.value.step;
  const currentLesson = lesson.value;
  const next = submitPiAnswer(progress.value, dateKey.value, guess);
  progress.value = next;
  if (!grade.correct) {
    if (next.status === "failed") {
      typed.value = [];
      marks.value = [];
    }
    return;
  }
  frozenStep.value = step;
  frozenIndex.value = beforeStep;
  frozenLesson.value = currentLesson;
  hold.value = true;
  window.clearTimeout(holdTimer);
  holdTimer = window.setTimeout(() => {
    hold.value = false;
    frozenStep.value = null;
    frozenLesson.value = null;
    typed.value = [];
    marks.value = [];
    nextTick(focusField);
  }, 520);
}

async function shareResult() {
  const text = sharePiText({
    dateKey: dateKey.value,
    mastered: progress.value.mastered,
    streak: streak.value,
    solved: progress.value.status === "done",
    log: progress.value.log,
  });
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch {
    // clipboard below
  }
  try {
    await navigator.clipboard.writeText(text);
    shareLabel.value = t("pi.copied");
  } catch {
    shareLabel.value = text;
  }
}

watch(
  () => progress.value.status,
  (status) => {
    if (status === "done" || status === "failed") window.scrollTo(0, 0);
  },
);

watch(
  () => [progress.value.status, progress.value.step, hold.value],
  () => {
    if (progress.value.status === "quiz" && !hold.value) nextTick(focusField);
  },
);

onMounted(() => {
  shareLabel.value = t("pi.share");
  tickClock();
  dayTimer = window.setInterval(syncDay, 30000);
  clockTimer = window.setInterval(tickClock, 1000);
  document.addEventListener("visibilitychange", onVisible);
});

onUnmounted(() => {
  window.clearInterval(dayTimer);
  window.clearInterval(clockTimer);
  window.clearTimeout(holdTimer);
  document.removeEventListener("visibilitychange", onVisible);
});
</script>

<style scoped>
.pi {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 80px 30px 100px;
}

h1 {
  font-size: clamp(48px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 16px;
  letter-spacing: -4px;
}

.intro,
.meta,
.hint,
.countdown,
.qmeta,
.feedback {
  color: #888;
  line-height: 1.6;
  margin: 0 0 12px;
}

.intro {
  max-width: 640px;
  font-size: 18px;
}

.meta strong {
  color: #fff;
  font-weight: 600;
}

.card {
  border: 1px solid #222;
  padding: 22px 20px 8px;
  margin: 8px 0 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #aaa;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.pi-hero {
  display: flex;
  align-items: baseline;
  gap: 18px;
  margin: 0 0 8px;
}

.pi-three {
  font-size: clamp(64px, 12vw, 108px);
  line-height: 0.85;
  letter-spacing: -4px;
}

.pi-frac {
  margin: 0;
  font-family: "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: clamp(18px, 3vw, 28px);
  line-height: 1.7;
  letter-spacing: 0.06em;
}

.pi-digit.old {
  color: #555;
}

.pi-digit.context {
  color: #aaa;
}

.pi-digit.learned {
  color: #ddd;
}

.pi-digit.newest {
  color: #fff;
  box-shadow: inset 0 -2px 0 #fff;
}

.pi-digit.gap {
  margin-left: 0.45em;
}

.pi-ellipsis {
  margin-right: 0.35em;
  color: #555;
}

.pips {
  display: flex;
  gap: 8px;
  margin: 18px 0 14px;
}

.pips span {
  width: 28px;
  height: 8px;
  border: 1px solid #333;
}

.pips span.done {
  background: #444;
  border-color: #444;
}

.pips span.now {
  background: #fff;
  border-color: #fff;
}

.prompt {
  margin: 0 0 16px;
  font-size: 18px;
}

.slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.slot {
  width: 42px;
  height: 54px;
  padding: 0;
  text-align: center;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font-family: "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: 24px;
}

.slot.gap {
  margin-left: 10px;
}

.slot.filled,
.slot.current {
  border-color: #fff;
}

.slot.current {
  box-shadow: inset 0 -2px 0 #fff;
}

.slot.ok {
  color: #9be29b;
  border-color: #9be29b;
}

.slot.bad {
  color: #e29b9b;
  border-color: #e29b9b;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  font-family: inherit;
  padding: 13px 16px;
  border: 1px solid #fff;
  background: #fff;
  color: #000;
  cursor: pointer;
}

button:disabled {
  opacity: 0.35;
  cursor: default;
}

.ghost {
  background: transparent;
  color: #fff;
}

.feedback {
  min-height: 1.6em;
  margin-top: 12px;
}

.feedback.ok {
  color: #9be29b;
}

.feedback.bad {
  color: #e29b9b;
}

.countdown {
  margin-bottom: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .pi-digit.newest {
    box-shadow: inset 0 -2px 0 #fff;
  }
}

@media (max-width: 700px) {
  .pi {
    padding: 48px 18px 72px;
  }

  .pi-hero {
    flex-direction: column;
    gap: 8px;
  }

  .slot {
    width: 34px;
    height: 46px;
    font-size: 20px;
  }

  .actions,
  .actions button {
    width: 100%;
  }
}
</style>
