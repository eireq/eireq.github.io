<template>
  <main v-if="flag" class="flag-detail-page">
    <div class="flag-detail-shell">
      <nav class="detail-topbar" aria-label="Flag navigation">
        <div class="breadcrumbs">
          <RouterLink to="/flagdb">Flag database</RouterLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{{ flagTitle }}</span>
        </div>
        <div class="record-navigation">
          <RouterLink
            v-if="previousFlag"
            :to="flagRoute(previousFlag)"
            class="record-link"
          >
            <span aria-hidden="true">←</span>
            {{ shortName(previousFlag) }}
          </RouterLink>
          <RouterLink
            v-if="nextFlag"
            :to="flagRoute(nextFlag)"
            class="record-link"
          >
            {{ shortName(nextFlag) }}
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </nav>

      <section class="flag-hero" aria-label="Flag image">
        <figure class="flag-art">
          <img
            v-if="!imageFailed"
            :key="flag.svgUrl"
            :src="imageUrl(flag.svgUrl)"
            :alt="flag.name"
            @error="imageFailed = true"
          />
          <p v-else class="image-fallback">Flag image unavailable</p>
          <figcaption v-if="flag.proportions">
            {{ flag.proportions }}
          </figcaption>
        </figure>
      </section>

      <section class="detail-layout">
        <article class="flag-story">
          <p class="eyebrow">{{ displayCategory(flag) }} / FLAG RECORD</p>
          <h1>
            <span>The Flag of</span>
            {{ flagTitle }}
          </h1>
          <p v-if="flag.emblemMeaning" class="story-copy">
            {{ flag.emblemMeaning }}
          </p>
          <p v-if="flag.funFact" class="story-copy">
            {{ flag.funFact }}
          </p>
        </article>

        <aside class="flag-facts" aria-label="Flag details">
          <h2>Record details</h2>
          <dl>
            <div>
              <dt>Category</dt>
              <dd>{{ displayCategory(flag) }}</dd>
            </div>
            <div>
              <dt>Adopted</dt>
              <dd>{{ formatDate(flag.adoptionDate) }}</dd>
            </div>
            <div>
              <dt>Cancelled</dt>
              <dd>{{ formatDate(flag.cancellationDate) }}</dd>
            </div>
            <div>
              <dt>Proportions</dt>
              <dd>{{ flag.proportions || "Not recorded" }}</dd>
            </div>
            <div>
              <dt>Designer</dt>
              <dd>{{ flag.designer || "Not recorded" }}</dd>
            </div>
            <div v-if="colors.length">
              <dt>Colors</dt>
              <dd>{{ colors.join(", ") }}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  </main>

  <main v-else class="flag-detail-page">
    <section class="missing-flag">
      <p class="eyebrow">FLAG RECORD</p>
      <h1>Flag not found</h1>
      <RouterLink to="/flagdb" class="back-link"
        >Back to the database</RouterLink
      >
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import flags from "../assets/master_flags.json";

const route = useRoute();
const imageFailed = ref(false);
const subdivisions = new Set([
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
const orderedFlags = [...flags].sort(
  (left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
    left.svgUrl.localeCompare(right.svgUrl),
);

const flagIndex = computed(() => {
  const index = Number(route.params.flagId);
  return Number.isInteger(index) && index >= 0 && index < flags.length
    ? index
    : -1;
});
const flag = computed(() =>
  flagIndex.value >= 0 ? flags[flagIndex.value] : null,
);
const flagTitle = computed(() => shortName(flag.value));
const orderedIndex = computed(() => orderedFlags.indexOf(flag.value));
const previousFlag = computed(() => orderedFlags[orderedIndex.value - 1]);
const nextFlag = computed(() => orderedFlags[orderedIndex.value + 1]);
const colors = computed(() =>
  Array.isArray(flag.value?.colors)
    ? flag.value.colors.map(colorText).filter(Boolean)
    : [],
);

watch(
  () => route.params.flagId,
  () => {
    imageFailed.value = false;
  },
);

function shortName(record) {
  return record?.name?.replace(/^Flag of /, "") || "";
}

function flagRoute(record) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.indexOf(record)) },
  };
}

