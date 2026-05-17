import type { Board, Piece, PieceColor } from '../types'
import { generateLegalMoves } from '../engine/judge'

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
        piece.color === perspective ? (ownAttackMap.get(key) ?? 0) : (oppAttackMap.get(key) ?? 0)
      const attackers =
        piece.color === perspective ? (oppAttackMap.get(key) ?? 0) : (ownAttackMap.get(key) ?? 0)

      if (attackers > 0) {
        const dangerBase = Math.floor(pieceValues[piece.type] * (defenders > 0 ? 0.16 : 0.36))
        score += withPerspective(-dangerBase * attackers, piece.color, perspective)
      }
    })
  })

  return score
}

export const pieceValue = (type: Piece['type']): number => pieceValues[type]
