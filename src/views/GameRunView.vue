<template>
  <div class="run-game" :data-kind="kind">
    <main>
      <section class="screen menu" :class="{ active: screen === 'menu' }">
        <div class="cabinet">
          <h1>{{ meta.title }}</h1>
          <p class="tagline">{{ tagline }}</p>
          <div v-if="kind === 'cave'" class="mode-row">
            <button
              v-for="mode in caveModes"
              :key="mode.id"
              type="button"
              :class="{ active: caveMode === mode.id }"
              @click="pickMode(mode.id)"
            >
              {{ mode.label }}
            </button>
          </div>
          <div class="menu-buttons">
            <button class="primary" type="button" @click="start">start</button>
            <button type="button" @click="openBoard('global')">leaderboard</button>
            <button type="button" @click="openName">set name</button>
          </div>
          <p class="hint">{{ meta.hint }}</p>
          <p class="saved-name">player: {{ playerName }}</p>
          <p v-if="menuBest" class="saved-name">best: {{ format(menuBest) }}</p>
          <p class="hint">
            <router-link to="/games">← games</router-link>
            ·
            <router-link :to="meta.other.to">{{ meta.other.label }}</router-link>
          </p>
        </div>
      </section>

      <section class="screen play" :class="{ active: screen === 'play' }">
        <div class="stage">
          <canvas
            ref="canvas"
            width="480"
            height="720"
            :aria-label="meta.aria"
          ></canvas>
          <div class="hud">
            <div><span>score</span><strong>{{ format(hud.score) }}</strong></div>
            <div><span>{{ meta.extra }}</span><strong>{{ format(hud.extra) }}</strong></div>
          </div>
          <button class="quit-btn" type="button" @click="goMenu">menu</button>
          <div class="pause-hint">p = pause · esc = menu</div>
          <div v-if="paused" class="paused">paused</div>
          <div v-else-if="waiting" class="paused wait-hint">hold</div>
        </div>
      </section>

      <section class="screen overlay" :class="{ active: screen === 'over' }">
        <div v-if="result" class="panel">
          <h2>{{ result.title }}</h2>
          <div class="results">
            <div><span>score</span><strong>{{ format(result.score) }}</strong></div>
            <div><span>time</span><strong>{{ result.time.toFixed(1) }}s</strong></div>
            <div v-if="kind === 'roof'">
              <span>jumps</span><strong>{{ result.jumps }}</strong>
            </div>
          </div>
          <p v-if="bestNote" class="best-note">{{ bestNote }}</p>
          <div v-if="askName" class="name-prompt">
            <label for="run-name">enter your name</label>
            <input
              id="run-name"
              ref="nameInput"
              v-model="nameDraft"
              maxlength="16"
              autocomplete="nickname"
              placeholder="a guy"
              @keydown.enter.prevent="saveScore"
            />
            <button class="primary" type="button" @click="saveScore">save score</button>
          </div>
          <div class="menu-buttons">
            <button class="primary" type="button" @click="retry">retry</button>
            <button type="button" @click="goMenu">menu</button>
            <button type="button" @click="openBoard('global')">leaderboard</button>
          </div>
        </div>
      </section>

      <section class="screen overlay" :class="{ active: screen === 'board' }">
        <div class="panel">
          <div class="leaderboard-head">
            <h2>{{ boardTitle }}</h2>
            <button type="button" @click="closeBoard">x</button>
          </div>
          <div class="tabs">
            <button
              type="button"
              :class="{ active: period === 'global' }"
              @click="openBoard('global')"
            >
              global
            </button>
            <button
              type="button"
              :class="{ active: period === 'weekly' }"
              @click="openBoard('weekly')"
            >
              weekly
            </button>
          </div>
          <p class="status">{{ boardStatus }}</p>
          <ol class="scores">
            <li v-for="row in rows" :key="row.id">
              <span class="score-name">{{ row.name || "a guy" }}</span>
              <span class="score-number">{{ format(row.score) }}</span>
            </li>
          </ol>
        </div>
      </section>

      <section class="screen overlay" :class="{ active: screen === 'name' }">
        <div class="panel small-panel">
          <h2>what should we call you?</h2>
          <input
            ref="menuNameInput"
            v-model="nameDraft"
            maxlength="16"
            autocomplete="nickname"
            placeholder="a guy"
            @keydown.enter.prevent="saveMenuName"
          />
          <div class="menu-buttons">
            <button class="primary" type="button" @click="saveMenuName">save</button>
            <button type="button" @click="screen = 'menu'">cancel</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { racingPlayerName, setPlayerName } from "@/data/profile.js";
