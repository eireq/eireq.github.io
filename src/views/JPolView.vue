<template>
  <main class="jpol-page">
    <header class="jpol-hero">
      <h1>{{ t("jpol.title") }}</h1>
      <p>{{ t("jpol.intro") }}</p>
    </header>

    <!-- Setup -->
    <section v-if="phase === 'setup'" class="setup-panel">
      <h2>{{ t("jpol.setupTitle") }}</h2>
      <div class="mode-picks">
        <button
          type="button"
          :class="{ active: quizMode === 'full' }"
          @click="quizMode = 'full'"
        >
          {{ t("jpol.modeFull") }}
        </button>
        <button
          type="button"
          :class="{ active: quizMode === 'express' }"
          @click="quizMode = 'express'"
        >
          {{ t("jpol.modeExpress") }}
        </button>
      </div>
      <button class="primary-button" type="button" @click="startQuiz">
        {{ t("jpol.start") }}
      </button>

      <section v-if="history.length" class="side-block">
        <h3>{{ t("jpol.historyTitle") }}</h3>
        <ul class="history-list">
          <li v-for="item in history" :key="item.code + item.at">
            <button type="button" class="text-button" @click="loadSaved(item)">
              {{ item.label }} · {{ formatWhen(item.at) }}
            </button>
          </li>
        </ul>
      </section>
    </section>

    <!-- Quiz -->
    <section v-else-if="phase === 'quiz'" class="quiz-panel">
      <div class="quiz-meta">
        <span
          >{{ t("jpol.question") }} {{ currentIndex + 1 }} /
          {{ questions.length }}</span
        >
        <span>{{ Math.round(progress) }}%</span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span :style="{ width: `${progress}%` }"></span>
      </div>

      <article class="question-card">
        <h2>{{ questionText }}</h2>
        <div class="answers" role="radiogroup" aria-label="Answer choices">
          <button
            v-for="answer in answerOptions"
            :key="answer.value"
            type="button"
            :class="{ selected: currentAnswer === answer.value }"
            role="radio"
            :aria-checked="currentAnswer === answer.value"
            @click="selectAnswer(answer.value)"
          >
            <span>{{ answer.label }}</span>
            <small>{{ answer.hint }}</small>
          </button>
        </div>
      </article>

      <div class="quiz-actions">
        <button
          class="text-button"
          type="button"
          :disabled="currentIndex === 0"
          @click="previousQuestion"
        >
          {{ t("jpol.back") }}
        </button>
        <button
          class="primary-button"
          type="button"
          :disabled="currentAnswer === null"
          @click="nextQuestion"
        >
          {{
            currentIndex === questions.length - 1
              ? t("jpol.seeResult")
              : t("jpol.next")
          }}
        </button>
      </div>
    </section>

    <!-- Results -->
    <section v-else class="results-panel">
      <div class="results-heading">
        <div>
          <p class="results-label">{{ t("jpol.resultLabel") }}</p>
          <h2>{{ ideologyName }}</h2>
          <p>{{ ideologyBlurb }}</p>
          <p class="result-soft">{{ t("jpol.resultNote") }}</p>
        </div>
        <div class="result-actions">
          <button class="primary-button" type="button" @click="downloadResult">
            {{ t("jpol.download") }}
          </button>
          <button class="text-button" type="button" @click="copyShareLink">
            {{ shareCopied ? t("jpol.shared") : t("jpol.share") }}
          </button>
          <button class="text-button" type="button" @click="restart">
            {{ t("jpol.again") }}
          </button>
        </div>
      </div>

      <p v-if="calibration" class="calibration">
        {{ t(`jpol.calibration${capitalize(calibration)}`) }}
      </p>

      <div class="compass-layout">
        <div class="compass-wrap">
          <svg
            class="compass"
            viewBox="0 0 520 520"
            role="img"
            aria-label="Political compass result"
          >
            <rect x="48" y="48" width="212" height="212" fill="#e74c3c" />
            <rect x="260" y="48" width="212" height="212" fill="#3498db" />
            <rect x="48" y="260" width="212" height="212" fill="#2ecc71" />
            <rect x="260" y="260" width="212" height="212" fill="#f1c40f" />
            <rect
              x="48"
              y="48"
              width="424"
              height="424"
              fill="none"
              stroke="#1a1c20"
              stroke-width="2"
            />
            <path
              d="M260 48V472M48 260H472"
              stroke="rgba(0,0,0,0.35)"
              stroke-width="2"
            />
            <text x="260" y="28" text-anchor="middle" class="axis-label">
              AUTHORITARIAN
            </text>
            <text x="260" y="508" text-anchor="middle" class="axis-label">
              LIBERTARIAN
            </text>
            <text
              x="18"
              y="265"
              text-anchor="middle"
              class="axis-label"
              transform="rotate(-90 18 265)"
            >
              ECONOMIC LEFT
            </text>
            <text
              x="502"
              y="265"
              text-anchor="middle"
              class="axis-label"
              transform="rotate(90 502 265)"
            >
              ECONOMIC RIGHT
            </text>
            <circle
              v-if="friendResult"
              :cx="friendCompassX"
              :cy="friendCompassY"
              r="11"
              fill="#fff"
              stroke="#111"
              stroke-width="3"
              opacity="0.85"
            />
            <circle
              :cx="compassX"
              :cy="compassY"
              r="13"
              fill="#111"
              stroke="#fff"
              stroke-width="4"
            />
          </svg>
          <p v-if="friendResult" class="legend">
            <span class="you-dot"></span> {{ t("jpol.you") }}
            <span class="friend-dot"></span> {{ t("jpol.friend") }}
          </p>
        </div>

        <div class="result-copy">
          <div class="axis-readout">
            <div>
              <span>{{ t("jpol.economic") }}</span>
              <strong>{{
                signedLabel(
                  result.economic,
                  t("jpol.left"),
                  t("jpol.right"),
                  t("jpol.balanced"),
                )
              }}</strong>
            </div>
            <div>
              <span>{{ t("jpol.social") }}</span>
              <strong>{{
                signedLabel(
                  result.authority,
                  t("jpol.libertarian"),
                  t("jpol.authoritarian"),
                  t("jpol.balanced"),
                )
              }}</strong>
            </div>
            <div>
              <span>{{ t("jpol.socialChange") }}</span>
              <strong>{{
                signedLabel(
                  result.progressive,
                  t("jpol.progressive"),
                  t("jpol.conservative"),
                  t("jpol.balanced"),
                )
              }}</strong>
            </div>
          </div>
          <div class="scale-block">
            <div class="scale-label">
              <span>{{ t("jpol.progressive") }}</span>
              <strong>{{ percentage(result.progressive) }}%</strong>
              <span>{{ t("jpol.conservative") }}</span>
            </div>
            <div class="scale">
              <span
                :style="{ left: `${percentage(result.progressive)}%` }"
              ></span>
            </div>
          </div>
          <p class="result-note">{{ t("jpol.compassNote") }}</p>

          <section class="side-block">
            <h3>{{ t("jpol.compareTitle") }}</h3>
            <div class="compare-row">
              <input
                v-model="compareInput"
                type="text"
                :placeholder="t('jpol.comparePlaceholder')"
              />
              <button
                class="primary-button"
                type="button"
                @click="applyCompare"
              >
                {{ t("jpol.compareApply") }}
              </button>
            </div>
            <button
              v-if="friendResult"
              class="text-button"
              type="button"
              @click="clearCompare"
            >
              {{ t("jpol.compareClear") }}
            </button>
            <p v-if="compareError" class="error">{{ compareError }}</p>
          </section>
        </div>
      </div>

      <section v-if="issues.length" class="issues-block">
        <h3>{{ t("jpol.issuesTitle") }}</h3>
        <div class="issue-chips">
          <span v-for="issue in issues" :key="issue.tag" class="issue-chip">
            {{ t(`jpol.issues.${issue.tag}`) }}
          </span>
        </div>
      </section>

      <h3 class="axes-heading">{{ t("jpol.axesTitle") }}</h3>
      <div class="values-grid">
        <article v-for="axis in axisResults" :key="axis.key" class="value-card">
          <div class="value-title">
            <span>{{ axis.left }}</span>
            <strong>{{ axis.name }}</strong>
            <span>{{ axis.right }}</span>
          </div>
          <div class="value-bar">
            <span
              :style="{ width: `${axis.leftPercent}%`, background: axis.color }"
            ></span>
          </div>
          <div class="value-numbers">
            <span>{{ axis.leftPercent }}%</span>
            <span>{{ axis.rightPercent }}%</span>
          </div>
        </article>
      </div>

      <section v-if="history.length" class="side-block history-bottom">
        <h3>{{ t("jpol.historyTitle") }}</h3>
        <ul class="history-list">
          <li v-for="item in history" :key="'h-' + item.code + item.at">
            <button type="button" class="text-button" @click="loadSaved(item)">
              {{ item.label }} · {{ formatWhen(item.at) }}
            </button>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AXIS_KEYS,
  AXIS_META,
  buildQuiz,
  calibrationNote,
  decodeResult,
  encodeResult,
  ideologyKey,
  issuePulls,
  loadHistory,
  percentage,
  pushHistory,
  scoreQuiz,
  signedLabel,
} from "@/data/jpol.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const phase = ref("setup");
const quizMode = ref("full");
const questions = ref([]);
const currentIndex = ref(0);
const answers = ref([]);
const result = ref(null);
const calibration = ref(null);
const issues = ref([]);
const resultCode = ref("");
const ideology = ref("centrist");
const history = ref(loadHistory());
const shareCopied = ref(false);
const compareInput = ref("");
const compareError = ref("");
const friendResult = ref(null);

