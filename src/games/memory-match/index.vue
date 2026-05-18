<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { gameStorage } from '../../stores/gameStorage'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import { useGameNavigation } from '../../composables/useGameNavigation'
import type { Card, Difficulty, ThemeId, GamePhase, SavedData, BestScore } from './types'
import { DIFFICULTIES, THEMES, DEFAULT_DIFFICULTY, DEFAULT_THEME_ID } from './themeConfig'
import { generateDeck, formatTime, resetIdCounter } from './gameLogic'
import MemoryCard from './components/MemoryCard.vue'
import ResultOverlay from './components/ResultOverlay.vue'
import OptionsMenu from './components/OptionsMenu.vue'
import {
  playMatchSound,
  playMismatchSound,
  playBgm,
  stopBgm,
  loadCompletionAudio,
  playCompletionAudio,
  stopCompletionAudio,
} from './soundManager'

const GAME_ID = 'memory-match'
const route = useRoute()
const { registerCleanup } = useGameRouteLifecycle()
const nav = useGameNavigation(GAME_ID)
const topPanelUrl = new URL('./assets/images/top-panel.png', import.meta.url).href

const phase = ref<GamePhase>('playing')
const difficulty = ref<Difficulty>(DEFAULT_DIFFICULTY)
const themeId = ref<ThemeId>(DEFAULT_THEME_ID)
const cards = ref<Card[]>([])
const moves = ref(0)
const elapsed = ref(0)
const bestScores = ref<Partial<Record<Difficulty, BestScore>>>({})
const totalGames = ref(0)
const shakingIds = ref<Set<number>>(new Set())
const firstRevealTime = ref<number | null>(null)
const showOptions = ref(false)

let timerHandle: number | null = null

const currentTheme = computed(() => THEMES.find((t) => t.id === themeId.value)!)
const currentDifficulty = computed(() => DIFFICULTIES[difficulty.value])
const bgUrl = computed(
  () =>
    new URL(`./assets/images/themes/${currentTheme.value.backgroundImage}`, import.meta.url).href
)
const revealedCards = computed(() => cards.value.filter((c) => c.state === 'revealed'))
const matchedCount = computed(() => cards.value.filter((c) => c.state === 'matched').length)
const isAllMatched = computed(
  () => matchedCount.value === cards.value.length && cards.value.length > 0
)
const isLocked = computed(() => phase.value === 'checking')
const formattedTime = computed(() => formatTime(elapsed.value))
const currentBest = computed(() => bestScores.value[difficulty.value])
const matchedPairs = computed(() => Math.floor(matchedCount.value / 2))
const totalPairs = computed(() => currentDifficulty.value.pairs)
const gridRows = computed(() => Math.ceil(cards.value.length / currentDifficulty.value.cols) || 4)
const progressPercent = computed(() => {
  if (totalPairs.value === 0) return 0
  return Math.round((matchedPairs.value / totalPairs.value) * 100)
})

function getImageUrl(tid: ThemeId, name: string): string {
  return new URL(`./assets/images/${tid}/${name}.png`, import.meta.url).href
}

function getCardBackUrl(tid: ThemeId): string | undefined {
  const theme = THEMES.find((t) => t.id === tid)
  if (!theme?.cardBackImage) return undefined
  return new URL(`./assets/images/card-backs/${theme.cardBackImage}`, import.meta.url).href
}

function startTimer(): void {
  if (timerHandle !== null) return
  firstRevealTime.value = Date.now()
  timerHandle = window.setInterval(() => {
    elapsed.value = Math.floor((Date.now() - firstRevealTime.value!) / 1000)
  }, 200)
}

function stopTimer(): void {
  if (timerHandle !== null) {
    window.clearInterval(timerHandle)
    timerHandle = null
  }
}

function startGame(): void {
  resetIdCounter()
  const config = currentDifficulty.value
  cards.value = generateDeck(config.pairs, currentTheme.value.imageNames)
  moves.value = 0
  elapsed.value = 0
  shakingIds.value = new Set()
  firstRevealTime.value = null
  showOptions.value = false
  phase.value = 'playing'
  stopTimer()
  playBgm(themeId.value)
}

