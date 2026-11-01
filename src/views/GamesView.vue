<template>
  <main>
    <h1>{{ t("games.title") }}</h1>

    <p class="intro">
      {{ t("games.intro") }}
    </p>

    <button type="button" class="random" @click="playRandom">
      {{ t("games.random") }}
    </button>

    <section class="games">
      <router-link class="game" to="/games/go">
        <h2>{{ t("games.go") }}</h2>
        <p>{{ t("games.goText") }}</p>
      </router-link>

      <router-link class="game" to="/games/otrio">
        <h2>{{ t("games.otrio") }}</h2>
        <p>{{ t("games.otrioText") }}</p>
      </router-link>

      <router-link class="game" to="/games/hexo">
        <h2>{{ t("games.hexo") }}</h2>
        <p>{{ t("games.hexoText") }}</p>
      </router-link>

      <router-link class="game" to="/games/connect">
        <h2>{{ t("games.connect") }}</h2>
        <p>{{ t("games.connectText") }}</p>
      </router-link>

      <router-link class="game" to="/games/hexchess">
        <h2>{{ t("games.hexchess") }}</h2>
        <p>{{ t("games.hexchessText") }}</p>
      </router-link>

      <router-link class="game" to="/games/racing">
        <h2>{{ t("games.racing") }}</h2>
        <p>{{ t("games.racingText") }}</p>
      </router-link>

      <router-link class="game" to="/games/flagquiz">
        <h2>{{ t("games.flagQuiz") }}</h2>
        <p>{{ t("games.flagQuizText") }}</p>
      </router-link>

      <router-link class="game" to="/games/daily">
        <h2>{{ t("games.dailyFlag") }}</h2>
        <p>{{ t("games.dailyFlagText") }}</p>
      </router-link>

      <router-link class="game" to="/kht">
        <h2>{{ t("games.kht") }}</h2>
        <p>{{ t("games.khtText") }}</p>
      </router-link>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useI18n } from "../i18n.js";

const { t } = useI18n();
const router = useRouter();
const picks = [
  "/games/go",
  "/games/otrio",
  "/games/hexo",
  "/games/connect",
  "/games/hexchess",
  "/games/racing",
  "/games/flagquiz",
  "/games/daily",
  "/kht",
];

function playRandom() {
  router.push(picks[Math.floor(Math.random() * picks.length)]);
}
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
  margin-bottom: 24px;
  max-width: 650px;
}

.random {
  min-height: 44px;
  margin: 0 0 40px;
  padding: 0 18px;
  border: 1px solid #fff;
  background: #fff;
  color: #000;
  font: inherit;
  cursor: pointer;
}

.games {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.game {
  display: block;
  padding: 28px;
  border: 1px solid #222;
  color: #fff;
  text-decoration: none;
  transition: 0.2s;
  min-height: 180px;
}

.game:hover {
  border-color: #fff;
  transform: translateY(-3px);
}

.game h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.game p {
  margin: 0;
  color: #888;
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 800px) {
  .games {
    grid-template-columns: 1fr;
  }

  main {
    padding: 60px 25px;
  }
}
</style>
