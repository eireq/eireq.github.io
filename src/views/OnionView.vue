<template>
  <main class="onion">
    <section v-if="screen === 'ready'" class="ready">
      <h1>onion.</h1>
      <p class="intro">
        type the word onion for 15 seconds. a clean run goes on the onion board.
        one wrong letter, and that run goes on the mistake board instead.
        yes, this IS a copy / inspiration of 6-7.com ... havent changed design much yet
      </p>
      <div class="ready-actions">
        <button class="primary" type="button" @click="start">start</button>
        <button class="ghost" type="button" @click="openBoard('onion')">onion board</button>
        <button class="ghost" type="button" @click="openBoard('mistake')">mistake board</button>
      </div>
      <label class="name">
        name
        <input
          v-model="name"
          maxlength="30"
          autocomplete="nickname"
          @change="saveName"
          @blur="saveName"
        />
      </label>
      <p class="hint">lowercase. the space counts. backspace can undo a letter. scripts stay off the boards.</p>
      <p class="back"><router-link to="/games">← games</router-link></p>
    </section>

    <section v-else-if="screen === 'play'" class="play" @click="focusCatcher">
      <h1 class="clock">{{ clock }}</h1>
      <p v-if="run.startedAt == null" class="live">type to start</p>
      <p v-else class="live">
        <span :class="{ hot: slipped }">{{ slipped ? "slipped" : "clean" }}</span>
        · {{ onions }} {{ onions === 1 ? "onion" : "onions" }}
      </p>
      <div ref="prompt" class="prompt">
        <template v-for="(cell, index) in cells.cells" :key="index">
          <span v-if="index === cells.caret" :ref="setCaret" class="caret"></span>
          <span :class="cell.kind">{{ showCell(cell) }}</span>
        </template>
        <span v-if="cells.caret === cells.cells.length" :ref="setCaret" class="caret"></span>
      </div>
      <p class="hint">{{ run.startedAt == null && !focused ? "click and type" : "backspace undoes a letter" }}</p>
      <button class="textish" type="button" @click.stop="giveUp">give up</button>
      <input
        ref="catcher"
        class="catcher"
        aria-label="type onion"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        @beforeinput="onBeforeInput"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
    </section>

    <section v-else-if="screen === 'result' && result" class="result">
      <p class="eyebrow">result</p>
      <h1 class="score" :class="{ 'score-void': result.blocked }">{{ result.blocked ? "no" : result.wpm }}</h1>
      <p class="unit">{{ result.blocked ? "board" : "wpm" }}</p>
      <p class="rank-name">
        {{ result.blocked ? "void" : title.name }}<span v-if="!result.blocked && title.flame" class="flame"> 🔥</span>
      </p>
      <template v-if="place">
        <p class="place">you rank <span class="hash">#{{ place.rank }}</span> all-time</p>
        <p class="which">{{ result.board }} board · {{ onionLabel(result.onions) }}</p>
        <p class="climb">keep climbing —</p>
        <p class="beat">you beat {{ place.beat }}%</p>
        <p class="of">of {{ players }}</p>

        <div class="hist" aria-hidden="true">
          <div
            v-for="(bar, index) in place.histogram.bars"
            :key="index"
            class="bar"
            :class="{ mine: bar.mine, empty: bar.count === 0 }"
            :style="bar.count ? { height: `${Math.round(bar.height * 112)}px` } : null"
          >
            <span v-if="bar.mine" class="pin"></span>
          </div>
        </div>
        <div class="axis" aria-hidden="true">
          <span>0</span>
          <span>{{ place.histogram.mid }}</span>
          <span>{{ place.histogram.cap === 130 ? "130+" : place.histogram.cap }}</span>
        </div>
      </template>
      <p v-else class="blocked">
        {{ result.blocked ? "a script typed this. it stays off both boards." : savedNote }}
      </p>

      <div class="slip">
        <h2>{{ result.mistakes ? "where you made a mistake" : "what you typed" }}</h2>
        <p v-if="result.tape.length" class="passage">
          <template v-for="(cell, index) in result.tape" :key="index">
            <mark v-if="!cell.ok" class="miss" :title="`needed ${expectLabel(cell.expected)}`">{{
              showTape(cell)
            }}</mark>
            <span v-else>{{ cell.char }}</span>
          </template>
        </p>
        <p v-else class="slip-line">nothing typed.</p>
        <template v-if="result.slips.length">
          <p v-for="slip in shownSlips" :key="slip.start" class="slip-line">
            you typed <mark class="miss">{{ slip.typedLabel }}</mark> where it needed
            {{ neededText(slip) }}.
          </p>
          <p v-if="extraSlips" class="slip-line">and {{ extraSlips }} more in the text above.</p>
        </template>
        <p v-if="result.blocked" class="slip-line">this run stays off the boards.</p>
        <p v-else-if="result.tape.length && !result.slips.length" class="slip-line">
          no mistakes. this run stays on the onion board.
        </p>
      </div>

      <div class="actions">
        <button type="button" @click="shareScore">{{ shareNote || "share score" }}</button>
        <button type="button" @click="openBoard(result.board)">leaderboard</button>
        <button class="again" type="button" @click="start">play again</button>
      </div>
      <p v-if="savedNote && place" class="saved">{{ savedNote }}</p>
      <p class="back"><router-link to="/games">← games</router-link></p>
    </section>

    <section v-else-if="screen === 'board'" class="board">
      <button class="textish back-btn" type="button" @click="closeBoard">← back</button>
      <h1>{{ boardName }} board.</h1>
      <div class="tabs">
        <button type="button" :class="{ on: boardName === 'onion' }" @click="openBoard('onion')">
          onion
        </button>
        <button
          type="button"
          :class="{ on: boardName === 'mistake' }"
          @click="openBoard('mistake')"
        >
          mistake
        </button>
      </div>
      <p class="hint">{{ boardStatus }}</p>
      <ol v-if="rows.length" class="scores" :class="boardName">
        <li
          v-for="(row, index) in rows"
          :key="row.id"
          :class="{ mine: row.id === mineId }"
        >
          <span class="pos">{{ rowRank(index) }}</span>
          <span class="who">{{ row.name }}</span>
          <span class="wpm">{{ row.wpm }} wpm</span>
          <span>{{ onionLabel(row.onions) }}</span>
          <span v-if="boardName === 'mistake'">{{ row.mistakes }} missed</span>
        </li>
      </ol>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { copyShareCard } from "../data/shareCard.js";
