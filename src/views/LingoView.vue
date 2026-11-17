<template>
  <main class="lingo">
    <header class="top">
      <h1>{{ t("lingo.title") }}</h1>
      <p class="intro">{{ t("lingo.intro") }}</p>
      <p class="note">{{ t("lingo.note") }}</p>

      <div class="name-row">
        <label class="name">
          <span>{{ t("lingo.name") }}</span>
          <input
            v-model="language.name"
            maxlength="60"
            autocomplete="off"
            :placeholder="t('lingo.namePlaceholder')"
          />
        </label>
        <p class="count">
          <strong>{{ named }}</strong> / {{ WORD_COUNT }} {{ t("lingo.named") }}
        </p>
      </div>
      <div class="progress" aria-hidden="true">
        <span :style="{ width: `${pct}%` }"></span>
      </div>

      <div class="file-row">
        <button type="button" class="ghost" @click="download">
          {{ t("lingo.download") }}
        </button>
        <button type="button" class="ghost" @click="fileInput?.click()">
          {{ t("lingo.import") }}
        </button>
        <input
          ref="fileInput"
          class="file"
          type="file"
          accept="application/json,.json"
          @change="onImport"
        />
      </div>
      <p v-if="status" class="status" role="status">{{ status }}</p>

      <aside class="feature">
        <div>
          <p class="feature-title">{{ t("dum.featureTitle") }}</p>
          <p class="hint">{{ t("dum.featureText") }}</p>
        </div>
        <div class="feature-actions">
          <button type="button" @click="askDum">{{ t("dum.load") }}</button>
          <router-link class="ghost" to="/dum">{{ t("dum.learn") }}</router-link>
        </div>
        <p v-if="dumAsk" class="confirm">
          {{ t("dum.loadAsk") }}
          <button type="button" @click="loadDum">{{ t("lingo.yes") }}</button>
          <button type="button" class="ghost" @click="dumAsk = false">
            {{ t("lingo.no") }}
          </button>
        </p>
      </aside>
    </header>

    <div class="tabs" role="tablist">
      <button
        v-for="item in tabs"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="tab === item.id"
        :class="{ on: tab === item.id }"
        @click="tab = item.id"
      >
        {{ t(item.label) }}
      </button>
    </div>

    <section v-if="tab === 'translate'" class="panel" role="tabpanel">
      <p v-if="named === 0" class="banner">
        {{ t("lingo.emptyStart") }}
        <button type="button" class="text" @click="tab = 'words'">
          {{ t("lingo.tabWords") }}
        </button>
      </p>

      <div class="choices">
        <div class="choice" role="group" :aria-label="t('lingo.translation')">
          <button
            type="button"
            :class="{ on: direction === 'forward' }"
            :aria-pressed="direction === 'forward'"
            @click="direction = 'forward'"
          >
            {{ t("lingo.toYours") }}
          </button>
          <button
            type="button"
            :class="{ on: direction === 'back' }"
            :aria-pressed="direction === 'back'"
            @click="direction = 'back'"
          >
            {{ t("lingo.toEnglish") }}
          </button>
        </div>
        <div class="choice" role="group" :aria-label="t('lingo.missing')">
          <button
            v-for="mode in missingModes"
            :key="mode.id"
            type="button"
            :class="{ on: language.missing === mode.id }"
            :aria-pressed="language.missing === mode.id"
            @click="language.missing = mode.id"
          >
            {{ t(mode.label) }}
          </button>
        </div>
      </div>

      <div class="panes">
        <label class="pane">
          <span>{{ leftLabel }}</span>
          <textarea
            v-model="source"
            rows="10"
            :placeholder="t('lingo.typeHere')"
            :spellcheck="direction === 'forward'"
          ></textarea>
        </label>
        <label class="pane">
          <span>{{ rightLabel }}</span>
          <textarea :value="output" rows="10" readonly spellcheck="false"></textarea>
        </label>
      </div>

      <div class="actions">
        <button type="button" class="ghost" @click="source = SAMPLE_TEXT">
          {{ t("lingo.sample") }}
        </button>
        <button type="button" :disabled="!output" @click="copyTranslation">
          {{ t("lingo.copy") }}
        </button>
      </div>
      <p class="hint">{{ t("lingo.hint") }}</p>
    </section>

    <section v-else-if="tab === 'words'" class="panel" role="tabpanel">
      <div class="filters">
        <label class="search">
          <span class="sr">{{ t("lingo.search") }}</span>
          <input
            v-model="query"
            type="search"
            :placeholder="t('lingo.search')"
            autocomplete="off"
          />
        </label>
        <div class="choice" role="group" :aria-label="t('lingo.filterAll')">
          <button
            type="button"
            :class="{ on: shown === 'all' }"
            :aria-pressed="shown === 'all'"
            @click="shown = 'all'"
          >
            {{ t("lingo.filterAll") }}
          </button>
          <button
            type="button"
            :class="{ on: shown === 'missing' }"
            :aria-pressed="shown === 'missing'"
            @click="shown = 'missing'"
          >
            {{ t("lingo.filterMissing") }}
          </button>
          <button
            type="button"
            :class="{ on: shown === 'done' }"
            :aria-pressed="shown === 'done'"
            @click="shown = 'done'"
          >
            {{ t("lingo.filterDone") }}
          </button>
        </div>
      </div>

      <div class="chips" role="toolbar" :aria-label="t('lingo.tabWords')">
        <button
          type="button"
          :class="{ on: cat === 'all' }"
          :aria-pressed="cat === 'all'"
          @click="cat = 'all'"
        >
          {{ t("lingo.filterAll") }}
          <small>{{ named }}/{{ WORD_COUNT }}</small>
        </button>
        <button
          v-for="item in CATEGORIES"
          :key="item"
          type="button"
          :class="{ on: cat === item }"
          :aria-pressed="cat === item"
          @click="cat = item"
        >
          {{ t(`lingo.cat.${item}`) }}
          <small>{{ counts[item].done }}/{{ counts[item].total }}</small>
        </button>
      </div>

      <p v-if="!grouped.length" class="hint">{{ t("lingo.emptyList") }}</p>

      <div v-else class="lexicon">
        <section v-for="group in grouped" :key="group.cat" class="group">
          <h2>{{ t(`lingo.cat.${group.cat}`) }}</h2>
          <label v-for="word in group.words" :key="word.id" class="row">
            <span class="en" :title="formsTitle(word.id)">{{ word.id }}</span>
            <input
              class="word"
              :value="language.words[word.id] || ''"
              maxlength="80"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              :placeholder="t('lingo.wordPlaceholder')"
              :aria-label="word.id"
              @input="setWord(word.id, $event.target.value)"
              @blur="blurWord(word.id)"
              @keydown.enter.prevent="focusNext"
            />
          </label>
        </section>
      </div>

      <div class="actions">
        <button type="button" :disabled="named === WORD_COUNT" @click="fill">
          {{ t("lingo.fill") }}
        </button>
        <button
          type="button"
          class="ghost"
          :disabled="named === 0"
          @click="ask('clear')"
        >
          {{ t("lingo.clear") }}
        </button>
        <button type="button" class="ghost" :disabled="!dirty" @click="ask('reset')">
          {{ t("lingo.reset") }}
        </button>
      </div>
      <p v-if="pending" class="confirm">
        {{ pending === "clear" ? t("lingo.clearAsk") : t("lingo.resetAsk") }}
        <button type="button" @click="confirmPending">{{ t("lingo.yes") }}</button>
        <button type="button" class="ghost" @click="pending = ''">
          {{ t("lingo.no") }}
        </button>
      </p>
      <p class="hint">{{ t("lingo.hint") }}</p>
    </section>

    <section v-else class="panel" role="tabpanel">
      <p class="hint intro-tight">{{ t("lingo.phraseIntro") }}</p>
      <p v-if="!language.phrases.length" class="hint">{{ t("lingo.noPhrases") }}</p>
      <div v-for="phrase in language.phrases" :key="phrase.id" class="phrase">
        <label>
          <span>{{ t("lingo.replace") }}</span>
          <input
            v-model="phrase.from"
            maxlength="120"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="true"
            :placeholder="t('lingo.fromPlaceholder')"
          />
        </label>
        <label>
          <span>{{ t("lingo.with") }}</span>
          <input
            v-model="phrase.to"
            maxlength="120"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            :placeholder="t('lingo.toPlaceholder')"
          />
        </label>
        <button type="button" class="ghost remove" @click="removePhrase(phrase.id)">
          {{ t("lingo.remove") }}
        </button>
      </div>
      <div class="actions">
        <button type="button" :disabled="language.phrases.length >= 100" @click="addPhrase">
          {{ t("lingo.addPhrase") }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref, watch } from "vue";
