<template>
  <main ref="shell" class="otrio" :class="{ screen: full.active, folded }">
    <p class="back"><router-link to="/games">← games</router-link></p>
    <h1>Otrio</h1>
    <p class="intro">
      tic-tac-toe with rings. two to four players, one screen.
    </p>

    <div class="column">
      <button
        type="button"
        class="fold"
        :aria-expanded="!folded"
        @click="folded = !folded"
      >
        {{ folded ? "setup" : "hide" }}
      </button>
      <ol class="ways">
        <li>
          <svg class="way" viewBox="0 0 156 52" aria-hidden="true">
            <g v-for="index in 3" :key="index" :transform="`translate(${(index - 1) * 52} 0)`">
              <circle class="dim" cx="26" cy="26" r="11" />
              <circle class="dim" cx="26" cy="26" r="5" />
              <circle class="hot-ring" cx="26" cy="26" r="18" />
            </g>
          </svg>
          <span>three in a row, all the same size</span>
        </li>
        <li>
          <svg class="way" viewBox="0 0 156 52" aria-hidden="true">
            <g>
              <circle class="dim" cx="26" cy="26" r="18" />
              <circle class="dim" cx="26" cy="26" r="11" />
              <circle class="hot-ring" cx="26" cy="26" r="5" />
            </g>
            <g>
              <circle class="dim" cx="78" cy="26" r="18" />
              <circle class="dim" cx="78" cy="26" r="5" />
              <circle class="hot-ring" cx="78" cy="26" r="11" />
            </g>
            <g>
              <circle class="dim" cx="130" cy="26" r="11" />
              <circle class="dim" cx="130" cy="26" r="5" />
              <circle class="hot-ring" cx="130" cy="26" r="18" />
            </g>
          </svg>
          <span>three in a row, smallest to biggest</span>
        </li>
        <li>
          <svg class="way single" viewBox="0 0 52 52" aria-hidden="true">
            <circle class="hot-ring" cx="26" cy="26" r="18" />
            <circle class="hot-ring" cx="26" cy="26" r="11" />
            <circle class="hot-ring" cx="26" cy="26" r="5" />
          </svg>
          <span>three stacked in one circle, biggest around smallest</span>
        </li>
      </ol>
      <p class="fine">
        rows, columns, and diagonals. smallest to biggest counts in either direction.
      </p>

      <div class="controls">
        <div class="group">
          <span>players</span>
          <div class="choice" role="group" aria-label="players">
            <button
              v-for="count in [2, 3, 4]"
              :key="count"
              type="button"
              :aria-pressed="players === count"
              :aria-label="`${count} players`"
              @click="setPlayers(count)"
            >
              {{ count }}
            </button>
          </div>
        </div>

        <div v-if="players === 3" class="group">
          <span>sitting out</span>
          <div class="choice" role="group" aria-label="color sitting out">
            <button
              v-for="color in COLOR_IDS"
              :key="color"
              type="button"
              :aria-pressed="sittingOut === color"
              @click="setOut(color)"
            >
              <i class="dot" :style="dotStyle(color)" aria-hidden="true" />
              {{ color }}
            </button>
          </div>
        </div>

        <div class="group">
          <span>first</span>
          <div class="choice" role="group" aria-label="who goes first">
            <button
              v-for="color in game.active"
              :key="color"
              type="button"
              :aria-pressed="start === color"
              @click="setStart(color)"
            >
              <i class="dot" :style="dotStyle(color)" aria-hidden="true" />
              {{ color }}
            </button>
          </div>
        </div>

        <div class="choice actions">
          <button type="button" class="solid" @click="restart">new game</button>
          <button type="button" :disabled="!game.history.length" @click="onUndo">
            undo
          </button>
          <FullscreenButton :active="full.active" @toggle="full.toggle" />
        </div>
      </div>

      <p class="blurb">{{ blurb }}</p>

      <p class="status" :class="{ over: game.winner || game.draw }" aria-live="polite">
        <i
          v-if="!game.draw && (game.winner || game.turn)"
          class="swatch"
          :style="dotStyle(game.winner || game.turn)"
          aria-hidden="true"
        />
        {{ statusText }}
      </p>

      <section class="slab" aria-label="Otrio board">
        <div
          v-for="color in BAYS"
          :key="color"
          class="bay"
          :class="[color, { live: isLive(color), team: isTeam(color), won: isWon(color), out: isOut(color) }]"
          :style="{ '--edge': PALETTE[color].edge, '--ink': PALETTE[color].ink }"
        >
          <div class="bay-top">
            <strong>{{ isOut(color) ? "out" : `player ${game.owners[color] + 1}` }}</strong>
            <span v-if="isWon(color)" class="chip">won</span>
            <span v-else-if="isLive(color)" class="chip">now</span>
          </div>
          <p class="left">
            {{ color }} · {{ isOut(color) ? "sitting out" : `${remaining(color)} left` }}
          </p>
          <button
            v-for="size in [2, 1, 0]"
            :key="size"
            type="button"
            class="pile"
            :aria-pressed="isArmed(color, size)"
            :aria-label="`${SIZE_NAMES[size]} ${color}, ${game.stock[color][size]} left`"
            :disabled="!isLive(color) || game.stock[color][size] === 0"
            @click="arm(color, size)"
          >
            <span class="size-name">{{ SIZE_NAMES[size] }}</span>
            <span class="icons">
              <svg
                v-for="n in 3"
                :key="n"
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                <circle
                  cx="18"
                  cy="18"
                  :r="TRAY[size].r"
                  fill="none"
                  :stroke="n > game.stock[color][size] ? '#cbb892' : PALETTE[color].edge"
                  :stroke-width="TRAY[size].sw + 1.6"
                />
                <circle
                  v-if="n <= game.stock[color][size]"
                  cx="18"
                  cy="18"
                  :r="TRAY[size].r"
                  fill="none"
                  :stroke="PALETTE[color].ink"
                  :stroke-width="TRAY[size].sw"
                />
              </svg>
            </span>
          </button>
        </div>

        <div class="field">
          <div class="grid">
            <template v-for="(row, r) in game.board" :key="r">
              <div v-for="(cell, c) in row" :key="`${r}-${c}`" class="cell">
                <svg viewBox="0 0 100 100" role="group" :aria-label="cellLabel(r, c, cell)">
                  <g v-for="size in [2, 1, 0]" :key="size">
                    <circle
                      class="groove"
                      :class="{
                        ready: armed === size && isLegal(r, c, size),
                        over: previewing(r, c, size),
                      }"
                      cx="50"
                      cy="50"
                      :r="RING[size].r"
                      :stroke-width="RING[size].groove"
                    />
                    <g
                      v-if="cell[size]"
                      class="piece"
                      :class="{ win: isWin(r, c, size), last: isLast(r, c, size) }"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        :r="RING[size].r"
                        fill="none"
                        :stroke="PALETTE[cell[size]].edge"
                        :stroke-width="RING[size].piece + 2.2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        :r="RING[size].r"
                        fill="none"
                        :stroke="PALETTE[cell[size]].ink"
                        :stroke-width="RING[size].piece"
                      />
                    </g>
                    <g v-else-if="previewing(r, c, size)" class="preview">
                      <circle
                        cx="50"
                        cy="50"
                        :r="RING[size].r"
                        fill="none"
                        :stroke="PALETTE[game.turn].edge"
                        :stroke-width="RING[size].piece + 2.2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        :r="RING[size].r"
                        fill="none"
                        :stroke="PALETTE[game.turn].ink"
                        :stroke-width="RING[size].piece"
                      />
                    </g>
                    <circle
                      v-if="isLegal(r, c, size)"
                      class="hot"
                      :class="{ disk: size === 0 }"
                      role="button"
                      tabindex="0"
                      :aria-label="`place ${SIZE_NAMES[size]} ${game.turn} ring, row ${r + 1}, column ${c + 1}`"
                      cx="50"
                      cy="50"
                      :r="HIT[size].r"
                      :stroke-width="size === 0 ? 0 : HIT[size].sw"
                      @click="onPlace(r, c, size)"
                      @keydown="onKey($event, r, c, size)"
                      @mouseenter="hover = { r, c, size }"
                      @mouseleave="clearHover(r, c, size)"
                      @focus="hover = { r, c, size }"
                      @blur="clearHover(r, c, size)"
                    />
                  </g>
                </svg>
              </div>
            </template>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";
