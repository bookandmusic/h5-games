<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import { THEMES, THEME_ORDER } from './themeConfig'
import { loadPlayerData } from './economy'
import { stopBgm } from './soundManager'
import { destroyCtx } from '../../utils/soundUtils'
import GameContainer from '../../components/GameContainer.vue'
import PlaneTuningPanel from './components/PlaneTuningPanel.vue'
import type { PlayerData, ThemeId, ThemeConfig } from './types'
import './game-theme.css'

const GAME_ID = 'star-chart-parallel-planes'
const UNLOCK_THRESHOLD = 6
const nav = useGameNavigation(GAME_ID)
const { registerCleanup } = useGameRouteLifecycle()
const playerData = ref<PlayerData | null>(null)
const nodeRefs: HTMLElement[] = []
const pathDefs = ref<string[]>([])
const svgView = ref('0 0 100 133.33')
const elMap = ref<HTMLElement | undefined>()

const showTuningPanel = ref(false)
const selectedPlanet = ref<ThemeConfig | null>(null)

let ro: ResizeObserver | undefined

function recalcPaths() {
  const map = elMap.value
  if (!map) return
  const mr = map.getBoundingClientRect()
  const w = mr.width
  const h = mr.height
  svgView.value = `0 0 ${w} ${h}`
  const centers: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const el = nodeRefs[i]
    if (!el) return
    const r = el.getBoundingClientRect()
    centers.push({ x: r.left - mr.left + r.width / 2, y: r.top - mr.top + r.height / 2 })
  }
  const paths: string[] = []
  for (let i = 0; i < centers.length - 1; i++) {
    const a = centers[i]
    const b = centers[i + 1]
    const mx = (a.x + b.x) / 2
    const cy1 = a.y + (b.y - a.y) * 0.2
    const cy2 = b.y - (b.y - a.y) * 0.2
    paths.push(
      `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${mx.toFixed(1)} ${cy1.toFixed(1)}, ${mx.toFixed(1)} ${cy2.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
    )
  }
  pathDefs.value = paths
}

onMounted(async () => {
  playerData.value = await loadPlayerData()
  await nextTick()
  recalcPaths()
  ro = new ResizeObserver(recalcPaths)
  if (elMap.value) ro.observe(elMap.value)
  registerCleanup(GAME_ID, () => {
    stopBgm()
    destroyCtx()
    ro?.disconnect()
  })
})

onUnmounted(() => {
  stopBgm()
  ro?.disconnect()
})

function collectedCount(themeId: string): number {
  const theme = THEMES.find((t) => t.id === themeId)
  if (!theme || !playerData.value) return 0
  return theme.characters.filter((c) => playerData.value!.unlockedCards.includes(c.id)).length
}

function getPlanetState(themeId: string): 'locked' | 'unlockable' | 'active' | 'complete' {
  const idx = THEME_ORDER.indexOf(themeId as ThemeId)
  if (idx === -1) return 'locked'
  if (idx === 0) {
    const count = collectedCount(themeId)
    return count >= 18 ? 'complete' : 'active'
  }
  const prevThemeId = THEME_ORDER[idx - 1]
  const prevCount = collectedCount(prevThemeId)
  if (prevCount < UNLOCK_THRESHOLD) return 'locked'
  const count = collectedCount(themeId)
  if (count === 0) return 'unlockable'
  if (count >= 18) return 'complete'
  return 'active'
}

const bgUrl = new URL('./assets/images/common/bg-home.png', import.meta.url).href

const NODE_POSITIONS = [
  { left: '12%', top: '12%' },
  { left: '52%', top: '18%' },
  { left: '6%', top: '44%' },
  { left: '64%', top: '38%' },
  { left: '18%', top: '70%' },
  { left: '60%', top: '76%' },
] as const

function onPlanetClick(theme: ThemeConfig) {
  const state = getPlanetState(theme.id)
  if (state === 'locked') return
  selectedPlanet.value = theme
  showTuningPanel.value = true
}

function handleStartPlay(difficulty: 'easy' | 'hard') {
  showTuningPanel.value = false
  const themeId = selectedPlanet.value?.id
  if (!themeId) return
  nav.goToPage('play', { query: { theme: themeId, difficulty } })
}

function handleCloseTuning() {
  showTuningPanel.value = false
  selectedPlanet.value = null
}

function goHome() {
  nav.goToHome()
}

function getPlanetIcon(themeId: string): string {
  return new URL(`./assets/images/${themeId}/icon.png`, import.meta.url).href
}
</script>

<template>
  <GameContainer :bg-image="bgUrl">
    <div ref="elMap" class="map star-page">
      <div class="map-top star-top-hud">
        <button class="uni-back-btn" @click="goHome" aria-label="返回">
          <svg viewBox="0 0 24 24" fill="currentColor" class="uni-back-arrow">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span>返回</span>
        </button>
      </div>

      <svg class="map-lines" :viewBox="svgView" preserveAspectRatio="none">
        <path
          v-for="d in pathDefs"
          :key="d"
          :d="d"
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          stroke-width="3"
          stroke-dasharray="6 4"
        />
      </svg>

      <div
        v-for="(themeId, i) in THEME_ORDER"
        :key="themeId"
        :ref="
          (el) => {
            if (el) nodeRefs[i] = el as HTMLElement
          }
        "
        class="node"
        :style="NODE_POSITIONS[i]"
      >
        <button
          class="planet-btn"
          :class="{
            'planet-locked': getPlanetState(themeId) === 'locked',
            'planet-unlockable': getPlanetState(themeId) === 'unlockable',
            'planet-complete': getPlanetState(themeId) === 'complete',
          }"
          :style="{ '--accent': THEMES[i].accentColor }"
          :aria-label="THEMES[i].name"
          @click="onPlanetClick(THEMES[i])"
        >
          <img :src="getPlanetIcon(themeId)" alt="" class="planet-img" draggable="false" />

          <div v-if="getPlanetState(themeId) === 'locked'" class="planet-lock-overlay">
            <svg
              class="lock-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div v-if="getPlanetState(themeId) === 'unlockable'" class="planet-pulse-ring" />

          <svg
            v-if="getPlanetState(themeId) === 'complete'"
            class="planet-progress-ring"
            viewBox="0 0 120 120"
          >
            <circle class="ring-fill ring-golden" cx="60" cy="60" r="54" />
          </svg>

          <div v-if="getPlanetState(themeId) === 'complete'" class="planet-complete-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="4,12 10,18 20,6" />
            </svg>
          </div>

          <span class="planet-glow" />
        </button>
        <span class="node-label">{{ THEMES[i].name }}</span>
        <span class="node-count">
          <template v-if="getPlanetState(themeId) === 'locked'">
            <svg class="lock-label-icon" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="7" width="12" height="7" rx="1.5" />
              <path
                d="M4.5 7V4.5a3.5 3.5 0 0 1 7 0v2.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            封印中
          </template>
          <template v-else-if="getPlanetState(themeId) === 'unlockable'"> 可唤醒 </template>
          <template v-else> {{ collectedCount(themeId) }}/18 </template>
        </span>
      </div>
    </div>

    <PlaneTuningPanel
      v-if="showTuningPanel && selectedPlanet && playerData"
      :theme="selectedPlanet"
      :player-data="playerData"
      :collected="collectedCount(selectedPlanet.id)"
      @close="handleCloseTuning"
      @start="handleStartPlay"
    />
  </GameContainer>
</template>

<style scoped>
.map {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.map-top {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(6px, 1cqh, 10px) clamp(8px, 2cqw, 14px);
  background: linear-gradient(180deg, rgba(8, 12, 35, 0.6), rgba(6, 10, 30, 0.5));
  border: 1px solid rgba(104, 184, 255, 0.12);
  border-radius: 16px 16px 0 0;
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(180, 220, 255, 0.08);
}

.uni-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: clamp(16px, 3.5cqw, 20px);
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  padding: 4px 6px;
}
.uni-back-btn:active {
  color: rgba(255, 255, 255, 0.95);
  transform: scale(0.95);
}
.uni-back-arrow {
  width: clamp(22px, 5cqw, 28px);
  height: clamp(22px, 5cqw, 28px);
  flex-shrink: 0;
  color: #ffffff;
}

.map-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.node {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.planet-btn {
  position: relative;
  width: clamp(120px, 35cqw, 180px);
  height: clamp(120px, 35cqw, 180px);
  border: none;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}
.planet-btn:active {
  transform: scale(0.92);
}

.planet-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  position: relative;
  z-index: 2;
  filter: none;
}

.planet-glow {
  display: none;
}

/* ── Locked state ── */
.planet-locked {
  cursor: default;
}
.planet-locked:active {
  transform: none;
}
.planet-locked .planet-img {
  filter: brightness(0.25) saturate(0.15);
}

.planet-lock-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.lock-icon {
  width: 30%;
  height: 30%;
  color: rgba(255, 215, 0, 0.4);
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.2));
}

/* ── Progress ring ── */
.planet-progress-ring {
  position: absolute;
  inset: -8%;
  width: calc(100% + 16%);
  height: calc(100% + 16%);
  z-index: 1;
  pointer-events: none;
  rotate: -90deg;
}

.ring-fill {
  fill: none;
  stroke: var(--accent, #4fc3f7);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.ring-golden {
  stroke: #ffd700;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
}

/* ── Complete state ── */
.planet-complete .planet-img {
  filter: none;
}

.planet-complete-mark {
  position: absolute;
  top: -4px;
  right: -4px;
  width: clamp(20px, 5cqw, 28px);
  height: clamp(20px, 5cqw, 28px);
  background: linear-gradient(135deg, #ffd700, #ffb300);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}
.planet-complete-mark svg {
  width: 60%;
  height: 60%;
  color: #3e2723;
}

/* ── Labels ── */
.node-label {
  font-size: clamp(12px, 3cqw, 15px);
  font-weight: 800;
  color: #fff;
  text-shadow: none;
  white-space: nowrap;
}
.node-count {
  font-size: clamp(10px, 2cqw, 12px);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  gap: 3px;
}

.lock-label-icon {
  width: 10px;
  height: 10px;
  color: rgba(255, 255, 255, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .planet-btn {
    transition: none;
  }
  .planet-pulse-ring {
    animation: none;
  }
  .ring-fill {
    transition: none;
  }
}
</style>
