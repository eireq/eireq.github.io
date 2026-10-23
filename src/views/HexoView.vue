<template>
  <div class="hexo">
    <aside class="panel">
      <header class="top">
        <div>
          <h1>HeXO</h1>
          <p class="sub">open on h8 · then two a turn · six in a line</p>
        </div>
        <router-link class="back" to="/games">games</router-link>
      </header>

      <p class="readout" :class="{ dim: readout === '–' }">{{ readout }}</p>
      <p class="status" :class="{ over: outcome }" aria-live="polite">
        {{ statusText }}
      </p>

      <div class="plates">
        <div
          v-for="side in sides"
          :key="side"
          class="plate"
          :class="{
            live: !outcome && view === history.length && turn === side,
            low: clock && clock[side] <= 30000 && clock[side] > 0,
          }"
        >
          <span class="side">
            <svg v-if="side === 'X'" class="mark" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3 L13 13 M13 3 L3 13" />
            </svg>
            <svg v-else class="mark" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="5.2" />
            </svg>
            <span>
              {{ side }}
              <small v-if="mode === 'practice'">{{
                human === side ? "you" : "bot"
              }}</small>
              <small v-else-if="mode === 'together' && seat === side">you</small>
            </span>
          </span>
          <strong v-if="clock">{{ formatClock(clock[side]) }}</strong>
        </div>
      </div>

      <div class="actions">
        <button type="button" @click="toggleSetup">
          {{ showSetup ? "close" : "new" }}
        </button>
        <button type="button" @click="toggleSettings">
          {{ showSettings ? "close" : "settings" }}
        </button>
        <button type="button" @click="toggleRules">
          {{ showRules ? "close" : "rules" }}
        </button>
        <button
          v-if="mode === 'practice'"
          type="button"
          :disabled="!history.length || view !== history.length"
          @click="undo"
        >
          undo
        </button>
        <button v-if="!resultLine" type="button" :disabled="!canResign" @click="resign">
          resign
        </button>
        <button type="button" @click="copyLink">
          {{ copied ? "copied" : mode === "together" ? "invite" : "copy link" }}
        </button>
        <button type="button" :disabled="!scorePlain()" @click="copyScore">
          {{ scoreCopied ? "copied" : "copy score" }}
        </button>
      </div>

      <form v-if="showSetup" class="setup" @submit.prevent="startGame">
        <div class="choice">
          <button
            type="button"
            :aria-pressed="draft.mode === 'hotseat'"
            @click="draft.mode = 'hotseat'"
          >
            two players
          </button>
          <button
            type="button"
            :aria-pressed="draft.mode === 'practice'"
            @click="draft.mode = 'practice'"
          >
            practice
          </button>
          <button
            type="button"
            :aria-pressed="draft.mode === 'together'"
            @click="draft.mode = 'together'"
          >
            together
          </button>
        </div>
        <div class="choice">
          <button
            v-for="minutes in [0, 5, 10]"
            :key="minutes"
            type="button"
            :aria-pressed="draft.minutes === minutes"
            @click="draft.minutes = minutes"
          >
            {{ minutes === 0 ? "no clock" : minutes + " min" }}
          </button>
        </div>
        <div v-if="draft.mode === 'practice'" class="choice">
          <button
            type="button"
            :aria-pressed="draft.human === 'X'"
            @click="draft.human = 'X'"
          >
            play X
          </button>
          <button
            type="button"
            :aria-pressed="draft.human === 'O'"
            @click="draft.human = 'O'"
          >
            play O
          </button>
        </div>
        <button type="submit" class="start">start</button>
      </form>

      <div v-if="showRules" class="rules">
        <p>X places one stone on h8. Every later turn is two stones, and O takes the first of them.</p>
        <p>Six in a line, on any of the three axes, wins. That move ends with #.</p>
        <p>
          Check means the side to move can finish a line with the stones still left this turn.
          The stones already in the run are marked.
        </p>
        <p>The side to move may resign. The other side wins. A clock runs only on the turn.</p>
        <p>Together: you are X. Send the invite. The other player is O.</p>
      </div>

      <div v-if="showSettings" class="setup">
        <div class="choice">
          <button
            type="button"
            :aria-pressed="guidesOn"
            @click="guidesOn = true"
          >
            lines on
          </button>
          <button
            type="button"
            :aria-pressed="!guidesOn"
            @click="guidesOn = false"
          >
            lines off
          </button>
        </div>
      </div>

      <div class="moves-head">
        <span>moves</span>
        <span class="steps">
          <button type="button" :disabled="view === 0" @click="step(-1)">
            prev
          </button>
          <button
            type="button"
            :disabled="view === history.length"
            @click="step(1)"
          >
            next
          </button>
          <button
            v-if="view !== history.length"
            type="button"
            @click="view = history.length"
          >
            latest
          </button>
        </span>
      </div>

      <p v-if="replayError" class="warn">that link isn't a valid game.</p>
      <p v-else-if="!history.length && !resultLine" class="empty">no moves yet.</p>
      <ol v-else ref="listEl" class="moves">
        <li
          v-for="line in score"
          :key="line.number"
          :class="{ live: line.stones.some((stone) => view === stone.index + 1) }"
        >
          <span class="num">{{ line.number }}.</span>
          <button
            v-for="(stone, index) in line.stones"
            :key="stone.index"
            type="button"
            :class="{ on: view === stone.index + 1 }"
            @click="view = stone.index + 1"
          >
            {{ index === 0 ? line.player : "" }}{{ stone.square }}{{
              stone.index === mateIndex ? "#" : ""
            }}
          </button>
        </li>
        <li v-if="resultLine" class="result">{{ resultLine }}</li>
      </ol>
    </aside>

    <div
      ref="viewport"
      class="viewport"
      :class="{ 'is-drag': dragging, 'can-play': canPlay }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    >
      <div class="stage" :class="{ ready }" :style="stageStyle">
        <svg
          class="board"
          :viewBox="BOARD.viewBox"
          :width="BOARD.width"
          :height="BOARD.height"
          role="img"
          aria-label="HeXO board"
          @pointerover="onOver"
          @pointerleave="hoverKey = null"
        >
          <polygon
            v-for="cell in BOARD.cells"
            :key="cell.key"
            :points="cell.points"
            class="cell"
            :class="{
              'is-empty': !stones[cell.key],
              'is-center': cell.key === 'h8' && !stones[cell.key],
              'is-opening': cell.key === 'h8' && view === 0,
              'is-legal': legal(cell.key),
              'is-guide': guided(cell.key),
              'is-check': checkKeys.has(cell.key),
              'is-last': lastKeys.has(cell.key) && !winKeys.has(cell.key),
              'is-win': winKeys.has(cell.key),
            }"
            :style="
              winKeys.has(cell.key)
                ? { transitionDelay: (winDelay[cell.key] || 0) + 'ms' }
                : undefined
            "
            :data-cell="cell.key"
          />

          <g class="pieces" aria-hidden="true">
            <path
              v-for="cell in xCells"
              :key="'x-' + cell.key"
              :class="{ 'on-win': winKeys.has(cell.key) }"
              :d="xMark(cell)"
            />
            <circle
              v-for="cell in oCells"
              :key="'o-' + cell.key"
              :class="{ 'on-win': winKeys.has(cell.key) }"
              :cx="cell.x"
              :cy="cell.y"
              r="7.3"
            />
          </g>

          <g v-if="ghost" class="ghost" aria-hidden="true">
            <path v-if="turn === 'X'" :d="xMark(ghost)" />
            <circle v-else :cx="ghost.x" :cy="ghost.y" r="7.3" />
          </g>

          <template v-for="cell in shownTurn" :key="'mark-' + cell.key">
            <circle
              v-if="!winKeys.has(cell.key)"
              class="last-ring soft"
              :class="{ still: cell.key !== lastKey }"
              :cx="cell.x"
              :cy="cell.y"
              r="15"
            />
            <circle
              v-if="cell.key === lastKey && !winKeys.has(cell.key)"
              class="last-ring"
              :cx="cell.x"
              :cy="cell.y"
              r="12.2"
            />
          </template>

          <g v-if="winSegments.length" class="victory" aria-hidden="true">
            <line
              v-for="(segment, index) in winSegments"
              :key="'halo-' + index"
              class="win-halo"
              :x1="segment.x1"
              :y1="segment.y1"
              :x2="segment.x2"
              :y2="segment.y2"
            />
            <line
              v-for="(segment, index) in winSegments"
              :key="'line-' + index"
              class="win-line"
              :x1="segment.x1"
              :y1="segment.y1"
              :x2="segment.x2"
              :y2="segment.y2"
            />
          </g>

          <g class="coords" aria-hidden="true">
            <text
              v-for="(label, index) in BOARD.labels"
              :key="index"
              :x="label.x"
              :y="label.y"
            >
              {{ label.text }}
            </text>
          </g>
        </svg>
      </div>

      <div class="burst" aria-hidden="true">
        <i v-for="bit in particles" :key="bit.id" :style="bit.style" />
      </div>

      <div class="zoom">
        <button type="button" aria-label="zoom out" @click="zoomBy(1 / 1.18)">
          −
        </button>
        <button type="button" aria-label="zoom in" @click="zoomBy(1.18)">
          +
        </button>
        <button type="button" aria-label="fit board" @click="fit">fit</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  BOARD,
  applyMoves,
  chooseBotMove,
  decodeReplay,
  encodeReplay,
  playerOf,
  stonesLeft,
  threatKeys,
  turnStart,
} from "@/games/hexo/logic.ts";
import { connectMatch } from "@/games/hexo/online.ts";