import { useFullscreen } from "@/games/fullscreen.js";
import FullscreenButton from "@/games/FullscreenButton.vue";
import {
  COLOR_IDS,
  SIZE_NAMES,
  canPlace,
  createMatch,
  place,
  undo,
  winSummary,
} from "@/games/otrio/logic.js";

const folded = ref(true);

const PALETTE = {
  tan: { ink: "#c99545", edge: "#6e4a22" },
  white: { ink: "#f7f4ee", edge: "#9d8d74" },
  black: { ink: "#222222", edge: "#050505" },
  blue: { ink: "#3a72e4", edge: "#1c4eae" },
};

const RING = {
  0: { r: 12, piece: 7.2, groove: 10 },
  1: { r: 25.5, piece: 8.4, groove: 11 },
  2: { r: 39, piece: 9.6, groove: 12.4 },
};

const HIT = {
  0: { r: 18 },
  1: { r: 26.5, sw: 17 },
  2: { r: 42, sw: 16 },
};

const TRAY = {
  0: { r: 6, sw: 2.5 },
  1: { r: 9, sw: 3.1 },
  2: { r: 12, sw: 3.5 },
};

const BAYS = ["tan", "white", "blue", "black"];

const shell = ref(null);
const full = useFullscreen(shell);
const players = ref(2);
const sittingOut = ref("tan");
const start = ref("tan");
const game = ref(createMatch({ players: 2, start: "tan" }));
const armed = ref(null);
const hover = ref(null);

