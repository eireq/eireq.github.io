<script setup>
defineProps({
  active: { type: Boolean, default: false },
});

defineEmits(["toggle"]);
</script>

<template>
  <button type="button" :aria-pressed="active" @click="$emit('toggle')">
    {{ active ? "exit full screen" : "full screen" }}
  </button>
</template>
