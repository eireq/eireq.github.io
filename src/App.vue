<template>
  <div class="site" :class="{ 'site--bare': hideChrome }">
    <AppHeader v-if="!hideChrome" />
    <router-view />
    <AppFooter v-if="!hideChrome" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()
const hideChrome = computed(() => Boolean(route.meta.hideChrome))
</script>