const blurb = computed(() => {
  const shared =
    " rings stay where they land. a color with nowhere to go is skipped.";
  if (game.value.players === 2) {
    return `two opposite colors each. tan with black, white with blue. one ring a turn, around the board, so you swap colors every time. a line has to be a single color.${shared}`;
  }
  if (game.value.players === 3) {
    return `three players, one color each. the color sitting out is not in the game.${shared}`;
  }
  return `four players, one color each. one ring a turn, around the board.${shared}`;
});

const statusText = computed(() => {
  const current = game.value;
  if (current.winner) {
    return `${who(current.winner)} wins. ${winSummary(current.wins)}`;
  }
  if (current.draw) return "draw. everybody wins this one.";
  const name = `${current.turn}'s turn · player ${current.owners[current.turn] + 1}`;
  const skip = skipText(current.skipped);
  if (armed.value != null) {
    return `${name}. place the ${SIZE_NAMES[armed.value]} ring.${skip}`;
  }
  return `${name}. click a ring on the board.${skip}`;
});

const winKeys = computed(() => {
  const keys = new Set();
  for (const win of game.value.wins) {
    for (const cell of win.cells) keys.add(`${cell.r}.${cell.c}.${cell.size}`);
  }
  return keys;
});

function who(color) {
  return `${color} · player ${game.value.owners[color] + 1}`;
}

function skipText(colors) {
  if (!colors.length) return "";
  const names =
    colors.length === 1
      ? colors[0]
      : colors.length === 2
        ? `${colors[0]} and ${colors[1]}`
        : `${colors.slice(0, -1).join(", ")}, and ${colors.at(-1)}`;
  return ` ${names} had no move.`;
}

function dotStyle(color) {
  const paint = PALETTE[color];
  return {
    background: paint.ink,
    boxShadow: `inset 0 0 0 2px ${paint.edge}`,
  };
}

function restart() {
  const next = createMatch({
    players: players.value,
    sittingOut: sittingOut.value,
    start: start.value,
  });
  start.value = next.start;
  game.value = next;
  armed.value = null;
  hover.value = null;
}

function gameInProgress() {
  const current = game.value;
  return current.history.length > 0 && !current.winner && !current.draw;
}

function confirmRestart() {
  if (!gameInProgress()) return true;
  return confirm("throw away this game?");
}

function setPlayers(count) {
  if (players.value === count) return;
  if (!confirmRestart()) return;
  players.value = count;
  restart();
}

function setOut(color) {
  if (sittingOut.value === color) return;
  if (!confirmRestart()) return;
  sittingOut.value = color;
  restart();
}

function setStart(color) {
  if (start.value === color) return;
  if (!confirmRestart()) return;
  start.value = color;
  restart();
}

function onUndo() {
  game.value = undo(game.value);
  armed.value = null;
  hover.value = null;
}

function isLive(color) {
  const current = game.value;
  return !current.winner && !current.draw && current.turn === color;
}

