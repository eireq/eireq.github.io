<template>
  <main class="jpol-page">
    <header class="jpol-hero">
      <p class="eyebrow">72 questions · a values map</p>
      <h1>jPol</h1>
      <p>
        eire's compact political values quiz. there are no correct answers, and
        your result is a map of tendencies rather than a box to live in.
      </p>
    </header>

    <section v-if="!finished" class="quiz-panel">
      <div class="quiz-meta">
        <span>question {{ currentIndex + 1 }} / {{ questions.length }}</span>
        <span>{{ Math.round(progress) }}%</span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span :style="{ width: `${progress}%` }"></span>
      </div>

      <article class="question-card">
        <h2>{{ currentQuestion.text }}</h2>
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
          back
        </button>
        <button
          class="primary-button"
          type="button"
          :disabled="currentAnswer === null"
          @click="nextQuestion"
        >
          {{
            currentIndex === questions.length - 1
              ? "see my result"
              : "next question"
          }}
        </button>
      </div>
    </section>

    <section v-else class="results-panel">
      <div class="results-heading">
        <div>
          <p class="eyebrow">your jPol result</p>
          <h2>{{ ideology }}</h2>
          <p>
            These scores describe the balance of answers you gave, not a
            permanent political identity.
          </p>
        </div>
        <div class="result-actions">
          <button class="primary-button" type="button" @click="downloadResult">
            download PNG
          </button>
          <button class="text-button" type="button" @click="restart">
            take it again
          </button>
        </div>
      </div>

      <div class="compass-layout">
        <div class="compass-wrap">
          <svg
            class="compass"
            viewBox="0 0 520 520"
            role="img"
            aria-label="Political compass result"
          >
            <rect
              x="48"
              y="48"
              width="424"
              height="424"
              fill="#101114"
              stroke="#343840"
            />
            <path d="M260 48V472M48 260H472" stroke="#343840" />
            <path d="M48 48L472 472M472 48L48 472" stroke="#24272d" />
            <text x="260" y="29" text-anchor="middle">LIBERTY</text>
            <text x="260" y="507" text-anchor="middle">AUTHORITY</text>
            <text
              x="20"
              y="265"
              text-anchor="middle"
              transform="rotate(-90 20 265)"
            >
              ECONOMIC LEFT
            </text>
            <text
              x="500"
              y="265"
              text-anchor="middle"
              transform="rotate(90 500 265)"
            >
              ECONOMIC RIGHT
            </text>
            <circle
              :cx="compassX"
              :cy="compassY"
              r="12"
              fill="#04d361"
              stroke="#fff"
              stroke-width="4"
            />
            <line
              x1="260"
              y1="260"
              :x2="compassX"
              :y2="compassY"
              stroke="#04d361"
              stroke-width="2"
              stroke-dasharray="5 5"
            />
          </svg>
        </div>
        <div class="result-copy">
          <div class="axis-readout">
            <div>
              <span>economic</span
              ><strong>{{
                signedLabel(economicScore, "left", "right")
              }}</strong>
            </div>
            <div>
              <span>authority</span
              ><strong>{{
                signedLabel(authorityScore, "liberty", "authority")
              }}</strong>
            </div>
            <div>
              <span>social change</span
              ><strong>{{
                signedLabel(progressiveScore, "progressive", "conservative")
              }}</strong>
            </div>
          </div>
          <div class="scale-block">
            <div class="scale-label">
              <span>progressive</span
              ><strong>{{ percentage(progressiveScore) }}%</strong
              ><span>conservative</span>
            </div>
            <div class="scale">
              <span
                :style="{ left: `${percentage(progressiveScore)}%` }"
              ></span>
            </div>
          </div>
          <p class="result-note">
            Your compass coordinates are based on economic and authority
            answers; the six value bars below preserve the detail behind that
            headline.
          </p>
        </div>
      </div>

      <div class="values-grid">
        <article v-for="axis in axisResults" :key="axis.key" class="value-card">
          <div class="value-title">
            <span>{{ axis.left }}</span
            ><strong>{{ axis.name }}</strong
            ><span>{{ axis.right }}</span>
          </div>
          <div class="value-bar">
            <span
              :style="{ width: `${axis.leftPercent}%`, background: axis.color }"
            ></span>
          </div>
          <div class="value-numbers">
            <span>{{ axis.leftPercent }}%</span
            ><span>{{ axis.rightPercent }}%</span>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";

const answerOptions = [
  { value: 2, label: "Strongly agree", hint: "very much me" },
  { value: 1, label: "Agree", hint: "mostly me" },
  { value: 0, label: "Neutral / unsure", hint: "somewhere in between" },
  { value: -1, label: "Disagree", hint: "mostly not me" },
  { value: -2, label: "Strongly disagree", hint: "not me at all" },
];