const answerOptions = computed(() => [
  {
    value: 2,
    label: t("jpol.stronglyAgree"),
    hint: t("jpol.hintStrongAgree"),
  },
  { value: 1, label: t("jpol.agree"), hint: t("jpol.hintAgree") },
  { value: 0, label: t("jpol.neutral"), hint: t("jpol.hintNeutral") },
  { value: -1, label: t("jpol.disagree"), hint: t("jpol.hintDisagree") },
  {
    value: -2,
    label: t("jpol.stronglyDisagree"),
    hint: t("jpol.hintStrongDisagree"),
  },
]);

const currentQuestion = computed(
  () => questions.value[currentIndex.value] ?? null,
);
const currentAnswer = computed(() => answers.value[currentIndex.value] ?? null);
const progress = computed(() =>
  questions.value.length
    ? ((currentIndex.value + 1) / questions.value.length) * 100
    : 0,
);
const questionText = computed(() => {
  const id = currentQuestion.value?.id;
  return id ? t(`jpol.q.${id}`) : "";
});

const ideologyName = computed(() =>
  t(`jpol.ideology.${ideology.value}.name`),
);
const ideologyBlurb = computed(() =>
  t(`jpol.ideology.${ideology.value}.blurb`),
);

const COMPASS_CENTER = 260;
const COMPASS_RADIUS = 190;
const compassX = computed(() =>
  result.value
    ? COMPASS_CENTER + result.value.economic * COMPASS_RADIUS
    : COMPASS_CENTER,
);
const compassY = computed(() =>
  result.value
    ? COMPASS_CENTER - result.value.authority * COMPASS_RADIUS
    : COMPASS_CENTER,
);
const friendCompassX = computed(() =>
  friendResult.value
    ? COMPASS_CENTER + friendResult.value.economic * COMPASS_RADIUS
    : COMPASS_CENTER,
);
const friendCompassY = computed(() =>
  friendResult.value
    ? COMPASS_CENTER - friendResult.value.authority * COMPASS_RADIUS
    : COMPASS_CENTER,
);

