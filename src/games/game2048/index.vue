<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { gameStorage } from '../../stores/gameStorage'
import { canMove, createEmptyGrid, getMaxCellValue, moveGrid, spawnRandomCell } from './gameLogic'
import { settingsStore } from './settingsStore'
import { getTheme } from './themes'
import type { GameCell, GameState, GameStatus, GameTheme, MoveDirection, StoredCell } from './types'

const GAME_ID = '2048'
let cellIdCounter = 0
const preloadedIconSources = new Set<string>()

const router = useRouter()

const grid = ref<GameCell[][]>([])
const score = ref(0)
const bestScore = ref(0)
const gameStatus = ref<GameStatus>('playing')
const settingsLoaded = ref(false)

const theme = computed(() => getTheme(settingsStore.theme))
const difficulty = computed(() => settingsStore.difficulty)
const nextCellId = () => cellIdCounter++

const getCellTheme = (value: number) => theme.value.cellThemes[value] || theme.value.cellThemes[0]

const getIconSrc = (value: number): string | undefined => {
  if (!theme.value.useIcons || !theme.value.iconMap) return undefined
  return theme.value.iconMap[value]
}

const preloadThemeIcons = (themeToLoad: GameTheme) => {
  if (!themeToLoad.useIcons || !themeToLoad.iconMap || typeof window === 'undefined') return

  Object.values(themeToLoad.iconMap).forEach((src) => {
    if (preloadedIconSources.has(src)) return
    preloadedIconSources.add(src)

    const image = new window.Image()
    image.decoding = 'async'
    image.loading = 'eager'
    image.src = src
  })
}

const restoreFromStorage = async () => {
  await settingsStore.load()
  settingsLoaded.value = true
  preloadThemeIcons(theme.value)

  const state = await gameStorage.loadGameState(GAME_ID)
  if (state) {
    const savedState = state as GameState
    grid.value = savedState.grid.map((row: StoredCell[]) =>
      row.map((cell: StoredCell) => ({ value: cell.value, id: nextCellId() }))
    )
    score.value = savedState.score
    bestScore.value = savedState.bestScore
    gameStatus.value = savedState.gameStatus
  } else {
    await initGrid()
  }
}

const saveToStorage = async () => {
  const storedGrid: StoredCell[][] = grid.value.map((row) =>
    row.map((cell) => ({ value: cell.value }))
  )
  const state: GameState = {
    grid: storedGrid,
    score: score.value,
    bestScore: bestScore.value,
    gameStatus: gameStatus.value,
  }
  await gameStorage.saveGameState(GAME_ID, state)
}

const addRandomCell = () => {
  grid.value = spawnRandomCell(grid.value, difficulty.value, nextCellId)
}

const updateScore = () => {
  score.value = getMaxCellValue(grid.value)
  if (score.value > bestScore.value) bestScore.value = score.value
}

const checkLose = () => {
  if (!canMove(grid.value)) gameStatus.value = 'lost'
}

const initGrid = async () => {
  grid.value = createEmptyGrid(nextCellId)
  addRandomCell()
  addRandomCell()
  updateScore()
  gameStatus.value = 'playing'
  await saveToStorage()
}

const move = (dir: MoveDirection) => {
  if (gameStatus.value !== 'playing') return false

  const result = moveGrid(grid.value, dir, nextCellId)
  if (!result.moved) return false

  grid.value = spawnRandomCell(result.grid, difficulty.value, nextCellId)
  updateScore()

  if (result.reached2048) {
    gameStatus.value = 'won'
  } else {
    checkLose()
  }

  void saveToStorage()
  return true
}

const handleKey = (e: KeyboardEvent) => {
  const map: Record<string, MoveDirection> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  }
  if (map[e.key]) {
    e.preventDefault()
    move(map[e.key])
  }
}

let startX = 0
let startY = 0

const onTouchStart = (e: TouchEvent) => {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}

const onTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0].clientX - startX
  const dy = e.changedTouches[0].clientY - startY

  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return

  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
}

const goToSettings = () => {
  router.push('/game/2048/settings')
}

watch(gameStatus, (newStatus) => {
  if (newStatus !== 'playing') {
    void saveToStorage()
  }
})

watch(
  () => theme.value.name,
  () => {
    preloadThemeIcons(theme.value)
  },
  { immediate: true }
)