import { getPlayerName, setPlayerName } from "../data/profile.js";
import { ensureGameDb } from "../games/ensureDb.js";
import { createTrace, pushDown, pushHold } from "../games/onion/fair.js";
import {
  CYCLE,
  createRun,
  press,
  ROUND_MS,
  summarize,
  tick,
  windowCells,
} from "../games/onion/logic.js";
import { playerCount, ranked, standings, titleFor } from "../games/onion/ranks.js";
import { fromRemote } from "../games/onion/storage.js";

const screen = ref("ready");
const name = ref(getPlayerName());
const run = ref(createRun());
const result = ref(null);
const place = ref(null);
const savedNote = ref("");
const shareNote = ref("");
const focused = ref(false);
const boardName = ref("onion");
const boardStatus = ref("");
const rows = ref([]);
const mineId = ref("");

const catcher = ref(null);
const prompt = ref(null);
const caretEl = ref(null);

let timer = 0;
let locking = false;
let alive = true;
let typedFromKey = false;
let deletedFromKey = false;
let trace = createTrace();
let hiddenKeys = 0;
const downAt = new Map();

const cells = computed(() => windowCells(run.value));
const slipped = computed(() => run.value.tape.some((cell) => !cell.ok));
const onions = computed(() => Math.floor(run.value.index / CYCLE));
const clock = computed(() => {
  const left =
    run.value.startedAt == null ? ROUND_MS : Math.max(0, ROUND_MS - run.value.elapsed);
  return (left / 1000).toFixed(1);
});
const title = computed(() => titleFor(result.value?.wpm || 0));
const players = computed(() => playerCount(place.value?.total || 0));
const shownSlips = computed(() => (result.value?.slips || []).slice(0, 8));
const extraSlips = computed(() => Math.max(0, (result.value?.slips.length || 0) - 8));

function saveName() {
  name.value = setPlayerName(name.value);
}

function onionLabel(count) {
  return `${count} ${count === 1 ? "onion" : "onions"}`;
}

function showCell(cell) {
  if (cell.kind === "bad" && cell.char === " ") return "␣";
  return cell.char;
}

function showTape(cell) {
  if (!cell.ok && cell.char === " ") return "␣";
  return cell.char;
}

function expectLabel(char) {
  return char === " " ? "a space" : char;
}

function neededText(slip) {
  if ([...slip.expected].every((char) => char === " ")) {
    return slip.expected.length === 1 ? "a space" : `${slip.expected.length} spaces`;
  }
  return slip.expectedLabel;
}

function focusCatcher() {
  catcher.value?.focus();
}

function setCaret(el) {
  if (el) caretEl.value = el;
}

