<template>
  <main class="about-me">
    <section class="hero">
      <h1>{{ t("about.title") }}</h1>

      <h2>{{ t("about.who") }}</h2>
      <p>{{ t("about.intro") }}</p>
      <p>{{ t("about.first") }}</p>
      <p>{{ t("about.names") }}</p>
      <p>{{ t("about.origin") }}</p>
      <p>{{ t("about.pronouns") }}</p>

      <h2>{{ t("about.interests") }}</h2>
      <p>{{ t("about.interestsText") }}</p>
      <p>{{ t("about.flagsText") }}</p>

      <h2>{{ t("about.movies") }}</h2>
      <p>{{ t("about.moviesText") }}</p>
      <p>{{ t("about.tvText") }}</p>

      <h2>{{ t("about.music") }}</h2>
      <p>{{ t("about.musicText") }}</p>
      <p>{{ t("about.musicLikes") }}</p>
      <p>{{ t("about.jazz") }}</p>

      <h2>{{ t("about.coding") }}</h2>
      <p>{{ t("about.codingText") }}</p>
      <p>{{ t("about.projectsText") }}</p>
      <p>
        {{ t("about.projectsInclude") }}
        <a href="https://eireq.github.io/rc" target="_blank">{{ t("about.randomCountry") }}</a>,
        <a href="https://eireq.github.io/modes" target="_blank">{{ t("about.modes") }}</a>,
        <a href="https://eireq.github.io/games/racing" target="_blank">{{ t("about.racing") }}</a>,
        {{ t("about.flagQuiz") }}.
      </p>
      <p>
        {{ t("about.moreProjects") }}
        <a href="https://github.com/eireq" target="_blank">github</a>.
      </p>

      <h2>{{ t("about.currently") }}</h2>
      <p>{{ t("about.currentlyText") }}</p>
      <p>{{ t("about.planning") }}</p>

      <h2>{{ t("about.favoriteFlags") }}</h2>
      <p>{{ t("about.favoriteFlagsText") }}</p>

      <h2>{{ t("about.randomFacts") }}</h2>
      <ul>
        <li v-for="fact in t('about.facts')" :key="fact">{{ fact }}</li>
      </ul>

      <h2>{{ t("about.where") }}</h2>
      <p>
        {{ t("about.contactText") }}
        <a href="mailto:eireball@proton.me">email</a>.
      </p>
      <p>
        {{ t("about.contactMore") }}
        <a href="https://discord.gg/zwvvbqBFPV" target="_blank">discord</a>,
        <a href="https://github.com/eireq" target="_blank">github</a>,
        <a href="https://www.youtube.com/@%E3%81%84%E4%B8%A8" target="_blank">youtube</a>.
      </p>
      <p>{{ t("about.username") }} <strong>eireq</strong>.</p>
      <p>{{ t("about.final") }}</p>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();
</script>