import {
  CATEGORIES,
  SAMPLE_TEXT,
  WORD_COUNT,
  WORDS,
  definedCount,
  fillEmpty,
  inflections,
  loadLanguage,
  newPhrase,
  normalizeLanguage,
  parseLanguage,
  saveLanguage,
  translate,
} from "../data/lingo.js";
import { DUM_LANGUAGE } from "../data/dum.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const tabs = [
  { id: "translate", label: "lingo.tabTranslate" },
  { id: "words", label: "lingo.tabWords" },
  { id: "phrases", label: "lingo.tabPhrases" },
];

const missingModes = [
  { id: "keep", label: "lingo.missingKeep" },
  { id: "skip", label: "lingo.missingSkip" },
  { id: "mark", label: "lingo.missingMark" },
];

const language = reactive(loadLanguage());
const tab = ref("translate");
const direction = ref("forward");
const source = ref("");
const query = ref("");
const cat = ref("all");
const shown = ref("all");
const status = ref("");
const pending = ref("");
const dumAsk = ref(false);
const fileInput = ref(null);

let statusTimer = 0;

watch(
  language,
  () => {
    saveLanguage(language);
  },
  { deep: true },
);

const named = computed(() => definedCount(language));
const pct = computed(() => Math.round((named.value / WORD_COUNT) * 100));
const yours = computed(() => language.name.trim() || t("lingo.yourLanguage"));
const leftLabel = computed(() =>
  direction.value === "forward" ? t("lingo.english") : yours.value,
);
const rightLabel = computed(() =>
  direction.value === "forward" ? yours.value : t("lingo.english"),
);
const output = computed(() => translate(source.value, language, direction.value));
const dirty = computed(
  () =>
    named.value > 0 ||
    language.name.trim().length > 0 ||
    language.phrases.length > 0 ||
    language.missing !== "keep",
);

