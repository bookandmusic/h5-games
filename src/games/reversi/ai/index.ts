import { DIFFICULTY_DEPTH } from '../constants'
import type { Board, Difficulty, DiskColor, Move } from '../types'
import { getLegalMoves } from '../engine'
import { findBestMove } from './search'

export function getAIMove(board: Board, color: DiskColor, difficulty: Difficulty): Move | null {
  const moves = getLegalMoves(board, color)
  if (moves.length === 0) return null

  // Easy: 30% chance of random move — makes AI feel more natural,
  // gives beginners room to learn by letting them "win" sometimes
  if (difficulty === 'easy' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  const depth = DIFFICULTY_DEPTH[difficulty] ?? 3
  return findBestMove(board, color, depth)
}
