<template>
  <div ref="shell" class="connect" :class="{ screen: full.active, folded }">
    <aside class="panel">
      <header class="top">
        <div>
          <h1>{{ info.name }}</h1>
          <p class="sub">{{ info.blurb }}</p>
        </div>
        <router-link class="back" to="/games">games</router-link>
      </header>

      <p class="readout" :class="{ dim: readout === '–' }">{{ readout }}</p>
      <p class="status" :class="{ over: shown.result || flag }" aria-live="polite">{{ statusText }}</p>
      <p v-if="badLink" class="warn">that link isn't a valid game.</p>

      <div class="plates">
        <div
          v-for="color in ['red', 'blue']"
          :key="color"
          class="plate"
          :class="[
            color,
            {
              live: !shown.result && !flag && shown.turn === color && atEnd,
              low: clock && shownClock(color) <= 30000 && shownClock(color) > 0,
            },
          ]"
        >
          <span class="side">
            <i :class="color" />
            <span>
              {{ color }}
              <small>{{ seatLabel(color) }}</small>
            </span>
          </span>
          <span class="plate-figures">
            <strong>{{ clock ? formatClock(shownClock(color)) : plateStat(color) }}</strong>
            <small v-if="clock">{{ plateStat(color) }}</small>
          </span>
        </div>
      </div>

      <button
        type="button"
        class="fold"
        :aria-expanded="!folded"
        @click="folded = !folded"
      >
        {{ folded ? "moves" : "hide" }}
      </button>

      <div class="actions">
        <button type="button" @click="toggleSetup">
          {{ showSetup ? "close" : "new" }}
        </button>
        <button type="button" @click="toggleRules">
          {{ showRules ? "close" : "rules" }}
        </button>
        <button type="button" :disabled="!canUndo" @click="undo">undo</button>
        <button v-if="canSwap" type="button" @click="push({ t: 'swap' })">swap</button>
        <button v-if="canPass" type="button" @click="push({ t: 'pass' })">pass</button>
        <button v-if="canCount" type="button" @click="push({ t: 'count' })">score</button>
        <button v-if="canDone" type="button" @click="commitTwixt">done</button>
        <button v-if="canLinkAll" type="button" @click="linkAll">all links</button>
        <button v-if="!shown.result" type="button" :disabled="!canAct" @click="push({ t: 'resign' })">
          resign
        </button>
        <button type="button" @click="copyLink">{{ copied ? "copied" : "copy link" }}</button>
        <button type="button" :disabled="!log.length" @click="copyScore">
          {{ scoreCopied ? "copied" : "copy score" }}
        </button>
        <FullscreenButton :active="full.active" @toggle="full.toggle" />
      </div>

      <div v-if="shown.game === 'punct' && canAct" class="tray">
        <button
          v-for="kind in PUNCT_KINDS"
          :key="kind.id"
          type="button"
          :disabled="!shown.supply[shown.turn][kind.id]"
          :aria-pressed="punctKind === kind.id && lift == null"
          @click="chooseKind(kind.id)"
        >
          {{ kind.name }}<small v-if="kind.hint"> {{ kind.hint }}</small>
          <b>{{ shown.supply[shown.turn][kind.id] }}</b>
        </button>
        <button type="button" @click="rotate(1)">rotate</button>
        <button v-if="lift != null" type="button" @click="lift = null">drop</button>
      </div>

      <div class="moves-head">
        <span>moves</span>
        <span class="steps">
          <button type="button" :disabled="cursor === 0" @click="step(-1)">prev</button>
          <button type="button" :disabled="atEnd" @click="step(1)">next</button>
          <button v-if="!atEnd" type="button" @click="cursor = moves.length">latest</button>
        </span>
      </div>
      <p v-if="!log.length" class="empty">no moves yet.</p>
      <ol v-else ref="listEl" class="moves">
        <li v-for="(line, index) in log" :key="index" :class="{ on: cursor === index + 1 }">
          <button type="button" @click="cursor = index + 1">
            <span v-if="line.color" class="who">{{ line.color }}</span>
            {{ line.label }}
            <span v-if="line.time" class="time">{{ line.time }}</span>
          </button>
        </li>
        <li v-if="atEnd && (shown.result || flag)" class="result">{{ statusText }}</li>
      </ol>
    </aside>

    <div
      ref="viewport"
      class="viewport"
      :class="{ play: canAct }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    >
      <svg
        ref="svgEl"
        class="board"
        :class="{ flipped }"
        :viewBox="viewBox"
        role="application"
        :aria-label="`${info.name}. ${statusText}`"
      >
        <template v-if="board.family === 'cell'">
          <polygon
            v-for="partial in board.partials || []"
            :key="`p${partial.id}`"
            class="partial"
            :points="partial.points"
            :fill="partialFill(partial.id)"
          />
          <polygon
            v-if="board.game === 'sstar'"
            class="hub-star"
            :points="hubStar"
          />
          <polygon
            v-for="cell in board.cells"
            :key="cell.id"
            class="cell"
            :class="cellClass(cell)"
            :points="cell.points"
            @pointerenter="hover = { kind: 'cell', id: cell.id }"
          />
          <template v-if="board.game === 'punct'">
            <g
              v-for="piece in punctPieces"
              :key="piece.id"
              :transform="pieceShift(piece.level)"
              :opacity="piece.covered ? 0.45 : 1"
            >
              <polygon
                v-for="(id, index) in piece.cells"
                :key="id"
                :points="board.cells[id].points"
                :fill="piece.color === 'red' ? '#e23b3b' : '#3c7dff'"
                :stroke="winSet.has(id) ? '#fff' : '#000'"
                stroke-width="1.4"
              />
              <circle
                :cx="board.cells[piece.cells[0]].x"
                :cy="board.cells[piece.cells[0]].y"
                :r="board.scale * 0.28"
                fill="#111"
              />
            </g>
            <g v-if="ghost" :opacity="ghost.ok ? 0.55 : 0.25">
              <polygon
                v-for="id in ghost.ids"
                :key="`g${id}`"
                :points="board.cells[id].points"
                :fill="shown.turn === 'red' ? '#e23b3b' : '#3c7dff'"
              />
            </g>
          </template>
          <template v-else>
            <circle
              v-for="stone in stones"
              :key="`s${stone.id}`"
              class="stone"
              :class="stone.color"
              :cx="stone.x"
              :cy="stone.y"
              :r="board.scale * 0.68"
            />
            <circle
              v-if="ghost && board.game !== 'punct'"
              class="ghost"
              :class="shown.turn"
              :cx="ghost.x"
              :cy="ghost.y"
              :r="board.scale * 0.68"
            />
          </template>
        </template>

        <template v-else-if="board.family === 'bluding'">
          <line
            v-for="bridge in bludingGhosts"
            :key="`gh${bridge.id}`"
            class="bridge ghost-line"
            :class="[bridge.color, { hot: hover?.kind === 'bridge' && hover.id === bridge.id }]"
            :x1="bridge.px1"
            :y1="bridge.py1"
            :x2="bridge.px2"
            :y2="bridge.py2"
          />
          <line
            v-for="bridge in bludingPlayed"
            :key="`br${bridge.id}`"
            class="bridge"
            :class="[bridge.color, { win: winSet.has(bridge.id) }]"
            :x1="bridge.px1"
            :y1="bridge.py1"
            :x2="bridge.px2"
            :y2="bridge.py2"
          />
          <circle
            v-for="dot in board.red"
            :key="`rd${dot.id}`"
            class="dot red"
            :cx="dot.px"
            :cy="dot.py"
            r="7"
          />
          <circle
            v-for="dot in board.blue"
            :key="`bd${dot.id}`"
            class="dot blue"
            :cx="dot.px"
            :cy="dot.py"
            r="7"
          />
        </template>

        <template v-else>
          <rect class="twixt-mat" :x="board.bounds.x" :y="board.bounds.y" :width="board.bounds.w" :height="board.bounds.h" />
          <line
            v-for="link in twixtLinks"
            :key="link.key"
            class="link"
            :class="[link.color, { hint: link.hint, win: link.win }]"
            :x1="link.x1"
            :y1="link.y1"
            :x2="link.x2"
            :y2="link.y2"
          />
          <circle
            v-for="hole in board.holes"
            :key="hole.id"
            class="hole"
            :class="[hole.border, { peg: pegAt(hole.id), fresh: hole.id === draftPeg }]"
            :cx="hole.x"
            :cy="hole.y"
            :r="pegAt(hole.id) ? board.scale * 0.3 : board.scale * 0.11"
            :fill="pegFill(hole.id)"
          />
        </template>
        <g class="coords" aria-hidden="true">
          <text v-for="(label, index) in board.labels || []" :key="index" :x="label.x" :y="label.y">
            {{ label.text }}
          </text>
        </g>
      </svg>
      <div class="zoom" @pointerdown.stop>
        <button type="button" @click="flipped = !flipped">flip</button>
        <button type="button" @click="cam = { x: 0, y: 0, z: 1 }">fit</button>
        <button type="button" @click="cam.z = Math.min(3.2, cam.z * 1.15)">+</button>
        <button type="button" @click="cam.z = Math.max(0.55, cam.z / 1.15)">−</button>
      </div>
    </div>

    <Teleport v-if="shell" :to="shell">
      <div v-if="showSetup" class="setup-shade" @click.self="showSetup = false">
        <form class="setup-pop" @submit.prevent="start">
          <div class="pop-bar">
            <span>new game</span>
            <button type="button" @click="showSetup = false">close</button>
          </div>
          <p class="kicker">game</p>
          <div class="choice">
            <button
              v-for="game in GAMES"
              :key="game.id"
              type="button"
              :aria-pressed="form.game === game.id"
              @click="pickGame(game.id)"
            >
              {{ game.name }}
            </button>
          </div>
          <template v-if="formInfo.sizes.length > 1">
            <p class="kicker">size</p>
            <div class="choice">
              <button
                v-for="size in formInfo.sizes"
                :key="size"
                type="button"
                :aria-pressed="form.size === size"
                @click="form.size = size"
              >
                {{ sizeLabel(form.game, size) }}
              </button>
            </div>
          </template>
          <template v-if="form.game === 'punct'">
            <p class="kicker">rules</p>
            <div class="choice">
              <button
                type="button"
                :aria-pressed="form.punctRules !== 'basic'"
                @click="form.punctRules = 'standard'"
              >
                standard
              </button>
              <button
                type="button"
                :aria-pressed="form.punctRules === 'basic'"
                @click="form.punctRules = 'basic'"
              >
                basic
              </button>
            </div>
          </template>
          <template v-if="formInfo.pie">
            <p class="kicker">pie</p>
            <div class="choice">
              <button type="button" :aria-pressed="form.pie" @click="form.pie = true">pie on</button>
              <button type="button" :aria-pressed="!form.pie" @click="form.pie = false">pie off</button>
            </div>
          </template>
          <p class="kicker">table</p>
          <div class="choice">
            <button type="button" :aria-pressed="form.mode === 'hotseat'" @click="form.mode = 'hotseat'">
              hotseat
            </button>
            <button type="button" :aria-pressed="form.mode === 'practice'" @click="form.mode = 'practice'">
              practice
            </button>
          </div>
          <p class="kicker">clocks</p>
          <div class="choice">
            <button
              v-for="minutes in [0, 5, 10]"
              :key="minutes"
              type="button"
              :aria-pressed="form.minutes === minutes"
              @click="form.minutes = minutes"
            >
              {{ minutes === 0 ? "no clock" : minutes + " min" }}
            </button>
          </div>
          <div v-if="form.mode === 'practice'" class="choice">
            <button type="button" :aria-pressed="form.human === 'red'" @click="form.human = 'red'">
              play red
            </button>
            <button type="button" :aria-pressed="form.human === 'blue'" @click="form.human = 'blue'">
              play blue
            </button>
          </div>
          <button type="submit" class="start">start</button>
        </form>
      </div>
    </Teleport>

    <Teleport v-if="shell" :to="shell">
      <div v-if="showRules" class="setup-shade" @click.self="closeRules">
        <div class="setup-pop">
          <div class="pop-bar">
            <span>rules</span>
            <button type="button" @click="closeRules">close</button>
          </div>
          <div class="rules">
            <p v-for="(line, index) in ruleLines" :key="index">{{ line }}</p>
            <p>Type a square, such as h3, to play it. Flip turns the board around. A clock runs only on the turn.</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useFullscreen } from "@/games/fullscreen.js";
