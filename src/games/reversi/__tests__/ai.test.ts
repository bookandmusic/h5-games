import { describe, expect, it } from 'vitest'

import { getAIMove } from '../ai'
import { applyMove, createInitialBoard, getLegalMoves } from '../engine'

describe('getAIMove', () => {
  it('returns a valid move for initial board', () => {
    const board = createInitialBoard()
    const move = getAIMove(board, 'black', 'easy')
    expect(move).not.toBeNull()
    if (move) {
      expect(move.position.row).toBeGreaterThanOrEqual(0)
      expect(move.position.row).toBeLessThan(8)
      expect(move.position.col).toBeGreaterThanOrEqual(0)
      expect(move.position.col).toBeLessThan(8)
    }
  })

  it('returns null when no legal moves', () => {
    const board = createInitialBoard()
    for (let r = 0; r < 8; r += 1) for (let c = 0; c < 8; c += 1) board[r][c] = null
    const move = getAIMove(board, 'black', 'hard')
    expect(move).toBeNull()
  })

  it('different difficulties produce valid moves', () => {
    const board = createInitialBoard()
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as const
    difficulties.forEach((d) => {
      const move = getAIMove(board, 'black', d)
      expect(move).not.toBeNull()
      if (move) {
        const legalMoves = getLegalMoves(board, 'black')
        const found = legalMoves.some(
          (m) => m.position.row === move.position.row && m.position.col === move.position.col
        )
        expect(found).toBe(true)
      }
    })
  })

  it('AI move can be applied to board', () => {
    const board = createInitialBoard()
    const move = getAIMove(board, 'black', 'medium')
    expect(move).not.toBeNull()
    if (move) {
      const newBoard = applyMove(board, move, 'black')
      expect(newBoard[move.position.row][move.position.col]?.color).toBe('black')
    }
  })
})
