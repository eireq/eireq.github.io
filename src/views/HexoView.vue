<template>
  <div ref="shell" class="hexo" :class="{ screen: full.active }">
    <aside class="panel">
      <header class="top">
        <div>
          <h1 @click="pokeBloom">HeXO</h1>
          <p class="sub">open on {{ board.center }} · then two a turn · six in a line</p>
        </div>
        <router-link class="back" to="/games">games</router-link>
      </header>

      <p class="readout" :class="{ dim: readout === '–' }">{{ readout }}</p>
      <p class="status" :class="{ over: outcome }" aria-live="polite">
        {{ statusText }}
      </p>
      <p v-if="mode === 'together' && room" class="room-tag">{{ room }}</p>

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
            <svg v-else-if="side === 'O'" class="mark" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="5.2" />
            </svg>
            <svg v-else-if="side === 'Y'" class="mark" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3 L13 13 L3 13 Z" />
            </svg>
            <svg v-else class="mark" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4 H12 V12 H4 Z" />
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
          v-if="mode !== 'together'"
          type="button"
          :disabled="!history.length || view !== history.length"
          @click="undo"
        >
          undo
        </button>
        <button v-if="!resultLine" type="button" :disabled="!canResign" @click="resign">
          resign
        </button>
        <button
          v-if="variant && position.phase === 'trim' && canPlay"
          type="button"
          @click="passTurn"
        >
          done
        </button>
        <button
          v-if="canMine"
          type="button"
          :aria-pressed="mineArm"
          @click="armMine"
        >
          mine
        </button>
        <button v-if="mode === 'together' && resultLine" type="button" @click="rematch">
          rematch
        </button>
        <button type="button" @click="copyLink">
          {{ copied ? "copied" : mode === "together" ? "invite" : "copy link" }}
        </button>
        <button type="button" :disabled="!scorePlain()" @click="copyScore">
          {{ scoreCopied ? "copied" : "copy score" }}
        </button>
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
          <span v-if="line.time" class="time">{{ line.time }}</span>
        </li>
        <li v-if="resultLine" class="result">{{ resultLine }}</li>
      </ol>

      <div v-if="mode === 'together'" class="chat">
        <ol v-if="chat.length" ref="chatEl" class="chat-log">
          <li v-for="(line, index) in chat" :key="line.at + '-' + index">
            <span>{{ line.seat }}</span> {{ line.text }}
          </li>
        </ol>
        <form @submit.prevent="sendChat">
          <input
            v-model="chatDraft"
            maxlength="160"
            placeholder="chat"
            aria-label="chat"
            autocomplete="off"
          />
        </form>
      </div>
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
          :viewBox="board.viewBox"
          :width="board.width"
          :height="board.height"
          role="img"
          aria-label="HeXO board"
          @pointerover="onOver"
          @pointerleave="hoverKey = null"
        >
          <polygon
            v-for="cell in board.cells"
            :key="cell.key"
            :points="cell.points"
            class="cell"
            :class="{
              'is-empty': !stones[cell.key],
              'is-center': cell.key === board.center && !stones[cell.key],
              'is-opening': cell.key === board.center && view === 0,
              'is-legal': legal(cell.key),
              'is-flash': flashKey === cell.key,
              'is-guide': guided(cell.key),
              'is-check': checkKeys.has(cell.key),
              'is-panic': haloSet.has(cell.key),
              'is-rift': riftSet.has(cell.key),
              'is-mine': mineSet.has(cell.key),
              'is-frost': frostSet.has(cell.key),
              'is-from': slideFrom === cell.key,
              'is-source': slideSources.has(cell.key),
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
              :r="markR(cell)"
            />
            <path
              v-for="cell in yCells"
              :key="'y-' + cell.key"
              :class="{ 'on-win': winKeys.has(cell.key) }"
              :d="yMark(cell)"
            />
            <path
              v-for="cell in zCells"
              :key="'z-' + cell.key"
              :class="{ 'on-win': winKeys.has(cell.key) }"
              :d="zMark(cell)"
            />
          </g>

          <g v-if="ghostCells.length" class="ghost-stone" aria-hidden="true">
            <template v-for="cell in ghostCells" :key="'ghost-' + cell.key">
              <path v-if="cell.owner === 'X'" :d="xMark(cell)" />
              <circle v-else-if="cell.owner === 'O'" :cx="cell.x" :cy="cell.y" :r="markR(cell)" />
              <path v-else-if="cell.owner === 'Y'" :d="yMark(cell)" />
              <path v-else :d="zMark(cell)" />
            </template>
          </g>

          <g v-if="mineCells.length" class="mine-mark" aria-hidden="true">
            <circle v-for="cell in mineCells" :key="'mine-' + cell.key" :cx="cell.x" :cy="cell.y" r="2.4" />
          </g>

          <g v-if="duckCell" class="duck" aria-hidden="true">
            <circle :cx="duckCell.x" :cy="duckCell.y" :r="(duckCell.m || 7) * 0.72" />
            <path :d="duckBeak(duckCell)" />
          </g>

          <g v-if="ghost" class="ghost" aria-hidden="true">
            <path v-if="turn === 'X'" :d="xMark(ghost)" />
            <path v-else-if="turn === 'Y'" :d="yMark(ghost)" />
            <path v-else-if="turn === 'Z'" :d="zMark(ghost)" />
            <circle v-else :cx="ghost.x" :cy="ghost.y" :r="markR(ghost)" />
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
              v-for="(label, index) in board.labels"
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
        <button type="button" @click="toggleFlip">flip</button>
        <button type="button" aria-label="zoom out" @click="zoomBy(1 / 1.18)">
          −
        </button>
        <button type="button" aria-label="zoom in" @click="zoomBy(1.18)">
          +
        </button>
        <button type="button" aria-label="fit board" @click="fit">fit</button>
        <FullscreenButton :active="full.active" @toggle="full.toggle" />
      </div>
    </div>

    <Teleport v-if="shell" :to="shell">
      <div v-if="showSetup" class="setup-shade" @click.self="showSetup = false">
        <form class="setup-pop" @submit.prevent="startGame">
          <div class="pop-bar">
            <span>new game</span>
            <button type="button" @click="showSetup = false">close</button>
          </div>
          <p class="kicker">shapes</p>
          <div class="choice" @mouseleave="variantHint = ''">
            <button
              v-for="grid in grids"
              :key="grid.id"
              type="button"
              :aria-pressed="draft.grid === grid.id"
              @mouseenter="variantHint = grid.note"
              @focus="variantHint = grid.note"
              @click="draft.grid = grid.id"
            >
              {{ grid.label }}
            </button>
          </div>
          <p class="kicker">players</p>
          <div class="choice" @mouseleave="variantHint = ''">
            <button
              v-for="count in [2, 3, 4]"
              :key="count"
              type="button"
              :aria-pressed="draft.players === count"
              @mouseenter="variantHint = playerNote(count)"
              @focus="variantHint = playerNote(count)"
              @click="setPlayers(count)"
            >
              {{ count }} players
            </button>
          </div>
          <p class="kicker">buts</p>
          <div class="choice" @mouseleave="variantHint = ''">
            <button
              v-for="rule in ruleSwitches"
              :key="rule.id"
              type="button"
              :aria-pressed="rule.on"
              @mouseenter="variantHint = rule.note"
              @focus="variantHint = rule.note"
              @click="rule.toggle()"
            >
              {{ rule.label }}
            </button>
          </div>
          <p class="hint">{{ variantHint || "hover a shape or a but." }}</p>
          <p class="kicker">table</p>
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
          <p class="kicker">clocks</p>
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
          <p class="kicker">sizes</p>
          <div class="choice">
            <button type="button" :aria-pressed="draft.size === 8" @click="draft.size = 8">
              base 8
            </button>
            <button type="button" :aria-pressed="draft.size === 13" @click="draft.size = 13">
              base 13
            </button>
          </div>
          <label v-if="draft.cap" class="room">
            <input v-model.number="draft.capN" type="number" min="1" max="40" />
            <span>soft cap. over it, lift up to 2 older stones, or leave them.</span>
          </label>
          <label v-if="draft.mode === 'together'" class="room">
            <input
              v-model="draft.room"
              maxlength="24"
              placeholder="room name"
              autocomplete="off"
              spellcheck="false"
            />
            <span>the room keeps the game. blank makes a short code.</span>
          </label>
          <div v-if="draft.mode === 'practice'" class="choice">
            <button
              v-for="side in ['X', 'O', 'Y', 'Z'].slice(0, draft.players)"
              :key="side"
              type="button"
              :aria-pressed="draft.human === side"
              @click="draft.human = side"
            >
              play {{ side }}
            </button>
          </div>
          <button type="submit" class="start">start</button>
        </form>
      </div>
    </Teleport>

    <Teleport v-if="shell" :to="shell">
      <div v-if="showRules" class="setup-shade" @click.self="showRules = false">
        <div class="setup-pop">
          <div class="pop-bar">
            <span>rules</span>
            <button type="button" @click="showRules = false">close</button>
          </div>
          <div class="rules">
            <p>
              X places one stone on the center, h8 on base 8 and m13 on base 13.
              Every later turn is two stones, and O takes the first of them.
            </p>
            <p>Six in a line, on any of the three axes, wins. That move ends with #.</p>
            <p>
              Check means the side to move can finish a line with the stones still left this turn.
              The stones already in the run are marked.
            </p>
            <p>The side to move may resign. The other side wins. A clock runs only on the turn.</p>
            <p>Type a square, such as g7, to play it. Flip turns the board around.</p>
            <p>
              Together: pick a room name. It keeps the game, and the board size.
              You start as X. Send the invite. They are O. Rematch swaps sides.
              The box under the moves is chat. For 3 or 4, change the invite to s=Y or s=Z.
            </p>
            <p>
              Triangle, square, and octagon use the same turns. On the octagon board you also play in the diamonds.
              Radial is rings and spokes. Six around a ring, or six outward on a spoke.
              Pentagon fills five sides with the same triangles.
            </p>
            <p>
              Duck: after your stones, move the duck. No one plays on it. King duck also quiets the ring around it.
            </p>
            <p>
              Egyptian sets a soft cap. Over it, lift up to 2 of your older stones, or leave them.
              An echo never lifts a stone.
            </p>
            <p>
              Echo copies a stone onto its mirror after two full turns. A duck echo moves the duck only if it is still on that cell.
              Orbit then turns every stone one step. The duck stays.
              Meteor, every third turn, clears the farthest ring. A copy born on that turn stays.
            </p>
            <p>Raid: after your stones, take one of theirs. It becomes yours.</p>
            <p>Slide: the second action can move one of your stones onto an empty neighbor.</p>
            <p>Frost: a stone placed this turn does not count in a line until the turn ends.</p>
            <p>Pair: the two stones of a turn have to share a side. The opening stone is free.</p>
            <p>Scatter: the two stones of a turn must not share a side.</p>
            <p>Siege: after the opening, every stone is placed beside an opponent's stone.</p>
            <p>
              Pendulum: when everyone has taken a turn, each stone steps one ring toward the center.
              The center stone stays.
            </p>
            <p>Mine: the second action can plant a mine. The next stone played there is lost, and the mine is gone.</p>
            <p v-if="bloom">
              Rift bloom: the shimmering cells move each turn. Play on one and a ghost grows on the mirror.
              It becomes a stone if two of your stones touch it before it fades.
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  applyMoves,
  asSize,
  boardFor,
  chooseBotMove,
  decodeReplay,
  encodeReplay,
  isValidHex,
  playerOf,
  stonesLeft,
  threatKeys,
  turnStart,
} from "@/games/hexo/logic.ts";
import { gameBoard } from "@/games/hexo/grids.ts";
import {
  actionCode,
  botPick,
  decodeAlt,
  decodeLog,
  encodeAlt,
  encodeLog,
  isPlain,
  parseCode,
  playerAt,
  project,
} from "@/games/hexo/rules.ts";
import { connectMatch, isRoomName } from "@/games/hexo/online.ts";
import { useFullscreen } from "@/games/fullscreen.js";
import FullscreenButton from "@/games/FullscreenButton.vue";

