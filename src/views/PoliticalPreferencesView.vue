<template>
  <main class="politics-page">
    <header class="politics-heading">
      <h1>{{ t("politics.title") }}</h1>
      <p>{{ t("politics.subtitle") }}</p>
    </header>

    <section class="results-grid" :aria-label="t('politics.results')">
      <article v-for="result in results" :key="result.image" class="result-card">
        <div class="result-card__content">
          <h2>{{ result.name }}</h2>
          <span>{{ t(result.tag) }}</span>
        </div>
        <div class="result-card__image">
          <img
            :src="`/politics/${result.image}`"
            :alt="`${result.name} result`"
            @load="showImage"
            @error="hideImage"
          />
          <p>{{ t("politics.unavailable") }}</p>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const results = [
  { name: "Political Compass", tag: "politics.compass", image: "political_compass.png" },
  { name: "SapplyValues", tag: "politics.sapply", image: "sapplyvalues.png" },
  { name: "DozenValues", tag: "politics.dozen", image: "dozenvalues.png" },
  { name: "4Orbs", tag: "politics.orbs", image: "4orbs.png" },
  { name: "8values", tag: "politics.eight", image: "8values.png" },
  { name: "9Axes", tag: "politics.nine", image: "9axes.png" },
  { name: "PolitiScales", tag: "politics.scales", image: "politiscales.png" },
  { name: "LeftValues", tag: "politics.left", image: "leftvalues.png" },
  { name: "RightValues", tag: "politics.right", image: "rightvalues.png" },
  { name: "AltValues", tag: "politics.alt", image: "altvalues.png" },
];

function hideImage(event) {
  event.target.hidden = true;
}

function showImage(event) {
  event.target.nextElementSibling.hidden = true;
}
</script>

<style scoped>
.politics-page {
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 70px 30px 90px;
}

.politics-heading {
  margin-bottom: 42px;
}

h1 {
  margin: 0 0 12px;
  color: #04d361;
  font-size: clamp(40px, 7vw, 68px);
  line-height: 1;
  letter-spacing: -3px;
}

.politics-heading p {
  margin: 0;
  color: #a8a8b3;
  font-size: 18px;
  line-height: 1.6;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.result-card {
  overflow: hidden;
  background: #202024;
  border: 1px solid #29292e;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgb(0 0 0 / 30%);
  transition: transform 0.2s, box-shadow 0.2s;
}

.result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 15px rgb(4 211 97 / 10%);
}

.result-card__content {
  padding: 20px;
}

.result-card h2 {
  margin: 0 0 10px;
  color: #fff;
  font-size: 22px;
}

.result-card span {
  display: inline-block;
  padding: 4px 8px;
  color: #04d361;
  background: #29292e;
  border-radius: 4px;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.result-card__image {
  display: grid;
  min-height: 200px;
  place-items: center;
  padding: 16px;
  background: #121214;
  border-top: 1px solid #29292e;
}

.result-card__image img {
  width: 100%;
  height: auto;
  max-height: 520px;
  object-fit: contain;
}

.result-card__image p {
  margin: 0;
  color: #777;
  font-size: 14px;
}

@media (max-width: 800px) {
  .politics-page {
    padding: 55px 25px 70px;
  }
}
</style>
