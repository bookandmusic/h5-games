import { beforeEach, describe, expect, it } from 'vitest'

import {
  SIZE,
  canMove,
  createEmptyGrid,
  getEmptyCells,
  getMaxCellValue,
  getNewCellValue,
  moveGrid,
  moveRowLeft,
  rotateGrid,
  spawnRandomCell,
} from './gameLogic'
import type { Difficulty, GameCell, MoveDirection } from './types'

const createIdFactory = () => {
  let nextId = 0
  return () => nextId++
}

const rowFromValues = (values: number[]): GameCell[] => {
  const createId = createIdFactory()
  return values.map((value) => ({ value, id: createId() }))
}

const gridFromValues = (values: number[][]): GameCell[][] => {
  const createId = createIdFactory()
  return values.map((row) => row.map((value) => ({ value, id: createId() })))
}

const toValues = (grid: GameCell[][]): number[][] =>
  grid.map((row) => row.map((cell) => cell.value))

describe('2048 game logic', () => {
  let createId: () => number

  beforeEach(() => {
    createId = createIdFactory()
  })

  it('creates an empty 4x4 grid with 16 empty cells', () => {
    const grid = createEmptyGrid(createId)

    expect(grid).toHaveLength(SIZE)
    expect(grid.every((row) => row.length === SIZE)).toBe(true)
    expect(toValues(grid)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
    expect(getEmptyCells(grid)).toHaveLength(16)
  })

  it('spawns a tile at the selected empty position with the selected difficulty value', () => {
    const grid = gridFromValues([
      [2, 0, 4, 0],
      [0, 8, 16, 32],
      [64, 128, 256, 512],
      [1024, 2048, 4096, 8192],
    ])

    const nextGrid = spawnRandomCell(grid, 'hard', createId, 0.5, 0.95)

    expect(toValues(nextGrid)).toEqual([
      [2, 0, 4, 8],
      [0, 8, 16, 32],
      [64, 128, 256, 512],
      [1024, 2048, 4096, 8192],
    ])
  })

  describe('moveRowLeft', () => {
    it.each([
      {
        name: 'keeps an empty row unchanged',
        input: [0, 0, 0, 0],
        output: [0, 0, 0, 0],
        moved: false,
        reached2048: false,
      },
      {
        name: 'slides a single tile left',
        input: [0, 0, 0, 2],
        output: [2, 0, 0, 0],
        moved: true,
        reached2048: false,
      },
      {
        name: 'merges a pair',
        input: [2, 2, 0, 0],
        output: [4, 0, 0, 0],
        moved: true,
        reached2048: false,
      },
      {
        name: 'merges only the first pair in a triple',
        input: [2, 2, 2, 0],
        output: [4, 2, 0, 0],
        moved: true,
        reached2048: false,
      },
      {
        name: 'merges four equal tiles into two pairs',
        input: [2, 2, 2, 2],
        output: [4, 4, 0, 0],
        moved: true,
        reached2048: false,
      },
      {
        name: 'does not merge different values',
        input: [2, 4, 2, 4],
        output: [2, 4, 2, 4],
        moved: false,
        reached2048: false,
      },
      {
        name: 'merges across gaps',
        input: [2, 0, 2, 0],
        output: [4, 0, 0, 0],
        moved: true,
        reached2048: false,
      },
      {
        name: 'reports reaching 2048 on merge',
        input: [1024, 1024, 0, 0],
        output: [2048, 0, 0, 0],
        moved: true,
        reached2048: true,
      },
    ])('$name', ({ input, output, moved, reached2048 }) => {
      const result = moveRowLeft(rowFromValues(input), createId)

      expect(result.moved).toBe(moved)
      expect(result.reached2048).toBe(reached2048)
      expect(result.row.map((cell) => cell.value)).toEqual(output)
    })
  })

  describe('rotateGrid', () => {
    it.each([
      {
        name: 'rotates once clockwise',
        times: 1,
        output: [
          [13, 9, 5, 1],
          [14, 10, 6, 2],
          [15, 11, 7, 3],
          [16, 12, 8, 4],
        ],
      },
      {
        name: 'rotates twice',
        times: 2,
        output: [
          [16, 15, 14, 13],
          [12, 11, 10, 9],
          [8, 7, 6, 5],
          [4, 3, 2, 1],
        ],
      },
      {
        name: 'returns to the original grid after four rotations',
        times: 4,
        output: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
      },
    ])('$name', ({ times, output }) => {
      const grid = gridFromValues([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ])

      expect(toValues(rotateGrid(grid, times))).toEqual(output)
    })
  })

  describe('moveGrid', () => {
    it.each<{
      name: string
      direction: MoveDirection
      input: number[][]
      output: number[][]
      moved: boolean
    }>([
      {
        name: 'moves left',
        direction: 'left',
        input: [
          [0, 2, 0, 2],
          [2, 0, 2, 2],
          [0, 0, 0, 0],
          [4, 4, 8, 8],
        ],
        output: [
          [4, 0, 0, 0],
          [4, 2, 0, 0],
          [0, 0, 0, 0],
          [8, 16, 0, 0],
        ],
        moved: true,
      },
      {
        name: 'moves right',
        direction: 'right',
        input: [
          [2, 0, 0, 2],
          [2, 2, 0, 2],
          [0, 0, 0, 0],
          [4, 4, 8, 8],
        ],
        output: [
          [0, 0, 0, 4],
          [0, 0, 2, 4],
          [0, 0, 0, 0],
          [0, 0, 8, 16],
        ],
        moved: true,
      },
      {
        name: 'moves up',
        direction: 'up',
        input: [
          [2, 0, 2, 0],
          [2, 0, 2, 0],
          [0, 0, 2, 0],
          [0, 0, 0, 0],
        ],
        output: [
          [4, 0, 4, 0],
          [0, 0, 2, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        moved: true,
      },
      {
        name: 'moves down',
        direction: 'down',
        input: [
          [2, 0, 2, 0],
          [2, 0, 2, 0],
          [0, 0, 2, 0],
          [0, 0, 0, 0],
        ],
        output: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 2, 0],
          [4, 0, 4, 0],
        ],
        moved: true,
      },
      {
        name: 'reports no movement when the grid is already settled',
        direction: 'left',
        input: [
          [2, 4, 8, 16],
          [32, 64, 128, 256],
          [512, 1024, 2, 4],
          [8, 16, 32, 64],
        ],
        output: [
          [2, 4, 8, 16],
          [32, 64, 128, 256],
          [512, 1024, 2, 4],
          [8, 16, 32, 64],
        ],
        moved: false,
      },
    ])('$name', ({ direction, input, output, moved }) => {
      const result = moveGrid(gridFromValues(input), direction, createId)

      expect(result.moved).toBe(moved)
      expect(toValues(result.grid)).toEqual(output)
    })

    it('reports reaching 2048 when moving the whole grid', () => {
      const result = moveGrid(
        gridFromValues([
          [1024, 1024, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ]),
        'left',
        createId
      )

      expect(result.reached2048).toBe(true)
      expect(toValues(result.grid)[0]).toEqual([2048, 0, 0, 0])
    })
  })

  describe('canMove and scoring', () => {
    it.each([
      {
        name: 'returns true when empty cells remain',
        input: [
          [2, 4, 8, 16],
          [32, 64, 128, 0],
          [512, 1024, 2, 4],
          [8, 16, 32, 64],
        ],
        expected: true,
      },
      {
        name: 'returns true when a horizontal merge is available',
        input: [
          [2, 2, 8, 16],
          [32, 64, 128, 256],
          [512, 1024, 2, 4],
          [8, 16, 32, 64],
        ],
        expected: true,
      },
      {
        name: 'returns true when a vertical merge is available',
        input: [
          [2, 4, 8, 16],
          [2, 64, 128, 256],
          [512, 1024, 2, 4],
          [8, 16, 32, 64],
        ],
        expected: true,
      },
      {
        name: 'returns false when the board is full and no merges remain',
        input: [
          [2, 4, 2, 4],
          [4, 2, 4, 2],
          [2, 4, 2, 4],
          [4, 2, 4, 2],
        ],
        expected: false,
      },
    ])('$name', ({ input, expected }) => {
      expect(canMove(gridFromValues(input))).toBe(expected)
    })

    it('returns the largest tile as the score', () => {
      const grid = gridFromValues([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2, 4],
        [8, 16, 32, 64],
      ])

      expect(getMaxCellValue(grid)).toBe(1024)
    })
  })

  describe('getNewCellValue', () => {
    it.each<{
      difficulty: Difficulty
      randomValue: number
      expected: number
    }>([
      { difficulty: 'easy', randomValue: 0.0, expected: 2 },
      { difficulty: 'easy', randomValue: 0.949, expected: 2 },
      { difficulty: 'easy', randomValue: 0.95, expected: 4 },
      { difficulty: 'medium', randomValue: 0.899, expected: 2 },
      { difficulty: 'medium', randomValue: 0.9, expected: 4 },
      { difficulty: 'hard', randomValue: 0.699, expected: 2 },
      { difficulty: 'hard', randomValue: 0.7, expected: 4 },
      { difficulty: 'hard', randomValue: 0.949, expected: 4 },
      { difficulty: 'hard', randomValue: 0.95, expected: 8 },
    ])(
      'returns $expected for $difficulty at $randomValue',
      ({ difficulty, randomValue, expected }) => {
        expect(getNewCellValue(difficulty, randomValue)).toBe(expected)
      }
    )
  })
})
