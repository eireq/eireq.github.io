<template>
  <main>
    <h1>{{ t("tools.title") }}</h1>

    <p class="intro">
      {{ t("tools.intro") }}
    </p>

    <section class="tools">
      <router-link class="tool" to="/flagdb">
        <h2>{{ t("tools.flagDatabase") }}</h2>
        <p>{{ t("tools.flagDatabaseText") }}</p>
      </router-link>

      <router-link class="tool" to="/rc">
        <h2>{{ t("tools.randomCountry") }}</h2>
        <p>{{ t("tools.randomCountryText") }}</p>
      </router-link>

      <router-link class="tool" to="/games/daily">
        <h2>{{ t("tools.dailyFlag") }}</h2>
        <p>{{ t("tools.dailyFlagText") }}</p>
      </router-link>

      <router-link class="tool" to="/compare">
        <h2>{{ t("tools.compare") }}</h2>
        <p>{{ t("tools.compareText") }}</p>
      </router-link>

      <router-link class="tool" to="/games/flagquiz">
        <h2>{{ t("tools.flagQuiz") }}</h2>
        <p>{{ t("tools.flagQuizText") }}</p>
      </router-link>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();
</script>

<style scoped>
main {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 80px 30px;
  flex-direction: column;
  align-items: stretch;
}

h1 {
  font-size: clamp(50px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 20px;
  letter-spacing: -4px;
}

.intro {
  color: #888;
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 55px;
  max-width: 650px;
}

.tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.tool {
  display: block;
  padding: 28px;
  border: 1px solid #222;
  color: #fff;
  text-decoration: none;
  transition: 0.2s;
  min-height: 180px;
}

.tool:hover {
  border-color: #fff;
  transform: translateY(-3px);
}

.tool h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.tool p {
  margin: 0;
  color: #888;
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 800px) {
  .tools {
    grid-template-columns: 1fr;
  }

  main {
    padding: 60px 25px;
  }
}
</style>
