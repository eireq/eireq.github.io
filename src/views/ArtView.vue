<template>
  <main>
    <h1>{{ t("art.title") }}</h1>

    <p class="intro">
      {{ t("art.intro") }}
    </p>

    <section class="art">
      <a class="art-piece" href="#">
        <h2>{{ t("art.digital") }}</h2>
        <p>{{ t("art.digitalText") }}</p>
      </a>

      <a class="art-piece" href="#">
        <h2>{{ t("art.flags") }}</h2>
        <p>{{ t("art.flagsText") }}</p>
      </a>

      <a class="art-piece" href="#">
        <h2>{{ t("art.more") }}</h2>
        <p>{{ t("art.moreText") }}</p>
      </a>
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

.art {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.art-piece {
  display: block;
  padding: 28px;
  border: 1px solid #222;
  color: #fff;
  text-decoration: none;
  transition: 0.2s;
  min-height: 180px;
}

.art-piece:hover {
  border-color: #fff;
  transform: translateY(-3px);
}

.art-piece h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.art-piece p {
  margin: 0;
  color: #888;
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 800px) {
  .art {
    grid-template-columns: 1fr;
  }

  main {
    padding: 60px 25px;
  }
}
</style>
