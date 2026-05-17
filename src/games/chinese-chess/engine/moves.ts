import {
  BOARD_COLS,
  BOARD_ROWS,
  PALACE_COLUMNS,
  RED_PALACE_ROWS,
  BLACK_PALACE_ROWS,
  RED_SIDE_ROWS,
  BLACK_SIDE_ROWS,
} from '../constants'
import type { Board, Move, Piece, PieceColor, Position } from '../types'

const inBounds = (row: number, col: number) =>
  row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS

const isInPalace = (row: number, col: number, color: PieceColor) => {
  if (!PALACE_COLUMNS.has(col)) return false
  return color === 'red' ? RED_PALACE_ROWS.has(row) : BLACK_PALACE_ROWS.has(row)
}

const isOwnSide = (row: number, color: PieceColor) => {
  return color === 'red' ? RED_SIDE_ROWS.has(row) : BLACK_SIDE_ROWS.has(row)
}

const getPiece = (board: Board, position: Position) => board[position.row]?.[position.col] ?? null

const pushMoveIfValid = (
  board: Board,
  moves: Move[],
  piece: Piece,
  from: Position,
  to: Position
) => {
  if (!inBounds(to.row, to.col)) return
  const target = board[to.row][to.col]
  if (target && target.color === piece.color) return
  moves.push({ from, to, piece, captured: target })
}

const getGeneralPosition = (board: Board, color: PieceColor): Position | null => {
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

const getFlyingGeneralMove = (board: Board, piece: Piece, from: Position): Move | null => {
  const enemy = piece.color === 'red' ? 'black' : 'red'
  const enemyGeneral = getGeneralPosition(board, enemy)
  if (!enemyGeneral || enemyGeneral.col !== from.col) return null

  const step = enemyGeneral.row > from.row ? 1 : -1
  for (let row = from.row + step; row !== enemyGeneral.row; row += step) {
    if (board[row][from.col]) return null
  }

  return { from, to: enemyGeneral, piece, captured: board[enemyGeneral.row][enemyGeneral.col] }
}

const generateHorseMoves = (board: Board, piece: Piece, from: Position): Move[] => {
  const moves: Move[] = []
  ;(
    [
      { leg: [-1, 0], delta: [-2, -1] },
      { leg: [-1, 0], delta: [-2, 1] },
      { leg: [1, 0], delta: [2, -1] },
      { leg: [1, 0], delta: [2, 1] },
      { leg: [0, -1], delta: [-1, -2] },
      { leg: [0, -1], delta: [1, -2] },
      { leg: [0, 1], delta: [-1, 2] },
      { leg: [0, 1], delta: [1, 2] },
    ] as const
  ).forEach(({ leg, delta }) => {
    const legRow = from.row + leg[0]
    const legCol = from.col + leg[1]
    if (!inBounds(legRow, legCol) || board[legRow][legCol]) return
    pushMoveIfValid(board, moves, piece, from, {
      row: from.row + delta[0],
      col: from.col + delta[1],
    })
  })
  return moves
}

const generateSlidingMoves = (
  board: Board,
  piece: Piece,
  from: Position,
  cannon: boolean
): Move[] => {
  const moves: Move[] = []
  ;(
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const
  ).forEach(([dr, dc]) => {
    let row = from.row + dr
    let col = from.col + dc
    let jumped = false

    while (inBounds(row, col)) {
      const target = board[row][col]
      if (!cannon) {
        if (!target) {
          moves.push({ from, to: { row, col }, piece })
        } else {
          if (target.color !== piece.color) {
            moves.push({ from, to: { row, col }, piece, captured: target })
          }
          break
        }
      } else if (!jumped) {
        if (!target) {
          moves.push({ from, to: { row, col }, piece })
        } else {
          jumped = true
        }
      } else if (target) {
        if (target.color !== piece.color) {
          moves.push({ from, to: { row, col }, piece, captured: target })
        }
        break
      }

      row += dr
      col += dc
    }
  })
  return moves
}

export const generatePseudoLegalMoves = (board: Board, from: Position): Move[] => {
  const piece = getPiece(board, from)
  if (!piece) return []

  const moves: Move[] = []

  switch (piece.type) {
    case 'general': {
      ;(
        [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const
      ).forEach(([dr, dc]) => {
        const to = { row: from.row + dr, col: from.col + dc }
        if (isInPalace(to.row, to.col, piece.color)) {
          pushMoveIfValid(board, moves, piece, from, to)
        }
      })
      const flyingMove = getFlyingGeneralMove(board, piece, from)
      if (flyingMove) moves.push(flyingMove)
      break
    }
    case 'advisor': {
      ;(
        [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ] as const
      ).forEach(([dr, dc]) => {
        const to = { row: from.row + dr, col: from.col + dc }
        if (isInPalace(to.row, to.col, piece.color)) {
          pushMoveIfValid(board, moves, piece, from, to)
        }
      })
      break
    }
    case 'elephant': {
      ;(
        [
          [-2, -2],
          [-2, 2],
          [2, -2],
          [2, 2],
        ] as const
      ).forEach(([dr, dc]) => {
        const eyeRow = from.row + dr / 2
        const eyeCol = from.col + dc / 2
        const to = { row: from.row + dr, col: from.col + dc }
        if (!inBounds(to.row, to.col) || !isOwnSide(to.row, piece.color) || board[eyeRow][eyeCol])
          return
        pushMoveIfValid(board, moves, piece, from, to)
      })
      break
    }
    case 'horse':
      return generateHorseMoves(board, piece, from)
    case 'chariot':
      return generateSlidingMoves(board, piece, from, false)
    case 'cannon':
      return generateSlidingMoves(board, piece, from, true)
    case 'soldier': {
      const direction = piece.color === 'red' ? -1 : 1
      pushMoveIfValid(board, moves, piece, from, { row: from.row + direction, col: from.col })
      const crossedRiver = piece.color === 'red' ? from.row <= 4 : from.row >= 5
      if (crossedRiver) {
        pushMoveIfValid(board, moves, piece, from, { row: from.row, col: from.col - 1 })
        pushMoveIfValid(board, moves, piece, from, { row: from.row, col: from.col + 1 })
      }
      break
    }
  }

  return moves
}
