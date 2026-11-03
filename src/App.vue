<template>
  <div class="site" :class="{ 'site--bare': hideChrome }">
    <AppHeader v-if="!hideChrome" />
    <router-view />
    <AppFooter v-if="!hideChrome" />
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";

const route = useRoute();
const hideChrome = computed(() => Boolean(route.meta.hideChrome));

// once the page is up, quietly fetch today's daily flag and the pi digits
// so the daily pages open instantly
async function warmDailies() {
  import("@/data/piDigits.js");
  const [{ loadFlags, utcDateKey }, { pickDailyFlag }, { cachedFlagImageUrl }] = await Promise.all([
    import("@/data/flags.js"),
    import("@/data/dailyFlag.js"),
    import("@/data/flagImageCache.js"),
  ]);
  const today = pickDailyFlag(await loadFlags(), utcDateKey());
  if (today?.svgUrl) cachedFlagImageUrl(today.svgUrl);
}

onMounted(() => {
  if (window.requestIdleCallback) window.requestIdleCallback(warmDailies);
  else window.setTimeout(warmDailies, 600);
});
</script>