const route = useRoute();
const sides = ["X", "O"];

function readReplay() {
  const raw = route.query.r;
  if (typeof raw !== "string" || !raw) return { moves: null, error: false };
  const moves = decodeReplay(raw);
  if (!moves) return { moves: null, error: true };
  return { moves, error: false };
}

function readRoom() {
  const room = route.query.p;
  if (typeof room !== "string" || !/^[a-f0-9]{12,32}$/.test(room)) return null;
  const minutes = route.query.min === "5" || route.query.min === "10" ? Number(route.query.min) : 0;
  return {
    room,
    seat: route.query.s === "O" ? "O" : "X",
    minutes,
  };
}

function playerId() {
  const key = "hexo-player";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const id = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  window.sessionStorage.setItem(key, id);
  return id;
}

const joined = readRoom();
const loaded = readReplay();
const history = ref(loaded.moves ?? []);
const view = ref(loaded.moves?.length ?? 0);
const mode = ref(joined ? "together" : "hotseat");
const human = ref(joined?.seat ?? "X");
const room = ref(joined?.room ?? null);
const seat = ref(joined?.seat ?? null);
const clockBudget = ref(joined?.minutes ?? 0);
const clock = ref(
  clockBudget.value && !loaded.moves?.length
    ? { X: clockBudget.value * 60000, O: clockBudget.value * 60000 }
    : null,
);
const clockMarks = ref([]);
const clockRunning = ref(false);
const timeoutWinner = ref(
  !loaded.error && (route.query.flag === "X" || route.query.flag === "O") ? route.query.flag : null,
);
const resigned = ref(
  !loaded.error && (route.query.end === "X" || route.query.end === "O") ? route.query.end : null,
);
const showSetup = ref(false);
const showSettings = ref(false);
const showRules = ref(false);
const guidesOn = ref(window.localStorage.getItem("hexo-guides") !== "off");
const hoverKey = ref(null);
const dragging = ref(false);
const copied = ref(false);
const scoreCopied = ref(false);
const linkUp = ref(false);
const peerKnown = ref(false);
const peerAt = ref(0);
const nowMs = ref(Date.now());
const selfId = playerId();
const replayError = ref(loaded.error);
const particles = ref([]);
const ready = ref(false);
const listEl = ref(null);
const viewport = ref(null);

