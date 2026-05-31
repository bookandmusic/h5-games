import { computed, ref, toRaw } from 'vue'

import {
  applyMove,
  cloneBoard,
  countDisks,
  createInitialBoard,
  getLegalMoves,
  opponent,
} from '../engine'
import { getGameStatus } from '../engine/judge'
import type { Board, DiskColor, GameHistory, GameStatus, Move, Position } from '../types'

export function useReversiGameState() {
  const board = ref<Board>(createInitialBoard())
  const currentPlayer = ref<DiskColor>('black')
  const selected = ref<Position | null>(null)
  const legalMoves = ref<Move[]>([])
  const status = ref<GameStatus>('playing')
  const moveCount = ref(0)
  const history = ref<GameHistory[]>([])
  const hintMove = ref<Move | null>(null)
  const skippedLastTurn = ref(false)

  const blackCount = computed(() => countDisks(board.value, 'black'))
  const whiteCount = computed(() => countDisks(board.value, 'white'))

  const clearSelection = () => {
    selected.value = null
    legalMoves.value = []
  }

  const refreshLegalMoves = () => {
    legalMoves.value = getLegalMoves(board.value, currentPlayer.value)
    if (legalMoves.value.length > 0) {
      const firstMove = legalMoves.value[0]
      selected.value = firstMove.position
    }
  }

  const syncStatus = () => {
    status.value = getGameStatus(board.value, currentPlayer.value)
  }

  const commitMove = (move: Move) => {
    history.value.push({
      board: cloneBoard(toRaw(board.value)),
      currentPlayer: currentPlayer.value,
      blackCount: blackCount.value,
      whiteCount: whiteCount.value,
      move,
    })

    board.value = applyMove(board.value, move, currentPlayer.value)
    currentPlayer.value = opponent(currentPlayer.value)
    moveCount.value += 1
    skippedLastTurn.value = false
    clearSelection()
    hintMove.value = null
    syncStatus()

    refreshLegalMoves()

    if (status.value === 'playing' && legalMoves.value.length === 0) {
      skipTurn()
    }
  }

  const skipTurn = () => {
    skippedLastTurn.value = true
    currentPlayer.value = opponent(currentPlayer.value)
    syncStatus()
    refreshLegalMoves()
  }

  const handleCellClick = (pos: Position): Move | null => {
    if (status.value !== 'playing') return null

    const move = legalMoves.value.find(
      (m) => m.position.row === pos.row && m.position.col === pos.col
    )
    return move ?? null
  }

  const resetBoard = () => {
    history.value = []
    board.value = createInitialBoard()
    currentPlayer.value = 'black'
    status.value = 'playing'
    moveCount.value = 0
    skippedLastTurn.value = false
    clearSelection()
    hintMove.value = null
    refreshLegalMoves()
  }

  const undoLastMove = (): boolean => {
    if (history.value.length < 1) return false

    const prev = history.value.pop()!
    board.value = prev.board
    currentPlayer.value = prev.currentPlayer
    moveCount.value = Math.max(0, moveCount.value - 1)
    skippedLastTurn.value = false
    clearSelection()
    hintMove.value = null
    syncStatus()
    refreshLegalMoves()
    return true
  }

  const restoreState = (state: { board: Board; currentPlayer: DiskColor; moveCount: number }) => {
    board.value = state.board
    currentPlayer.value = state.currentPlayer
    moveCount.value = state.moveCount
    syncStatus()
    refreshLegalMoves()
  }

  return {
    board,
    currentPlayer,
    selected,
    legalMoves,
    status,
    moveCount,
    history,
    hintMove,
    skippedLastTurn,
    blackCount,
    whiteCount,
    clearSelection,
    refreshLegalMoves,
    syncStatus,
    commitMove,
    skipTurn,
    handleCellClick,
    resetBoard,
    undoLastMove,
    restoreState,
  }
}
