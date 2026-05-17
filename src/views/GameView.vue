<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  h,
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
  type Component,
} from 'vue'

import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import gamesData from '../data/games.json'
import { useGameRouteLifecycle } from '../composables/useGameRouteLifecycle'
import { useBackButton } from '../composables/useBackButton'

const router = useRouter()
const route = useRoute()
const { runLeaveGuard, runGameCleanups } = useGameRouteLifecycle()

const gameId = computed(() => route.params.id as string)
const isPlay = computed(() => route.path.includes('/play'))
const gameDir = computed(() => {
  const game = gamesData.find((g) => g.id === gameId.value)
  return game?.dir || gameId.value
})

const gameIndexModules = import.meta.glob('../games/*/index.vue')
const gameHomeModules = import.meta.glob('../games/*/Home.vue')

function getGameLoader(): (() => Promise<{ default: Component }>) | undefined {
  const dir = gameDir.value
  if (isPlay.value) {
    return gameIndexModules[`../games/${dir}/index.vue`] as
      | (() => Promise<{ default: Component }>)
      | undefined
  }
  const homeLoader = gameHomeModules[`../games/${dir}/Home.vue`] as
    | (() => Promise<{ default: Component }>)
    | undefined
  return (
    homeLoader ||
    (gameIndexModules[`../games/${dir}/index.vue`] as
      | (() => Promise<{ default: Component }>)
      | undefined)
  )
}

const LoadingFallback = {
  render() {
    return h('div', { class: 'game-loading' }, [
      h('div', { class: 'game-loading-spinner' }),
      h('p', { class: 'game-loading-text' }, '加载中...'),
    ])
  },
}

const ErrorFallback = {
  props: ['error'],
  render() {
    return h('div', { class: 'game-error-state' }, [
      h('p', { class: 'game-error-title' }, '游戏加载失败'),
      h('button', { class: 'game-error-back-btn', onClick: () => router.replace('/') }, '返回首页'),
    ])
  },
}

const GameComponent = shallowRef<Component | null>(null)

function loadGameComponent() {
  if (!gameId.value) {
    GameComponent.value = null
    return
  }
  const loader = getGameLoader()
  if (!loader) {
    GameComponent.value = null
    return
  }
  GameComponent.value = defineAsyncComponent({
    loader,
    loadingComponent: LoadingFallback,
    errorComponent: ErrorFallback,
    delay: 200,
    timeout: 10000,
  })
}

loadGameComponent()

watch([gameId, isPlay], () => {
  loadGameComponent()
})

if (!GameComponent.value && gameId.value) {
  router.replace('/')
}

const { pushEntry } = useBackButton()

const handlePopState = () => {
  if (!GameComponent.value) {
    router.push('/')
  }
}

watch(gameId, (newId, oldId) => {
  if (oldId && oldId !== newId) {
    runGameCleanups(oldId)
  }
})

onMounted(() => {
  window.addEventListener('popstate', handlePopState)

  if (isPlay.value) {
    pushEntry({ page: 'game-play', gameId: gameId.value })
  } else {
    pushEntry({ page: 'game-home', gameId: gameId.value })
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})

onBeforeRouteLeave(async (to, from) => {
  const fromId = from.params.id as string
  if (!fromId) return true

  const isLeavingPlay = String(from.path).includes('/play') && !String(to.path).includes('/play')
  const isLeavingGameView = !String(to.path).startsWith(`/game/${fromId}`)

  if (isLeavingPlay) {
    const canLeave = await runLeaveGuard(fromId, from)
    if (!canLeave) return false
  }

  if (isLeavingGameView) {
    runGameCleanups(fromId)
  }

  return true
})
</script>

<template>
  <div class="game-shell">
    <main class="game-shell-content">
      <component :is="GameComponent" v-if="GameComponent" />

      <div v-else class="game-empty-state">
        <div class="game-empty-icon">
          <svg
            class="game-empty-icon-svg"
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
        <p class="game-empty-title">游戏未找到</p>
        <p class="game-empty-subtitle">请返回首页重新选择</p>
        <button class="game-empty-back-btn" @click="router.replace('/')">返回首页</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.game-shell {
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game-shell-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
  flex: 1;
}

.game-empty-icon {
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

.game-empty-icon-svg {
  width: 44px;
  height: 44px;
  color: rgba(255, 0, 255, 0.6);
}

.game-empty-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.game-empty-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.game-empty-back-btn {
  padding: 10px 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.game-empty-back-btn:active {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(0.96);
}

.game-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  padding: 60px 16px;
}

.game-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 0, 255, 0.15);
  border-top-color: rgba(255, 0, 255, 0.6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.game-loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.game-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  padding: 60px 16px;
}

.game-error-title {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.game-error-back-btn {
  padding: 10px 24px;
  border-radius: 12px;
  background: rgba(255, 0, 255, 0.1);
  border: 1px solid rgba(255, 0, 255, 0.25);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms ease;
}

.game-error-back-btn:active {
  transform: scale(0.96);
}
</style>