onMounted(async () => {
  await restoreFromStorage()
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => window.removeEventListener('keydown', handleKey))
</script>
<template>
  <div
    v-if="settingsLoaded"
    class="game-container"
    :class="[
      theme.containerBg,
      theme.name === 'energy' ? 'energy-theme' : '',
      theme.name === 'deity' ? 'deity-theme' : '',
    ]"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="game-content-shell">
      <header class="game-header">
        <h2 class="game-title" :class="theme.titleColor">2048</h2>
        <button
          class="settings-btn"
          :class="theme.name === 'energy' ? 'energy-settings-btn' : ''"
          @click="goToSettings"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      <div class="score-group">
        <div
          class="score-card"
          :class="theme.name === 'deity' ? 'deity-score-card' : ''"
          :style="
            theme.name === 'energy'
              ? { background: 'linear-gradient(to right, #06b6d4, #2563eb)' }
              : {}
          "
        >
          <div
            class="score-label"
            :class="
              theme.name === 'energy'
                ? 'text-white'
                : theme.name === 'deity'
                  ? 'deity-score-label'
                  : theme.labelColor
            "
          >
            分数
          </div>
          <div
            class="score-value"
            :class="
              theme.name === 'energy'
                ? 'text-white'
                : theme.name === 'deity'
                  ? 'deity-score-value'
                  : theme.textColor
            "
          >
            {{ score }}
          </div>
        </div>
        <div
          class="score-card"
          :class="[
            theme.name === 'deity' ? 'deity-score-card' : '',
            theme.name !== 'energy' ? 'score-best' : '',
          ]"
          :style="
            theme.name === 'energy'
              ? { background: 'linear-gradient(to right, #06b6d4, #2563eb)' }
              : {}
          "
        >
          <div
            class="score-label"
            :class="
              theme.name === 'energy'
                ? 'text-white'
                : theme.name === 'deity'
                  ? 'deity-score-label'
                  : theme.labelColor
            "
          >
            最高
          </div>
          <div
            class="score-value"
            :class="
              theme.name === 'energy'
                ? 'text-white'
                : theme.name === 'deity'
                  ? 'deity-score-value'
                  : theme.textColor
            "
          >
            {{ bestScore }}
          </div>
        </div>
        <button
          class="new-game-btn"
          :class="[
            theme.buttonBg,
            theme.buttonTextColor,
            theme.name === 'energy' ? 'energy-action-btn' : '',
            theme.name === 'deity' ? 'deity-action-btn' : '',
          ]"
          @click="initGrid"
        >
          新游戏
        </button>
      </div>

      <div class="main-area">
        <div class="grid-wrapper">
          <div
            class="grid-container"
            :class="[theme.gridBg, theme.gridBorder, theme.name === 'deity' ? 'deity-grid' : '']"
          >
            <div class="grid-inner">
              <div
                v-for="cell in grid.flat()"
                :key="cell.id"
                class="cell"
                :class="[
                  getCellTheme(cell.value).bg,
                  getCellTheme(cell.value).text,
                  theme.name === 'energy' && cell.value ? 'cell-glow' : '',
                  theme.name === 'deity' ? 'deity-cell' : '',
                  theme.name === 'deity' && !cell.value ? 'deity-empty-cell' : '',
                ]"
                :style="
                  theme.name === 'energy' && cell.value
                    ? { '--glow-color': getCellTheme(cell.value).glow }
                    : {}
                "
              >
                <img
                  v-if="theme.useIcons && cell.value && getIconSrc(cell.value)"
                  :src="getIconSrc(cell.value)!"
                  :alt="String(cell.value)"
                  class="cell-icon"
                  loading="eager"
                  decoding="async"
                  draggable="false"
                />
                <span v-else-if="cell.value" class="cell-num">{{ cell.value }}</span>
              </div>
            </div>
          </div>
        </div>
        <p class="hint" :class="[theme.labelColor, theme.name === 'deity' ? 'deity-hint' : '']">
          滑动或使用方向键移动方块
        </p>
      </div>
    </div>

    <div v-if="gameStatus !== 'playing'" class="modal-overlay">
      <div class="modal-card" :class="theme.name === 'deity' ? 'deity-modal-card' : ''">
        <div
          class="modal-icon"
          :class="[
            { 'modal-won': gameStatus === 'won', 'modal-lost': gameStatus === 'lost' },
            theme.name === 'deity' ? 'deity-modal-icon' : '',
          ]"
        >
          {{ gameStatus === 'won' ? '🎉' : '💀' }}
        </div>
        <h3 class="modal-title">{{ gameStatus === 'won' ? '恭喜获胜!' : '游戏结束' }}</h3>
        <p class="modal-score">得分: {{ score }}</p>
        <button
          class="modal-btn"
          :class="[
            theme.buttonBg,
            theme.buttonTextColor,
            theme.name === 'energy' ? 'energy-action-btn' : '',
            theme.name === 'deity' ? 'deity-action-btn' : '',
          ]"
          @click="initGrid"
        >
          再来一次
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
  width: 100%;
  transition: background 300ms ease;
}

.game-content-shell {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
  width: min(100%, 560px);
  margin: 0 auto;
  padding: 16px;
}

