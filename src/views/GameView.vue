<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, watch, type Component } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { musicManager } from '../games/chinese-chess/musicManager'

const router = useRouter()
const route = useRoute()

const gameId = computed(() => route.params.id as string)
const isPlay = computed(() => route.path.includes('/play'))
const isSettings = computed(() => route.path.includes('/settings'))

const homeComponents: Record<string, Component> = {
  'chinese-chess': defineAsyncComponent(() => import('../games/chinese-chess/Home.vue')),
}

const playComponents: Record<string, Component> = {
  '2048': defineAsyncComponent(() => import('../games/game2048/index.vue')),
  'chinese-chess': defineAsyncComponent(() => import('../games/chinese-chess/index.vue')),
}

const settingsComponents: Record<string, Component> = {
  '2048': defineAsyncComponent(() => import('../games/game2048/Settings.vue')),
  'chinese-chess': defineAsyncComponent(() => import('../games/chinese-chess/Settings.vue')),
}

let lastGameId: string | null = null

watch(
  gameId,
  (newId, oldId) => {
    if (oldId === 'chinese-chess' && newId !== 'chinese-chess') {
      musicManager.stop()
    }
    lastGameId = newId ?? null
  },
  { immediate: true }
)

const GameComponent = computed(() => {
  if (!gameId.value) return null
  if (isSettings.value) {
    return settingsComponents[gameId.value] || null
  }
  if (isPlay.value) {
    return playComponents[gameId.value] || null
  }
  if (homeComponents[gameId.value]) {
    return homeComponents[gameId.value]
  }
  return playComponents[gameId.value] || null
})

const pageTitle = computed(() => {
  if (isSettings.value) return 'SETTINGS'
  return ''
})

const goBack = () => {
  if (isSettings.value || isPlay.value) {
    router.push(`/game/${gameId.value}`)
  } else {
    router.push('/')
  }
}

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
  if (lastGameId === 'chinese-chess') {
    musicManager.stop()
  }
})

if (!GameComponent.value && gameId.value) {
  router.replace('/')
}
</script>

<template>
  <div class="cyber-game-page">
    <div class="cyber-bg-grid"></div>

    <header class="cyber-game-header">
      <button class="cyber-back-btn" @click="goBack">
        <div class="cyber-btn-glow"></div>
        <svg
          class="cyber-back-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="cyber-back-text">BACK</span>
      </button>
      <div v-if="pageTitle" class="cyber-header-title-wrapper">
        <span class="cyber-header-title">{{ pageTitle }}</span>
      </div>
      <div class="cyber-header-border"></div>
    </header>

    <main class="cyber-game-content">
      <component :is="GameComponent" v-if="GameComponent" />

      <div v-else class="cyber-empty-page">
        <div class="cyber-empty-icon-large">
          <svg
            class="cyber-empty-svg-large"
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
        <p class="cyber-empty-title-large">GAME NOT FOUND</p>
        <p class="cyber-empty-subtitle-large">请返回首页重新选择</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.cyber-game-page {
  height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #020203 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.cyber-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.cyber-game-header {
  flex-shrink: 0;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
}

.cyber-back-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.25);
  padding: 10px 18px;
  margin-left: -4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--ios-duration-fast) var(--ios-ease);
  overflow: hidden;
}

.cyber-btn-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle at center, rgba(0, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  filter: blur(12px);
  transition: opacity var(--ios-duration-normal) var(--ios-ease);
  pointer-events: none;
}

.cyber-back-btn:hover .cyber-btn-glow {
  opacity: 1;
}

.cyber-back-btn:hover {
  background: rgba(0, 255, 255, 0.12);
  border-color: rgba(0, 255, 255, 0.4);
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.2),
    inset 0 0 20px rgba(0, 255, 255, 0.05);
}

.cyber-back-btn:active {
  transform: scale(0.97);
  background: rgba(0, 255, 255, 0.15);
}

.cyber-back-btn:active .cyber-btn-glow {
  opacity: 1.5;
}

.cyber-back-icon {
  width: 18px;
  height: 18px;
  color: #00ffff;
  flex-shrink: 0;
}

.cyber-back-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #00ffff;
  letter-spacing: 1.5px;
}

.cyber-header-title-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

.cyber-header-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--ios-text-primary);
  letter-spacing: 2px;
}

.cyber-header-border {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.3),
    rgba(255, 0, 255, 0.2),
    transparent
  );
}

.cyber-game-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}

.cyber-empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 16px;
}

.cyber-empty-icon-large {
  width: 90px;
  height: 90px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 0, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  box-shadow: 0 0 40px rgba(255, 0, 255, 0.2);
}

.cyber-empty-svg-large {
  width: 44px;
  height: 44px;
  color: rgba(255, 0, 255, 0.6);
}

.cyber-empty-title-large {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.cyber-empty-subtitle-large {
  font-size: 15px;
  color: var(--ios-text-secondary);
}
</style>