const panX = ref(0);
const panY = ref(0);
const zoom = ref(1);

const draft = reactive({
  mode: "hotseat",
  human: "X",
  minutes: 0,
});

const position = computed(
  () => applyMoves(history.value.slice(0, view.value)) ?? emptyPosition(),
);
const stones = computed(() => position.value.stones);
const turn = computed(() => position.value.turn);
const xCells = computed(() =>
  BOARD.cells.filter((cell) => stones.value[cell.key] === "X"),
);
const oCells = computed(() =>
  BOARD.cells.filter((cell) => stones.value[cell.key] === "O"),
);

const lastMove = computed(() =>
  view.value > 0 ? history.value[view.value - 1] : null,
);
const lastKey = computed(() =>
  lastMove.value ? `${lastMove.value.letter}${lastMove.value.number}` : null,
);

function turnSlice(ply) {
  if (ply <= 0) return null;
  const end = ply - 1;
  const start = turnStart(end);
  return {
    number: start === 0 ? 1 : Math.floor((start + 1) / 2) + 1,
    player: playerOf(start),
    squares: history.value
      .slice(start, ply)
      .map((move) => `${move.letter}${move.number}`),
  };
}

function moveLabel(ply) {
  const turn = turnSlice(ply);
  if (!turn) return "";
  return `${turn.number}. ${turn.player}${turn.squares.join(" ")}`;
}

const score = computed(() => {
  const lines = [];
  for (let index = 0; index < history.value.length; ) {
    const start = turnStart(index);
    const stones = [];
    let cursor = start;
    while (cursor < history.value.length && turnStart(cursor) === start) {
      const move = history.value[cursor];
      stones.push({ index: cursor, square: `${move.letter}${move.number}` });
      cursor += 1;
    }
    lines.push({
      number: lines.length + 1,
      player: playerOf(start),
      stones,
    });
    index = cursor;
  }
  return lines;
});

const shownTurn = computed(() => {
  const turn = turnSlice(view.value);
  if (!turn) return [];
  return turn.squares.map((key) => BOARD.byKey[key]).filter(Boolean);
});

const lastKeys = computed(() => new Set(shownTurn.value.map((cell) => cell.key)));

const fullGame = computed(() => applyMoves(history.value) ?? emptyPosition());

const checkKeys = computed(() => {
  if (position.value.winner || timeoutWinner.value || resigned.value) return new Set();
  return new Set(threatKeys(stones.value, turn.value, stonesLeft(view.value)));
});

const mateIndex = computed(() => {
  if (resigned.value || timeoutWinner.value) return -1;
  if (!fullGame.value.winner || fullGame.value.winner === "draw") return -1;
  return history.value.length - 1;
});

const resultLine = computed(() => {
  if (timeoutWinner.value) return `${timeoutWinner.value} wins · time`;
  if (resigned.value) return `${resigned.value === "X" ? "O" : "X"} wins · resign`;
  if (fullGame.value.winner === "draw") return "draw";
  if (fullGame.value.winner) return `${fullGame.value.winner} wins`;
  return "";
});

const otherSeat = computed(() => (seat.value === "O" ? "X" : "O"));
const opponentHere = computed(
  () => peerKnown.value && nowMs.value - peerAt.value < 9000,
);

const winKeys = computed(() => {
  const keys = new Set();
  if (view.value !== history.value.length || timeoutWinner.value) return keys;
  for (const line of position.value.lines) {
    for (const coord of line) keys.add(`${coord.letter}${coord.number}`);
  }
  return keys;
});

const winDelay = computed(() => {
  const delays = {};
  if (view.value !== history.value.length) return delays;
  for (const line of position.value.lines) {
    line.forEach((coord, index) => {
      const key = `${coord.letter}${coord.number}`;
      if (delays[key] == null) delays[key] = index * 40;
    });
  }
  return delays;
});

const winSegments = computed(() => {
  if (view.value !== history.value.length || timeoutWinner.value) return [];
  return position.value.lines.map((line) => {
    const a = BOARD.byKey[`${line[0].letter}${line[0].number}`];
    const b = BOARD.byKey[`${line[line.length - 1].letter}${line[line.length - 1].number}`];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ext = BOARD.hex * 0.45;
    return {
      x1: a.x - (dx / len) * ext,
      y1: a.y - (dy / len) * ext,
      x2: b.x + (dx / len) * ext,
      y2: b.y + (dy / len) * ext,
    };
  });
});

