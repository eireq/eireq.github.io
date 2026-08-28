<template>
  <main>
    <section class="hero">
      <h1>{{ t("home.greeting") }}<br />{{ t("home.signature") }}</h1>
      <a class="button" href="/me">{{ t("home.about") }}</a>
      <a class="button" href="/contact">{{ t("home.contact") }}</a>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();
</script>
