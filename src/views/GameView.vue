<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, type Component } from 'vue'

import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const gameId = computed(() => route.params.id as string)

const gameComponents: Record<string, Component> = {
  '2048': defineAsyncComponent(() => import('../games/game2048/index.vue')),
}

const GameComponent = computed(() => {
  if (!gameId.value) return null
  return gameComponents[gameId.value] || null
})

// 返回首页
const goBack = () => {
  router.push('/')
}

// 监听浏览器返回事件，如果没有游戏则返回首页
const handlePopState = () => {
  if (!GameComponent.value) {
    router.push('/')
  }
}

onMounted(() => {
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})

// 如果游戏不存在，自动返回首页
if (!GameComponent.value && gameId.value) {
  router.replace('/')
}
</script>

<template>
  <div class="ios-game-page">
    <!-- iOS 导航栏 - 固定 -->
    <header class="ios-game-header">
      <button class="ios-back-btn" @click="goBack">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="ios-back-text">返回</span>
      </button>
    </header>

    <!-- 游戏内容 - 全屏 -->
    <main class="ios-game-content">
      <component :is="GameComponent" v-if="GameComponent" />

      <!-- 游戏不存在 -->
      <div v-else class="ios-empty-page">
        <div class="ios-empty-icon-large">
          <svg
            class="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p class="ios-empty-title-large">游戏不存在</p>
        <p class="ios-empty-subtitle-large">请返回首页重新选择</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ios-game-page {
  height: 100vh;
  background: var(--ios-surface);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* iOS 导航栏 */
.ios-game-header {
  flex-shrink: 0;
  background: var(--ios-header-bg);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
  display: flex;
  align-items: center;
}

.ios-back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  padding: 8px 12px;
  margin-left: -8px;
  color: var(--ios-primary);
  font-size: 17px;
  cursor: pointer;
  transition: opacity 150ms var(--ios-ease);
}

.ios-back-btn:active {
  opacity: 0.6;
}

.ios-back-text {
  font-weight: 500;
}

/* 游戏内容区域 */
.ios-game-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ios-empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
}

.ios-empty-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: var(--ios-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.ios-empty-title-large {
  font-size: 22px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin-bottom: 8px;
}

.ios-empty-subtitle-large {
  font-size: 15px;
  color: var(--ios-text-secondary);
}
</style>
