import { describe, expect, it } from 'vitest'

import { applyMove, createInitialBoard, findMove, generateLegalMoves, isInCheck } from './engine'

describe('chinese chess engine', () => {
  it('creates the standard starting position', () => {
    const board = createInitialBoard()
    expect(board[9][4]?.type).toBe('general')
    expect(board[0][4]?.type).toBe('general')
    expect(board[7][1]?.type).toBe('cannon')
    expect(board[3][8]?.type).toBe('soldier')
  })

  it('prevents illegal horse movement when the leg is blocked', () => {
    const board = createInitialBoard()
    const horseMoves = generateLegalMoves(board, 'red').filter(
      (move) => move.from.row === 9 && move.from.col === 1
    )

    expect(horseMoves.some((move) => move.to.row === 7 && move.to.col === 0)).toBe(true)
    expect(horseMoves.some((move) => move.to.row === 8 && move.to.col === 3)).toBe(false)
  })

  it('keeps generals from facing each other directly', () => {
    let board = createInitialBoard()

    const redSoldierAdvance = findMove(board, 'red', { row: 6, col: 4 }, { row: 5, col: 4 })
    expect(redSoldierAdvance).not.toBeNull()
    board = applyMove(board, redSoldierAdvance!)

    const blackSoldierAdvance = findMove(board, 'black', { row: 3, col: 4 }, { row: 4, col: 4 })
    expect(blackSoldierAdvance).not.toBeNull()
    board = applyMove(board, blackSoldierAdvance!)

    expect(isInCheck(board, 'red')).toBe(false)
    expect(isInCheck(board, 'black')).toBe(false)
  })
})
