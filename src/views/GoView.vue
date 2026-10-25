<template>
  <main class="go">
    <p class="back"><router-link to="/games">← games</router-link></p>
    <h1>go</h1>
    <p class="intro">baduk. two players, one screen. click a crossing to play.</p>

    <div class="column">
      <div class="controls">
        <div class="group">
          <span>board</span>
          <div class="choice" role="group" aria-label="board size">
            <button
              v-for="size in SIZES"
              :key="size"
              type="button"
              :aria-pressed="game.size === size"
              @click="setSize(size)"
            >
              {{ size }}×{{ size }}
            </button>
          </div>
        </div>

        <div class="choice actions">
          <button type="button" :class="{ solid: game.phase !== 'mark' }" @click="start()">
            new game
          </button>
          <button type="button" :disabled="!game.history.length" @click="onUndo">undo</button>
          <button type="button" :disabled="game.phase !== 'play'" @click="onPass">pass</button>
          <button v-if="game.phase === 'play'" type="button" @click="onResign">
            {{ resignArmed ? "yes, resign" : "resign" }}
          </button>
          <button v-if="game.phase === 'mark'" type="button" class="solid" @click="onAccept">
            accept score
          </button>
          <button v-if="game.phase === 'mark'" type="button" @click="onResume">
            keep playing
          </button>
        </div>
      </div>

      <p class="taken">
        <span><i class="stone-dot black" aria-hidden="true" /> {{ game.captures.black }} taken</span>
        <span><i class="stone-dot white" aria-hidden="true" /> {{ game.captures.white }} taken</span>
      </p>

      <p class="status" :class="{ over: game.phase === 'done' }" aria-live="polite">
        <span class="line">
          <i v-if="swatch" class="stone-dot" :class="swatch" aria-hidden="true" />
          {{ statusText }}
        </span>
        <span v-if="note" class="note">{{ note }}</span>
      </p>

      <div v-if="game.score && !game.resigned" class="tally">
        <span><i class="stone-dot black" aria-hidden="true" /> {{ formatPoints(game.score.black) }}</span>
        <span><i class="stone-dot white" aria-hidden="true" /> {{ formatPoints(game.score.white) }}</span>
        <span class="komi">white includes {{ formatPoints(game.komi) }} komi</span>
      </div>

      <div class="frame">
        <svg
          ref="boardEl"
          class="board"
          :class="game.phase"
          :viewBox="`0 0 ${game.size + 1} ${game.size + 1}`"
          role="application"
          tabindex="0"
          :aria-label="`go board. ${statusText}`"
          @click="onBoardClick"
          @mousemove="onMove"
          @mouseleave="onLeave"
          @keydown="onKey"
        >
          <defs>
            <radialGradient id="go-black" cx="32%" cy="28%" r="70%">
              <stop offset="0%" stop-color="#5e5e5e" />
              <stop offset="48%" stop-color="#161616" />
              <stop offset="100%" stop-color="#050505" />
            </radialGradient>
            <radialGradient id="go-white" cx="32%" cy="28%" r="70%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="58%" stop-color="#f4f0e6" />
              <stop offset="100%" stop-color="#d4cdc0" />
            </radialGradient>
          </defs>

          <line
            v-for="line in gridLines"
            :key="line.key"
            class="grid-line"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
          />

          <circle
            v-for="star in stars"
            :key="`s${star.row}-${star.col}`"
            class="hoshi"
            :cx="star.col + 1"
            :cy="star.row + 1"
            r="0.1"
          />

          <rect
            v-for="area in areas"
            :key="`a${area.index}`"
            :x="area.col + 1 - 0.11"
            :y="area.row + 1 - 0.11"
            width="0.22"
            height="0.22"
            :fill="area.color === 'black' ? '#24180f' : '#fffdf8'"
            :stroke="area.color === 'white' ? '#24180f' : 'none'"
            stroke-width="0.03"
            pointer-events="none"
          />

          <g v-for="stone in stones" :key="stone.index" pointer-events="none">
            <circle
              class="stone"
              :class="[stone.color, { dead: stone.dead, fresh: stone.last && !stone.dead }]"
              :cx="stone.col + 1"
              :cy="stone.row + 1"
              r="0.475"
              :fill="stone.color === 'black' ? 'url(#go-black)' : 'url(#go-white)'"
              :stroke="stone.color === 'white' ? '#cfc6b8' : 'none'"
              stroke-width="0.02"
            />
            <circle
              v-if="stone.last && !stone.dead"
              :cx="stone.col + 1"
              :cy="stone.row + 1"
              r="0.15"
              :fill="stone.color === 'black' ? '#f4f0e8' : '#1a1a1a'"
            />
            <text
              v-if="stone.dead"
              class="dead-x"
              :x="stone.col + 1"
              :y="stone.row + 1"
              font-size="0.7"
            >
              ×
            </text>
          </g>

          <circle
            v-if="ghost"
            :cx="ghost.col + 1"
            :cy="ghost.row + 1"
            r="0.475"
            :fill="game.turn === 'black' ? 'url(#go-black)' : 'url(#go-white)'"
            opacity="0.48"
            pointer-events="none"
          />

          <circle
            v-if="hover && !ghost && game.phase !== 'done'"
            class="aim"
            :cx="hover.col + 1"
            :cy="hover.row + 1"
            r="0.48"
            fill="none"
            pointer-events="none"
          />

          <text
            v-for="label in labels"
            :key="label.key"
            class="coord"
            :x="label.x"
            :y="label.y"
            font-size="0.28"
          >
            {{ label.text }}
          </text>
        </svg>
      </div>

      <p class="blurb">
        neighbors of the same color share liberties, the empty points beside a group.
        no liberties, and the group comes off. suicide is illegal, and a move can't
        restore an earlier board. pass twice, click groups you both count as dead,
        then score stones plus empty points. white gets 7.5 komi. arrows and enter
        work on the board.
      </p>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";
