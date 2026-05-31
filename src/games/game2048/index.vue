<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import './theme.css'
import GameContainer from '../../components/GameContainer.vue'

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
import IconUndo from './components/IconUndo.vue'
import IconWand from './components/IconWand.vue'
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

interface ActiveCell {
  id: number
  value: number
  row: number
  col: number
  isNew: boolean
}

const GAME_ID = '2048'
const WAND_REPLACEMENT_VALUES = [2, 4, 8, 16, 32]
const HAMMER_ANIMATION_MS = 680
const NEW_CELL_HIGHLIGHT_MS = 300
const SWIPE_THRESHOLD_PX = 30
let cellIdCounter = 0
let hammerImpactTimer: number | null = null
let newCellTimer: number | null = null

const { registerCleanup } = useGameRouteLifecycle()

const grid = ref<GameCell[][]>([])
const newCellIds = ref(new Set<number>())
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

const activeCells = computed<ActiveCell[]>(() => {
  const result: ActiveCell[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = grid.value[r]?.[c]
      if (cell && cell.value !== 0) {
        result.push({
          id: cell.id,
          value: cell.value,
          row: r,
          col: c,
          isNew: newCellIds.value.has(cell.id),
        })
      }
    }
  }
  return result
})

const cellPosStyle = (cell: ActiveCell) => ({
  '--col': cell.col,
  '--row': cell.row,
})

const cellClasses = (cell: ActiveCell) => [
  getCellTheme(cell.value).bg,
  getCellTheme(cell.value).text,
  cell.isNew ? 'cell-pop' : '',
  isSameTarget(selectedWandTarget.value, { row: cell.row, col: cell.col })
    ? 'wand-selected-cell'
    : '',
  isSameTarget(hammerImpactTarget.value, { row: cell.row, col: cell.col })
    ? 'hammer-impact-cell'
    : '',
]

const clearNewCellTimer = () => {
  if (newCellTimer !== null) {
    window.clearTimeout(newCellTimer)
    newCellTimer = null
  }
}

const collectCellIds = (): Set<number> => {
  const ids = new Set<number>()
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell.value !== 0) ids.add(cell.id)
    }
  }
  return ids
}

const trackNewCells = (prevIds: Set<number>) => {
  clearNewCellTimer()
  const currIds = collectCellIds()
  const newIds = new Set([...currIds].filter((id) => !prevIds.has(id)))
  newCellIds.value = newIds
  newCellTimer = window.setTimeout(() => {
    newCellIds.value = new Set()
    newCellTimer = null
  }, NEW_CELL_HIGHLIGHT_MS)
}

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

  const state = await gameStorage.loadGameState<GameState>(GAME_ID)
  if (state) {
    grid.value = restoreStoredGrid(state.grid)
    score.value = state.score
    bestScore.value = state.bestScore
    gameStatus.value = state.gameStatus
    powerUps.value = state.powerUps ?? { undo: 3, wand: 3, hammer: 3 }
    undoSnapshot.value = null
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
  clearNewCellTimer()
  newCellIds.value = new Set()
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
  gameStatus.value = 'playing'
  await saveToStorage()
}

const move = (dir: MoveDirection) => {
  if (gameStatus.value !== 'playing') return false
  if (wandMode.value || hammerMode.value || selectedPowerUp.value) return false

  const prevIds = collectCellIds()
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

  saveToStorage().catch(() => {})
  trackNewCells(prevIds)
  return true
}

const restoreUndo = () => {
  if (!undoSnapshot.value || powerUps.value.undo <= 0) return

  clearHammerImpactTimer()
  clearNewCellTimer()
  newCellIds.value = new Set()
  grid.value = restoreStoredGrid(undoSnapshot.value.grid)
  score.value = undoSnapshot.value.score
  gameStatus.value = undoSnapshot.value.gameStatus
  powerUps.value = { ...powerUps.value, undo: powerUps.value.undo - 1 }
  undoSnapshot.value = null
  hammerMode.value = false
  wandMode.value = false
  selectedWandTarget.value = null
  soundManager.playUndoPowerUp()
  saveToStorage().catch(() => {})
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
  saveToStorage().catch(() => {})
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
    saveToStorage().catch(() => {})
    hammerImpactTimer = null
  }, HAMMER_ANIMATION_MS)
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

const onPointerDown = (e: PointerEvent) => {
  startX = e.clientX
  startY = e.clientY
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

const onPointerUp = (e: PointerEvent) => {
  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return

  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
}

watch(gameStatus, (newStatus) => {
  if (newStatus !== 'playing') {
    saveToStorage().catch(() => {})
    if (newStatus === 'won') soundManager.playWin()
    else if (newStatus === 'lost') soundManager.playLose()
  }
})

onMounted(async () => {
  cellIdCounter = 0
  await restoreFromStorage()
  await soundManager.init()
  registerCleanup(GAME_ID, () => {
    soundManager.destroy()
    window.removeEventListener('keydown', handleKey)
    clearHammerImpactTimer()
    clearNewCellTimer()
  })
  window.addEventListener('keydown', handleKey)
})

const isSameTarget = (a: HammerTarget | null, b: HammerTarget) =>
  Boolean(a && a.row === b.row && a.col === b.col)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  clearHammerImpactTimer()
  clearNewCellTimer()
})
</script>
<template>
  <GameContainer v-if="settingsLoaded" bg-class="theme-2048-surface">
    <div
      class="game-root"
      :class="{ 'target-mode': activeTargetPowerUp }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
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
              <IconUndo v-if="item.icon === 'undo'" />
              <IconWand v-else-if="item.icon === 'wand'" />
              <IconHammer v-else aria-hidden="true" />
              <span class="power-count">{{ powerUps[item.type] }}</span>
            </button>
          </div>
        </div>

        <div class="main-area">
          <div class="sr-only" aria-live="polite">
            当前得分 {{ score }}，最高分 {{ bestScore }}，
            {{
              gameStatus === 'playing'
                ? '游戏进行中'
                : gameStatus === 'won'
                  ? '恭喜获胜'
                  : '本局结束'
            }}
          </div>
          <div class="grid-wrapper">
            <div
              class="grid-container"
              :class="[
                theme.name === 'energy' ? 'energy-grid' : '',
                theme.name === 'deity' ? 'deity-grid' : '',
                theme.name === 'undead' ? 'undead-grid' : '',
              ]"
            >
              <div v-if="selectedWandTarget" class="wand-replacement-row" aria-label="选择替换数字">
                <button
                  v-for="value in WAND_REPLACEMENT_VALUES"
                  :key="value"
                  class="wand-replacement-btn"
                  :class="[getDefaultCellTheme(value).bg, getDefaultCellTheme(value).text]"
                  :disabled="value === selectedWandValue"
                  @pointerdown="replaceSelectedCellWithWand(value)"
                >
                  <span>{{ value }}</span>
                </button>
              </div>
              <div class="grid-inner">
                <div
                  v-for="i in 16"
                  :key="'slot-' + i"
                  class="grid-slot"
                  :class="getCellTheme(0).bg"
                />
                <div
                  v-for="cell in activeCells"
                  :key="cell.id"
                  class="cell"
                  :class="cellClasses(cell)"
                  :style="cellPosStyle(cell)"
                  @pointerdown="
                    activeTargetPowerUp && handleCellClick({ row: cell.row, col: cell.col })
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
  </GameContainer>
</template>

<style src="./index.css" scoped></style>
