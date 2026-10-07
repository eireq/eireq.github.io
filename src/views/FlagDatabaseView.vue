<template>
  <main class="flag-database">
    <header class="database-heading">
      <div class="heading-line">
        <h1>{{ t("flagDb.title") }}</h1>
        <span class="total-count"
          >{{ flagsReady ? flags.length.toLocaleString() : "…" }}
          {{ t("flagDb.records") }}</span
        >
      </div>
      <p class="intro">{{ t("flagDb.intro") }}</p>
    </header>

    <p v-if="!flagsReady" class="loading-state">{{ t("flagDb.loading") }}</p>

    <section v-else class="directory" :aria-label="t('flagDb.ariaDirectory')">
      <div class="controls">
        <label class="search-control">
          <span>{{ t("flagDb.search") }}</span>
          <input
            v-model="searchTerm"
            type="search"
            :placeholder="t('flagDb.searchPlaceholder')"
            autocomplete="off"
          />
        </label>

        <label class="select-control">
          <span>{{ t("flagDb.category") }}</span>
          <select v-model="selectedCategory">
            <option value="all">{{ t("flagDb.allCategories") }}</option>
            <option value="territories">{{ t("flagDb.territories") }}</option>
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </label>

        <label class="select-control sort-control">
          <span>{{ t("flagDb.sortBy") }}</span>
          <select v-model="sortOrder">
            <option value="name-asc">{{ t("flagDb.sortNameAsc") }}</option>
            <option value="name-desc">{{ t("flagDb.sortNameDesc") }}</option>
            <option value="adoption-asc">{{ t("flagDb.sortAdoptOld") }}</option>
            <option value="adoption-desc">{{ t("flagDb.sortAdoptNew") }}</option>
            <option value="cancellation-asc">
              {{ t("flagDb.sortCancelOld") }}
            </option>
            <option value="cancellation-desc">
              {{ t("flagDb.sortCancelNew") }}
            </option>
          </select>
        </label>
      </div>

      <div class="collection-bar" :aria-label="t('flagDb.ariaCollections')">
        <span class="collection-label">{{ t("flagDb.collections") }}</span>
        <div class="collection-list">
          <button
            v-for="collection in collections"
            :key="collection.id"
            type="button"
            class="collection-button"
            :class="{ active: selectedCollection === collection.id }"
            @click="selectedCollection = collection.id"
          >
            {{ collection.label }}
          </button>
        </div>
      </div>

      <div
        v-if="selectedCategory === 'Subdivision'"
        class="collection-bar subdivision-collection"
        :aria-label="t('flagDb.ariaSubdivisions')"
      >
        <span class="collection-label">{{ t("flagDb.subdivisions") }}</span>
        <div class="collection-list">
          <button
            type="button"
            class="collection-button"
            :class="{ active: selectedSubdivisionCountry === 'all' }"
            @click="selectedSubdivisionCountry = 'all'"
          >
            {{ t("flagDb.allCountries") }}
          </button>
          <button
            v-for="country in subdivisionCountries"
            :key="country"
            type="button"
            class="collection-button"
            :class="{ active: selectedSubdivisionCountry === country }"
            @click="selectedSubdivisionCountry = country"
          >
            {{ country }}
          </button>
        </div>
      </div>

      <div class="list-summary" aria-live="polite">
        <span
          >{{ filteredFlags.length.toLocaleString() }}
          {{ t("flagDb.matching") }}</span
        >
        <span v-if="filteredFlags.length"
          >{{ t("flagDb.showing") }} {{ pageStart }}–{{ pageEnd }}</span
        >
      </div>

      <p v-if="!filteredFlags.length" class="empty-state">
        {{ t("flagDb.empty") }}
      </p>

      <ol v-else class="flag-list">
        <li
          v-for="flag in visibleFlags"
          :key="`${flag.name}-${flag.svgUrl}`"
          class="flag-record"
        >
          <RouterLink
            :to="flagRoute(flag)"
            class="flag-row"
            :aria-label="`View details for ${flag.name}`"
          >
            <img
              class="flag-thumbnail"
              :src="imageUrl(flag.svgUrl)"
              :alt="''"
              loading="lazy"
              @error="hideBrokenImage($event, flag.name)"
            />
            <span class="flag-row__name">{{ flag.name }}</span>
            <span class="flag-row__category">{{ displayCategory(flag) }}</span>
            <span class="flag-row__date">{{
              formatDate(flag.adoptionDate)
            }}</span>
            <span class="flag-row__action">{{ t("flagDb.details") }}</span>
          </RouterLink>
        </li>
      </ol>

      <nav
        v-if="pageCount > 1"
        class="pagination"
        :aria-label="t('flagDb.ariaPages')"
      >
        <button
          type="button"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          {{ t("flagDb.previous") }}
        </button>
        <span
          >{{ t("flagDb.page") }} {{ currentPage }} {{ t("flagDb.of") }}
          {{ pageCount }}</span
        >
        <button
          type="button"
          :disabled="currentPage === pageCount"
          @click="currentPage++"
        >
          {{ t("flagDb.next") }}
        </button>
      </nav>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { loadFlags } from "../data/flags.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const pageSize = 48;
