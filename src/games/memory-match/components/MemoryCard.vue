<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  imageUrl: string
  cardBackUrl?: string
  cardBackFallback: string
  isRevealed: boolean
  isMatched: boolean
  shaking: boolean
  accentColor?: string
}>()

const emit = defineEmits<{
  flip: []
}>()

const cardClass = computed(() => ({
  revealed: props.isRevealed,
  matched: props.isMatched,
  shaking: props.shaking,
}))

const accentStyle = computed(() => {
  if (!props.accentColor) return {}
  return {
    '--card-accent': props.accentColor,
    '--card-accent-alpha': props.accentColor + '33',
  }
})
</script>

<template>
  <button
    class="card"
    :class="cardClass"
    :style="accentStyle"
    :disabled="isRevealed"
    @click="emit('flip')"
  >
    <div class="card-inner">
      <div class="card-back" :style="cardBackUrl ? undefined : { background: cardBackFallback }">
        <img v-if="cardBackUrl" :src="cardBackUrl" alt="" class="card-back-img" draggable="false" />
        <div v-else class="card-back-pattern" />
      </div>
      <div class="card-front">
        <img :src="imageUrl" alt="" class="card-image" draggable="false" />
      </div>
    </div>
  </button>
</template>

<style scoped>
.card {
  perspective: 1000px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  aspect-ratio: 1;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.card:disabled {
  cursor: default;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 18px;
  transition:
    transform 0.34s cubic-bezier(0.2, 0.75, 0.25, 1),
    box-shadow 0.2s ease;
  transform-style: preserve-3d;
  will-change: transform;
  box-shadow:
    0 8px 0 #344d3d,
    0 12px 14px rgba(25, 61, 47, 0.24);
}

.card.revealed .card-inner,
.card.matched .card-inner {
  transform: rotateY(180deg);
}

.card.shaking .card-inner {
  animation: shake 0.3s ease-in-out 2;
}

.card-back,
.card-front {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-back {
  border: 4px solid #b9967c;
  box-shadow:
    inset 0 0 0 4px rgba(91, 62, 47, 0.18),
    inset 0 2px 0 rgba(255, 255, 255, 0.45);
  background: linear-gradient(180deg, #73544b 0%, #4b352f 100%);
}

.card-back-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.card-back-pattern {
  position: absolute;
  inset: 12px;
  border-radius: 10px;
  border: 2px solid rgba(255, 235, 192, 0.34);
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.26), transparent 18%),
    linear-gradient(135deg, rgba(255, 239, 178, 0.18), rgba(132, 78, 36, 0.18));
  pointer-events: none;
}

.card-back:not(:has(.card-back-img))::after {
  content: '?';
  position: absolute;
  font-size: min(5vmin, 28px);
  font-weight: 700;
  color: rgba(141, 110, 99, 0.15);
}

.card-front {
  background: linear-gradient(180deg, #fff8c9 0%, #ffe9b6 100%);
  transform: rotateY(180deg);
  border: 4px solid #fff7d6;
  box-shadow:
    inset 0 -4px 0 rgba(126, 83, 49, 0.16),
    inset 0 2px 0 rgba(255, 255, 255, 0.72);
  padding: 9%;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.card.revealed .card-inner {
  box-shadow:
    0 8px 0 #344d3d,
    0 0 0 4px var(--card-accent, #ffd54f),
    0 14px 20px var(--card-accent-alpha, rgba(255, 213, 79, 0.25));
  border-radius: 20px;
}

.card.matched .card-front {
  border-color: #fff4a3;
  box-shadow:
    inset 0 -4px 0 rgba(126, 83, 49, 0.1),
    inset 0 0 0 3px rgba(255, 213, 79, 0.5),
    0 0 16px rgba(255, 213, 79, 0.45);
  animation: match-pulse 0.6s ease-in-out 2;
}

.card:not(.revealed):not(.matched):hover .card-inner {
  transform: translateY(-4px) scale(1.025);
  box-shadow:
    0 10px 0 #344d3d,
    0 16px 20px rgba(25, 61, 47, 0.28);
}

.card:not(.revealed):not(.matched):active .card-inner {
  transform: translateY(5px) scale(0.98);
  box-shadow:
    0 3px 0 #344d3d,
    0 7px 10px rgba(25, 61, 47, 0.2);
  transition-duration: 80ms;
}

@keyframes shake {
  0%,
  100% {
    transform: rotateY(180deg) translateX(0) rotateZ(0);
  }
  25% {
    transform: rotateY(180deg) translateX(-8px) rotateZ(-2deg);
  }
  75% {
    transform: rotateY(180deg) translateX(8px) rotateZ(2deg);
  }
}

@keyframes match-pulse {
  0%,
  100% {
    box-shadow: 0 0 16px rgba(255, 213, 79, 0.4);
  }
  50% {
    box-shadow: 0 0 28px rgba(255, 213, 79, 0.7);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-inner,
  .card.matched .card-front,
  .card.shaking .card-inner {
    animation: none;
    transition: none;
  }
}
</style>
