<script setup lang="ts">
defineProps<{
  color?: string
}>()

const circleColor = 'rgba(176,138,215,0.12)'
const pathColor = 'rgba(176,138,215,0.08)'
</script>

<template>
  <svg class="decor-svg" viewBox="0 0 100 100" fill="none">
    <circle cx="15" cy="18" r="3" :fill="circleColor" />
    <circle cx="88" cy="12" r="2" :fill="circleColor.replace('0.12', '0.10')" />
    <circle cx="8" cy="70" r="4" :fill="pathColor" />
    <circle cx="92" cy="65" r="2.5" :fill="circleColor.replace('0.12', '0.10')" />
    <path d="M30 85 Q35 78 40 85 Q35 80 30 85" :fill="pathColor" />
    <path d="M70 20 L73 26 L67 26 Z" :fill="circleColor.replace('0.12', '0.10')" />
  </svg>
</template>

<style scoped>
.decor-svg {
  width: 100%;
  height: 100%;
}
</style>
