<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, watch, type Component } from 'vue'

import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import { runChineseChessLeaveGuard } from '../games/chinese-chess/leaveGuard'
import { musicManager } from '../games/chinese-chess/musicManager'
import { settingsStore as game2048SettingsStore } from '../games/game2048/settingsStore'

const router = useRouter()
const route = useRoute()

const gameId = computed(() => route.params.id as string)
const isPlay = computed(() => route.path.includes('/play'))
const isSettings = computed(() => route.path.includes('/settings'))
const gameThemeClass = computed(() => {
  if (gameId.value === '2048') {
    return `theme-2048-${game2048SettingsStore.theme}`
  }
  const themeMap: Record<string, string> = {
    'chinese-chess': 'theme-chinese-chess',
  }
  return themeMap[gameId.value] || 'theme-cyber'
})

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
  const gameNames: Record<string, string> = {
    '2048': '2048',
    'chinese-chess': '中国象棋',
  }
  const baseTitle = gameNames[gameId.value] || ''
  if (!baseTitle) return ''
  if (isSettings.value) {
    return `${baseTitle} 设置`
  }
  return baseTitle
})

const shouldRunChineseChessLeaveGuard = () => {
  return gameId.value === 'chinese-chess' && isPlay.value
}

const shouldConfirmLeavingChineseChessPlay = (to: { path: string }, from: { path: string; params: Record<string, unknown> }) => {
  const fromId = typeof from.params.id === 'string' ? from.params.id : ''
  return fromId === 'chinese-chess' && String(from.path).includes('/play') && !String(to.path).includes('/play')
}

const goBack = async () => {
  if (isSettings.value || isPlay.value) {
    await router.push(`/game/${gameId.value}`)
  } else {
    await router.push('/')
  }
}

const handlePopState = () => {
  if (!GameComponent.value) {
    router.push('/')
  }
}

onMounted(() => {
  void game2048SettingsStore.load()
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
  if (lastGameId === 'chinese-chess') {
    musicManager.stop()
  }
})

onBeforeRouteLeave(async (_, from) => {
  const isLeavingChineseChessPlay =
    from.params.id === 'chinese-chess' && String(from.path).includes('/play')

  if (!isLeavingChineseChessPlay) {
    return true
  }

  if (!shouldRunChineseChessLeaveGuard()) {
    return true
  }

  return await runChineseChessLeaveGuard()
})

onBeforeRouteUpdate(async (to, from) => {
  if (!shouldConfirmLeavingChineseChessPlay(to, from)) {
    return true
  }

  return await runChineseChessLeaveGuard()
})

if (!GameComponent.value && gameId.value) {
  router.replace('/')
}
</script>

