<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import './theme.css'

import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import { gameStorage } from '../../stores/gameStorage'
import { soundManager } from './soundManager'
import {
  canMove,
  createEmptyGrid,
  moveGrid,
  removeCellAt,
  replaceCellAt,
  spawnRandomCell,
} from './gameLogic'
import { settingsStore } from './settingsStore'
import { getTheme } from './themes'
import IconHammer from './components/IconHammer.vue'
import ResultDialog from './components/ResultDialog.vue'
import ThemeDialog from './components/ThemeDialog.vue'
import PowerUpDialog from './components/PowerUpDialog.vue'
import PauseMenu from './components/PauseMenu.vue'
import type {
  GameCell,
  GameSnapshot,
  GameState,
  GameStatus,
  HammerTarget,
  MoveDirection,
  PowerUpState,
  TargetPowerUpType,
  PowerUpType,
  StoredCell,
} from './types'

const GAME_ID = '2048'
const WAND_REPLACEMENT_VALUES = [2, 4, 8, 16, 32]
let cellIdCounter = 0
let hammerImpactTimer: number | null = null

const { registerCleanup } = useGameRouteLifecycle()

const grid = ref<GameCell[][]>([])
const score = ref(0)
const bestScore = ref(0)
const gameStatus = ref<GameStatus>('playing')
const settingsLoaded = ref(false)
const menuOpen = ref(false)
const helpOpen = ref(false)
const themeDialogOpen = ref(false)
const muted = ref(false)
const hammerMode = ref(false)
const wandMode = ref(false)
const selectedWandTarget = ref<HammerTarget | null>(null)
const hammerImpactTarget = ref<HammerTarget | null>(null)
const selectedPowerUp = ref<PowerUpType | null>(null)
const undoSnapshot = ref<GameSnapshot | null>(null)
const powerUps = ref<PowerUpState>({ undo: 3, wand: 3, hammer: 3 })

const clearHammerImpactTimer = () => {
  if (hammerImpactTimer === null) return
  window.clearTimeout(hammerImpactTimer)
  hammerImpactTimer = null
}

const theme = computed(() => getTheme(settingsStore.theme))
const nextCellId = () => cellIdCounter++
const getCellTheme = (value: number) => theme.value.cellThemes[value] || theme.value.cellThemes[0]
const getDefaultCellTheme = (value: number) =>
  getTheme('default').cellThemes[value] || getTheme('default').cellThemes[0]
const powerUpItems: Array<{
  type: PowerUpType
  label: string
  ariaLabel: string
  icon: string
  description: string
}> = [
  {
    type: 'undo',
    label: '撤回',
    ariaLabel: '使用撤回道具',
    icon: 'undo',
    description: '立即退回到上一步',
  },
  {
    type: 'wand',
    label: '魔法棒',
    ariaLabel: '使用魔法棒道具',
    icon: 'wand',
    description: '将所选的数字变换成指定数字',
  },
  {
    type: 'hammer',
    label: '锤子',
    ariaLabel: '使用锤子道具',
    icon: 'hammer',
    description: '使用后选择一个方块清除',
  },
]

const selectedPowerUpItem = computed(
  () => powerUpItems.find((item) => item.type === selectedPowerUp.value) ?? null
)
const activeTargetPowerUp = computed<TargetPowerUpType | null>(() => {
  if (wandMode.value) return 'wand'
  if (hammerMode.value) return 'hammer'
  return null
})
const selectedWandValue = computed(() => {
  if (!selectedWandTarget.value) return 0
  return grid.value[selectedWandTarget.value.row]?.[selectedWandTarget.value.col]?.value ?? 0
})
const isChoosingWandReplacement = computed(
  () => wandMode.value || Boolean(selectedWandTarget.value)
)
const hammerImpactStyle = computed<Record<string, string>>(() => {
  if (!hammerImpactTarget.value) return {} as Record<string, string>
  return {
    '--hammer-row': String(hammerImpactTarget.value.row),
    '--hammer-col': String(hammerImpactTarget.value.col),
  }
})

const cloneStoredGrid = (source: GameCell[][]): StoredCell[][] =>
  source.map((row) => row.map((cell) => ({ value: cell.value })))

