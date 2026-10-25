<template>
  <div class="hexchess">
    <aside class="panel">
      <header class="top">
        <div>
          <h1>hex chess</h1>
          <p class="sub">glinski · 91 cells · three bishops</p>
        </div>
        <router-link class="back" to="/games">games</router-link>
      </header>

      <p class="readout" :class="{ dim: readout === '–' }">{{ readout }}</p>
      <p class="status" :class="{ over: over }" aria-live="polite">{{ statusText }}</p>

      <div class="plates">
        <div
          v-for="side in ['w', 'b']"
          :key="side"
          class="plate"
          :class="{ live: atEnd && result.type === 'play' && shown.turn === side }"
        >
          <span class="side">
            <svg class="mark" :class="side" viewBox="-8 -13 16 26" aria-hidden="true">
              <path v-for="(d, index) in GLYPH.k" :key="index" :d="d" />
            </svg>
            <span>
              {{ side === "w" ? "white" : "black" }}
              <small v-if="mode === 'practice'">{{ human === side ? "you" : "bot" }}</small>
            </span>
          </span>
        </div>
      </div>

      <div class="actions">
        <button type="button" @click="openSetup">new</button>
        <button type="button" :disabled="!canUndo" @click="undo">undo</button>
        <button type="button" :disabled="!canPlay" @click="resign">resign</button>
        <button type="button" @click="flipped = !flipped">flip</button>
        <button type="button" @click="toggleRules">{{ showRules ? "close" : "rules" }}</button>
        <button type="button" :disabled="!scorePlain()" @click="copyScore">
          {{ scoreCopied ? "copied" : "copy moves" }}
        </button>
      </div>

      <div v-if="promo" class="promote">
        <span>promote</span>
        <button
          v-for="choice in promoteChoices"
          :key="choice.id"
          type="button"
          @click="choosePromo(choice.id)"
        >
          {{ choice.label }}
        </button>
      </div>

      <div v-if="showRules" class="rules">
        <p>
          glinski's hexagonal chess. ninety-one cells. files a to l, with j skipped.
          ranks 1 to 11. the center is f6. white sits at the bottom.
        </p>
        <p>
          rooks slide through edges, six ways. bishops slide through corners and stay on one
          colour. queens do both. kings step one cell in any of those twelve directions.
          kings do not castle.
        </p>
        <p>knights jump two cells through edges, then one cell at a sixty-degree turn.</p>
        <p>
          pawns step straight ahead on their file. from a friendly pawn-start cell they may
          step two, when both cells are empty. they capture one cell forward, sixty degrees
          off the file, including en passant. a pawn that reaches the far end of a file
          promotes.
        </p>
        <p>
          checkmate wins. stalemate wins for the side that delivered it. three repeats,
          fifty moves with no capture or pawn move, or king against a lone king or a king
          and one minor piece, are draws.
        </p>
        <p>type a square, such as g1, to select it or play it. flip turns the board around.</p>
      </div>

      <div class="moves-head">
        <span>moves</span>
        <span class="steps">
          <button type="button" :disabled="view === 0" @click="step(-1)">prev</button>
          <button type="button" :disabled="atEnd" @click="step(1)">next</button>
          <button v-if="!atEnd" type="button" @click="jumpEnd">latest</button>
        </span>
      </div>

      <p v-if="!history.length" class="empty">no moves yet.</p>
      <ol v-else ref="listEl" class="moves">
        <li v-for="row in rows" :key="row.n">
          <span class="num">{{ row.n }}.</span>
          <button
            type="button"
            :class="{ on: view === row.wPly }"
            @click="view = row.wPly"
          >
            {{ row.w }}
          </button>
          <button
            v-if="row.b"
            type="button"
            :class="{ on: view === row.bPly }"
            @click="view = row.bPly"
          >
            {{ row.b }}
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
          :class="{ flipped }"
          :viewBox="boardBox.viewBox"
          :width="boardBox.width"
          :height="boardBox.height"
          role="img"
          aria-label="hexagonal chess board"
          @click="onBoardClick"
          @pointerover="onOver"
          @pointerleave="hoverIndex = null"
        >
          <polygon
            v-for="cell in cells"
            :key="cell.key"
            :points="cell.points"
            class="cell"
            :class="cellClass(cell)"
            :data-cell="cell.key"
            role="button"
            :aria-label="cellLabel(cell)"
          />

          <g class="dots" aria-hidden="true">
            <circle
              v-for="index in quietDots"
              :key="'dot-' + index"
              :cx="cells[index].x"
              :cy="cells[index].y"
              r="4.4"
            />
            <circle
              v-for="index in captureDots"
              :key="'cap-' + index"
              class="cap"
              :cx="cells[index].x"
              :cy="cells[index].y"
              r="15"
            />
          </g>

          <g class="pieces">
            <g
              v-for="item in placed"
              :key="item.index + item.color + item.kind"
              class="piece"
              :class="item.color"
              :transform="pieceTransform(item)"
            >
              <path v-for="(d, index) in GLYPH[item.kind]" :key="index" :d="d" />
            </g>
          </g>

          <g v-if="ghost" class="piece ghost" :class="ghost.color" :transform="pieceTransform(ghost)">
            <path v-for="(d, index) in GLYPH[ghost.kind]" :key="index" :d="d" />
          </g>

          <circle
            v-if="lastMove"
            class="last-ring"
            :cx="cells[lastMove.to].x"
            :cy="cells[lastMove.to].y"
            r="16"
          />

          <g class="coords" aria-hidden="true">
            <text v-for="label in fileLabels" :key="'f-' + label.text" :x="label.x" :y="label.y">
              {{ label.text }}
            </text>
            <text v-for="label in rankLabels" :key="'r-' + label.text" :x="label.x" :y="label.y">
              {{ label.text }}
            </text>
          </g>
        </svg>
      </div>

      <div class="zoom">
        <button type="button" aria-label="zoom out" @click="zoomBy(1 / 1.18)">−</button>
        <button type="button" aria-label="zoom in" @click="zoomBy(1.18)">+</button>
        <button type="button" aria-label="fit board" @click="fit">fit</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showSetup" class="setup-shade" @click.self="showSetup = false">
        <form class="setup-pop" @submit.prevent="startGame">
          <div class="pop-bar">
            <span>new game</span>
            <button type="button" @click="showSetup = false">close</button>
          </div>
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
          <div v-if="draft.mode === 'practice'" class="choice">
            <button
              type="button"
              :aria-pressed="draft.human === 'w'"
              @click="draft.human = 'w'"
            >
              play white
            </button>
            <button
              type="button"
              :aria-pressed="draft.human === 'b'"
              @click="draft.human = 'b'"
            >
              play black
            </button>
          </div>
          <p class="hint">white moves first. in practice, the bot plays the other side.</p>
          <button type="submit" class="start">start</button>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import {
  analyze,
  applyMove,
  boardBox,
  cellByKey,
  cells,
  chooseBotMove,
  fileLabels,
  FILES,
  notation,
  positionKey,
  rankLabels,
  startPosition,
} from "@/games/hexchess/logic.js";