const outcome = computed(() => {
  if (view.value !== history.value.length) return null;
  if (timeoutWinner.value) return `${timeoutWinner.value} wins · time`;
  if (resigned.value) return `${resigned.value === "X" ? "O" : "X"} wins · resign`;
  if (position.value.winner === "draw") return "draw";
  if (position.value.winner) {
    const names = position.value.lines
      .map((line) => {
        const a = line[0];
        const b = line[line.length - 1];
        return `${a.letter}${a.number}–${b.letter}${b.number}`;
      })
      .join(", ");
    return names
      ? `${position.value.winner} wins · ${names}`
      : `${position.value.winner} wins`;
  }
  return null;
});

function withCheck(text) {
  return checkKeys.value.size ? `check · ${text}` : text;
}

const statusText = computed(() => {
  if (outcome.value) return outcome.value;
  if (
    mode.value === "together" &&
    view.value === history.value.length &&
    !showSetup.value
  ) {
    if (!linkUp.value) return "connecting";
    if (!opponentHere.value) {
      return peerKnown.value ? `${otherSeat.value} is away` : `waiting for ${otherSeat.value}`;
    }
  }
  if (view.value < history.value.length) {
    if (view.value === 0) return withCheck("start");
    return withCheck(`after ${moveLabel(view.value)}`);
  }
  if (history.value.length === 0) return withCheck("X plays h8");
  if (stonesLeft(history.value.length) === 1) return withCheck(`${turn.value} · one more`);
  return withCheck(`${turn.value} to move`);
});

const readout = computed(() => {
  if (hoverKey.value) return hoverKey.value;
  const turn = turnSlice(view.value);
  if (turn) return `${turn.player}${turn.squares.join(" ")}`;
  return "–";
});

const canPlay = computed(() => {
  if (showSetup.value || outcome.value) return false;
  if (view.value !== history.value.length) return false;
  if (mode.value === "practice" && turn.value !== human.value) return false;
  if (mode.value === "together" && turn.value !== seat.value) return false;
  return true;
});

const canResign = computed(() => canPlay.value);

const guideSet = computed(() => {
  if (!hoverKey.value) return new Set();
  return new Set(BOARD.guides[hoverKey.value] ?? []);
});

const ghost = computed(() => {
  if (!hoverKey.value || !legal(hoverKey.value)) return null;
  return BOARD.byKey[hoverKey.value] ?? null;
});

watch(guidesOn, (on) => {
  window.localStorage.setItem("hexo-guides", on ? "on" : "off");
});

const stageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
}));

function emptyPosition() {
  return { stones: {}, turn: "X", winner: null, lines: [] };
}

function legal(key) {
  if (!canPlay.value || stones.value[key]) return false;
  if (history.value.length === 0) return key === "h8";
  return true;
}

function guided(key) {
  if (!guidesOn.value || !hoverKey.value || hoverKey.value === key) return false;
  if (history.value.length === 0 && hoverKey.value !== "h8") return false;
  return guideSet.value.has(key);
}

function toggleSetup() {
  showSetup.value = !showSetup.value;
  if (showSetup.value) {
    showSettings.value = false;
    showRules.value = false;
  }
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
  if (showSettings.value) {
    showSetup.value = false;
    showRules.value = false;
  }
}

function toggleRules() {
  showRules.value = !showRules.value;
  if (showRules.value) {
    showSetup.value = false;
    showSettings.value = false;
  }
}

function xMark(cell) {
  const u = 7.1;
  return `M ${cell.x - u} ${cell.y - u} L ${cell.x + u} ${cell.y + u} M ${cell.x + u} ${cell.y - u} L ${cell.x - u} ${cell.y + u}`;
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000 - 1e-9));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function botSide() {
  return human.value === "X" ? "O" : "X";
}

function spawnConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    particles.value = [];
    return;
  }
  const stamp = Date.now();
  particles.value = Array.from({ length: 46 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 46 + (Math.random() - 0.5) * 0.45;
    const dist = 80 + Math.random() * 230;
    return {
      id: `${stamp}-${index}`,
      style: {
        left: "50%",
        top: "46%",
        width: Math.random() > 0.5 ? "7px" : "5px",
        height: Math.random() > 0.45 ? "11px" : "6px",
        background: Math.random() > 0.55 ? "#fff" : "#8d8d8d",
        "--dx": `${Math.cos(angle) * dist}px`,
        "--dy": `${Math.sin(angle) * dist + 24}px`,
        "--rot": `${Math.random() * 520 - 260}deg`,
        animationDelay: `${Math.random() * 0.08}s`,
      },
    };
  });
  window.setTimeout(() => {
    if (particles.value.some((bit) => String(bit.id).startsWith(`${stamp}-`))) {
      particles.value = [];
    }
  }, 1100);
}

function pushMove(move) {
  if (clock.value) {
    clockMarks.value = [
      ...clockMarks.value,
      { X: clock.value.X, O: clock.value.O },
    ];
    clockRunning.value = true;
  } else {
    clockMarks.value = [...clockMarks.value, null];
  }
  history.value = [...history.value, move];
  view.value = history.value.length;
  const latest = applyMoves(history.value);
  if (latest?.winner && latest.winner !== "draw") spawnConfetti();
  queueBot();
  publishMatch();
}

let botTimer = 0;

function queueBot() {
  window.clearTimeout(botTimer);
  if (mode.value !== "practice") return;
  if (showSetup.value) return;
  if (view.value !== history.value.length) return;
  if (timeoutWinner.value || position.value.winner) return;
  if (turn.value !== botSide()) return;
  const seen = history.value.length;
  botTimer = window.setTimeout(() => {
    if (history.value.length !== seen) return;
    if (timeoutWinner.value || position.value.winner) return;
    if (turn.value !== botSide()) return;
    const move = chooseBotMove(stones.value, turn.value);
    if (move) pushMove(move);
  }, 380);
}