const counts = computed(() => {
  const tally = {};
  for (const item of CATEGORIES) tally[item] = { done: 0, total: 0 };
  for (const word of WORDS) {
    tally[word.cat].total += 1;
    const value = language.words[word.id];
    if (value && value.trim()) tally[word.cat].done += 1;
  }
  return tally;
});

const grouped = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const groups = [];
  for (const word of WORDS) {
    if (cat.value !== "all" && word.cat !== cat.value) continue;
    const value = language.words[word.id] || "";
    const has = Boolean(value.trim());
    if (shown.value === "missing" && has) continue;
    if (shown.value === "done" && !has) continue;
    const spoken = value.toLowerCase();
    const hit =
      !needle ||
      word.id.startsWith(needle) ||
      spoken.includes(needle) ||
      inflections(word.id).some((form) => form.startsWith(needle));
    if (!hit) continue;
    const last = groups[groups.length - 1];
    if (!last || last.cat !== word.cat) groups.push({ cat: word.cat, words: [word] });
    else last.words.push(word);
  }
  return groups;
});

function formsTitle(id) {
  const forms = inflections(id);
  return forms.length ? forms.join(", ") : undefined;
}

function setWord(id, value) {
  if (!value) delete language.words[id];
  else language.words[id] = value;
}

function blurWord(id) {
  const value = language.words[id];
  if (value == null) return;
  const trimmed = value.trim().slice(0, 80);
  if (!trimmed) delete language.words[id];
  else language.words[id] = trimmed;
}

function focusNext(event) {
  const inputs = [...event.target.closest(".lexicon").querySelectorAll("input.word")];
  const next = inputs[inputs.indexOf(event.target) + 1];
  next?.focus();
}

function applyLanguage(next) {
  const fresh = normalizeLanguage(next);
  language.name = fresh.name;
  language.missing = fresh.missing;
  language.words = fresh.words;
  language.phrases = fresh.phrases;
}

function fill() {
  applyLanguage(fillEmpty(language));
  flash(t("lingo.filled"));
}

function askDum() {
  if (!dirty.value) {
    loadDum();
    return;
  }
  dumAsk.value = true;
}

function loadDum() {
  applyLanguage(DUM_LANGUAGE);
  dumAsk.value = false;
  flash(t("dum.loaded"));
}

function addPhrase() {
  if (language.phrases.length >= 100) return;
  language.phrases.push(newPhrase());
}

function removePhrase(id) {
  const index = language.phrases.findIndex((phrase) => phrase.id === id);
  if (index >= 0) language.phrases.splice(index, 1);
}

function ask(kind) {
  pending.value = pending.value === kind ? "" : kind;
}

function confirmPending() {
  if (pending.value === "clear") language.words = {};
  if (pending.value === "reset") applyLanguage({});
  pending.value = "";
}

function fileSlug(name) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "language";
}

function download() {
  const body = JSON.stringify(normalizeLanguage(language), null, 2);
  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileSlug(language.name)}.lingo.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function onImport(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "").replace(/^\uFEFF/, "");
      applyLanguage(parseLanguage(JSON.parse(text)));
      flash(t("lingo.imported"));
    } catch {
      flash(t("lingo.importFail"));
    }
  };
  reader.onerror = () => flash(t("lingo.importFail"));
  reader.readAsText(file);
}