const axisDefinitions = {
  equality: {
    name: "Equality",
    left: "equality",
    right: "property",
    color: "#ff1460",
  },
  coordination: {
    name: "Coordination",
    left: "coordination",
    right: "commerce",
    color: "#bd00d4",
  },
  power: {
    name: "Power",
    left: "dominance",
    right: "anarchy",
    color: "#12c9a7",
  },
  autonomy: {
    name: "Autonomy",
    left: "permission",
    right: "restriction",
    color: "#f4e900",
  },
  identity: {
    name: "Identity",
    left: "inclusivity",
    right: "supremacy",
    color: "#ff179f",
  },
  progress: {
    name: "Progress",
    left: "heritage",
    right: "novelty",
    color: "#8bf21a",
  },
};

const questionSets = {
  equality: [
    "A society is fair only when wealth differences are kept fairly small.",
    "Essential services should be available to everyone regardless of income.",
    "Inheritance should be taxed heavily when it creates huge advantages.",
    "Workers deserve a meaningful say in how the companies they work for are run.",
    "The public should share in the gains from natural resources.",
    "Large fortunes are usually a political problem, not just a personal achievement.",
    "A dignified life should be guaranteed even for people who cannot work.",
    "Tax systems should ask much more from people with the most money.",
    "Private ownership is less important than making sure everyone has a secure life.",
    "Economic policy should prioritize reducing inequality over maximizing growth.",
    {
      text: "Large differences in wealth are acceptable if everyone has a chance to succeed.",
      direction: -1,
    },
    {
      text: "People should keep most of what they earn, even when public services suffer.",
      direction: -1,
    },
  ],
  coordination: [
    "Competitive markets usually allocate resources better than public planners.",
    "Businesses should be free to set prices without much government interference.",
    "Public ownership is preferable in industries that are essential to daily life.",
    "Trade unions are an important counterweight to the power of employers.",
    "A strong public sector can coordinate long-term projects better than markets can.",
    "Economic competition often produces useful innovation.",
    "Rent and price controls are worth using when markets fail people.",
    "Regulation should be strict when private profit can harm the public.",
    "Cooperative ownership is often better than ownership by distant shareholders.",
    "Economic decisions should be made as close as possible to the people affected by them.",
    {
      text: "Private companies usually respond to changing needs faster than public institutions.",
      direction: -1,
    },
    {
      text: "Some essential services work better when they are run for profit.",
      direction: -1,
    },
  ],
  power: [
    "A decisive government is more useful than one that is constantly blocked.",
    "Leaders should be trusted to act quickly during serious crises.",
    "A country needs strong institutions that ordinary citizens cannot easily disrupt.",
    "Social order sometimes matters more than individual acts of disobedience.",
    "People should generally follow laws even when they personally dislike them.",
    "A respected national authority can hold a divided society together.",
    "Public officials should have broad powers when they are pursuing a clear mandate.",
    "Strict consequences are necessary to deter behavior that threatens social stability.",
    "Expert administrators should have more influence over policy than popular moods do.",
    "A society becomes weaker when it treats every rule as optional.",
    {
      text: "A government should accept slow decisions rather than risk concentrating power.",
      direction: -1,
    },
    {
      text: "Breaking a law can be responsible when following it would cause clear harm.",
      direction: -1,
    },
  ],
  autonomy: [
    "Adults should be free to live as they choose if they are not harming others.",
    "The state should rarely interfere with personal lifestyle decisions.",
    "People should be able to criticize their government without fear of punishment.",
    "Civil disobedience can be justified against deeply unjust laws.",
    "Privacy is more important than giving authorities convenient access to personal data.",
    "Individuals should have wide freedom to form communities and associations.",
    "Police and security powers should face strict limits even during emergencies.",
    "People should be allowed to take risks with their own lives and property.",
    "No authority should be treated as automatically above criticism.",
    "A messy free society is preferable to an orderly society built on constant surveillance.",
    {
      text: "People sometimes need to give up personal freedoms to make society work well.",
      direction: -1,
    },
    {
      text: "Authorities should be able to limit public speech that threatens social cohesion.",
      direction: -1,
    },
  ],
  identity: [
    "A person's background should never determine how welcome they are in public life.",
    "Different cultures can share one society without needing to become identical.",
    "Minority groups deserve active protection from majorities that can outvote them.",
    "National belonging should be open to anyone who commits to the community.",
    "Public institutions should make room for many forms of family and identity.",
    "Traditions should change when they exclude people who live differently.",
    "Patriotism is strongest when it includes criticism of one's own country.",
    "Religious and cultural differences are usually an asset rather than a threat.",
    "People should be free to define their own identity without state approval.",
    "No group should be considered inherently superior to another.",
    {
      text: "A shared national culture should take priority over preserving every minority custom.",
      direction: -1,
    },
    {
      text: "A country should be cautious about accepting newcomers who may change its character.",
      direction: -1,
    },
  ],
  progress: [
    "New technology is usually worth adopting even when it changes familiar habits.",
    "Old customs should have to prove their value rather than receiving automatic respect.",
    "Education should prepare people for a changing future, not reproduce the past.",
    "Scientific evidence should outrank tradition when the two conflict.",
    "Social progress often requires questioning ideas that once seemed obvious.",
    "A society should experiment with new solutions instead of waiting for certainty.",
    "Preserving a tradition is not a good reason to preserve its harmful parts.",
    "Future generations deserve more consideration than nostalgia for earlier ways of life.",
    "Cultural change is generally a sign of a living society rather than its decline.",
    "Institutions should be redesigned when they no longer fit present conditions.",
    {
      text: "New ideas should be treated cautiously until their consequences are clear.",
      direction: -1,
    },
    {
      text: "A familiar custom can be valuable simply because it has lasted for generations.",
      direction: -1,
    },
  ],
};

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function makeQuestions() {
  return shuffle(
    Object.entries(questionSets).flatMap(([key, entries]) =>
      entries.map((entry) => ({
        key,
        text: typeof entry === "string" ? entry : entry.text,
        direction: typeof entry === "string" ? 1 : entry.direction,
      })),
    ),
  );
}

