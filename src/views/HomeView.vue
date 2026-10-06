<template>
  <main class="home-page">
    <section class="hero">
      <h1>{{ t("home.greeting") }}<br />{{ t("home.signature") }}</h1>
      <p class="lead">{{ t("home.lead") }}</p>
      <div class="hero-actions">
        <RouterLink class="button" to="/games/daily">{{
          t("home.dailyCta")
        }}</RouterLink>
        <RouterLink class="button" to="/flagdb">{{
          t("home.flagDbCta")
        }}</RouterLink>
        <RouterLink class="button button--ghost" to="/me">{{
          t("home.about")
        }}</RouterLink>
      </div>
    </section>

    <section class="what-to-do" aria-labelledby="what-to-do-title">
      <h2 id="what-to-do-title">{{ t("home.whatTitle") }}</h2>
      <p class="section-intro">{{ t("home.whatIntro") }}</p>
      <div class="feature-grid">
        <RouterLink
          v-for="item in features"
          :key="item.to"
          class="feature"
          :to="item.to"
        >
          <h3>{{ t(item.title) }}</h3>
          <p>{{ t(item.text) }}</p>
        </RouterLink>
      </div>
    </section>

    <section v-if="weekly" class="flag-week" aria-labelledby="flag-week-title">
      <div class="flag-week__copy">
        <h2 id="flag-week-title">{{ t("home.weekTitle") }}</h2>
        <p class="week-meta">{{ weekly.weekKey }}</p>
        <h3>{{ weekly.name }}</h3>
        <p class="week-blurb">{{ weekly.blurb }}</p>
        <div class="hero-actions">
          <RouterLink class="button" :to="flagRoute(weekly.flag)">{{
            t("home.weekOpen")
          }}</RouterLink>
          <RouterLink
            class="button button--ghost"
            :to="{ path: '/compare', query: { a: weekly.name } }"
            >{{ t("home.weekCompare") }}</RouterLink
          >
        </div>
      </div>
      <RouterLink class="flag-week__art" :to="flagRoute(weekly.flag)">
        <img
          v-if="weekImage"
          :src="weekImage"
          :alt="weekly.flag.name"
        />
      </RouterLink>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { loadFlags } from "@/data/flags.js";
import { cachedFlagImageUrl } from "@/data/flagImageCache.js";
import { pickFlagOfTheWeek } from "@/data/flagOfTheWeek.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const flags = ref([]);
const weekly = ref(null);
const weekImage = ref("");

const features = [
  {
    to: "/games/daily",
    title: "home.featDaily",
    text: "home.featDailyText",
  },
  {
    to: "/flagdb",
    title: "home.featDb",
    text: "home.featDbText",
  },
  {
    to: "/games/flagquiz",
    title: "home.featQuiz",
    text: "home.featQuizText",
  },
  {
    to: "/compare",
    title: "home.featCompare",
    text: "home.featCompareText",
  },
  {
    to: "/games/racing",
    title: "home.featRacing",
    text: "home.featRacingText",
  },
  {
    to: "/jpol",
    title: "home.featJpol",
    text: "home.featJpolText",
  },
];

onMounted(async () => {
  flags.value = await loadFlags();
  weekly.value = pickFlagOfTheWeek(flags.value);
  if (weekly.value?.flag) {
    weekImage.value = await cachedFlagImageUrl(weekly.value.flag.svgUrl);
  }
});

function flagRoute(flag) {
  return {
    name: "flag-detail",
    params: { flagId: String(flags.value.indexOf(flag)) },
  };
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 30px 100px;
  gap: 72px;
}

.hero {
  max-width: 820px;
}

h1 {
  font-size: clamp(52px, 10vw, 96px);
  line-height: 0.95;
  margin: 0 0 18px;
  letter-spacing: -4px;
}

.lead,
.section-intro,
.week-blurb,
.week-meta,
.feature p {
  color: #888;
  line-height: 1.6;
}

.lead {
  margin: 0 0 28px;
  font-size: 18px;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.button {
  display: inline-flex;
  align-items: center;
  padding: 12px 18px;
  border: 1px solid #fff;
  background: #fff;
  color: #000;
  text-decoration: none;
  font-size: 15px;
}

.button--ghost {
  background: transparent;
  color: #fff;
}

.what-to-do h2,
.flag-week h2 {
  margin: 0 0 12px;
  font-size: clamp(28px, 5vw, 40px);
  letter-spacing: -1px;
}

.section-intro {
  margin: 0 0 28px;
  max-width: 640px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.feature {
  display: block;
  padding: 24px;
  border: 1px solid #222;
  text-decoration: none;
  color: #fff;
  min-height: 150px;
  transition: border-color 0.2s, transform 0.2s;
}

.feature:hover {
  border-color: #fff;
  transform: translateY(-2px);
}

.feature h3 {
  margin: 0 0 10px;
  font-size: 22px;
}

.feature p {
  margin: 0;
  font-size: 15px;
}

.flag-week {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 28px;
  align-items: center;
  border-top: 1px solid #222;
  padding-top: 48px;
}

.week-meta {
  margin: 0 0 8px;
  font-size: 13px;
}

.flag-week h3 {
  margin: 0 0 14px;
  font-size: clamp(28px, 5vw, 42px);
  letter-spacing: -1px;
}

.week-blurb {
  margin: 0 0 24px;
  font-size: 16px;
  max-width: 560px;
}

.flag-week__art {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 24px;
  border: 1px solid #222;
  background: #0d0d0d;
}

.flag-week__art img {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
}

@media (max-width: 800px) {
  .home-page {
    padding: 48px 18px 72px;
    gap: 48px;
  }

  .flag-week {
    grid-template-columns: 1fr;
  }

  .button {
    width: 100%;
    justify-content: center;
  }
}
</style>