function play(key) {
  if (!legal(key)) return;
  const cell = BOARD.byKey[key];
  if (!cell) return;
  pushMove({ letter: cell.letter, number: cell.number });
}

function undo() {
  if (mode.value !== "practice") return;
  if (view.value !== history.value.length || !history.value.length) return;
  window.clearTimeout(botTimer);
  const lastIndex = history.value.length - 1;
  const last = playerOf(lastIndex);
  let pops = history.value.length - turnStart(lastIndex);
  const partial = playerOf(history.value.length) === last;
  if (!partial && last === botSide()) {
    const before = lastIndex - pops;
    if (before >= 0) pops += before - turnStart(before) + 1;
  }
  const mark = clockMarks.value[clockMarks.value.length - pops];
  history.value = history.value.slice(0, -pops);
  clockMarks.value = clockMarks.value.slice(0, -pops);
  view.value = history.value.length;
  timeoutWinner.value = null;
  particles.value = [];
  if (mark && clock.value) clock.value = { X: mark.X, O: mark.O };
  clockRunning.value = history.value.length > 0 && Boolean(clock.value);
  queueBot();
}

function step(delta) {
  view.value = Math.min(history.value.length, Math.max(0, view.value + delta));
}

function startGame() {
  window.clearTimeout(botTimer);
  closeMatch();
  mode.value = draft.mode;
  human.value = draft.human;
  room.value = null;
  seat.value = null;
  peerKnown.value = false;
  linkUp.value = false;
  history.value = [];
  view.value = 0;
  clockMarks.value = [];
  timeoutWinner.value = null;
  resigned.value = null;
  replayError.value = false;
  particles.value = [];
  hoverKey.value = null;
  clockBudget.value = draft.minutes;
  if (draft.minutes > 0) {
    const ms = draft.minutes * 60 * 1000;
    clock.value = { X: ms, O: ms };
  } else {
    clock.value = null;
  }
  clockRunning.value = false;
  showSetup.value = false;
  if (draft.mode === "together") {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    room.value = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    seat.value = "X";
    human.value = "X";
    openMatch();
  }
  syncUrl();
  nextTick(() => fit());
  queueBot();
}

function syncUrl() {
  const url = new URL(window.location.href);
  const encoded = encodeReplay(history.value);
  if (encoded) url.searchParams.set("r", encoded);
  else url.searchParams.delete("r");
  if (mode.value === "together" && room.value && seat.value) {
    url.searchParams.set("p", room.value);
    url.searchParams.set("s", seat.value);
    if (clockBudget.value) url.searchParams.set("min", String(clockBudget.value));
    else url.searchParams.delete("min");
  } else {
    url.searchParams.delete("p");
    url.searchParams.delete("s");
    url.searchParams.delete("min");
  }
  if (resigned.value) url.searchParams.set("end", resigned.value);
  else url.searchParams.delete("end");
  if (timeoutWinner.value) url.searchParams.set("flag", timeoutWinner.value);
  else url.searchParams.delete("flag");
  window.history.replaceState(window.history.state, "", url);
}

function inviteUrl() {
  const url = new URL(window.location.href);
  if (room.value && seat.value) {
    url.searchParams.set("p", room.value);
    url.searchParams.set("s", seat.value === "X" ? "O" : "X");
    const encoded = encodeReplay(history.value);
    if (encoded) url.searchParams.set("r", encoded);
    else url.searchParams.delete("r");
    if (clockBudget.value) url.searchParams.set("min", String(clockBudget.value));
    else url.searchParams.delete("min");
    if (resigned.value) url.searchParams.set("end", resigned.value);
    else url.searchParams.delete("end");
    if (timeoutWinner.value) url.searchParams.set("flag", timeoutWinner.value);
    else url.searchParams.delete("flag");
  }
  return url.toString();
}

async function copyText(text, which) {
  try {
    await navigator.clipboard.writeText(text);
    if (which === "score") scoreCopied.value = true;
    else copied.value = true;
    window.setTimeout(() => {
      if (which === "score") scoreCopied.value = false;
      else copied.value = false;
    }, 1400);
  } catch {
    window.prompt("copy this", text);
  }
}

async function copyLink() {
  syncUrl();
  await copyText(mode.value === "together" ? inviteUrl() : window.location.href, "link");
}

function scorePlain() {
  const lines = score.value.map((line) => {
    const body = line.stones
      .map((stone, index) => {
        const text = `${index === 0 ? line.player : ""}${stone.square}`;
        return stone.index === mateIndex.value ? `${text}#` : text;
      })
      .join(" ");
    return `${line.number}. ${body}`;
  });
  if (resultLine.value) lines.push(resultLine.value);
  return lines.join("\n");
}

async function copyScore() {
  const text = scorePlain();
  if (!text) return;
  await copyText(text, "score");
}

function resign() {
  if (!canResign.value || !seatOrTurn()) return;
  resigned.value = seatOrTurn();
  clockRunning.value = false;
  particles.value = [];
  publishMatch();
}

function seatOrTurn() {
  if (mode.value === "together") return seat.value;
  return turn.value;
}

let fitZoom = 1;
let userAdjusted = false;

