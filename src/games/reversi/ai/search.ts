import type { Board, DiskColor, Move } from '../types'
import { getLegalMoves, applyMove, opponent } from '../engine/board'
import { getGameStatus } from '../engine/judge'
import { evaluate } from './evaluate'

const C_SQUARES = [
  [1, 1],
  [1, 6],
  [6, 1],
  [6, 6],
] as const

function sortMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const isCorner = (r: number, c: number) => (r === 0 || r === 7) && (c === 0 || c === 7)
    const isEdge = (r: number, c: number) => r === 0 || r === 7 || c === 0 || c === 7
    const isC = (r: number, c: number) => C_SQUARES.some(([cr, cc]) => r === cr && c === cc)

    const scoreA = isCorner(a.position.row, a.position.col)
      ? 100
      : isEdge(a.position.row, a.position.col)
        ? 10
        : isC(a.position.row, a.position.col)
          ? -50
          : a.flipped.length

    const scoreB = isCorner(b.position.row, b.position.col)
      ? 100
      : isEdge(b.position.row, b.position.col)
        ? 10
        : isC(b.position.row, b.position.col)
          ? -50
          : b.flipped.length

    return scoreB - scoreA
  })
}

function alphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  color: DiskColor
): number {
  const currentPlayer = maximizing ? color : opponent(color)
  const status = getGameStatus(board, currentPlayer)

  if (status !== 'playing' || depth === 0) {
    return evaluate(board, color)
  }

  const moves = getLegalMoves(board, currentPlayer)

  if (moves.length === 0) {
    const nextPlayer = opponent(currentPlayer)
    const nextStatus = getGameStatus(board, nextPlayer)
    if (nextStatus !== 'playing') {
      return evaluate(board, color)
    }
    return alphaBeta(board, depth - 1, alpha, beta, !maximizing, color)
  }

  const sorted = sortMoves(moves)

  if (maximizing) {
    let maxEval = -Infinity
    for (const move of sorted) {
      const newBoard = applyMove(board, move, currentPlayer)
      const val = alphaBeta(newBoard, depth - 1, alpha, beta, false, color)
      maxEval = Math.max(maxEval, val)
      alpha = Math.max(alpha, val)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of sorted) {
      const newBoard = applyMove(board, move, currentPlayer)
      const val = alphaBeta(newBoard, depth - 1, alpha, beta, true, color)
      minEval = Math.min(minEval, val)
      beta = Math.min(beta, val)
      if (beta <= alpha) break
    }
    return minEval
  }
}

export function findBestMove(board: Board, color: DiskColor, depth: number): Move | null {
  const moves = getLegalMoves(board, color)
  if (moves.length === 0) return null
  if (moves.length === 1) return moves[0]

  const sorted = sortMoves(moves)

  let bestMove = sorted[0]
  let bestScore = -Infinity

  for (const move of sorted) {
    const newBoard = applyMove(board, move, color)
    const score = alphaBeta(newBoard, depth - 1, -Infinity, Infinity, false, color)

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}
