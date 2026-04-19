<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useRouter } from 'vue-router'

import { gameStorage } from '../../stores/gameStorage'
import { chooseAiMove } from './ai'
import {
  BOARD_COLS,
  BOARD_ROWS,
  applyMove,
  createInitialBoard,
  generateLegalMoves,
  getPieceLabel,
  getWinner,
  isInCheck,
} from './engine'
import { musicManager } from './musicManager'
import { settingsStore } from './settingsStore'
import type { Board, MatchConfig, MatchState, Move, Piece, PieceColor, Position } from './types'

const router = useRouter()
const GAME_ID = 'chinese-chess'

const board = ref(createInitialBoard())
const currentTurn = ref<PieceColor>('red')
const selected = ref<Position | null>(null)
const legalMoves = ref<Move[]>([])
const winner = ref<PieceColor | null>(null)
const moveCount = ref(0)
const thinking = ref(false)
const loaded = ref(false)
const moveHistory = ref<Array<{ board: Board; turn: PieceColor; moveCount: number }>>([])
const activeConfig = ref<MatchConfig>({
  mode: 'ai',
  difficulty: 'medium',
  humanSide: 'red',
  startingSide: 'red',
})
let aiTimer: number | null = null

const showSetupModal = ref(false)
const showResultModal = ref(false)
const showResignModal = ref(false)
const setupMode = ref<'ai' | 'local'>('ai')
const isRestartModal = ref(false)
const draftConfig = ref<MatchConfig>({
  mode: 'ai',
  difficulty: 'medium',
  humanSide: 'red',
  startingSide: 'red',
})

interface PendingState {
  mode: 'ai' | 'local'
  resume: boolean
}

const animatingMove = ref<{
  move: Move
  piece: Piece
  capturedPiece: Piece | null
  fromPos: { x: number; y: number }
  toPos: { x: number; y: number }
  phase: 'preview' | 'move'
} | null>(null)
// eslint-disable-next-line no-undef
const boardFrameRef = ref<HTMLElement | null>(null)

const pieceImages: Record<string, string> = {
  red_general: new URL('./assets/imgs/red_general.png', import.meta.url).href,
  red_advisor: new URL('./assets/imgs/red_guard.png', import.meta.url).href,
  red_elephant: new URL('./assets/imgs/red_minister.png', import.meta.url).href,
  red_horse: new URL('./assets/imgs/red_horse.png', import.meta.url).href,
  red_chariot: new URL('./assets/imgs/red_chariot.png', import.meta.url).href,
  red_cannon: new URL('./assets/imgs/red_cannon.png', import.meta.url).href,
  red_soldier: new URL('./assets/imgs/red_soldier.png', import.meta.url).href,
  black_general: new URL('./assets/imgs/black_general.png', import.meta.url).href,
  black_advisor: new URL('./assets/imgs/black_guard.png', import.meta.url).href,
  black_elephant: new URL('./assets/imgs/black_minister.png', import.meta.url).href,
  black_horse: new URL('./assets/imgs/black_horse.png', import.meta.url).href,
  black_chariot: new URL('./assets/imgs/black_chariot.png', import.meta.url).href,
  black_cannon: new URL('./assets/imgs/black_cannon.png', import.meta.url).href,
  black_soldier: new URL('./assets/imgs/black_soldier.png', import.meta.url).href,
}

const orientation = computed(() => {
  if (activeConfig.value.mode === 'ai' && activeConfig.value.humanSide === 'black') {
    return 'black'
  }
  return 'red'
})

const aiSide = computed<PieceColor>(() => {
  if (activeConfig.value.humanSide === 'red') return 'black'
  return 'red'
})

const isAiTurn = computed(() => {
  return (
    activeConfig.value.mode === 'ai' && winner.value === null && currentTurn.value === aiSide.value
  )
})

const canUndo = computed(() => {
  if (moveHistory.value.length === 0) return false
  if (winner.value !== null) return false
  if (thinking.value) return false
  return true
})

const inCheck = computed(() => {
  return winner.value === null && isInCheck(board.value, currentTurn.value)
})

