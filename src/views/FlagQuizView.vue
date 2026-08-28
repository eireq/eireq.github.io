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
          @keyup.enter="startQuiz"
        />

        <label for="mode">{{ t("flagQuiz.mode") }}</label>

        <select id="mode" v-model="quizMode">
          <option
            v-for="mode in quizModes"
            :key="mode.value"
            :value="mode.value"
          >
            {{ t(mode.label) }}
          </option>
        </select>

        <label for="amount">{{ t("flagQuiz.amount") }}</label>

        <select id="amount" v-model.number="flagCount">
          <option
            v-for="amount in [5, 10, 20, 30, 50, 100]"
            :key="amount"
            :value="amount"
          >
            {{ amount }} {{ t("flagQuiz.flags") }}
          </option>
        </select>

        <button :disabled="starting" @click="startQuiz">
          {{ starting ? t("flagQuiz.loading") : t("flagQuiz.start") }}
        </button>
      </div>
    </div>

    <div v-else-if="started && !finished" class="quiz">
      <div class="progress">
        {{ currentIndex + 1 }} / {{ questions.length }}
      </div>

      <div class="flag-container">
        <img
          v-if="!flagError"
          :src="currentQuestion.flag"
          :alt="t('flagQuiz.flagAlt') + ' ' + currentQuestion.name"
          class="flag"
          @error="handleFlagError"
        />
        <p v-else class="flag-error">
          {{ t("flagQuiz.unavailable") }} {{ currentQuestion.name }}
        </p>
      </div>

      <div class="answer">
        <input
          ref="answerInput"
          v-model="answer"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          :placeholder="t('flagQuiz.countryPlaceholder')"
          @keyup.enter="submitAnswer"
        />

        <button @click="submitAnswer">{{ t("flagQuiz.enter") }}</button>
      </div>

      <p class="score">{{ t("flagQuiz.score") }}: {{ score }}</p>
    </div>

    <div v-else class="results">
      <h1>{{ t("flagQuiz.complete") }}</h1>

      <p class="final-score">{{ score }} / {{ questions.length }}</p>

      <p class="percentage">{{ percentage }}%</p>

      <p class="result-text">
        {{ resultMessage }}
      </p>

      <button
        class="analysis-toggle"
        type="button"
        :aria-expanded="analysisOpen"
        @click="analysisOpen = !analysisOpen"
      >
        {{ analysisOpen ? t("flagQuiz.hideAnalysis") : t("flagQuiz.analysis") }}
      </button>

      <section v-if="analysisOpen" class="analysis" :aria-label="t('flagQuiz.analysis')">
        <p v-if="!wrongAnswers.length" class="analysis-perfect">
          {{ t("flagQuiz.allCorrect") }}
        </p>
        <div v-else class="analysis-list">
          <article v-for="question in wrongAnswers" :key="question.name" class="analysis-row">
            <img :src="question.flag" :alt="t('flagQuiz.flagAlt') + ' ' + question.name" />
            <div>
              <h3>{{ question.name }}</h3>
              <p>
                {{ t("flagQuiz.yourAnswer") }}:
                <strong>{{ question.answer || t("flagQuiz.noAnswer") }}</strong>
              </p>
              <p>
                {{ t("flagQuiz.correctAnswer") }}:
                <strong>{{ question.name }}</strong>
              </p>
            </div>
          </article>
        </div>
      </section>

      <div class="leaderboard">
        <h2>{{ t("flagQuiz.leaderboard") }}</h2>

        <div class="leaderboard-modes" role="tablist" :aria-label="t('flagQuiz.leaderboard')">
          <button
            v-for="mode in quizModes"
            :key="mode.value"
            type="button"
            role="tab"
            :aria-selected="leaderboardMode === mode.value"
            :class="{ active: leaderboardMode === mode.value }"
            @click="selectLeaderboard(mode.value)"
          >
            {{ t(mode.label) }}
          </button>
        </div>

        <p v-if="leaderboardLoading" class="leaderboard-placeholder">
          {{ t("flagQuiz.loadingLeaderboard") }}
        </p>

        <p v-else-if="leaderboardError" class="leaderboard-placeholder">
          {{ leaderboardError }}
        </p>

        <div v-else-if="leaderboard.length" class="leaderboard-list">
          <div
            v-for="(entry, index) in leaderboard"
            :key="entry.id"
            class="leaderboard-row"
            :class="{ current: entry.id === submittedScoreId }"
          >
            <span class="rank"> #{{ index + 1 }} </span>

            <span class="leaderboard-name">
              {{ entry.name }}
            </span>

            <span class="leaderboard-score">
              {{ entry.score }}/{{ entry.total }}
            </span>
          </div>
        </div>

        <p v-else class="leaderboard-placeholder">
          {{ t("flagQuiz.noScores") }}
        </p>

        <p v-if="playerPosition" class="your-position">
          {{ t("flagQuiz.position") }} <strong>#{{ playerPosition }}</strong>
        </p>
      </div>

      <button class="restart" @click="resetQuiz">
        {{ t("flagQuiz.playAgain") }}
      </button>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import {
  historicalEntries,
  territorialEntries,
} from "@/data/flagQuizExtraEntries.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const playerName = ref("a guy");
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