const GLYPH = {
  p: [
    "M0-8.4a4.35 4.35 0 1 1 0.02 0a4.35 4.35 0 1 1-0.02 0",
    "M-6.3 12.2L-3.5 1.5Q0-1 3.5 1.5l2.8 10.7z",
  ],
  r: ["M-7.2 12.2H7.2V-8.8H4.2V-3.6H1.4V-8.8H-1.4V-3.6H-4.2V-8.8H-7.2z"],
  n: [
    "M-4.6 12.2H4.8L3.4 6.2 7.6 3.8 5.4 0.2 7.6-2.6 3.2-7.2 0.6-5.4 1.8-12.6-2.2-10.2-4.4-6.2-7.4-3.8-8.2 2.2-4.8 5.4z",
  ],
  b: [
    "M-2.15-12.7a2.15 2.15 0 1 0 4.3 0a2.15 2.15 0 1 0-4.3 0",
    "M0-9.4 6.6 12.2H-6.6zM-1.15-1h2.3V6h-2.3z",
  ],
  q: [
    "M-1.9-12.8a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0",
    "M-8.6 12.2-6.7-2.4-3.2 3.6 0-8.4 3.2 3.6 6.7-2.4 8.6 12.2z",
  ],
  k: [
    "M-7.3 12.2-5.7 0.2-2.7 3.8 0-2.2 2.7 3.8 5.7 0.2 7.3 12.2z",
    "M-1.25-11.6h2.5v2.05h2.15v2.5h-2.15v2.15h-2.5v-2.15h-2.15v-2.5h2.15z",
  ],
};

