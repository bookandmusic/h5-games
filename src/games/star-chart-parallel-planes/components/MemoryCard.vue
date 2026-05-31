<script setup lang="ts">
import { computed } from 'vue'
import { RARITY_COLORS, RARITY_LABEL } from '../types'
import type { Rarity } from '../types'

const props = defineProps<{
  imageUrl: string
  cardBackUrl?: string
  cardBackFallback: string
  isRevealed: boolean
  isMatched: boolean
  shaking: boolean
  rarity: Rarity
  hintHighlighted?: boolean
  tutorialHighlighted?: boolean
  themeComplete?: boolean
}>()

const emit = defineEmits<{
  flip: []
}>()

const cardClass = computed(() => ({
  revealed: props.isRevealed,
  matched: props.isMatched,
  shaking: props.shaking,
  'hint-highlighted': props.hintHighlighted,
  'tutorial-highlighted': props.tutorialHighlighted,
  'theme-complete': props.themeComplete,
}))

const rarityColor = computed(() => RARITY_COLORS[props.rarity])

const rarityLabel = computed(() => RARITY_LABEL[props.rarity])
</script>

<template>
  <button
    class="card"
    :class="cardClass"
    :style="{ '--rarity-color': rarityColor }"
    :disabled="isRevealed"
    @pointerup.prevent="emit('flip')"
  >
    <div class="card-inner">
      <div class="card-back" :style="cardBackUrl ? undefined : { background: cardBackFallback }">
        <img v-if="cardBackUrl" :src="cardBackUrl" alt="" class="card-back-img" draggable="false" />
        <span v-else class="card-back-q">?</span>
      </div>
      <div class="card-front">
        <img :src="imageUrl" alt="" class="card-image" draggable="false" />
        <div class="card-rarity-badge">{{ rarityLabel }}</div>
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
  aspect-ratio: 2 / 3;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

.card:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
  border-radius: 0;
}

.card:disabled {
  cursor: default;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 0;
  transition: transform 0.34s cubic-bezier(0.2, 0.75, 0.25, 1);
  transform-style: preserve-3d;
  will-change: transform;
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
  border-radius: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.card-back {
  background: #0a1628;
  border: 2px solid rgba(100, 180, 255, 0.2);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1.5px rgba(100, 180, 255, 0.1);
}

.theme-complete .card-back {
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow:
    0 0 16px rgba(255, 215, 0, 0.35),
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 0 12px rgba(255, 215, 0, 0.15);
}

.theme-complete .card-back::after {
  content: '◆';
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: clamp(12px, 3cqw, 18px);
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  z-index: 2;
}

.card-back-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.card-back-q {
  font-size: clamp(18px, 5cqw, 30px);
  font-weight: 700;
  color: rgba(100, 180, 255, 0.15);
}

.card-front {
  transform: rotateY(180deg);
  background: #0d1b2a;
  border: 2.5px solid var(--rarity-color, rgba(100, 180, 255, 0.3));
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1.5px var(--rarity-color, rgba(100, 180, 255, 0.12));
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

/* ── Rarity badge (corner badge) ── */
.card-rarity-badge {
  position: absolute;
  top: -1px;
  right: -1px;
  width: clamp(18px, 4cqw, 24px);
  height: clamp(18px, 4cqw, 24px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(9px, 1.8cqw, 12px);
  font-weight: 900;
  color: #fff;
  background: var(--rarity-color, #4fc3f7);
  border-radius: 0 clamp(4px, 1cqw, 8px) 0 clamp(4px, 1cqw, 8px);
  border: 1.5px solid rgba(0, 0, 0, 0.4);
  z-index: 3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
}

.card.matched .card-front {
  border-color: var(--rarity-color);
  box-shadow:
    0 0 20px var(--rarity-color),
    inset 0 0 0 1.5px var(--rarity-color);
  animation: match-pulse 0.6s ease-in-out 2;
}

/* ── Hint highlight ── */
.card.hint-highlighted {
  z-index: 10;
}

.card.hint-highlighted .card-inner::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 12px rgba(255, 215, 0, 0.5),
    0 0 24px rgba(255, 215, 0, 0.2);
  animation: hint-glow 0.8s ease-in-out infinite alternate;
  z-index: 10;
  pointer-events: none;
}

.card:not(.revealed):not(.matched):active .card-inner {
  transform: scale(0.97);
  transition-duration: 80ms;
}

@keyframes shake {
  0%,
  100% {
    transform: rotateY(180deg) translateX(0) rotateZ(0);
  }
  25% {
    transform: rotateY(180deg) translateX(-4px) rotateZ(-2deg);
  }
  75% {
    transform: rotateY(180deg) translateX(4px) rotateZ(2deg);
  }
}

@keyframes match-pulse {
  0%,
  100% {
    box-shadow:
      0 0 12px var(--rarity-color),
      0 0 24px rgba(100, 180, 255, 0.1);
  }
  50% {
    box-shadow:
      0 0 24px var(--rarity-color),
      0 0 40px rgba(100, 180, 255, 0.2);
  }
}

/* ── Tutorial highlight ── */
.card.tutorial-highlighted {
  z-index: 10;
}

.card.tutorial-highlighted .card-inner::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 3px solid rgba(100, 200, 255, 0.8);
  box-shadow:
    0 0 12px rgba(100, 200, 255, 0.5),
    0 0 24px rgba(100, 200, 255, 0.2);
  animation: tutorial-glow 0.8s ease-in-out infinite alternate;
  z-index: 10;
  pointer-events: none;
}

@keyframes tutorial-glow {
  from {
    border-color: rgba(100, 200, 255, 0.6);
    box-shadow:
      0 0 8px rgba(100, 200, 255, 0.3),
      0 0 18px rgba(100, 200, 255, 0.1);
  }
  to {
    border-color: rgba(100, 200, 255, 1);
    box-shadow:
      0 0 16px rgba(100, 200, 255, 0.6),
      0 0 32px rgba(100, 200, 255, 0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-inner,
  .card.matched .card-front,
  .card.shaking .card-inner {
    animation: none;
    transition: none;
  }
  .card.hint-highlighted .card-inner::after,
  .card.tutorial-highlighted .card-inner::after {
    animation: none;
  }
}
</style>