function keepCaret() {
  const box = prompt.value;
  const caret = caretEl.value;
  if (!box || !caret) return;
  const top = caret.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
  const bottom = top + caret.offsetHeight;
  if (bottom > box.scrollTop + box.clientHeight - 8) {
    box.scrollTop = bottom - box.clientHeight + 16;
  }
}

function clockNow() {
  return performance.now();
}

function boardProblem(error) {
  const text = String(error || "");
  if (/onion_scores|schema cache|PGRST205|relation/i.test(text)) {
    return "the global board isn't set up yet.";
  }
  return "the global board isn't reachable.";
}

function hit(key) {
  if (screen.value !== "play" || run.value.finished || trace.voided) return;
  press(run.value, key, clockNow());
  nextTick(keepCaret);
  if (run.value.finished) complete();
}

function voidScript() {
  if (trace.voided !== "script") trace.voided = "script";
  if (run.value.finished) return;
  run.value.finished = true;
  run.value.elapsed = ROUND_MS;
  complete();
}

function start() {
  saveName();
  clearInterval(timer);
  locking = false;
  result.value = null;
  place.value = null;
  shareNote.value = "";
  savedNote.value = "";
  trace = createTrace();
  hiddenKeys = 0;
  downAt.clear();
  run.value = createRun();
  screen.value = "play";
  nextTick(() => {
    focusCatcher();
    focused.value = true;
  });
  timer = setInterval(() => {
    tick(run.value, clockNow());
    if (run.value.finished) complete();
  }, 50);
}

function giveUp() {
  clearInterval(timer);
  screen.value = "ready";
}

async function complete() {
  if (locking || !run.value.finished) return;
  locking = true;
  clearInterval(timer);

  const summary = summarize(run.value);
  summary.blocked = trace.voided === "script";
  result.value = summary;

  if (summary.blocked) {
    place.value = null;
    savedNote.value = "";
    mineId.value = "";
    screen.value = "result";
    return;
  }

  const name = getPlayerName();
  let savedOn = "the global board didn't save this run.";
  try {
    const db = ensureGameDb();
    if (!db?.ready?.()) {
      savedOn = "the global board isn't reachable.";
    } else {
      const sent = await db.submitOnionScore({ ...summary, name });
      if (sent?.ok && sent.row) {
        const [remote, counts] = await Promise.all([
          db.getOnionScores(summary.board),
          db.onionCounts(summary.board, summary.wpm),
        ]);
        if (remote?.ok) {
          const scores = remote.rows.map(fromRemote).filter(Boolean);
          const row = fromRemote(sent.row);
          if (row && alive) {
            place.value = standings(scores, row, counts?.ok ? counts : null);
            mineId.value = row.id;
            savedOn = "saved to the global board.";
            savedNote.value = savedOn;
            screen.value = "result";
            return;
          }
        }
        savedOn = boardProblem(remote?.error);
      } else {
        savedOn = boardProblem(sent?.error);
      }
    }
  } catch {
    savedOn = "the global board didn't save this run.";
  }

  if (!alive) return;
  place.value = null;
  mineId.value = "";
  savedNote.value = savedOn;
  screen.value = "result";
}

function onKeyDown(event) {
  if (screen.value !== "play" || run.value.finished) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (!event.isTrusted) {
    event.preventDefault();
    voidScript();
    return;
  }
  if (document.hidden) {
    hiddenKeys += 1;
    if (hiddenKeys >= 3) voidScript();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    giveUp();
    return;
  }
  if (event.repeat || event.key === "Unidentified" || event.key === "Process") return;
  if (event.key !== "Backspace" && event.key.length !== 1) return;

  const at = clockNow();
  pushDown(trace, at);
  downAt.set(event.key, at);
  if (trace.voided) {
    event.preventDefault();
    voidScript();
    return;
  }

  event.preventDefault();
  if (event.key === "Backspace") {
    deletedFromKey = true;
    hit("Backspace");
    requestAnimationFrame(() => {
      deletedFromKey = false;
    });
    return;
  }
  typedFromKey = true;
  hit(event.key);
  requestAnimationFrame(() => {
    typedFromKey = false;
  });
}

function onKeyUp(event) {
  if (screen.value !== "play" || !event.isTrusted || event.repeat) return;
  const started = downAt.get(event.key);
  if (started == null) return;
  downAt.delete(event.key);
  pushHold(trace, clockNow() - started);
  if (trace.voided) voidScript();
}