const promoteChoices = [
  { id: "q", label: "queen" },
  { id: "r", label: "rook" },
  { id: "b", label: "bishop" },
  { id: "n", label: "knight" },
];

const PIECE_NAME = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

function replay(moves) {
  let pos = startPosition();
  const keys = [positionKey(pos)];
  const positions = [pos];
  for (const move of moves) {
    pos = applyMove(pos, move);
    positions.push(pos);
    keys.push(positionKey(pos));
  }
  return { pos, keys, positions };
}

function sideName(color) {
  return color === "w" ? "white" : "black";
}

const history = ref([]);
const view = ref(0);
const mode = ref("hotseat");
const human = ref("w");
const flipped = ref(false);
const showSetup = ref(false);
const showRules = ref(false);
const selected = ref(null);
const promo = ref(null);
const hoverIndex = ref(null);
const resigned = ref(null);
const thinking = ref(false);
const typed = ref("");
const scoreCopied = ref(false);
const dragging = ref(false);
const ready = ref(false);
const listEl = ref(null);
const viewport = ref(null);
const panX = ref(0);
const panY = ref(0);
const zoom = ref(1);

const draft = reactive({ mode: "hotseat", human: "w" });

const trail = computed(() => replay(history.value));
const shown = computed(() => trail.value.positions[view.value] || trail.value.pos);
const atEnd = computed(() => view.value === history.value.length);
const analyzed = computed(() =>
  analyze(shown.value, trail.value.keys.slice(0, view.value + 1)),
);

const result = computed(() => {
  if (atEnd.value && resigned.value) {
    return {
      type: "resign",
      winner: resigned.value === "w" ? "b" : "w",
      check: false,
      moves: [],
    };
  }
  return analyzed.value;
});

const over = computed(() => result.value.type !== "play" && atEnd.value);

const canPlay = computed(() => {
  if (!atEnd.value || showSetup.value || thinking.value) return false;
  if (result.value.type !== "play") return false;
  if (mode.value === "practice" && shown.value.turn !== human.value) return false;
  return true;
});

const canUndo = computed(
  () => atEnd.value && (history.value.length > 0 || Boolean(resigned.value)),
);

const placed = computed(() => {
  const board = shown.value.board;
  const list = [];
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index];
    if (!piece) continue;
    list.push({ ...cells[index], color: piece.color, kind: piece.kind });
  }
  return list;
});

const lastMove = computed(() => (view.value > 0 ? history.value[view.value - 1] : null));

const quietDots = computed(() => {
  if (selected.value == null || !canPlay.value) return [];
  const seen = new Set();
  const dots = [];
  for (const move of result.value.moves) {
    if (move.from !== selected.value || move.capture || seen.has(move.to)) continue;
    seen.add(move.to);
    dots.push(move.to);
  }
  return dots;
});

