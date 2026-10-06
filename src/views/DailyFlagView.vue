<template>
  <main class="daily-flag">
    <h1>{{ t("dailyFlag.title") }}</h1>
    <p class="intro">{{ t("dailyFlag.intro") }}</p>

    <p v-if="!ready" class="status">{{ t("dailyFlag.loading") }}</p>

    <template v-else-if="dailyFlag">
      <p class="meta">
        {{ dateKey }} · {{ t("dailyFlag.streak") }}:
        <strong>{{ progress.streak }}</strong>
      </p>

      <img
        class="flag"
        :src="flagSrc"
        :alt="t('dailyFlag.flagAlt')"
      />

      <div v-if="!done" class="guess">
        <label for="daily-guess">{{ t("dailyFlag.guess") }}</label>
        <div class="guess-row">
          <input
            id="daily-guess"
            v-model="guess"
            type="text"
            maxlength="80"
            :placeholder="t('dailyFlag.placeholder')"
            autocomplete="off"
            @keyup.enter="submitGuess"
          />
          <button type="button" @click="submitGuess">
            {{ t("dailyFlag.submit") }}
          </button>
        </div>
        <p class="attempts">
          {{ progress.guesses.length }} / {{ maxGuesses }}
          {{ t("dailyFlag.attempts") }}
        </p>
      </div>

      <div v-else class="outcome">
        <p class="result">
          {{
            progress.solved ? t("dailyFlag.solved") : t("dailyFlag.failed")
          }}
        </p>
        <p class="answer">
          {{ t("dailyFlag.answer") }}:
          <RouterLink :to="flagRoute(dailyFlag)">{{
            shortName(dailyFlag)
          }}</RouterLink>
        </p>
        <button type="button" class="ghost" @click="shareResult">
          {{ shareLabel }}
        </button>
      </div>

      <ol v-if="progress.guesses.length" class="guess-list">
        <li
          v-for="(item, index) in progress.guesses"
          :key="`${item}-${index}`"
          :class="{
            correct: isCorrectFlagAnswer(item, dailyFlag),
          }"
        >
          {{ item }}
        </li>
      </ol>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import {
  dailyShareText,
  loadDailyProgress,
  pickDailyFlag,
  recordDailyGuess,
} from "@/data/dailyFlag.js";
import {
  isCorrectFlagAnswer,
  loadFlags,
  shortName,
  utcDateKey,
} from "@/data/flags.js";
import { cachedFlagImageUrl } from "@/data/flagImageCache.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const maxGuesses = 6;
const dateKey = utcDateKey();
const ready = ref(false);
const flags = ref([]);
const dailyFlag = ref(null);
const flagSrc = ref("");
const progress = ref(loadDailyProgress(dateKey));
const guess = ref("");
const shareLabel = ref("");

const done = computed(
  () => Boolean(progress.value.solved || progress.value.failed),
);

onMounted(async () => {
  flags.value = await loadFlags();
  dailyFlag.value = pickDailyFlag(flags.value, dateKey);
  if (dailyFlag.value) {
    flagSrc.value = await cachedFlagImageUrl(dailyFlag.value.svgUrl);
  }
  progress.value = loadDailyProgress(dateKey);
  ready.value = true;
  shareLabel.value = t("dailyFlag.share");
});

function submitGuess() {
  if (done.value || !dailyFlag.value) return;
  const value = guess.value.trim();
  if (!value) return;
  const correct = isCorrectFlagAnswer(value, dailyFlag.value);
  progress.value = recordDailyGuess({
    dateKey,
    guess: value,
    correct,
    answerName: shortName(dailyFlag.value),
    maxGuesses,
  });
  guess.value = "";
}

async function shareResult() {
  const text = dailyShareText({
    dateKey,
    guesses: progress.value.guesses,
    solved: progress.value.solved,
    flag: dailyFlag.value,
  });
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch {
    // fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    shareLabel.value = t("dailyFlag.copied");
  } catch {
    shareLabel.value = text;
  }
}

function flagRoute(flag) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.value.indexOf(flag)) },
  };
}
</script>

<style scoped>
.daily-flag {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 80px 30px;
}

h1 {
  font-size: clamp(42px, 8vw, 72px);
  line-height: 0.95;
  margin: 0 0 16px;
  letter-spacing: -3px;
}

.intro,
.status,
.meta,
.attempts,
.answer {
  color: #888;
  line-height: 1.6;
  margin: 0 0 12px;
}

.flag {
  display: block;
  width: min(100%, 520px);
  max-height: 300px;
  object-fit: contain;
  margin: 16px auto 28px;
  background: #111;
  border: 1px solid #222;
}

.guess,
.outcome {
  width: 100%;
}

.guess label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 14px;
}

.guess-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

input,
button {
  font-family: inherit;
}

input {
  flex: 1 1 220px;
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

.ghost {
  background: transparent;
  color: #fff;
  margin-top: 12px;
}

.result {
  font-size: 22px;
  margin: 0 0 8px;
}

.guess-list {
  list-style: none;
  margin: 28px 0 0;
  padding: 0;
  width: 100%;
}

.guess-list li {
  padding: 10px 0;
  border-bottom: 1px solid #1a1a1a;
  color: #aaa;
}

.guess-list li.correct {
  color: #9be29b;
}

@media (max-width: 700px) {
  .daily-flag {
    padding: 48px 18px;
  }
}
</style>
