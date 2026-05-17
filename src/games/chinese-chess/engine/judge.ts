import { BOARD_COLS, BOARD_ROWS } from '../constants'
import type { Board, Move, PieceColor, Side } from '../types'
import { applyMove } from './board'
import { generatePseudoLegalMoves } from './moves'

const samePosition = (a: { row: number; col: number }, b: { row: number; col: number }) =>
  a.row === b.row && a.col === b.col

const getGeneralPosition = (
  board: Board,
  color: PieceColor
): { row: number; col: number } | null => {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = board[row][col]
      if (piece?.type === 'general' && piece.color === color) {
        return { row, col }
      }
    }
  }
  return null
}

export const hasGeneral = (board: Board, color: PieceColor) => {
  return getGeneralPosition(board, color) !== null
}

export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const general = getGeneralPosition(board, color)
  if (!general) return true

  const enemyColor: PieceColor = color === 'red' ? 'black' : 'red'
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = board[row][col]
      if (!piece || piece.color !== enemyColor) continue
      const enemyMoves = generatePseudoLegalMoves(board, { row, col })
      if (enemyMoves.some((move) => samePosition(move.to, general))) {
        return true
      }
    }
  }
  return false
}

export const generateLegalMoves = (board: Board, color: PieceColor): Move[] => {
  const moves: Move[] = []

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = board[row][col]
      if (!piece || piece.color !== color) continue
      const from = { row, col }
      const candidates = generatePseudoLegalMoves(board, from)
      candidates.forEach((move) => {
        const nextBoard = applyMove(board, move)
        if (!isInCheck(nextBoard, color)) {
          moves.push(move)
        }
      })
    }
  }

  return moves
}

export const findMove = (
  board: Board,
  color: PieceColor,
  from: { row: number; col: number },
  to: { row: number; col: number }
): Move | null => {
  const legalMoves = generateLegalMoves(board, color)
  return (
    legalMoves.find((move) => samePosition(move.from, from) && samePosition(move.to, to)) ?? null
  )
}

export const getWinner = (board: Board, currentTurn: PieceColor): Side | null => {
  const redAlive = hasGeneral(board, 'red')
  const blackAlive = hasGeneral(board, 'black')

  if (!redAlive) return 'black'
  if (!blackAlive) return 'red'

  const legalMoves = generateLegalMoves(board, currentTurn)
  if (legalMoves.length === 0) {
    return currentTurn === 'red' ? 'black' : 'red'
  }

  return null
}

export const isCheckmateThreat = (board: Board, currentTurn: PieceColor) => {
  const next: PieceColor = currentTurn === 'red' ? 'black' : 'red'
  return isInCheck(board, next)
}