const captureDots = computed(() => {
  if (selected.value == null || !canPlay.value) return [];
  const seen = new Set();
  const dots = [];
  for (const move of result.value.moves) {
    if (move.from !== selected.value || !move.capture || seen.has(move.to)) continue;
    seen.add(move.to);
    dots.push(move.to);
  }
  return dots;
});

const legalTargets = computed(() => new Set([...quietDots.value, ...captureDots.value]));

const ghost = computed(() => {
  if (hoverIndex.value == null || !legalTargets.value.has(hoverIndex.value)) return null;
  if (shown.value.board[hoverIndex.value]) return null;
  const piece = shown.value.board[selected.value];
  if (!piece) return null;
  return { ...cells[hoverIndex.value], color: piece.color, kind: piece.kind };
});

const rows = computed(() => {
  const list = [];
  for (let index = 0; index < history.value.length; index += 2) {
    list.push({
      n: list.length + 1,
      w: history.value[index]?.text || "",
      wPly: index + 1,
      b: history.value[index + 1]?.text || "",
      bPly: index + 2,
    });
  }
  return list;
});

const statusText = computed(() => {
  if (atEnd.value && resigned.value) {
    return `${sideName(resigned.value === "w" ? "b" : "w")} wins · resign`;
  }
  if (!atEnd.value) {
    if (view.value === 0) return "start";
    const base = `after ${history.value[view.value - 1].text}`;
    if (analyzed.value.type === "mate") return `${sideName(analyzed.value.winner)} wins · checkmate`;
    if (analyzed.value.check) return `${base} · check`;
    return base;
  }
  const kind = analyzed.value.type;
  if (kind === "mate") return `${sideName(analyzed.value.winner)} wins · checkmate`;
  if (kind === "stalemate") return `${sideName(analyzed.value.winner)} wins · stalemate`;
  if (kind === "fifty") return "draw · fifty moves";
  if (kind === "repeat") return "draw · repetition";
  if (kind === "material") return "draw · material";
  const who = sideName(shown.value.turn);
  if (thinking.value) return `${who} is thinking`;
  if (analyzed.value.check) return `${who} to move · check`;
  if (promo.value) return `${who} promotes`;
  return `${who} to move`;
});

const resultLine = computed(() => (over.value ? statusText.value : ""));

const readout = computed(() => {
  if (typed.value) return typed.value;
  if (hoverIndex.value != null) return cells[hoverIndex.value].key;
  if (selected.value != null) return cells[selected.value].key;
  return "–";
});

const stageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
}));

function cellClass(cell) {
  const piece = shown.value.board[cell.index];
  return {
    [`c${cell.color}`]: true,
    "is-own": canPlay.value && piece && piece.color === shown.value.turn,
    "is-selected": selected.value === cell.index,
    "is-legal": legalTargets.value.has(cell.index),
    "is-last":
      lastMove.value &&
      (lastMove.value.from === cell.index ||
        lastMove.value.to === cell.index ||
        (lastMove.value.enPassant && lastMove.value.epCapture === cell.index)),
    "is-check":
      (result.value.check || result.value.type === "mate") &&
      piece &&
      piece.kind === "k" &&
      piece.color === shown.value.turn,
    "is-promo": promo.value && promo.value.to === cell.index,
  };
}

function cellLabel(cell) {
  const piece = shown.value.board[cell.index];
  if (!piece) return cell.key;
  const side = piece.color === "w" ? "white" : "black";
  return `${cell.key}, ${side} ${PIECE_NAME[piece.kind]}`;
}

function pieceTransform(item) {
  const spin = item.color === "b" ? " rotate(180)" : "";
  return `translate(${item.x} ${item.y}) scale(1.22)${spin}`;
}

function scorePlain() {
  const lines = rows.value.map((row) => `${row.n}. ${row.w}${row.b ? `  ${row.b}` : ""}`);
  if (resultLine.value) lines.push(resultLine.value);
  return lines.join("\n");
}

