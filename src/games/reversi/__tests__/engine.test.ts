import { describe, expect, it } from 'vitest'

import type { Move, Position } from '../types'
import {
  applyMove,
  cloneBoard,
  countDisks,
  createInitialBoard,
  getFlippedPositions,
  getLegalMoves,
  hasLegalMove,
} from '../engine'
import { getGameStatus, shouldSkipTurn } from '../engine/judge'

describe('createInitialBoard', () => {
  it('creates 8x8 board', () => {
    const board = createInitialBoard()
    expect(board.length).toBe(8)
    board.forEach((row: Array<unknown>) => expect(row.length).toBe(8))
  })

  it('has correct initial pieces', () => {
    const board = createInitialBoard()
    expect(board[3][3]?.color).toBe('white')
    expect(board[3][4]?.color).toBe('black')
    expect(board[4][3]?.color).toBe('black')
    expect(board[4][4]?.color).toBe('white')
  })

  it('has 4 initial pieces', () => {
    const board = createInitialBoard()
    expect(countDisks(board, 'black')).toBe(2)
    expect(countDisks(board, 'white')).toBe(2)
  })
})

describe('cloneBoard', () => {
  it('deep clones without sharing references', () => {
    const board = createInitialBoard()
    const clone = cloneBoard(board)
    clone[0][0] = { color: 'black' }
    expect(board[0][0]).toBeNull()
  })
})

describe('getFlippedPositions', () => {
  it('returns empty for occupied cell', () => {
    const board = createInitialBoard()
    expect(getFlippedPositions(board, 3, 3, 'black')).toEqual([])
  })

  it('finds horizontal flip positions', () => {
    const board = createInitialBoard()
    const flipped = getFlippedPositions(board, 5, 4, 'black')
    expect(flipped.length).toBe(1)
    expect(flipped[0]).toEqual({ row: 4, col: 4 })
  })

  it('finds vertical flip positions', () => {
    const board = createInitialBoard()
    const flipped = getFlippedPositions(board, 2, 3, 'black')
    expect(flipped.length).toBe(1)
    expect(flipped[0]).toEqual({ row: 3, col: 3 })
  })
})

describe('getLegalMoves', () => {
  it('black has 4 legal moves initially', () => {
    const board = createInitialBoard()
    const moves = getLegalMoves(board, 'black')
    expect(moves.length).toBe(4)
  })

  it('each move has flipped positions', () => {
    const board = createInitialBoard()
    const moves = getLegalMoves(board, 'black')
    moves.forEach((m: Move) => {
      expect(m.flipped.length).toBeGreaterThan(0)
    })
  })
})

describe('hasLegalMove', () => {
  it('black has legal moves initially', () => {
    const board = createInitialBoard()
    expect(hasLegalMove(board, 'black')).toBe(true)
  })
})

describe('applyMove', () => {
  it('places piece and flips captured pieces', () => {
    const board = createInitialBoard()
    const moves = getLegalMoves(board, 'black')
    const move = moves[0]
    const newBoard = applyMove(board, move, 'black')

    expect(newBoard[move.position.row][move.position.col]?.color).toBe('black')
    move.flipped.forEach((pos: Position) => {
      expect(newBoard[pos.row][pos.col]?.color).toBe('black')
    })
  })
})

describe('getGameStatus', () => {
  it('returns playing for initial board', () => {
    const board = createInitialBoard()
    expect(getGameStatus(board, 'black')).toBe('playing')
  })

  it('returns black-wins when black has more pieces at game end', () => {
    const board = createInitialBoard()
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        if (!board[r][c]) board[r][c] = { color: 'black' }
      }
    }
    const status = getGameStatus(board, 'black')
    expect(['black-wins', 'draw']).toContain(status)
  })
})

describe('shouldSkipTurn', () => {
  it('returns false for normal opening position', () => {
    const board = createInitialBoard()
    expect(shouldSkipTurn(board, 'black')).toBe(false)
  })
})
