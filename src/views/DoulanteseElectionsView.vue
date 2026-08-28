<template>
  <main class="elections-page">
    <header class="elections-heading">
      <p class="eyebrow">{{ t("elections.eyebrow") }}</p>
      <h1>{{ t("elections.title") }}</h1>
      <p>{{ t("elections.intro") }}</p>
    </header>

    <section class="results" :aria-label="t('elections.results')">
      <article v-for="round in rounds" :key="round.choice" class="round">
        <div class="round-heading">
          <span class="round-number">{{ round.choice }}</span>
          <h2>{{ t("elections.choice") }} {{ round.choice }}</h2>
        </div>

        <div class="ballots">
          <div v-for="candidate in round.candidates" :key="candidate.name" class="ballot">
            <span class="votes">({{ candidate.votes }})</span>
            <span>{{ candidate.name }}</span>
          </div>
        </div>
      </article>
    </section>

    <p class="review">{{ t("elections.review") }}</p>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const rounds = [
  { choice: 1, candidates: [
    { votes: 1, name: "angry.coffee.man" }, { votes: 1, name: "jk_111111111111" },
    { votes: 1, name: "garonv" }, { votes: 1, name: "the_real_daboi" },
    { votes: 2, name: "eireq == me" }, { votes: 2, name: "esemih0108" },
  ] },
  { choice: 2, candidates: [
    { votes: 2, name: "angry.coffee.man" }, { votes: 1, name: ".sartorius_marvollo_riddle." },
    { votes: 1, name: "jk_111111111111" }, { votes: 1, name: "the_real_daboi" },
    { votes: 1, name: "eireq == me" }, { votes: 1, name: "esemih0108" },
  ] },
  { choice: 3, candidates: [
    { votes: 1, name: "angry coffe man" }, { votes: 1, name: "jk111111111111111" },
    { votes: 2, name: "garonv" }, { votes: 1, name: "daboi" }, { votes: 2, name: "eireq == me" },
  ] },
  { choice: 4, candidates: [
    { votes: 1, name: "maxdavidjr" }, { votes: 1, name: "sartioruisu marvolo ridele" },
    { votes: 1, name: "jk11111111111111" }, { votes: 1, name: "daboi" }, { votes: 3, name: "esemih0108" },
  ] },
  { choice: 5, candidates: [
    { votes: 2, name: "angry coffee" },
    { votes: 1, name: "sartorius, garon, daboi, eireq (me), esemih" },
  ] },
  { choice: 6, candidates: [
    { votes: 3, name: "maxdavidjr" }, { votes: 1, name: "sartorius, daboi" }, { votes: 2, name: "garon" },
  ] },
  { choice: 7, candidates: [
    { votes: 1, name: "angrycoffeemna, eireq" }, { votes: 2, name: "maxdavidjr" }, { votes: 3, name: "sartorius" },
  ] },
  { choice: 8, candidates: [
    { votes: 1, name: "angry coffe eanman, maxdavidjr, garon, daboi" }, { votes: 3, name: "jk11111111111111111" },
  ] },
];
</script>

<style scoped>
.elections-page { display: block; width: 100%; max-width: 1000px; margin: 0 auto; padding: 70px 30px 90px; }
.elections-heading { max-width: 720px; margin-bottom: 45px; }
.eyebrow { margin: 0 0 12px; color: #04d361; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
h1 { margin: 0 0 16px; font-size: clamp(42px, 7vw, 72px); line-height: 0.98; letter-spacing: -3px; }
.elections-heading > p:last-child { margin: 0; color: #a8a8b3; font-size: 18px; line-height: 1.6; }
.results { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.round { border: 1px solid #29292e; background: #151517; }
.round-heading { display: flex; align-items: center; gap: 14px; padding: 17px 20px; border-bottom: 1px solid #29292e; }
.round-number { display: grid; width: 32px; height: 32px; place-items: center; color: #000; background: #04d361; border-radius: 50%; font-weight: bold; }
.round h2 { margin: 0; font-size: 18px; }
.ballots { padding: 8px 20px 12px; }
.ballot { display: flex; gap: 12px; padding: 9px 0; color: #ddd; line-height: 1.4; }
.votes { flex: 0 0 28px; color: #04d361; font-variant-numeric: tabular-nums; }
.review { margin: 28px 0 0; color: #777; font-size: 14px; }
@media (max-width: 700px) { .elections-page { padding: 55px 25px 70px; } .results { grid-template-columns: 1fr; } }
</style>