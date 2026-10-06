<template>
  <main>
    <div v-if="!started && !finished" class="setup">
      <h1>{{ t("flagQuiz.title") }}</h1>

      <p class="intro">
        {{ t("flagQuiz.intro") }}
      </p>

      <div class="form">
        <label for="name">{{ t("flagQuiz.name") }}</label>
        <input
          id="name"
          v-model="playerName"
          type="text"
          maxlength="30"
          :placeholder="t('flagQuiz.namePlaceholder')"
          @change="persistName"
          @keyup.enter="startQuiz"
        />

        <label for="mode">{{ t("flagQuiz.mode") }}</label>
        <select id="mode" v-model="quizMode">
          <option
            v-for="mode in quizModes"
            :key="mode.value"
            :value="mode.value"
          >
            {{ t(mode.label) }} ({{ poolCounts[mode.value] || 0 }})
          </option>
        </select>

        <label for="amount">{{ t("flagQuiz.amount") }}</label>
        <select id="amount" v-model.number="flagCount">
          <option
            v-for="amount in amountOptions"
            :key="amount"
            :value="amount"
          >
            {{ amount }} {{ t("flagQuiz.flags") }}
          </option>
        </select>

        <button :disabled="starting || !ready" @click="startQuiz">
          {{
            !ready
              ? t("flagQuiz.loading")
              : starting
                ? t("flagQuiz.loading")
                : t("flagQuiz.start")
          }}
        </button>
      </div>
    </div>

    <div v-else-if="started" class="quiz">
      <p class="progress">
        {{ currentIndex + 1 }} / {{ questions.length }}
      </p>

      <img
        v-if="currentQuestion"
        class="flag"
        :src="currentQuestion.flag"
        :alt="t('flagQuiz.flagAlt') + ' ' + currentQuestion.name"
        @error="handleFlagError"
      />
      <p v-if="flagError" class="flag-error">
        {{ t("flagQuiz.unavailable") }} {{ currentQuestion?.name }}
      </p>

      <div class="answer-row">
        <input
          ref="answerInput"
          v-model="answer"
          type="text"
          :placeholder="t('flagQuiz.countryPlaceholder')"
          autocomplete="off"
          @keyup.enter="submitAnswer"
        />
        <button @click="submitAnswer">{{ t("flagQuiz.enter") }}</button>
      </div>

      <p class="score">{{ t("flagQuiz.score") }}: {{ score }}</p>
    </div>

    <div v-else class="results">
      <h1>{{ t("flagQuiz.complete") }}</h1>
      <p class="result-message">{{ resultMessage }}</p>
      <p class="score-final">{{ score }} / {{ questions.length }} ({{ percentage }}%)</p>

      <button class="ghost" @click="analysisOpen = !analysisOpen">
        {{ analysisOpen ? t("flagQuiz.hideAnalysis") : t("flagQuiz.analysis") }}
      </button>

      <section
        v-if="analysisOpen"
        class="analysis"
        :aria-label="t('flagQuiz.analysis')"
      >
        <p v-if="!wrongAnswers.length">{{ t("flagQuiz.allCorrect") }}</p>
        <div v-for="question in wrongAnswers" :key="question.name" class="miss">
          <img
            :src="question.flag"
            :alt="t('flagQuiz.flagAlt') + ' ' + question.name"
          />
          <div>
            <p>
              {{ t("flagQuiz.yourAnswer") }}:
              <strong>{{ question.answer || t("flagQuiz.noAnswer") }}</strong>
            </p>
            <p>
              {{ t("flagQuiz.correctAnswer") }}:
              <strong>{{ question.name }}</strong>
            </p>
          </div>
        </div>
      </section>

      <section class="leaderboard-block">
        <h2>{{ t("flagQuiz.leaderboard") }}</h2>
        <div
          class="leaderboard-modes"
          role="tablist"
          :aria-label="t('flagQuiz.leaderboard')"
        >
          <button
            v-for="mode in quizModes"
            :key="mode.value"
            type="button"
            :class="{ active: leaderboardMode === mode.value }"
            @click="selectLeaderboard(mode.value)"
          >
            {{ t(mode.label) }}
          </button>
        </div>

        <p v-if="leaderboardLoading">{{ t("flagQuiz.loadingLeaderboard") }}</p>
        <p v-else-if="leaderboardError" class="error">{{ leaderboardError }}</p>
        <ol v-else-if="leaderboard.length" class="leaderboard">
          <li
            v-for="(row, index) in leaderboard"
            :key="row.id || `${row.name}-${index}`"
            :class="{ highlight: row.id && row.id === submittedScoreId }"
          >
            <span>#{{ index + 1 }}</span>
            <strong>{{ row.name }}</strong>
            <span>{{ row.score }}/{{ row.total }} ({{ row.percentage }}%)</span>
          </li>
        </ol>
        <p v-else>{{ t("flagQuiz.noScores") }}</p>
        <p v-if="playerPosition">
          {{ t("flagQuiz.position") }} <strong>#{{ playerPosition }}</strong>
        </p>
      </section>

      <button class="restart" @click="resetQuiz">
        {{ t("flagQuiz.playAgain") }}
      </button>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  filterFlagsByMode,
  isCorrectFlagAnswer,
  loadFlags,
  QUIZ_MODE_VALUES,
  shortName,
  shuffle,
} from "@/data/flags.js";
import { cachedFlagImageUrl, prefetchFlagImages } from "@/data/flagImageCache.js";
import { getPlayerName, setPlayerName } from "@/data/profile.js";
import { ensureGameDb } from "@/games/ensureDb.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const flags = ref([]);
const ready = ref(false);
const playerName = ref(getPlayerName());
const flagCount = ref(10);
const quizMode = ref("countries");
const starting = ref(false);
const started = ref(false);
const finished = ref(false);
const questions = ref([]);
const currentIndex = ref(0);
const answer = ref("");
const score = ref(0);
const answerInput = ref(null);
const leaderboard = ref([]);
const playerPosition = ref(null);
const leaderboardLoading = ref(false);
const leaderboardError = ref("");
const scoreSubmitted = ref(false);
const submittedScoreId = ref(null);
const leaderboardMode = ref("countries");
const wrongAnswers = ref([]);
const analysisOpen = ref(false);
const flagError = ref(false);

