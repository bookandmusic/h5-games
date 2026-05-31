import { BOARD_SIZE, DIRECTIONS } from '../constants'
import type { Board, Disk, DiskColor, Move, Position } from '../types'

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )

  board[3][3] = { color: 'white' }
  board[3][4] = { color: 'black' }
  board[4][3] = { color: 'black' }
  board[4][4] = { color: 'white' }

  return board
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

export function getDisk(board: Board, pos: Position): Disk | null {
  return board[pos.row]?.[pos.col] ?? null
}

export function setDisk(board: Board, pos: Position, disk: Disk | null): void {
  board[pos.row][pos.col] = disk
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function countDisks(board: Board, color: DiskColor): number {
  let count = 0
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (board[r][c]?.color === color) count += 1
    }
  }
  return count
}

export function opponent(color: DiskColor): DiskColor {
  return color === 'black' ? 'white' : 'black'
}

export function getFlippedPositions(
  board: Board,
  row: number,
  col: number,
  color: DiskColor
): Position[] {
  if (board[row][col] !== null) return []

  const flipped: Position[] = []
  const enemy = opponent(color)

  for (const [dr, dc] of DIRECTIONS) {
    const line: Position[] = []
    let r = row + dr
    let c = col + dc

    while (isInBounds(r, c) && board[r][c]?.color === enemy) {
      line.push({ row: r, col: c })
      r += dr
      c += dc
    }

    if (line.length > 0 && isInBounds(r, c) && board[r][c]?.color === color) {
      flipped.push(...line)
    }
  }

  return flipped
}

export function getLegalMoves(board: Board, color: DiskColor): Move[] {
  const moves: Move[] = []

  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const flipped = getFlippedPositions(board, r, c, color)
      if (flipped.length > 0) {
        moves.push({ position: { row: r, col: c }, flipped })
      }
    }
  }

  return moves
}

export function hasLegalMove(board: Board, color: DiskColor): boolean {
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (board[r][c] !== null) continue
      if (getFlippedPositions(board, r, c, color).length > 0) return true
    }
  }
  return false
}

export function applyMove(board: Board, move: Move, color: DiskColor): Board {
  const newBoard = cloneBoard(board)

  newBoard[move.position.row][move.position.col] = { color }

  for (const pos of move.flipped) {
    newBoard[pos.row][pos.col] = { color }
  }

  return newBoard
}