function flipCard(cardId: number): void {
  if (isLocked.value || phase.value !== 'playing') return

  const card = cards.value.find((c) => c.id === cardId)
  if (!card || card.state !== 'hidden') return

  if (revealedCards.value.length === 0 && firstRevealTime.value === null) {
    startTimer()
  }

  card.state = 'revealed'

  if (revealedCards.value.length === 2) {
    moves.value++
    phase.value = 'checking'
    checkMatch()
  }
}

function checkMatch(): void {
  const revealed = revealedCards.value
  const isMatch = revealed[0].patternId === revealed[1].patternId

  if (isMatch) {
    playMatchSound()
    window.setTimeout(() => {
      revealed[0].state = 'matched'
      revealed[1].state = 'matched'
      phase.value = 'playing'

      if (isAllMatched.value) {
        completeGame()
      }
    }, 500)
  } else {
    playMismatchSound()
    window.setTimeout(() => {
      shakingIds.value = new Set([revealed[0].id, revealed[1].id])
      window.setTimeout(() => {
        revealed[0].state = 'hidden'
        revealed[1].state = 'hidden'
        shakingIds.value = new Set()
        phase.value = 'playing'
      }, 600)
    }, 700)
  }
}

function completeGame(): void {
  stopTimer()
  stopBgm()
  loadCompletionAudio()
  window.setTimeout(() => playCompletionAudio(), 600)

  const prev = bestScores.value[difficulty.value]
  if (
    !prev ||
    elapsed.value < prev.time ||
    (elapsed.value === prev.time && moves.value < prev.moves)
  ) {
    bestScores.value[difficulty.value] = {
      time: elapsed.value,
      moves: moves.value,
      date: new Date().toISOString().slice(0, 10),
    }
  }

  totalGames.value++
  phase.value = 'completed'
  saveData()
}

async function saveData(): Promise<void> {
  const data: SavedData = {
    best: bestScores.value,
    stats: {
      totalGames: totalGames.value,
      lastTheme: themeId.value,
    },
  }
  await gameStorage.saveGameState(GAME_ID, data)
}

async function loadData(): Promise<void> {
  const saved = await gameStorage.loadGameState<SavedData>(GAME_ID)
  if (saved) {
    bestScores.value = saved.best || {}
    totalGames.value = saved.stats?.totalGames || 0
  }
}

function goHome(): void {
  stopTimer()
  stopBgm()
  nav.goToHome()
}

function handleOptionsRestart(): void {
  showOptions.value = false
  startGame()
}

function handleOptionsHome(): void {
  showOptions.value = false
  if (phase.value === 'completed') {
    nav.exitGame()
  } else {
    goHome()
  }
}

function initPlay(): void {
  const themeParam = route.query.theme as string | undefined
  const diffParam = route.query.difficulty as string | undefined

  if (themeParam && THEMES.some((t) => t.id === themeParam)) {
    themeId.value = themeParam as ThemeId
  }
  if (diffParam && Object.keys(DIFFICULTIES).includes(diffParam)) {
    difficulty.value = diffParam as Difficulty
  }

  loadData().then(() => {
    startGame()
  })
}

registerCleanup(GAME_ID, () => {
  stopTimer()
  stopBgm()
  stopCompletionAudio()
})

onMounted(() => {
  initPlay()
})

onUnmounted(() => {
  stopTimer()
  stopBgm()
  stopCompletionAudio()
})
</script>

