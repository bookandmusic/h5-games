<script setup lang="ts">
import { useRouter } from 'vue-router'

import type { Game } from '../types/game'

const props = defineProps<{
  game: Game
  index: number
}>()

const router = useRouter()

// iOS App Store 风格渐变色数组 - 基于索引循环使用
const gradients = [
  { iconBg: 'linear-gradient(135deg, #FF9500, #FFCC00)' }, // 0 - 橙黄色
  { iconBg: 'linear-gradient(135deg, #007AFF, #5856D6)' }, // 1 - 蓝紫色
  { iconBg: 'linear-gradient(135deg, #34C759, #30D158)' }, // 2 - 绿色
  { iconBg: 'linear-gradient(135deg, #FF2D55, #FF375F)' }, // 3 - 粉红色
  { iconBg: 'linear-gradient(135deg, #AF52DE, #BF5AF2)' }, // 4 - 紫色
  { iconBg: 'linear-gradient(135deg, #32D74B, #34C759)' }, // 5 - 青绿色
  { iconBg: 'linear-gradient(135deg, #64D2FF, #007AFF)' }, // 6 - 天蓝色
  { iconBg: 'linear-gradient(135deg, #FF3B30, #FF9500)' }, // 7 - 红橙色
  { iconBg: 'linear-gradient(135deg, #7C3AED, #F43F5E)' }, // 8 - 紫玫瑰
  { iconBg: 'linear-gradient(135deg, #00C7BE, #32D74B)' }, // 9 - 青色
  { iconBg: 'linear-gradient(135deg, #FFD60A, #FFCC00)' }, // 10 - 金黄色
  { iconBg: 'linear-gradient(135deg, #5E5CE6, #BF5AF2)' }, // 11 - 深紫色
]

// 根据索引获取渐变，循环使用
const gradient = gradients[props.index % gradients.length]

const handleClick = () => {
  router.push(props.game.route)
}
</script>

<template>
  <div class="ios-game-card" @click="handleClick">
    <div class="ios-card-inner">
      <!-- 游戏图标 -->
      <div class="ios-app-icon-wrapper">
        <div
          class="ios-app-icon-large"
          :style="{ background: game.icon ? 'transparent' : gradient.iconBg }"
        >
          <img v-if="game.icon" :src="game.icon" :alt="game.name" class="ios-app-icon-img" />
          <span v-else class="ios-app-icon-text">{{ game.name.slice(0, 2) }}</span>
        </div>
      </div>

      <!-- 游戏信息 -->
      <div class="ios-card-info">
        <h3 class="ios-card-title">{{ game.name }}</h3>
        <p class="ios-card-subtitle">{{ game.category }}</p>
        <p class="ios-card-desc">{{ game.description }}</p>
      </div>

      <!-- iOS 获取按钮 -->
      <div class="ios-card-action">
        <button class="ios-get-button">获取</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ios-game-card {
  background: var(--ios-surface);
  border-radius: var(--ios-radius-md);
  padding: 12px;
  cursor: pointer;
  transition: transform 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

.ios-game-card:active {
  transform: scale(0.97);
}

.ios-card-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ios-app-icon-wrapper {
  flex-shrink: 0;
}

.ios-app-icon-large {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ios-app-icon-text {
  font-size: 22px;
  font-weight: 700;
  color: white;
}

.ios-app-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}

.ios-card-info {
  flex: 1;
  min-width: 0;
}

.ios-card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ios-card-subtitle {
  font-size: 14px;
  color: var(--ios-text-secondary);
  margin: 0 0 4px;
}

.ios-card-desc {
  font-size: 12px;
  color: var(--ios-text-tertiary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ios-card-action {
  flex-shrink: 0;
}

.ios-get-button {
  min-width: 64px;
  padding: 6px 12px;
  background: var(--ios-primary);
  color: white;
  border-radius: var(--ios-radius-md);
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

.ios-get-button:active {
  transform: scale(0.95);
}
</style>
