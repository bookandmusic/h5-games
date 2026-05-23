import type { Board, Difficulty, Move, PieceColor } from '../types'
import { generateLegalMoves } from '../engine/judge'
import {
  buildCandidatePool,
  pickEasyMove,
  pickHardMove,
  pickHardestMove,
  pickMediumMove,
  sortMoves,
} from './search'

export const chooseAiMove = (
  board: Board,
  color: PieceColor,
  difficulty: Difficulty
): Move | null => {
  const moves = generateLegalMoves(board, color)
  if (moves.length === 0) return null

  if (difficulty === 'easy') {
    if (Math.random() < 0.25) {
      return moves[Math.floor(Math.random() * moves.length)] ?? null
    }
    const assessments = buildCandidatePool(board, color, sortMoves(moves))
    if (assessments.length === 0) return moves[0] ?? null
    return pickEasyMove(assessments)
  }

  const assessments = buildCandidatePool(board, color, sortMoves(moves))
  if (assessments.length === 0) return moves[0] ?? null

  if (difficulty === 'medium') return pickMediumMove(board, color, assessments)
  if (difficulty === 'hard') return pickHardMove(board, color, assessments)

  return pickHardestMove(board, color, assessments)
}