let questions = makeQuestions();
const currentIndex = ref(0);
const answers = ref(Array(questions.length).fill(null));
const finished = ref(false);
const currentQuestion = computed(() => questions[currentIndex.value]);
const currentAnswer = computed(() => answers.value[currentIndex.value]);
const progress = computed(
  () => ((currentIndex.value + 1) / questions.length) * 100,
);

function selectAnswer(value) {
  answers.value[currentIndex.value] = value;
}
function nextQuestion() {
  if (currentAnswer.value === null) return;
  if (currentIndex.value === questions.length - 1) finished.value = true;
  else currentIndex.value += 1;
}
function previousQuestion() {
  if (currentIndex.value > 0) currentIndex.value -= 1;
}
function restart() {
  questions = makeQuestions();
  currentIndex.value = 0;
  answers.value = Array(questions.length).fill(null);
  finished.value = false;
}

function rawScore(key) {
  const values = questions
    .map((question, index) =>
      question.key === key
        ? { value: answers.value[index], direction: question.direction }
        : null,
    )
    .filter((answer) => answer !== null && answer.value !== null);
  if (!values.length) return 0;
  return (
    values.reduce(
      (total, answer) => total + answer.value * answer.direction,
      0,
    ) /
    (values.length * 2)
  );
}
function percentage(score) {
  return Math.round(((score + 1) / 2) * 100);
}
function signedLabel(score, negative, positive) {
  const amount = Math.abs(Math.round(score * 100));
  if (amount < 8) return "balanced";
  return `${amount}% ${score < 0 ? negative : positive}`;
}

const equalityScore = computed(() => rawScore("equality"));
const coordinationScore = computed(() => rawScore("coordination"));
const powerScore = computed(() => rawScore("power"));
const autonomyScore = computed(() => rawScore("autonomy"));
const progressScore = computed(() => rawScore("progress"));
const economicScore = computed(
  () => (equalityScore.value + coordinationScore.value) / 2,
);
const authorityScore = computed(
  () => (powerScore.value - autonomyScore.value) / 2,
);
const progressiveScore = computed(() => -progressScore.value);
const compassX = computed(() => 260 + economicScore.value * 190);
const compassY = computed(() => 260 + authorityScore.value * 190);
const ideology = computed(() => {
  const economic =
    economicScore.value < -0.22
      ? "left"
      : economicScore.value > 0.22
        ? "right"
        : "centrist";
  const authority =
    authorityScore.value < -0.22
      ? "libertarian"
      : authorityScore.value > 0.22
        ? "authoritarian"
        : "moderate";
  return `${authority} ${economic}`;
});
const axisResults = computed(() =>
  Object.entries(axisDefinitions).map(([key, definition]) => {
    const score = rawScore(key);
    return {
      ...definition,
      key,
      leftPercent: percentage(-score),
      rightPercent: percentage(score),
    };
  }),
);

