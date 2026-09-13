<template>
  <main class="kht-page">
    <header class="kht-heading">
      <div>
        <p class="eyebrow">370 entries · single elimination</p>
        <h1>KHT</h1>
        <p class="intro">
          Enter the scores for each matchup. The higher score advances, and odd
          rounds give the last unpaired entry a bye.
        </p>
      </div>
      <div class="header-status" :class="{ 'is-owner': isOwner }">
        <span class="status-dot"></span>
        {{ isOwner ? "owner editing enabled" : "public view" }}
      </div>
    </header>

    <section v-if="!isOwner" class="owner-panel">
      <div>
        <strong>Owner access</strong>
        <p>Only the tournament owner can edit item names or scores.</p>
      </div>
      <form class="login-form" @submit.prevent="requestLogin">
        <input
          v-model="email"
          type="email"
          placeholder="owner email"
          aria-label="Owner email"
          required
        />
        <button type="submit" :disabled="loginPending">
          {{ loginPending ? "sending..." : "send login link" }}
        </button>
      </form>
      <p v-if="loginMessage" class="login-message">{{ loginMessage }}</p>
    </section>
    <section v-else class="owner-panel owner-panel--active">
      <div>
        <strong>Editing as owner</strong>
        <p>Changes save automatically for everyone viewing this bracket.</p>
      </div>
      <button type="button" class="secondary-button" @click="logout">
        sign out
      </button>
    </section>

    <p v-if="loadError" class="notice">{{ loadError }}</p>
    <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>

    <section class="bracket-shell" aria-label="KHT tournament bracket">
      <div class="bracket" :class="{ 'bracket--editing': isOwner }">
        <section
          v-for="(round, roundIndex) in rounds"
          :key="roundIndex"
          class="round"
        >
          <header class="round-heading">
            <span>{{ roundName(roundIndex) }}</span>
            <small
              >{{ round.length }} match{{
                round.length === 1 ? "" : "es"
              }}</small
            >
          </header>
          <div class="matches">
            <article
              v-for="(match, matchIndex) in round"
              :key="`${roundIndex}-${matchIndex}`"
              class="match"
              :class="{ 'match--bye': match.bye }"
            >
              <div
                class="competitor"
                :class="{ winner: match.winner === match.a?.id }"
              >
                <input
                  v-if="roundIndex === 0 && isOwner && match.a"
                  v-model="match.a.name"
                  class="item-name"
                  :disabled="!match.a"
                  @change="persist"
                />
                <span v-else class="item-name">{{
                  match.a?.name || "waiting"
                }}</span>
                <input
                  v-if="isOwner && match.a && !match.bye"
                  v-model.number="scores[scoreKey(roundIndex, matchIndex, 'a')]"
                  class="score-input"
                  type="number"
                  min="0"
                  aria-label="Score for first item"
                  @change="persist"
                />
                <span v-else-if="match.a && !match.bye" class="score">{{
                  scoreFor(roundIndex, matchIndex, "a")
                }}</span>
              </div>
              <div
                v-if="!match.bye"
                class="competitor"
                :class="{ winner: match.winner === match.b?.id }"
              >
                <span class="item-name">{{ match.b?.name || "waiting" }}</span>
                <input
                  v-if="isOwner && match.b"
                  v-model.number="scores[scoreKey(roundIndex, matchIndex, 'b')]"
                  class="score-input"
                  type="number"
                  min="0"
                  aria-label="Score for second item"
                  @change="persist"
                />
                <span v-else-if="match.b" class="score">{{
                  scoreFor(roundIndex, matchIndex, "b")
                }}</span>
              </div>
              <span v-else class="bye-label">bye</span>
            </article>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  khtOwnerId,
  loadBracket,
  saveBracket,
  sendKhtLogin,
  signOutKht,
  watchKhtAuth,
} from "../games/kht/supabase.js";

const ENTRY_COUNT = 370;
const email = ref("");
const loginMessage = ref("");
const loginPending = ref(false);
const loadError = ref("");
const saveMessage = ref("");
const session = ref(null);
const items = ref(createItems());
const scores = reactive({});
let stopWatchingAuth = () => {};
let saveTimer;

const isOwner = computed(() =>
  Boolean(session.value?.user?.id && session.value.user.id === khtOwnerId),
);

const rounds = computed(() => {
  const result = [];
  let participants = items.value;
  let roundIndex = 0;

  while (participants.length > 1) {
    const matches = [];
    for (let index = 0; index < participants.length; index += 2) {
      const a = participants[index] || null;
      const b = participants[index + 1] || null;
      const bye = Boolean(a && !b);
      const aScore = scoreValue(roundIndex, matches.length, "a");
      const bScore = scoreValue(roundIndex, matches.length, "b");
      const winner = bye
        ? a?.id || null
        : a && b && aScore !== null && bScore !== null
          ? aScore > bScore
            ? a.id
            : bScore > aScore
              ? b.id
              : null
          : null;
      matches.push({ a, b, bye, winner });
    }
    result.push(matches);
    participants = matches.map((match) =>
      match.winner ? (match.winner === match.a?.id ? match.a : match.b) : null,
    );
    roundIndex += 1;
  }

  if (participants.length === 1 && participants[0])
    result.push([
      {
        a: participants[0],
        b: null,
        bye: true,
        winner: participants[0]?.id || null,
      },
    ]);
  return result;
});

function createItems() {
  return Array.from({ length: ENTRY_COUNT }, (_, index) => ({
    id: `item-${index + 1}`,
    name: `Item ${String(index + 1).padStart(3, "0")}`,
  }));
}