const quizModes = [
  { value: "countries", label: "flagQuiz.modes.countries" },
  { value: "territorial", label: "flagQuiz.modes.territorial" },
  { value: "historical", label: "flagQuiz.modes.historical" },
  { value: "subdivisions", label: "flagQuiz.modes.subdivisions" },
  { value: "organizations", label: "flagQuiz.modes.organizations" },
  { value: "all", label: "flagQuiz.modes.all" },
];

const poolCounts = computed(() =>
  Object.fromEntries(
    QUIZ_MODE_VALUES.map((mode) => [
      mode,
      filterFlagsByMode(flags.value, mode).length,
    ]),
  ),
);

const amountOptions = computed(() => {
  const max = Math.max(1, poolCounts.value[quizMode.value] || 1);
  return [5, 10, 20, 30, 50, 100].filter((amount) => amount <= max);
});

const currentQuestion = computed(() => questions.value[currentIndex.value]);

const percentage = computed(() => {
  if (!questions.value.length) return 0;
  return Math.round((score.value / questions.value.length) * 100);
});

const resultMessage = computed(() => {
  if (percentage.value === 100) return t("flagQuiz.perfect");
  if (percentage.value >= 80) return t("flagQuiz.good");
  if (percentage.value >= 50) return t("flagQuiz.okay");
  return t("flagQuiz.defeated");
});

onMounted(async () => {
  ensureGameDb();
  flags.value = await loadFlags();
  ready.value = true;
});

watch(quizMode, () => {
  const options = amountOptions.value;
  if (!options.includes(flagCount.value)) {
    flagCount.value = options[options.length - 1] || 5;
  }
});

function persistName() {
  playerName.value = setPlayerName(playerName.value);
}

async function startQuiz() {
  if (starting.value || !ready.value) return;
  persistName();
  starting.value = true;

  try {
    const pool = filterFlagsByMode(flags.value, quizMode.value);
    const selected = shuffle(pool).slice(0, flagCount.value);
    await prefetchFlagImages(selected.map((flag) => flag.svgUrl));
    questions.value = await Promise.all(
      selected.map(async (flag) => ({
        name: shortName(flag),
        flag: await cachedFlagImageUrl(flag.svgUrl),
        record: flag,
      })),
    );
    currentIndex.value = 0;
    score.value = 0;
    answer.value = "";
    wrongAnswers.value = [];
    analysisOpen.value = false;
    leaderboardMode.value = quizMode.value;
    flagError.value = false;
    started.value = true;
    finished.value = false;
    nextTick(() => answerInput.value?.focus());
  } finally {
    starting.value = false;
  }
}

function handleFlagError(event) {
  flagError.value = true;
  event.target.alt = `flag unavailable for ${currentQuestion.value?.name}`;
}

function submitAnswer() {
  const question = currentQuestion.value;
  if (!question) return;
  const correct = isCorrectFlagAnswer(answer.value, question.record);
  if (correct) score.value += 1;
  else {
    wrongAnswers.value.push({
      name: question.name,
      flag: question.flag,
      answer: answer.value.trim(),
    });
  }
  answer.value = "";
  flagError.value = false;
  if (currentIndex.value >= questions.value.length - 1) {
    finishQuiz();
    return;
  }
  currentIndex.value += 1;
  nextTick(() => answerInput.value?.focus());
}

