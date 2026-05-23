<script setup lang="ts">
defineProps<{
  bgImage?: string
  bgClass?: string
}>()
</script>

<template>
  <div class="game-container">
    <div
      class="game-bg"
      :class="bgClass"
      :style="bgImage ? { backgroundImage: `url(${bgImage})` } : undefined"
    />
    <div class="game-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.game-container {
  height: 100%;
  overflow: hidden;
  position: relative;
  --gc-padding-top: max(12px, env(safe-area-inset-top));
  --gc-padding-right: clamp(14px, 3.5vw, 28px);
  --gc-padding-bottom: max(12px, env(safe-area-inset-bottom));
  --gc-padding-left: clamp(14px, 3.5vw, 28px);
  --gc-aspect-ratio: 3 / 4;
  padding: var(--gc-padding-top) var(--gc-padding-right) var(--gc-padding-bottom)
    var(--gc-padding-left);
  box-sizing: border-box;
}

.game-bg {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
}

.game-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  aspect-ratio: var(--gc-aspect-ratio);
  max-width: 100%;
  margin: 0 auto;
  container-type: inline-size;
  container-name: game;
}
</style>