const statusLine = computed(() => {
  if (winner.value !== null) {
    return (winner.value === 'red' ? '红方' : '黑方') + '获胜'
  }
  if (thinking.value) return 'AI 思考中...'
  const turn = currentTurn.value === 'red' ? '红方' : '黑方'
  const check = inCheck.value ? ' · 被将军' : ''
  if (activeConfig.value.mode === 'ai') {
    const who = currentTurn.value === activeConfig.value.humanSide ? '你' : 'AI'
    return turn + '行动 · ' + who + check
  }
  return turn + '行动' + check
})

const setupModalTitle = computed(() => {
  if (isRestartModal.value) {
    return '重开一局'
  }
  return setupMode.value === 'ai' ? '人机对战' : '双人对战'
})

const displayedRows = computed(() => {
  if (orientation.value === 'red') {
    return Array.from({ length: BOARD_ROWS }, (_, index) => index)
  }
  return Array.from({ length: BOARD_ROWS }, (_, index) => BOARD_ROWS - 1 - index)
})

const displayedCols = computed(() => {
  if (orientation.value === 'red') {
    return Array.from({ length: BOARD_COLS }, (_, index) => index)
  }
  return Array.from({ length: BOARD_COLS }, (_, index) => BOARD_COLS - 1 - index)
})

const getActualPosition = (displayRow: number, displayCol: number): Position => {
  return {
    row: displayedRows.value[displayRow],
    col: displayedCols.value[displayCol],
  }
}

const isSelected = (position: Position) => {
  return selected.value?.row === position.row && selected.value?.col === position.col
}

const canHumanAct = () => {
  return activeConfig.value.mode === 'local' || currentTurn.value === activeConfig.value.humanSide
}

const clearSelection = () => {
  selected.value = null
  legalMoves.value = []
}

const getPieceImage = (piece: Piece | null) => {
  if (piece === null) return ''
  return pieceImages[piece.color + '_' + piece.type]
}

const getPieceAlt = (piece: Piece | null) => {
  if (piece === null) return ''
  return getPieceLabel(piece)
}

const getPixelPosition = (row: number, col: number): { x: number; y: number } => {
  if (!boardFrameRef.value) return { x: 0, y: 0 }
  const rect = boardFrameRef.value.getBoundingClientRect()
  const paddingH = 18
  const paddingV = 16
  const boardWidth = rect.width - paddingH * 2
  const boardHeight = rect.height - paddingV * 2
  const displayRow = orientation.value === 'red' ? row : BOARD_ROWS - 1 - row
  const displayCol = orientation.value === 'red' ? col : BOARD_COLS - 1 - col
  const x = paddingH + (displayCol / BOARD_COLS) * boardWidth
  const y = paddingV + (displayRow / (BOARD_ROWS - 1)) * boardHeight
  return { x, y }
}

const startAttackAnimation = (move: Move) => {
  const piece = board.value[move.from.row][move.from.col]
  const capturedPiece = board.value[move.to.row][move.to.col]
  if (!piece) return
  const fromPos = getPixelPosition(move.from.row, move.from.col)
  const toPos = getPixelPosition(move.to.row, move.to.col)
  animatingMove.value = {
    move,
    piece,
    capturedPiece,
    fromPos,
    toPos,
    phase: 'preview',
  }
  clearSelection()
  window.setTimeout(() => {
    if (animatingMove.value) {
      animatingMove.value.phase = 'move'
    }
    window.setTimeout(() => {
      void commitMove(move)
      animatingMove.value = null
    }, 350)
  }, 500)
}

const getStateKey = () => {
  return activeConfig.value.mode === 'ai' ? GAME_ID : GAME_ID + '-local'
}

const persistState = async () => {
  const state: MatchState = {
    board: board.value,
    currentTurn: currentTurn.value,
    winner: winner.value,
    config: activeConfig.value,
    moveCount: moveCount.value,
  }
  await gameStorage.saveGameState(getStateKey(), state)
}