const axisLabelMap = {
  equality: "Equality",
  coordination: "Coordination",
  power: "Power",
  autonomy: "Autonomy",
  identity: "Identity",
  progress: "Progress",
};

const axisResults = computed(() => {
  if (!result.value) return [];
  return AXIS_KEYS.map((key) => {
    const score = result.value.axes[key];
    const pascal = axisLabelMap[key];
    return {
      key,
      name: t(`jpol.axis${pascal}`),
      left: t(`jpol.axis${pascal}Left`),
      right: t(`jpol.axis${pascal}Right`),
      color: AXIS_META[key].color,
      leftPercent: percentage(-score),
      rightPercent: percentage(score),
    };
  });
});

onMounted(() => {
  const raw = route.query.r;
  if (typeof raw === "string" && raw) {
    const decoded = decodeResult(raw);
    if (decoded) {
      showDecodedResult(decoded, raw);
    }
  }
});

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function startQuiz() {
  questions.value = buildQuiz(quizMode.value);
  answers.value = Array(questions.value.length).fill(null);
  currentIndex.value = 0;
  result.value = null;
  friendResult.value = null;
  calibration.value = null;
  issues.value = [];
  phase.value = "quiz";
}

function selectAnswer(value) {
  answers.value[currentIndex.value] = value;
}