function isWon(color) {
  const current = game.value;
  if (!current.winner) return false;
  return current.owners[color] === current.owners[current.winner];
}

function isOut(color) {
  return game.value.owners[color] == null;
}

function isTeam(color) {
  const current = game.value;
  if (current.players !== 2 || current.winner || current.draw) return false;
  return (
    current.owners[color] === current.owners[current.turn] &&
    current.turn !== color
  );
}

function remaining(color) {
  return game.value.stock[color].reduce((sum, count) => sum + count, 0);
}

function isArmed(color, size) {
  return isLive(color) && armed.value === size;
}

function arm(color, size) {
  if (!isLive(color) || game.value.stock[color][size] <= 0) return;
  armed.value = armed.value === size ? null : size;
}

function isLegal(r, c, size) {
  if (armed.value != null && armed.value !== size) return false;
  return canPlace(game.value, r, c, size);
}

function previewing(r, c, size) {
  const spot = hover.value;
  return !!spot && spot.r === r && spot.c === c && spot.size === size && isLegal(r, c, size);
}

function isWin(r, c, size) {
  return winKeys.value.has(`${r}.${c}.${size}`);
}

function isLast(r, c, size) {
  const last = game.value.history.at(-1);
  return !!last && last.r === r && last.c === c && last.size === size;
}

function cellLabel(r, c, cell) {
  const parts = SIZE_NAMES.map((name, size) =>
    cell[size] ? `${name} ${cell[size]}` : `${name} empty`,
  );
  return `row ${r + 1}, column ${c + 1}. ${parts.join(", ")}`;
}

function clearHover(r, c, size) {
  const spot = hover.value;
  if (spot && spot.r === r && spot.c === c && spot.size === size) hover.value = null;
}

function onPlace(r, c, size) {
  if (!isLegal(r, c, size)) return;
  const next = place(game.value, r, c, size);
  if (next === game.value) return;
  game.value = next;
  armed.value = null;
  hover.value = null;
}

function onKey(event, r, c, size) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onPlace(r, c, size);
}
</script>

<style scoped>
main.otrio {
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  align-items: stretch;
  justify-content: flex-start;
}

main.otrio.screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  width: auto;
  max-width: none;
  height: auto;
  margin: 0;
  overflow: auto;
  background: #000;
  padding: 20px 24px 24px;
}

main.otrio.screen h1 {
  font-size: 42px;
  margin-bottom: 8px;
}

main.otrio.screen .intro,
main.otrio.screen .ways,
main.otrio.screen .fine,
main.otrio.screen .blurb {
  display: none;
}

main.otrio.screen .column {
  max-width: 1080px;
}

main.otrio.screen .field {
  width: min(100%, 640px);
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
.fine,
.blurb {
  max-width: 68ch;
  margin: 0 0 22px;
  color: #888;
  font-size: 16px;
  line-height: 1.55;
}

.fine {
  margin-top: -10px;
  font-size: 14px;
}

.fold {
  display: none;
}

.column {
  width: 100%;
  max-width: 880px;
}

.ways {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
  font-size: 15px;
  line-height: 1.45;
}

.ways li {
  border: 1px solid #222;
  padding: 14px 14px 16px;
  color: #aaa;
}

.way {
  display: block;
  width: 100%;
  max-width: 168px;
  height: auto;
  margin-bottom: 10px;
}

.way.single {
  max-width: 64px;
}

.dim {
  fill: none;
  stroke: #3a3a3a;
  stroke-width: 3;
}

.hot-ring {
  fill: none;
  stroke: #3a72e4;
  stroke-width: 4;
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
.pile:focus-visible,
.hot:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.dot,
.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  border: 1px solid #666;
  border-radius: 50%;
  vertical-align: -1px;
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
  margin: 0 0 16px;
  color: #ccc;
  font-size: 16px;
  line-height: 1.45;
}

.status.over {
  color: #fff;
  font-size: 18px;
}

.swatch {
  width: 14px;
  height: 14px;
  margin: 0;
  flex: none;
}

.slab {
  display: grid;
  grid-template-columns: minmax(148px, 176px) minmax(260px, 1fr) minmax(148px, 176px);
  grid-template-rows: auto auto;
  grid-template-areas:
    "tan field white"
    "blue field black";
  gap: 8px 14px;
  padding: 16px;
  border-radius: 32px;
  background-color: #efdfc4;
  background-image:
    radial-gradient(ellipse at 15% 0%, rgba(255, 255, 255, 0.45), transparent 42%),
    radial-gradient(ellipse at 100% 100%, rgba(150, 100, 40, 0.14), transparent 46%);
  box-shadow:
    0 0 0 1px #c3ae8c,
    0 18px 50px rgba(0, 0, 0, 0.45);
  user-select: none;
}

.bay {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 8px;
  border-radius: 16px;
  color: #3f2e1e;
}

.bay.tan {
  grid-area: tan;
  justify-self: end;
  align-self: start;
}

.bay.white {
  grid-area: white;
  justify-self: start;
  align-self: start;
}

.bay.blue {
  grid-area: blue;
  justify-self: end;
  align-self: end;
}

.bay.black {
  grid-area: black;
  justify-self: start;
  align-self: end;
}

.bay.team {
  background: rgba(255, 255, 255, 0.18);
}

.bay.live {
  background: rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 0 0 2px var(--edge);
}

.bay.won {
  background: rgba(226, 179, 58, 0.28);
  box-shadow: inset 0 0 0 2px #e2b33a;
}

.bay.out {
  opacity: 0.42;
}

.bay-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 13px;
}