const route = useRoute();

function isSide(value) {
  return value === "X" || value === "O" || value === "Y" || value === "Z";
}

function querySize() {
  return asSize(route.query.b);
}

function queryAlt() {
  return typeof route.query.alt === "string" ? route.query.alt : "";
}

function readReplay(boardSize) {
  const raw = route.query.r;
  const alt = queryAlt();
  if (typeof raw !== "string" || !raw) return { moves: null, error: false };
  if (alt) {
    const acts = decodeLog(raw);
    const next = decodeAlt(alt);
    if (!acts || !project(acts, next, gameBoard(next.grid, asSize(boardSize)))) {
      return { moves: null, error: true };
    }
    return { moves: acts, error: false };
  }
  const moves = decodeReplay(raw, boardSize);
  if (!moves) return { moves: null, error: true };
  return { moves, error: false };
}

function readRoom() {
  const room = typeof route.query.p === "string" ? route.query.p.toLowerCase() : "";
  if (!isRoomName(room)) return null;
  const minutes = route.query.min === "5" || route.query.min === "10" ? Number(route.query.min) : 0;
  const s = route.query.s;
  return {
    room,
    seat: s === "O" || s === "Y" || s === "Z" ? s : "X",
    minutes,
    size: querySize(),
  };
}

function parseMoveList(list, boardSize) {
  if (!Array.isArray(list)) return null;
  const letters = boardFor(asSize(boardSize)).letters;
  const pattern = new RegExp(`^([${letters}])(\\d{1,2})$`);
  const moves = [];
  for (const part of list) {
    const found = pattern.exec(String(part));
    if (!found) return null;
    moves.push({ letter: found[1], number: Number(found[2]) });
  }
  return applyMoves(moves, asSize(boardSize)) ? moves : null;
}

function historyFrom(list, boardSize, alt) {
  const next = decodeAlt(alt || "");
  if (isPlain(next)) return parseMoveList(list, boardSize);
  if (!Array.isArray(list)) return null;
  const table = gameBoard(next.grid, asSize(boardSize));
  const acts = [];
  for (const part of list) {
    const act = parseCode(String(part));
    if (!act) return null;
    if (act.kind !== "pass" && !table.byKey[act.key]) return null;
    acts.push(act);
  }
  return project(acts, next, table) ? acts : null;
}

function loadRoom(name) {
  try {
    const raw = window.localStorage.getItem(`hexo-room:${name}`);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const boardSize = asSize(saved.size);
    const alt = typeof saved.alt === "string" ? saved.alt : "";
    const moves = historyFrom(saved.moves, boardSize, alt);
    if (!moves || !(saved.epoch > 0)) return null;
    return { ...saved, moves, size: boardSize, alt };
  } catch {
    return null;
  }
}