function normalizeItems(savedItems) {
  const defaults = createItems();

  if (!Array.isArray(savedItems)) return defaults;

  return defaults.map((item, index) => {
    const saved = savedItems[index];

    return saved && typeof saved === "object" && saved.id
      ? {
          id: String(saved.id),
          name: typeof saved.name === "string" ? saved.name : item.name,
        }
      : item;
  });
}

function scoreKey(round, match, side) {
  return `${round}-${match}-${side}`;
}

function scoreValue(round, match, side) {
  const value = scores[scoreKey(round, match, side)];
  return value === "" ||
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
    ? null
    : Math.max(0, Number(value));
}

function scoreFor(round, match, side) {
  const value = scoreValue(round, match, side);
  return value === null ? "-" : value;
}

function roundName(index) {
  const remaining = rounds.value[index]?.length || 0;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semi-finals";
  if (remaining === 4) return "Quarter-finals";
  return `Round ${index + 1}`;
}

async function requestLogin() {
  loginPending.value = true;
  const result = await sendKhtLogin(email.value.trim());
  loginMessage.value =
    result.error || "Check your email for the owner login link.";
  loginPending.value = false;
}

async function logout() {
  await signOutKht();
  session.value = null;
}

async function persist() {
  if (!isOwner.value) return;
  clearTimeout(saveTimer);
  saveMessage.value = "saving...";
  saveTimer = setTimeout(async () => {
    const result = await saveBracket({
      items: items.value,
      scores: { ...scores },
    });
    saveMessage.value = result.error || "saved";
    if (result.error) loadError.value = result.error;
  }, 250);
}

async function load() {
  const result = await loadBracket();
  if (result.error) {
    loadError.value = result.error;
    return;
  }
  if (!result.data) return;
  items.value = normalizeItems(result.data.items);
  Object.assign(scores, result.data.scores || {});
}

onMounted(async () => {
  stopWatchingAuth = watchKhtAuth((nextSession) => {
    session.value = nextSession;
  });
  await load();
});

onBeforeUnmount(() => {
  stopWatchingAuth();
  clearTimeout(saveTimer);
});
</script>

<style scoped>
.kht-page {
  display: block;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 70px 30px 100px;
}
.kht-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 30px;
  margin-bottom: 35px;
}
.eyebrow {
  margin: 0 0 12px;
  color: #04d361;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(54px, 9vw, 100px);
  line-height: 0.9;
  letter-spacing: -5px;
}
.intro {
  max-width: 560px;
  margin: 22px 0 0;
  color: #aaa;
  line-height: 1.6;
}
.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 7px;
  color: #777;
  font-size: 13px;
  white-space: nowrap;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
}
.is-owner {
  color: #04d361;
}
.is-owner .status-dot {
  background: #04d361;
}
.owner-panel {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 18px 20px;
  border: 1px solid #29292e;
  background: #151517;
  margin-bottom: 22px;
}
.owner-panel strong {
  color: #fff;
}
.owner-panel p {
  margin: 4px 0 0;
  color: #888;
  font-size: 13px;
}
.login-form {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.login-form input,
.score-input,
.item-name {
  border: 1px solid #3a3a40;
  background: #0b0b0d;
  color: #fff;
  font: inherit;
}
.login-form input {
  width: 220px;
  padding: 10px;
}
.login-form button,
.secondary-button {
  padding: 10px 14px;
  border: 1px solid #04d361;
  background: #04d361;
  color: #000;
  font-weight: bold;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: wait;
}
.secondary-button {
  margin-left: auto;
  background: transparent;
  color: #04d361;
}
.login-message,
.notice,
.save-message {
  color: #04d361 !important;
}
.notice {
  padding: 12px 0;
  color: #ffb86b !important;
}
.save-message {
  min-height: 20px;
  margin: 0 0 8px;
  font-size: 12px;
}
.bracket-shell {
  overflow-x: auto;
  border-top: 1px solid #29292e;
  border-bottom: 1px solid #29292e;
  background: #08080a;
}
.bracket {
  display: flex;
  align-items: stretch;
  min-width: max-content;
  padding: 20px 0 30px;
}
.round {
  width: 220px;
  padding: 0 10px;
}
.round:not(:last-child) {
  border-right: 1px solid #222;
}
.round-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  height: 34px;
  color: #04d361;
  font-size: 13px;
}
.round-heading small {
  color: #666;
  font-size: 10px;
}
.matches {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 10px;
  min-height: 100%;
}
.match {
  border: 1px solid #29292e;
  background: #151517;
}
.match--bye {
  border-style: dashed;
}
.competitor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  gap: 5px;
  padding: 5px 7px;
  color: #aaa;
  font-size: 12px;
}
.competitor + .competitor {
  border-top: 1px solid #29292e;
}
.competitor.winner {
  color: #fff;
  background: #1c3025;
}
.item-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  padding: 2px 0;
  border-color: transparent;
  background: transparent;
  color: inherit;
  text-overflow: ellipsis;
}
.bracket--editing .item-name {
  border-bottom-color: #3a3a40;
}
.score,
.score-input {
  width: 42px;
  flex: 0 0 42px;
  text-align: right;
}
.score {
  color: #04d361;
}
.score-input {
  padding: 3px;
}
.bye-label {
  display: block;
  padding: 5px 7px;
  color: #777;
  font-size: 11px;
  text-transform: uppercase;
}
@media (max-width: 700px) {
  .kht-page {
    padding: 45px 15px 70px;
  }
  .kht-heading {
    display: block;
  }
  .header-status {
    margin-top: 20px;
  }
  .owner-panel {
    display: block;
  }
  .login-form {
    margin-top: 14px;
  }
  .login-form input {
    width: calc(100% - 120px);
  }
  .round {
    width: 190px;
  }
}
</style>