function nextQuestion() {
  if (currentAnswer.value === null) return;
  if (currentIndex.value === questions.value.length - 1) finishQuiz();
  else currentIndex.value += 1;
}

function previousQuestion() {
  if (currentIndex.value > 0) currentIndex.value -= 1;
}

function finishQuiz() {
  const scored = scoreQuiz(questions.value, answers.value);
  const code = encodeResult({ ...scored, mode: quizMode.value });
  const key = ideologyKey(scored);
  result.value = scored;
  resultCode.value = code;
  ideology.value = key;
  calibration.value = calibrationNote(answers.value);
  issues.value = issuePulls(questions.value, answers.value);
  phase.value = "results";

  history.value = pushHistory({
    code,
    label: t(`jpol.ideology.${key}.name`),
    at: Date.now(),
    mode: quizMode.value,
  });

  router.replace({ query: { r: code } });
}

function showDecodedResult(decoded, code) {
  result.value = decoded;
  resultCode.value = code;
  ideology.value = ideologyKey(decoded);
  calibration.value = null;
  issues.value = [];
  phase.value = "results";
}

function loadSaved(item) {
  const decoded = decodeResult(item.code);
  if (!decoded) return;
  showDecodedResult(decoded, item.code);
  router.replace({ query: { r: item.code } });
}

function restart() {
  phase.value = "setup";
  result.value = null;
  friendResult.value = null;
  compareInput.value = "";
  compareError.value = "";
  router.replace({ query: {} });
}

function extractCode(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("r") || trimmed;
  } catch {
    const match = trimmed.match(/[?&]r=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : trimmed;
  }
}

function applyCompare() {
  compareError.value = "";
  const code = extractCode(compareInput.value);
  const decoded = decodeResult(code);
  if (!decoded) {
    compareError.value = t("jpol.compareInvalid");
    friendResult.value = null;
    return;
  }
  friendResult.value = decoded;
}

function clearCompare() {
  friendResult.value = null;
  compareInput.value = "";
  compareError.value = "";
}

async function copyShareLink() {
  if (!resultCode.value) return;
  const url = `${window.location.origin}${window.location.pathname}?r=${resultCode.value}`;
  try {
    await navigator.clipboard.writeText(url);
    shareCopied.value = true;
    window.setTimeout(() => {
      shareCopied.value = false;
    }, 1600);
  } catch {
    window.prompt("copy link:", url);
  }
}

function formatWhen(timestamp) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return "";
  }
}

function downloadResult() {
  if (!result.value) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1600;
  const context = canvas.getContext("2d");
  context.fillStyle = "#202124";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "700 76px Arial";
  context.fillText("jPol", 80, 110);
  context.font = "28px Arial";
  context.fillStyle = "#a7adb5";
  context.fillText(t("jpol.resultLabel"), 84, 155);
  context.font = "700 42px Arial";
  context.fillStyle = "#ffffff";
  context.fillText(ideologyName.value, 84, 230);
  context.font = "24px Arial";
  context.fillStyle = "#a7adb5";
  wrapText(context, ideologyBlurb.value, 84, 275, 1240, 32);

  drawCanvasCompass(context, 80, 360, 620);

  context.font = "700 28px Arial";
  context.fillStyle = "#ffffff";
  context.fillText(t("jpol.axesTitle").toUpperCase(), 850, 420);
  axisResults.value.forEach((axis, index) => {
    const y = 470 + index * 130;
    context.font = "700 22px Arial";
    context.fillStyle = "#ffffff";
    context.fillText(axis.name.toUpperCase(), 850, y);
    context.font = "20px Arial";
    context.fillStyle = "#a7adb5";
    context.fillText(axis.left, 850, y + 32);
    context.fillText(axis.right, 1180, y + 32);
    context.fillStyle = "#101114";
    context.fillRect(850, y + 48, 470, 36);
    context.fillStyle = axis.color;
    context.fillRect(850, y + 48, 470 * (axis.leftPercent / 100), 36);
  });

  context.font = "20px Arial";
  context.fillStyle = "#727983";
  context.fillText(
    `${window.location.origin}/jpol?r=${resultCode.value}`,
    80,
    1520,
  );

  const link = document.createElement("a");
  link.download = "jpol-result.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const test = `${line}${word} `;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, cursor);
      line = `${word} `;
      cursor += lineHeight;
    } else line = test;
  }
  context.fillText(line, x, cursor);
}