function fit() {
  const box = viewport.value;
  if (!box) return;
  const next = Math.min(
    box.clientWidth / BOARD.width,
    box.clientHeight / BOARD.height,
  );
  fitZoom = next > 0 ? next * 0.94 : 1;
  zoom.value = fitZoom;
  panX.value = (box.clientWidth - BOARD.width * fitZoom) / 2;
  panY.value = (box.clientHeight - BOARD.height * fitZoom) / 2;
  userAdjusted = false;
  ready.value = true;
}

function zoomAt(clientX, clientY, nextZoom) {
  const box = viewport.value;
  if (!box) return;
  const min = fitZoom * 0.85;
  const max = fitZoom * 6;
  const clamped = Math.min(max, Math.max(min, nextZoom));
  const rect = box.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const scale = clamped / zoom.value;
  panX.value = mx - (mx - panX.value) * scale;
  panY.value = my - (my - panY.value) * scale;
  zoom.value = clamped;
}

function zoomBy(factor) {
  const box = viewport.value;
  if (!box) return;
  const rect = box.getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom.value * factor);
  userAdjusted = true;
}

function onWheel(event) {
  let delta = event.deltaY;
  if (event.deltaMode === 1) delta *= 16;
  else if (event.deltaMode === 2) delta *= 80;
  const factor = Math.exp(-delta * 0.0014);
  zoomAt(event.clientX, event.clientY, zoom.value * factor);
  userAdjusted = true;
}

const pointers = new Map();
let drag = null;
let pinch = null;

function onPointerDown(event) {
  if (event.button != null && event.button !== 0) return;
  if (event.target instanceof Element && event.target.closest("button")) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  viewport.value?.setPointerCapture?.(event.pointerId);
  if (pointers.size === 1) {
    const cell = event.target?.closest?.("[data-cell]")?.getAttribute("data-cell");
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: panX.value,
      panY: panY.value,
      moved: false,
      cell: cell || null,
    };
    pinch = null;
  } else if (pointers.size >= 2) {
    drag = null;
    dragging.value = true;
    hoverKey.value = null;
    const metrics = pinchMetrics();
    pinch = {
      dist0: metrics.dist,
      zoom0: zoom.value,
      midX: metrics.midX,
      midY: metrics.midY,
    };
  }
}

function pinchMetrics() {
  const pts = [...pointers.values()];
  const dx = pts[0].x - pts[1].x;
  const dy = pts[0].y - pts[1].y;
  return {
    dist: Math.hypot(dx, dy) || 1,
    midX: (pts[0].x + pts[1].x) / 2,
    midY: (pts[0].y + pts[1].y) / 2,
  };
}

function onPointerMove(event) {
  const point = pointers.get(event.pointerId);
  if (!point) return;
  point.x = event.clientX;
  point.y = event.clientY;

  if (pointers.size >= 2 && pinch) {
    const metrics = pinchMetrics();
    panX.value += metrics.midX - pinch.midX;
    panY.value += metrics.midY - pinch.midY;
    pinch.midX = metrics.midX;
    pinch.midY = metrics.midY;
    zoomAt(metrics.midX, metrics.midY, pinch.zoom0 * (metrics.dist / pinch.dist0));
    userAdjusted = true;
    hoverKey.value = null;
    return;
  }

  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && dx * dx + dy * dy > 36) {
    drag.moved = true;
    dragging.value = true;
    hoverKey.value = null;
  }
  if (drag.moved) {
    panX.value = drag.panX + dx;
    panY.value = drag.panY + dy;
    userAdjusted = true;
  }
}

function onPointerUp(event) {
  const ended = drag && drag.id === event.pointerId ? drag : null;
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinch = null;
  if (ended && !ended.moved && ended.cell && pointers.size === 0) play(ended.cell);
  if (ended) {
    drag = null;
    dragging.value = false;
  }
  if (pointers.size === 1) {
    const [id, pt] = [...pointers.entries()][0];
    drag = {
      id,
      x: pt.x,
      y: pt.y,
      panX: panX.value,
      panY: panY.value,
      moved: true,
      cell: null,
    };
    dragging.value = true;
  }
}

function onOver(event) {
  if (dragging.value) return;
  const key = event.target?.closest?.("[data-cell]")?.getAttribute("data-cell");
  hoverKey.value = key || null;
}

function onKey(event) {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    step(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    step(1);
  } else if (event.key === "Escape") {
    showSetup.value = false;
    showSettings.value = false;
    showRules.value = false;
  }
}

let clockTimer = 0;
let lastTick = 0;
let observer;
let match = null;
let muteNet = false;
let hiTimer = 0;

function publishHi() {
  if (!match || !seat.value) return;
  match.publish({
    kind: "hi",
    id: selfId,
    seat: seat.value,
    at: Date.now(),
    moves: [],
    resign: null,
    flag: null,
    minutes: 0,
    clock: null,
    running: false,
  });
}

function publishMatch() {
  if (muteNet || mode.value !== "together" || !match || !seat.value) return;
  match.publish({
    kind: "go",
    id: selfId,
    seat: seat.value,
    at: Date.now(),
    moves: history.value.map((move) => `${move.letter}${move.number}`),
    resign: resigned.value,
    flag: timeoutWinner.value,
    minutes: clockBudget.value,
    clock: clock.value ? { X: clock.value.X, O: clock.value.O } : null,
    running: clockRunning.value && !outcome.value,
  });
}

function isPrefix(short, long) {
  return short.length <= long.length && short.every((key, index) => key === long[index]);
}