<template>
  <div class="cyber-game-page" :class="gameThemeClass">
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
  --game-page-bg: linear-gradient(180deg, #0a0a0f 0%, #020203 100%);
  --game-grid-line: rgba(0, 255, 255, 0.02);
  --game-grid-line-alt: rgba(0, 255, 255, 0.02);
  --game-header-bg: rgba(10, 10, 15, 0.85);
  --game-header-border: transparent;
  --game-back-bg: rgba(0, 255, 255, 0.08);
  --game-back-border: rgba(0, 255, 255, 0.25);
  --game-back-bg-hover: rgba(0, 255, 255, 0.12);
  --game-back-border-hover: rgba(0, 255, 255, 0.4);
  --game-back-bg-active: rgba(0, 255, 255, 0.15);
  --game-back-shadow-hover: 0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.05);
  --game-back-glow: radial-gradient(circle at center, rgba(0, 255, 255, 0.3) 0%, transparent 70%);
  --game-back-color: #00ffff;
  --game-title-color: var(--ios-text-primary);
  --game-header-divider: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.3),
    rgba(255, 0, 255, 0.2),
    transparent
  );
  --game-title-font: 'Orbitron', sans-serif;
  --game-back-font: 'Orbitron', sans-serif;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--game-page-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.cyber-game-page.theme-2048-default {
  --game-page-bg:
    radial-gradient(circle at top left, rgba(249, 168, 37, 0.16), transparent 24%),
    linear-gradient(180deg, #faf4ea 0%, #f1e5d3 100%);
  --game-grid-line: rgba(187, 129, 44, 0.04);
  --game-grid-line-alt: rgba(255, 255, 255, 0.12);
  --game-header-bg: rgba(252, 246, 236, 0.82);
  --game-header-border: rgba(187, 129, 44, 0.12);
  --game-back-bg: rgba(187, 129, 44, 0.12);
  --game-back-border: rgba(187, 129, 44, 0.2);
  --game-back-bg-hover: rgba(187, 129, 44, 0.16);
  --game-back-border-hover: rgba(187, 129, 44, 0.28);
  --game-back-bg-active: rgba(187, 129, 44, 0.2);
  --game-back-shadow-hover:
    0 10px 24px rgba(187, 129, 44, 0.14), inset 0 0 12px rgba(255, 255, 255, 0.3);
  --game-back-glow: radial-gradient(circle at center, rgba(249, 168, 37, 0.2) 0%, transparent 70%);
  --game-back-color: #7c5220;
  --game-title-color: #7c5220;
  --game-header-divider: linear-gradient(90deg, transparent, rgba(187, 129, 44, 0.26), transparent);
  --game-title-font: 'Trebuchet MS', 'Avenir Next', sans-serif;
  --game-back-font: 'Trebuchet MS', 'Avenir Next', sans-serif;
}

.cyber-game-page.theme-2048-energy {
  --game-page-bg:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.14), transparent 20%),
    radial-gradient(circle at top right, rgba(168, 85, 247, 0.16), transparent 24%),
    linear-gradient(180deg, #090b1b 0%, #120a25 55%, #090f1f 100%);
  --game-grid-line: rgba(34, 211, 238, 0.05);
  --game-grid-line-alt: rgba(139, 92, 246, 0.045);
  --game-header-bg: rgba(8, 13, 30, 0.78);
  --game-header-border: rgba(34, 211, 238, 0.16);
  --game-back-bg: rgba(34, 211, 238, 0.08);
  --game-back-border: rgba(34, 211, 238, 0.24);
  --game-back-bg-hover: rgba(34, 211, 238, 0.14);
  --game-back-border-hover: rgba(59, 130, 246, 0.34);
  --game-back-bg-active: rgba(34, 211, 238, 0.16);
  --game-back-shadow-hover:
    0 0 24px rgba(34, 211, 238, 0.16), inset 0 0 18px rgba(59, 130, 246, 0.08);
  --game-back-glow: radial-gradient(circle at center, rgba(34, 211, 238, 0.22) 0%, transparent 72%);
  --game-back-color: #67e8f9;
  --game-title-color: #a5f3fc;
  --game-header-divider: linear-gradient(
    90deg,
    transparent,
    rgba(34, 211, 238, 0.28),
    rgba(168, 85, 247, 0.22),
    transparent
  );
  --game-title-font: 'Orbitron', sans-serif;
  --game-back-font: 'Orbitron', sans-serif;
}