function onBeforeInput(event) {
  if (screen.value !== "play" || run.value.finished) return;
  if (typedFromKey && event.inputType === "insertText") return;
  if (deletedFromKey && event.inputType === "deleteContentBackward") return;
  const pasted =
    event.inputType === "insertFromPaste" ||
    event.inputType === "insertFromDrop" ||
    (event.data && event.data.length > 1);
  if (!event.isTrusted || pasted) {
    event.preventDefault();
    voidScript();
    return;
  }
  if (event.inputType === "insertText" && event.data) {
    event.preventDefault();
    const at = clockNow();
    pushDown(trace, at);
    if (trace.voided) {
      voidScript();
      return;
    }
    for (const char of event.data) hit(char);
    return;
  }
  if (event.inputType === "deleteContentBackward") {
    event.preventDefault();
    hit("Backspace");
  }
}

function onInput(event) {
  event.target.value = "";
}

async function shareScore() {
  if (!result.value || (!place.value && !result.value.blocked)) return;
  try {
    const status = await copyShareCard({
      title: result.value.blocked ? "void" : `${result.value.wpm} wpm`,
      lines: result.value.blocked
        ? ["script", "not on the board"]
        : [
            title.value.name,
            `${result.value.board} board`,
            `rank #${place.value.rank}`,
            onionLabel(result.value.onions),
          ],
    });
    shareNote.value = status === "copied" ? "copied" : "saved";
  } catch {
    shareNote.value = "not copied";
  }
  window.setTimeout(() => {
    shareNote.value = "";
  }, 1600);
}

async function openBoard(which) {
  boardName.value = which === "mistake" ? "mistake" : "onion";
  const previous = screen.value;
  screen.value = "board";
  boardStatus.value = "loading...";
  rows.value = [];

  let listed = [];
  let source = "global";
  try {
    const db = ensureGameDb();
    if (!db?.ready?.()) {
      boardStatus.value = "the global board isn't reachable.";
      return;
    }
    const remote = await db.getOnionScores(boardName.value);
    if (!remote?.ok) {
      boardStatus.value = boardProblem(remote?.error);
      return;
    }
    listed = ranked(remote.rows.map(fromRemote).filter(Boolean), boardName.value);
  } catch {
    if (!alive) return;
    boardStatus.value = "the global board isn't reachable.";
    return;
  }

  if (!alive) return;
  if (previous === "ready") mineId.value = "";
  rows.value = listed.slice(0, 50);
  if (!listed.length) {
    boardStatus.value =
      boardName.value === "onion" ? "no clean runs yet." : "nobody has missed a letter yet.";
    return;
  }
  boardStatus.value = listed.length > 50 ? `${source} · top 50` : source;
}

function closeBoard() {
  screen.value = result.value ? "result" : "ready";
}

function rowRank(index) {
  const wpm = rows.value[index]?.wpm;
  return rows.value.findIndex((row) => row.wpm === wpm) + 1;
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
});

onBeforeUnmount(() => {
  alive = false;
  clearInterval(timer);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
});
</script>

<style scoped>
.onion {
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 64px 24px 90px;
}

.ready h1,
.board h1 {
  font-size: clamp(56px, 10vw, 92px);
  line-height: 0.92;
  letter-spacing: -4px;
  margin: 0 0 18px;
}

.intro,
.hint,
.saved,
.which,
.of,
.slip-line {
  color: #888;
}

.intro {
  max-width: 640px;
  margin: 0 0 28px;
  font-size: 18px;
  line-height: 1.6;
}

.ready-actions,
.tabs,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary,
.ghost,
.tabs button,
.actions button {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #fff;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}

.primary {
  background: #fff;
  color: #000;
}

.ghost,
.tabs button,
.actions button {
  background: transparent;
  color: #fff;
}

.tabs {
  margin: 8px 0 18px;
}

.tabs button.on {
  background: #fff;
  color: #000;
}

.name {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 280px;
  margin-top: 28px;
  color: #888;
  font-size: 14px;
}

.name input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #fff;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 16px;
}

.hint,
.saved,
.back {
  margin-top: 18px;
  font-size: 15px;
}

.back a {
  color: #fff;
}

.play {
  position: relative;
  min-height: 60vh;
}

.clock {
  margin: 0;
  text-align: center;
  font-size: clamp(72px, 14vw, 112px);
  line-height: 0.9;
  letter-spacing: -4px;
}

.live {
  margin: 10px 0 0;
  text-align: center;
  color: #888;
  font-size: 16px;
}

.hot {
  color: #f5cf3d;
}