function onNote(note) {
  if (note.id === selfId || note.seat === seat.value) return;
  peerKnown.value = true;
  peerAt.value = Date.now();
  if (note.kind === "hi") {
    publishMatch();
    return;
  }

  const moves = [];
  for (const part of note.moves) {
    const found = /^([a-o])(\d{1,2})$/.exec(part);
    if (!found) return;
    moves.push({ letter: found[1], number: Number(found[2]) });
  }
  if (!applyMoves(moves)) return;

  const local = history.value.map((move) => `${move.letter}${move.number}`);
  const remote = note.moves;
  if (!isPrefix(local, remote)) {
    if (isPrefix(remote, local)) publishMatch();
    return;
  }

  const extended = remote.length > local.length;
  if (extended) {
    const follow = view.value === history.value.length;
    muteNet = true;
    history.value = moves;
    clockMarks.value = moves.map(() => null);
    if (follow) view.value = moves.length;
    muteNet = false;
    const latest = applyMoves(moves);
    if (latest?.winner && latest.winner !== "draw") spawnConfetti();
  }

  if (note.resign === note.seat) resigned.value = note.resign;
  if (note.flag && note.flag !== note.seat) timeoutWinner.value = note.flag;
  if ((note.minutes === 5 || note.minutes === 10) && clockBudget.value === 0) {
    clockBudget.value = note.minutes;
  }
  adoptClock(note, extended);
}

function adoptClock(note, extended) {
  if (!note.clock) return;
  if (!extended && clock.value) return;
  const lag = extended ? Math.min(2500, Math.max(0, Date.now() - note.at)) : 0;
  const next = { X: note.clock.X, O: note.clock.O };
  const side = playerOf(history.value.length);
  const latest = applyMoves(history.value);
  const finished = Boolean(note.resign || note.flag || latest?.winner);
  if (!finished && note.running) next[side] = Math.max(0, next[side] - lag);
  clock.value = next;
  clockRunning.value = !finished && Boolean(note.running);
}

function openMatch() {
  closeMatch();
  if (!room.value || !seat.value) return;
  match = connectMatch(room.value, onNote, (up) => {
    linkUp.value = up;
    if (up) {
      publishHi();
      publishMatch();
    }
  });
  hiTimer = window.setInterval(publishHi, 4000);
}

function closeMatch() {
  window.clearInterval(hiTimer);
  match?.close();
  match = null;
  linkUp.value = false;
}

function tickClock() {
  const now = performance.now();
  const dt = lastTick ? now - lastTick : 0;
  lastTick = now;
  nowMs.value = Date.now();
  if (!clock.value || !clockRunning.value || outcome.value) return;
  if (view.value !== history.value.length) return;
  if (mode.value === "together" && (!linkUp.value || !opponentHere.value)) return;
  const side = turn.value;
  const next = Math.max(0, clock.value[side] - dt);
  clock.value = { ...clock.value, [side]: next };
  if (next <= 0) {
    window.clearTimeout(botTimer);
    timeoutWinner.value = side === "X" ? "O" : "X";
    clockRunning.value = false;
    spawnConfetti();
    publishMatch();
  }
}

watch(history, () => syncUrl(), { deep: true });
watch([resigned, timeoutWinner, clockBudget], () => syncUrl());

watch(view, async () => {
  await nextTick();
  listEl.value?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
});

onMounted(() => {
  if (position.value.winner && position.value.winner !== "draw") spawnConfetti();
  lastTick = performance.now();
  clockTimer = window.setInterval(tickClock, 200);
  if (room.value) openMatch();
  observer = new ResizeObserver(() => {
    if (!userAdjusted) fit();
  });
  if (viewport.value) observer.observe(viewport.value);
  fit();
  window.addEventListener("keydown", onKey);
  queueBot();
});