import FullscreenButton from "@/games/FullscreenButton.vue";
import { chooseMove } from "@/games/connect/bot.js";
import {
  GAMES,
  PUNCT_KINDS,
  apply,
  boardOf,
  botToMove,
  decodeMoves,
  describeMove,
  encodeMoves,
  footprint,
  gameInfo,
  initialState,
  knownGame,
  orientCount,
  punctView,
  rayCells,
  replay,
  scoreState,
  sizeLabel,
  stonesLeft,
  twixtCandidates,
} from "@/games/connect/logic.js";

const route = useRoute();
const shell = ref(null);
const full = useFullscreen(shell);
const svgEl = ref(null);
const listEl = ref(null);

function queryString(value) {
  return Array.isArray(value) ? value[0] : value || "";
}

function readLaunch() {
  const urlOwns = Boolean(
    queryString(route.query.g) || queryString(route.query.n) || queryString(route.query.m),
  );
  let saved = null;
  if (!urlOwns) {
    try {
      const raw = JSON.parse(window.localStorage.getItem("connect-setup") || "null");
      if (raw && typeof raw === "object") saved = raw;
    } catch {
      saved = null;
    }
  }
  const asked = queryString(route.query.g);
  const id = knownGame(asked) ? asked : !urlOwns && knownGame(saved?.game) ? saved.game : "hex";
  const info = gameInfo(id);
  const n = Number(queryString(route.query.n) || (!urlOwns ? saved?.size : ""));
  const options = {
    game: id,
    size: info.sizes.includes(n) ? n : info.sizeDefault,
    pie: queryString(route.query.pie) === "0" ? false : info.pie,
    punctRules: queryString(route.query.rules) === "basic" ? "basic" : "standard",
    mode: queryString(route.query.mode) === "practice" ? "practice" : "hotseat",
    human: queryString(route.query.as) === "blue" ? "blue" : "red",
    minutes: queryString(route.query.min) === "10" ? 10 : queryString(route.query.min) === "5" ? 5 : 0,
  };
  const decoded = decodeMoves(queryString(route.query.m));
  const played = decoded.length ? replay(options, decoded) : null;
  const flag = queryString(route.query.flag);
  return {
    options,
    moves: played && !played.error ? decoded : [],
    bad: Boolean(played && played.error),
    flag: flag === "red" || flag === "blue" ? flag : null,
  };
}