<template>
  <div class="play-page" :style="{ backgroundImage: `url(${bgUrl})` }">
    <div v-if="showOptions" class="play-overlay" @click="showOptions = false" />
    <div class="play-inner" :style="{ aspectRatio: '3 / 4' }">
      <div class="play-screen">
        <div class="play-hud">
          <div class="hud-top">
            <div class="hud-side hud-side-left">
              <div class="timer-card">
                <span class="timer-value">{{ formattedTime }}</span>
              </div>
            </div>

            <div class="score-banner">
              <div class="panel-shell">
                <img :src="topPanelUrl" alt="" class="panel-bg" draggable="false" />
                <div class="panel-overlay">
                  <div class="panel-content">
                    <div class="panel-block">
                      <div class="panel-value">{{ currentDifficulty.label }}</div>
                    </div>
                    <div class="panel-divider" aria-hidden="true" />
                    <div class="panel-block">
                      <div class="panel-value">{{ matchedPairs }}/{{ totalPairs }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="panel-subline">
                <span>翻牌 {{ moves }} 次</span>
                <span>完成度 {{ progressPercent }}%</span>
              </div>
            </div>

            <div class="hud-side hud-right-tools">
              <button class="hud-btn btn-pause" @click="showOptions = true" aria-label="暂停菜单">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="7" y="5" width="3.5" height="14" rx="1.5" />
                  <rect x="13.5" y="5" width="3.5" height="14" rx="1.5" />
                </svg>
              </button>
            </div>
          </div>

          <div class="progress-track" aria-hidden="true">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
            </div>
          </div>
        </div>

        <div class="grid-wrapper">
          <div
            class="card-grid"
            :style="{
              gridTemplateColumns: `repeat(${currentDifficulty.cols}, 1fr)`,
              aspectRatio: `${currentDifficulty.cols} / ${gridRows}`,
            }"
          >
            <MemoryCard
              v-for="card in cards"
              :key="card.id"
              :image-url="getImageUrl(themeId, card.imageName)"
              :card-back-url="getCardBackUrl(themeId)"
              :card-back-fallback="currentTheme.cardBackFallback"
              :is-revealed="card.state !== 'hidden'"
              :is-matched="card.state === 'matched'"
              :shaking="shakingIds.has(card.id)"
              :accent-color="currentTheme.accentColor"
              @flip="flipCard(card.id)"
            />
          </div>
        </div>
      </div>

      <OptionsMenu
        v-if="showOptions"
        mode="playing"
        @close="showOptions = false"
        @restart="handleOptionsRestart"
        @home="handleOptionsHome"
      />

      <ResultOverlay
        :visible="phase === 'completed'"
        :moves="moves"
        :time="elapsed"
        :best="currentBest"
        @restart="startGame"
        @home="goHome"
      />
    </div>
  </div>
</template>

<style scoped>
.play-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(26, 54, 44, 0.52);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.play-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
  width: 100%;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.play-inner {
  container-type: inline-size;
  container-name: game;
  height: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: relative;
}

.play-screen {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.6cqh, 20px);
  padding: 0 clamp(12px, 3cqw, 28px) clamp(12px, 4cqh, 60px);
  padding-top: max(clamp(8px, 1.6cqh, 18px), env(safe-area-inset-top));
  flex: 1;
  position: relative;
  min-height: 0;
}

.play-hud {
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.2cqh, 14px);
  flex-shrink: 0;
}

.hud-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(6px, 1.2cqw, 10px);
  min-height: clamp(80px, 16cqh, 120px);
}

.hud-side {
  display: flex;
  flex-shrink: 0;
}

.hud-side-left {
  justify-content: flex-start;
  align-items: center;
}

.timer-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(6px, 1.2cqh, 12px) clamp(12px, 2.5cqw, 22px);
  border-radius: clamp(10px, 2cqw, 16px);
  background: linear-gradient(180deg, rgba(255, 247, 224, 0.96), rgba(250, 224, 180, 0.94));
  border: 2px solid rgba(155, 93, 43, 0.34);
  box-shadow:
    0 5px 0 rgba(138, 82, 31, 0.9),
    0 10px 18px rgba(63, 91, 58, 0.16),
    inset 0 2px 0 rgba(255, 255, 255, 0.8);
}

.timer-value {
  display: block;
  font-size: clamp(18px, 3.5cqw, 24px);
  font-weight: 900;
  color: #8f5323;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.65);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  white-space: nowrap;
}