async function copyTranslation() {
  try {
    await navigator.clipboard.writeText(output.value);
    flash(t("lingo.copied"));
  } catch {
    flash(t("lingo.copyFail"));
  }
}

function flash(message) {
  status.value = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    status.value = "";
  }, 2400);
}

onUnmounted(() => window.clearTimeout(statusTimer));
</script>

<style scoped>
.lingo {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 72px 30px 100px;
}

h1 {
  font-size: clamp(52px, 8vw, 84px);
  line-height: 0.95;
  margin: 0 0 16px;
  letter-spacing: -4px;
}

h2 {
  position: sticky;
  top: 64px;
  z-index: 2;
  margin: 22px 0 8px;
  padding: 8px 0;
  background: #000;
  font-size: 18px;
  letter-spacing: 0;
  font-weight: 600;
}

.intro {
  max-width: 680px;
  margin: 0 0 8px;
  color: #ccc;
  font-size: 18px;
  line-height: 1.6;
}

.note,
.hint,
.status,
.banner,
.confirm {
  max-width: 680px;
  margin: 0 0 14px;
  color: #888;
  line-height: 1.55;
}

.name-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-top: 8px;
}

.name {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  max-width: 420px;
  color: #888;
  font-size: 14px;
}

.count {
  margin: 0;
  color: #888;
}

.count strong {
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.progress {
  height: 2px;
  margin: 14px 0 16px;
  background: #222;
}

.progress span {
  display: block;
  height: 100%;
  background: #fff;
}

.file-row,
.actions,
.choice,
.confirm {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tabs {
  display: flex;
  gap: 0;
  margin: 8px 0 22px;
  border-bottom: 1px solid #222;
}

.tabs button {
  margin: 0 0 -1px;
  padding: 12px 16px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: #888;
}

.tabs button.on {
  color: #fff;
  border-bottom-color: #fff;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.choice button,
.chips button,
.ghost,
.actions button,
.file-row button,
.confirm button,
.text {
  font: inherit;
  cursor: pointer;
}

.choice button,
.chips button {
  padding: 8px 12px;
  border: 1px solid #333;
  background: #000;
  color: #aaa;
}

.choice button.on,
.chips button.on {
  border-color: #fff;
  color: #fff;
}

.panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pane,
.phrase label,
.search {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #888;
  font-size: 14px;
}

textarea,
input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 16px;
  line-height: 1.5;
  color-scheme: dark;
}

textarea {
  resize: vertical;
  min-height: 220px;
}

input::placeholder,
textarea::placeholder {
  color: #555;
}

.actions,
.hint {
  margin-top: 14px;
}

.actions button,
.file-row button,
.feature-actions button,
.confirm button {
  padding: 12px 16px;
  border: 1px solid #fff;
  background: #fff;
  color: #000;
}

.ghost,
.text {
  background: transparent;
  color: #fff;
}

.text {
  padding: 0 0 0 8px;
  border: 0;
  text-decoration: underline;
}

button:disabled {
  opacity: 0.35;
  cursor: default;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search {
  flex: 1;
  min-width: 200px;
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.chips button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 0 0 auto;
  text-align: left;
}

.chips small {
  color: #666;
  font-size: 12px;
}

.chips button.on small {
  color: #aaa;
}

.row {
  display: grid;
  grid-template-columns: minmax(96px, 150px) 1fr;
  gap: 10px;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #161616;
}

.en {
  color: #ccc;
  font-family: "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: 15px;
}

.phrase {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: end;
  margin-bottom: 8px;
}

.remove {
  height: 46px;
}

.file {
  display: none;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.intro-tight {
  margin-top: 0;
}

.feature {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 18px;
  margin: 8px 0 4px;
  padding: 16px 0 4px;
  border-top: 1px solid #222;
}

.feature .confirm {
  flex-basis: 100%;
}

.feature-title {
  margin: 0 0 6px;
  color: #fff;
  font-size: 22px;
}

.feature-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.feature-actions a {
  display: inline-block;
  padding: 12px 16px;
  border: 1px solid #fff;
  background: transparent;
  color: #fff;
  font: inherit;
  text-decoration: none;
}

.banner {
  padding: 12px 0;
}

@media (max-width: 800px) {
  .lingo {
    padding: 48px 18px 80px;
  }

  h1 {
    letter-spacing: -2px;
  }

  h2 {
    position: static;
  }

  .panes,
  .phrase,
  .name-row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .name-row {
    align-items: stretch;
  }

  .name {
    max-width: none;
  }

  .choices,
  .filters {
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .choice,
  .actions,
  .file-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .choice button {
    width: 100%;
    text-align: left;
  }

  .tabs {
    overflow-x: auto;
  }
}
</style>