function downloadResult() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1700;
  const context = canvas.getContext("2d");
  context.fillStyle = "#202124";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "700 76px Arial";
  context.fillText("jPol", 80, 110);
  context.font = "28px Arial";
  context.fillStyle = "#a7adb5";
  context.fillText("political values result", 84, 155);
  context.font = "700 42px Arial";
  context.fillStyle = "#04d361";
  context.fillText(ideology.value, 84, 230);
  drawCanvasCompass(context, 80, 290, 620);
  context.font = "700 28px Arial";
  context.fillStyle = "#ffffff";
  context.fillText("PROGRESSIVE", 850, 350);
  context.fillText("CONSERVATIVE", 1120, 350);
  drawCanvasBar(
    context,
    850,
    390,
    470,
    percentage(progressiveScore.value),
    "#04d361",
  );
  context.font = "26px Arial";
  context.fillStyle = "#a7adb5";
  context.fillText(
    `${percentage(progressiveScore.value)}% progressive`,
    850,
    470,
  );
  context.font = "700 30px Arial";
  context.fillStyle = "#ffffff";
  context.fillText("SIX VALUE AXES", 850, 560);
  axisResults.value.forEach((axis, index) => {
    const y = 620 + index * 145;
    context.font = "700 24px Arial";
    context.fillStyle = "#ffffff";
    context.fillText(axis.name.toUpperCase(), 850, y);
    context.font = "22px Arial";
    context.fillStyle = "#a7adb5";
    context.fillText(axis.left, 850, y + 38);
    context.fillText(axis.right, 1180, y + 38);
    drawCanvasBar(context, 850, y + 55, 470, axis.leftPercent, axis.color);
    context.fillStyle = "#ffffff";
    context.fillText(`${axis.leftPercent}%`, 850, y + 115);
    context.fillText(`${axis.rightPercent}%`, 1250, y + 115);
  });
  context.font = "20px Arial";
  context.fillStyle = "#727983";
  context.fillText(
    "Generated by jPol · answers are tendencies, not a permanent identity",
    80,
    1615,
  );
  const link = document.createElement("a");
  link.download = "jpol-result.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
function drawCanvasBar(context, x, y, width, leftPercent, color) {
  context.fillStyle = "#101114";
  context.fillRect(x, y, width, 42);
  context.fillStyle = color;
  context.fillRect(x, y, width * (leftPercent / 100), 42);
  context.strokeStyle = "#41464e";
  context.strokeRect(x, y, width, 42);
}
function drawCanvasCompass(context, x, y, size) {
  context.fillStyle = "#101114";
  context.fillRect(x, y, size, size);
  context.strokeStyle = "#424850";
  context.strokeRect(x, y, size, size);
  context.strokeStyle = "#343840";
  context.beginPath();
  context.moveTo(x + size / 2, y);
  context.lineTo(x + size / 2, y + size);
  context.moveTo(x, y + size / 2);
  context.lineTo(x + size, y + size / 2);
  context.stroke();
  context.fillStyle = "#04d361";
  context.beginPath();
  context.arc(
    x + size / 2 + economicScore.value * 260,
    y + size / 2 + authorityScore.value * 260,
    16,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.fillStyle = "#a7adb5";
  context.font = "22px Arial";
  context.fillText("LIBERTY", x + size / 2 - 40, y - 20);
  context.fillText("AUTHORITY", x + size / 2 - 58, y + size + 38);
  context.fillText("LEFT", x - 58, y + size / 2 + 8);
  context.fillText("RIGHT", x + size + 15, y + size / 2 + 8);
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
.eyebrow {
  margin: 0 0 12px;
  color: #04d361;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.jpol-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(64px, 10vw, 112px);
  line-height: 0.9;
  letter-spacing: -6px;
}
.jpol-hero p:last-child,
.results-heading p {
  max-width: 650px;
  margin: 22px 0 0;
  color: #9ba1a9;
  font-size: 18px;
  line-height: 1.6;
}
.quiz-panel,
.results-panel {
  border-top: 1px solid #30343a;
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
  padding: 16px 0 10px;
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
  margin: 72px auto 58px;
  max-width: 820px;
}
.question-card h2 {
  margin: 0 0 40px;
  color: #fff;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.12;
  letter-spacing: -1px;
}
.answers {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.answers button,
.primary-button,
.text-button {
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
.results-panel {
  padding-top: 42px;
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
  min-width: 170px;
}
.compass-layout {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(260px, 0.8fr);
  gap: 50px;
  align-items: center;
  margin: 60px 0 70px;
}
.compass {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}
.compass text {
  fill: #a7adb5;
  font-size: 13px;
  letter-spacing: 1px;
}
.axis-readout {
  display: grid;
  gap: 16px;
  margin-bottom: 40px;
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
  margin-top: 36px;
  color: #727983;
  font-size: 14px;
  line-height: 1.6;
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
    min-height: 60px;
  }
  .answers small {
    display: inline;
    margin-left: 7px;
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