const saveHistory = () => {
  moveHistory.value.push({
    board: JSON.parse(JSON.stringify(board.value)),
    turn: currentTurn.value,
    moveCount: moveCount.value,
  })
}

const undoMove = async () => {
  if (!canUndo.value) return
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer)
    aiTimer = null
  }
  thinking.value = false

  if (activeConfig.value.mode === 'ai') {
    const isPlayerTurn = currentTurn.value === activeConfig.value.humanSide
    const stepsToUndo = isPlayerTurn ? 2 : 1
    const lastIndex = moveHistory.value.length - stepsToUndo
    if (lastIndex < 0) {
      const fallbackState = moveHistory.value[0]
      if (!fallbackState) return
      board.value = fallbackState.board
      currentTurn.value = fallbackState.turn
      moveCount.value = fallbackState.moveCount
      moveHistory.value = []
    } else {
      const prevState = moveHistory.value[lastIndex]
      board.value = prevState.board
      currentTurn.value = prevState.turn
      moveCount.value = prevState.moveCount
      moveHistory.value.splice(lastIndex)
    }
  } else {
    const lastIndex = moveHistory.value.length - 1
    if (lastIndex < 0) return
    const prevState = moveHistory.value[lastIndex]
    board.value = prevState.board
    currentTurn.value = prevState.turn
    moveCount.value = prevState.moveCount
    moveHistory.value.splice(lastIndex)
  }

  winner.value = null
  clearSelection()
  await persistState()
}

const syncWinner = () => {
  winner.value = getWinner(board.value, currentTurn.value)
  if (winner.value !== null) {
    showResultModal.value = true
  }
}

const openResignModal = () => {
  showResignModal.value = true
}

const confirmResign = async () => {
  const opponent = activeConfig.value.humanSide === 'red' ? 'black' : 'red'
  winner.value = opponent
  showResignModal.value = false
  showResultModal.value = true
  await persistState()
}

const closeSetupModal = () => {
  showSetupModal.value = false
  if (!isRestartModal.value) {
    router.push(`/game/${GAME_ID}/home`)
  }
  isRestartModal.value = false
}

const startGame = async () => {
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer)
    aiTimer = null
  }
  thinking.value = false
  moveHistory.value = []

  activeConfig.value = { ...draftConfig.value }
  const stateKey = setupMode.value === 'ai' ? GAME_ID : GAME_ID + '-local'
  const state: MatchState = {
    board: createInitialBoard(),
    currentTurn: draftConfig.value.startingSide,
    winner: null,
    config: { ...draftConfig.value },
    moveCount: 0,
  }
  await gameStorage.saveGameState(stateKey, state)
  await gameStorage.clearGameState(GAME_ID + '-pending')
  showSetupModal.value = false
  isRestartModal.value = false
  restoreFromState(state)
  loaded.value = true
}

const goHome = () => {
  router.push(`/game/${GAME_ID}/home`)
}

const commitMove = async (move: Move) => {
  saveHistory()
  board.value = applyMove(board.value, move)
  currentTurn.value = currentTurn.value === 'red' ? 'black' : 'red'
  moveCount.value += 1
  clearSelection()
  syncWinner()
  await persistState()
}

const openRestartModal = () => {
  draftConfig.value = { ...activeConfig.value }
  setupMode.value = activeConfig.value.mode
  isRestartModal.value = true
  showSetupModal.value = true
}

const closeResultAndReview = () => {
  showResultModal.value = false
}

const openRestartModalFromResult = () => {
  showResultModal.value = false
  draftConfig.value = { ...activeConfig.value }
  setupMode.value = activeConfig.value.mode
  isRestartModal.value = true
  showSetupModal.value = true
}

const restoreFromState = (state: MatchState) => {
  board.value = state.board
  currentTurn.value = state.currentTurn
  winner.value = state.winner
  activeConfig.value = { ...state.config }
  moveCount.value = state.moveCount ?? 0
  clearSelection()
  if (winner.value !== null) {
    showResultModal.value = true
  }
}