.cyber-game-page.theme-2048-deity {
  --game-page-bg:
    radial-gradient(circle at top, rgba(251, 191, 36, 0.12), transparent 18%),
    linear-gradient(180deg, #140f0c 0%, #1f1710 54%, #0f0a08 100%);
  --game-grid-line: rgba(245, 158, 11, 0.045);
  --game-grid-line-alt: rgba(253, 224, 71, 0.032);
  --game-header-bg: rgba(22, 16, 12, 0.82);
  --game-header-border: rgba(245, 158, 11, 0.14);
  --game-back-bg: rgba(245, 158, 11, 0.09);
  --game-back-border: rgba(245, 158, 11, 0.24);
  --game-back-bg-hover: rgba(245, 158, 11, 0.14);
  --game-back-border-hover: rgba(253, 224, 71, 0.32);
  --game-back-bg-active: rgba(245, 158, 11, 0.18);
  --game-back-shadow-hover:
    0 12px 28px rgba(0, 0, 0, 0.26), inset 0 0 16px rgba(251, 191, 36, 0.06);
  --game-back-glow: radial-gradient(circle at center, rgba(251, 191, 36, 0.2) 0%, transparent 72%);
  --game-back-color: #fde68a;
  --game-title-color: #fef3c7;
  --game-header-divider: linear-gradient(
    90deg,
    transparent,
    rgba(251, 191, 36, 0.26),
    rgba(253, 224, 71, 0.18),
    transparent
  );
  --game-title-font: 'Georgia', 'Noto Serif SC', serif;
  --game-back-font: 'Georgia', 'Noto Serif SC', serif;
}

.cyber-game-page.theme-chinese-chess {
  --game-page-bg:
    radial-gradient(circle at top, rgba(197, 48, 48, 0.12), transparent 22%),
    linear-gradient(180deg, #221512 0%, #120b08 100%);
  --game-grid-line: rgba(225, 181, 97, 0.05);
  --game-grid-line-alt: rgba(225, 181, 97, 0.04);
  --game-header-bg: rgba(34, 21, 18, 0.84);
  --game-header-border: rgba(225, 181, 97, 0.14);
  --game-back-bg: rgba(225, 181, 97, 0.08);
  --game-back-border: rgba(225, 181, 97, 0.22);
  --game-back-bg-hover: rgba(225, 181, 97, 0.12);
  --game-back-border-hover: rgba(225, 181, 97, 0.34);
  --game-back-bg-active: rgba(225, 181, 97, 0.16);
  --game-back-shadow-hover:
    0 12px 28px rgba(0, 0, 0, 0.28), inset 0 0 14px rgba(225, 181, 97, 0.08);
  --game-back-glow: radial-gradient(circle at center, rgba(225, 181, 97, 0.18) 0%, transparent 72%);
  --game-back-color: #e7c67a;
  --game-title-color: #f2dfb2;
  --game-header-divider: linear-gradient(90deg, transparent, rgba(225, 181, 97, 0.3), transparent);
  --game-title-font: 'Noto Serif SC', 'STSong', serif;
  --game-back-font: 'Noto Serif SC', 'STSong', serif;
}

.cyber-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--game-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--game-grid-line-alt) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.theme-2048-default .cyber-bg-grid {
  background-size: 40px 40px;
}

.cyber-game-header {
  flex-shrink: 0;
  background: var(--game-header-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
  min-height: 64px;
  border-bottom: 1px solid var(--game-header-border);
}

.cyber-back-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--game-back-bg);
  border: 1px solid var(--game-back-border);
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
  background: var(--game-back-glow);
  opacity: 0;
  filter: blur(12px);
  transition: opacity var(--ios-duration-normal) var(--ios-ease);
  pointer-events: none;
}

.cyber-back-btn:hover .cyber-btn-glow {
  opacity: 1;
}

.cyber-back-btn:hover {
  background: var(--game-back-bg-hover);
  border-color: var(--game-back-border-hover);
  box-shadow: var(--game-back-shadow-hover);
}

.cyber-back-btn:active {
  transform: scale(0.97);
  background: var(--game-back-bg-active);
}

.cyber-back-btn:active .cyber-btn-glow {
  opacity: 1.5;
}

.cyber-back-icon {
  width: 18px;
  height: 18px;
  color: var(--game-back-color);
  flex-shrink: 0;
}

.cyber-back-text {
  font-family: var(--game-back-font);
  font-size: 13px;
  font-weight: 600;
  color: var(--game-back-color);
  letter-spacing: 1.5px;
}

.cyber-header-title-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.cyber-header-title {
  font-family: var(--game-title-font);
  font-size: 16px;
  font-weight: 600;
  color: var(--game-title-color);
  letter-spacing: 2px;
  text-align: center;
}

.cyber-header-border {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--game-header-divider);
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

@media (max-width: 420px) {
  .cyber-game-header {
    padding: 10px 12px;
    padding-top: calc(env(safe-area-inset-top) + 10px);
  }

  .cyber-back-btn {
    padding: 9px 12px;
    gap: 8px;
  }

  .cyber-back-text {
    font-size: 12px;
    letter-spacing: 1px;
  }

  .cyber-header-title {
    font-size: 14px;
    letter-spacing: 1px;
  }
}
</style>