async function finishQuiz() {
  started.value = false;
  finished.value = true;
  await submitScoreToLeaderboard();
}

async function submitScoreToLeaderboard() {
  leaderboardLoading.value = true;
  leaderboardError.value = "";
  scoreSubmitted.value = false;
  try {
    if (!window.db?.ready()) {
      leaderboardError.value =
        "supabase is not configured. set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.";
      return;
    }
    const submitResult = await window.db.submitFlagQuizScore(
      {
        name: playerName.value,
        score: score.value,
        mode: quizMode.value,
      },
      questions.value.length,
    );
    if (!submitResult.ok) {
      leaderboardError.value = submitResult.error || "could not submit score.";
      return;
    }
    scoreSubmitted.value = true;
    submittedScoreId.value = submitResult.row?.id || null;
    await loadLeaderboard(quizMode.value);
  } catch (error) {
    leaderboardError.value = "something went wrong with the leaderboard.";
    console.warn("flag quiz leaderboard error:", error);
  } finally {
    leaderboardLoading.value = false;
  }
}

async function selectLeaderboard(mode) {
  leaderboardMode.value = mode;
  await loadLeaderboard(mode);
}

async function loadLeaderboard(mode) {
  leaderboardLoading.value = true;
  leaderboardError.value = "";
  try {
    if (!window.db?.ready()) {
      leaderboardError.value =
        "supabase is not configured. set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.";
      return;
    }
    const leaderboardResult = await window.db.getFlagQuizLeaderboard(50, mode);
    if (!leaderboardResult.ok) {
      leaderboardError.value = "could not load leaderboard.";
      return;
    }
    leaderboard.value = leaderboardResult.rows;
    playerPosition.value = null;
    if (mode === quizMode.value && submittedScoreId.value) {
      const index = leaderboard.value.findIndex(
        (row) => row.id === submittedScoreId.value,
      );
      if (index !== -1) playerPosition.value = index + 1;
    }
  } catch (error) {
    leaderboardError.value = "something went wrong with the leaderboard.";
    console.warn("flag quiz leaderboard error:", error);
  } finally {
    leaderboardLoading.value = false;
  }
}

function resetQuiz() {
  started.value = false;
  finished.value = false;
  questions.value = [];
  currentIndex.value = 0;
  answer.value = "";
  score.value = 0;
  wrongAnswers.value = [];
  analysisOpen.value = false;
  leaderboard.value = [];
  playerPosition.value = null;
  submittedScoreId.value = null;
}
</script>

<style scoped>
main {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 80px 30px;
}

h1 {
  font-size: clamp(42px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 20px;
  letter-spacing: -4px;
}

.intro,
.result-message {
  color: #888;
  font-size: 18px;
  line-height: 1.6;
  max-width: 650px;
  margin-bottom: 28px;
}

.form {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form label {
  color: #aaa;
  font-size: 14px;
  margin-top: 8px;
}

input,
select,
button {
  font-family: inherit;
}

input,
select {
  width: 100%;
  padding: 13px 14px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
}

button {
  padding: 13px 16px;
  border: 1px solid #fff;
  background: #fff;
  color: #000;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost {
  background: transparent;
  color: #fff;
  margin-bottom: 18px;
}

.quiz {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: stretch;
}

.progress,
.score,
.score-final {
  color: #aaa;
}

.flag {
  width: min(100%, 520px);
  max-height: 320px;
  object-fit: contain;
  background: #111;
  border: 1px solid #222;
  align-self: center;
}

.flag-error,
.error {
  color: #f5a5a5;
}

.answer-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.answer-row input {
  flex: 1 1 220px;
}

.analysis,
.leaderboard-block {
  margin: 24px 0;
}

.miss {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #222;
}

.miss img {
  width: 96px;
  height: 64px;
  object-fit: contain;
  background: #111;
}

.leaderboard-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 18px;
}

.leaderboard-modes button {
  background: transparent;
  color: #aaa;
  border-color: #333;
}

.leaderboard-modes button.active {
  color: #fff;
  border-color: #fff;
}

.leaderboard {
  list-style: none;
  margin: 0;
  padding: 0;
}

.leaderboard li {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #1a1a1a;
}

.leaderboard li.highlight {
  color: #f5cf3d;
}

.restart {
  margin-top: 12px;
}

@media (max-width: 700px) {
  main {
    padding: 48px 18px;
  }

  .miss {
    grid-template-columns: 1fr;
  }

  .leaderboard li {
    grid-template-columns: 40px 1fr;
  }

  .leaderboard li span:last-child {
    grid-column: 2;
  }
}
</style>
