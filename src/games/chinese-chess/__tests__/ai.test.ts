import { afterEach, describe, expect, it, vi } from 'vitest'

import { chooseAiMove } from '../ai'
import type { Board, Difficulty, Piece, PieceColor, PieceType } from '../types'

const createEmptyBoard = (): Board =>
  Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null))

const placePiece = (
  board: Board,
  row: number,
  col: number,
  color: PieceColor,
  type: PieceType,
  index = 0
) => {
  const piece: Piece = {
    id: `${color}-${type}-${index}`,
    color,
    type,
  }

  board[row][col] = piece
}

describe('chinese chess ai', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each<Difficulty>(['easy', 'medium', 'hard', 'hardest'])(
    'avoids hanging a major piece on %s difficulty',
    (difficulty) => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const board = createEmptyBoard()
      placePiece(board, 0, 4, 'black', 'general')
      placePiece(board, 9, 4, 'red', 'general')
      placePiece(board, 4, 4, 'black', 'chariot')
      placePiece(board, 6, 4, 'red', 'soldier')
      placePiece(board, 7, 4, 'red', 'chariot')

      const move = chooseAiMove(board, 'black', difficulty)

      expect(move).not.toBeNull()
      expect(move).not.toMatchObject({
        from: { row: 4, col: 4 },
        to: { row: 6, col: 4 },
      })
    }
  )

  it.each<Difficulty>(['easy', 'medium', 'hard', 'hardest'])(
    'takes an immediate winning move on %s difficulty',
    (difficulty) => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const board = createEmptyBoard()
      placePiece(board, 0, 3, 'black', 'general')
      placePiece(board, 9, 4, 'red', 'general')
      placePiece(board, 1, 4, 'black', 'chariot')

      const move = chooseAiMove(board, 'black', difficulty)

      expect(move).not.toBeNull()
      expect(move?.from).toEqual({ row: 1, col: 4 })
      expect(move?.to).toEqual({ row: 9, col: 4 })
      expect(move?.captured?.type).toBe('general')
    }
  )

  it('hardest difficulty captures the general with chariot', () => {
    const board = createEmptyBoard()
    placePiece(board, 0, 3, 'black', 'general')
    placePiece(board, 9, 4, 'red', 'general')
    placePiece(board, 8, 4, 'black', 'chariot')

    const move = chooseAiMove(board, 'black', 'hardest')

    expect(move).not.toBeNull()
    expect(move?.to).toEqual({ row: 9, col: 4 })
    expect(move?.captured?.type).toBe('general')
  })
})