function drawCanvasCompass(context, x, y, size) {
  const half = size / 2;
  context.fillStyle = "#e74c3c";
  context.fillRect(x, y, half, half);
  context.fillStyle = "#3498db";
  context.fillRect(x + half, y, half, half);
  context.fillStyle = "#2ecc71";
  context.fillRect(x, y + half, half, half);
  context.fillStyle = "#f1c40f";
  context.fillRect(x + half, y + half, half, half);
  context.strokeStyle = "rgba(0,0,0,0.35)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + half, y);
  context.lineTo(x + half, y + size);
  context.moveTo(x, y + half);
  context.lineTo(x + size, y + half);
  context.stroke();

  const dotX = x + half + result.value.economic * half * 0.9;
  const dotY = y + half - result.value.authority * half * 0.9;
  context.fillStyle = "#111";
  context.beginPath();
  context.arc(dotX, dotY, 16, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#fff";
  context.lineWidth = 4;
  context.stroke();

  if (friendResult.value) {
    const fx = x + half + friendResult.value.economic * half * 0.9;
    const fy = y + half - friendResult.value.authority * half * 0.9;
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(fx, fy, 12, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#111";
    context.lineWidth = 3;
    context.stroke();
  }

  context.fillStyle = "#a7adb5";
  context.font = "22px Arial";
  context.fillText("AUTHORITARIAN", x + half - 78, y - 18);
  context.fillText("LIBERTARIAN", x + half - 68, y + size + 36);
  context.fillText("LEFT", x - 58, y + half + 8);
  context.fillText("RIGHT", x + size + 12, y + half + 8);
}
</script>

<style scoped>
.jpol-page {
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 70px 30px 100px;
}
.jpol-hero {
  max-width: 720px;
  margin-bottom: 42px;
}
.jpol-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(64px, 10vw, 112px);
  line-height: 0.9;
  letter-spacing: -6px;
}
.jpol-hero p,
.result-soft,
.results-heading p {
  max-width: 650px;
  margin: 18px 0 0;
  color: #9ba1a9;
  font-size: 18px;
  line-height: 1.6;
}
.setup-panel,
.quiz-panel,
.results-panel {
  border-top: 1px solid #30343a;
  padding-top: 28px;
}
.setup-panel h2,
.side-block h3,
.issues-block h3,
.axes-heading {
  margin: 0 0 16px;
  color: #fff;
  font-size: 22px;
  letter-spacing: -0.5px;
}
.mode-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}
.mode-picks button {
  padding: 14px 18px;
  border: 1px solid #444;
  background: transparent;
  color: #ccc;
  font: inherit;
  cursor: pointer;
}
.mode-picks button.active {
  border-color: #04d361;
  color: #04d361;
}
.quiz-meta,
.scale-label,
.value-title,
.value-numbers {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.quiz-meta {
  padding: 8px 0 10px;
  color: #8f959e;
  font-size: 13px;
  text-transform: uppercase;
}
.progress-track,
.scale,
.value-bar {
  position: relative;
  overflow: hidden;
  height: 5px;
  background: #30343a;
}
.progress-track span,
.scale span,
.value-bar span {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
}
.progress-track span {
  background: #04d361;
  transition: width 0.25s ease;
}
.question-card {
  margin: 56px auto 40px;
  max-width: 820px;
}
.question-card h2 {
  margin: 0 0 36px;
  color: #fff;
  font-size: clamp(26px, 4vw, 44px);
  line-height: 1.15;
  letter-spacing: -1px;
}
.answers {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.answers button,
.primary-button,
.text-button,
.mode-picks button {
  font: inherit;
  cursor: pointer;
}
.answers button {
  min-height: 108px;
  padding: 16px 10px;
  border: 1px solid #fff;
  background: #fff;
  color: #101114;
  text-align: left;
}
.answers button:hover,
.answers button.selected {
  border-color: #04d361;
  background: #203329;
  color: #fff;
}
.answers span {
  display: block;
  font-size: 14px;
  line-height: 1.25;
}
.answers small {
  display: block;
  margin-top: 10px;
  color: #626873;
  font-size: 11px;
}
.answers button:hover small,
.answers button.selected small {
  color: #b7c8bc;
}
.quiz-actions,
.result-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.primary-button,
.text-button {
  padding: 12px 18px;
  border: 1px solid #04d361;
}
.primary-button {
  background: #04d361;
  color: #06100a;
  font-weight: 700;
}
.text-button {
  background: transparent;
  color: #04d361;
}
.text-button:disabled,
.primary-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.results-label {
  margin: 0 0 8px;
  color: #9ba1a9;
  font-size: 15px;
}
.results-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 30px;
}
.results-heading h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(34px, 6vw, 64px);
  letter-spacing: -3px;
  text-transform: capitalize;
}
.result-actions {
  flex-direction: column;
  align-items: stretch;
  min-width: 180px;
}
.calibration {
  margin: 28px 0 0;
  padding: 14px 16px;
  border: 1px solid #3a414b;
  background: #15181c;
  color: #c5ccd6;
  line-height: 1.5;
}
.compass-layout {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(260px, 0.9fr);
  gap: 50px;
  align-items: start;
  margin: 50px 0 40px;
}
.compass {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}
.compass .axis-label {
  fill: #a7adb5;
  font-size: 13px;
  letter-spacing: 1px;
}
.legend {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: center;
  color: #9ba1a9;
  font-size: 14px;
}
.you-dot,
.friend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.you-dot {
  background: #111;
  box-shadow: 0 0 0 2px #fff;
}
.friend-dot {
  background: #fff;
  box-shadow: 0 0 0 2px #111;
}
.axis-readout {
  display: grid;
  gap: 16px;
  margin-bottom: 28px;
}
.axis-readout div {
  display: flex;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid #30343a;
  color: #9ba1a9;
}
.axis-readout strong {
  color: #fff;
  text-transform: capitalize;
}
.scale-label {
  margin-bottom: 12px;
  color: #a7adb5;
  font-size: 13px;
  text-transform: uppercase;
}
.scale span {
  width: 12px;
  background: #fff;
  box-shadow: 0 0 0 3px #04d361;
  transform: translateX(-6px);
}
.result-note {
  margin-top: 28px;
  color: #727983;
  font-size: 14px;
  line-height: 1.6;
}
.compare-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.compare-row input {
  flex: 1 1 180px;
  padding: 12px 14px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
}
.error {
  color: #f5a5a5;
  font-size: 14px;
}
.side-block {
  margin-top: 28px;
}
.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.history-bottom {
  margin-top: 40px;
}
.issues-block {
  margin: 10px 0 36px;
}
.issue-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.issue-chip {
  padding: 8px 12px;
  border: 1px solid #333;
  color: #ddd;
  font-size: 13px;
  text-transform: lowercase;
}
.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.value-card {
  padding: 20px;
  border: 1px solid #30343a;
  background: #15171a;
}
.value-title {
  align-items: baseline;
  color: #8f959e;
  font-size: 12px;
  text-transform: uppercase;
}
.value-title strong {
  color: #fff;
  font-size: 15px;
}
.value-bar {
  margin: 20px 0 9px;
  height: 22px;
}
.value-numbers {
  color: #fff;
  font-size: 13px;
}
@media (max-width: 760px) {
  .jpol-page {
    padding: 48px 18px 70px;
  }
  .answers {
    grid-template-columns: 1fr;
  }
  .answers button {
    min-height: 64px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .answers span {
    font-size: 16px;
  }
  .answers small {
    display: inline;
    margin: 0;
    white-space: nowrap;
  }
  .results-heading,
  .compass-layout {
    display: block;
  }
  .result-actions {
    margin-top: 26px;
  }
  .compass-layout {
    margin-top: 35px;
  }
  .values-grid {
    grid-template-columns: 1fr;
  }
}
</style>