function cleanRoom(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function makeCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
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

const selfId = playerId();
const joined = readRoom();
const remembered = joined ? loadRoom(joined.room) : null;
const openedSize = remembered ? asSize(remembered.size) : joined ? joined.size : querySize();
const loaded = readReplay(openedSize);
const replayFromRoom = Boolean(
  remembered && (!loaded.moves || remembered.moves.length >= loaded.moves.length),
);
const openedMoves = replayFromRoom ? remembered.moves : (loaded.moves ?? []);
const openedAlt = remembered?.alt || (!remembered ? queryAlt() : "");
const openedRules = decodeAlt(openedAlt);
const openedSeat =
  remembered?.white === selfId
    ? "X"
    : isSide(remembered?.seat) && remembered.seat !== "X"
      ? remembered.seat
      : remembered?.white
        ? "O"
        : (joined?.seat ?? null);
const size = ref(openedSize);
const rules = ref(openedRules);
const variant = computed(() => !isPlain(rules.value));
const sides = computed(() => ["X", "O", "Y", "Z"].slice(0, rules.value.players));
const board = computed(() =>
  variant.value ? gameBoard(rules.value.grid, size.value) : boardFor(size.value),
);
const chat = ref([]);
const chatDraft = ref("");
const chatEl = ref(null);
const history = ref(openedMoves);
const moveTimes = ref(
  openedMoves.map((_, index) =>
    replayFromRoom && typeof remembered?.times?.[index] === "number" ? remembered.times[index] : null,
  ),
);
const view = ref(openedMoves.length);
const mode = ref(joined ? "together" : "hotseat");
const human = ref(openedSeat ?? "X");
const room = ref(joined?.room ?? null);
const seat = ref(openedSeat);
const epoch = ref(remembered?.epoch || (openedMoves.length ? 1 : 0));
const whiteId = ref(remembered?.white || "");
const peerId = ref("");
const flipped = ref(openedSeat && openedSeat !== "X");
const flipTouched = ref(false);
const flashKey = ref(null);
const typed = ref("");
const bloom = ref(window.sessionStorage.getItem("hexo-bloom") === "1" || openedRules.rift);
let bloomTaps = 0;
const clockBudget = ref((replayFromRoom ? remembered?.minutes : 0) || joined?.minutes || 0);
const clock = ref(openedClock());
const clockMarks = ref([]);
const timeoutWinner = ref(
  replayFromRoom && isSide(remembered?.flag)
    ? remembered.flag
    : !loaded.error && isSide(route.query.flag)
      ? route.query.flag
      : null,
);
const resigned = ref(
  replayFromRoom && isSide(remembered?.resign)
    ? remembered.resign
    : !loaded.error && isSide(route.query.end)
      ? route.query.end
      : null,
);
const clockRunning = ref(
  Boolean(
    replayFromRoom &&
      remembered?.running &&
      openedMoves.length &&
      !timeoutWinner.value &&
      !resigned.value,
  ),
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
const replayError = ref(loaded.error && !openedMoves.length);
const particles = ref([]);
const ready = ref(false);
const listEl = ref(null);
const viewport = ref(null);
const shell = ref(null);
const full = useFullscreen(shell);

const panX = ref(0);
const panY = ref(0);
const zoom = ref(1);

const draft = reactive({
  mode: "hotseat",
  human: "X",
  minutes: 0,
  room: "",
  size: openedSize,
  grid: openedRules.grid,
  players: openedRules.players,
  duck: openedRules.duck,
  king: openedRules.king,
  cap: openedRules.cap > 0,
  capN: openedRules.cap || 12,
  echo: openedRules.echo,
  orbit: openedRules.orbit,
  meteor: openedRules.meteor,
  rift: openedRules.rift,
  raid: openedRules.raid,
  slide: openedRules.slide,
  frost: openedRules.frost,
  pair: openedRules.pair,
  scatter: openedRules.scatter,
  siege: openedRules.siege,
  pendulum: openedRules.pendulum,
  mine: openedRules.mine,
});

const variantHint = ref("");
const slideFrom = ref("");
const mineArm = ref(false);

const grids = [
  { id: "hex", label: "hex", note: "hex tiles. six in a line." },
  { id: "tri", label: "triangle", note: "place inside triangles. the other rules stay." },
  { id: "sq", label: "square", note: "place inside squares. the other rules stay." },
  { id: "oct", label: "octagon", note: "place inside octagons and the small diamonds." },
  { id: "rad", label: "radial", note: "rings and spokes. six around a ring, or six out from the center." },
  { id: "pen", label: "pentagon", note: "triangles in a pentagon. six in a straight line." },
];

function playerNote(count) {
  if (count === 3) return "three players, X, O, and Y. same turns.";
  if (count === 4) return "four players, X, O, Y, and Z. same turns.";
  return "two players, X and O.";
}

const ruleSwitches = computed(() => {
  const list = [
    {
      id: "duck",
      label: "duck",
      note: "after your stones, move the duck. no one plays on it.",
      on: draft.duck && !draft.king,
      toggle: () => setDuck(!draft.duck),
    },
    {
      id: "king",
      label: "king duck",
      note: "the ring around the duck is closed. stones there do not count.",
      on: draft.king,
      toggle: () => setKing(!draft.king),
    },
    {
      id: "egyptian",
      label: "egyptian",
      note: "soft cap. over it, lift up to 2 older stones, or leave them.",
      on: draft.cap,
      toggle: () => {
        draft.cap = !draft.cap;
      },
    },
    {
      id: "echo",
      label: "echo",
      note: "copies a stone onto its mirror after two full turns. a duck echo waits if the duck has already moved.",
      on: draft.echo,
      toggle: () => {
        draft.echo = !draft.echo;
      },
    },
    {
      id: "orbit",
      label: "orbit",
      note: "every stone turns one step around the center. the duck stays.",
      on: draft.orbit,
      toggle: () => {
        draft.orbit = !draft.orbit;
      },
    },
    {
      id: "meteor",
      label: "meteor",
      note: "every third turn, the farthest ring is cleared. a copy born that turn stays.",
      on: draft.meteor,
      toggle: () => {
        draft.meteor = !draft.meteor;
      },
    },
    {
      id: "raid",
      label: "raid",
      note: "after your stones, take one of theirs. it becomes yours.",
      on: draft.raid,
      toggle: () => {
        draft.raid = !draft.raid;
      },
    },
    {
      id: "slide",
      label: "slide",
      note: "the second action can move one of your stones to an empty neighbor.",
      on: draft.slide,
      toggle: () => {
        draft.slide = !draft.slide;
      },
    },
    {
      id: "frost",
      label: "frost",
      note: "a new stone does not count until the turn ends.",
      on: draft.frost,
      toggle: () => {
        draft.frost = !draft.frost;
      },
    },
    {
      id: "pair",
      label: "pair",
      note: "the two stones of a turn must touch.",
      on: draft.pair,
      toggle: () => {
        draft.pair = !draft.pair;
        if (draft.pair) draft.scatter = false;
      },
    },
    {
      id: "scatter",
      label: "scatter",
      note: "the two stones of a turn must not touch.",
      on: draft.scatter,
      toggle: () => {
        draft.scatter = !draft.scatter;
        if (draft.scatter) draft.pair = false;
      },
    },
    {
      id: "siege",
      label: "siege",
      note: "after the opening, play next to an enemy stone.",
      on: draft.siege,
      toggle: () => {
        draft.siege = !draft.siege;
      },
    },
    {
      id: "pendulum",
      label: "pendulum",
      note: "each full round, stones step one ring toward the center.",
      on: draft.pendulum,
      toggle: () => {
        draft.pendulum = !draft.pendulum;
      },
    },
    {
      id: "mine",
      label: "mine",
      note: "the second action can be a mine. the next stone there is lost.",
      on: draft.mine,
      toggle: () => {
        draft.mine = !draft.mine;
      },
    },
  ];
  if (bloom.value || draft.rift) {
    list.push({
      id: "rift",
      label: "rift bloom",
      note: "shimmering cells move. a ghost grows on the mirror, then becomes a stone if two of yours touch it.",
      on: draft.rift,
      toggle: () => {
        draft.rift = !draft.rift;
      },
    });
  }
  return list;
});

const position = computed(() => {
  if (!variant.value) return applyMoves(history.value.slice(0, view.value), size.value) ?? emptyPosition();
  return project(history.value.slice(0, view.value), rules.value, board.value) ?? emptyTable();
});
const stones = computed(() => position.value.stones);
const turn = computed(() => position.value.turn);
const xCells = computed(() => board.value.cells.filter((cell) => stones.value[cell.key] === "X"));
const oCells = computed(() => board.value.cells.filter((cell) => stones.value[cell.key] === "O"));
const yCells = computed(() => board.value.cells.filter((cell) => stones.value[cell.key] === "Y"));
const zCells = computed(() => board.value.cells.filter((cell) => stones.value[cell.key] === "Z"));
const ghostCells = computed(() =>
  (position.value.ghosts ?? [])
    .map((ghost) => {
      const cell = board.value.byKey[ghost.key];
      return cell ? { ...cell, owner: ghost.owner } : null;
    })
    .filter(Boolean),
);
const duckCell = computed(() => (position.value.duck ? board.value.byKey[position.value.duck] : null));
const haloSet = computed(() => new Set(position.value.halo ?? []));
const riftSet = computed(() => new Set(position.value.rifts ?? []));
const mineSet = computed(() => new Set(position.value.mines ?? []));
const frostSet = computed(() => new Set(rules.value.frost ? position.value.placedThisTurn ?? [] : []));
const mineCells = computed(() =>
  (position.value.mines ?? []).map((key) => board.value.byKey[key]).filter(Boolean),
);
const slideSources = computed(() => {
  if (!canPlay.value || !rules.value.slide) return new Set();
  return new Set((position.value.legal ?? []).filter((act) => act.kind === "slide").map((act) => act.from));
});

const lastMove = computed(() =>
  view.value > 0 ? history.value[view.value - 1] : null,
);
const lastKey = computed(() =>
  lastMove.value ? `${lastMove.value.letter}${lastMove.value.number}` : null,
);

function spendsTurn(move) {
  return !move.kind || move.kind === "place" || move.kind === "slide" || move.kind === "mine";
}

function squareOf(move) {
  if (!move.kind || move.kind === "place") return move.key || `${move.letter}${move.number}`;
  if (move.kind === "mine") return `&${move.key}`;
  if (move.kind === "slide") return `${move.from}^${move.key}`;
  return move.key || "";
}

function variantLines(ply) {
  const lines = [];
  let index = 0;
  let placed = 0;
  while (index < ply) {
    const quota = placed === 0 ? 1 : 2;
    const stones = [];
    let took = 0;
    while (index < ply && took < quota && spendsTurn(history.value[index])) {
      const move = history.value[index];
      stones.push({
        index,
        square: squareOf(move),
        key: move.kind === "pass" || move.kind === "remove" ? "" : move.key || `${move.letter}${move.number}`,
      });
      index += 1;
      took += 1;
      placed += 1;
    }
    while (index < ply && history.value[index].kind && !spendsTurn(history.value[index])) {
      const move = history.value[index];
      const square =
        move.kind === "pass"
          ? "pass"
          : move.kind === "duck"
            ? `~${move.key}`
            : move.kind === "steal"
              ? `>${move.key}`
              : move.kind === "mine"
                ? `&${move.key}`
                : move.kind === "slide"
                  ? `${move.from}^${move.key}`
                  : `-${move.key}`;
      stones.push({ index, square, key: move.kind === "remove" || move.kind === "pass" ? "" : move.key });
      index += 1;
    }
    if (!stones.length) break;
    lines.push({
      number: lines.length + 1,
      player: playerAt(placed - took, rules.value.players),
      stones,
    });
  }
  return lines;
}

function turnSlice(ply) {
  if (variant.value) {
    const line = variantLines(ply).at(-1);
    if (!line) return null;
    return { number: line.number, player: line.player, squares: line.stones.map((stone) => stone.square) };
  }
  if (ply <= 0) return null;
  const end = ply - 1;
  const start = turnStart(end);
  return {
    number: start === 0 ? 1 : Math.floor((start + 1) / 2) + 1,
    player: playerOf(start),
    squares: history.value.slice(start, ply).map((move) => `${move.letter}${move.number}`),
  };
}

function moveLabel(ply) {
  const turn = turnSlice(ply);
  if (!turn) return "";
  return `${turn.number}. ${turn.player}${turn.squares.join(" ")}`;
}

const score = computed(() => {
  if (variant.value) {
    return variantLines(history.value.length).map((line) => {
      const last = line.stones[line.stones.length - 1];
      const mark = moveTimes.value[last.index];
      return { ...line, time: typeof mark === "number" ? formatClock(mark) : "" };
    });
  }
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
    const last = stones[stones.length - 1];
    const mark = moveTimes.value[last.index];
    lines.push({
      number: lines.length + 1,
      player: playerOf(start),
      stones,
      time: typeof mark === "number" ? formatClock(mark) : "",
    });
    index = cursor;
  }
  return lines;
});

const shownTurn = computed(() => {
  if (variant.value) {
    const line = variantLines(view.value).at(-1);
    if (!line) return [];
    return line.stones.map((stone) => board.value.byKey[stone.key]).filter(Boolean);
  }
  const turn = turnSlice(view.value);
  if (!turn) return [];
  return turn.squares.map((key) => board.value.byKey[key]).filter(Boolean);
});

const lastKeys = computed(() => new Set(shownTurn.value.map((cell) => cell.key)));

const fullGame = computed(() =>
  variant.value
    ? (project(history.value, rules.value, board.value) ?? emptyTable())
    : (applyMoves(history.value, size.value) ?? emptyPosition()),
);

const checkKeys = computed(() => {
  if (position.value.winner || timeoutWinner.value || resigned.value) return new Set();
  if (variant.value) return new Set(position.value.threats ?? []);
  return new Set(threatKeys(stones.value, turn.value, stonesLeft(view.value), size.value));
});

const mateIndex = computed(() => {
  if (resigned.value || timeoutWinner.value) return -1;
  if (!fullGame.value.winner || fullGame.value.winner === "draw") return -1;
  if (variant.value) {
    const last = history.value[history.value.length - 1];
    if (last?.kind === "steal") return history.value.length - 1;
    for (let index = history.value.length - 1; index >= 0; index -= 1) {
      if (!history.value[index].kind || history.value[index].kind === "place") return index;
    }
  }
  return history.value.length - 1;
});

const resultLine = computed(() => {
  if (timeoutWinner.value) return `${timeoutWinner.value} wins · time`;
  if (resigned.value) return `${nextSeat(resigned.value)} wins · resign`;
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
  return position.value.lines.flatMap((line) => {
    const pts = line
      .map((coord) => board.value.byKey[`${coord.letter}${coord.number}`])
      .filter(Boolean);
    const ext = board.value.hex * 0.28;
    const segs = [];
    for (let i = 1; i < pts.length; i += 1) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      segs.push({
        x1: a.x - (i === 1 ? (dx / len) * ext : 0),
        y1: a.y - (i === 1 ? (dy / len) * ext : 0),
        x2: b.x + (i === pts.length - 1 ? (dx / len) * ext : 0),
        y2: b.y + (i === pts.length - 1 ? (dy / len) * ext : 0),
      });
    }
    return segs;
  });
});