const restoreStoredGrid = (source: StoredCell[][]): GameCell[][] =>
  source.map((row) => row.map((cell) => ({ value: cell.value, id: nextCellId() })))

const getIconSrc = (value: number): string | undefined => {
  if (!theme.value.useIcons || !theme.value.iconMap) return undefined
  return theme.value.iconMap[value]
}

const restoreFromStorage = async () => {
  await settingsStore.load()
  settingsLoaded.value = true

  const state = await gameStorage.loadGameState(GAME_ID)
  if (state) {
    const savedState = state as GameState
    grid.value = restoreStoredGrid(savedState.grid)
    score.value = savedState.score
    bestScore.value = savedState.bestScore
    gameStatus.value = savedState.gameStatus
    powerUps.value = savedState.powerUps ?? { undo: 3, wand: 3, hammer: 3 }
    undoSnapshot.value = savedState.undoSnapshot ?? null
  } else {
    await initGrid()
  }
}

const saveToStorage = async () => {
  const storedGrid = cloneStoredGrid(grid.value)
  const state: GameState = {
    grid: storedGrid,
    score: score.value,
    bestScore: bestScore.value,
    gameStatus: gameStatus.value,
    powerUps: powerUps.value,
    undoSnapshot: undoSnapshot.value,
  }
  await gameStorage.saveGameState(GAME_ID, state)
}

const captureUndoSnapshot = () => {
  undoSnapshot.value = {
    grid: cloneStoredGrid(grid.value),
    score: score.value,
    gameStatus: gameStatus.value,
  }
}

const addRandomCell = () => {
  grid.value = spawnRandomCell(grid.value, nextCellId)
}

const updateScore = (addScore: number) => {
  score.value += addScore
  if (score.value > bestScore.value) bestScore.value = score.value
}

const checkLose = () => {
  if (!canMove(grid.value)) gameStatus.value = 'lost'
}

const initGrid = async () => {
  clearHammerImpactTimer()
  grid.value = createEmptyGrid(nextCellId)
  score.value = 0
  powerUps.value = { undo: 3, wand: 3, hammer: 3 }
  undoSnapshot.value = null
  hammerMode.value = false
  wandMode.value = false
  selectedWandTarget.value = null
  hammerImpactTarget.value = null
  selectedPowerUp.value = null
  menuOpen.value = false
  helpOpen.value = false
  addRandomCell()
  addRandomCell()
  updateScore(0)
  gameStatus.value = 'playing'
  await saveToStorage()
}

const move = (dir: MoveDirection) => {
  if (gameStatus.value !== 'playing') return false
  if (wandMode.value || hammerMode.value || selectedPowerUp.value) return false

  const result = moveGrid(grid.value, dir, nextCellId)
  if (!result.moved) return false

  captureUndoSnapshot()
  soundManager.playSlide()
  if (result.score > 0) soundManager.playMerge()

  grid.value = spawnRandomCell(result.grid, nextCellId)
  updateScore(result.score)

  if (result.reached2048) {
    gameStatus.value = 'won'
  } else {
    checkLose()
  }

  void saveToStorage()
  return true
}

const restoreUndo = () => {
  if (!undoSnapshot.value || powerUps.value.undo <= 0) return

  clearHammerImpactTimer()
  grid.value = restoreStoredGrid(undoSnapshot.value.grid)
  score.value = undoSnapshot.value.score
  gameStatus.value = undoSnapshot.value.gameStatus
  powerUps.value = { ...powerUps.value, undo: powerUps.value.undo - 1 }
  undoSnapshot.value = null
  hammerMode.value = false
  wandMode.value = false
  selectedWandTarget.value = null
  soundManager.playUndoPowerUp()
  void saveToStorage()
}

const useWand = () => {
  if (powerUps.value.wand <= 0 || gameStatus.value !== 'playing') return
  if (wandMode.value) {
    wandMode.value = false
    selectedWandTarget.value = null
    return
  }

  wandMode.value = true
  hammerMode.value = false
  selectedWandTarget.value = null
}

const getPowerUpDisabled = (type: PowerUpType) => {
  if (gameStatus.value !== 'playing') return true
  if (type !== 'wand' && isChoosingWandReplacement.value) return true
  if (powerUps.value[type] <= 0) return true
  return type === 'undo' && !undoSnapshot.value
}

