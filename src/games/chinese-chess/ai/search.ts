import type { Board, Move, PieceColor } from '../types'
import { applyMove } from '../engine/board'
import { generateLegalMoves, getWinner, isCheckmateThreat } from '../engine/judge'
import { evaluateBoard, pieceValue } from './evaluate'

const getOpponent = (color: PieceColor): PieceColor => (color === 'red' ? 'black' : 'red')

const samePosition = (a: { row: number; col: number }, b: { row: number; col: number }) =>
  a.row === b.row && a.col === b.col

const moveHeuristic = (move: Move) => {
  let score = 0
  if (move.captured) {
    score += pieceValue(move.captured.type) * 14 - pieceValue(move.piece.type) * 2
  }
  if (move.to.col === 4) score += 20
  if (move.piece.type === 'soldier') {
    score += move.piece.color === 'red' ? (9 - move.to.row) * 7 : move.to.row * 7
  }
  if (move.piece.type === 'horse' || move.piece.type === 'cannon') {
    score += (4 - Math.abs(4 - move.to.col)) * 8
  }
  return score
}

const sortMoves = (moves: Move[]) => [...moves].sort((a, b) => moveHeuristic(b) - moveHeuristic(a))

const findImmediateWinningMove = (board: Board, color: PieceColor, moves: Move[]) => {
  const opponent = getOpponent(color)
  return moves.find((move) => getWinner(applyMove(board, move), opponent) === color) ?? null
}

const getImmediateReplyThreat = (board: Board, color: PieceColor) => {
  const replies = generateLegalMoves(board, getOpponent(color))
  let maxThreat = 0
  replies.forEach((reply) => {
    if (!reply.captured) return
    maxThreat = Math.max(maxThreat, pieceValue(reply.captured.type))
  })
  return maxThreat
}

const getMovedPieceThreat = (
  board: Board,
  color: PieceColor,
  target: { row: number; col: number }
) => {
  const replies = generateLegalMoves(board, getOpponent(color))
  let movedPieceThreat = 0
  replies.forEach((reply) => {
    if (!reply.captured || !samePosition(reply.to, target)) return
    movedPieceThreat = Math.max(movedPieceThreat, pieceValue(reply.captured.type))
  })
  return movedPieceThreat
}

type MoveAssessment = {
  move: Move
  score: number
  tacticalScore: number
  blunderPenalty: number
  immediateLoss: boolean
  winning: boolean
}

const assessMove = (board: Board, color: PieceColor, move: Move): MoveAssessment => {
  const opponent = getOpponent(color)
  const nextBoard = applyMove(board, move)
  const winner = getWinner(nextBoard, opponent)

  if (winner === color) {
    return {
      move,
      score: 10_000_000,
      tacticalScore: 10_000_000,
      blunderPenalty: 0,
      immediateLoss: false,
      winning: true,
    }
  }

  const boardScore = evaluateBoard(nextBoard, color)
  const tacticalGain = move.captured ? pieceValue(move.captured.type) * 12 : 0
  const checkingBonus = isCheckmateThreat(nextBoard, color) ? 180 : 0
  const progressBonus = moveHeuristic(move)
  const replyThreat = getImmediateReplyThreat(nextBoard, color)
  const movedPieceThreat = getMovedPieceThreat(nextBoard, color, move.to)
  const movedPieceRisk =
    movedPieceThreat > 0 ? movedPieceThreat + Math.floor(pieceValue(move.piece.type) * 0.4) : 0
  const blunderPenalty = replyThreat + movedPieceRisk

  return {
    move,
    score: boardScore + tacticalGain + checkingBonus + progressBonus - blunderPenalty,
    tacticalScore: tacticalGain + checkingBonus + progressBonus,
    blunderPenalty,
    immediateLoss:
      winner === opponent ||
      replyThreat >= 100000 ||
      movedPieceThreat >= pieceValue(move.piece.type),
    winning: false,
  }
}

const buildCandidatePool = (board: Board, color: PieceColor, moves: Move[]) => {
  const forcedWin = findImmediateWinningMove(board, color, moves)
  if (forcedWin) {
    return [
      {
        move: forcedWin,
        score: 10_000_000,
        tacticalScore: 10_000_000,
        blunderPenalty: 0,
        immediateLoss: false,
        winning: true,
      },
    ]
  }

  const assessments = moves
    .map((move) => assessMove(board, color, move))
    .sort((a, b) => b.score - a.score)
  const safeMoves = assessments.filter((item) => !item.immediateLoss)

  if (safeMoves.length > 0) {
    const bestSafeScore = safeMoves[0].score
    return safeMoves.filter((item) => item.score >= bestSafeScore - 180)
  }

  return assessments.slice(0, 3)
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
    return { score: winner === color ? 9_999_999 : -9_999_999, move: null }
  }

  if (depth === 0) {
    return { score: evaluateBoard(board, color), move: null }
  }

  const moves = sortMoves(generateLegalMoves(board, color))
  if (moves.length === 0) {
    return { score: -9_999_999, move: null }
  }

  let bestMove: Move | null = null
  let bestScore = -Infinity

  for (const move of moves) {
    const nextBoard = applyMove(board, move)
    const child = negamax(nextBoard, getOpponent(color), depth - 1, -beta, -alpha)
    let score = -child.score

    if (move.captured) score += pieceValue(move.captured.type) * 2
    if (isCheckmateThreat(nextBoard, color)) score += 140

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }

    alpha = Math.max(alpha, score)
    if (alpha >= beta) break
  }

  return { score: bestScore, move: bestMove }
}

const pickEasyMove = (assessments: MoveAssessment[]) => {
  const tacticalMoves = assessments.filter(
    (item) => item.tacticalScore > 0 && item.blunderPenalty < 360
  )
  const pool = (tacticalMoves.length > 0 ? tacticalMoves : assessments).slice(0, 3)
  return pool[Math.floor(Math.random() * pool.length)]?.move ?? assessments[0]?.move ?? null
}

const pickMediumMove = (board: Board, color: PieceColor, assessments: MoveAssessment[]) => {
  let bestMove = assessments[0]?.move ?? null
  let bestScore = -Infinity

  assessments.slice(0, 6).forEach((item) => {
    const nextBoard = applyMove(board, item.move)
    const reply = negamax(nextBoard, getOpponent(color), 1, -Infinity, Infinity)
    const score = item.score - reply.score * 0.9
    if (score > bestScore) {
      bestScore = score
      bestMove = item.move
    }
  })

  return bestMove
}

const pickHardMove = (board: Board, color: PieceColor, assessments: MoveAssessment[]) => {
  const moves = assessments.map((item) => item.move)
  const depth = moves.length <= 10 ? 4 : moves.length <= 24 ? 3 : 2
  return negamax(board, color, depth, -Infinity, Infinity).move ?? assessments[0]?.move ?? null
}

const pickHardestMove = (board: Board, color: PieceColor, assessments: MoveAssessment[]) => {
  return negamax(board, color, 4, -Infinity, Infinity).move ?? assessments[0]?.move ?? null
}

export type { MoveAssessment }

export {
  buildCandidatePool,
  pickEasyMove,
  pickMediumMove,
  pickHardMove,
  pickHardestMove,
  sortMoves,
}