onUnmounted(() => {
  window.clearTimeout(botTimer);
  window.clearInterval(clockTimer);
  closeMatch();
  observer?.disconnect();
  window.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
.hexo {
  height: 100dvh;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  background: #000;
  color: #fff;
  font-family: Arial, sans-serif;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  box-sizing: border-box;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  border-right: 1px solid #222;
  padding: 18px 16px calc(14px + env(safe-area-inset-bottom));
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 34px;
  line-height: 0.95;
  letter-spacing: -1.5px;
  font-weight: 700;
}

.sub {
  margin: 6px 0 0;
  color: #888;
  font-size: 13px;
  line-height: 1.4;
}

.back {
  color: #888;
  text-decoration: none;
  font-size: 14px;
  padding-top: 6px;
}

.back:hover {
  color: #fff;
}

.readout {
  margin: 16px 0 0;
  min-height: 32px;
  font-size: 28px;
  letter-spacing: -1px;
  line-height: 1;
}

.readout.dim {
  color: #333;
}

.status {
  margin: 8px 0 14px;
  min-height: 22px;
  color: #ccc;
  font-size: 15px;
}

.status.over {
  color: #fff;
  font-size: 20px;
  letter-spacing: -0.5px;
}

.plates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.plate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 46px;
  padding: 8px 10px;
  border: 1px solid #222;
  color: #555;
}

.plate.live {
  border-color: #fff;
  color: #fff;
}

.plate.low.live {
  animation: clock-pulse 1s ease-in-out infinite;
}

.side {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.side small {
  display: block;
  color: #666;
  font-size: 11px;
}

.plate.live .side small {
  color: #bbb;
}

.plate strong {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 16px;
}

.mark {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
}

.actions,
.choice,
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.actions {
  margin-bottom: 12px;
}

button {
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 14px;
  padding: 8px 10px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: #fff;
}

button:disabled {
  color: #444;
  border-color: #222;
  cursor: default;
}

button[aria-pressed="true"],
.start {
  background: #fff;
  color: #000;
  border-color: #fff;
}

button:focus-visible {
  outline: 1px solid #fff;
  outline-offset: 2px;
}

.setup {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.rules {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  color: #bbb;
  font-size: 14px;
  line-height: 1.45;
}

.rules p {
  margin: 0;
}

.choice button {
  flex: 1;
}

.moves-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  color: #888;
  font-size: 13px;
}

.steps button {
  padding: 4px 8px;
  font-size: 13px;
}

.moves {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  min-height: 0;
  flex: 1;
}

.moves li {
  display: flex;
  align-items: baseline;
  gap: 2px;
  border-bottom: 1px solid #161616;
  padding: 7px 2px;
  color: #777;
}

.moves li.live {
  color: #ccc;
}

.moves .num {
  flex: none;
  width: 1.7em;
  color: #555;
  font-variant-numeric: tabular-nums;
}

.moves button {
  width: auto;
  text-align: left;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  padding: 0 0.4em 0 0;
}

.moves button.on,
.moves button:hover:not(:disabled) {
  color: #fff;
}

.moves li.result {
  color: #fff;
  border-bottom: 0;
}

.empty,
.warn {
  margin: 8px 0 0;
  color: #666;
  font-size: 14px;
}

.warn {
  color: #aaa;
}

.viewport {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  background: radial-gradient(ellipse at center, #121212 0%, #000 68%);
}

.viewport.is-drag {
  cursor: grabbing;
}

.viewport.is-drag .cell {
  cursor: grabbing;
}

.stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  visibility: hidden;
}

.stage.ready {
  visibility: visible;
}

.board {
  display: block;
  max-width: none;
  width: auto;
  height: auto;
}

.cell {
  fill: #101010;
  stroke: #3a3a3a;
  stroke-width: 1;
  stroke-linejoin: round;
  transition: fill 0.12s linear, stroke 0.12s linear;
}

.cell.is-center {
  stroke: #6a6a6a;
}

.cell.is-opening {
  stroke: #fff;
  stroke-width: 1.6;
}

.cell.is-guide {
  fill: #2a2a2a;
}

.cell.is-check {
  fill: #333;
  stroke: #fff;
  stroke-width: 2.4;
}

.viewport.can-play .cell.is-legal {
  cursor: pointer;
}

.viewport.can-play .cell.is-legal:hover {
  fill: #3a3a3a;
  stroke: #d8d8d8;
}

.cell.is-last {
  stroke: #fff;
  stroke-width: 1.7;
}

.cell.is-win {
  fill: #f4f4f4;
  stroke: #fff;
  transition: fill 0.4s ease, stroke 0.4s ease;
}

.pieces {
  pointer-events: none;
}

.pieces path,
.pieces circle {
  fill: none;
  stroke: #fff;
  stroke-width: 2.35;
  pointer-events: none;
  transition: stroke 0.2s linear;
}

.pieces circle {
  stroke: #d5d5d5;
  stroke-width: 2.15;
}

.pieces .on-win {
  stroke: #000;
}

.last-ring,
.victory {
  pointer-events: none;
  fill: none;
}

.last-ring {
  stroke: #fff;
  stroke-width: 1.35;
  animation: ring-pulse 1.5s ease-in-out infinite;
}

.last-ring.soft {
  stroke-width: 5;
  stroke-opacity: 0.22;
}

.last-ring.soft.still {
  animation: none;
  stroke-opacity: 0.14;
  stroke-width: 4;
}

.ghost {
  pointer-events: none;
  opacity: 0.42;
}

.ghost path,
.ghost circle {
  fill: none;
  stroke: #fff;
  stroke-width: 2.35;
}

.win-halo,
.win-line {
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  animation: draw-line 0.7s ease forwards 0.12s;
}

.win-halo {
  stroke: #fff;
  stroke-width: 7;
}

.win-line {
  stroke: #111;
  stroke-width: 2.6;
}

.coords {
  pointer-events: none;
  font-family: Arial, sans-serif;
  font-size: 12px;
  fill: #8a8a8a;
  text-anchor: middle;
  dominant-baseline: middle;
}

.burst {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.burst i {
  position: absolute;
  display: block;
  animation: burst 950ms ease-out forwards;
}

.zoom {
  position: absolute;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  gap: 6px;
}

.zoom button {
  min-width: 40px;
  background: #000;
}

@keyframes ring-pulse {
  0%,
  100% {
    stroke-opacity: 1;
  }
  50% {
    stroke-opacity: 0.25;
  }
}

@keyframes clock-pulse {
  50% {
    opacity: 0.45;
  }
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes burst {
  from {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
  to {
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))
      rotate(var(--rot));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .last-ring,
  .win-halo,
  .win-line,
  .plate.low.live,
  .burst i,
  .cell {
    animation: none;
    transition: none;
  }

  .win-halo,
  .win-line {
    stroke-dashoffset: 0;
  }
}

@media (max-width: 800px) {
  .hexo {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 1fr) minmax(168px, 42dvh);
  }

  .panel {
    order: 2;
    border-right: 0;
    border-top: 1px solid #222;
    padding: 12px 12px calc(10px + env(safe-area-inset-bottom));
  }

  .viewport {
    order: 1;
  }

  h1 {
    font-size: 28px;
  }

  .readout {
    margin-top: 10px;
    font-size: 22px;
  }

  .status {
    margin-bottom: 10px;
  }
}
</style>