const flags = shallowRef([]);
const flagsReady = ref(false);
const searchTerm = ref("");
const selectedCategory = ref("all");
const selectedCollection = ref("all");
const selectedSubdivisionCountry = ref("all");
const sortOrder = ref("name-asc");
const currentPage = ref(1);
const subdivisionCategories = new Set([
  "Autonomous community",
  "Canton",
  "County",
  "Federal district",
  "Federal territory",
  "Province",
  "Region",
  "Republic",
  "State",
  "US State",
]);
const territoryNames = new Set([
  "Flag of Aruba",
  "Flag of Cook Islands",
  "Flag of Curaçao",
  "Flag of Greenland",
  "Flag of Niue",
  "Flag of Sint Maarten",
]);

onMounted(async () => {
  flags.value = await loadFlags();
  flagsReady.value = true;
});

const categories = computed(() =>
  [
    ...new Set(
      flags.value
        .map((flag) => (isSubdivision(flag) ? "Subdivision" : flag.category))
        .filter(Boolean),
    ),
  ]
    .filter((category) => category !== "Territory")
    .sort((a, b) => a.localeCompare(b)),
);

const collections = [
  { id: "all", label: "All flags" },
  { id: "territories", label: "Territories" },
  { id: "international", label: "International bodies" },
  { id: "pride", label: "Pride flags" },
  { id: "soviet", label: "Soviet flags" },
  { id: "historical", label: "Historical states" },
  { id: "revolutionary", label: "Revolutionary flags" },
  { id: "arab", label: "Pan-Arab / Arab flags" },
];

const subdivisionCountries = computed(() =>
  [
    ...new Set(
      flags.value.filter(isSubdivision).map(subdivisionCountry).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b)),
);

const filteredFlags = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase();
  const matches = flags.value.filter((flag) => {
    if (selectedCollection.value === "territories" && !isTerritory(flag)) {
      return false;
    }
    if (selectedCollection.value !== "all" && !matchesCollection(flag)) {
      return false;
    }
    if (selectedCategory.value === "territories" && !isTerritory(flag)) {
      return false;
    }
    if (
      selectedCategory.value === "Subdivision" &&
      (!isSubdivision(flag) ||
        (selectedSubdivisionCountry.value !== "all" &&
          subdivisionCountry(flag) !== selectedSubdivisionCountry.value))
    ) {
      return false;
    }
    if (
      selectedCategory.value !== "all" &&
      selectedCategory.value !== "territories" &&
      selectedCategory.value !== "Subdivision" &&
      flag.category !== selectedCategory.value
    ) {
      return false;
    }
    if (!query) return true;

    const searchable = [
      flag.name,
      flag.category,
      flag.proportions,
      flag.adoptionDate,
      flag.cancellationDate,
      flag.designer,
      flag.emblemMeaning,
      flag.funFact,
      ...(Array.isArray(flag.colors) ? flag.colors.map(colorText) : []),
    ];
    return searchable.some((value) =>
      String(value || "")
        .toLocaleLowerCase()
        .includes(query),
    );
  });

  const [field, direction] = sortOrder.value.split("-");
  const dateField = field === "adoption" ? "adoptionDate" : "cancellationDate";
  return [...matches].sort((left, right) => {
    if (field === "name") {
      return (
        left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
        }) * (direction === "desc" ? -1 : 1)
      );
    }

    const leftDate = left[dateField];
    const rightDate = right[dateField];
    if (!leftDate || !rightDate) {
      if (!leftDate && !rightDate) return left.name.localeCompare(right.name);
      return leftDate ? -1 : 1;
    }
    const leftParts = parseDateParts(leftDate);
    const rightParts = parseDateParts(rightDate);
    const dateComparison =
      leftParts && rightParts
        ? leftParts.year - rightParts.year ||
          leftParts.month - rightParts.month ||
          leftParts.day - rightParts.day
        : leftDate.localeCompare(rightDate);
    return dateComparison * (direction === "desc" ? -1 : 1);
  });
});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredFlags.value.length / pageSize)),
);
const pageStart = computed(() => (currentPage.value - 1) * pageSize + 1);
const pageEnd = computed(() =>
  Math.min(currentPage.value * pageSize, filteredFlags.value.length),
);
const visibleFlags = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredFlags.value.slice(start, start + pageSize);
});