import {
  BLACK,
  SIZES,
  WHITE,
  acceptScore,
  canPlay,
  columnLabel,
  createGame,
  pass,
  play,
  resign,
  resume,
  starPoints,
  toggleDead,
  undo,
} from "@/games/go/logic.js";

const NOTES = {
  suicide: "suicide. that group would have no liberties.",
  ko: "ko. that restores an earlier position.",
  occupied: "there's already a stone there.",
};

const game = ref(createGame());
const hover = ref(null);
const note = ref("");
const resignArmed = ref(false);
const boardEl = ref(null);

const swatch = computed(() => {
  const current = game.value;
  if (current.phase === "play") return current.turn;
  if (current.winner === BLACK || current.winner === WHITE) return current.winner;
  return "";
});

const placeName = computed(() => {
  const point = hover.value;
  if (!point) return "";
  return `${columnLabel(point.col)}${game.value.size - point.row}`;
});

const statusText = computed(() => {
  const current = game.value;
  if (current.resigned) {
    return `${current.winner} wins. ${current.resigned} resigned.`;
  }
  if (current.phase === "done" && current.score) {
    const black = formatPoints(current.score.black);
    const white = formatPoints(current.score.white);
    if (current.winner === "draw") return `draw. black ${black}, white ${white}.`;
    const margin = formatPoints(Math.abs(current.score.black - current.score.white));
    return `${current.winner} wins by ${margin}. black ${black}, white ${white}.`;
  }
  if (current.phase === "mark" && current.score) {
    const black = formatPoints(current.score.black);
    const white = formatPoints(current.score.white);
    return `both passed. black ${black}, white ${white}. click a group to mark it dead.`;
  }
  const where = placeName.value ? ` · ${placeName.value}` : "";
  const passed = current.passes === 1 ? ". opponent passed" : "";
  return `${current.turn} to play${where}${passed}`;
});

const stones = computed(() => {
  const current = game.value;
  const dead = new Set(current.dead);
  const last = current.last;
  const list = [];
  for (let index = 0; index < current.board.length; index += 1) {
    const color = current.board[index];
    if (!color) continue;
    const row = Math.floor(index / current.size);
    const col = index - row * current.size;
    list.push({
      index,
      row,
      col,
      color,
      dead: dead.has(index),
      last: !!(last && last.row === row && last.col === col),
    });
  }
  return list;
});

const areas = computed(() => {
  const current = game.value;
  if (!current.score || current.resigned) return [];
  const list = [];
  const territory = current.score.territory;
  for (let index = 0; index < territory.length; index += 1) {
    const color = territory[index];
    if (!color || current.board[index]) continue;
    const row = Math.floor(index / current.size);
    list.push({ index, row, col: index - row * current.size, color });
  }
  return list;
});