const selectCellForWand = (target: HammerTarget) => {
  if (!wandMode.value || powerUps.value.wand <= 0 || gameStatus.value !== 'playing') return
  const cell = grid.value[target.row]?.[target.col]
  if (!cell || cell.value === 0) return
  selectedWandTarget.value = target
}

const replaceSelectedCellWithWand = (value: number) => {
  if (!selectedWandTarget.value || powerUps.value.wand <= 0 || gameStatus.value !== 'playing')
    return

  const target = selectedWandTarget.value
  captureUndoSnapshot()
  const result = replaceCellAt(grid.value, target, value, nextCellId)
  if (!result.replaced) {
    undoSnapshot.value = null
    return
  }

  grid.value = result.grid
  powerUps.value = { ...powerUps.value, wand: powerUps.value.wand - 1 }
  wandMode.value = false
  selectedWandTarget.value = null
  soundManager.playWandPowerUp()
  if (result.to === 2048) {
    gameStatus.value = 'won'
  } else {
    checkLose()
  }
  void saveToStorage()
}

const useHammer = () => {
  if (powerUps.value.hammer <= 0 || gameStatus.value !== 'playing') return
  hammerMode.value = !hammerMode.value
  wandMode.value = false
  selectedWandTarget.value = null
}

const hitCellWithHammer = (target: HammerTarget) => {
  if (!hammerMode.value || powerUps.value.hammer <= 0 || gameStatus.value !== 'playing') return
  if (hammerImpactTarget.value) return

  captureUndoSnapshot()
  const result = removeCellAt(grid.value, target, nextCellId)
  if (!result.removed) {
    undoSnapshot.value = null
    return
  }

  hammerImpactTarget.value = target
  soundManager.playHammerPowerUp()
  hammerImpactTimer = window.setTimeout(() => {
    grid.value = result.grid
    powerUps.value = { ...powerUps.value, hammer: powerUps.value.hammer - 1 }
    hammerMode.value = false
    hammerImpactTarget.value = null
    void saveToStorage()
    hammerImpactTimer = null
  }, 680)
}

const startPowerUp = (type: PowerUpType) => {
  if (type === 'undo') restoreUndo()
  if (type === 'wand') useWand()
  if (type === 'hammer') useHammer()
  selectedPowerUp.value = null
}

const openPowerUpDialog = (type: PowerUpType) => {
  selectedPowerUp.value = type
  soundManager.playPowerUpOpen()
}

const closePowerUpDialog = () => {
  selectedPowerUp.value = null
}

const useSelectedPowerUp = () => {
  if (!selectedPowerUp.value) return
  startPowerUp(selectedPowerUp.value)
}

const handleCellClick = (target: HammerTarget) => {
  if (wandMode.value) selectCellForWand(target)
  else hitCellWithHammer(target)
}

const openPauseMenu = () => {
  clearHammerImpactTimer()
  hammerImpactTarget.value = null
  menuOpen.value = true
  hammerMode.value = false
  wandMode.value = false
  selectedWandTarget.value = null
  selectedPowerUp.value = null
}

const closePauseMenu = () => {
  menuOpen.value = false
  helpOpen.value = false
}

const openThemeDialog = () => {
  clearHammerImpactTimer()
  hammerImpactTarget.value = null
  hammerMode.value = false
  wandMode.value = false
  selectedWandTarget.value = null
  selectedPowerUp.value = null
  themeDialogOpen.value = true
}

const restartFromMenu = async () => {
  await initGrid()
  menuOpen.value = false
}