async function copyScore() {
  const text = scorePlain();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    scoreCopied.value = true;
    window.setTimeout(() => {
      scoreCopied.value = false;
    }, 1400);
  } catch {
    window.prompt("copy this", text);
  }
}

let thinkGen = 0;
let typeTimer = 0;

function queueBot() {
  thinkGen += 1;
  const token = thinkGen;
  const snapshot = replay(history.value);
  const ended = analyze(snapshot.pos, snapshot.keys).type !== "play" || resigned.value;
  if (
    mode.value !== "practice" ||
    view.value !== history.value.length ||
    snapshot.pos.turn === human.value ||
    ended
  ) {
    thinking.value = false;
    return;
  }
  thinking.value = true;
  const seen = history.value.length;
  window.setTimeout(() => {
    if (token !== thinkGen || history.value.length !== seen) return;
    const move = chooseBotMove(snapshot.pos);
    if (token !== thinkGen || history.value.length !== seen) {
      thinking.value = false;
      return;
    }
    thinking.value = false;
    if (move) commit(move);
  }, 180);
}

function commit(move) {
  const before = replay(history.value).pos;
  const after = applyMove(before, move);
  const text = notation(before, move, after);
  history.value = [...history.value, { ...move, text }];
  view.value = history.value.length;
  selected.value = null;
  promo.value = null;
  hoverIndex.value = null;
  typed.value = "";
  queueBot();
}

function onCell(index) {
  if (!canPlay.value) return;
  const piece = shown.value.board[index];
  const options = result.value.moves.filter(
    (move) => move.from === selected.value && move.to === index,
  );
  if (selected.value != null && options.length) {
    if (options.some((move) => move.promotion)) {
      promo.value = { from: selected.value, to: index };
      return;
    }
    commit(options[0]);
    return;
  }
  if (piece && piece.color === shown.value.turn) {
    selected.value = selected.value === index ? null : index;
    promo.value = null;
    return;
  }
  selected.value = null;
  promo.value = null;
}

function choosePromo(kind) {
  if (!promo.value) return;
  const move = result.value.moves.find(
    (item) =>
      item.from === promo.value.from &&
      item.to === promo.value.to &&
      item.promotion === kind,
  );
  if (move) commit(move);
}

function undo() {
  thinkGen += 1;
  thinking.value = false;
  if (resigned.value) {
    resigned.value = null;
    return;
  }
  if (!atEnd.value || !history.value.length) return;
  let next = history.value.slice(0, -1);
  if (mode.value === "practice" && next.length) {
    const mid = replay(next);
    if (mid.pos.turn !== human.value) next = next.slice(0, -1);
  }
  history.value = next;
  view.value = next.length;
  selected.value = null;
  promo.value = null;
  queueBot();
}

function resign() {
  if (!canPlay.value) return;
  resigned.value = shown.value.turn;
  thinkGen += 1;
  thinking.value = false;
  selected.value = null;
  promo.value = null;
}

function step(delta) {
  view.value = Math.min(history.value.length, Math.max(0, view.value + delta));
  selected.value = null;
  promo.value = null;
}

function jumpEnd() {
  view.value = history.value.length;
  selected.value = null;
  promo.value = null;
}

function openSetup() {
  draft.mode = mode.value;
  draft.human = human.value;
  showRules.value = false;
  showSetup.value = true;
}

function toggleRules() {
  showRules.value = !showRules.value;
  if (showRules.value) showSetup.value = false;
}

function startGame() {
  thinkGen += 1;
  thinking.value = false;
  mode.value = draft.mode;
  human.value = draft.human;
  history.value = [];
  view.value = 0;
  resigned.value = null;
  selected.value = null;
  promo.value = null;
  hoverIndex.value = null;
  typed.value = "";
  showSetup.value = false;
  flipped.value = draft.mode === "practice" && draft.human === "b";
  nextTick(() => {
    fit();
    queueBot();
  });
}

