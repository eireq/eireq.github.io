<template>
  <main class="flag-database">
    <header class="database-heading">
      <p class="eyebrow">REFERENCE / FLAGS</p>
      <div class="heading-line">
        <h1>Flag database</h1>
        <span class="total-count"
          >{{ flags.length.toLocaleString() }} records</span
        >
      </div>
      <p class="intro">
        Browse national, territorial, and historical flags. Select a record to
        see its history and design notes.
      </p>
    </header>

    <section class="directory" aria-label="Flag records">
      <div class="controls">
        <label class="search-control">
          <span>Search flags</span>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Name, detail, date, designer..."
            autocomplete="off"
          />
        </label>

        <label class="select-control">
          <span>Category</span>
          <select v-model="selectedCategory">
            <option value="all">All categories</option>
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
          <span>Sort by</span>
          <select v-model="sortOrder">
            <option value="name-asc">Name, A to Z</option>
            <option value="name-desc">Name, Z to A</option>
            <option value="adoption-asc">Adoption date, oldest</option>
            <option value="adoption-desc">Adoption date, newest</option>
            <option value="cancellation-asc">Cancellation date, oldest</option>
            <option value="cancellation-desc">Cancellation date, newest</option>
          </select>
        </label>
      </div>

      <div class="list-summary" aria-live="polite">
        <span>{{ filteredFlags.length.toLocaleString() }} matching flags</span>
        <span v-if="filteredFlags.length"
          >Showing {{ pageStart }}–{{ pageEnd }}</span
        >
      </div>

      <p v-if="!filteredFlags.length" class="empty-state">
        No flags match those filters. Try a broader search.
      </p>

      <ol v-else class="flag-list">
        <li
          v-for="flag in visibleFlags"
          :key="`${flag.name}-${flag.svgUrl}`"
          class="flag-record"
        >
          <button
            class="flag-row"
            type="button"
            :aria-expanded="expandedFlag === flag"
            @click="toggleFlag(flag)"
          >
            <img
              class="flag-thumbnail"
              :src="imageUrl(flag.svgUrl)"
              :alt="''"
              loading="lazy"
              @error="hideBrokenImage"
            />
            <span class="flag-row__name">{{ flag.name }}</span>
            <span class="flag-row__category">{{ flag.category }}</span>
            <span class="flag-row__date">{{
              formatDate(flag.adoptionDate)
            }}</span>
            <span class="flag-row__action">{{
              expandedFlag === flag ? "Close" : "Details"
            }}</span>
          </button>

          <section
            v-if="expandedFlag === flag"
            class="flag-details"
            :aria-label="`${flag.name} details`"
          >
            <figure class="flag-preview">
              <img
                :src="imageUrl(flag.svgUrl)"
                :alt="flag.name"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <figcaption>
                {{ flag.proportions || "Proportions unknown" }}
              </figcaption>
            </figure>

            <div class="detail-copy">
              <div class="detail-dates">
                <p><span>Adopted</span>{{ formatDate(flag.adoptionDate) }}</p>
                <p>
                  <span>Cancelled</span>{{ formatDate(flag.cancellationDate) }}
                </p>
                <p><span>Designer</span>{{ flag.designer || "Unknown" }}</p>
                <p><span>Colors</span>{{ formatColors(flag.colors) }}</p>
              </div>
              <p v-if="flag.emblemMeaning" class="detail-description">
                <strong>Design and meaning</strong>
                {{ flag.emblemMeaning }}
              </p>
              <p v-if="flag.funFact" class="detail-description">
                <strong>Notes</strong>
                {{ flag.funFact }}
              </p>
            </div>
          </section>
        </li>
      </ol>

      <nav v-if="pageCount > 1" class="pagination" aria-label="Flag list pages">
        <button
          type="button"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Previous
        </button>
        <span>Page {{ currentPage }} of {{ pageCount }}</span>
        <button
          type="button"
          :disabled="currentPage === pageCount"
          @click="currentPage++"
        >
          Next
        </button>
      </nav>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, shallowRef, watch } from "vue";
import flags from "../assets/master_flags.json";

const pageSize = 48;
const searchTerm = ref("");
const selectedCategory = ref("all");
const sortOrder = ref("name-asc");
const currentPage = ref(1);
const expandedFlag = shallowRef(null);

const categories = computed(() =>
  [...new Set(flags.map((flag) => flag.category).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  ),
);

const filteredFlags = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase();
  const matches = flags.filter((flag) => {
    if (
      selectedCategory.value !== "all" &&
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

watch([searchTerm, selectedCategory, sortOrder], () => {
  currentPage.value = 1;
  expandedFlag.value = null;
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});

function toggleFlag(flag) {
  expandedFlag.value = expandedFlag.value === flag ? null : flag;
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

function formatColors(colors) {
  if (!Array.isArray(colors) || !colors.length) return "Unknown";
  return colors.map(colorText).filter(Boolean).join(", ");
}

function hideBrokenImage(event) {
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

.eyebrow {
  margin: 0 0 15px;
  color: #f5cf3d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
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
  grid-template-columns: 74px minmax(180px, 1fr) minmax(120px, 0.4fr) minmax(
      130px,
      0.4fr
    ) 66px;
  align-items: center;
  width: 100%;
  min-height: 70px;
  gap: 16px;
  padding: 10px 8px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.flag-row:hover,
.flag-row[aria-expanded="true"] {
  background: #11110e;
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
  overflow-wrap: anywhere;
}

.detail-dates span,
.detail-description strong {
  display: block;
  margin-bottom: 4px;
  color: #99968e;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-description {
  margin: 14px 0 0;
  color: #c1beb5;
  font-size: 13px;
  line-height: 1.65;
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

  .flag-details {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 12px 14px 24px;
  }

  .flag-preview img {
    max-height: 230px;
  }
}

@media (max-width: 420px) {
  .controls {
    grid-template-columns: 1fr;
  }

  .search-control {
    grid-column: auto;
  }

  .detail-dates {
    grid-template-columns: 1fr;
  }

  .pagination {
    gap: 10px;
  }
}
</style>
