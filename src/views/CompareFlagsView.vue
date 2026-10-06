<template>
  <main class="compare-page">
    <h1>{{ t("compare.title") }}</h1>
    <p class="intro">{{ t("compare.intro") }}</p>

    <p v-if="!ready" class="status">{{ t("compare.loading") }}</p>

    <template v-else>
      <div class="pickers">
        <label>
          <span>{{ t("compare.left") }}</span>
          <input
            v-model="leftQuery"
            type="search"
            :placeholder="t('compare.search')"
            autocomplete="off"
            list="compare-left-options"
          />
          <datalist id="compare-left-options">
            <option
              v-for="flag in leftOptions"
              :key="flag.name + flag.svgUrl"
              :value="shortName(flag)"
            />
          </datalist>
        </label>

        <label>
          <span>{{ t("compare.right") }}</span>
          <input
            v-model="rightQuery"
            type="search"
            :placeholder="t('compare.search')"
            autocomplete="off"
            list="compare-right-options"
          />
          <datalist id="compare-right-options">
            <option
              v-for="flag in rightOptions"
              :key="flag.name + flag.svgUrl"
              :value="shortName(flag)"
            />
          </datalist>
        </label>
      </div>

      <div class="compare-grid">
        <article v-for="side in sides" :key="side.key" class="compare-card">
          <template v-if="side.flag">
            <img
              :src="side.image"
              :alt="side.flag.name"
              @error="side.imageFailed = true"
            />
            <h2>
              <RouterLink :to="flagRoute(side.flag)">{{
                shortName(side.flag)
              }}</RouterLink>
            </h2>
            <dl>
              <div>
                <dt>{{ t("compare.category") }}</dt>
                <dd>{{ displayCategory(side.flag) }}</dd>
              </div>
              <div>
                <dt>{{ t("compare.adopted") }}</dt>
                <dd>{{ formatDate(side.flag.adoptionDate) }}</dd>
              </div>
              <div>
                <dt>{{ t("compare.proportions") }}</dt>
                <dd>
                  {{ side.proportions || side.flag.proportions || "—" }}
                </dd>
              </div>
              <div>
                <dt>{{ t("compare.colors") }}</dt>
                <dd>
                  <div v-if="side.colors.length" class="swatches">
                    <span
                      v-for="hex in side.colors"
                      :key="hex"
                      class="swatch"
                      :style="{ background: hex }"
                      :title="hex"
                    ></span>
                    <code>{{ side.colors.join(", ") }}</code>
                  </div>
                  <span v-else-if="side.loading">…</span>
                  <span v-else>—</span>
                </dd>
              </div>
            </dl>
          </template>
          <p v-else class="empty">{{ t("compare.pickPrompt") }}</p>
        </article>
      </div>

      <p v-if="leftFlag && rightFlag" class="similarity">
        {{ t("compare.similarity") }}:
        <strong>{{ similarity }}</strong>
      </p>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  displayCategory,
  loadFlags,
  shortName,
} from "@/data/flags.js";
import { cachedFlagImageUrl } from "@/data/flagImageCache.js";
import { similarityScore } from "@/data/flagSimilarity.js";
import { extractSvgMeta } from "@/data/wikipedia.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();
const route = useRoute();

const flags = ref([]);
const ready = ref(false);
const leftQuery = ref("");
const rightQuery = ref("");
const leftMeta = reactive({
  colors: [],
  proportions: null,
  loading: false,
  image: "",
  forName: "",
});
const rightMeta = reactive({
  colors: [],
  proportions: null,
  loading: false,
  image: "",
  forName: "",
});

onMounted(async () => {
  flags.value = await loadFlags();
  ready.value = true;
  if (typeof route.query.a === "string") leftQuery.value = route.query.a;
  if (typeof route.query.b === "string") rightQuery.value = route.query.b;
});

function matchFlag(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return (
    flags.value.find((flag) => shortName(flag).toLowerCase() === needle) ||
    flags.value.find((flag) =>
      shortName(flag).toLowerCase().includes(needle),
    ) ||
    null
  );
}

const leftFlag = computed(() => matchFlag(leftQuery.value));
const rightFlag = computed(() => matchFlag(rightQuery.value));

const leftOptions = computed(() =>
  flags.value
    .filter((flag) =>
      shortName(flag)
        .toLowerCase()
        .includes(leftQuery.value.trim().toLowerCase()),
    )
    .slice(0, 40),
);

const rightOptions = computed(() =>
  flags.value
    .filter((flag) =>
      shortName(flag)
        .toLowerCase()
        .includes(rightQuery.value.trim().toLowerCase()),
    )
    .slice(0, 40),
);

const sides = computed(() => [
  {
    key: "left",
    flag: leftFlag.value,
    colors: leftMeta.colors,
    proportions: leftMeta.proportions,
    loading: leftMeta.loading,
    image: leftMeta.image,
  },
  {
    key: "right",
    flag: rightFlag.value,
    colors: rightMeta.colors,
    proportions: rightMeta.proportions,
    loading: rightMeta.loading,
    image: rightMeta.image,
  },
]);

const similarity = computed(() => {
  if (!leftFlag.value || !rightFlag.value) return "—";
  return similarityScore(leftFlag.value, rightFlag.value, leftMeta.colors);
});

watch(leftFlag, (flag) => loadSide(flag, leftMeta), { immediate: true });
watch(rightFlag, (flag) => loadSide(flag, rightMeta), { immediate: true });

async function loadSide(flag, target) {
  target.colors = [];
  target.proportions = null;
  target.image = "";
  target.forName = flag ? flag.name : "";
  if (!flag) {
    target.loading = false;
    return;
  }
  target.loading = true;
  const expected = flag.name;
  try {
    const [image, meta] = await Promise.all([
      cachedFlagImageUrl(flag.svgUrl),
      extractSvgMeta(flag.svgUrl),
    ]);
    if (target.forName === expected) {
      target.image = image;
      target.colors = meta.colors || [];
      target.proportions = meta.proportions;
    }
  } finally {
    if (target.forName === expected) target.loading = false;
  }
}

function flagRoute(flag) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.value.indexOf(flag)) },
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}
</script>

<style scoped>
.compare-page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 30px;
}

h1 {
  font-size: clamp(42px, 8vw, 72px);
  line-height: 0.95;
  margin: 0 0 16px;
  letter-spacing: -3px;
}

.intro,
.status,
.empty,
.similarity {
  color: #888;
  line-height: 1.6;
}

.pickers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin: 28px 0 32px;
}

.pickers label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #aaa;
  font-size: 14px;
}

.pickers input {
  padding: 13px 14px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
  font: inherit;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.compare-card {
  border: 1px solid #222;
  padding: 20px;
  min-height: 320px;
}

.compare-card img {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  background: #111;
  border: 1px solid #1a1a1a;
}

.compare-card h2 {
  margin: 16px 0 12px;
  font-size: 28px;
  letter-spacing: -1px;
}

.compare-card a {
  color: #fff;
  text-decoration: none;
  border-bottom: 1px solid #f5cf3d;
}

dl {
  margin: 0;
}

dl > div {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid #1a1a1a;
  font-size: 14px;
}

dt {
  color: #777;
}

dd {
  margin: 0;
  color: #ddd;
  overflow-wrap: anywhere;
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.swatch {
  width: 16px;
  height: 16px;
  border: 1px solid #333;
}

.similarity {
  margin-top: 22px;
}

@media (max-width: 800px) {
  .compare-page {
    padding: 48px 18px;
  }

  .pickers,
  .compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>