const gridLines = computed(() => {
  const size = game.value.size;
  const list = [];
  for (let i = 0; i < size; i += 1) {
    list.push({ key: `h${i}`, x1: 1, y1: i + 1, x2: size, y2: i + 1 });
    list.push({ key: `v${i}`, x1: i + 1, y1: 1, x2: i + 1, y2: size });
  }
  return list;
});

const stars = computed(() =>
  starPoints(game.value.size).map(([row, col]) => ({ row, col })),
);

const labels = computed(() => {
  const size = game.value.size;
  const list = [];
  for (let i = 0; i < size; i += 1) {
    const col = columnLabel(i);
    const row = String(size - i);
    list.push({ key: `t${i}`, text: col, x: i + 1, y: 0.4 });
    list.push({ key: `b${i}`, text: col, x: i + 1, y: size + 0.6 });
    list.push({ key: `l${i}`, text: row, x: 0.4, y: i + 1 });
    list.push({ key: `r${i}`, text: row, x: size + 0.6, y: i + 1 });
  }
  return list;
});

const ghost = computed(() => {
  const point = hover.value;
  const current = game.value;
  if (!point || current.phase !== "play") return null;
  return canPlay(current, point.row, point.col) ? point : null;
});

function formatPoints(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function clearPrompt() {
  note.value = "";
  resignArmed.value = false;
}

function start(size = game.value.size) {
  game.value = createGame({ size });
  hover.value = null;
  clearPrompt();
}

function setSize(size) {
  if (size !== game.value.size) start(size);
}

function pointAt(event) {
  const svg = boardEl.value;
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const span = game.value.size + 1;
  const x = ((event.clientX - rect.left) / rect.width) * span;
  const y = ((event.clientY - rect.top) / rect.height) * span;
  const col = Math.round(x - 1);
  const row = Math.round(y - 1);
  const size = game.value.size;
  if (row < 0 || col < 0 || row >= size || col >= size) return null;
  return { row, col };
}

function onPoint(point) {
  const current = game.value;
  if (current.phase === "mark") {
    game.value = toggleDead(current, point.row, point.col);
    return;
  }
  if (current.phase !== "play") return;
  const result = play(current, point.row, point.col);
  if (!result.ok) {
    note.value = NOTES[result.reason] || "";
    resignArmed.value = false;
    return;
  }
  clearPrompt();
  game.value = result.game;
}

function onBoardClick(event) {
  const point = pointAt(event);
  if (point) onPoint(point);
}

function onMove(event) {
  hover.value = pointAt(event);
}

function onLeave() {
  hover.value = null;
}

function onKey(event) {
  const key = event.key;
  if (
    key !== "ArrowUp" &&
    key !== "ArrowDown" &&
    key !== "ArrowLeft" &&
    key !== "ArrowRight" &&
    key !== "Enter" &&
    key !== " "
  ) {
    return;
  }
  event.preventDefault();
  const size = game.value.size;
  const point = hover.value || {
    row: Math.floor((size - 1) / 2),
    col: Math.floor((size - 1) / 2),
  };
  if (key === "ArrowUp") hover.value = { row: Math.max(0, point.row - 1), col: point.col };
  else if (key === "ArrowDown") hover.value = { row: Math.min(size - 1, point.row + 1), col: point.col };
  else if (key === "ArrowLeft") hover.value = { row: point.row, col: Math.max(0, point.col - 1) };
  else if (key === "ArrowRight") hover.value = { row: point.row, col: Math.min(size - 1, point.col + 1) };
  else onPoint(point);
}

function onPass() {
  const next = pass(game.value);
  if (next === game.value) return;
  clearPrompt();
  game.value = next;
}

function onUndo() {
  const next = undo(game.value);
  if (next === game.value) return;
  clearPrompt();
  game.value = next;
}

function onResign() {
  if (game.value.phase !== "play") return;
  if (!resignArmed.value) {
    resignArmed.value = true;
    return;
  }
  game.value = resign(game.value, game.value.turn);
  clearPrompt();
}

function onAccept() {
  const next = acceptScore(game.value);
  if (next === game.value) return;
  clearPrompt();
  game.value = next;
}

function onResume() {
  const next = resume(game.value);
  if (next === game.value) return;
  clearPrompt();
  game.value = next;
}
</script>

<style scoped>
main.go {
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  align-items: stretch;
  justify-content: flex-start;
}

.back {
  margin: 0 0 18px;
}

.back a {
  color: #888;
  font-size: 14px;
  text-decoration: none;
}

.back a:hover {
  color: #fff;
}

h1 {
  font-size: clamp(48px, 8vw, 76px);
  line-height: 0.95;
  margin: 0 0 12px;
  letter-spacing: -3px;
}

.intro,
.blurb {
  max-width: 68ch;
  margin: 0 0 18px;
  color: #888;
  font-size: 16px;
  line-height: 1.55;
}

.blurb {
  margin-top: 18px;
  margin-bottom: 0;
  font-size: 14px;
}

.column {
  width: 100%;
  max-width: 760px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 14px 22px;
  margin: 0 0 14px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group > span {
  color: #666;
  font-size: 12px;
}

.choice {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.choice button {
  font: inherit;
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  cursor: pointer;
}

.choice button[aria-pressed="true"],
.choice button.solid {
  background: #fff;
  color: #000;
  border-color: #fff;
}

.choice button:hover:not(:disabled) {
  border-color: #fff;
}

.choice button:disabled {
  opacity: 0.35;
  cursor: default;
}

.choice button:focus-visible,
.board:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.board:focus {
  outline: none;
}

.board:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

.taken {
  display: flex;
  gap: 18px;
  margin: 0 0 8px;
  color: #888;
  font-size: 14px;
}

.status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 28px;
  margin: 0 0 14px;
  color: #ccc;
  font-size: 16px;
  line-height: 1.45;
}

.status .line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status.over {
  color: #fff;
  font-size: 18px;
}

.note {
  color: #e2b33a;
}

.stone-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  vertical-align: -1px;
  flex: none;
}

.stone-dot.black {
  background: radial-gradient(circle at 35% 30%, #555, #111 60%, #000);
  box-shadow: inset 0 0 0 1px #666;
}

.stone-dot.white {
  background: radial-gradient(circle at 35% 30%, #fff, #f3efe6 60%, #d5cdc0);
  box-shadow: inset 0 0 0 1px #aaa;
}

.tally {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 18px;
  margin: -4px 0 14px;
  color: #ddd;
  font-size: 18px;
}

.tally span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tally .komi {
  color: #777;
  font-size: 14px;
}

.frame {
  width: min(100%, 720px);
  padding: 8px;
  border-radius: 22px;
  background-color: #e6c27a;
  background-image:
    radial-gradient(ellipse at 14% 0%, rgba(255, 248, 230, 0.55), transparent 42%),
    radial-gradient(ellipse at 100% 100%, rgba(120, 72, 20, 0.2), transparent 48%);
  box-shadow:
    0 0 0 1px #c3ae8c,
    0 18px 50px rgba(0, 0, 0, 0.45);
  user-select: none;
}

.board {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  background: transparent;
  border-radius: 14px;
  touch-action: manipulation;
}

.board.play,
.board.mark {
  cursor: pointer;
}

.grid-line {
  stroke: #4a3018;
  stroke-width: 1.15px;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.hoshi {
  fill: #4a3018;
  pointer-events: none;
}

.stone {
  filter: drop-shadow(0 1px 1px rgba(50, 30, 10, 0.4));
}

.stone.dead {
  opacity: 0.38;
  filter: none;
}

.stone.fresh {
  animation: settle 0.16s ease-out;
}

.dead-x {
  fill: #6e2218;
  font-family: Arial, sans-serif;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

.aim {
  stroke: rgba(42, 24, 8, 0.7);
  stroke-width: 1.5px;
  vector-effect: non-scaling-stroke;
}

.coord {
  fill: #6b4e2a;
  font-family: Arial, sans-serif;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

@keyframes settle {
  from {
    opacity: 0.2;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stone.fresh {
    animation: none;
  }
}

@media (max-width: 700px) {
  main.go {
    padding: 36px 16px 64px;
  }

  h1 {
    letter-spacing: -2px;
  }
}
</style>
