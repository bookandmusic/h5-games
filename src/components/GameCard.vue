<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Game } from '../types/game'

const props = defineProps<{ game: Game }>()

const router = useRouter()

const categoryColors: Record<string, string> = {
  益智: '#6366f1',
  棋类: '#f59e0b',
}
const badgeColor = categoryColors[props.game.category] || '#a78bfa'

const handleClick = () => {
  router.push(props.game.route)
}
</script>

<template>
  <button
    class="game-card"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="card-scene">
      <div class="icon-area">
        <img v-if="game.icon" :src="game.icon" :alt="game.name" class="icon-img" />
        <span v-else class="icon-fallback">{{ game.name.slice(0, 1) }}</span>
      </div>
      <div class="tray"></div>
      <span class="badge" :style="{ background: badgeColor }">{{ game.category }}</span>
    </div>
    <div class="card-name">{{ game.name }}</div>
  </button>
</template>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease);
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  width: 100%;
  text-align: center;
}

.game-card:active {
  transform: scale(0.94);
}

.card-scene {
  width: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-area {
  width: 60%;
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;
  margin-top: 10%;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 3px 10px rgba(61, 46, 92, 0.15));
}

.icon-fallback {
  font-family: 'Orbitron', sans-serif;
  font-size: 40px;
  font-weight: 700;
  color: var(--accent);
  opacity: 0.3;
}

.tray {
  position: absolute;
  bottom: 12%;
  width: 78%;
  height: 28%;
  background: linear-gradient(165deg, var(--wood-light) 0%, var(--wood) 50%, var(--wood-dark) 100%);
  border-radius: 30px / 16px;
  box-shadow:
    0 3px 10px rgba(61, 46, 92, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  z-index: 1;
}

.tray::before {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 22px / 10px;
  background: rgba(255, 255, 255, 0.1);
}

.badge {
  position: absolute;
  bottom: 6%;
  padding: 2px 12px;
  border-radius: 0 0 10px 10px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  z-index: 3;
  white-space: nowrap;
}

.card-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
  text-align: center;
}
</style>
