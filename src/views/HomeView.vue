<template>
  <main>
    <section class="hero">
      <h1>hey.<br />im eire.</h1>
      <a class="button" href="/me">{{ t("home.about") }}</a>
      <a class="button" href="/contact">{{ t("home.contact") }}</a>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();
</script>