import { CAVE_MODES, caveScoreGame, caveWalls, deathTitle, runMeta } from "@/games/run/logic.js";
import { createRunLoop } from "@/games/run/loop.js";
import { ensureGameDb } from "@/games/ensureDb.js";
import "@/games/run/style.css";

const props = defineProps({
  game: { type: String, required: true },
});

const kind = computed(() => (props.game === "roof" ? "roof" : "cave"));
const meta = computed(() => runMeta(kind.value));
const caveModes = CAVE_MODES;
const caveMode = ref("normal");
const tagline = computed(() => {
  if (kind.value !== "cave") return meta.value.tagline;
  if (caveMode.value === "slow") return "same cave. the gap closes later.";
  if (caveMode.value === "glide") return "the gap closes like normal. you fly slower.";
  if (caveMode.value === "flip") return "hold to drop. let go to climb.";
  if (caveMode.value === "narrow") return "the gap starts tight and stays there.";
  if (caveMode.value === "random") return "a new cave every run. the gap still closes.";
  return meta.value.tagline;
});
const boardTitle = computed(() => {
  if (kind.value !== "cave") return "leaderboard";
  const label = CAVE_MODES.find((mode) => caveScoreGame(mode.id) === boardGame())?.label;
  return label ? `${label} leaderboard` : "leaderboard";
});

const screen = ref("menu");
const paused = ref(false);
const waiting = ref(false);
const playerName = ref("a guy");
const menuBest = ref(0);
const bestNote = ref("");
const askName = ref(false);
const nameDraft = ref("");
const result = ref(null);
const rows = ref([]);
const boardStatus = ref("loading...");
const period = ref("global");
const boardFrom = ref("menu");
const canvas = ref(null);
const nameInput = ref(null);
const menuNameInput = ref(null);
const hud = reactive({ score: 0, extra: 0 });

let loop = null;
let boardTicket = 0;
let sent = false;
let pointerHeld = false;
const heldKeys = new Set();

function format(value) {
  return Math.floor(Number(value) || 0).toLocaleString();
}

function refreshName() {
  playerName.value = racingPlayerName();
  menuBest.value = Number(localStorage.getItem(bestKey()) || 0);
}

function bestKey() {
  if (kind.value !== "cave") return "eireRunBest:roof";
  if (caveMode.value === "normal") return "eireRunBest:cave";
  return `eireRunBest:cave:${caveMode.value}`;
}

function pickMode(mode) {
  caveMode.value = mode;
  refreshName();
}

function boardGame() {
  if (kind.value !== "cave") return "roof";
  if (boardFrom.value === "over" && result.value?.game) return result.value.game;
  return caveScoreGame(caveMode.value);
}

function hasStoredName() {
  return Boolean(localStorage.getItem("eirePlayerName") || localStorage.getItem("laneRunnerName"));
}

function bind() {
  loop?.destroy();
  if (!canvas.value) return;
  loop = createRunLoop(canvas.value, kind.value, {
    onFrame(state) {
      waiting.value = Boolean(state.waiting);
      hud.score = state.score;
      hud.extra =
        kind.value === "roof" ? state.jumps : Math.round(caveWalls(state.distance, state).gap);
    },
    onEnd(run) {
      finish(run);
    },
  });
}

function start() {
  if (!loop) bind();
  sent = false;
  paused.value = false;
  waiting.value = kind.value === "cave";
  hud.score = 0;
  hud.extra = 0;
  screen.value = "play";
  loop.start(caveMode.value);
  syncHold();
}

function retry() {
  start();
}

function goMenu() {
  loop?.abandon();
  paused.value = false;
  screen.value = "menu";
  refreshName();
}

function finish(run) {
  paused.value = false;
  const previous = Number(localStorage.getItem(bestKey()) || 0);
  if (run.score > previous) {
    localStorage.setItem(bestKey(), String(run.score));
    bestNote.value = previous > 0 ? "new best" : "";
  } else {
    bestNote.value = "";
  }
  result.value = { ...run, title: deathTitle(kind.value, run.reason) };
  askName.value = !hasStoredName();
  screen.value = "over";
  refreshName();
  if (!askName.value) submit(run);
  else nextTick(() => nameInput.value?.focus());
}

