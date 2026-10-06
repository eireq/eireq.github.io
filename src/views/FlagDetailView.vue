<template>
  <main v-if="!flagsReady" class="flag-detail-page">
    <p class="loading-state">loading flag record…</p>
  </main>
  <main v-else-if="flag" class="flag-detail-page">
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
            @error="handleImageError"
          />
          <p v-else class="image-fallback">Flag image unavailable</p>
          <figcaption v-if="flag.proportions">
            {{ flag.proportions }}
          </figcaption>
        </figure>
      </section>

      <section v-if="palette.length" class="color-palette" aria-label="Flag colors">
        <h2>Colors</h2>
        <ul>
          <li v-for="hex in palette" :key="hex">
            <span class="swatch" :style="{ background: hex }"></span>
            <code>{{ hex }}</code>
          </li>
        </ul>
      </section>

      <section class="detail-layout">
        <article class="flag-story">
          <p class="eyebrow">{{ displayCategory(flag) }} / FLAG RECORD</p>
          <h1>
            <span>The Flag of</span>
            {{ flagTitle }}
          </h1>

          <p v-if="article?.description" class="article-kicker">
            {{ article.description }}
          </p>

          <div v-if="articleLoading" class="story-copy muted">
            loading wikipedia article…
          </div>
          <template v-else-if="article">
            <p
              v-for="(paragraph, index) in articleParagraphs"
              :key="index"
              class="story-copy"
            >
              {{ paragraph }}
            </p>
            <p v-if="article.url" class="source-link">
              <a :href="article.url" target="_blank" rel="noreferrer"
                >Read more on Wikipedia</a
              >
            </p>
          </template>
          <template v-else>
            <p v-if="flag.emblemMeaning" class="story-copy">
              {{ flag.emblemMeaning }}
            </p>
            <p v-if="flag.funFact" class="story-copy">
              {{ flag.funFact }}
            </p>
          </template>
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
            <div v-if="palette.length">
              <dt>Palette</dt>
              <dd>{{ palette.join(", ") }}</dd>
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
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import {
  colorHex,
  displayCategory,
  imageUrl,
  loadFlags,
  shortName as flagShortName,
} from "../data/flags.js";
import { extractColorsFromSvg, fetchFlagArticle } from "../data/wikipedia.js";

const route = useRoute();
const flags = shallowRef([]);
const flagsReady = ref(false);
const imageFailed = ref(false);
const article = ref(null);
const articleLoading = ref(false);
const extractedColors = ref([]);

onMounted(async () => {
  flags.value = await loadFlags();
  flagsReady.value = true;
});

const orderedFlags = computed(() =>
  [...flags.value].sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.svgUrl.localeCompare(right.svgUrl),
  ),
);

const flagIndex = computed(() => {
  const index = Number(route.params.flagId);
  return Number.isInteger(index) && index >= 0 && index < flags.value.length
    ? index
    : -1;
});
const flag = computed(() =>
  flagIndex.value >= 0 ? flags.value[flagIndex.value] : null,
);
const flagTitle = computed(() => flagShortName(flag.value));
const orderedIndex = computed(() => orderedFlags.value.indexOf(flag.value));
const previousFlag = computed(() => orderedFlags.value[orderedIndex.value - 1]);
const nextFlag = computed(() => orderedFlags.value[orderedIndex.value + 1]);

const storedColors = computed(() =>
  Array.isArray(flag.value?.colors)
    ? flag.value.colors.map(colorHex).filter(Boolean)
    : [],
);

const palette = computed(() => {
  const merged = [...storedColors.value, ...extractedColors.value];
  return [...new Set(merged)];
});

const articleParagraphs = computed(() => {
  const text = article.value?.fullText || article.value?.extract || "";
  return text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12);
});

watch(
  () => route.params.flagId,
  () => {
    imageFailed.value = false;
  },
);

watch(
  flag,
  async (record) => {
    article.value = null;
    extractedColors.value = [];
    if (!record) return;

    articleLoading.value = true;
    try {
      const [wiki, colors] = await Promise.all([
        fetchFlagArticle(record.name),
        extractColorsFromSvg(record.svgUrl),
      ]);
      if (flag.value === record) {
        article.value = wiki;
        extractedColors.value = colors;
      }
    } finally {
      if (flag.value === record) articleLoading.value = false;
    }
  },
  { immediate: true },
);

function handleImageError() {
  imageFailed.value = true;
}

function shortName(record) {
  return flagShortName(record);
}

function flagRoute(record) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.value.indexOf(record)) },
  };
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
</script>

<style scoped>
.flag-detail-page {
  display: block;
  width: 100%;
  padding: 38px 30px 90px;
  color: #f4f1e8;
}

.loading-state {
  margin: 100px auto;
  max-width: 780px;
  color: #aaa79f;
  font-size: 16px;
}

.flag-detail-shell {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.detail-topbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}

.breadcrumbs,
.record-navigation {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  color: #aaa79f;
  font-size: 14px;
}

.breadcrumbs a,
.record-link,
.source-link a,
.back-link {
  color: #f4f1e8;
  text-decoration: none;
  border-bottom: 1px solid #f5cf3d;
}

.flag-hero {
  margin-top: 28px;
  min-height: 320px;
  display: grid;
  place-items: center;
  background: #14140f;
  border: 1px solid #292824;
}

.flag-art {
  margin: 0;
  padding: 28px;
  width: min(100%, 720px);
  text-align: center;
}

.flag-art img {
  width: 100%;
  max-height: 360px;
  object-fit: contain;
}

.flag-art figcaption,
.image-fallback,
.muted {
  color: #aaa79f;
}

.color-palette {
  margin-top: 28px;
}

.color-palette h2,
.flag-facts h2,
.eyebrow {
  margin: 0;
  color: #aaa79f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.color-palette ul {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-palette li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.swatch {
  width: 28px;
  height: 28px;
  border: 1px solid #393832;
  flex: 0 0 auto;
}

.color-palette code {
  color: #f4f1e8;
  font-size: 13px;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
  gap: 42px;
  margin-top: 42px;
}

.flag-story h1,
.missing-flag h1 {
  margin: 8px 0 0;
  font-size: clamp(36px, 7vw, 64px);
  line-height: 1.04;
  overflow-wrap: anywhere;
}

.flag-story h1 span {
  display: block;
  margin-bottom: 5px;
  color: #aaa79f;
  font-size: 14px;
  font-weight: 400;
}

.article-kicker {
  margin: 18px 0 0;
  color: #f5cf3d;
  font-size: 15px;
}

.story-copy {
  max-width: 760px;
  margin: 18px 0 0;
  color: #d0cdc4;
  font-size: 17px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.source-link {
  margin-top: 20px;
}

.flag-facts {
  align-self: start;
  border-top: 1px solid #f5cf3d;
}

.flag-facts h2 {
  padding: 15px 0 10px;
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
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

@media (max-width: 700px) {
  .flag-detail-page {
    padding: 24px 16px 64px;
  }

  .flag-hero {
    min-height: 220px;
  }

  .flag-art {
    padding: 18px;
  }

  .story-copy {
    font-size: 15px;
  }
}
</style>