function commitTyped() {
  const raw = typed.value;
  typed.value = "";
  const found = /^([a-z])(\d{1,2})$/.exec(raw);
  if (!found) return;
  const cell = cellByKey[`${found[1]}${Number(found[2])}`];
  if (cell) onCell(cell.index);
}

function onKey(event) {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    step(-1);
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    step(1);
    return;
  }
  if (event.key === "Escape") {
    typed.value = "";
    selected.value = null;
    promo.value = null;
    showSetup.value = false;
    showRules.value = false;
    return;
  }
  if (event.key === "Backspace") {
    typed.value = typed.value.slice(0, -1);
    window.clearTimeout(typeTimer);
    return;
  }
  if (event.key.length === 1 && FILES.includes(event.key.toLowerCase())) {
    event.preventDefault();
    typed.value = event.key.toLowerCase();
    window.clearTimeout(typeTimer);
    return;
  }
  if (/^\d$/.test(event.key) && FILES.includes(typed.value[0] || "")) {
    event.preventDefault();
    const letter = typed.value[0];
    const digits = `${typed.value.slice(1)}${event.key}`.slice(0, 2);
    typed.value = `${letter}${digits}`;
    const key = `${letter}${Number(digits)}`;
    window.clearTimeout(typeTimer);
    if (!cellByKey[key]) return;
    const longer = cells.some((cell) => cell.key !== key && cell.key.startsWith(key));
    if (!longer) commitTyped();
    else typeTimer = window.setTimeout(commitTyped, 450);
  }
}

let fitZoom = 1;
let userAdjusted = false;

function fit() {
  const box = viewport.value;
  if (!box) return;
  const next = Math.min(box.clientWidth / boardBox.width, box.clientHeight / boardBox.height);
  fitZoom = next > 0 ? next * 0.94 : 1;
  zoom.value = fitZoom;
  panX.value = (box.clientWidth - boardBox.width * fitZoom) / 2;
  panY.value = (box.clientHeight - boardBox.height * fitZoom) / 2;
  userAdjusted = false;
  ready.value = true;
}

function zoomAt(clientX, clientY, nextZoom) {
  const box = viewport.value;
  if (!box) return;
  const clamped = Math.min(fitZoom * 5, Math.max(fitZoom * 0.85, nextZoom));
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
  zoomAt(event.clientX, event.clientY, zoom.value * Math.exp(-delta * 0.0014));
  userAdjusted = true;
}

const pointers = new Map();
let drag = null;
let pinch = null;
let suppressClick = false;

function onPointerDown(event) {
  if (event.button != null && event.button !== 0) return;
  if (event.target instanceof Element && event.target.closest("button")) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  viewport.value?.setPointerCapture?.(event.pointerId);
  if (pointers.size === 1) {
    const key = event.target?.closest?.("[data-cell]")?.getAttribute("data-cell");
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: panX.value,
      panY: panY.value,
      moved: false,
      cell: key || null,
    };
    pinch = null;
  } else if (pointers.size >= 2) {
    drag = null;
    dragging.value = true;
    hoverIndex.value = null;
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
    hoverIndex.value = null;
    return;
  }
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && dx * dx + dy * dy > 36) {
    drag.moved = true;
    dragging.value = true;
    hoverIndex.value = null;
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
  if (ended?.moved) {
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);
  }
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

function onBoardClick(event) {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const key = event.target?.closest?.("[data-cell]")?.getAttribute("data-cell");
  const cell = key ? cellByKey[key] : null;
  if (cell) onCell(cell.index);
}

function onOver(event) {
  if (dragging.value) return;
  const key = event.target?.closest?.("[data-cell]")?.getAttribute("data-cell");
  hoverIndex.value = key && cellByKey[key] ? cellByKey[key].index : null;
}

let observer;

watch(view, async () => {
  await nextTick();
  listEl.value?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
});

