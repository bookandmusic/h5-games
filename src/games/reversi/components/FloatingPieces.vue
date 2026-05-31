<script setup lang="ts">
import { computed } from 'vue'

const pieces = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 16 + Math.random() * 32,
    color: i % 2 === 0 ? 'black' : 'white',
    delay: Math.random() * 4,
    duration: 5 + Math.random() * 3,
  }))
)
</script>

<template>
  <div class="floating-pieces">
    <div
      v-for="piece in pieces"
      :key="piece.id"
      class="float-piece"
      :class="piece.color"
      :style="{
        left: `${piece.x}%`,
        top: `${piece.y}%`,
        width: `${piece.size}px`,
        height: `${piece.size}px`,
        animationDelay: `${piece.delay}s`,
        animationDuration: `${piece.duration}s`,
      }"
    />
  </div>
</template>

<style scoped>
.floating-pieces {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.float-piece {
  position: absolute;
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  opacity: 0.15;
}

.float-piece.black {
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.4);
}

.float-piece.white {
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  border: 1px solid #bbb5ad;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.05);
  opacity: 0.2;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-12px) rotate(5deg);
  }
}
</style>