function isTerritory(record) {
  return record.category === "Territory" || territoryNames.has(record.name);
}

function displayCategory(record) {
  if (isTerritory(record)) return "Territory / dependency";
  return subdivisions.has(record.category) ? "Subdivision" : record.category;
}

function imageUrl(url) {
  return url?.replace(/^http:/, "https:") || "";
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function colorText(color) {
  if (typeof color === "string") return color;
  if (color && typeof color === "object")
    return color.name || color.color || JSON.stringify(color);
  return "";
}
</script>

<style scoped>
.flag-detail-page {
  display: block;
  width: 100%;
  padding: 38px 30px 90px;
  color: #f4f1e8;
}

.flag-detail-shell {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 34px;
  color: #aaa79f;
  font-size: 13px;
}

.breadcrumbs,
.record-navigation {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.breadcrumbs a,
.record-link,
.back-link {
  color: inherit;
  text-decoration: none;
}

.breadcrumbs a:hover,
.record-link:hover,
.back-link:hover {
  color: #f5cf3d;
}

.breadcrumbs [aria-current="page"] {
  color: #f4f1e8;
}

.record-navigation {
  justify-content: flex-end;
}

.record-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 220px;
  padding: 6px 9px;
  border: 1px solid #393832;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flag-hero {
  display: grid;
  min-height: 390px;
  margin: 26px 0 0;
  padding: 46px 32px;
  place-items: center;
  border-block: 1px solid #393832;
  background: #10100e;
}

.flag-art {
  display: grid;
  width: min(100%, 720px);
  margin: 0;
  justify-items: center;
}

.flag-art img {
  display: block;
  width: 100%;
  max-height: 360px;
  aspect-ratio: 3 / 2;
  object-fit: contain;
  background: #171713;
  box-shadow: 0 14px 35px #0008;
}

.flag-art figcaption {
  margin-top: 10px;
  color: #99968e;
  font-size: 12px;
}

.image-fallback {
  display: grid;
  width: 100%;
  min-height: 250px;
  margin: 0;
  place-items: center;
  background: #171713;
  color: #99968e;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(270px, 0.42fr);
  gap: clamp(32px, 7vw, 96px);
  padding-top: 42px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #f5cf3d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.flag-story h1,
.missing-flag h1 {
  margin: 0;
  font-size: 64px;
  line-height: 1.04;
  overflow-wrap: anywhere;
}

.flag-story h1 span {
  display: block;
  margin-bottom: 5px;
  color: #aaa79f;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

.story-copy {
  max-width: 760px;
  margin: 24px 0 0;
  color: #d0cdc4;
  font-size: 17px;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.flag-facts {
  align-self: start;
  border-top: 1px solid #f5cf3d;
}

.flag-facts h2 {
  margin: 0;
  padding: 15px 0 10px;
  color: #aaa79f;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.flag-facts dl {
  margin: 0;
}

.flag-facts dl > div {
  display: grid;
  grid-template-columns: minmax(90px, 0.7fr) minmax(0, 1fr);
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid #292824;
  font-size: 13px;
}

.flag-facts dt {
  color: #99968e;
}

.flag-facts dd {
  margin: 0;
  color: #f4f1e8;
  overflow-wrap: anywhere;
}

.missing-flag {
  width: min(100%, 780px);
  margin: 100px auto;
}

.back-link {
  display: inline-block;
  margin-top: 24px;
  padding-bottom: 3px;
  border-bottom: 1px solid #f5cf3d;
}

@media (max-width: 760px) {
  .flag-detail-page {
    padding: 28px 18px 68px;
  }

  .detail-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .record-navigation {
    justify-content: flex-start;
    width: 100%;
  }

  .record-link {
    max-width: calc(50% - 8px);
  }

  .flag-hero {
    min-height: 250px;
    margin-top: 20px;
    padding: 24px 14px;
  }

  .flag-art img {
    max-height: 260px;
  }

  .detail-layout {
    grid-template-columns: 1fr;
    gap: 34px;
    padding-top: 32px;
  }

  .flag-story h1,
  .missing-flag h1 {
    font-size: 42px;
  }

  .story-copy {
    margin-top: 18px;
    font-size: 15px;
  }
}
</style>