onMounted(() => {
  observer = new ResizeObserver(() => {
    if (!userAdjusted) fit();
  });
  if (viewport.value) observer.observe(viewport.value);
  fit();
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => {
  thinkGen += 1;
  window.clearTimeout(typeTimer);
  observer?.disconnect();
  window.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
.hexchess {
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
  min-height: 46px;
  padding: 8px 10px;
  border: 1px solid #222;
  color: #555;
}

.plate.live {
  border-color: #fff;
  color: #fff;
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

.mark {
  width: 16px;
  height: 22px;
  fill: currentColor;
  stroke: none;
}

.mark.b {
  fill: #111;
  stroke: currentColor;
  stroke-width: 1.2;
}

.actions,
.choice,
.steps,
.promote {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.actions {
  margin-bottom: 12px;
}

.promote {
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #fff;
}

.promote span {
  color: #aaa;
  font-size: 13px;
  margin-right: 4px;
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

.rules {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  color: #bbb;
  font-size: 14px;
  line-height: 1.45;
}

.rules p,
.hint,
.empty {
  margin: 0;
}

.hint {
  color: #aaa;
  font-size: 14px;
  line-height: 1.4;
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

.moves .num {
  flex: none;
  width: 1.8em;
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
  padding: 0 0.45em 0 0;
}

.moves button.on,
.moves button:hover:not(:disabled) {
  color: #fff;
}

.moves li.result {
  color: #fff;
  border-bottom: 0;
}

.empty {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
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

.viewport.is-drag,
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
}

.board.flipped {
  transform: rotate(180deg);
  transform-origin: center;
}

.board.flipped .coords text {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(180deg);
}

.cell {
  stroke: #3a3a3a;
  stroke-width: 1;
  stroke-linejoin: round;
}

.cell.c0 {
  fill: #101010;
}

.cell.c1 {
  fill: #1b1b1b;
}

.cell.c2 {
  fill: #262626;
}

.cell.is-last {
  stroke: #fff;
  stroke-width: 1.7;
}

.cell.is-selected,
.cell.is-promo {
  stroke: #fff;
  stroke-width: 2.4;
}

.cell.is-check {
  fill: #343434;
  stroke: #fff;
  stroke-width: 2.2;
  animation: check-pulse 1.1s ease-in-out infinite;
}

.viewport.can-play .cell.is-legal,
.viewport.can-play .cell.is-own {
  cursor: pointer;
}

.viewport.can-play .cell.is-legal:hover,
.viewport.can-play .cell.is-own:hover {
  fill: #3a3a3a;
}

.dots,
.pieces,
.last-ring,
.coords {
  pointer-events: none;
}

.dots circle {
  fill: #fff;
}

.dots .cap {
  fill: none;
  stroke: #fff;
  stroke-width: 1.6;
}

.piece path {
  fill-rule: evenodd;
  stroke-linejoin: round;
}

.piece.w path {
  fill: #f3f3f3;
  stroke: #111;
  stroke-width: 0.7;
}

.piece.b path {
  fill: #0c0c0c;
  stroke: #f3f3f3;
  stroke-width: 1.15;
}

.ghost {
  opacity: 0.42;
}

.last-ring {
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
}

.coords {
  font-family: Arial, sans-serif;
  font-size: 13px;
  fill: #8a8a8a;
  text-anchor: middle;
  dominant-baseline: middle;
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

.setup-shade {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
}

.setup-pop {
  width: min(520px, 100%);
  display: grid;
  gap: 12px;
  padding: 22px 24px;
  border: 1px solid #fff;
  background: #000;
  color: #fff;
  font-family: Arial, sans-serif;
}

.pop-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 22px;
}

@keyframes check-pulse {
  50% {
    stroke-opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cell.is-check {
    animation: none;
  }
}

@media (max-width: 800px) {
  .hexchess {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(260px, 1fr) minmax(180px, 44dvh);
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
}
</style>
