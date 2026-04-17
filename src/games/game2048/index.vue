<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import { gameStorage } from '../../stores/gameStorage'

type CellValue = number

interface Cell {
  value: CellValue
  id: number
}

// 存储用的简化 Cell 结构（不含 id）
interface StoredCell {
  value: CellValue
}

interface GameState {
  grid: StoredCell[][]
  score: number
  bestScore: number
  gameStatus: 'playing' | 'won' | 'lost'
}

const SIZE = 4
const GAME_ID = '2048'
let cellIdCounter = 0

const grid = ref<Cell[][]>([])
const score = ref(0)
const bestScore = ref(0)
const gameStatus = ref<'playing' | 'won' | 'lost'>('playing')

// iOS 柔和配色
const cellColors: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-gray-200', text: 'text-gray-300' },
  2: { bg: 'bg-amber-100', text: 'text-amber-800' },
  4: { bg: 'bg-amber-200', text: 'text-amber-900' },
  8: { bg: 'bg-orange-300', text: 'text-white' },
  16: { bg: 'bg-orange-400', text: 'text-white' },
  32: { bg: 'bg-red-400', text: 'text-white' },
  64: { bg: 'bg-red-500', text: 'text-white' },
  128: { bg: 'bg-yellow-400', text: 'text-white' },
  256: { bg: 'bg-yellow-500', text: 'text-white' },
  512: { bg: 'bg-purple-400', text: 'text-white' },
  1024: { bg: 'bg-purple-500', text: 'text-white' },
  2048: { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-white' },
}

// 从存储恢复游戏状态
const restoreFromStorage = async () => {
  const state = await gameStorage.loadGameState(GAME_ID)
  if (state) {
    const savedState = state as GameState
    // 恢复 grid，重新生成 id
    grid.value = savedState.grid.map((row) =>
      row.map((cell) => ({ value: cell.value, id: cellIdCounter++ }))
    )
    score.value = savedState.score
    bestScore.value = savedState.bestScore
    gameStatus.value = savedState.gameStatus
  } else {
    initGrid()
  }
}

// 保存游戏状态
const saveToStorage = async () => {
  // 转换 grid 为存储格式（不含 id）
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

const initGrid = async () => {
  grid.value = Array(SIZE)
    .fill(null)
    .map(() =>
      Array(SIZE)
        .fill(null)
        .map(() => ({ value: 0, id: cellIdCounter++ }))
    )
  addRandomCell()
  addRandomCell()
  updateScore()
  gameStatus.value = 'playing'
  // 清除旧存储，保存新状态
  await saveToStorage()
}

const getEmptyCells = () => {
  const empty: { row: number; col: number }[] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid.value[r][c].value === 0) empty.push({ row: r, col: c })
    }
  }
  return empty
}

const addRandomCell = () => {
  const empty = getEmptyCells()
  if (empty.length === 0) return
  const pos = empty[Math.floor(Math.random() * empty.length)]

  // 根据当前分数计算难度
  const getNewCellValue = () => {
    const currentScore = score.value
    // 分数越高，出现大数字的概率越大
    if (currentScore >= 2048) {
      // 2048+: 2(60%), 4(30%), 8(10%)
      const rand = Math.random()
      if (rand < 0.6) return 2
      if (rand < 0.9) return 4
      return 8
    } else if (currentScore >= 1024) {
      // 1024-2047: 2(70%), 4(25%), 8(5%)
      const rand = Math.random()
      if (rand < 0.7) return 2
      if (rand < 0.95) return 4
      return 8
    } else if (currentScore >= 512) {
      // 512-1023: 2(75%), 4(20%), 8(5%)
      const rand = Math.random()
      if (rand < 0.75) return 2
      if (rand < 0.95) return 4
      return 8
    } else if (currentScore >= 256) {
      // 256-511: 2(80%), 4(20%)
      return Math.random() < 0.8 ? 2 : 4
    } else if (currentScore >= 128) {
      // 128-255: 2(85%), 4(15%)
      return Math.random() < 0.85 ? 2 : 4
    } else {
      // 0-127: 2(90%), 4(10%) - 初始难度
      return Math.random() < 0.9 ? 2 : 4
    }
  }

  grid.value[pos.row][pos.col] = { value: getNewCellValue(), id: cellIdCounter++ }
}

const moveLeft = () => {
  let moved = false
  for (let r = 0; r < SIZE; r++) {
    const row = grid.value[r]
    const newRow: Cell[] = []
    let lastValue = 0,
      lastId = -1
    for (let c = 0; c < SIZE; c++) {
      const cell = row[c]
      if (cell.value === 0) continue
      if (cell.value === lastValue && lastValue !== 0) {
        newRow[lastId] = { value: lastValue * 2, id: cellIdCounter++ }
        if (newRow[lastId].value === 2048) gameStatus.value = 'won'
        lastValue = 0
        lastId = -1
        moved = true
      } else {
        newRow.push({ value: cell.value, id: cell.id })
        lastValue = cell.value
        lastId = newRow.length - 1
        // 检查格子位置是否发生变化
        if (newRow.length - 1 !== c) moved = true
      }
    }
    while (newRow.length < SIZE) {
      newRow.push({ value: 0, id: cellIdCounter++ })
    }
    grid.value[r] = newRow
  }
  return moved
}