const outcome = computed(() => {
  if (view.value !== history.value.length) return null;
  if (timeoutWinner.value) return `${timeoutWinner.value} wins · time`;
  if (resigned.value) return `${nextSeat(resigned.value)} wins · resign`;
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
      if (rules.value.players > 2) return peerKnown.value ? "away" : "waiting";
      return peerKnown.value ? `${otherSeat.value} is away` : `waiting for ${otherSeat.value}`;
    }
  }
  if (view.value < history.value.length) {
    if (view.value === 0) return withCheck("start");
    return withCheck(`after ${moveLabel(view.value)}`);
  }
  if (variant.value) {
    if (history.value.length === 0) return withCheck(`${turn.value} plays ${board.value.center}`);
    if (position.value.phase === "duck") return `${turn.value} moves the duck`;
    if (position.value.phase === "steal") return `${turn.value} takes one`;
    if (position.value.phase === "trim") return `${turn.value} may lift ${position.value.removesLeft}`;
    if (slideFrom.value) return `${turn.value} slides ${slideFrom.value}`;
    if (mineArm.value) return `${turn.value} sets a mine`;
    if (position.value.stonesLeft === 1 && position.value.placedTotal > 0) {
      return withCheck(`${turn.value} · one more`);
    }
    return withCheck(`${turn.value} to move`);
  }
  if (history.value.length === 0) return withCheck(`X plays ${board.value.center}`);
  if (stonesLeft(history.value.length) === 1) return withCheck(`${turn.value} · one more`);
  return withCheck(`${turn.value} to move`);
});