const toggleMuted = () => {
  muted.value = !muted.value
  soundManager.setVolume(muted.value ? 0 : 0.5)
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

watch(gameStatus, (newStatus) => {
  if (newStatus !== 'playing') {
    void saveToStorage()
    if (newStatus === 'won') soundManager.playWin()
    else if (newStatus === 'lost') soundManager.playLose()
  }
})

onMounted(async () => {
  cellIdCounter = 0
  await restoreFromStorage()
  await soundManager.init()
  registerCleanup(GAME_ID, () => soundManager.destroy())
  window.addEventListener('keydown', handleKey)
})

const isSameTarget = (a: HammerTarget | null, b: HammerTarget) =>
  Boolean(a && a.row === b.row && a.col === b.col)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  clearHammerImpactTimer()
})
</script>
<template>
  <div
    v-if="settingsLoaded"
    class="game-container theme-2048-surface"
    :class="{ 'target-mode': activeTargetPowerUp }"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="game-content-shell">
      <header class="play-header">
        <div class="title-lockup">
          <button class="mini-logo" aria-label="选择主题" @click="openThemeDialog">
            <span>2</span>
            <span>0</span>
            <span>4</span>
            <span>8</span>
          </button>
        </div>
        <div class="score-group" aria-label="分数信息">
          <div class="score-card">
            <span class="score-label">得分</span>
            <span class="score-value">{{ score }}</span>
          </div>
          <div class="score-card">
            <span class="score-label">最高分</span>
            <span class="score-value">{{ bestScore }}</span>
          </div>
        </div>
      </header>

      <div class="tool-row">
        <button class="back-tile-btn" aria-label="打开暂停菜单" @click="openPauseMenu">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 19-7-7 7-7" />
          </svg>
        </button>
        <div class="power-up-row" aria-label="道具">
          <button
            v-for="item in powerUpItems"
            :key="item.type"
            class="power-up-btn"
            :class="[{ active: item.type === activeTargetPowerUp }, item.type]"
            :disabled="getPowerUpDisabled(item.type)"
            :aria-label="`${item.ariaLabel}，剩余 ${powerUps[item.type]} 次`"
            @click="openPowerUpDialog(item.type)"
          >
            <svg
              v-if="item.icon === 'undo'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10a6 6 0 1 1-4.2 10.3" />
            </svg>
            <svg
              v-else-if="item.icon === 'wand'"
              viewBox="0 0 48 48"
              fill="currentColor"
              aria-hidden="true"
            >
              <g>
                <path
                  d="M12.5 6c-1.112 4.017-2.543 5.39-6.5 6.5c3.957 1.11 5.388 2.483 6.5 6.5c1.112-4.017 2.543-5.39 6.5-6.5c-3.957-1.11-5.388-2.483-6.5-6.5m0 17c-1.112 4.017-2.543 5.39-6.5 6.5c3.957 1.11 5.388 2.483 6.5 6.5c1.112-4.017 2.543-5.39 6.5-6.5c-3.957-1.11-5.388-2.483-6.5-6.5M23 12.5c3.957-1.11 5.388-2.483 6.5-6.5c1.112 4.017 2.543 5.39 6.5 6.5c-3.957 1.11-5.388 2.483-6.5 6.5c-1.112-4.017-2.543-5.39-6.5-6.5"
                />
                <path
                  fill-rule="evenodd"
                  d="m35.8 41.456l-.23-.23l-.014-.013l-18.142-18.142a2 2 0 0 1 0-2.828l2.829-2.829a2 2 0 0 1 2.828 0L41.456 35.8a2 2 0 0 1 0 2.828l-2.828 2.829a2 2 0 0 1-2.829 0M22.615 25.444l-3.787-3.787l2.828-2.829l3.788 3.788z"
                  clip-rule="evenodd"
                />
              </g>
            </svg>
            <IconHammer v-else aria-hidden="true" />
            <span class="power-count">{{ powerUps[item.type] }}</span>
          </button>
        </div>
      </div>

      <div class="main-area">
        <div class="sr-only" aria-live="polite">
          当前得分 {{ score }}，最高分 {{ bestScore }}，
          {{
            gameStatus === 'playing' ? '游戏进行中' : gameStatus === 'won' ? '恭喜获胜' : '本局结束'
          }}
        </div>
        <div class="grid-wrapper">
          <div
            class="grid-container"
            :class="[
              theme.name === 'energy' ? 'energy-grid' : '',
              theme.name === 'deity' ? 'deity-grid' : '',
            ]"
          >
            <div v-if="selectedWandTarget" class="wand-replacement-row" aria-label="选择替换数字">
              <button
                v-for="value in WAND_REPLACEMENT_VALUES"
                :key="value"
                class="wand-replacement-btn"
                :class="[getDefaultCellTheme(value).bg, getDefaultCellTheme(value).text]"
                :disabled="value === selectedWandValue"
                @click="replaceSelectedCellWithWand(value)"
              >
                <span>{{ value }}</span>
              </button>
            </div>
            <div class="grid-inner">
              <div
                v-for="(cell, cellIndex) in grid.flat()"
                :key="cell.id"
                class="cell"
                :class="[
                  getCellTheme(cell.value).bg,
                  getCellTheme(cell.value).text,
                  isSameTarget(selectedWandTarget, {
                    row: Math.floor(cellIndex / 4),
                    col: cellIndex % 4,
                  })
                    ? 'wand-selected-cell'
                    : '',
                  isSameTarget(hammerImpactTarget, {
                    row: Math.floor(cellIndex / 4),
                    col: cellIndex % 4,
                  })
                    ? 'hammer-impact-cell'
                    : '',
                ]"
                @click="
                  handleCellClick({
                    row: Math.floor(cellIndex / 4),
                    col: cellIndex % 4,
                  })
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
            <div
              v-if="hammerImpactTarget"
              class="hammer-impact-overlay"
              :style="hammerImpactStyle"
              aria-hidden="true"
            >
              <span class="hammer-impact-mark">
                <IconHammer />
              </span>
            </div>
          </div>
        </div>
        <p class="hint">
          {{
            wandMode
              ? selectedWandTarget
                ? '选择上方数字完成替换'
                : '选择一个方块修改数字'
              : hammerMode
                ? '选择一个方块清除'
                : '滑动或使用方向键移动方块'
          }}
        </p>
      </div>
    </div>

    <PowerUpDialog
      v-if="selectedPowerUpItem"
      :type="selectedPowerUpItem.type"
      :description="selectedPowerUpItem.description"
      :count="powerUps[selectedPowerUpItem.type]"
      @use="useSelectedPowerUp"
      @close="closePowerUpDialog"
    />

    <PauseMenu
      v-if="menuOpen"
      :muted="muted"
      @close="closePauseMenu"
      @restart="restartFromMenu"
      @toggle-mute="toggleMuted"
    />

    <ResultDialog
      v-if="gameStatus !== 'playing'"
      :game-status="gameStatus"
      :score="score"
      :best-score="bestScore"
      :theme-name="theme.name"
      @restart="initGrid"
    />

    <ThemeDialog v-if="themeDialogOpen" @close="themeDialogOpen = false" />
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.game-content-shell {
  height: 100%;
  aspect-ratio: 3 / 4;
  margin: 0 auto;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  padding: 16px;
  background: none;
  container-type: inline-size;
  container-name: game;
}