const launch = readLaunch();
const setup = ref(launch.options);
const form = ref({ ...launch.options });
const moves = ref(launch.moves);
const cursor = ref(launch.moves.length);
const badLink = ref(launch.bad);
const folded = ref(true);
const showSetup = ref(false);
const showRules = ref(false);

function introSeen() {
  try {
    const raw = JSON.parse(window.localStorage.getItem("connect-intro") || "[]");
    return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function rememberGame(id) {
  const seen = new Set(introSeen());
  seen.add(id);
  try {
    window.localStorage.setItem("connect-intro", JSON.stringify([...seen]));
  } catch {
    /* private mode */
  }
}

function closeRules() {
  if (showRules.value) rememberGame(setup.value.game);
  showRules.value = false;
}

function maybeIntro(gameId) {
  if (introSeen().includes(gameId)) return;
  showSetup.value = false;
  showRules.value = true;
}

if (!launch.moves.length) maybeIntro(launch.options.game);
const copied = ref(false);
const scoreCopied = ref(false);
const hover = ref(null);
const flipped = ref(false);
const typed = ref("");
const flag = ref(launch.flag);
const clockMarks = ref([]);
const moveTimes = ref([]);
const clock = ref(
  launch.options.minutes ? { red: launch.options.minutes * 60000, blue: launch.options.minutes * 60000 } : null,
);
const clockRunning = ref(Boolean(clock.value) && launch.moves.length > 0 && !launch.flag);
const draft = ref(null);
const punctKind = ref("se");
const punctOrient = ref(0);
const lift = ref(null);
const cam = ref({ x: 0, y: 0, z: 1 });

const shownPack = computed(() => replay(setup.value, moves.value.slice(0, cursor.value)));
const shown = computed(() => shownPack.value.state);
const atEnd = computed(() => cursor.value === moves.value.length);
const info = computed(() => gameInfo(shown.value.game));
const formInfo = computed(() => gameInfo(form.value.game));
const board = computed(() => boardOf(shown.value.game, shown.value.size));
const canAct = computed(
  () => atEnd.value && !shown.value.result && !flag.value && !botToMove(shown.value),
);
const canSwap = computed(() => canAct.value && shown.value.pieOpen);
const canPass = computed(
  () => canAct.value && (shown.value.game === "star" || shown.value.game === "sstar"),
);
const canCount = computed(() => canPass.value && shown.value.moveCount > 0);
const canUndo = computed(
  () => lift.value != null || draft.value != null || (atEnd.value && moves.value.length > 0),
);
const draftPeg = computed(() => (atEnd.value ? draft.value?.peg ?? null : null));
const canDone = computed(() => canAct.value && shown.value.game === "twixt" && draftPeg.value != null);
const canLinkAll = computed(() => canDone.value);

const viewBox = computed(() => {
  const bounds = board.value.bounds;
  const w = bounds.w / cam.value.z;
  const h = bounds.h / cam.value.z;
  const x = bounds.x + (bounds.w - w) / 2 + cam.value.x;
  const y = bounds.y + (bounds.h - h) / 2 + cam.value.y;
  return `${x} ${y} ${w} ${h}`;
});

const winSet = computed(() => new Set(shown.value.winIds || []));

const stones = computed(() => {
  if (!shown.value.stones) return [];
  return shown.value.stones.flatMap((stone, id) => {
    if (!stone) return [];
    const cell = board.value.cells[id];
    return [{ id, x: cell.x, y: cell.y, color: stone === 1 ? "red" : "blue" }];
  });
});

const punctPieces = computed(() =>
  shown.value.game === "punct"
    ? punctView(shown.value)
        .slice()
        .sort((a, b) => a.level - b.level || a.id - b.id)
    : [],
);

const ghost = computed(() => {
  if (!canAct.value || !hover.value || hover.value.kind !== "cell") return null;
  const id = hover.value.id;
  if (shown.value.game === "punct") {
    const piece = lift.value != null ? shown.value.pieces.find((item) => item.id === lift.value) : null;
    const kind = piece?.kind || punctKind.value;
    const orient = punctOrient.value;
    if (piece && !rayCells(board.value, piece.cells[0]).includes(id)) return null;
    const ids = footprint(board.value, kind, orient, id);
    if (!ids) return null;
    const move = piece
      ? { t: "shift", id: piece.id, to: id, orient }
      : { t: "place", kind, orient, id };
    return { ids, ok: apply(shown.value, move).ok, x: 0, y: 0 };
  }
  if (!shown.value.stones || shown.value.stones[id]) return null;
  const cell = board.value.cells[id];
  return { ids: [id], ok: true, x: cell.x, y: cell.y };
});

const bludingPlayed = computed(() =>
  board.value.family === "bluding"
    ? board.value.bridges.filter((bridge) => shown.value.taken[bridge.id])
    : [],
);

const bludingGhosts = computed(() => {
  if (board.value.family !== "bluding" || !canAct.value) return [];
  return board.value.bridges.filter((bridge) => {
    if (bridge.color !== shown.value.turn || shown.value.taken[bridge.id]) return false;
    if (bridge.cross != null && shown.value.taken[bridge.cross]) return false;
    return true;
  });
});

const twixtView = computed(() => {
  if (board.value.family !== "twixt") return { pegs: [], links: [] };
  const pegs = shown.value.pegs.slice();
  const removed = new Set((draft.value?.remove || []).map(pairKey));
  const links = shown.value.links.filter((link) => !removed.has(pairKey(link)));
  if (draftPeg.value != null) {
    pegs[draftPeg.value] = shown.value.turn === "red" ? 1 : 2;
    for (const link of draft.value.add || []) links.push(link);
  }
  return { pegs, links };
});

const twixtLinks = computed(() => {
  if (board.value.family !== "twixt") return [];
  const drawn = twixtView.value.links.map((link) => linkLine(link, false));
  if (!canAct.value || draftPeg.value == null) return drawn;
  const have = new Set(twixtView.value.links.map(pairKey));
  for (const link of twixtCandidates(shown.value, draftPeg.value, draft.value.remove || [], false)) {
    if (have.has(pairKey(link))) continue;
    drawn.push(linkLine(link, true));
  }
  return drawn;
});

const scores = computed(() => scoreState(shown.value));

const log = computed(() => {
  let state = initialState(setup.value);
  return moves.value.map((move, index) => {
    const color = move.t === "swap" || move.t === "count" ? "" : state.turn;
    const label = describeMove(state, move);
    const next = apply(state, move);
    if (next.ok) state = next.state;
    const time = moveTimes.value[index];
    return { color, label, time: typeof time === "number" ? formatClock(time) : "" };
  });
});

const readout = computed(() => {
  if (typed.value) return typed.value;
  if (hover.value?.kind === "cell" && board.value.cells) {
    return board.value.cells[hover.value.id]?.name || "–";
  }
  if (hover.value?.kind === "hole") return board.value.holes[hover.value.id]?.name || "–";
  if (hover.value?.kind === "bridge") return board.value.bridges[hover.value.id]?.name || "–";
  const last = moves.value[cursor.value - 1];
  if (!last) return "–";
  return describeMove(shown.value, last) || "–";
});

const statusText = computed(() => {
  const state = shown.value;
  if (!atEnd.value) return "looking back";
  if (flag.value) return `${flag.value} wins · time`;
  if (state.result) {
    const score =
      state.result.red == null ? "" : ` · ${state.result.red}–${state.result.blue}`;
    if (state.result.winner === "draw") {
      return state.result.reason === "center" ? `draw${score}` : "draw";
    }
    if (state.result.reason === "resign") return `${state.result.winner} wins · resignation`;
    if (state.result.reason === "center") return `${state.result.winner} takes the center${score}`;
    if (state.result.reason === "connect") return `${state.result.winner} connects`;
    return `${state.result.winner} wins${score}`;
  }
  if (state.pieOpen) return "blue may swap";
  if (draftPeg.value != null) return "add links, then done";
  if (lift.value != null) return "slide the punct, r rotates";
  const who = botToMove(state) ? `${state.turn} is thinking` : `${state.turn} to move`;
  return who;
});

const ruleLines = computed(() => RULES[shown.value.game] || []);

const hubStar = computed(() => {
  if (board.value.game !== "sstar") return "";
  const outer = board.value.scale * 0.48;
  const inner = outer * 0.42;
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? outer : inner;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${Math.cos(ang) * rad},${Math.sin(ang) * rad}`);
  }
  return pts.join(" ");
});

function freshClock(minutes) {
  return minutes ? { red: minutes * 60000, blue: minutes * 60000 } : null;
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000 - 1e-9));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function shownClock(color) {
  if (!clock.value) return 0;
  if (atEnd.value) return clock.value[color];
  if (cursor.value === 0) return setup.value.minutes * 60000;
  return clockMarks.value[cursor.value - 1]?.[color] ?? clock.value[color];
}

function seatLabel(color) {
  const seat = shown.value.seats[color];
  if (shown.value.mode === "practice") return seat === shown.value.humanSeat ? "you" : "bot";
  return seat === "A" ? "first" : "second";
}

function plateStat(color) {
  if (shown.value.game === "punct") return stonesLeft(shown.value, color);
  if (scores.value) return scores.value[color];
  if (!shown.value.stones && !shown.value.pegs) {
    if (shown.value.taken) {
      return shown.value.taken.filter((bit, id) => bit && board.value.bridges[id].color === color).length;
    }
    return "";
  }
  const code = color === "red" ? 1 : 2;
  const list = shown.value.stones || shown.value.pegs;
  return list.filter((bit) => bit === code).length;
}

function cellClass(cell) {
  const tint = [];
  if (cell.center) tint.push("center");
  if (cell.corner) tint.push("corner");
  if (cell.edge) tint.push("edge");
  if (cell.tint?.includes("red")) tint.push("red-edge");
  if (cell.tint?.includes("blue")) tint.push("blue-edge");
  if (cell.sides?.length && shown.value.game === "y") tint.push("y-edge");
  if (cell.sides?.includes("q+") || cell.sides?.includes("q-")) tint.push("pair-q");
  if (cell.sides?.includes("r+") || cell.sides?.includes("r-")) tint.push("pair-r");
  if (cell.sides?.includes("s+") || cell.sides?.includes("s-")) tint.push("pair-s");
  if (winSet.value.has(cell.id) && shown.value.game !== "punct") tint.push("win");
  if (edgeOwner(cell.id)) tint.push(edgeOwner(cell.id));
  if (shown.value.last?.t === "cell" && shown.value.last.id === cell.id && atEnd.value) tint.push("last");
  return tint;
}

function edgeOwner(id) {
  const owned = scores.value?.owned;
  if (!owned || !owned.get) return "";
  const code = owned.get(id);
  if (code === 1) return "owned-red";
  if (code === 2) return "owned-blue";
  return "";
}

function partialFill(id) {
  const touch = scores.value?.touch;
  if (!touch) return "#242424";
  const red = touch[0].includes(id);
  const blue = touch[1].includes(id);
  if (red && blue) return "#6d5878";
  if (red) return "#6e3038";
  if (blue) return "#2c4d86";
  return "#141414";
}

function pieceShift(level) {
  return `translate(${level * 5} ${level * -4})`;
}

function pairKey(link) {
  const [a, b] = link;
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function linkLine(link, hint) {
  const [a, b] = link;
  const pa = board.value.holes[a];
  const pb = board.value.holes[b];
  const color = (twixtView.value.pegs[a] === 1 ? "red" : "blue");
  const win = winSet.value.has(a) && winSet.value.has(b);
  return {
    key: `${pairKey(link)}${hint ? "h" : ""}`,
    x1: pa.x,
    y1: pa.y,
    x2: pb.x,
    y2: pb.y,
    color,
    hint,
    win,
  };
}

function pegAt(id) {
  return twixtView.value.pegs[id] || 0;
}

function pegFill(id) {
  const peg = pegAt(id);
  if (peg === 1) return "#e23b3b";
  if (peg === 2) return "#3c7dff";
  return "transparent";
}

function toggleSetup() {
  showSetup.value = !showSetup.value;
  if (showSetup.value) closeRules();
}

function toggleRules() {
  if (showRules.value) {
    closeRules();
    return;
  }
  showRules.value = true;
  showSetup.value = false;
}

function pickGame(id) {
  const next = gameInfo(id);
  form.value = {
    ...form.value,
    game: id,
    size: next.sizes.includes(form.value.size) ? form.value.size : next.sizeDefault,
    pie: next.pie,
  };
}

function start() {
  const next = gameInfo(form.value.game);
  setup.value = {
    game: next.id,
    size: next.sizes.includes(form.value.size) ? form.value.size : next.sizeDefault,
    pie: Boolean(form.value.pie) && next.pie,
    punctRules: form.value.punctRules === "basic" ? "basic" : "standard",
    mode: form.value.mode === "practice" ? "practice" : "hotseat",
    human: form.value.human === "blue" ? "blue" : "red",
    minutes: form.value.minutes === 10 ? 10 : form.value.minutes === 5 ? 5 : 0,
  };
  moves.value = [];
  cursor.value = 0;
  draft.value = null;
  lift.value = null;
  typed.value = "";
  flag.value = null;
  clockMarks.value = [];
  moveTimes.value = [];
  clock.value = freshClock(setup.value.minutes);
  clockRunning.value = false;
  badLink.value = false;
  cam.value = { x: 0, y: 0, z: 1 };
  showSetup.value = false;
  window.localStorage.setItem(
    "connect-setup",
    JSON.stringify({ game: setup.value.game, size: setup.value.size }),
  );
  maybeIntro(setup.value.game);
  punctKind.value = "se";
  punctOrient.value = 0;
  document.title = `${next.name} - eire`;
}

function push(move) {
  if (!canAct.value && move.t !== "resign") return;
  if (move.t === "resign" && (!atEnd.value || shown.value.result)) return;
  const next = apply(shown.value, move);
  if (!next.ok) return;
  if (!atEnd.value) {
    moves.value = moves.value.slice(0, cursor.value);
    clockMarks.value = clockMarks.value.slice(0, cursor.value);
    moveTimes.value = moveTimes.value.slice(0, cursor.value);
  }
  if (clock.value) {
    const snap = { red: clock.value.red, blue: clock.value.blue };
    clockMarks.value = [...clockMarks.value, snap];
    moveTimes.value = [...moveTimes.value, snap[shown.value.turn]];
    clockRunning.value = true;
  }
  moves.value = [...moves.value, move];
  cursor.value = moves.value.length;
  draft.value = null;
  lift.value = null;
  typed.value = "";
}

function undo() {
  window.clearTimeout(botTimer);
  if (lift.value != null || draft.value != null) {
    lift.value = null;
    draft.value = null;
    return;
  }
  if (!atEnd.value || !moves.value.length) return;
  let next = moves.value.slice(0, -1);
  if (setup.value.mode === "practice" && next.length) {
    const state = replay(setup.value, next).state;
    if (botToMove(state)) next = next.slice(0, -1);
  }
  clockMarks.value = clockMarks.value.slice(0, next.length);
  moveTimes.value = moveTimes.value.slice(0, next.length);
  if (clock.value) {
    const mark = clockMarks.value[clockMarks.value.length - 1];
    clock.value = mark ? { red: mark.red, blue: mark.blue } : freshClock(setup.value.minutes);
    clockRunning.value = next.length > 0;
  }
  flag.value = null;
  moves.value = next;
  cursor.value = next.length;
}

function step(delta) {
  cursor.value = Math.min(moves.value.length, Math.max(0, cursor.value + delta));
}

function chooseKind(id) {
  punctKind.value = id;
  punctOrient.value = 0;
  lift.value = null;
}

function rotate(step) {
  const piece = lift.value != null ? shown.value.pieces.find((item) => item.id === lift.value) : null;
  const kind = piece?.kind || punctKind.value;
  if (kind === "am" && piece) {
    const base = piece.orient >= 6 ? 6 : 0;
    const local = (punctOrient.value - base + step + 6) % 6;
    punctOrient.value = base + ((local % 6) + 6) % 6;
    return;
  }
  const count = orientCount(kind);
  punctOrient.value = (punctOrient.value + step + count) % count;
}

function commitTwixt() {
  if (!canDone.value) return;
  push({
    t: "twixt",
    hole: draft.value.peg,
    add: draft.value.add || [],
    remove: draft.value.remove || [],
  });
}

function linkAll() {
  if (!canDone.value) return;
  const add = twixtCandidates(shown.value, draft.value.peg, draft.value.remove || [], true);
  draft.value = { ...draft.value, add };
}

function copyLink() {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("g", setup.value.game);
  url.searchParams.set("n", String(setup.value.size));
  url.searchParams.set("pie", setup.value.pie ? "1" : "0");
  url.searchParams.set("mode", setup.value.mode);
  if (setup.value.mode === "practice") url.searchParams.set("as", setup.value.human);
  if (setup.value.game === "punct") url.searchParams.set("rules", setup.value.punctRules);
  if (setup.value.minutes) url.searchParams.set("min", String(setup.value.minutes));
  if (flag.value) url.searchParams.set("flag", flag.value);
  if (moves.value.length) url.searchParams.set("m", encodeMoves(moves.value));
  navigator.clipboard.writeText(url.toString()).then(() => {
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1200);
  });
}

function boardPoint(event) {
  const svg = svgEl.value;
  if (!svg) return null;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

function nearestCell(point) {
  let best = null;
  let bestD = board.value.scale * 0.95;
  for (const cell of board.value.cells) {
    const d = Math.hypot(cell.x - point.x, cell.y - point.y);
    if (d < bestD) {
      bestD = d;
      best = cell.id;
    }
  }
  return best;
}

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitAt(point) {
  if (board.value.family === "bluding") {
    let best = null;
    let bestD = 16;
    const pool = canAct.value ? bludingGhosts.value.concat(bludingPlayed.value) : bludingPlayed.value;
    for (const bridge of pool) {
      const d = distToSeg(point.x, point.y, bridge.px1, bridge.py1, bridge.px2, bridge.py2);
      if (d < bestD) {
        bestD = d;
        best = { kind: "bridge", id: bridge.id };
      }
    }
    return best;
  }
  if (board.value.family === "twixt") {
    let link = null;
    let linkD = board.value.scale * 0.62;
    for (const item of twixtLinks.value) {
      const d = distToSeg(point.x, point.y, item.x1, item.y1, item.x2, item.y2);
      if (d < linkD) {
        linkD = d;
        link = item;
      }
    }
    let hole = null;
    let holeD = board.value.scale * 0.45;
    for (const item of board.value.holes) {
      const d = Math.hypot(item.x - point.x, item.y - point.y);
      if (d < holeD) {
        holeD = d;
        hole = item.id;
      }
    }
    if (link && linkD < holeD) return { kind: "link", key: link.key, hint: link.hint };
    if (hole != null) return { kind: "hole", id: hole };
    return null;
  }
  const id = nearestCell(point);
  return id == null ? null : { kind: "cell", id };
}

let drag = null;

function onPointerDown(event) {
  if (event.button != null && event.button !== 0) return;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  drag = { x: event.clientX, y: event.clientY, moved: false, cam: { ...cam.value } };
}

function onPointerMove(event) {
  const point = boardPoint(event);
  if (drag) {
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (dx * dx + dy * dy > 16) drag.moved = true;
    if (drag.moved && svgEl.value) {
      const rect = svgEl.value.getBoundingClientRect();
      const bounds = board.value.bounds;
      const w = bounds.w / drag.cam.z;
      const h = bounds.h / drag.cam.z;
      cam.value = {
        z: drag.cam.z,
        x: drag.cam.x - (dx / rect.width) * w,
        y: drag.cam.y - (dy / rect.height) * h,
      };
    }
    return;
  }
  hover.value = point ? hitAt(point) : null;
}

function onPointerUp(event) {
  const moved = drag?.moved;
  drag = null;
  if (moved || !canAct.value) return;
  const point = boardPoint(event);
  if (!point) return;
  const hit = hitAt(point);
  hover.value = hit;
  if (!hit) return;
  if (hit.kind === "cell") playCell(hit.id);
  else if (hit.kind === "bridge") push({ t: "bridge", id: hit.id });
  else if (hit.kind === "hole") playHole(hit.id);
  else if (hit.kind === "link") playLink(hit);
}

function playCell(id) {
  if (shown.value.game === "punct") {
    const top = punctPieces.value.find((piece) => piece.cells.includes(id) && !piece.covered);
    if (lift.value != null) {
      push({ t: "shift", id: lift.value, to: id, orient: punctOrient.value });
      return;
    }
    if (top && top.color === shown.value.turn) {
      lift.value = top.id;
      punctOrient.value = top.orient;
      return;
    }
    if (top) return;
    push({ t: "place", kind: punctKind.value, orient: punctOrient.value, id });
    return;
  }
  push({ t: "cell", id });
}

function playHole(id) {
  const hole = board.value.holes[id];
  if (shown.value.pegs[id]) return;
  if (hole.border && hole.border !== shown.value.turn) return;
  draft.value = { peg: id, add: [], remove: [] };
}

function playLink(hit) {
  if (draft.value?.peg == null) return;
  const key = hit.key.replace(/h$/, "");
  const [a, b] = key.split("-").map(Number);
  const pair = [a, b];
  if (hit.hint) {
    const add = draft.value.add || [];
    const exists = add.some((link) => pairKey(link) === pairKey(pair));
    draft.value = {
      ...draft.value,
      add: exists ? add.filter((link) => pairKey(link) !== pairKey(pair)) : add.concat([pair]),
    };
    return;
  }
  const mine = shown.value.pegs[a] === (shown.value.turn === "red" ? 1 : 2);
  if (!mine) return;
  const remove = draft.value.remove || [];
  const exists = remove.some((link) => pairKey(link) === pairKey(pair));
  draft.value = {
    ...draft.value,
    remove: exists
      ? remove.filter((link) => pairKey(link) !== pairKey(pair))
      : remove.concat([pair]),
  };
}

function onWheel(event) {
  const point = boardPoint(event);
  const nextZ = Math.min(3.2, Math.max(0.55, cam.value.z * (event.deltaY > 0 ? 0.9 : 1.12)));
  if (!point) {
    cam.value = { ...cam.value, z: nextZ };
    return;
  }
  const bounds = board.value.bounds;
  const oldW = bounds.w / cam.value.z;
  const oldH = bounds.h / cam.value.z;
  const newW = bounds.w / nextZ;
  const newH = bounds.h / nextZ;
  const ox = bounds.x + (bounds.w - oldW) / 2 + cam.value.x;
  const oy = bounds.y + (bounds.h - oldH) / 2 + cam.value.y;
  const fx = (point.x - ox) / oldW;
  const fy = (point.y - oy) / oldH;
  const nx = bounds.x + (bounds.w - newW) / 2;
  const ny = bounds.y + (bounds.h - newH) / 2;
  cam.value = {
    z: nextZ,
    x: point.x - fx * newW - nx,
    y: point.y - fy * newH - ny,
  };
}

function onKey(event) {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (event.key === "Backspace") {
    typed.value = typed.value.slice(0, -1);
    window.clearTimeout(typeTimer);
    return;
  }
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
  if ((event.ctrlKey || event.metaKey) && (event.key === "z" || event.key === "Z")) {
    event.preventDefault();
    undo();
    return;
  }
  if ((event.key === "z" || event.key === "Z") && !event.shiftKey && !typed.value) {
    event.preventDefault();
    undo();
    return;
  }
  if ((event.key === "r" || event.key === "R") && !typed.value && shown.value.game === "punct") {
    rotate(event.shiftKey ? -1 : 1);
    return;
  }
  if (event.key.length === 1 && /[a-z]/i.test(event.key) && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    const letter = event.key.toLowerCase();
    typed.value = typed.value && /\d/.test(typed.value) ? `${typed.value}${letter}`.slice(0, 6) : letter;
    window.clearTimeout(typeTimer);
    const found = nameHit(typed.value);
    if (found.exact && !found.longer) commitTyped();
    else if (found.exact) typeTimer = window.setTimeout(commitTyped, 450);
    return;
  }
  if (/^\d$/.test(event.key) && /[a-z]/.test(typed.value[0] || "")) {
    event.preventDefault();
    typed.value = `${typed.value[0]}${typed.value.slice(1)}${event.key}`.slice(0, 6);
    window.clearTimeout(typeTimer);
    const found = nameHit(typed.value);
    if (!found.exact) return;
    if (found.longer) typeTimer = window.setTimeout(commitTyped, 450);
    else commitTyped();
    return;
  }
  if (event.key === "Enter") {
    if (typed.value) commitTyped();
    else commitTwixt();
    return;
  }
  if (event.key === "Escape") {
    typed.value = "";
    showSetup.value = false;
    closeRules();
    lift.value = null;
    draft.value = null;
  }
}

function nameHit(raw) {
  const name = raw.toLowerCase();
  let pool = [];
  if (board.value.family === "cell") {
    pool = (board.value.cells || []).map((cell) => ({ name: cell.name, play: () => playCell(cell.id) }));
  } else if (board.value.family === "bluding") {
    pool = board.value.bridges
      .filter((bridge) => bridge.color === shown.value.turn)
      .map((bridge) => ({ name: bridge.name, play: () => push({ t: "bridge", id: bridge.id }) }));
  } else if (board.value.family === "twixt") {
    pool = board.value.holes.map((hole) => ({ name: hole.name, play: () => playHole(hole.id) }));
  }
  const exact = pool.find((item) => item.name === name);
  const longer = pool.some((item) => item.name.startsWith(name) && item.name !== name);
  return { exact, longer };
}

function commitTyped() {
  const rawName = typed.value;
  typed.value = "";
  window.clearTimeout(typeTimer);
  const found = nameHit(rawName);
  if (found.exact && canAct.value) found.exact.play();
}

function copyScore() {
  const lines = log.value.map((line, index) => {
    const who = line.color ? `${line.color} ` : "";
    return `${index + 1}. ${who}${line.label}${line.time ? `  ${line.time}` : ""}`;
  });
  if (atEnd.value && (shown.value.result || flag.value)) lines.push(statusText.value);
  const text = lines.join("\n");
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    scoreCopied.value = true;
    window.setTimeout(() => {
      scoreCopied.value = false;
    }, 1200);
  });
}

let botTimer = 0;
let clockTimer = 0;
let lastTick = 0;
let typeTimer = 0;
function scheduleBot() {
  window.clearTimeout(botTimer);
  if (flag.value || !atEnd.value || !botToMove(shown.value)) return;
  const options = { ...setup.value };
  const history = moves.value.slice();
  botTimer = window.setTimeout(() => {
    if (flag.value) return;
    const state = replay(options, history).state;
    if (!botToMove(state)) return;
    const move = chooseMove(state);
    if (!move || !apply(state, move).ok) return;
    if (cursor.value !== moves.value.length || moves.value.length !== history.length) return;
    moves.value = history.concat([move]);
    cursor.value = moves.value.length;
  }, 220);
}

watch([moves, cursor, setup], scheduleBot, { immediate: true });
watch(cursor, () => {
  draft.value = null;
  lift.value = null;
});
watch(
  () => shown.value.game,
  (id) => {
    document.title = `${gameInfo(id).name} - eire`;
  },
  { immediate: true },
);
watch(log, () => {
  const list = listEl.value;
  if (!list) return;
  list.scrollTop = list.scrollHeight;
});

function tickClock() {
  const now = performance.now();
  const dt = lastTick ? now - lastTick : 0;
  lastTick = now;
  if (!clock.value || !clockRunning.value || !atEnd.value || flag.value || shown.value.result) return;
  const side = shown.value.turn;
  const next = Math.max(0, clock.value[side] - dt);
  clock.value = { ...clock.value, [side]: next };
  if (next <= 0) {
    window.clearTimeout(botTimer);
    flag.value = side === "red" ? "blue" : "red";
    clockRunning.value = false;
  }
}

onMounted(() => {
  lastTick = performance.now();
  clockTimer = window.setInterval(tickClock, 200);
  window.addEventListener("keydown", onKey);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  window.clearTimeout(botTimer);
  window.clearTimeout(typeTimer);
  window.clearInterval(clockTimer);
});

const RULES = {
  bluding: [
    "Red links the square dots and is trying to join the top row to the bottom. Blue links the round dots and is trying to join left to right.",
    "A move draws one link between two of your dots that share a side. If that link would cross the other color, it is blocked.",
    "After the first link, blue may swap seats. The link stays red. Undo and resign are in the panel.",
  ],
  hex: [
    "Red joins the left edge to the right. Blue joins the top edge to the bottom. A corner counts for both edges it touches.",
    "Take turns placing one stone on an empty hex. The first to join their two edges wins. The game cannot be drawn.",
    "After the opening stone, blue may swap seats. Drag the board to pan, and use the wheel to zoom.",
  ],
  twixt: [
    "The corners are missing. Red owns the top and bottom rows, blue the left and right, and neither may play in the other's border.",
    "Place one peg, then add or remove your own links. A link joins two of your pegs a knight's move apart, and no link may cross another.",
    "Pegs on your border belong to that border. Join the two borders with a chain of links. Then press done. After the first peg, blue may swap.",
  ],
  punct: [
    "Each side has 18 pieces of three dots: four straight with the punct at an end, two with it in the middle, two angles of each hand, two with the punct on the corner, and six triangles. Red moves first.",
    "Place a piece on three empty spaces, or move one you have already played. Its punct slides any distance in a straight line, over anything, and the piece may then rotate around that punct. R rotates the ghost.",
    "To stack, land the punct on a dot of your own. Straight and angle pieces may bridge: the two ends rest on the same level and the middle dot hangs. A covered dot is blocked and drops out of the connection. Triangles cannot bridge.",
    "Visible dots that share a side are connected, whatever their level. Either player may join any opposite pair. The three pairs are marked gold, green, and purple.",
    "Standard: a new piece cannot touch the center nineteen, even in part. Only a move can enter it. If someone places their last piece and nobody has connected, the center majority wins. Basic lifts the center ban after the opening and draws if the pieces run out with no connection.",
  ],
  star: [
    "The sides alternate, so the border has an odd count and the score cannot tie on a full board.",
    "A connected group that touches three or more border cells scores two less than the number it touches. Groups that touch fewer score nothing.",
    "Pass, or press score, when the rest cannot change the result. Two passes also ends it. Higher score wins. After the first stone, blue may swap.",
  ],
  sstar: [
    "A pentagon of hexes. The star in the middle is empty. It joins all five cells around it, for both colors at once, so two stones of one color on that ring are connected even with the other color between them.",
    "A star is one connected group that contains two or more edge cells. It owns those cells, and also the edge cells it surrounds and that no other star owns. Three or more corners are worth one extra point.",
    "Count each player's stars. The player with fewer adds twice the difference; the other subtracts it. Higher score wins. A filled board cannot tie. Pass, or press score, to count early. Blue may swap after the first stone.",
  ],
  y: [
    "Both players are trying to touch all three sides of the triangle. A corner belongs to both sides it sits on.",
    "One stone on an empty hex each turn. The first to reach all three sides wins. There is no draw.",
    "After the opening stone, blue may swap seats.",
  ],
};
</script>

<style scoped>
.fold {
  display: none;
}

.connect {
  height: 100dvh;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  background: #000;
  color: #fff;
  font-family: Arial, sans-serif;
  overflow: clip;
  padding-top: env(safe-area-inset-top);
}

.connect.screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  width: auto;
  height: auto;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
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
  min-height: 28px;
  font-size: 26px;
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
  letter-spacing: -0.4px;
}

.warn {
  margin: -6px 0 10px;
  color: #e7c36a;
  font-size: 13px;
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
  color: #666;
}

.plate.live {
  border-color: #fff;
  color: #fff;
}

.plate.low.live {
  animation: clock-pulse 1s ease-in-out infinite;
}

.plate-figures {
  display: grid;
  justify-items: end;
  font-variant-numeric: tabular-nums;
}

.plate-figures small {
  color: #666;
  font-size: 11px;
}

.plate.live .plate-figures small {
  color: #bbb;
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
  font-size: 16px;
}

.side i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: block;
}

.side i.red,
.stone.red,
.ghost.red {
  background: #e23b3b;
  fill: #e23b3b;
}

.side i.blue,
.stone.blue,
.ghost.blue {
  background: #3c7dff;
  fill: #3c7dff;
}

.actions,
.choice,
.steps,
.tray {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.actions,
.tray {
  margin-bottom: 12px;
}

button {
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 13px;
  padding: 6px 8px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: #fff;
}

button:disabled {
  color: #555;
  cursor: default;
}

button[aria-pressed="true"],
.start {
  border-color: #fff;
}

.choice {
  margin: 0;
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
  width: min(760px, 100%);
  max-height: calc(100dvh - 48px);
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
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

.setup-pop .choice button {
  flex: 0 1 auto;
}

.kicker {
  margin: 4px 0 0;
  color: #666;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.rules {
  display: grid;
  gap: 10px;
  color: #bbb;
  font-size: 14px;
  line-height: 1.45;
}

.rules p,
.empty {
  margin: 0 0 8px;
  color: #aaa;
  font-size: 13px;
  line-height: 1.45;
}

.tray button b {
  margin-left: 6px;
  color: #888;
}

.moves-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: #888;
  font-size: 13px;
  margin-bottom: 6px;
}

.moves {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  min-height: 0;
}

.moves button {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  text-align: left;
  border-color: transparent;
  color: #ccc;
}

.moves .time {
  margin-left: auto;
  color: #555;
  font-variant-numeric: tabular-nums;
}

.moves li.on button,
.moves button:hover {
  color: #fff;
}

.who {
  display: inline-block;
  min-width: 38px;
  color: #888;
}

.result {
  color: #fff;
  font-size: 14px;
  padding: 6px 8px;
}

.viewport {
  position: relative;
  min-width: 0;
  min-height: 0;
  background:
    radial-gradient(circle at 50% 45%, #141414 0, #000 62%);
  touch-action: none;
  cursor: grab;
}

.viewport.play {
  cursor: crosshair;
}

.board {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
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

.coords {
  pointer-events: none;
  font-family: Arial, sans-serif;
  font-size: 12px;
  fill: #8a8a8a;
  text-anchor: middle;
  dominant-baseline: middle;
}

@keyframes clock-pulse {
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plate.low.live {
    animation: none;
  }
}

.cell {
  fill: #161616;
  stroke: #2a2a2a;
  stroke-width: 1.2;
}

.cell.red-edge {
  fill: #241416;
}

.cell.blue-edge {
  fill: #121a28;
}

.cell.red-edge.blue-edge {
  fill: #241828;
}

.cell.y-edge {
  stroke: #666;
}

.cell.center {
  fill: #10141c;
}

.cell.pair-q {
  stroke: #d6b25e;
}

.cell.pair-r {
  stroke: #5ec8b0;
}

.cell.pair-s {
  stroke: #b98cff;
}

.cell.owned-red {
  fill: #5c242c;
}

.cell.owned-blue {
  fill: #1d3f78;
}

.cell.win {
  stroke: #fff;
  stroke-width: 2.4;
}

.cell.corner {
  stroke-width: 2.2;
}

.partial {
  stroke: #3a3a3a;
  stroke-width: 1;
}

.hub-star {
  fill: #1a1a1a;
  stroke: #444;
  stroke-width: 1.2;
}

.stone {
  stroke: #000;
  stroke-width: 1;
}

.ghost {
  opacity: 0.45;
  pointer-events: none;
}

.bridge {
  stroke-width: 7;
  stroke-linecap: round;
}

.bridge.red {
  stroke: #e23b3b;
}

.bridge.blue {
  stroke: #3c7dff;
}

.bridge.ghost-line {
  stroke-width: 3;
  opacity: 0.16;
}

.bridge.ghost-line.hot {
  stroke-width: 8;
  opacity: 0.95;
}

.bridge.win {
  stroke: #fff;
}

.dot {
  stroke: #000;
  stroke-width: 1;
}

.dot.red {
  fill: #e23b3b;
}

.dot.blue {
  fill: #3c7dff;
}

.twixt-mat {
  fill: #0c0c0c;
}

.hole {
  stroke: #333;
  stroke-width: 1.4;
}

.hole.red {
  stroke: #e23b3b;
}

.hole.blue {
  stroke: #3c7dff;
}

.hole.fresh {
  stroke: #fff;
  stroke-width: 2;
}

.link {
  stroke-width: 4;
  stroke-linecap: round;
  fill: none;
}

.link.red {
  stroke: #e23b3b;
}

.link.blue {
  stroke: #3c7dff;
}

.link.hint {
  opacity: 0.35;
  stroke-dasharray: 5 6;
}

.link.win {
  stroke: #fff;
}

.zoom {
  position: absolute;
  left: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  gap: 6px;
}

.zoom button {
  min-width: 40px;
  background: #000;
}

@media (max-width: 800px) {
  .connect {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 1fr) minmax(180px, 46dvh);
  }

  .setup-shade {
    padding: 12px;
  }

  .setup-pop {
    max-height: calc(100dvh - 24px);
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

  .fold {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    margin: 0 0 10px;
    padding: 0 14px;
    border: 1px solid #333;
    background: #000;
    color: #fff;
    font: inherit;
  }

  .connect.folded {
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .connect.folded .actions,
  .connect.folded .tray,
  .connect.folded .moves-head,
  .connect.folded .moves,
  .connect.folded .empty,
  .connect.folded .warn {
    display: none;
  }
}

@media (pointer: coarse) {
  .actions button,
  .zoom button,
  .moves-head button,
  .fold,
  .tray button {
    min-height: 44px;
  }
}
</style>