const readout = computed(() => {
  if (typed.value) return typed.value;
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

const canMine = computed(
  () =>
    canPlay.value &&
    rules.value.mine &&
    position.value.phase === "place" &&
    position.value.stonesLeft === 1 &&
    position.value.placedTotal > 0,
);

const guideSet = computed(() => {
  if (!hoverKey.value) return new Set();
  return new Set(board.value.guides[hoverKey.value] ?? []);
});

const ghost = computed(() => {
  if (!hoverKey.value || !legal(hoverKey.value)) return null;
  if (variant.value && position.value.phase !== "place") return null;
  return board.value.byKey[hoverKey.value] ?? null;
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

function emptyTable() {
  return {
    stones: {},
    turn: "X",
    winner: null,
    lines: [],
    phase: "place",
    duck: null,
    ghosts: [],
    rifts: [],
    panic: [],
    halo: [],
    legal: [],
    threats: [],
    removesLeft: 0,
    stonesLeft: 1,
    placedTotal: 0,
    placedThisTurn: [],
    mines: [],
  };
}

function openedClock() {
  const ms = clockBudget.value * 60000;
  if (replayFromRoom && remembered?.clock?.X != null && remembered?.clock?.O != null) {
    return {
      X: remembered.clock.X,
      O: remembered.clock.O,
      Y: remembered.clock.Y ?? ms,
      Z: remembered.clock.Z ?? ms,
    };
  }
  if (clockBudget.value && !openedMoves.length) return { X: ms, O: ms, Y: ms, Z: ms };
  return null;
}

function nextSeat(side) {
  const order = ["X", "O", "Y", "Z"].slice(0, rules.value.players);
  const index = order.indexOf(side);
  return order[(index + 1) % order.length] || "O";
}

function freshClock(ms) {
  return { X: ms, O: ms, Y: ms, Z: ms };
}

function codeOf(move) {
  if (move?.kind) return actionCode(move);
  return `${move.letter}${move.number}`;
}

function rulesFromDraft() {
  const cap = draft.cap ? Math.max(1, Math.min(40, Number(draft.capN) || 12)) : 0;
  return {
    grid: draft.grid,
    players: draft.players,
    duck: Boolean(draft.duck || draft.king),
    king: Boolean(draft.king),
    cap,
    echo: Boolean(draft.echo),
    orbit: Boolean(draft.orbit),
    meteor: Boolean(draft.meteor),
    rift: Boolean(draft.rift),
    raid: Boolean(draft.raid),
    slide: Boolean(draft.slide),
    frost: Boolean(draft.frost),
    pair: Boolean(draft.pair),
    scatter: Boolean(draft.scatter),
    siege: Boolean(draft.siege),
    pendulum: Boolean(draft.pendulum),
    mine: Boolean(draft.mine),
  };
}

function pokeBloom() {
  bloomTaps += 1;
  if (bloomTaps < 5) return;
  bloom.value = true;
  window.sessionStorage.setItem("hexo-bloom", "1");
}

function setPlayers(count) {
  draft.players = count;
  const names = ["X", "O", "Y", "Z"].slice(0, count);
  if (!names.includes(draft.human)) draft.human = "X";
}

function setDuck(on) {
  draft.duck = on;
  if (!on) draft.king = false;
}

function setKing(on) {
  draft.king = on;
  if (on) draft.duck = true;
}

const legalSet = computed(() => {
  if (!variant.value || !canPlay.value) return new Set();
  return new Set((position.value.legal ?? []).map((act) => act.key));
});

function legal(key) {
  if (variant.value) return legalSet.value.has(key);
  if (!canPlay.value || stones.value[key]) return false;
  if (history.value.length === 0) return key === board.value.center;
  return true;
}

function guided(key) {
  if (!guidesOn.value || !hoverKey.value || hoverKey.value === key) return false;
  if (history.value.length === 0 && hoverKey.value !== board.value.center) return false;
  return guideSet.value.has(key);
}

function toggleSetup() {
  variantHint.value = "";
  showSetup.value = !showSetup.value;
  if (showSetup.value) {
    draft.size = size.value;
    draft.grid = rules.value.grid;
    draft.players = rules.value.players;
    draft.duck = rules.value.duck;
    draft.king = rules.value.king;
    draft.cap = rules.value.cap > 0;
    draft.capN = rules.value.cap || 12;
    draft.echo = rules.value.echo;
    draft.orbit = rules.value.orbit;
    draft.meteor = rules.value.meteor;
    draft.rift = rules.value.rift;
    draft.raid = rules.value.raid;
    draft.slide = rules.value.slide;
    draft.frost = rules.value.frost;
    draft.pair = rules.value.pair;
    draft.scatter = rules.value.scatter;
    draft.siege = rules.value.siege;
    draft.pendulum = rules.value.pendulum;
    draft.mine = rules.value.mine;
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
  const u = cell.m || 7.1;
  return `M ${cell.x - u} ${cell.y - u} L ${cell.x + u} ${cell.y + u} M ${cell.x + u} ${cell.y - u} L ${cell.x - u} ${cell.y + u}`;
}

function yMark(cell) {
  const u = (cell.m || 7.1) * 0.95;
  return `M ${cell.x} ${cell.y - u} L ${cell.x + u} ${cell.y + u * 0.72} L ${cell.x - u} ${cell.y + u * 0.72} Z`;
}

function zMark(cell) {
  const u = (cell.m || 7.1) * 0.72;
  return `M ${cell.x - u} ${cell.y - u} H ${cell.x + u} V ${cell.y + u} H ${cell.x - u} Z`;
}

function markR(cell) {
  return (cell.m || 7.1) + 0.2;
}

function duckBeak(cell) {
  const u = (cell.m || 7) * 0.55;
  return `M ${cell.x + u * 0.15} ${cell.y - u * 0.05} L ${cell.x + u * 1.35} ${cell.y - u * 0.42} L ${cell.x + u * 0.15} ${cell.y + u * 0.32} Z`;
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
  slideFrom.value = "";
  mineArm.value = false;
  const mover = variant.value ? turn.value : playerOf(history.value.length);
  if (clock.value) {
    clockMarks.value = [
      ...clockMarks.value,
      { X: clock.value.X, O: clock.value.O, Y: clock.value.Y, Z: clock.value.Z },
    ];
    moveTimes.value = [...moveTimes.value, clock.value[mover]];
    clockRunning.value = true;
  } else {
    clockMarks.value = [...clockMarks.value, null];
    moveTimes.value = [...moveTimes.value, null];
  }
  history.value = [...history.value, move];
  view.value = history.value.length;
  const latest = variant.value
    ? project(history.value, rules.value, board.value)
    : applyMoves(history.value, size.value);
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
  if (variant.value) {
    if (turn.value === human.value) return;
    const seen = history.value.length;
    botTimer = window.setTimeout(() => {
      if (history.value.length !== seen || view.value !== seen) return;
      if (timeoutWinner.value || position.value.winner) return;
      if (turn.value === human.value) return;
      const move = botPick(position.value, board.value, rules.value);
      if (move) pushMove(move);
    }, 380);
    return;
  }
  if (turn.value !== botSide()) return;
  const seen = history.value.length;
  botTimer = window.setTimeout(() => {
    if (history.value.length !== seen || view.value !== seen) return;
    if (timeoutWinner.value || position.value.winner) return;
    if (turn.value !== botSide()) return;
    const move = chooseBotMove(stones.value, turn.value, size.value);
    if (move) pushMove(move);
  }, 380);
}

function flash(key) {
  flashKey.value = key;
  window.setTimeout(() => {
    if (flashKey.value === key) flashKey.value = null;
  }, 450);
}

function armMine() {
  if (!canMine.value) return;
  mineArm.value = !mineArm.value;
  if (mineArm.value) slideFrom.value = "";
}

function play(key) {
  if (variant.value) {
    const acts = position.value.legal ?? [];
    if (slideFrom.value && canPlay.value) {
      const slide = acts.find((item) => item.kind === "slide" && item.from === slideFrom.value && item.key === key);
      if (slide) {
        typed.value = "";
        pushMove(slide);
        return;
      }
    }
    const source = acts.find((item) => item.kind === "slide" && item.from === key);
    if (source && canPlay.value) {
      slideFrom.value = key;
      mineArm.value = false;
      return;
    }
    const act = mineArm.value
      ? acts.find((item) => item.kind === "mine" && item.key === key) ||
        acts.find((item) => item.kind === "place" && item.key === key)
      : acts.find((item) => item.kind === "place" && item.key === key) ||
        acts.find((item) => item.kind !== "slide" && item.kind !== "mine" && item.key === key);
    if (!act || !canPlay.value) {
      if (
        position.value.phase === "place" &&
        !history.value.length &&
        key !== board.value.center &&
        board.value.byKey[key] &&
        canPlay.value
      ) {
        flash(key);
      }
      return;
    }
    typed.value = "";
    pushMove(act);
    return;
  }
  if (!legal(key)) {
    if (history.value.length === 0 && key !== board.value.center && board.value.byKey[key] && canPlay.value) flash(key);
    return;
  }
  const cell = board.value.byKey[key];
  if (!cell) return;
  typed.value = "";
  pushMove({ letter: cell.letter, number: cell.number });
}

function passTurn() {
  if (!variant.value || position.value.phase !== "trim" || !canPlay.value) return;
  pushMove({ kind: "pass", key: "", letter: "", number: 0 });
}

function undo() {
  if (mode.value === "together") return;
  if (view.value !== history.value.length || !history.value.length) return;
  if (mode.value === "hotseat" || variant.value) {
    const mark = clockMarks.value[clockMarks.value.length - 1];
    history.value = history.value.slice(0, -1);
    moveTimes.value = moveTimes.value.slice(0, -1);
    clockMarks.value = clockMarks.value.slice(0, -1);
    view.value = history.value.length;
    resigned.value = null;
    timeoutWinner.value = null;
    particles.value = [];
    if (mark && clock.value) clock.value = { ...clock.value, ...mark };
    clockRunning.value = history.value.length > 0 && Boolean(clock.value);
    if (variant.value) queueBot();
    return;
  }
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
  moveTimes.value = moveTimes.value.slice(0, -pops);
  clockMarks.value = clockMarks.value.slice(0, -pops);
  view.value = history.value.length;
  resigned.value = null;
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
  size.value = asSize(draft.size);
  chat.value = [];
  chatDraft.value = "";
  view.value = 0;
  clockMarks.value = [];
  moveTimes.value = [];
  timeoutWinner.value = null;
  resigned.value = null;
  epoch.value = 0;
  whiteId.value = "";
  peerId.value = "";
  claiming = false;
  replayError.value = false;
  particles.value = [];
  hoverKey.value = null;
  rules.value = rulesFromDraft();
  clockBudget.value = draft.minutes;
  if (draft.minutes > 0) {
    clock.value = freshClock(draft.minutes * 60 * 1000);
  } else {
    clock.value = null;
  }
  clockRunning.value = false;
  showSetup.value = false;
  if (draft.mode !== "together" && !flipTouched.value) flipped.value = false;
  if (draft.mode === "together") {
    const cleaned = cleanRoom(draft.room);
    const name = isRoomName(cleaned) ? cleaned : makeCode();
    draft.room = name;
    room.value = name;
    const saved = loadRoom(name);
    if (saved) {
      restoreSaved(saved);
      claiming = false;
    } else {
      seat.value = "X";
      human.value = "X";
      whiteId.value = "";
      epoch.value = 0;
      claiming = true;
      if (!flipTouched.value) flipped.value = false;
      clockRunning.value = Boolean(clock.value);
    }
    openMatch();
  } else {
    clockRunning.value = Boolean(clock.value);
  }
  syncUrl();
  nextTick(() => fit());
  queueBot();
}

function writeRules(url) {
  const alt = encodeAlt(rules.value);
  if (alt) url.searchParams.set("alt", alt);
  else url.searchParams.delete("alt");
  const encoded = variant.value ? encodeLog(history.value) : encodeReplay(history.value);
  if (encoded) url.searchParams.set("r", encoded);
  else url.searchParams.delete("r");
  if (size.value === 13) url.searchParams.set("b", "13");
  else url.searchParams.delete("b");
}

function syncUrl() {
  const url = new URL(window.location.href);
  writeRules(url);
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
    writeRules(url);
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
    return `${line.number}. ${body}${line.time ? `  ${line.time}` : ""}`;
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
    box.clientWidth / board.value.width,
    box.clientHeight / board.value.height,
  );
  fitZoom = next > 0 ? next * 0.94 : 1;
  zoom.value = fitZoom;
  panX.value = (box.clientWidth - board.value.width * fitZoom) / 2;
  panY.value = (box.clientHeight - board.value.height * fitZoom) / 2;
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
  if (event.key === "Backspace") {
    typed.value = typed.value.slice(0, -1);
    window.clearTimeout(typeTimer);
    return;
  }
  if (event.key.length === 1 && board.value.letters.includes(event.key.toLowerCase())) {
    event.preventDefault();
    typed.value = event.key.toLowerCase();
    window.clearTimeout(typeTimer);
    return;
  }
  if (/^\d$/.test(event.key) && board.value.letters.includes(typed.value[0])) {
    event.preventDefault();
    const letter = typed.value[0];
    const digits = `${typed.value.slice(1)}${event.key}`.slice(0, 2);
    typed.value = `${letter}${digits}`;
    const number = Number(digits);
    window.clearTimeout(typeTimer);
    if (variant.value) {
      const key = `${letter}${number}`;
      if (!board.value.byKey[key]) return;
      const longer = board.value.cells.some((cell) => cell.key !== key && cell.key.startsWith(key));
      if (!longer) commitTyped();
      else typeTimer = window.setTimeout(() => commitTyped(), 450);
      return;
    }
    if (!isValidHex(letter, number, size.value)) return;
    if (typedReady(letter, number)) commitTyped();
    else typeTimer = window.setTimeout(() => commitTyped(), 450);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    step(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    step(1);
  } else if (event.key === "Escape") {
    typed.value = "";
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
let claimTimer = 0;
let typeTimer = 0;
let claiming = false;

function publishHi() {
  if (!match || !seat.value) return;
  match.publish({
    kind: "hi",
    id: selfId,
    seat: seat.value,
    at: Date.now(),
    moves: [],
    times: [],
    epoch: epoch.value,
    white: whiteId.value,
    resign: null,
    flag: null,
    minutes: 0,
    clock: null,
    running: false,
    size: size.value,
    text: "",
    alt: encodeAlt(rules.value),
  });
}

function saveRoomState() {
  if (mode.value !== "together" || !room.value || epoch.value < 1) return;
  window.localStorage.setItem(
    `hexo-room:${room.value}`,
    JSON.stringify({
      epoch: epoch.value,
      white: whiteId.value,
      moves: history.value.map((move) => codeOf(move)),
      times: moveTimes.value,
      resign: resigned.value,
      flag: timeoutWinner.value,
      minutes: clockBudget.value,
      clock: clock.value,
      running: clockRunning.value,
      size: size.value,
      alt: encodeAlt(rules.value),
      seat: seat.value,
    }),
  );
}

function restoreSaved(saved) {
  rules.value = decodeAlt(saved.alt || "");
  size.value = asSize(saved.size);
  history.value = saved.moves;
  moveTimes.value = saved.moves.map((_, index) =>
    typeof saved.times?.[index] === "number" ? saved.times[index] : null,
  );
  view.value = saved.moves.length;
  epoch.value = saved.epoch;
  whiteId.value = saved.white || "";
  seat.value = whiteId.value === selfId ? "X" : isSide(saved.seat) ? saved.seat : "O";
  human.value = seat.value;
  if (!flipTouched.value) flipped.value = seat.value !== "X";
  resigned.value = isSide(saved.resign) ? saved.resign : null;
  timeoutWinner.value = isSide(saved.flag) ? saved.flag : null;
  clockBudget.value = saved.minutes === 5 || saved.minutes === 10 ? saved.minutes : 0;
  if (saved.clock?.X != null && saved.clock?.O != null) {
    const ms = clockBudget.value * 60000;
    clock.value = {
      X: saved.clock.X,
      O: saved.clock.O,
      Y: saved.clock.Y ?? ms,
      Z: saved.clock.Z ?? ms,
    };
  } else if (clockBudget.value) {
    clock.value = freshClock(clockBudget.value * 60000);
  } else {
    clock.value = null;
  }
  const over = isSide(saved.resign) || isSide(saved.flag);
  clockRunning.value = Boolean(saved.running) && !over && saved.moves.length > 0;
}

function rematch() {
  if (mode.value !== "together" || !resultLine.value) return;
  epoch.value += 1;
  if (rules.value.players === 2) {
    if (peerId.value) whiteId.value = seat.value === "X" ? peerId.value : selfId;
    else whiteId.value = selfId;
    seat.value = whiteId.value === selfId ? "X" : "O";
  }
  human.value = seat.value;
  if (!flipTouched.value) flipped.value = seat.value !== "X";
  history.value = [];
  moveTimes.value = [];
  clockMarks.value = [];
  view.value = 0;
  resigned.value = null;
  timeoutWinner.value = null;
  particles.value = [];
  hoverKey.value = null;
  if (clockBudget.value) {
    const ms = clockBudget.value * 60000;
    clock.value = freshClock(clockBudget.value * 60000);
  }
  clockRunning.value = Boolean(clock.value);
  publishMatch();
}

function toggleFlip() {
  flipTouched.value = true;
  flipped.value = !flipped.value;
}

function typedReady(letter, number) {
  const key = `${letter}${number}`;
  return !board.value.cells.some((cell) => cell.key !== key && cell.key.startsWith(key));
}

function commitTyped() {
  const raw = typed.value;
  typed.value = "";
  const found = /^([a-z])(\d{1,2})$/.exec(raw);
  if (!found) return;
  const key = `${found[1]}${Number(found[2])}`;
  if (legal(key)) play(key);
  else if (history.value.length === 0 && board.value.byKey[key] && canPlay.value) flash(key);
}

function publishMatch() {
  if (muteNet || mode.value !== "together" || !match || !seat.value) return;
  if (!whiteId.value && seat.value === "X" && epoch.value >= 1) whiteId.value = selfId;
  match.publish({
    kind: "go",
    id: selfId,
    seat: seat.value,
    at: Date.now(),
    moves: history.value.map((move) => codeOf(move)),
    times: moveTimes.value,
    epoch: epoch.value,
    white: whiteId.value || (seat.value === "X" ? selfId : ""),
    resign: resigned.value,
    flag: timeoutWinner.value,
    minutes: clockBudget.value,
    clock: clock.value
      ? { X: clock.value.X, O: clock.value.O, Y: clock.value.Y, Z: clock.value.Z }
      : null,
    running: clockRunning.value && !outcome.value,
    size: size.value,
    text: "",
    alt: encodeAlt(rules.value),
  });
  saveRoomState();
}

function sendChat() {
  const text = chatDraft.value.replace(/\s+/g, " ").trim().slice(0, 160);
  chatDraft.value = "";
  if (!text || mode.value !== "together" || !match || !seat.value) return;
  const line = { id: selfId, seat: seat.value, text, at: Date.now() };
  chat.value = [...chat.value, line].slice(-40);
  match.publish({
    kind: "say",
    id: selfId,
    seat: seat.value,
    at: line.at,
    moves: [],
    times: [],
    epoch: epoch.value,
    white: whiteId.value,
    resign: null,
    flag: null,
    minutes: 0,
    clock: null,
    running: false,
    size: size.value,
    text,
    alt: encodeAlt(rules.value),
  });
}

function isPrefix(short, long) {
  return short.length <= long.length && short.every((key, index) => key === long[index]);
}

function takeMoves(moves, times, follow) {
  muteNet = true;
  history.value = moves;
  moveTimes.value = moves.map((_, index) => (typeof times?.[index] === "number" ? times[index] : null));
  clockMarks.value = moves.map(() => null);
  if (follow) view.value = moves.length;
  muteNet = false;
}

function applyWhite(white) {
  if (!white) return;
  whiteId.value = white;
  if (white === selfId) seat.value = "X";
  else if (seat.value !== "O" && seat.value !== "Y" && seat.value !== "Z") seat.value = "O";
  human.value = seat.value;
  if (!flipTouched.value) flipped.value = seat.value !== "X";
}

function onNote(note) {
  if (note.id === selfId) {
    if (note.kind !== "go") return;
    const own = historyFrom(note.moves, note.size, note.alt);
    if (!own) return;
    const ahead = note.epoch > epoch.value;
    const longer = note.epoch === epoch.value && own.length > history.value.length;
    if (ahead || longer) adoptFresh(note, own);
    return;
  }
  peerId.value = note.id;
  peerKnown.value = true;
  peerAt.value = Date.now();
  if (note.kind === "say") {
    if (!note.text) return;
    chat.value = [...chat.value, { id: note.id, seat: note.seat, text: note.text, at: note.at }].slice(-40);
    return;
  }
  if (note.kind === "hi") {
    if (claiming) {
      window.clearTimeout(claimTimer);
      if (note.id < selfId) {
        claiming = false;
        seat.value = "O";
        human.value = "O";
        if (!flipTouched.value) flipped.value = true;
      } else {
        claimRoom();
      }
      return;
    }
    publishMatch();
    return;
  }

  const moves = historyFrom(note.moves, note.size, note.alt);
  if (!moves) return;
  if (claiming && note.epoch >= 1) {
    claiming = false;
    window.clearTimeout(claimTimer);
    adoptFresh(note, moves);
    return;
  }
  if (note.epoch > epoch.value) {
    adoptFresh(note, moves);
    return;
  }
  if (note.epoch < epoch.value) {
    publishMatch();
    return;
  }
  if (asSize(note.size) !== size.value || (note.alt || "") !== encodeAlt(rules.value)) {
    adoptFresh(note, moves);
    return;
  }
  if (note.seat === seat.value) return;

  const local = history.value.map((move) => codeOf(move));
  const remote = note.moves;
  if (!isPrefix(local, remote)) {
    if (isPrefix(remote, local)) publishMatch();
    return;
  }

  const extended = remote.length > local.length;
  if (extended) {
    const follow = view.value === history.value.length;
    takeMoves(moves, note.times, follow);
    const latest = variant.value
      ? project(moves, rules.value, board.value)
      : applyMoves(moves, size.value);
    if (latest?.winner && latest.winner !== "draw") spawnConfetti();
  }
  if (note.white) whiteId.value = note.white;
  if (note.resign === note.seat) resigned.value = note.resign;
  if (note.flag && note.flag !== note.seat) timeoutWinner.value = note.flag;
  if ((note.minutes === 5 || note.minutes === 10) && clockBudget.value === 0) {
    clockBudget.value = note.minutes;
  }
  adoptClock(note, extended);
}

function adoptFresh(note, moves) {
  epoch.value = note.epoch;
  rules.value = decodeAlt(note.alt || "");
  size.value = asSize(note.size);
  applyWhite(note.white);
  takeMoves(moves, note.times, true);
  resigned.value = isSide(note.resign) ? note.resign : null;
  timeoutWinner.value = isSide(note.flag) ? note.flag : null;
  if (note.minutes === 5 || note.minutes === 10) clockBudget.value = note.minutes;
  if (note.minutes === 0) {
    clockBudget.value = 0;
    clock.value = null;
    clockRunning.value = false;
  }
  adoptClock(note, true);
  const latest = variant.value
    ? project(moves, rules.value, board.value)
    : applyMoves(moves, size.value);
  if (latest?.winner && latest.winner !== "draw") spawnConfetti();
  saveRoomState();
  publishMatch();
}

function claimRoom() {
  if (!claiming) return;
  claiming = false;
  epoch.value = 1;
  whiteId.value = selfId;
  seat.value = "X";
  human.value = "X";
  if (!flipTouched.value) flipped.value = false;
  publishMatch();
}

function adoptClock(note, extended) {
  if (!note.clock) return;
  const side = turn.value;
  const latest = variant.value
    ? project(history.value, rules.value, board.value)
    : applyMoves(history.value, size.value);
  const finished = Boolean(note.resign || note.flag || latest?.winner);
  const remoteSide = note.clock[side];
  if (!extended && clock.value && !finished && clockRunning.value) {
    if (note.running && typeof remoteSide === "number" && remoteSide < clock.value[side]) {
      clock.value = { ...clock.value, [side]: remoteSide };
    }
    return;
  }
  if (!extended && clock.value && !finished && !note.running && !clockRunning.value) return;
  const lag = !finished && note.running ? Math.min(2500, Math.max(0, Date.now() - note.at)) : 0;
  const next = {
    X: note.clock.X,
    O: note.clock.O,
    Y: note.clock.Y ?? note.clock.X,
    Z: note.clock.Z ?? note.clock.O,
  };
  if (!finished && note.running) next[side] = Math.max(0, next[side] - lag);
  clock.value = next;
  clockRunning.value = !finished && Boolean(note.running);
}

function openMatch() {
  closeMatch();
  if (!room.value || !seat.value) return;
  match = connectMatch(room.value, onNote, (up) => {
    linkUp.value = up;
    if (!up) return;
    publishHi();
    if (claiming) {
      window.clearTimeout(claimTimer);
      claimTimer = window.setTimeout(claimRoom, 1200);
    } else {
      publishMatch();
    }
  });
  hiTimer = window.setInterval(publishHi, 4000);
}

function closeMatch() {
  window.clearInterval(hiTimer);
  window.clearTimeout(claimTimer);
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
    timeoutWinner.value = nextSeat(side);
    clockRunning.value = false;
    spawnConfetti();
    publishMatch();
  }
}

watch(history, () => {
  syncUrl();
  saveRoomState();
}, { deep: true });
watch([resigned, timeoutWinner, clockBudget], () => syncUrl());

watch(view, async () => {
  await nextTick();
  listEl.value?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
});

watch([size, () => rules.value.grid], () => {
  userAdjusted = false;
  nextTick(() => fit());
});

watch(chat, async () => {
  await nextTick();
  if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight;
}, { deep: true });

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
  window.clearTimeout(typeTimer);
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

.hexo.screen {
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

.room-tag {
  margin: -6px 0 12px;
  color: #666;
  font-size: 13px;
}

.room {
  display: grid;
  gap: 6px;
  color: #888;
  font-size: 13px;
}

.room input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 14px;
  padding: 8px 10px;
}

.room input:focus {
  outline: 1px solid #fff;
  outline-offset: 2px;
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

.hint {
  margin: 0;
  min-height: 2.8em;
  color: #aaa;
  font-size: 14px;
  line-height: 1.4;
}

.rules {
  display: grid;
  gap: 10px;
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

.moves .time {
  margin-left: auto;
  color: #555;
  font-variant-numeric: tabular-nums;
}

.empty,
.warn {
  margin: 8px 0 0;
  color: #666;
  font-size: 14px;
}

.chat {
  margin-top: auto;
  display: grid;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 10px;
}

.chat-log {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 132px;
  overflow: auto;
  color: #ccc;
  font-size: 13px;
  line-height: 1.35;
}

.chat-log li {
  padding: 3px 0;
  overflow-wrap: anywhere;
}

.chat-log span {
  color: #666;
  margin-right: 6px;
}

.chat input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 14px;
  padding: 8px 10px;
}

.chat input:focus {
  outline: 1px solid #fff;
  outline-offset: 2px;
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

.cell.is-flash {
  animation: open-flash 0.45s ease;
}

.cell.is-guide {
  fill: #2a2a2a;
}

.cell.is-check {
  fill: #333;
  stroke: #fff;
  stroke-width: 2.4;
}

.cell.is-panic {
  stroke: #fff;
  stroke-width: 1.6;
}

.cell.is-rift {
  stroke: #fff;
  animation: rift-shimmer 1.6s ease-in-out infinite;
}

.cell.is-mine {
  stroke: #fff;
  stroke-dasharray: 2 3;
}

.cell.is-frost {
  stroke: #888;
}

.cell.is-from,
.cell.is-source {
  stroke: #fff;
  stroke-width: 1.8;
  cursor: pointer;
}

.mine-mark circle {
  fill: none;
  stroke: #888;
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

.ghost-stone {
  pointer-events: none;
  opacity: 0.7;
}

.ghost-stone path,
.ghost-stone circle {
  fill: none;
  stroke: #fff;
  stroke-width: 1.7;
  stroke-dasharray: 2.4 1.5;
}

.duck {
  pointer-events: none;
}

.duck circle,
.duck path {
  fill: #fff;
  stroke: none;
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
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-content: flex-end;
  gap: 6px;
}

.zoom button {
  min-width: 40px;
  background: #000;
}

@keyframes open-flash {
  0%,
  35% {
    fill: #fff;
  }
}

@keyframes rift-shimmer {
  50% {
    stroke-opacity: 0.2;
  }
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
  .cell,
  .cell.is-flash,
  .cell.is-rift {
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

  .readout {
    margin-top: 10px;
    font-size: 22px;
  }

  .status {
    margin-bottom: 10px;
  }

  .chat-log {
    max-height: 84px;
  }
}
</style>