.game-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.game-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  transition: color 300ms ease;
}

.settings-btn {
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--ios-text-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 150ms ease,
    color 150ms ease;
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.settings-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.score-group {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.main-area {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.grid-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.score-card {
  background: var(--ios-surface);
  border-radius: var(--ios-radius-md);
  padding: 8px 16px;
  min-width: 72px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background 300ms ease;
}

.score-best {
  background: linear-gradient(135deg, #ede9fe, #fce7f3);
}

.score-label {
  font-size: 11px;
  font-weight: 500;
  transition: color 300ms ease;
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  transition: color 300ms ease;
}

.new-game-btn {
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: var(--ios-radius-md);
  cursor: pointer;
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}

.new-game-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.grid-container {
  width: 100%;
  max-width: 520px;
  border-radius: var(--ios-radius-lg);
  padding: 8px;
  transition:
    background 300ms ease,
    border-color 300ms ease;
}

.grid-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.cell {
  aspect-ratio: 1;
  border-radius: var(--ios-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition:
    box-shadow 200ms ease,
    transform 160ms ease,
    opacity 160ms ease;
  position: relative;
  overflow: hidden;
}

.cell-glow {
  box-shadow:
    0 0 12px var(--glow-color),
    inset 0 0 8px rgba(255, 255, 255, 0.1);
}

.cell-num {
  font-size: 24px;
}

.cell-icon {
  width: 90%;
  height: 90%;
  display: block;
  object-fit: contain;
  border-radius: 8px;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.hint {
  font-size: 14px;
  margin: 0;
  text-align: center;
  transition: color 300ms ease;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  background: var(--ios-surface);
  border-radius: 20px;
  padding: 32px 24px;
  width: 280px;
  text-align: center;
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--ios-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 32px;
}

.modal-won {
  background: linear-gradient(135deg, #ffcc00, #ff9500);
}

.modal-lost {
  background: linear-gradient(135deg, #fca5a5, #dc2626);
  color: #fff7ed;
}

.modal-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin: 0 0 8px;
}

.modal-score {
  font-size: 15px;
  color: var(--ios-text-secondary);
  margin: 0 0 24px;
}

.modal-btn {
  width: 100%;
  padding: 14px 20px;
  font-size: 17px;
  font-weight: 600;
  border: none;
  border-radius: var(--ios-radius-md);
  cursor: pointer;
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}

.modal-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.deity-theme {
  background: linear-gradient(135deg, #09090b 0%, #1c1917 45%, #78350f 100%);
}

.deity-score-card {
  background: linear-gradient(135deg, rgba(245, 230, 184, 0.18), rgba(212, 168, 79, 0.28));
  border: 1px solid rgba(245, 230, 184, 0.18);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.deity-score-label {
  color: rgba(253, 230, 138, 0.82);
}

.deity-score-value {
  color: #fef3c7;
}

.deity-action-btn {
  box-shadow: 0 10px 24px rgba(217, 119, 6, 0.28);
}

.deity-grid {
  background: linear-gradient(180deg, rgba(28, 25, 23, 0.9), rgba(12, 10, 9, 0.96));
  border-color: rgba(245, 230, 184, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 0 0 1px rgba(120, 53, 15, 0.28);
}

.deity-cell {
  box-shadow:
    inset 0 0 0 1px rgba(245, 230, 184, 0.1),
    0 6px 18px rgba(0, 0, 0, 0.16);
}

.deity-empty-cell {
  background: linear-gradient(180deg, rgba(41, 37, 36, 0.92), rgba(17, 24, 39, 0.88)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 0 0 1px rgba(245, 230, 184, 0.08),
    inset 0 10px 18px rgba(0, 0, 0, 0.22);
}

.deity-hint {
  color: rgba(253, 230, 138, 0.76);
}

.deity-modal-card {
  background: linear-gradient(180deg, #1c1917, #0c0a09);
  border: 1px solid rgba(245, 230, 184, 0.14);
}

.deity-modal-icon {
  background: linear-gradient(135deg, rgba(245, 230, 184, 0.18), rgba(212, 168, 79, 0.3));
}

.energy-theme {
  background-image:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.18), transparent 32%),
    radial-gradient(circle at bottom, rgba(168, 85, 247, 0.16), transparent 28%);
}

.energy-settings-btn {
  color: #cffafe;
  background: rgba(15, 23, 42, 0.42);
  border: 1px solid rgba(34, 211, 238, 0.2);
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.18);
}

.energy-settings-btn:hover {
  background: rgba(15, 23, 42, 0.58);
}

.energy-settings-btn:active {
  background: rgba(15, 23, 42, 0.72);
}

.energy-action-btn {
  box-shadow: 0 10px 28px rgba(6, 182, 212, 0.28);
}
</style>
