import { applyMove, generateLegalMoves, getWinner, isCheckmateThreat } from './engine'
import type { Board, Difficulty, Move, Piece, PieceColor, Position } from './types'

const pieceValues: Record<Piece['type'], number> = {
  general: 100000,
  advisor: 120,
  elephant: 120,
  horse: 360,
  chariot: 720,
  cannon: 390,
  soldier: 90,
}

const getOpponent = (color: PieceColor): PieceColor => (color === 'red' ? 'black' : 'red')

const withPerspective = (value: number, pieceColor: PieceColor, perspective: PieceColor) =>
  pieceColor === perspective ? value : -value

const inOwnHalf = (row: number, color: PieceColor) => (color === 'red' ? row >= 5 : row <= 4)

const getPositionValue = (piece: Piece, row: number, col: number) => {
  const centerFile = 4 - Math.abs(4 - col)

  switch (piece.type) {
    case 'soldier': {
      const advanced = piece.color === 'red' ? 9 - row : row
      const crossedRiver = piece.color === 'red' ? row <= 4 : row >= 5
      return advanced * 18 + (crossedRiver ? 36 : 0) + centerFile * 6
    }
    case 'horse':
      return centerFile * 12 + (inOwnHalf(row, piece.color) ? 0 : 22)
    case 'cannon':
      return centerFile * 10 + (inOwnHalf(row, piece.color) ? 0 : 16)
    case 'chariot':
      return centerFile * 6 + (inOwnHalf(row, piece.color) ? 0 : 12)
    case 'advisor':
      return col === 4 ? 12 : 4
    case 'elephant':
      return inOwnHalf(row, piece.color) ? 12 : -20
    case 'general':
      return col === 4 ? 10 : -8
  }
}

const evaluatePiece = (piece: Piece, row: number, col: number, perspective: PieceColor) => {
  const score = pieceValues[piece.type] + getPositionValue(piece, row, col)
  return withPerspective(score, piece.color, perspective)
}

const getAttackMap = (board: Board, color: PieceColor) => {
  const map = new Map<string, number>()
  const moves = generateLegalMoves(board, color)

  moves.forEach((move) => {
    const key = `${move.to.row},${move.to.col}`
    map.set(key, (map.get(key) ?? 0) + 1)
  })

  return map
}

export const evaluateBoard = (board: Board, perspective: PieceColor) => {
  const opponent = getOpponent(perspective)
  const ownAttackMap = getAttackMap(board, perspective)
  const oppAttackMap = getAttackMap(board, opponent)
  const ownMobility = ownAttackMap.size
  const oppMobility = oppAttackMap.size

  let score = (ownMobility - oppMobility) * 3

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (!piece) return

      score += evaluatePiece(piece, rowIndex, colIndex, perspective)

      const key = `${rowIndex},${colIndex}`
      const defenders =
        piece.color === perspective ? ownAttackMap.get(key) ?? 0 : oppAttackMap.get(key) ?? 0
      const attackers =
        piece.color === perspective ? oppAttackMap.get(key) ?? 0 : ownAttackMap.get(key) ?? 0

      if (attackers > 0) {
        const dangerBase = Math.floor(pieceValues[piece.type] * (defenders > 0 ? 0.16 : 0.36))
        score += withPerspective(-dangerBase * attackers, piece.color, perspective)
      }
    })
  })

  return score
}

const moveHeuristic = (move: Move) => {
  let score = 0

  if (move.captured) {
    score += pieceValues[move.captured.type] * 14 - pieceValues[move.piece.type] * 2
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

const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col

const getImmediateReplyThreat = (board: Board, color: PieceColor) => {
  const replies = generateLegalMoves(board, getOpponent(color))
  let maxThreat = 0

  replies.forEach((reply) => {
    if (!reply.captured) return
    maxThreat = Math.max(maxThreat, pieceValues[reply.captured.type])
  })

  return maxThreat
}

const getMovedPieceThreat = (board: Board, color: PieceColor, target: Position) => {
  const replies = generateLegalMoves(board, getOpponent(color))
  let movedPieceThreat = 0

  replies.forEach((reply) => {
    if (!reply.captured || !samePosition(reply.to, target)) return
    movedPieceThreat = Math.max(movedPieceThreat, pieceValues[reply.captured.type])
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
  const tacticalGain = move.captured ? pieceValues[move.captured.type] * 12 : 0
  const checkingBonus = isCheckmateThreat(nextBoard, color) ? 180 : 0
  const progressBonus = moveHeuristic(move)
  const replyThreat = getImmediateReplyThreat(nextBoard, color)
  const movedPieceThreat = getMovedPieceThreat(nextBoard, color, move.to)
  const movedPieceRisk = movedPieceThreat > 0 ? movedPieceThreat + Math.floor(pieceValues[move.piece.type] * 0.4) : 0
  const blunderPenalty = replyThreat + movedPieceRisk

  return {
    move,
    score: boardScore + tacticalGain + checkingBonus + progressBonus - blunderPenalty,
    tacticalScore: tacticalGain + checkingBonus + progressBonus,
    blunderPenalty,
    immediateLoss:
      winner === opponent ||
      replyThreat >= pieceValues.general ||
      movedPieceThreat >= pieceValues[move.piece.type],
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

  const assessments = moves.map((move) => assessMove(board, color, move)).sort((a, b) => b.score - a.score)
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
    return {
      score: winner === color ? 9_999_999 : -9_999_999,
      move: null,
    }
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

    if (move.captured) score += pieceValues[move.captured.type] * 2
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
    (item) => item.tacticalScore > 0 && item.blunderPenalty < pieceValues.horse
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

export const chooseAiMove = (
  board: Board,
  color: PieceColor,
  difficulty: Difficulty
): Move | null => {
  const moves = generateLegalMoves(board, color)
  if (moves.length === 0) return null

  const assessments = buildCandidatePool(board, color, sortMoves(moves))
  if (assessments.length === 0) return moves[0] ?? null

  if (difficulty === 'easy') {
    return pickEasyMove(assessments)
  }

  if (difficulty === 'medium') {
    return pickMediumMove(board, color, assessments)
  }

  return pickHardMove(board, color, assessments)
}
