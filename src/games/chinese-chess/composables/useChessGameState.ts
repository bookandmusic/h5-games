import { computed, ref, toRaw } from 'vue'

import {
  BOARD_COLS,
  BOARD_ROWS,
  applyMove,
  createInitialBoard,
  generateLegalMoves,
  getWinner,
  isInCheck,
} from '../engine'
import type { Board, Move, PieceColor, Position } from '../types'

export function useChessGameState() {
  const board = ref(createInitialBoard())
  const currentTurn = ref<PieceColor>('red')
  const selected = ref<Position | null>(null)
  const legalMoves = ref<Move[]>([])
  const winner = ref<PieceColor | null>(null)
  const moveCount = ref(0)
  const moveHistory = ref<Array<{ board: Board; turn: PieceColor; moveCount: number }>>([])
  const hintMove = ref<Move | null>(null)

  const inCheck = computed(() => winner.value === null && isInCheck(board.value, currentTurn.value))

  const clearSelection = () => {
    selected.value = null
    legalMoves.value = []
  }

  const saveHistory = () => {
    moveHistory.value.push({
      board: structuredClone(toRaw(board.value)),
      turn: currentTurn.value,
      moveCount: moveCount.value,
    })
  }

  const commitMove = (move: Move) => {
    saveHistory()
    board.value = applyMove(board.value, move)
    currentTurn.value = currentTurn.value === 'red' ? 'black' : 'red'
    moveCount.value += 1
    clearSelection()
    hintMove.value = null
    syncWinner()
  }

  const syncWinner = () => {
    winner.value = getWinner(board.value, currentTurn.value)
  }

  const handleSelect = (pos: Position, isHumanTurn: boolean) => {
    if (winner.value !== null || !isHumanTurn) return

    const piece = board.value[pos.row][pos.col]
    const existingMove = selected.value
      ? (legalMoves.value.find((m) => m.to.row === pos.row && m.to.col === pos.col) ?? null)
      : null

    if (existingMove !== null) {
      return existingMove
    }
    if (piece === null || piece.color !== currentTurn.value) {
      clearSelection()
      return null
    }
    selected.value = pos
    legalMoves.value = generateLegalMoves(board.value, currentTurn.value).filter(
      (m) => m.from.row === pos.row && m.from.col === pos.col
    )
    return null
  }

  const resetBoard = () => {
    moveHistory.value = []
    winner.value = null
    board.value = createInitialBoard()
    currentTurn.value = 'red'
    moveCount.value = 0
    clearSelection()
    hintMove.value = null
  }

  const restoreState = (state: {
    board: Board
    currentTurn: PieceColor
    winner: PieceColor | null
    moveCount: number
  }) => {
    board.value = state.board
    currentTurn.value = state.currentTurn
    winner.value = state.winner
    moveCount.value = state.moveCount
  }

  return {
    board,
    currentTurn,
    selected,
    legalMoves,
    winner,
    moveCount,
    moveHistory,
    hintMove,
    inCheck,
    clearSelection,
    saveHistory,
    commitMove,
    syncWinner,
    handleSelect,
    resetBoard,
    restoreState,
    BOARD_ROWS,
    BOARD_COLS,
  }
}
