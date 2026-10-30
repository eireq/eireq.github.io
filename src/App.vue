<template>
  <div class="site" :class="{ 'site--bare': hideChrome }">
    <AppHeader v-if="!hideChrome" />
    <router-view />
    <AppFooter v-if="!hideChrome" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()
const hideChrome = computed(() => Boolean(route.meta.hideChrome))

onMounted(() => {
  const warm = () => {
    import("@/data/piDigits.js")
    import("@/data/flags.js").then(async ({ loadFlags, utcDateKey }) => {
      const [{ pickDailyFlag }, { cachedFlagImageUrl }] = await Promise.all([
        import("@/data/dailyFlag.js"),
        import("@/data/flagImageCache.js"),
      ])
      const flags = await loadFlags()
      const flag = pickDailyFlag(flags, utcDateKey())
      if (flag?.svgUrl) cachedFlagImageUrl(flag.svgUrl)
    })
  }
  if (window.requestIdleCallback) window.requestIdleCallback(warm)
  else window.setTimeout(warm, 600)
})
</script>