const restoreState = async () => {
  const pending = await gameStorage.loadGameState<PendingState>(GAME_ID + '-pending')
  if (pending) {
    setupMode.value = pending.mode
    draftConfig.value = {
      mode: pending.mode,
      difficulty: 'medium',
      humanSide: 'red',
      startingSide: 'red',
    }
    isRestartModal.value = false
    const stateKey = pending.mode === 'ai' ? GAME_ID : GAME_ID + '-local'
    const saved = await gameStorage.loadGameState<MatchState>(stateKey)
    if (saved) {
      await gameStorage.clearGameState(GAME_ID + '-pending')
      restoreFromState(saved)
      loaded.value = true
      return
    }
    loaded.value = true
    showSetupModal.value = true
    return
  }

  const aiState = await gameStorage.loadGameState<MatchState>(GAME_ID)
  if (aiState) {
    restoreFromState(aiState)
    loaded.value = true
    return
  }

  const localState = await gameStorage.loadGameState<MatchState>(GAME_ID + '-local')
  if (localState) {
    restoreFromState(localState)
    loaded.value = true
    return
  }

  router.replace(`/game/${GAME_ID}/home`)
}

const handleSelect = (position: Position) => {
  if (winner.value !== null || thinking.value || canHumanAct() === false) return
  if (animatingMove.value !== null) return

  const piece = board.value[position.row][position.col]
  const existingMove = selected.value
    ? (legalMoves.value.find(
        (move) => move.to.row === position.row && move.to.col === position.col
      ) ?? null)
    : null

  if (existingMove !== null) {
    startAttackAnimation(existingMove)
    return
  }

  if (piece === null || piece.color !== currentTurn.value) {
    clearSelection()
    return
  }

  selected.value = position
  legalMoves.value = generateLegalMoves(board.value, currentTurn.value).filter(
    (move) => move.from.row === position.row && move.from.col === position.col
  )
}

const performAiTurn = () => {
  if (isAiTurn.value === false || thinking.value) return
  thinking.value = true

  const thinkDelay = 2000 + Math.random() * 3000
  aiTimer = window.setTimeout(() => {
    const move = chooseAiMove(board.value, currentTurn.value, activeConfig.value.difficulty)
    thinking.value = false
    aiTimer = null

    if (move === null) {
      syncWinner()
      void persistState()
      return
    }

    startAttackAnimation(move)
  }, thinkDelay)
}

watch(isAiTurn, (value) => {
  if (value) {
    performAiTurn()
  }
})

onMounted(async () => {
  await settingsStore.load()
  musicManager.play('02')
  await restoreState()
  if (loaded.value && isAiTurn.value) {
    performAiTurn()
  }
})

onBeforeUnmount(() => {
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer)
  }
})
</script>