const rotateGrid = (times: number) => {
  for (let t = 0; t < times; t++) {
    const newGrid: Cell[][] = []
    for (let c = 0; c < SIZE; c++) {
      const newRow: Cell[] = []
      for (let r = SIZE - 1; r >= 0; r--) newRow.push(grid.value[r][c])
      newGrid.push(newRow)
    }
    grid.value = newGrid
  }
}

const move = (dir: 'up' | 'down' | 'left' | 'right') => {
  if (gameStatus.value !== 'playing') return false
  const rot = { left: 0, down: 1, right: 2, up: 3 }
  rotateGrid(rot[dir])
  const moved = moveLeft()
  rotateGrid((4 - rot[dir]) % 4)
  if (moved) {
    addRandomCell()
    updateScore()
    checkLose()
    // 每次移动后保存
    saveToStorage()
  }
  return moved
}

const checkLose = () => {
  if (getEmptyCells().length > 0) return
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid.value[r][c].value
      if (c < SIZE - 1 && grid.value[r][c + 1].value === v) return
      if (r < SIZE - 1 && grid.value[r + 1][c].value === v) return
    }
  }
  gameStatus.value = 'lost'
}

// 计算当前最大数字作为分数
const updateScore = () => {
  let maxVal = 0
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid.value[r][c].value
      if (v > maxVal) maxVal = v
    }
  }
  score.value = maxVal
  if (score.value > bestScore.value) bestScore.value = score.value
}

const handleKey = (e: KeyboardEvent) => {
  const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
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

let startX = 0,
  startY = 0
const onTouchStart = (e: TouchEvent) => {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}
const onTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0].clientX - startX,
    dy = e.changedTouches[0].clientY - startY
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
}

// 监听 gameStatus 变化，结束时保存
watch(gameStatus, (newStatus) => {
  if (newStatus !== 'playing') {
    saveToStorage()
  }
})

onMounted(async () => {
  await restoreFromStorage()
  window.addEventListener('keydown', handleKey)
})
onUnmounted(() => window.removeEventListener('keydown', handleKey))
</script>

<template>
  <div class="ios-2048-game" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- 游戏标题 -->
    <h2 class="ios-game-title">2048</h2>

    <!-- iOS 风格分数卡片 -->
    <div class="ios-score-group">
      <div class="ios-score-card">
        <div class="ios-score-label">分数</div>
        <div class="ios-score-value">{{ score }}</div>
      </div>
      <div class="ios-score-card ios-score-best">
        <div class="ios-score-label">最高</div>
        <div class="ios-score-value">{{ bestScore }}</div>
      </div>
      <button class="ios-button ios-reset-btn" @click="initGrid">新游戏</button>
    </div>

    <!-- 游戏网格 -->
    <div class="ios-grid-container">
      <div class="ios-grid-inner">
        <div
          v-for="cell in grid.flat()"
          :key="cell.id"
          class="ios-cell"
          :class="[cellColors[cell.value].bg, cellColors[cell.value].text]"
        >
          <span v-if="cell.value" class="ios-cell-num">{{ cell.value }}</span>
        </div>
      </div>
    </div>

    <!-- 提示 -->
    <p class="ios-hint">滑动或使用方向键移动方块</p>

    <!-- iOS 模态弹窗 -->
    <div v-if="gameStatus !== 'playing'" class="ios-modal-overlay">
      <div class="ios-modal-card">
        <div class="ios-modal-icon" :class="gameStatus === 'won' ? 'ios-modal-won' : ''">
          {{ gameStatus === 'won' ? '🎉' : '' }}
        </div>
        <h3 class="ios-modal-title">{{ gameStatus === 'won' ? '恭喜获胜!' : '游戏结束' }}</h3>
        <p class="ios-modal-score">得分: {{ score }}</p>
        <button class="ios-button ios-modal-btn" @click="initGrid">再来一次</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ios-2048-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
}

.ios-game-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ios-text-primary);
  margin: 0 0 20px;
}

/* iOS 分数组 */
.ios-score-group {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.ios-score-card {
  background: var(--ios-surface);
  border-radius: var(--ios-radius-md);
  padding: 8px 16px;
  min-width: 72px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ios-score-best {
  background: linear-gradient(135deg, #ede9fe, #fce7f3);
}

.ios-score-label {
  font-size: 11px;
  color: var(--ios-text-secondary);
  font-weight: 500;
}

.ios-score-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ios-text-primary);
}

.ios-reset-btn {
  padding: 8px 16px;
  font-size: 15px;
}

/* iOS 游戏网格 */
.ios-grid-container {
  background: var(--ios-background);
  border-radius: var(--ios-radius-lg);
  padding: 12px;
}

.ios-grid-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.ios-cell {
  width: 64px;
  height: 64px;
  border-radius: var(--ios-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: background 150ms var(--ios-ease);
}

.ios-cell-num {
  font-size: 22px;
}

.ios-hint {
  font-size: 14px;
  color: var(--ios-text-secondary);
  margin-top: 24px;
}

/* iOS 模态 */
.ios-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.ios-modal-card {
  background: var(--ios-surface);
  border-radius: 20px;
  padding: 32px 24px;
  width: 280px;
  text-align: center;
}

.ios-modal-icon {
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

.ios-modal-won {
  background: linear-gradient(135deg, #ffcc00, #ff9500);
}

.ios-modal-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin: 0 0 8px;
}

.ios-modal-score {
  font-size: 15px;
  color: var(--ios-text-secondary);
  margin: 0 0 24px;
}

.ios-modal-btn {
  width: 100%;
}
</style>
