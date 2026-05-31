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
  router.push({ name: props.game.routeName })
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
      <div class="crystal-pedestal"></div>
    </div>
    <div class="card-info">
      <span class="card-name">{{ game.name }}</span>
      <span class="badge" :style="{ background: badgeColor }">{{ game.category }}</span>
    </div>
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
}

.icon-area {
  width: 58%;
  height: 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;
  margin: 20% auto 0;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(61, 46, 92, 0.18));
}

.icon-fallback {
  font-family: 'Orbitron', sans-serif;
  font-size: 40px;
  font-weight: 700;
  color: var(--accent);
  opacity: 0.3;
}

.crystal-pedestal {
  position: absolute;
  bottom: 4%;
  left: 4%;
  width: 92%;
  height: 50%;
  z-index: 1;
  background: url('/assets/ui/pedestal.png') no-repeat center / 100% 100%;
}

.card-info {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0;
  width: 100%;
}

.card-name {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.badge {
  position: absolute;
  right: 0;
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
}
</style>