.panel-value {
  font-size: clamp(16px, 4cqw, 32px);
}

.panel-divider {
  width: 2px;
  height: min(58px, 100%);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(236, 178, 98, 0),
    rgba(236, 178, 98, 0.9),
    rgba(236, 178, 98, 0)
  );
}

.panel-subline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 1.4em;
  width: min(100%, 380px);
  margin-top: -5px;
  font-size: clamp(9px, 2cqw, 14px);
  font-weight: 800;
  letter-spacing: 0.4px;
  color: #ffffff;
  padding-inline: clamp(8px, 1.4cqw, 18px);
  text-shadow: 0 2px 8px rgba(26, 58, 43, 0.22);
}

.panel-subline span {
  min-width: 0;
  white-space: nowrap;
}

.score-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.panel-shell {
  position: relative;
  display: inline-block;
  width: min(100%, 380px);
}

.panel-bg {
  display: block;
  width: 100%;
  height: auto;
}

.panel-overlay {
  position: absolute;
  top: 6%;
  right: 15%;
  bottom: 24%;
  left: 15%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 3cqw, 20px);
  width: 100%;
}

.panel-block {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.panel-subline span {
  min-width: 0;
  white-space: nowrap;
}

.hud-right-tools {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hud-btn {
  width: clamp(36px, 7cqw, 44px);
  height: clamp(36px, 7cqw, 44px);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.hud-btn svg {
  width: 100%;
  height: 100%;
}

.btn-pause {
  background:
    radial-gradient(
      circle at 32% 28%,
      rgba(255, 250, 231, 0.92) 0%,
      rgba(255, 250, 231, 0.18) 32%,
      transparent 36%
    ),
    linear-gradient(180deg, #fff5db 0%, #ffe2a9 100%);
  color: #9a4f12;
  border: 3px solid #d4a574;
  box-shadow:
    inset 0 -3px 0 rgba(255, 255, 255, 0.08),
    inset 0 3px 6px rgba(0, 0, 0, 0.22),
    0 4px 0 #815125,
    0 8px 14px rgba(30, 50, 40, 0.22);
}

.btn-pause:active {
  transform: translateY(2px) scale(0.94);
  box-shadow:
    inset 0 -2px 0 rgba(255, 255, 255, 0.06),
    inset 0 2px 4px rgba(0, 0, 0, 0.18),
    0 2px 0 #815125,
    0 4px 8px rgba(30, 50, 40, 0.16);
}

.progress-track {
  width: min(100%, 700px);
  margin: 0 auto;
  padding: 0 10px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(105, 58, 26, 0.58), rgba(77, 42, 17, 0.44)), rgba(80, 45, 20, 0.35);
  border: 2px solid rgba(255, 238, 197, 0.28);
  overflow: hidden;
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.25),
    0 2px 0 rgba(255, 255, 255, 0.08);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #76ff03, #64dd17);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.4),
    0 0 12px rgba(118, 255, 3, 0.5);
  transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.card-grid {
  display: grid;
  gap: clamp(8px, 2cqw, 22px);
  width: 100%;
  max-width: min(100%, 620px);
  max-height: 100%;
}

@container game (max-width: 500px) {
  .play-screen {
    padding-left: 10px;
    padding-right: 10px;
  }

  .panel-content {
    gap: 6px;
  }

  .panel-overlay {
    right: 18%;
    left: 18%;
  }

  .panel-subline {
    font-size: 10px;
    gap: 8px;
    width: min(100%, 260px);
    margin-top: -4px;
    padding-inline: 6px;
  }

  .hud-btn {
    padding: 8px;
  }

  .card-grid {
    gap: clamp(6px, 1.8cqw, 12px);
  }
}

@container game (max-width: 400px) {
  .card-grid {
    gap: 6px;
  }
}

@container game (min-width: 600px) {
  .play-screen {
    padding-left: 36px;
    padding-right: 36px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hud-btn,
  .progress-fill {
    transition: none;
  }
}
</style>