.prompt {
  position: relative;
  max-width: 740px;
  max-height: 7.8em;
  overflow: auto;
  margin: 32px auto 0;
  font-family: ui-monospace, Consolas, "Courier New", monospace;
  font-size: clamp(22px, 4vw, 34px);
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.done {
  color: #f3f3f3;
}

.bad {
  background: #f5cf3d;
  color: #000;
}

.next {
  color: #3a3a3a;
}

.caret {
  display: inline-block;
  width: 2px;
  height: 0.9em;
  margin: 0 1px -2px;
  background: #f5cf3d;
  animation: blink 1s steps(1) infinite;
}

.play .hint,
.play .textish {
  text-align: center;
}

.textish {
  display: block;
  margin: 8px auto 0;
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: #888;
  font: inherit;
  cursor: pointer;
}

.textish:hover,
.back a:hover {
  color: #fff;
}

.catcher {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  font-size: 16px;
}

.result {
  text-align: center;
}

.eyebrow,
.unit,
.climb {
  margin: 0;
  color: #8d8d8d;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.38em;
  text-transform: uppercase;
}

.blocked {
  max-width: 420px;
  margin: 28px auto 0;
  color: #ccc;
  font-size: 18px;
  line-height: 1.5;
}

.score {
  margin: 10px 0 0;
  color: #f5cf3d;
  font-family: "Arial Black", Arial, sans-serif;
  font-size: clamp(108px, 22vw, 168px);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -6px;
}

.score-void {
  font-size: clamp(72px, 14vw, 120px);
}

.unit {
  margin-top: 8px;
  letter-spacing: 0.28em;
}

.rank-name {
  margin: 22px 0 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.place {
  margin: 22px 0 0;
  color: #eee;
  font-size: 18px;
}

.hash {
  color: #f5cf3d;
  font-weight: 700;
}

.which {
  margin: 6px 0 0;
  font-size: 14px;
}

.climb {
  margin-top: 28px;
  letter-spacing: 0.22em;
}

.beat {
  margin: 16px 0 0;
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 700;
  letter-spacing: -1px;
}

.of {
  margin: 4px 0 0;
  font-size: 16px;
}

.hist {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  height: 128px;
  margin: 28px auto 0;
}

.bar {
  position: relative;
  width: 16px;
  border-radius: 4px 4px 2px 2px;
  background: #454545;
}

.bar:nth-child(odd) {
  background: #3a3a3a;
}

.bar.empty {
  height: 8px;
  border-radius: 3px;
  background: #2c2c2c;
}

.bar.mine {
  background: #f5cf3d;
}

.pin {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
  border-top: 7px solid #f5cf3d;
}

.axis {
  display: flex;
  justify-content: space-between;
  width: min(100%, 392px);
  margin: 8px auto 0;
  color: #666;
  font-size: 13px;
}

.slip {
  width: min(100%, 640px);
  margin: 34px auto 0;
  padding-top: 22px;
  border-top: 1px solid #222;
  text-align: left;
}

.slip h2 {
  margin: 0 0 14px;
  color: #8d8d8d;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.passage {
  margin: 0 0 12px;
  font-family: ui-monospace, Consolas, "Courier New", monospace;
  font-size: 18px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #ccc;
}

.miss {
  background: #f5cf3d;
  color: #000;
  padding: 0 2px;
}

.slip-line {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.5;
}

.actions {
  justify-content: center;
  margin-top: 28px;
}

.actions button {
  flex: 1 1 150px;
  max-width: 210px;
  border-color: #333;
  border-radius: 999px;
  background: #2a2a2a;
}

.actions .again {
  border-color: #f5cf3d;
  background: #f5cf3d;
  color: #000;
  font-weight: 700;
}

.actions button:hover {
  border-color: #fff;
}

.actions .again:hover {
  border-color: #ffe27a;
  background: #ffe27a;
}

.saved {
  margin-top: 14px;
  font-size: 13px;
}

.scores {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}

.scores li {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: baseline;
  padding: 12px 0;
  border-top: 1px solid #222;
}

.scores.mistake li {
  grid-template-columns: 42px minmax(0, 1fr) auto auto auto;
}

.scores .pos,
.scores .who {
  color: #ccc;
}

.scores .wpm {
  font-weight: 700;
}

.who {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scores .mine {
  color: #f5cf3d;
}

.scores .mine .pos,
.scores .mine .who {
  color: #f5cf3d;
}

.back-btn {
  margin: 0 0 12px;
  padding-left: 0;
}

@media (max-width: 700px) {
  .onion {
    padding: 40px 18px 70px;
  }

  .ready h1,
  .board h1,
  .clock,
  .score {
    letter-spacing: -2px;
  }

  .hist {
    gap: 4px;
  }

  .bar {
    width: 10px;
  }

  .axis {
    width: min(100%, 250px);
  }

  .scores li,
  .scores.mistake li {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }

  .scores li span:nth-child(n + 4) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