watch(
  [
    searchTerm,
    selectedCategory,
    selectedCollection,
    selectedSubdivisionCountry,
    sortOrder,
  ],
  () => {
    currentPage.value = 1;
  },
);

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});

function flagRoute(flag) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.value.indexOf(flag)) },
  };
}

function matchesCollection(flag) {
  const name = flag.name || "";
  const category = flag.category || "";

  if (selectedCollection.value === "territories") {
    return isTerritory(flag);
  }

  if (selectedCollection.value === "international") {
    return /league|asean|caricom|commonwealth|cis|union|eu|nato|olympic|oau|african union|opec|red cross|red crescent|red crystal|south pacific|united nations|un\b|osn|mercosur|saarc|ctso|sadc|interpol|fifa|uefa|imf|who|unesco|world trade|world bank|greenpeace|amnesty|ilo/i.test(
      name,
    );
  }

  if (selectedCollection.value === "pride") {
    return category === "Pride flag";
  }

  if (selectedCollection.value === "soviet") {
    return /soviet|ssr|ussr|union of soviet socialist republics/i.test(name);
  }

  if (selectedCollection.value === "historical") {
    return (
      category.toLowerCase().includes("historical") ||
      /historical|empire|kingdom|republic|dynasty/i.test(name)
    );
  }

  if (selectedCollection.value === "revolutionary") {
    return /revolution|revolt|liberation|anarchist|pan-african|miranda|federal republic of central america/i.test(
      name,
    );
  }

  if (selectedCollection.value === "arab") {
    return /arab|egyptian|palestine|jordan|iraq|levant|pan-african/i.test(name);
  }

  return true;
}

function isSubdivision(flag) {
  return subdivisionCategories.has(flag.category);
}

function subdivisionCountry(flag) {
  const name = flag.name || "";
  const subdivisionName = name.replace(/^Flag of /, "");

  if (flag.category === "Autonomous community") return "Spain";
  if (flag.category === "Canton") return "Switzerland";
  if (flag.category === "County") return "United Kingdom";
  if (flag.category === "Federal district") return "Brazil";
  if (flag.category === "Federal territory") return "Malaysia";
  if (flag.category === "Region") return "Belgium";
  if (flag.category === "US State") return "United States";
  if (flag.category === "Province") {
    return dutchProvinces.has(subdivisionName) ? "Netherlands" : "Canada";
  }
  if (flag.category === "Republic") {
    return subdivisionName === "Crimea" ? "Ukraine" : "Russia";
  }
  if (flag.category === "State") {
    return stateCountryByName.get(subdivisionName) || "";
  }
  return "";
}

const dutchProvinces = new Set([
  "Groningen",
  "Friesland",
  "Drenthe",
  "Overijssel",
  "Gelderland",
  "Utrecht",
  "North Holland",
  "South Holland",
  "Zeeland",
  "North Brabant",
  "Limburg",
  "Flevoland",
]);

