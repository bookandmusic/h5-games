<script setup lang="ts">
import { useRouter } from 'vue-router'

import type { Game } from '../types/game'

const props = defineProps<{
  game: Game
  index: number
}>()

const router = useRouter()

const neonGradients = [
  {
    bg: 'rgba(0, 255, 255, 0.1)',
    border: '#00ffff',
    glow: 'rgba(0, 255, 255, 0.4)',
    iconBg: 'linear-gradient(135deg, #00b8b8, #00ffff)',
  },
  {
    bg: 'rgba(255, 0, 255, 0.1)',
    border: '#ff00ff',
    glow: 'rgba(255, 0, 255, 0.4)',
    iconBg: 'linear-gradient(135deg, #b800b8, #ff00ff)',
  },
  {
    bg: 'rgba(99, 102, 241, 0.1)',
    border: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.4)',
    iconBg: 'linear-gradient(135deg, #4f46e5, #6366f1)',
  },
  {
    bg: 'rgba(255, 107, 157, 0.1)',
    border: '#ff6b9d',
    glow: 'rgba(255, 107, 157, 0.4)',
    iconBg: 'linear-gradient(135deg, #f472b6, #ff6b9d)',
  },
  {
    bg: 'rgba(191, 90, 242, 0.1)',
    border: '#bf5af2',
    glow: 'rgba(191, 90, 242, 0.4)',
    iconBg: 'linear-gradient(135deg, #9333ea, #bf5af2)',
  },
  {
    bg: 'rgba(0, 255, 136, 0.1)',
    border: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.4)',
    iconBg: 'linear-gradient(135deg, #10b981, #00ff88)',
  },
  {
    bg: 'rgba(255, 149, 0, 0.1)',
    border: '#ff9500',
    glow: 'rgba(255, 149, 0, 0.4)',
    iconBg: 'linear-gradient(135deg, #f59e0b, #ff9500)',
  },
  {
    bg: 'rgba(255, 45, 85, 0.1)',
    border: '#ff2d55',
    glow: 'rgba(255, 45, 85, 0.4)',
    iconBg: 'linear-gradient(135deg, #dc2626, #ff2d55)',
  },
]

const neonStyle = neonGradients[props.index % neonGradients.length]

const handleClick = () => {
  router.push(props.game.route)
}
</script>

<template>
  <div
    class="cyber-card"
    :style="{ '--neon-color': neonStyle.border, '--neon-glow': neonStyle.glow }"
    @click="handleClick"
  >
    <div class="cyber-card-inner">
      <div class="cyber-card-glow"></div>

      <div class="cyber-app-icon-wrapper">
        <div
          class="cyber-app-icon"
          :style="{ background: game.icon ? 'transparent' : neonStyle.iconBg }"
        >
          <img v-if="game.icon" :src="game.icon" :alt="game.name" class="cyber-app-icon-img" />
          <span v-else class="cyber-app-icon-text">{{ game.name.slice(0, 2) }}</span>
        </div>
        <div class="cyber-icon-glow"></div>
      </div>

      <div class="cyber-card-info">
        <h3 class="cyber-card-title">{{ game.name }}</h3>
        <div class="cyber-card-meta">
          <span class="cyber-card-category">{{ game.category }}</span>
          <span class="cyber-card-badge">PLAY</span>
        </div>
        <p class="cyber-card-desc">{{ game.description }}</p>
      </div>
    </div>

    <div class="cyber-card-border"></div>
  </div>
</template>

<style scoped>
.cyber-card {
  position: relative;
  border-radius: var(--ios-radius-lg);
  cursor: pointer;
  overflow: hidden;
  transition: all var(--ios-duration-fast) var(--ios-ease);
}

.cyber-card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--ios-glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: var(--ios-radius-lg);
}

.cyber-card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, var(--neon-glow) 0%, transparent 50%);
  opacity: 0;
  transition: opacity var(--ios-duration-normal) var(--ios-ease);
  pointer-events: none;
}

.cyber-card:hover .cyber-card-glow {
  opacity: 0.3;
}

.cyber-card:active {
  transform: scale(0.98);
}

.cyber-card:active .cyber-card-glow {
  opacity: 0.5;
}

.cyber-card-border {
  position: absolute;
  inset: 0;
  border-radius: var(--ios-radius-lg);
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--neon-color),
    rgba(255, 255, 255, 0.1),
    var(--neon-color)
  );
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: xor;
  -webkit-mask-composite: xor;
  pointer-events: none;
  z-index: 2;
}

.cyber-card:hover .cyber-card-border {
  background: linear-gradient(135deg, var(--neon-color), var(--neon-color));
  box-shadow:
    0 0 15px var(--neon-glow),
    inset 0 0 15px var(--neon-glow);
}

.cyber-app-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.cyber-app-icon {
  width: 68px;
  height: 68px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.cyber-app-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.cyber-icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: var(--neon-color);
  opacity: 0;
  filter: blur(12px);
  transition: opacity var(--ios-duration-normal) var(--ios-ease);
  pointer-events: none;
}

.cyber-card:hover .cyber-icon-glow {
  opacity: 0.4;
}

.cyber-app-icon-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.cyber-app-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}

.cyber-card-info {
  flex: 1;
  min-width: 0;
}

.cyber-card-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}

.cyber-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.cyber-card-category {
  font-size: 13px;
  color: var(--neon-color);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.cyber-card-badge {
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--neon-color);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--neon-color);
  letter-spacing: 1px;
}

.cyber-card-desc {
  font-size: 13px;
  color: var(--ios-text-tertiary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
</style>
