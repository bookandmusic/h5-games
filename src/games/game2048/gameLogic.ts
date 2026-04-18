import type { Difficulty, GameCell, MoveDirection } from './types'

export const SIZE = 4

const difficultyConfig: Record<Difficulty, { two: number; four: number }> = {
  easy: { two: 0.95, four: 0.05 },
  medium: { two: 0.9, four: 0.1 },
  hard: { two: 0.7, four: 0.25 },
}

export function createEmptyGrid(createId: () => number): GameCell[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ value: 0, id: createId() }))
  )
}

export function getEmptyCells(grid: GameCell[][]): Array<{ row: number; col: number }> {
  const empty: Array<{ row: number; col: number }> = []

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].value === 0) empty.push({ row: r, col: c })
    }
  }

  return empty
}

export function getNewCellValue(difficulty: Difficulty, randomValue = Math.random()): number {
  const config = difficultyConfig[difficulty]

  if (randomValue < config.two) return 2
  if (randomValue < config.two + config.four) return 4
  return 8
}

export function spawnRandomCell(
  grid: GameCell[][],
  difficulty: Difficulty,
  createId: () => number,
  positionRandom = Math.random(),
  valueRandom = Math.random()
): GameCell[][] {
  const empty = getEmptyCells(grid)

  if (empty.length === 0) return grid

  const pos = empty[Math.floor(positionRandom * empty.length)]
  const nextGrid = grid.map((row) => row.slice())

  nextGrid[pos.row][pos.col] = {
    value: getNewCellValue(difficulty, valueRandom),
    id: createId(),
  }

  return nextGrid
}

export function moveRowLeft(
  row: GameCell[],
  createId: () => number
): { row: GameCell[]; moved: boolean; reached2048: boolean } {
  const nextRow: GameCell[] = []
  let moved = false
  let reached2048 = false
  let lastValue = 0
  let lastIndex = -1

  for (let index = 0; index < row.length; index++) {
    const cell = row[index]

    if (cell.value === 0) continue

    if (cell.value === lastValue && lastValue !== 0) {
      const mergedValue = lastValue * 2
      nextRow[lastIndex] = { value: mergedValue, id: createId() }
      reached2048 ||= mergedValue === 2048
      lastValue = 0
      lastIndex = -1
      moved = true
      continue
    }

    nextRow.push({ value: cell.value, id: cell.id })
    lastValue = cell.value
    lastIndex = nextRow.length - 1
    moved ||= lastIndex !== index
  }

  while (nextRow.length < SIZE) {
    nextRow.push({ value: 0, id: createId() })
  }

  return { row: nextRow, moved, reached2048 }
}

export function rotateGrid(grid: GameCell[][], times = 1): GameCell[][] {
  let nextGrid = grid
  const normalizedTimes = ((times % 4) + 4) % 4

  for (let turn = 0; turn < normalizedTimes; turn++) {
    nextGrid = Array.from({ length: SIZE }, (_, c) =>
      Array.from({ length: SIZE }, (_, index) => nextGrid[SIZE - 1 - index][c])
    )
  }

  return nextGrid
}

export function moveGrid(
  grid: GameCell[][],
  direction: MoveDirection,
  createId: () => number
): { grid: GameCell[][]; moved: boolean; reached2048: boolean } {
  const rotations: Record<MoveDirection, number> = { left: 0, down: 1, right: 2, up: 3 }
  const rotatedGrid = rotateGrid(grid, rotations[direction])
  let moved = false
  let reached2048 = false

  const movedGrid = rotatedGrid.map((row) => {
    const result = moveRowLeft(row, createId)
    moved ||= result.moved
    reached2048 ||= result.reached2048
    return result.row
  })

  return {
    grid: rotateGrid(movedGrid, (4 - rotations[direction]) % 4),
    moved,
    reached2048,
  }
}

export function canMove(grid: GameCell[][]): boolean {
  if (getEmptyCells(grid).length > 0) return true

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = grid[r][c].value
      if (c < SIZE - 1 && grid[r][c + 1].value === value) return true
      if (r < SIZE - 1 && grid[r + 1][c].value === value) return true
    }
  }

  return false
}

export function getMaxCellValue(grid: GameCell[][]): number {
  let maxValue = 0

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = grid[r][c].value
      if (value > maxValue) maxValue = value
    }
  }

  return maxValue
}