async function submit(run) {
  if (sent) return;
  sent = true;
  const response = await ensureGameDb().submitRunScore({
    ...run,
    game: run.game || (kind.value === "cave" ? caveScoreGame(caveMode.value) : "roof"),
    name: racingPlayerName(),
  });
  if (!response.ok && ensureGameDb().ready()) {
    console.warn("score submission failed:", response.error);
  }
}

function saveScore() {
  setPlayerName(nameDraft.value);
  askName.value = false;
  refreshName();
  if (result.value) submit(result.value);
}

function openName() {
  nameDraft.value = localStorage.getItem("eirePlayerName") || localStorage.getItem("laneRunnerName") || "";
  screen.value = "name";
  nextTick(() => menuNameInput.value?.focus());
}

function saveMenuName() {
  setPlayerName(nameDraft.value);
  refreshName();
  screen.value = "menu";
}

async function openBoard(nextPeriod) {
  if (screen.value !== "board") {
    boardFrom.value = screen.value === "over" ? "over" : "menu";
  }
  period.value = nextPeriod;
  screen.value = "board";
  boardStatus.value = "loading...";
  rows.value = [];
  const ticket = ++boardTicket;
  const response = await ensureGameDb().getRunScores(boardGame(), nextPeriod);
  if (ticket !== boardTicket) return;

  if (!response.ok) {
    boardStatus.value = ensureGameDb().ready()
      ? boardError(response.error)
      : "supabase is not configured. set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.";
    return;
  }

  rows.value = response.rows;
  boardStatus.value = response.rows.length
    ? `${nextPeriod} top 50`
    : "no scores yet. civilization awaits.";
}

function boardError(error) {
  const text = String(error || "database error");
  if (/run_scores|schema cache|relation|check constraint|cave-slow|cave-glide|cave-flip|cave-narrow|cave-random/i.test(text)) {
    return `${text}. run src/games/run/supabase.sql again so each cave mode can save.`;
  }
  return `database error: ${text}`;
}

function closeBoard() {
  screen.value = boardFrom.value;
  if (screen.value === "menu") refreshName();
}

function syncHold() {
  loop?.setHold(pointerHeld || heldKeys.size > 0);
}

function onKeyDown(event) {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (event.key === "Escape") {
    event.preventDefault();
    if (screen.value === "play") goMenu();
    else if (screen.value === "board") closeBoard();
    else if (screen.value === "name") screen.value = "menu";
    else if (screen.value === "over") goMenu();
    return;
  }

  if (
    screen.value === "menu" &&
    (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW")
  ) {
    event.preventDefault();
    if (event.repeat) return;
    if (kind.value === "cave") heldKeys.add(event.code);
    start();
    return;
  }

  if (event.code === "Space" && screen.value === "over" && !askName.value) {
    event.preventDefault();
    if (!event.repeat) retry();
    return;
  }

  if (screen.value !== "play") return;

  if (event.key === "p" || event.key === "P") {
    event.preventDefault();
    paused.value = loop?.togglePause() || false;
    return;
  }

  const climb = event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW";
  if (!climb) return;
  event.preventDefault();
  if (kind.value === "roof") {
    if (!event.repeat) loop?.tap();
    return;
  }
  heldKeys.add(event.code);
  syncHold();
}

function onKeyUp(event) {
  if (event.code !== "Space" && event.code !== "ArrowUp" && event.code !== "KeyW") return;
  heldKeys.delete(event.code);
  syncHold();
}

function onPointerDown(event) {
  if (screen.value !== "play" || paused.value) return;
  if (event.target !== canvas.value) return;
  event.preventDefault();
  if (kind.value === "roof") {
    loop?.tap();
    return;
  }
  pointerHeld = true;
  syncHold();
}

function onPointerUp() {
  pointerHeld = false;
  syncHold();
}

function onBlur() {
  pointerHeld = false;
  heldKeys.clear();
  syncHold();
}

watch(kind, () => {
  loop?.abandon();
  paused.value = false;
  screen.value = "menu";
  refreshName();
  nextTick(bind);
});

onMounted(() => {
  document.body.classList.add("run-page");
  refreshName();
  bind();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("blur", onBlur);
});

onUnmounted(() => {
  loop?.destroy();
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("pointerdown", onPointerDown);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  window.removeEventListener("blur", onBlur);
  document.body.classList.remove("run-page");
});
</script>