.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 18px;
  padding: 4px 0 18px;
}

.title-lockup {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.mini-logo {
  --mini-logo-size: 72px;
  width: var(--mini-logo-size);
  aspect-ratio: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: 1fr;
  gap: 2px;
  padding: 2px;
  box-sizing: border-box;
  border-radius: 10px;
  background: rgba(120, 84, 41, 0.12);
  box-shadow:
    0 5px 0 rgba(139, 91, 56, 0.16),
    0 10px 18px rgba(126, 81, 44, 0.12);
}

.mini-logo span {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  border-radius: 4px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 26px;
  font-weight: 900;
  color: #fff7ed;
  text-shadow: 0 2px 0 rgba(80, 49, 24, 0.28);
}

.mini-logo span:nth-child(1),
.mini-logo span:nth-child(4) {
  background: #ef8c16;
}

.mini-logo span:nth-child(2),
.mini-logo span:nth-child(3) {
  background: #eadfcb;
  color: #8d4b2c;
}

.score-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-shrink: 0;
}

.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  margin-bottom: 10px;
}

.back-tile-btn,
.power-up-btn {
  border: 1px solid rgba(174, 103, 55, 0.12);
  border-radius: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.95);
  background: linear-gradient(180deg, #cf795d 0%, #c96d53 100%);
  box-shadow:
    0 5px 0 rgba(118, 77, 58, 0.34),
    0 12px 20px rgba(126, 81, 44, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
}

.back-tile-btn {
  width: 62px;
  min-height: 62px;
  flex-shrink: 0;
}

.back-tile-btn svg {
  width: 36px;
  height: 36px;
}

.power-up-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.power-up-btn {
  position: relative;
  width: 58px;
  min-height: 58px;
}

.power-up-btn svg {
  width: 30px;
  height: 30px;
}

.power-up-btn.wand {
  background: linear-gradient(180deg, #d39418 0%, #bf7907 100%);
  box-shadow:
    0 5px 0 rgba(114, 73, 13, 0.36),
    0 12px 20px rgba(126, 81, 44, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.power-up-btn.active {
  outline: 4px solid rgba(255, 255, 255, 0.86);
  filter: brightness(1.06);
}

.power-up-btn:disabled {
  cursor: not-allowed;
  filter: grayscale(0.4);
  opacity: 0.52;
}

.power-count {
  position: absolute;
  right: -5px;
  top: -7px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ef4444;
  border: 2px solid #fff7ed;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(75, 48, 30, 0.22);
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

.wand-replacement-row {
  position: absolute;
  left: 50%;
  top: calc(-1 * clamp(48px, 11cqw, 66px));
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: min(100%, 340px);
  min-height: 58px;
  transform: translateX(-50%);
  pointer-events: auto;
}

.wand-replacement-btn {
  width: 58px;
  min-height: 58px;
  border: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 7px;
  color: rgba(91, 68, 54, 0.88);
  cursor: pointer;
  font-size: 25px;
  font-weight: 800;
  line-height: 1;
  overflow: hidden;
  box-shadow:
    0 4px 0 rgba(78, 57, 43, 0.16),
    0 10px 18px rgba(55, 41, 32, 0.12);
  transition:
    transform 120ms ease,
    filter 120ms ease,
    opacity 120ms ease;
}

.wand-replacement-btn:not(:disabled):active {
  transform: translateY(2px) scale(0.98);
}

.wand-replacement-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 116px;
  min-height: 72px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #cf7d5e;
  border: 1px solid rgba(174, 103, 55, 0.12);
  box-shadow:
    0 5px 0 rgba(118, 77, 58, 0.22),
    0 10px 18px rgba(126, 81, 44, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  font-variant-numeric: tabular-nums;
}

.score-label {
  margin-bottom: 5px;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  color: rgba(255, 246, 231, 0.78);
}

.score-value {
  min-width: 76px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #fff7ed;
  font-size: 24px;
  font-weight: 500;
  line-height: 1;
  color: #914f3d;
  text-align: center;
}

.back-tile-btn:hover,
.power-up-btn:not(:disabled):hover {
  filter: brightness(1.03);
}

.back-tile-btn:active,
.power-up-btn:not(:disabled):active {
  transform: translateY(3px) scale(0.98);
  box-shadow:
    0 1px 0 rgba(139, 91, 56, 0.28),
    0 5px 10px rgba(126, 81, 44, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.grid-container {
  width: 100%;
  max-width: min(100%, 520px);
  position: relative;
  overflow: visible;
  border-radius: var(--ios-radius-lg);
  padding: 8px;
  background: #e7e5e4;
  border: 1px solid transparent;
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
  will-change: transform, opacity;
}

.target-mode .cell:hover {
  cursor: pointer;
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

.wand-selected-cell {
  outline: 4px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 0 0 3px rgba(211, 148, 24, 0.8),
    0 0 22px rgba(211, 148, 24, 0.36);
}

.hammer-impact-cell {
  animation: hammer-cell-crack 680ms ease both;
}

.hammer-impact-overlay {
  --grid-gap: 8px;
  --cell-size: calc((100% - (var(--grid-gap) * 3)) / 4);
  position: absolute;
  inset: 8px;
  z-index: 4;
  pointer-events: none;
}

.hammer-impact-mark {
  position: absolute;
  left: calc((var(--cell-size) + var(--grid-gap)) * var(--hammer-col) + var(--cell-size) * 0.48);
  top: calc((var(--cell-size) + var(--grid-gap)) * var(--hammer-row) - var(--cell-size) * 0.08);
  width: calc(var(--cell-size) * 0.78);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f3f4f6;
  filter: drop-shadow(0 2px 0 rgba(255, 255, 255, 0.5))
    drop-shadow(0 7px 5px rgba(84, 60, 42, 0.32));
  transform-origin: 87% 88%;
  animation: hammer-smash 680ms cubic-bezier(0.2, 0.76, 0.22, 1) both;
}

.hammer-impact-mark svg {
  width: 100%;
  height: 100%;
}

@keyframes hammer-smash {
  0% {
    opacity: 0;
    transform: rotate(64deg) scale(0.96);
  }

  16% {
    opacity: 1;
    transform: rotate(56deg) scale(1);
  }

  42% {
    opacity: 1;
    transform: rotate(-18deg) scale(1);
  }

  74% {
    opacity: 1;
    transform: rotate(-18deg) scale(1);
  }

  100% {
    opacity: 0;
    transform: rotate(-18deg) scale(1);
  }
}

@keyframes hammer-cell-crack {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  42% {
    transform: scale(0.92) rotate(-1.6deg);
    opacity: 0.84;
  }

  74% {
    transform: scale(0.92) rotate(0deg);
    opacity: 0.78;
  }
}

.hint {
  font-size: 14px;
  margin: 0;
  text-align: center;
  color: rgba(120, 84, 41, 0.62);
}

.deity-grid {
  background: linear-gradient(180deg, rgba(28, 25, 23, 0.9), rgba(12, 10, 9, 0.96));
  border-color: rgba(245, 230, 184, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 0 0 1px rgba(120, 53, 15, 0.28);
}

.energy-grid {
  background: rgba(15, 23, 42, 0.35);
  border-color: rgba(34, 211, 238, 0.18);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  white-space: nowrap;
}

@container game (max-width: 520px) {
  .game-content-shell {
    padding: 14px 12px;
  }

  .play-header {
    gap: 10px;
    padding-bottom: 16px;
  }

  .title-lockup {
    gap: 10px;
  }

  .mini-logo {
    --mini-logo-size: 58px;
  }

  .mini-logo span {
    font-size: 22px;
  }

  .score-group {
    gap: 8px;
  }

  .score-card {
    width: 88px;
    min-height: 62px;
    padding: 7px 8px;
  }

  .score-label {
    font-size: 16px;
  }

  .score-value {
    min-width: 58px;
    font-size: 21px;
  }

  .back-tile-btn {
    width: 54px;
    min-height: 54px;
  }

  .power-up-row {
    gap: 10px;
  }

  .power-up-btn {
    width: 52px;
    min-height: 52px;
  }

  .grid-container {
    padding: 7px;
  }

  .grid-inner {
    gap: 7px;
  }

  .hammer-impact-overlay {
    --grid-gap: 7px;
    inset: 7px;
  }

  .wand-replacement-row {
    gap: 7px;
    min-height: 52px;
    top: calc(-1 * clamp(44px, 12cqw, 58px));
  }
}

@container game (max-width: 390px) {
  .mini-logo {
    --mini-logo-size: 52px;
  }

  .score-card {
    width: 78px;
  }

  .score-label {
    font-size: 14px;
  }

  .score-value {
    min-width: 50px;
    font-size: 19px;
  }

  .power-up-btn {
    width: 48px;
    min-height: 48px;
  }

  .wand-replacement-btn {
    width: 47px;
    min-height: 47px;
    font-size: 21px;
  }
}

@container game (min-width: 580px) {
  .game-content-shell {
    padding: 20px;
  }

  .play-header {
    gap: 22px;
    padding-bottom: 22px;
  }

  .title-lockup {
    gap: 16px;
  }

  .mini-logo {
    --mini-logo-size: 80px;
  }

  .mini-logo span {
    font-size: 28px;
  }

  .score-group {
    gap: 16px;
  }

  .score-card {
    width: 128px;
    min-height: 78px;
    padding: 10px 12px;
  }

  .score-label {
    font-size: 19px;
  }

  .score-value {
    min-width: 82px;
    font-size: 26px;
  }

  .tool-row {
    gap: 18px;
    margin-bottom: 12px;
  }

  .back-tile-btn {
    width: 68px;
    min-height: 68px;
  }

  .back-tile-btn svg {
    width: 40px;
    height: 40px;
  }

  .power-up-row {
    gap: 16px;
  }

  .power-up-btn {
    width: 64px;
    min-height: 64px;
  }

  .power-up-btn svg {
    width: 34px;
    height: 34px;
  }

  .power-count {
    min-width: 22px;
    height: 22px;
    font-size: 13px;
  }

  .main-area {
    gap: 18px;
  }

  .grid-container {
    max-width: 560px;
    padding: 10px;
  }

  .grid-inner {
    gap: 10px;
  }

  .cell-num {
    font-size: 26px;
  }

  .cell-icon {
    border-radius: 10px;
  }

  .hammer-impact-overlay {
    --grid-gap: 10px;
    inset: 10px;
  }

  .wand-replacement-row {
    gap: 10px;
    min-height: 64px;
    top: calc(-1 * clamp(54px, 10cqw, 72px));
  }

  .wand-replacement-btn {
    width: 64px;
    min-height: 64px;
    font-size: 27px;
  }
}

@container game (min-width: 770px) {
  .game-content-shell {
    padding: 28px;
  }

  .play-header {
    gap: 30px;
    padding-bottom: 28px;
  }

  .title-lockup {
    gap: 20px;
  }

  .mini-logo {
    --mini-logo-size: 96px;
  }

  .mini-logo span {
    font-size: 34px;
  }

  .score-group {
    gap: 20px;
  }

  .score-card {
    width: 152px;
    min-height: 88px;
    padding: 12px 14px;
  }

  .score-label {
    font-size: 20px;
  }

  .score-value {
    min-width: 92px;
    font-size: 30px;
  }

  .tool-row {
    gap: 22px;
    margin-bottom: 16px;
  }

  .back-tile-btn {
    width: 80px;
    min-height: 80px;
  }

  .back-tile-btn svg {
    width: 48px;
    height: 48px;
  }

  .power-up-row {
    gap: 20px;
  }

  .power-up-btn {
    width: 76px;
    min-height: 76px;
  }

  .power-up-btn svg {
    width: 38px;
    height: 38px;
  }

  .power-count {
    min-width: 24px;
    height: 24px;
    font-size: 14px;
  }

  .main-area {
    gap: 22px;
  }

  .grid-container {
    max-width: 720px;
    padding: 14px;
  }

  .grid-inner {
    gap: 14px;
  }

  .cell-num {
    font-size: 30px;
  }

  .cell-icon {
    border-radius: 12px;
  }

  .hammer-impact-overlay {
    --grid-gap: 14px;
    inset: 14px;
  }

  .wand-replacement-row {
    gap: 14px;
    min-height: 76px;
    top: calc(-1 * clamp(62px, 9cqw, 82px));
  }

  .wand-replacement-btn {
    width: 76px;
    min-height: 76px;
    font-size: 31px;
  }
}

@container game (min-width: 1080px) {
  .game-content-shell {
    padding: 32px;
  }

  .play-header {
    gap: 34px;
    padding-bottom: 32px;
  }

  .title-lockup {
    gap: 22px;
  }

  .mini-logo {
    --mini-logo-size: 108px;
  }

  .mini-logo span {
    font-size: 38px;
  }

  .score-group {
    gap: 22px;
  }

  .score-card {
    width: 168px;
    min-height: 96px;
    padding: 14px 16px;
  }

  .score-label {
    font-size: 22px;
  }

  .score-value {
    min-width: 100px;
    font-size: 32px;
  }

  .tool-row {
    gap: 24px;
    margin-bottom: 18px;
  }

  .back-tile-btn {
    width: 88px;
    min-height: 88px;
  }

  .back-tile-btn svg {
    width: 52px;
    height: 52px;
  }

  .power-up-row {
    gap: 22px;
  }

  .power-up-btn {
    width: 84px;
    min-height: 84px;
  }

  .power-up-btn svg {
    width: 42px;
    height: 42px;
  }

  .power-count {
    min-width: 26px;
    height: 26px;
    font-size: 15px;
  }

  .main-area {
    gap: 24px;
  }

  .grid-container {
    max-width: 780px;
    padding: 16px;
  }

  .grid-inner {
    gap: 16px;
  }

  .cell-num {
    font-size: 32px;
  }

  .cell-icon {
    border-radius: 14px;
  }

  .hammer-impact-overlay {
    --grid-gap: 16px;
    inset: 16px;
  }

  .wand-replacement-row {
    gap: 16px;
    min-height: 84px;
    top: calc(-1 * clamp(66px, 8cqw, 88px));
  }

  .wand-replacement-btn {
    width: 84px;
    min-height: 84px;
    font-size: 34px;
  }
}
</style>
