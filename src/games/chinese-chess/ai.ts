import { applyMove, generateLegalMoves, getWinner, isCheckmateThreat } from './engine'
import type { Board, Difficulty, Move, Piece, PieceColor } from './types'

const pieceValues: Record<Piece['type'], number> = {
  general: 10000,
  advisor: 110,
  elephant: 110,
  horse: 320,
  chariot: 600,
  cannon: 340,
  soldier: 70,
}

const withPerspective = (value: number, pieceColor: PieceColor, perspective: PieceColor) => {
  return pieceColor === perspective ? value : -value
}

const evaluatePiece = (piece: Piece, row: number, perspective: PieceColor) => {
  let score = pieceValues[piece.type]

  if (piece.type === 'soldier') {
    const advanced = piece.color === 'red' ? 9 - row : row
    score += advanced * 12
    const crossedRiver = piece.color === 'red' ? row <= 4 : row >= 5
    if (crossedRiver) score += 30
  }

  if (piece.type === 'horse' || piece.type === 'cannon') {
    const centrality = 4 - Math.abs(4 - row)
    score += Math.max(0, centrality * 8)
  }

  return withPerspective(score, piece.color, perspective)
}

export const evaluateBoard = (board: Board, perspective: PieceColor) => {
  let score = 0

  board.forEach((row, rowIndex) => {
    row.forEach((piece) => {
      if (!piece) return
      score += evaluatePiece(piece, rowIndex, perspective)
    })
  })

  return score
}

const moveHeuristic = (move: Move, color: PieceColor) => {
  let score = 0
  if (move.captured) score += pieceValues[move.captured.type] * 8 - pieceValues[move.piece.type]
  if (move.to.col === 4) score += 24
  if (move.piece.type === 'soldier') {
    score += move.piece.color === 'red' ? (9 - move.to.row) * 3 : move.to.row * 3
  }
  if (color !== move.piece.color) score *= -1
  return score
}

const sortMoves = (moves: Move[], color: PieceColor) => {
  return [...moves].sort((a, b) => moveHeuristic(b, color) - moveHeuristic(a, color))
}

const negamax = (
  board: Board,
  color: PieceColor,
  depth: number,
  alpha: number,
  beta: number
): { score: number; move: Move | null } => {
  const winner = getWinner(board, color)
  if (winner) {
    return {
      score: winner === color ? 999999 : -999999,
      move: null,
    }
  }

  if (depth === 0) {
    return { score: evaluateBoard(board, color), move: null }
  }

  let bestMove: Move | null = null
  let bestScore = -Infinity
  const moves = sortMoves(generateLegalMoves(board, color), color)

  for (const move of moves) {
    const nextBoard = applyMove(board, move)
    const nextColor = color === 'red' ? 'black' : 'red'
    const child = negamax(nextBoard, nextColor, depth - 1, -beta, -alpha)
    let score = -child.score
    if (isCheckmateThreat(nextBoard, color)) score += 80

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }

    alpha = Math.max(alpha, score)
    if (alpha >= beta) break
  }

  return { score: bestScore, move: bestMove }
}

export const chooseAiMove = (
  board: Board,
  color: PieceColor,
  difficulty: Difficulty
): Move | null => {
  const moves = generateLegalMoves(board, color)
  if (moves.length === 0) return null

  if (difficulty === 'easy') {
    const sorted = sortMoves(moves, color)
    const pool = sorted.slice(0, Math.min(4, sorted.length))
    return pool[Math.floor(Math.random() * pool.length)] ?? sorted[0]
  }

  if (difficulty === 'medium') {
    let bestMove = moves[0]
    let bestScore = -Infinity
    for (const move of moves) {
      const score = -evaluateBoard(applyMove(board, move), color === 'red' ? 'black' : 'red')
      const tactical = move.captured ? pieceValues[move.captured.type] * 10 : 0
      if (score + tactical > bestScore) {
        bestScore = score + tactical
        bestMove = move
      }
    }
    return bestMove
  }

  const depth = moves.length <= 18 ? 3 : 2
  return negamax(board, color, depth, -Infinity, Infinity).move ?? moves[0]
}