.bay-top strong {
  font-weight: 700;
}

.chip {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--edge);
  color: #fff;
  font-size: 11px;
}

.left {
  margin: 0 0 4px;
  color: #6d563c;
  font-size: 12px;
}

.pile {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 2px 4px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.pile[aria-pressed="true"] {
  background: rgba(255, 255, 255, 0.55);
}

.pile:disabled {
  opacity: 1;
  cursor: default;
}

.size-name {
  width: 52px;
  flex: none;
  font-size: 11px;
  text-align: left;
}

.icons {
  display: flex;
  gap: 2px;
}

.icons svg {
  display: block;
  width: 24px;
  height: 24px;
}

.field {
  grid-area: field;
  width: min(100%, 430px);
  justify-self: center;
  align-self: center;
  padding: 12px;
  border-radius: 20px;
  box-shadow:
    inset 0 0 0 2px rgba(130, 92, 40, 0.28),
    inset 0 0 0 6px rgba(255, 250, 240, 0.18);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.cell {
  position: relative;
  aspect-ratio: 1;
}

.cell svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.groove {
  fill: none;
  stroke: #c9b28c;
  pointer-events: none;
}

.groove.ready,
.groove.over {
  stroke: #8d6840;
}

.piece,
.preview {
  pointer-events: none;
}

.piece {
  filter: drop-shadow(0 1px 0 rgba(80, 50, 20, 0.35));
}

.piece.last:not(.win) {
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.95));
}

.piece.win {
  filter: drop-shadow(0 0 2px #ffe08a) drop-shadow(0 0 5px #e2b33a);
}

.piece.last {
  animation: settle 0.18s ease-out;
}

.preview {
  opacity: 0.62;
}

.hot {
  fill: none;
  stroke: transparent;
  cursor: pointer;
  pointer-events: stroke;
}

.hot.disk {
  fill: transparent;
  pointer-events: all;
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
  .piece.last {
    animation: none;
  }
}

@media (max-width: 760px) {
  main.otrio {
    padding: 36px 16px 64px;
  }

  .column {
    display: flex;
    flex-direction: column;
  }

  .slab {
    order: -1;
  }

  .fold {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    min-height: 44px;
    margin: 0 0 12px;
    padding: 0 14px;
    border: 1px solid #333;
    background: #000;
    color: #fff;
    font: inherit;
  }

  .otrio.folded .ways,
  .otrio.folded .fine,
  .otrio.folded .controls {
    display: none;
  }

  .ways {
    grid-template-columns: 1fr;
  }

  .slab {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      "field field"
      "tan white"
      "blue black";
    gap: 10px;
    padding: 12px;
    border-radius: 22px;
  }

  .bay.tan,
  .bay.white,
  .bay.blue,
  .bay.black {
    justify-self: stretch;
    align-self: stretch;
  }
}

@media (pointer: coarse) {
  .choice button,
  .pile,
  .fold {
    min-height: 44px;
  }
}
</style>
