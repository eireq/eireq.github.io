<template>
  <footer>
    <strong>{{ t("footer.contact") }}</strong><br><br>
    {{ t("footer.text") }}
    <a href="mailto:eireball@proton.me">{{ t("footer.email") }}</a>.
    <br><br>
    © 2026 eire
  </footer>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();
</script>

<style scoped>
footer {
  border-top: 1px solid #222;
  padding: 35px 30px;
  color: #777;
  font-size: 14px;
}

footer a {
  color: #aaa;
}
</style>