<template>
  <div v-if="loaded" class="game-page">
    <header class="game-bar">
      <span class="status-text">{{ statusLine }}</span>
      <div class="bar-actions">
        <button v-if="canUndo" class="bar-btn undo" :disabled="!canUndo" @click="undoMove">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          <span class="btn-label">悔棋</span>
        </button>
        <button
          v-if="activeConfig.mode === 'ai' && winner === null"
          class="bar-btn resign"
          @click="openResignModal"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="btn-label">认输</span>
        </button>
        <button
          v-if="activeConfig.mode === 'local' && winner === null"
          class="bar-btn restart"
          @click="openRestartModal"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span class="btn-label">重开</span>
        </button>
        <button
          v-if="winner !== null && !showResultModal"
          class="bar-btn result"
          @click="showResultModal = true"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span class="btn-label">结束</span>
        </button>
      </div>
    </header>

    <section class="board-section">
      <div class="board-wrap">
        <div class="board-frame" ref="boardFrameRef">
          <div class="board-lines">
            <svg class="lines-svg" viewBox="0 0 8 9" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="1" y2="0" stroke="#5c3d2e" stroke-width="0.03" />
                  <line x1="0" y1="0" x2="0" y2="1" stroke="#5c3d2e" stroke-width="0.03" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="8" height="4" fill="url(#grid)" />
              <rect x="0" y="5" width="8" height="4" fill="url(#grid)" />
              <line x1="0" y1="0" x2="8" y2="0" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="0" y1="9" x2="8" y2="9" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="0" y1="0" x2="0" y2="9" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="8" y1="0" x2="8" y2="9" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="0" y1="4" x2="8" y2="4" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="0" y1="5" x2="8" y2="5" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="3" y1="0" x2="5" y2="2" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="5" y1="0" x2="3" y2="2" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="3" y1="7" x2="5" y2="9" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="5" y1="7" x2="3" y2="9" stroke="#5c3d2e" stroke-width="0.03" />
            </svg>
            <div class="river-text">楚 河 汉 界</div>
          </div>
          <div class="board-points">
            <template v-for="(actualRow, displayRow) in displayedRows" :key="'row-' + actualRow">
              <template
                v-for="(actualCol, displayCol) in displayedCols"
                :key="actualRow + '-' + actualCol"
              >
                <button
                  class="point"
                  :class="{
                    selected: isSelected(getActualPosition(displayRow, displayCol)),
                    target: legalMoves.some(
                      (move) =>
                        move.to.row === getActualPosition(displayRow, displayCol).row &&
                        move.to.col === getActualPosition(displayRow, displayCol).col
                    ),
                  }"
                  :style="{
                    left: `calc(${(displayCol / 8) * 100}% - var(--piece-size) / 2)`,
                    top: `calc(${(displayRow / 9) * 100}% - var(--piece-size) / 2)`,
                  }"
                  @click="handleSelect(getActualPosition(displayRow, displayCol))"
                >
                  <div
                    v-if="board[actualRow][actualCol]"
                    class="piece"
                    :class="board[actualRow][actualCol]?.color"
                  >
                    <img
                      class="piece-image"
                      :src="getPieceImage(board[actualRow][actualCol])"
                      :alt="getPieceAlt(board[actualRow][actualCol])"
                    />
                  </div>
                </button>
              </template>
            </template>
          </div>
          <div
            v-if="animatingMove && animatingMove.phase === 'move'"
            class="animating-piece"
            :class="animatingMove.piece.color"
            :style="{
              '--start-x': animatingMove.fromPos.x + 'px',
              '--start-y': animatingMove.fromPos.y + 'px',
              '--end-x': animatingMove.toPos.x + 'px',
              '--end-y': animatingMove.toPos.y + 'px',
            }"
          >
            <img
              class="piece-image"
              :src="getPieceImage(animatingMove.piece)"
              :alt="getPieceAlt(animatingMove.piece)"
            />
          </div>
        </div>
      </div>
    </section>

    <div v-if="animatingMove && animatingMove.phase === 'preview'" class="attack-preview-overlay">
      <div class="attack-preview-piece" :class="animatingMove.piece.color">
        <img
          class="attack-preview-image"
          :src="getPieceImage(animatingMove.piece)"
          :alt="getPieceAlt(animatingMove.piece)"
        />
      </div>
    </div>

    <div v-if="showSetupModal" class="modal-overlay" @click.self="closeSetupModal">
      <div class="setup-modal">
        <header class="modal-header">
          <h2 class="modal-title">{{ setupModalTitle }}</h2>
          <button class="modal-close" @click="closeSetupModal">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <section v-if="setupMode === 'ai'" class="settings-section">
            <h3 class="section-title">难度等级</h3>
            <div class="option-grid three-col">
              <button
                class="option-btn compact"
                :class="{ active: draftConfig.difficulty === 'easy' }"
                @click="draftConfig.difficulty = 'easy'"
              >
                <span class="option-label">简单</span>
              </button>
              <button
                class="option-btn compact"
                :class="{ active: draftConfig.difficulty === 'medium' }"
                @click="draftConfig.difficulty = 'medium'"
              >
                <span class="option-label">普通</span>
              </button>
              <button
                class="option-btn compact"
                :class="{ active: draftConfig.difficulty === 'hard' }"
                @click="draftConfig.difficulty = 'hard'"
              >
                <span class="option-label">困难</span>
              </button>
            </div>
          </section>

          <section v-if="setupMode === 'ai'" class="settings-section">
            <h3 class="section-title">执子方</h3>
            <div class="option-grid two-col">
              <button
                class="option-btn"
                :class="{ active: draftConfig.humanSide === 'red' }"
                @click="draftConfig.humanSide = 'red'"
              >
                <span class="option-label red">红方</span>
              </button>
              <button
                class="option-btn"
                :class="{ active: draftConfig.humanSide === 'black' }"
                @click="draftConfig.humanSide = 'black'"
              >
                <span class="option-label black">黑方</span>
              </button>
            </div>
          </section>

          <section class="settings-section">
            <h3 class="section-title">先手方</h3>
            <div class="option-grid two-col">
              <button
                class="option-btn"
                :class="{ active: draftConfig.startingSide === 'red' }"
                @click="draftConfig.startingSide = 'red'"
              >
                <span class="option-label red">红方先手</span>
              </button>
              <button
                class="option-btn"
                :class="{ active: draftConfig.startingSide === 'black' }"
                @click="draftConfig.startingSide = 'black'"
              >
                <span class="option-label black">黑方先手</span>
              </button>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="modal-btn secondary" @click="closeSetupModal">取消</button>
          <button class="modal-btn primary" @click="startGame">开始游戏</button>
        </footer>
      </div>
    </div>

    <div v-if="showResignModal" class="modal-overlay" @click.self="showResignModal = false">
      <div class="confirm-modal">
        <h2 class="confirm-title">确认认输</h2>
        <p class="confirm-desc">认输后将结束本局游戏</p>
        <div class="confirm-actions">
          <button class="modal-btn secondary" @click="showResignModal = false">取消</button>
          <button class="modal-btn danger" @click="confirmResign">认输</button>
        </div>
      </div>
    </div>

    <div v-if="showResultModal" class="result-overlay" role="dialog" aria-modal="true">
      <div class="result-card">
        <h2 class="result-title">{{ winner === 'red' ? '红方获胜' : '黑方获胜' }}</h2>
        <p class="result-sub">第 {{ moveCount }} 手</p>
        <div class="result-actions">
          <button class="result-btn home" @click="goHome">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>结束游戏</span>
          </button>
          <button class="result-btn restart" @click="openRestartModalFromResult">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>重开一局</span>
          </button>
          <button class="result-btn review" @click="closeResultAndReview">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>查看残局</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-page {
  --bg-deep: #1a0f0a;
  --bg-surface: #2d1810;
  --bg-card: #3d2518;
  --accent-gold: #c9a227;
  --accent-red: #b91c1c;
  --text-primary: #f5e6d3;
  --text-secondary: #a8927a;
  --board-wood: #d4a574;
  --board-wood-dark: #b8956a;

  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(201, 162, 39, 0.08), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(185, 28, 28, 0.06), transparent 50%),
    linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-surface) 50%, var(--bg-deep) 100%);
  color: var(--text-primary);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.game-bar {
  flex-shrink: 0;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border-bottom: 1px solid rgba(201, 162, 39, 0.15);
}

