import { describe, expect, it } from 'vitest'

import {
  applyMove,
  createInitialBoard,
  findMove,
  generateLegalMoves,
  getWinner,
  isInCheck,
} from '../engine'
import type { Board, PieceColor, PieceType } from '../types'

const createEmptyBoard = (): Board =>
  Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null))

const place = (
  board: Board,
  row: number,
  col: number,
  color: PieceColor,
  type: PieceType,
  _index = 0
) => {
  board[row][col] = { id: `${color}-${type}-${_index}`, color, type }
}

describe('chinese chess engine', () => {
  describe('initial board', () => {
    it('creates the standard starting position', () => {
      const board = createInitialBoard()
      expect(board[9][4]?.type).toBe('general')
      expect(board[0][4]?.type).toBe('general')
      expect(board[7][1]?.type).toBe('cannon')
      expect(board[3][8]?.type).toBe('soldier')
    })
  })

  describe('piece movement rules', () => {
    describe('general (将/帅)', () => {
      it('moves one step orthogonally within the palace', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 4, 'black', 'general')
        place(board, 5, 4, 'red', 'soldier')

        const moves = generateLegalMoves(board, 'red')
        const generalMoves = moves.filter((m) => m.piece.type === 'general')

        expect(generalMoves.some((m) => m.to.row === 8 && m.to.col === 4)).toBe(true)
        expect(generalMoves.some((m) => m.to.row === 9 && m.to.col === 3)).toBe(true)
        expect(generalMoves.some((m) => m.to.row === 9 && m.to.col === 5)).toBe(true)
      })

      it('cannot leave the palace', () => {
        const board = createEmptyBoard()
        place(board, 7, 4, 'red', 'general')
        place(board, 0, 4, 'black', 'general')
        place(board, 5, 4, 'red', 'soldier')

        const moves = generateLegalMoves(board, 'red')
        const generalMoves = moves.filter((m) => m.piece.type === 'general')

        expect(generalMoves.every((m) => m.to.row >= 5)).toBe(true)
        expect(generalMoves.some((m) => m.to.row === 4)).toBe(false)
      })
    })

    describe('advisor (士)', () => {
      it('moves diagonally within the palace', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 4, 'black', 'general')
        place(board, 5, 4, 'red', 'soldier')
        place(board, 9, 5, 'red', 'advisor')

        const moves = generateLegalMoves(board, 'red')
        const advisorMoves = moves.filter((m) => m.piece.type === 'advisor')

        expect(advisorMoves.some((m) => m.to.row === 8 && m.to.col === 4)).toBe(true)
        expect(advisorMoves.every((m) => m.to.row >= 7)).toBe(true)
      })
    })

    describe('elephant (象)', () => {
      it('moves two steps diagonally and cannot cross the river', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 0, 'black', 'general')
        place(board, 5, 0, 'red', 'soldier')
        place(board, 9, 2, 'red', 'elephant')

        const moves = generateLegalMoves(board, 'red')
        const elephantMoves = moves.filter((m) => m.piece.type === 'elephant')

        expect(elephantMoves.some((m) => m.to.row === 7 && m.to.col === 0)).toBe(true)
        expect(elephantMoves.some((m) => m.to.row === 7 && m.to.col === 4)).toBe(true)
        expect(elephantMoves.every((m) => m.to.row >= 5)).toBe(true)
      })

      it('is blocked when the eye is occupied', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 4, 'black', 'general')
        place(board, 5, 3, 'red', 'soldier')
        place(board, 9, 2, 'red', 'elephant')
        place(board, 8, 3, 'red', 'soldier', 1)

        const moves = generateLegalMoves(board, 'red')
        const elephantMoves = moves.filter((m) => m.piece.type === 'elephant')

        expect(elephantMoves.some((m) => m.to.row === 7 && m.to.col === 4)).toBe(false)
      })
    })

    describe('horse (马)', () => {
      it('prevents illegal movement when the leg is blocked', () => {
        const board = createInitialBoard()
        const horseMoves = generateLegalMoves(board, 'red').filter(
          (move) => move.from.row === 9 && move.from.col === 1
        )

        expect(horseMoves.some((move) => move.to.row === 7 && move.to.col === 0)).toBe(true)
        expect(horseMoves.some((move) => move.to.row === 8 && move.to.col === 3)).toBe(false)
      })

      it('can move in L-shape when not blocked', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 0, 'black', 'general')
        place(board, 5, 4, 'red', 'horse')
        place(board, 5, 7, 'red', 'soldier')

        const moves = generateLegalMoves(board, 'red')
        const horseMoves = moves.filter((m) => m.piece.type === 'horse')

        expect(horseMoves.some((m) => m.to.row === 3 && m.to.col === 3)).toBe(true)
        expect(horseMoves.some((m) => m.to.row === 3 && m.to.col === 5)).toBe(true)
        expect(horseMoves.some((m) => m.to.row === 4 && m.to.col === 2)).toBe(true)
        expect(horseMoves.some((m) => m.to.row === 4 && m.to.col === 6)).toBe(true)
      })
    })

    describe('chariot (车)', () => {
      it('moves any number of steps orthogonally', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 0, 'black', 'general')
        place(board, 5, 0, 'red', 'chariot')
        place(board, 3, 3, 'red', 'soldier')

        const moves = generateLegalMoves(board, 'red')
        const chariotMoves = moves.filter((m) => m.piece.type === 'chariot')

        expect(chariotMoves.some((m) => m.to.row === 0 && m.to.col === 0)).toBe(true)
        expect(chariotMoves.some((m) => m.to.row === 9 && m.to.col === 0)).toBe(true)
        expect(chariotMoves.some((m) => m.to.row === 5 && m.to.col === 8)).toBe(true)
      })
    })

    describe('cannon (炮)', () => {
      it('moves orthogonally without capturing', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 3, 'black', 'general')
        place(board, 5, 4, 'red', 'cannon')
        place(board, 5, 3, 'red', 'soldier')

        const moves = generateLegalMoves(board, 'red')
        const cannonMoves = moves.filter((m) => m.piece.type === 'cannon')

        expect(cannonMoves.some((m) => m.to.row === 0 && m.to.col === 4)).toBe(true)
        expect(cannonMoves.every((m) => !m.captured)).toBe(true)
      })
    })

    describe('soldier (卒/兵)', () => {
      it('moves forward one step before crossing the river', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 3, 'black', 'general')
        place(board, 6, 4, 'red', 'soldier')
        place(board, 5, 3, 'red', 'soldier', 1)

        const moves = generateLegalMoves(board, 'red')
        const soldierMoves = moves.filter((m) => m.piece.type === 'soldier' && m.from.row === 6)

        expect(soldierMoves.some((m) => m.to.row === 5 && m.to.col === 4)).toBe(true)
        expect(soldierMoves.every((m) => m.to.col === 4)).toBe(true)
      })

      it('can move sideways after crossing the river', () => {
        const board = createEmptyBoard()
        place(board, 9, 4, 'red', 'general')
        place(board, 0, 3, 'black', 'general')
        place(board, 4, 4, 'red', 'soldier')
        place(board, 5, 3, 'red', 'soldier', 1)

        const moves = generateLegalMoves(board, 'red')
        const soldierMoves = moves.filter(
          (m) => m.piece.type === 'soldier' && m.from.row === 4 && m.from.col === 4
        )

        expect(soldierMoves.some((m) => m.to.row === 3 && m.to.col === 4)).toBe(true)
        expect(soldierMoves.some((m) => m.to.row === 4 && m.to.col === 5)).toBe(true)
      })
    })
  })

  describe('check detection', () => {
    it('detects when general is under attack by chariot', () => {
      const board = createEmptyBoard()
      place(board, 9, 4, 'red', 'general')
      place(board, 0, 3, 'black', 'general')
      place(board, 2, 4, 'black', 'chariot')
      place(board, 5, 3, 'red', 'soldier')

      expect(isInCheck(board, 'red')).toBe(true)
    })

    it('prevents moves that would leave own general in check', () => {
      const board = createEmptyBoard()
      place(board, 9, 4, 'red', 'general')
      place(board, 0, 3, 'black', 'general')
      place(board, 7, 4, 'black', 'chariot')
      place(board, 5, 3, 'red', 'soldier')

      const moves = generateLegalMoves(board, 'red')
      const generalMoves = moves.filter((m) => m.piece.type === 'general')

      expect(generalMoves.every((m) => m.to.col !== 4 || m.to.row !== 8)).toBe(true)
    })
  })

  describe('flying general rule', () => {
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

  describe('win/loss detection', () => {
    it('returns black as winner when red general is captured', () => {
      const board = createEmptyBoard()
      place(board, 0, 4, 'black', 'general')

      expect(getWinner(board, 'red')).toBe('black')
    })

    it('returns red as winner when black general is captured', () => {
      const board = createEmptyBoard()
      place(board, 9, 4, 'red', 'general')

      expect(getWinner(board, 'black')).toBe('red')
    })

    it('returns null when both generals are alive and moves exist', () => {
      const board = createInitialBoard()

      expect(getWinner(board, 'red')).toBeNull()
    })

    it('detects stalemate when no legal moves remain', () => {
      const board = createEmptyBoard()
      place(board, 9, 4, 'red', 'general')
      place(board, 0, 3, 'black', 'general')
      place(board, 5, 3, 'red', 'soldier')
      place(board, 8, 3, 'black', 'chariot')
      place(board, 8, 4, 'black', 'chariot')
      place(board, 8, 5, 'black', 'chariot')
      place(board, 9, 3, 'black', 'chariot')
      place(board, 9, 5, 'black', 'chariot')

      expect(getWinner(board, 'red')).toBe('black')
    })
  })
})
