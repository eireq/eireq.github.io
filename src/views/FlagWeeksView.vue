<template>
  <main class="weeks">
    <p class="back">
      <RouterLink to="/flagdb">{{ t("flagDb.weeksBack") }}</RouterLink>
    </p>
    <h1>{{ t("flagDb.weeksTitle") }}</h1>
    <p class="intro">{{ t("flagDb.weeksIntro") }}</p>
    <p v-if="!ready" class="intro">{{ t("flagDb.loading") }}</p>
    <ul v-else class="list">
      <li v-for="entry in entries" :key="entry.flag.svgUrl">
        <RouterLink :to="flagRoute(entry.flag)">
          <img :src="imageUrl(entry.flag.svgUrl)" :alt="entry.name" />
          <span>
            <strong>{{ entry.name }}</strong>
            <p>{{ entry.blurb }}</p>
          </span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { flagSlug, imageUrl, loadFlags } from "../data/flags.js";
import { editorialEntries } from "../data/flagOfTheWeek.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();
const ready = ref(false);
const entries = ref([]);

onMounted(async () => {
  entries.value = editorialEntries(await loadFlags());
  ready.value = true;
});

function flagRoute(flag) {
  return { name: "flag-detail", params: { flagId: flagSlug(flag) } };
}
</script>

<style scoped>
.weeks {
  width: min(100%, 860px);
  margin: 0 auto;
  padding: 68px 30px 96px;
  color: #f4f1e8;
}

.back a {
  color: #aaa79f;
}

h1 {
  margin: 18px 0 12px;
  font-size: clamp(42px, 7vw, 72px);
  line-height: 1;
}

.intro {
  max-width: 620px;
  color: #aaa79f;
  line-height: 1.6;
}

.list {
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.list a {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #292824;
  color: inherit;
  text-decoration: none;
}

.list img {
  width: 120px;
  height: 80px;
  object-fit: contain;
  background: #171713;
}

.list strong {
  display: block;
  margin-bottom: 6px;
}

.list p {
  margin: 0;
  color: #aaa79f;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .weeks {
    padding: 48px 18px 72px;
  }

  .list a {
    grid-template-columns: 1fr;
  }
}
</style>
