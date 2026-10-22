<template>
  <div class="hexo">
    <aside class="panel">
      <header class="top">
        <div>
          <h1>HeXO</h1>
          <p class="sub">six in a line · three axes · center h8</p>
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
            </span>
          </span>
          <strong v-if="clock">{{ formatClock(clock[side]) }}</strong>
        </div>
      </div>

      <div class="actions">
        <button type="button" @click="showSetup = !showSetup">
          {{ showSetup ? "close" : "new" }}
        </button>
        <button
          v-if="mode === 'practice'"
          type="button"
          :disabled="!history.length || view !== history.length"
          @click="undo"
        >
          undo
        </button>
        <button type="button" @click="copyLink">
          {{ copied ? "copied" : "copy link" }}
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
      <p v-else-if="!history.length" class="empty">no moves yet.</p>
      <ol v-else ref="listEl" class="moves">
        <li v-for="(move, index) in history" :key="index">
          <button
            type="button"
            :class="{ on: view === index + 1 }"
            @click="view = index + 1"
          >
            {{ index + 1 }}. {{ playerOf(index) }}{{ move.letter }}{{ move.number }}
          </button>
        </li>
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
              'is-guide': guided(cell.key),
              'is-last': lastKey === cell.key && !winKeys.has(cell.key),
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

          <circle
            v-if="lastCell && !winKeys.has(lastCell.key)"
            class="last-ring soft"
            :cx="lastCell.x"
            :cy="lastCell.y"
            r="15"
          />
          <circle
            v-if="lastCell && !winKeys.has(lastCell.key)"
            class="last-ring"
            :cx="lastCell.x"
            :cy="lastCell.y"
            r="12.2"
          />

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
} from "@/games/hexo/logic.ts";

const route = useRoute();
const sides = ["X", "O"];

function readReplay() {
  const raw = route.query.r;
  if (typeof raw !== "string" || !raw) return { moves: null, error: false };
  const moves = decodeReplay(raw);
  if (!moves) return { moves: null, error: true };
  return { moves, error: false };
}

const loaded = readReplay();
const history = ref(loaded.moves ?? []);
const view = ref(loaded.moves?.length ?? 0);
const mode = ref("hotseat");
const human = ref("X");
const clock = ref(null);
const clockMarks = ref([]);
const clockRunning = ref(false);
const timeoutWinner = ref(null);
const showSetup = ref(false);
const hoverKey = ref(null);
const dragging = ref(false);
const copied = ref(false);
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
const lastCell = computed(() => (lastKey.value ? BOARD.byKey[lastKey.value] : null));

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
  if (timeoutWinner.value) return `${timeoutWinner.value} wins on time`;
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

const statusText = computed(() => {
  if (outcome.value) return outcome.value;
  if (view.value < history.value.length) {
    if (view.value === 0) return "start";
    const move = history.value[view.value - 1];
    return `after ${view.value}. ${playerOf(view.value - 1)}${move.letter}${move.number}`;
  }
  return `${turn.value} to move`;
});

const readout = computed(() => {
  if (hoverKey.value) return hoverKey.value;
  if (lastMove.value) {
    return `${playerOf(view.value - 1)}${lastMove.value.letter}${lastMove.value.number}`;
  }
  return "–";
});

const canPlay = computed(() => {
  if (showSetup.value || outcome.value) return false;
  if (view.value !== history.value.length) return false;
  if (mode.value === "practice" && turn.value !== human.value) return false;
  return true;
});

const guideSet = computed(() => {
  if (!hoverKey.value) return new Set();
  return new Set(BOARD.guides[hoverKey.value] ?? []);
});

const ghost = computed(() => {
  if (!canPlay.value || !hoverKey.value || stones.value[hoverKey.value]) return null;
  return BOARD.byKey[hoverKey.value] ?? null;
});

const stageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
}));

function emptyPosition() {
  return { stones: {}, turn: "X", winner: null, lines: [] };
}

function guided(key) {
  return Boolean(hoverKey.value) && hoverKey.value !== key && guideSet.value.has(key);
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
  if (!canPlay.value) return;
  const cell = BOARD.byKey[key];
  if (!cell || stones.value[key]) return;
  pushMove({ letter: cell.letter, number: cell.number });
}

function undo() {
  if (view.value !== history.value.length || !history.value.length) return;
  window.clearTimeout(botTimer);
  let pops = 1;
  if (mode.value === "practice") {
    const last = playerOf(history.value.length - 1);
    if (last === botSide() && history.value.length >= 2) pops = 2;
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
  mode.value = draft.mode;
  human.value = draft.human;
  history.value = [];
  view.value = 0;
  clockMarks.value = [];
  timeoutWinner.value = null;
  replayError.value = false;
  particles.value = [];
  hoverKey.value = null;
  if (draft.minutes > 0) {
    const ms = draft.minutes * 60 * 1000;
    clock.value = { X: ms, O: ms };
  } else {
    clock.value = null;
  }
  clockRunning.value = false;
  showSetup.value = false;
  syncUrl();
  nextTick(() => fit());
  queueBot();
}

function syncUrl() {
  const url = new URL(window.location.href);
  const encoded = encodeReplay(history.value);
  if (encoded) url.searchParams.set("r", encoded);
  else url.searchParams.delete("r");
  window.history.replaceState(window.history.state, "", url);
}

async function copyLink() {
  syncUrl();
  const text = window.location.href;
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1400);
  } catch {
    window.prompt("copy this link", text);
  }
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
  }
}

let clockTimer = 0;
let lastTick = 0;
let observer;

function tickClock() {
  const now = performance.now();
  const dt = lastTick ? now - lastTick : 0;
  lastTick = now;
  if (!clock.value || !clockRunning.value || outcome.value) return;
  if (view.value !== history.value.length) return;
  const side = turn.value;
  const next = Math.max(0, clock.value[side] - dt);
  clock.value = { ...clock.value, [side]: next };
  if (next <= 0) {
    window.clearTimeout(botTimer);
    timeoutWinner.value = side === "X" ? "O" : "X";
    clockRunning.value = false;
    spawnConfetti();
  }
}

watch(history, () => syncUrl(), { deep: true });

watch(view, async () => {
  await nextTick();
  listEl.value?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
});

onMounted(() => {
  if (position.value.winner && position.value.winner !== "draw") spawnConfetti();
  lastTick = performance.now();
  clockTimer = window.setInterval(tickClock, 200);
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

.moves button {
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid #161616;
  background: transparent;
  color: #999;
  padding: 7px 2px;
}

.moves button.on,
.moves button:hover:not(:disabled) {
  color: #fff;
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

.cell.is-guide {
  fill: #2a2a2a;
}

.viewport.can-play .cell.is-empty {
  cursor: pointer;
}

.viewport.can-play .cell.is-empty:hover {
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