const stateCountryByName = new Map([
  ...[
    "Acre",
    "Alagoas",
    "Amapá",
    "Amazonas",
    "Bahia",
    "Ceará",
    "Espírito Santo",
    "Goiás",
    "Maranhão",
    "Mato Grosso",
    "Mato Grosso do Sul",
    "Minas Gerais",
    "Pará",
    "Paraíba",
    "Paraná",
    "Pernambuco",
    "Piauí",
    "Rio de Janeiro",
    "Rio Grande do Norte",
    "Rio Grande do Sul",
    "Rondônia",
    "Roraima",
    "Santa Catarina",
    "São Paulo",
    "Sergipe",
    "Tocantins",
  ].map((name) => [name, "Brazil"]),
  ...[
    "Baden-Württemberg",
    "Bavaria",
    "Berlin",
    "Brandenburg",
    "Bremen",
    "Hamburg",
    "Hesse",
    "Lower Saxony",
    "Mecklenburg-Vorpommern",
    "North Rhine-Westphalia",
    "Rhineland-Palatinate",
    "Saarland",
    "Saxony",
    "Saxony-Anhalt",
    "Schleswig-Holstein",
    "Thuringia",
  ].map((name) => [name, "Germany"]),
  ...[
    "Johor",
    "Kedah",
    "Kelantan",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Penang",
    "Perak",
    "Perlis",
    "Sabah",
    "Sarawak",
    "Selangor",
    "Terengganu",
  ].map((name) => [name, "Malaysia"]),
  ...[
    "New South Wales",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ].map((name) => [name, "Australia"]),
  ...["Chuuk", "Kosrae", "Pohnpei", "Yap"].map((name) => [
    name,
    "Federated States of Micronesia",
  ]),
]);

function isTerritory(flag) {
  return flag.category === "Territory" || territoryNames.has(flag.name);
}

function displayCategory(flag) {
  if (isTerritory(flag)) return "Territory / dependency";
  return isSubdivision(flag) ? "Subdivision" : flag.category;
}

function imageUrl(url) {
  return url?.replace(/^http:/, "https:") || "";
}

function formatDate(value) {
  if (!value) return "Unknown";
  const parts = parseDateParts(value);
  if (parts?.year < 0) {
    const year = `${Math.abs(parts.year)} BCE`;
    if (!parts.month) return year;
    const sampleDate = new Date(
      Date.UTC(2000, parts.month - 1, parts.day || 1),
    );
    const options = parts.day
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { month: "short", timeZone: "UTC" };
    return `${new Intl.DateTimeFormat(undefined, options).format(sampleDate)} ${year}`;
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function parseDateParts(value) {
  const match = /^(-?\d{4})(?:-(\d{2})(?:-(\d{1,2}))?)?$/.exec(value || "");
  if (!match) return null;

  const month = Number(match[2]) || 0;
  const rawDay = Number(match[3]) || 0;
  return {
    year: Number(match[1]),
    month: month >= 1 && month <= 12 ? month : 0,
    day: rawDay >= 1 && rawDay <= 31 ? rawDay : 0,
  };
}

function colorText(color) {
  if (typeof color === "string") return color;
  if (color && typeof color === "object")
    return color.name || color.color || JSON.stringify(color);
  return "";
}

function hideBrokenImage(event, flagName) {
  console.log("Flag image failed to load:", flagName);
  event.currentTarget.hidden = true;
}
</script>

<style scoped>
.flag-database {
  display: block;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: 68px 30px 96px;
  color: #f4f1e8;
}

.database-heading {
  max-width: 850px;
  margin-bottom: 46px;
}

.heading-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 14px 22px;
}

h1 {
  margin: 0;
  font-size: clamp(42px, 7vw, 72px);
  line-height: 1;
}

.total-count {
  color: #f5cf3d;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.intro {
  max-width: 610px;
  margin: 18px 0 0;
  color: #aaa79f;
  font-size: 16px;
  line-height: 1.6;
}

.loading-state {
  margin: 24px 0 0;
  color: #aaa79f;
  font-size: 16px;
}

.directory {
  border-top: 1px solid #393832;
}

.controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(165px, 0.45fr) minmax(
      210px,
      0.55fr
    );
  gap: 14px;
  padding: 20px 0;
  border-bottom: 1px solid #393832;
}

