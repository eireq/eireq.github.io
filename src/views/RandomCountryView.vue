<template>
  <main class="random-country">
    <section
      class="random-country__hero"
      aria-labelledby="random-country-title"
    >
      <h1 id="random-country-title">{{ t("randomCountry.title") }}</h1>
      <p class="intro">
        {{ t("randomCountry.intro") }}
      </p>

      <div class="filters">
        <label>
          <span>{{ t("randomCountry.poolFilter") }}</span>
          <select v-model="poolMode">
            <option
              v-for="mode in poolModes"
              :key="mode.value"
              :value="mode.value"
            >
              {{ t(mode.label) }}
            </option>
          </select>
        </label>
      </div>

      <div class="random-picker">
        <p class="random-picker__label">{{ t("randomCountry.yourPlace") }}</p>
        <output class="random-picker__result" aria-live="polite">
          {{ selectedLabel }}
        </output>
        <div class="random-picker__actions">
          <button
            class="random-picker__button"
            type="button"
            :disabled="!pool.length"
            @click="pickRandom"
          >
            {{ t("randomCountry.randomize") }}
          </button>
          <RouterLink
            v-if="selectedFlag"
            class="random-picker__link"
            :to="flagRoute(selectedFlag)"
          >
            {{ t("randomCountry.openRecord") }}
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="country-list" aria-labelledby="country-list-title">
      <div class="country-list__header">
        <div>
          <h2 id="country-list-title">
            {{ ready ? pool.length : "…" }} {{ t("randomCountry.entries") }}
          </h2>
        </div>
        <label class="country-list__search">
          <span>{{ t("randomCountry.find") }}</span>
          <input
            v-model="searchTerm"
            type="search"
            :placeholder="t('randomCountry.search')"
            autocomplete="off"
          />
        </label>
      </div>

      <p v-if="!ready" class="country-list__empty">
        {{ t("randomCountry.loading") }}
      </p>
      <p v-else-if="!filtered.length" class="country-list__empty">
        {{ t("randomCountry.empty") }}
      </p>
      <ol v-else class="country-list__items">
        <li v-for="flag in filtered" :key="flag.name + flag.svgUrl">
          <RouterLink :to="flagRoute(flag)">{{ shortName(flag) }}</RouterLink>
          <span class="country-list__category">{{ displayCategory(flag) }}</span>
        </li>
      </ol>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import {
  displayCategory,
  filterFlagsByMode,
  loadFlags,
  shortName,
  shuffle,
} from "../data/flags.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const flags = ref([]);
const ready = ref(false);
const searchTerm = ref("");
const poolMode = ref("countries");
const selectedFlag = ref(null);

const poolModes = [
  { value: "countries", label: "flagQuiz.modes.countries" },
  { value: "territorial", label: "flagQuiz.modes.territorial" },
  { value: "historical", label: "flagQuiz.modes.historical" },
  { value: "subdivisions", label: "flagQuiz.modes.subdivisions" },
  { value: "organizations", label: "flagQuiz.modes.organizations" },
  { value: "all", label: "flagQuiz.modes.all" },
];

const pool = computed(() => filterFlagsByMode(flags.value, poolMode.value));
const selectedLabel = computed(() =>
  selectedFlag.value
    ? shortName(selectedFlag.value)
    : t("randomCountry.pickPrompt"),
);

const filtered = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase();
  if (!query) return pool.value;
  return pool.value.filter((flag) =>
    [shortName(flag), flag.name, flag.category]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query),
  );
});

onMounted(async () => {
  flags.value = await loadFlags();
  ready.value = true;
  pickRandom();
});

watch(poolMode, () => {
  pickRandom();
});

function pickRandom() {
  if (!pool.value.length) {
    selectedFlag.value = null;
    return;
  }
  selectedFlag.value = shuffle(pool.value)[0];
}

function flagRoute(flag) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.value.indexOf(flag)) },
  };
}
</script>

<style scoped>
.random-country {
  display: block;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 80px 30px;
}

h1 {
  font-size: clamp(42px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 18px;
  letter-spacing: -3px;
}

.intro {
  color: #888;
  font-size: 18px;
  line-height: 1.6;
  margin: 0 0 28px;
  max-width: 650px;
}

.filters {
  margin-bottom: 24px;
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 280px;
  color: #aaa;
  font-size: 14px;
}

.filters select {
  width: 100%;
  padding: 12px 14px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
}

.random-picker {
  padding: 28px;
  border: 1px solid #222;
  margin-bottom: 48px;
}

.random-picker__label {
  margin: 0 0 10px;
  color: #888;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.random-picker__result {
  display: block;
  font-size: clamp(28px, 6vw, 42px);
  line-height: 1.1;
  letter-spacing: -1px;
  margin-bottom: 20px;
  overflow-wrap: anywhere;
}

.random-picker__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.random-picker__button,
.random-picker__link {
  display: inline-flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #fff;
  background: #fff;
  color: #000;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
}

.random-picker__link {
  background: transparent;
  color: #fff;
}

.country-list__header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: end;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.country-list__header h2 {
  margin: 0;
  font-size: clamp(28px, 5vw, 40px);
  letter-spacing: -1px;
}

.country-list__search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: min(100%, 260px);
  color: #aaa;
  font-size: 14px;
}

.country-list__search input {
  padding: 12px 14px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
}

.country-list__empty {
  color: #888;
}

.country-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px 18px;
}

.country-list__items li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  border-bottom: 1px solid #1a1a1a;
}

.country-list__items a {
  color: #fff;
  text-decoration: none;
}

.country-list__items a:hover {
  text-decoration: underline;
}

.country-list__category {
  color: #666;
  font-size: 12px;
}

@media (max-width: 700px) {
  .random-country {
    padding: 48px 18px;
  }

  .random-picker {
    padding: 20px;
  }

  .country-list__items {
    grid-template-columns: 1fr;
  }
}
</style>