const currentQuestion = computed(() => {
  return questions.value[currentIndex.value];
});

const quizModes = [
  { value: "countries", label: "flagQuiz.modes.normal" },
  { value: "territorial", label: "flagQuiz.modes.territorial" },
  { value: "historical", label: "flagQuiz.modes.historical" },
  { value: "all", label: "flagQuiz.modes.all" },
];

const percentage = computed(() => {
  if (!questions.value.length) return 0;

  return Math.round((score.value / questions.value.length) * 100);
});

const resultMessage = computed(() => {
  if (percentage.value === 100) {
    return t("flagQuiz.perfect");
  }

  if (percentage.value >= 80) {
    return t("flagQuiz.good");
  }

  if (percentage.value >= 50) {
    return t("flagQuiz.okay");
  }

  return t("flagQuiz.defeated");
});

const countries = [
  { name: "Afghanistan", code: "af" },
  { name: "Albania", code: "al" },
  { name: "Algeria", code: "dz" },
  { name: "Andorra", code: "ad" },
  { name: "Angola", code: "ao" },
  { name: "Antigua and Barbuda", code: "ag" },
  { name: "Argentina", code: "ar" },
  { name: "Armenia", code: "am" },
  { name: "Australia", code: "au" },
  { name: "Austria", code: "at" },
  { name: "Azerbaijan", code: "az" },
  { name: "Bahamas", code: "bs" },
  { name: "Bahrain", code: "bh" },
  { name: "Bangladesh", code: "bd" },
  { name: "Barbados", code: "bb" },
  { name: "Belarus", code: "by" },
  { name: "Belgium", code: "be" },
  { name: "Belize", code: "bz" },
  { name: "Benin", code: "bj" },
  { name: "Bhutan", code: "bt" },
  { name: "Bolivia", code: "bo" },
  { name: "Bosnia and Herzegovina", code: "ba" },
  { name: "Botswana", code: "bw" },
  { name: "Brazil", code: "br" },
  { name: "Brunei", code: "bn" },
  { name: "Bulgaria", code: "bg" },
  { name: "Burkina Faso", code: "bf" },
  { name: "Burundi", code: "bi" },
  { name: "Cambodia", code: "kh" },
  { name: "Cameroon", code: "cm" },
  { name: "Canada", code: "ca" },
  { name: "Cape Verde", code: "cv" },
  { name: "Central African Republic", code: "cf" },
  { name: "Chad", code: "td" },
  { name: "Chile", code: "cl" },
  { name: "China", code: "cn" },
  { name: "Colombia", code: "co" },
  { name: "Comoros", code: "km" },
  { name: "Costa Rica", code: "cr" },
  { name: "Croatia", code: "hr" },
  { name: "Cuba", code: "cu" },
  { name: "Cyprus", code: "cy" },
  { name: "Czechia", code: "cz" },
  { name: "Denmark", code: "dk" },
  { name: "Djibouti", code: "dj" },
  { name: "Dominica", code: "dm" },
  { name: "Dominican Republic", code: "do" },
  { name: "Ecuador", code: "ec" },
  { name: "Egypt", code: "eg" },
  { name: "El Salvador", code: "sv" },
  { name: "Equatorial Guinea", code: "gq" },
  { name: "Eritrea", code: "er" },
  { name: "Estonia", code: "ee" },
  { name: "Eswatini", code: "sz" },
  { name: "Ethiopia", code: "et" },
  { name: "Fiji", code: "fj" },
  { name: "Finland", code: "fi" },
  { name: "France", code: "fr" },
  { name: "Gabon", code: "ga" },
  { name: "Gambia", code: "gm" },
  { name: "Georgia", code: "ge" },
  { name: "Germany", code: "de" },
  { name: "Ghana", code: "gh" },
  { name: "Greece", code: "gr" },
  { name: "Grenada", code: "gd" },
  { name: "Guatemala", code: "gt" },
  { name: "Guinea", code: "gn" },
  { name: "Guyana", code: "gy" },
  { name: "Haiti", code: "ht" },
  { name: "Honduras", code: "hn" },
  { name: "Hungary", code: "hu" },
  { name: "Iceland", code: "is" },
  { name: "India", code: "in" },
  { name: "Indonesia", code: "id" },
  { name: "Iran", code: "ir" },
  { name: "Iraq", code: "iq" },
  { name: "Ireland", code: "ie" },
  { name: "Israel", code: "il" },
  { name: "Italy", code: "it" },
  { name: "Jamaica", code: "jm" },
  { name: "Japan", code: "jp" },
  { name: "Jordan", code: "jo" },
  { name: "Kazakhstan", code: "kz" },
  { name: "Kenya", code: "ke" },
  { name: "Kiribati", code: "ki" },
  { name: "Kuwait", code: "kw" },
  { name: "Kyrgyzstan", code: "kg" },
  { name: "Laos", code: "la" },
  { name: "Latvia", code: "lv" },
  { name: "Lebanon", code: "lb" },
  { name: "Lesotho", code: "ls" },
  { name: "Liberia", code: "lr" },
  { name: "Libya", code: "ly" },
  { name: "Liechtenstein", code: "li" },
  { name: "Lithuania", code: "lt" },
  { name: "Luxembourg", code: "lu" },
  { name: "Madagascar", code: "mg" },
  { name: "Malawi", code: "mw" },
  { name: "Malaysia", code: "my" },
  { name: "Maldives", code: "mv" },
  { name: "Mali", code: "ml" },
  { name: "Malta", code: "mt" },
  { name: "Marshall Islands", code: "mh" },
  { name: "Mauritania", code: "mr" },
  { name: "Mauritius", code: "mu" },
  { name: "Mexico", code: "mx" },
  { name: "Micronesia", code: "fm" },
  { name: "Moldova", code: "md" },
  { name: "Monaco", code: "mc" },
  { name: "Mongolia", code: "mn" },
  { name: "Montenegro", code: "me" },
  { name: "Morocco", code: "ma" },
  { name: "Mozambique", code: "mz" },
  { name: "Myanmar", code: "mm" },
  { name: "Namibia", code: "na" },
  { name: "Nauru", code: "nr" },
  { name: "Nepal", code: "np" },
  { name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" },
  { name: "Nicaragua", code: "ni" },
  { name: "Niger", code: "ne" },
  { name: "Nigeria", code: "ng" },
  { name: "North Korea", code: "kp" },
  { name: "North Macedonia", code: "mk" },
  { name: "Norway", code: "no" },
  { name: "Oman", code: "om" },
  { name: "Pakistan", code: "pk" },
  { name: "Palau", code: "pw" },
  { name: "Palestine", code: "ps" },
  { name: "Panama", code: "pa" },
  { name: "Papua New Guinea", code: "pg" },
  { name: "Paraguay", code: "py" },
  { name: "Peru", code: "pe" },
  { name: "Philippines", code: "ph" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Qatar", code: "qa" },
  { name: "Romania", code: "ro" },
  { name: "Russia", code: "ru" },
  { name: "Rwanda", code: "rw" },
  { name: "Saint Kitts and Nevis", code: "kn" },
  { name: "Saint Lucia", code: "lc" },
  { name: "Saint Vincent and the Grenadines", code: "vc" },
  { name: "Samoa", code: "ws" },
  { name: "San Marino", code: "sm" },
  { name: "Sao Tome and Principe", code: "st" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Senegal", code: "sn" },
  { name: "Serbia", code: "rs" },
  { name: "Seychelles", code: "sc" },
  { name: "Sierra Leone", code: "sl" },
  { name: "Singapore", code: "sg" },
  { name: "Slovakia", code: "sk" },
  { name: "Slovenia", code: "si" },
  { name: "Solomon Islands", code: "sb" },
  { name: "Somalia", code: "so" },
  { name: "South Africa", code: "za" },
  { name: "South Korea", code: "kr" },
  { name: "South Sudan", code: "ss" },
  { name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Sudan", code: "sd" },
  { name: "Suriname", code: "sr" },
  { name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },
  { name: "Syria", code: "sy" },
  { name: "Taiwan", code: "tw" },
  { name: "Tajikistan", code: "tj" },
  { name: "Tanzania", code: "tz" },
  { name: "Thailand", code: "th" },
  { name: "Timor-Leste", code: "tl" },
  { name: "Togo", code: "tg" },
  { name: "Tonga", code: "to" },
  { name: "Trinidad and Tobago", code: "tt" },
  { name: "Tunisia", code: "tn" },
  { name: "Turkey", code: "tr" },
  { name: "Turkmenistan", code: "tm" },
  { name: "Tuvalu", code: "tv" },
  { name: "Uganda", code: "ug" },
  { name: "Ukraine", code: "ua" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Uruguay", code: "uy" },
  { name: "Uzbekistan", code: "uz" },
  { name: "Vanuatu", code: "vu" },
  { name: "Vatican City", code: "va" },
  { name: "Venezuela", code: "ve" },
  { name: "Vietnam", code: "vn" },
  { name: "Yemen", code: "ye" },
  { name: "Zambia", code: "zm" },
  { name: "Zimbabwe", code: "zw" },
];

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

const countryAliases = {
  ae: ["uae"],
  au: ["oz"],
  bn: ["brunei darussalam"],
  cf: ["car"],
  ch: ["swiss"],
  ci: ["ivory coast"],
  cv: ["cabo verde"],
  cz: ["czech republic"],
  do: ["dr"],
  gb: ["uk", "great britain"],
  mk: ["macedonia"],
  mm: ["burma"],
  sz: ["swaziland"],
  tl: ["east timor"],
  us: ["usa", "america"],
};

const nameAliases = {
  "Cabo Verde": ["Cape Verde"],
  "Cape Verde": ["Cabo Verde"],
  Curacao: ["Curaçao"],
  "Aland Islands": ["Åland Islands"],
};

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrectAnswer(answer, country) {
  const acceptedAnswers = [
    country.name,
    ...(countryAliases[country.code] || []),
    ...(nameAliases[country.name] || []),
  ];

  return acceptedAnswers.some(
    (acceptedAnswer) => normalize(answer) === normalize(acceptedAnswer),
  );
}

async function startQuiz() {
  if (starting.value) return;

  if (!playerName.value.trim()) {
    playerName.value = "a guy";
  }

  starting.value = true;

  try {
    const selectedPool = getQuizPool();
    const selected = shuffle(selectedPool).slice(0, flagCount.value);

    questions.value = await Promise.all(
      selected.map(async (country) => {
        const name = typeof country === "string" ? country : country.name;
        const code = typeof country === "string" ? null : country.code;

        return {
          name,
          code,
          flag: code
            ? `https://flagcdn.com/w640/${code}.png`
            : await findWikimediaFlag(name),
        };
      }),
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

    nextTick(() => {
      answerInput.value?.focus();
    });
  } finally {
    starting.value = false;
  }
}

function getQuizPool() {
  if (quizMode.value === "territorial") return territorialEntries;
  if (quizMode.value === "historical") return historicalEntries;
  if (quizMode.value === "all") {
    return [...countries, ...territorialEntries, ...historicalEntries];
  }
  return countries;
}

function handleFlagError(event) {
  flagError.value = true;
  event.target.alt = `flag unavailable for ${currentQuestion.value.name}`;
}

async function findWikimediaFlag(name) {
  const fallback = `https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20${encodeURIComponent(name)}.svg`;
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `intitle:Flag of ${name}`,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "640",
    format: "json",
    origin: "*",
  });

  try {
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
    );
    if (!response.ok) return fallback;

    const data = await response.json();
    const page = Object.values(data.query?.pages || {})[0];
    return (
      page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || fallback
    );
  } catch {
    return fallback;
  }
}

function submitAnswer() {
  const correct = isCorrectAnswer(answer.value, currentQuestion.value);

  if (correct) {
    score.value++;
  } else {
    wrongAnswers.value.push({
      name: currentQuestion.value.name,
      flag: currentQuestion.value.flag,
      answer: answer.value.trim(),
    });
  }

  answer.value = "";

  if (currentIndex.value >= questions.value.length - 1) {
    finishQuiz();
    return;
  }

  currentIndex.value++;
  flagError.value = false;

  nextTick(() => {
    answerInput.value?.focus();
  });
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
      leaderboardError.value = "could not submit score.";
      console.warn("flag quiz score submission failed:", submitResult.error);
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
      console.warn("flag quiz leaderboard failed:", leaderboardResult.error);
      return;
    }

    leaderboard.value = leaderboardResult.rows;
    playerPosition.value = null;

    if (mode === quizMode.value && submittedScoreId.value) {
      const index = leaderboard.value.findIndex(
        (row) => row.id === submittedScoreId.value,
      );

      if (index !== -1) {
        playerPosition.value = index + 1;
      }
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
  font-size: clamp(50px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 20px;
  letter-spacing: -4px;
}

.intro {
  color: #888;
  font-size: 18px;
  line-height: 1.6;
  max-width: 650px;
  margin-bottom: 50px;
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
  margin-top: 12px;
}

input,
select {
  width: 100%;
  padding: 13px 14px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
  font-family: Arial, sans-serif;
  font-size: 16px;
  outline: none;
}

input:focus,
select:focus {
  border-color: #fff;
}

button {
  margin-top: 20px;
  padding: 13px 20px;
  background: #000;
  color: #fff;
  border: 1px solid #fff;
  font-family: Arial, sans-serif;
  font-size: 15px;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background: #fff;
  color: #000;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.quiz {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.progress {
  color: #777;
  font-size: 14px;
  margin-bottom: 30px;
}

.flag-container {
  width: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 35px;
}

.flag {
  display: block;
  max-width: 100%;
  max-height: 350px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.flag-error {
  max-width: 420px;
  color: #888;
  font-size: 14px;
  line-height: 1.6;
}

.answer {
  display: flex;
  gap: 10px;
  max-width: 650px;
  margin: 0 auto;
}

.answer input {
  flex: 1;
}

.answer button {
  margin-top: 0;
  min-width: 90px;
}

.score {
  color: #777;
  font-size: 14px;
  margin-top: 25px;
}

.results {
  max-width: 700px;
  margin: 0 auto;
}

.final-score {
  font-size: 60px;
  font-weight: bold;
  margin: 50px 0 5px;
}

.percentage {
  color: #888;
  font-size: 24px;
  margin: 0 0 30px;
}

.result-text {
  color: #aaa;
  font-size: 18px;
  line-height: 1.6;
}

.analysis-toggle {
  margin-top: 24px;
  border-color: #04d361;
  color: #04d361;
}

.analysis-toggle:hover {
  background: #04d361;
  color: #000;
}

.analysis {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #29292e;
  background: #151517;
}

.analysis-perfect {
  margin: 0;
  color: #04d361;
}

.analysis-list {
  display: grid;
  gap: 14px;
}

.analysis-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #29292e;
}

.analysis-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.analysis-row img {
  width: 110px;
  max-height: 70px;
  object-fit: contain;
}

.analysis-row h3 {
  margin: 0 0 6px;
  font-size: 17px;
}

.analysis-row p {
  margin: 3px 0 0;
  color: #888;
  font-size: 14px;
}

.analysis-row strong {
  color: #ddd;
  font-weight: normal;
}

.leaderboard {
  margin-top: 60px;
  border-top: 1px solid #222;
  padding-top: 30px;
}

.leaderboard h2 {
  font-size: 26px;
  margin: 0 0 15px;
}

.leaderboard-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.leaderboard-modes button {
  margin: 0;
  padding: 8px 12px;
  border-color: #333;
  color: #999;
  font-size: 13px;
}

.leaderboard-modes button:hover,
.leaderboard-modes button.active {
  border-color: #04d361;
  background: #04d361;
  color: #000;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid #222;
}

.rank,
.leaderboard-score {
  color: #888;
}

.leaderboard-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.your-position {
  margin-top: 20px;
}

.leaderboard-placeholder {
  color: #777;
}

.restart {
  margin-top: 30px;
}

@media (max-width: 800px) {
  main {
    padding: 60px 25px;
  }

  .flag-container {
    min-height: 220px;
  }

  .flag {
    max-height: 250px;
  }

  .answer {
    flex-direction: column;
  }

  .answer button {
    width: 100%;
  }

  .analysis-row {
    grid-template-columns: 1fr;
  }

  .analysis-row img {
    width: 100%;
    max-height: 130px;
  }
}
</style>