.search-control,
.select-control {
  display: grid;
  gap: 7px;
  color: #aaa79f;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.search-control input,
.select-control select {
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #45443d;
  border-radius: 2px;
  outline: none;
  background: #10100e;
  color: #f4f1e8;
  font: inherit;
  font-size: 14px;
  text-transform: none;
}

.search-control input:focus,
.select-control select:focus {
  border-color: #f5cf3d;
}

.search-control input::placeholder {
  color: #77756d;
}

.collection-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 0 10px;
}

.collection-label {
  color: #aaa79f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.collection-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.collection-button {
  padding: 8px 12px;
  border: 1px solid #45443d;
  background: #10100e;
  color: #f4f1e8;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.collection-button:hover,
.collection-button.active {
  border-color: #f5cf3d;
  background: #1c1b17;
}

.list-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 2px;
  color: #99968e;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.flag-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid #393832;
  list-style: none;
}

.flag-record {
  border-bottom: 1px solid #292824;
}

.flag-row {
  display: grid;
  grid-template-columns:
    74px minmax(180px, 1fr) minmax(120px, 0.4fr) minmax(130px, 0.4fr)
    66px;
  align-items: center;
  width: 100%;
  min-height: 70px;
  gap: 16px;
  padding: 10px 8px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.flag-row:hover {
  background: #11110e;
}

.flag-row:focus-visible {
  outline: 1px solid #f5cf3d;
  outline-offset: -1px;
}

.flag-thumbnail {
  display: block;
  width: 64px;
  height: 42px;
  object-fit: contain;
  background: #171713;
}

.flag-row__name {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 700;
}

.flag-row__category,
.flag-row__date {
  color: #a6a39a;
  font-size: 12px;
}

.flag-row__date {
  font-variant-numeric: tabular-nums;
}

.flag-row__action {
  color: #f5cf3d;
  font-size: 11px;
  text-align: right;
  text-transform: uppercase;
}

.flag-details {
  display: grid;
  grid-template-columns: minmax(180px, 0.65fr) minmax(0, 2fr);
  gap: 28px;
  padding: 12px 24px 28px 98px;
  background: #11110e;
}

.flag-preview {
  margin: 0;
}

.flag-preview img {
  display: block;
  width: 100%;
  max-height: 190px;
  aspect-ratio: 3 / 2;
  object-fit: contain;
  background: #191915;
}

.flag-preview figcaption {
  margin-top: 8px;
  color: #99968e;
  font-size: 11px;
}

.detail-dates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px 22px;
  margin-bottom: 18px;
}

.detail-dates p {
  margin: 0;
  color: #e4e0d5;
  font-size: 13px;
}

.empty-state {
  padding: 35px 8px;
  color: #aaa79f;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 25px 0 0;
  color: #aaa79f;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.pagination button {
  min-width: 88px;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid #45443d;
  border-radius: 2px;
  background: transparent;
  color: #f4f1e8;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  border-color: #f5cf3d;
  color: #f5cf3d;
}

.pagination button:disabled {
  color: #65635d;
  cursor: default;
}

@media (max-width: 760px) {
  .flag-database {
    padding: 48px 18px 72px;
  }

  .controls {
    grid-template-columns: 1fr 1fr;
  }

  .search-control {
    grid-column: 1 / -1;
  }

  .flag-row {
    grid-template-columns: 58px minmax(0, 1fr) 58px;
    gap: 10px;
    min-height: 66px;
  }

  .flag-thumbnail {
    width: 52px;
    height: 36px;
  }

  .flag-row__category {
    display: none;
  }

  .flag-row__date {
    grid-column: 2;
    grid-row: 2;
    margin-top: -12px;
    font-size: 11px;
  }

  .flag-row__action {
    grid-column: 3;
    grid-row: 1 / 3;
  }
}

@media (max-width: 420px) {
  .controls {
    grid-template-columns: 1fr;
  }

  .search-control {
    grid-column: auto;
  }

  .pagination {
    gap: 10px;
  }
}
</style>
