import { BOARD_COLS, BOARD_ROWS } from '../constants'
import type { Board, Move, Piece, PieceColor, PieceType } from '../types'

const createPiece = (color: PieceColor, type: PieceType, index: number): Piece => ({
  id: `${color}-${type}-${index}`,
  color,
  type,
})

export const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((piece) => (piece ? { ...piece } : null)))

export const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  )

  const place = (row: number, col: number, color: PieceColor, type: PieceType, index: number) => {
    board[row][col] = createPiece(color, type, index)
  }

  ;(
    [
      [0, 0, 'black', 'chariot', 0],
      [0, 1, 'black', 'horse', 0],
      [0, 2, 'black', 'elephant', 0],
      [0, 3, 'black', 'advisor', 0],
      [0, 4, 'black', 'general', 0],
      [0, 5, 'black', 'advisor', 1],
      [0, 6, 'black', 'elephant', 1],
      [0, 7, 'black', 'horse', 1],
      [0, 8, 'black', 'chariot', 1],
      [2, 1, 'black', 'cannon', 0],
      [2, 7, 'black', 'cannon', 1],
      [3, 0, 'black', 'soldier', 0],
      [3, 2, 'black', 'soldier', 1],
      [3, 4, 'black', 'soldier', 2],
      [3, 6, 'black', 'soldier', 3],
      [3, 8, 'black', 'soldier', 4],
      [9, 0, 'red', 'chariot', 0],
      [9, 1, 'red', 'horse', 0],
      [9, 2, 'red', 'elephant', 0],
      [9, 3, 'red', 'advisor', 0],
      [9, 4, 'red', 'general', 0],
      [9, 5, 'red', 'advisor', 1],
      [9, 6, 'red', 'elephant', 1],
      [9, 7, 'red', 'horse', 1],
      [9, 8, 'red', 'chariot', 1],
      [7, 1, 'red', 'cannon', 0],
      [7, 7, 'red', 'cannon', 1],
      [6, 0, 'red', 'soldier', 0],
      [6, 2, 'red', 'soldier', 1],
      [6, 4, 'red', 'soldier', 2],
      [6, 6, 'red', 'soldier', 3],
      [6, 8, 'red', 'soldier', 4],
    ] as const
  ).forEach(([row, col, color, type, index]) => {
    place(row, col, color, type, index)
  })

  return board
}

export const applyMove = (board: Board, move: Move): Board => {
  const nextBoard = cloneBoard(board)
  nextBoard[move.from.row][move.from.col] = null
  nextBoard[move.to.row][move.to.col] = { ...move.piece }
  return nextBoard
}

export const getPieceLabel = (piece: Piece) => {
  const redNames: Record<PieceType, string> = {
    general: '帅',
    advisor: '仕',
    elephant: '相',
    horse: '马',
    chariot: '车',
    cannon: '炮',
    soldier: '兵',
  }
  const blackNames: Record<PieceType, string> = {
    general: '将',
    advisor: '士',
    elephant: '象',
    horse: '马',
    chariot: '车',
    cannon: '炮',
    soldier: '卒',
  }
  return piece.color === 'red' ? redNames[piece.type] : blackNames[piece.type]
}