.status-text {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bar-actions {
  display: flex;
  gap: 10px;
}

.bar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid rgba(201, 162, 39, 0.2);
  border-radius: 12px;
  background: rgba(201, 162, 39, 0.08);
  color: var(--accent-gold);
  cursor: pointer;
  transition:
    transform 150ms ease,
    background 150ms ease,
    border-color 150ms ease;
}

.bar-btn:active {
  transform: scale(0.94);
  background: rgba(201, 162, 39, 0.16);
  border-color: rgba(201, 162, 39, 0.35);
}

.bar-btn.undo:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.bar-btn.resign {
  color: var(--accent-red);
  border-color: rgba(185, 28, 28, 0.2);
}

.bar-btn.restart {
  color: var(--accent-gold);
  border-color: rgba(201, 162, 39, 0.2);
}

.bar-btn.result {
  color: var(--accent-gold);
  border-color: rgba(201, 162, 39, 0.2);
}

.btn-label {
  font-size: 13px;
  font-weight: 600;
}

.board-section {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.board-wrap {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-frame {
  --piece-size: min(8vw, 8vh, 48px);
  width: min(100%, 720px);
  max-width: calc((100dvh - 100px) * 0.9);
  aspect-ratio: 8 / 9;
  position: relative;
  padding: 16px 18px;
  border-radius: 16px;
  border: 3px solid var(--board-wood-dark);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  background:
    linear-gradient(135deg, rgba(232, 212, 184, 0.92) 0%, rgba(184, 149, 106, 0.95) 100%),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 2px,
      rgba(139, 90, 43, 0.03) 2px,
      rgba(139, 90, 43, 0.03) 4px
    );
}

.board-lines {
  position: absolute;
  inset: 16px 18px;
  pointer-events: none;
}

.lines-svg {
  width: 100%;
  height: 100%;
}

.river-text {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  text-align: center;
  color: #5c3d2e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.35em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

.board-points {
  position: absolute;
  inset: 16px 18px;
}

.point {
  position: absolute;
  width: var(--piece-size);
  height: var(--piece-size);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease;
}

.point:active {
  transform: scale(0.96);
}

.point.selected {
  background: rgba(201, 162, 39, 0.2);
}

.point.target::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(185, 28, 28, 0.4);
  box-shadow: 0 0 4px rgba(185, 28, 28, 0.3);
}

.piece {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.25),
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.point.selected .piece {
  transform: scale(1.15);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.piece.red {
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(255, 235, 220, 0.95),
      rgba(245, 200, 180, 0.98) 60%,
      rgba(220, 160, 140, 0.95) 100%
    ),
    linear-gradient(180deg, #f5e0d0, #e0c0a0);
  border: 2px solid #b91c1c;
}

.piece.black {
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(60, 60, 65, 0.95),
      rgba(45, 45, 50, 0.98) 60%,
      rgba(35, 35, 40, 0.95) 100%
    ),
    linear-gradient(180deg, #4a4a4f, #353538);
  border: 2px solid #1f1f22;
}

.piece-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.animating-piece {
  position: absolute;
  width: var(--piece-size);
  height: var(--piece-size);
  left: var(--start-x);
  top: var(--start-y);
  transform: translate(-50%, -50%) scale(1.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  animation: attack-move 280ms ease-out forwards;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(185, 28, 28, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.animating-piece.red {
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(255, 235, 220, 0.95),
      rgba(245, 200, 180, 0.98) 60%,
      rgba(220, 160, 140, 0.95) 100%
    ),
    linear-gradient(180deg, #f5e0d0, #e0c0a0);
  border: 2px solid #b91c1c;
}

.animating-piece.black {
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(60, 60, 65, 0.95),
      rgba(45, 45, 50, 0.98) 60%,
      rgba(35, 35, 40, 0.95) 100%
    ),
    linear-gradient(180deg, #4a4a4f, #353538);
  border: 2px solid #1f1f22;
}

@keyframes attack-move {
  0% {
    left: var(--start-x);
    top: var(--start-y);
    transform: translate(-50%, -50%) scale(1.15);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.4);
  }
  100% {
    left: var(--end-x);
    top: var(--end-y);
    transform: translate(-50%, -50%) scale(1.15);
  }
}

.attack-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 15, 10, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: preview-fade-in 500ms ease-out;
}

@keyframes preview-fade-in {
  0% {
    opacity: 0;
    background: rgba(26, 15, 10, 0);
  }
  100% {
    opacity: 1;
    background: rgba(26, 15, 10, 0.6);
  }
}

.attack-preview-piece {
  width: min(50vw, 50vh);
  height: min(50vw, 50vh);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: preview-zoom 500ms ease-out;
}

@keyframes preview-zoom {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.attack-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 40px rgba(185, 28, 28, 0.6));
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 15, 10, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.setup-modal {
  width: min(100%, 340px);
  max-height: calc(100vh - 48px);
  border-radius: 20px;
  border: 2px solid rgba(201, 162, 39, 0.25);
  background:
    linear-gradient(180deg, rgba(61, 37, 24, 0.98), rgba(45, 24, 16, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(201, 162, 39, 0.1), transparent 60%);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(201, 162, 39, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-gold);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(201, 162, 39, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:active {
  background: rgba(201, 162, 39, 0.2);
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.option-grid {
  display: grid;
  gap: 8px;
}

.two-col {
  grid-template-columns: repeat(2, 1fr);
}

.three-col {
  grid-template-columns: repeat(3, 1fr);
}

.option-btn {
  border: 1px solid rgba(201, 162, 39, 0.15);
  border-radius: 12px;
  background: var(--bg-card);
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 150ms ease,
    background 150ms ease,
    border-color 150ms ease;
}

.option-btn:active {
  transform: scale(0.97);
}

.option-btn.active {
  background: linear-gradient(180deg, rgba(201, 162, 39, 0.18), rgba(201, 162, 39, 0.12));
  border-color: var(--accent-gold);
}

.option-btn.compact {
  padding: 8px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
}

.option-label.red {
  color: var(--accent-red);
}

.option-label.black {
  color: #64748b;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(201, 162, 39, 0.15);
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 150ms ease,
    background 150ms ease;
}

.modal-btn:active {
  transform: scale(0.96);
}

.modal-btn.primary {
  background: linear-gradient(180deg, var(--accent-gold), #a68520);
  color: #fff8e8;
  box-shadow: 0 2px 8px rgba(201, 162, 39, 0.3);
}

.modal-btn.secondary {
  background: rgba(201, 162, 39, 0.12);
  border: 1px solid rgba(201, 162, 39, 0.25);
  color: var(--accent-gold);
}

.modal-btn.danger {
  background: linear-gradient(180deg, var(--accent-red), #8b1515);
  color: #fff8e8;
}

.confirm-modal {
  width: min(100%, 280px);
  border-radius: 20px;
  border: 2px solid rgba(185, 28, 28, 0.25);
  background:
    linear-gradient(180deg, rgba(61, 37, 24, 0.98), rgba(45, 24, 16, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(185, 28, 28, 0.1), transparent 60%);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  padding: 20px;
  text-align: center;
}

.confirm-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-red);
}

.confirm-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 15, 10, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.result-card {
  width: min(100%, 360px);
  padding: 24px;
  border-radius: 20px;
  border: 2px solid rgba(201, 162, 39, 0.25);
  background:
    linear-gradient(180deg, rgba(61, 37, 24, 0.98), rgba(45, 24, 16, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(201, 162, 39, 0.1), transparent 60%);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.result-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: var(--accent-gold);
}

.result-sub {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    transform 150ms ease,
    background 150ms ease;
}

.result-btn:active {
  transform: scale(0.96);
}

.result-btn.home {
  background: rgba(201, 162, 39, 0.12);
  border: 1px solid rgba(201, 162, 39, 0.25);
  color: var(--accent-gold);
}

.result-btn.restart {
  background: linear-gradient(180deg, var(--accent-gold), #a68520);
  color: #fff8e8;
  box-shadow: 0 2px 8px rgba(201, 162, 39, 0.3);
}

.result-btn.review {
  background: transparent;
  border: 1px solid rgba(201, 162, 39, 0.2);
  color: var(--text-secondary);
}

@media (max-width: 600px) {
  .board-frame {
    --piece-size: min(10vw, 9vh, 42px);
    padding: 12px 14px;
    border-width: 2px;
  }

  .board-lines {
    inset: 12px 14px;
  }

  .river-text {
    font-size: 10px;
    letter-spacing: 0.25em;
  }

  .game-bar {
    padding: 8px 12px;
  }

  .bar-btn {
    padding: 6px 10px;
  }

  .btn-label {
    font-size: 12px;
  }

  .setup-modal {
    width: min(100%, 300px);
  }

  .modal-body {
    padding: 12px 16px;
  }

  .result-card {
    padding: 20px;
  }
}
</style>
