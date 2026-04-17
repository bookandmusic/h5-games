import { describe, expect, it } from 'vitest'

/**
 * 2048 游戏核心逻辑测试
 *
 * 测试独立于 Vue 组件，直接测试游戏逻辑函数
 */

const SIZE = 4

type CellValue = number

interface Cell {
  value: CellValue
  id: number
}

// 创建空网格
function createEmptyGrid(): Cell[][] {
  let idCounter = 0
  return Array(SIZE)
    .fill(null)
    .map(() =>
      Array(SIZE)
        .fill(null)
        .map(() => ({ value: 0, id: idCounter++ }))
    )
}

// 向左移动一行（核心算法）
function moveRowLeft(row: Cell[]): { newRow: Cell[]; moved: boolean } {
  const newRow: Cell[] = []
  let moved = false
  let lastValue = 0
  let lastId = -1
  let idCounter = 0

  for (const cell of row) {
    if (cell.value === 0) continue
    if (cell.value === lastValue && lastValue !== 0) {
      newRow[lastId] = { value: lastValue * 2, id: idCounter++ }
      lastValue = 0
      lastId = -1
      moved = true
    } else {
      newRow.push({ value: cell.value, id: idCounter++ })
      lastValue = cell.value
      lastId = newRow.length - 1
      if (newRow.length - 1 !== row.indexOf(cell)) moved = true
    }
  }

  while (newRow.length < SIZE) {
    newRow.push({ value: 0, id: idCounter++ })
  }

  return { newRow, moved }
}

// 旋转网格
function rotateGrid(grid: Cell[][]): Cell[][] {
  const newGrid: Cell[][] = []
  for (let c = 0; c < SIZE; c++) {
    const newRow: Cell[] = []
    for (let r = SIZE - 1; r >= 0; r--) newRow.push(grid[r][c])
    newGrid.push(newRow)
  }
  return newGrid
}

// 检查是否有空格
function hasEmptyCells(grid: Cell[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].value === 0) return true
    }
  }
  return false
}

// 检查是否可以继续移动
function canMove(grid: Cell[][]): boolean {
  if (hasEmptyCells(grid)) return true
  // 检查相邻格子是否有相同值
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c].value
      if (c < SIZE - 1 && grid[r][c + 1].value === v) return true
      if (r < SIZE - 1 && grid[r + 1][c].value === v) return true
    }
  }
  return false
}

// 计算格子中的最大值作为分数
function calculateMaxScore(grid: Cell[][]): number {
  let maxVal = 0
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c].value
      if (v > maxVal) maxVal = v
    }
  }
  return maxVal
}

// 根据当前分数获取新格子值（难度递增逻辑）
function getNewCellValue(currentScore: number, randomValue: number): number {
  if (currentScore >= 2048) {
    // 2048+: 2(60%), 4(30%), 8(10%)
    if (randomValue < 0.6) return 2
    if (randomValue < 0.9) return 4
    return 8
  } else if (currentScore >= 1024) {
    // 1024-2047: 2(70%), 4(25%), 8(5%)
    if (randomValue < 0.7) return 2
    if (randomValue < 0.95) return 4
    return 8
  } else if (currentScore >= 512) {
    // 512-1023: 2(75%), 4(20%), 8(5%)
    if (randomValue < 0.75) return 2
    if (randomValue < 0.95) return 4
    return 8
  } else if (currentScore >= 256) {
    // 256-511: 2(80%), 4(20%)
    return randomValue < 0.8 ? 2 : 4
  } else if (currentScore >= 128) {
    // 128-255: 2(85%), 4(15%)
    return randomValue < 0.85 ? 2 : 4
  } else {
    // 0-127: 2(90%), 4(10%) - 初始难度
    return randomValue < 0.9 ? 2 : 4
  }
}

describe('2048 游戏核心逻辑', () => {
  describe('moveRowLeft', () => {
    it('空行应保持不变', () => {
      const row = createEmptyGrid()[0]
      const result = moveRowLeft(row)
      expect(result.moved).toBe(false)
    })

    it('单个数字在首位应保持位置', () => {
      const row = [
        { value: 2, id: 0 },
        { value: 0, id: 1 },
        { value: 0, id: 2 },
        { value: 0, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(2)
      expect(result.newRow[1].value).toBe(0)
      expect(result.moved).toBe(false) // 数字已经在首位，未发生移动
    })

    it('单个数字应移动到左边', () => {
      const row = [
        { value: 0, id: 0 },
        { value: 0, id: 1 },
        { value: 0, id: 2 },
        { value: 2, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(2)
      expect(result.newRow[1].value).toBe(0)
      expect(result.moved).toBe(true) // 数字从末尾移动到首位
    })

    it('相同数字应合并', () => {
      const row = [
        { value: 2, id: 0 },
        { value: 2, id: 1 },
        { value: 0, id: 2 },
        { value: 0, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(4)
      expect(result.newRow[1].value).toBe(0)
      expect(result.moved).toBe(true)
    })

    it('三个相同数字应合并前两个', () => {
      const row = [
        { value: 2, id: 0 },
        { value: 2, id: 1 },
        { value: 2, id: 2 },
        { value: 0, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(4)
      expect(result.newRow[1].value).toBe(2)
    })

    it('四个相同数字应合并成两个', () => {
      const row = [
        { value: 2, id: 0 },
        { value: 2, id: 1 },
        { value: 2, id: 2 },
        { value: 2, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(4)
      expect(result.newRow[1].value).toBe(4)
    })

    it('不同数字不应合并', () => {
      const row = [
        { value: 2, id: 0 },
        { value: 4, id: 1 },
        { value: 0, id: 2 },
        { value: 0, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(2)
      expect(result.newRow[1].value).toBe(4)
    })

    it('间隔相同数字应合并', () => {
      const row = [
        { value: 2, id: 0 },
        { value: 0, id: 1 },
        { value: 2, id: 2 },
        { value: 0, id: 3 },
      ]
      const result = moveRowLeft(row)
      expect(result.newRow[0].value).toBe(4)
    })
  })

  describe('rotateGrid', () => {
    it('旋转4次应回到原始状态', () => {
      const grid = createEmptyGrid()
      grid[0][0].value = 2
      grid[0][3].value = 4

      let rotated = grid
      for (let i = 0; i < 4; i++) {
        rotated = rotateGrid(rotated)
      }

      expect(rotated[0][0].value).toBe(2)
      expect(rotated[0][3].value).toBe(4)
    })

    it('旋转应正确转换坐标', () => {
      const grid = createEmptyGrid()
      grid[0][3].value = 8 // 顶部右侧

      const rotated = rotateGrid(grid)
      // 旋转后：顶部右侧变成底部右侧
      expect(rotated[3][3].value).toBe(8)
    })
  })

  describe('hasEmptyCells', () => {
    it('空网格应有空格', () => {
      const grid = createEmptyGrid()
      expect(hasEmptyCells(grid)).toBe(true)
    })

    it('满网格应无空格', () => {
      const grid = createEmptyGrid()
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          grid[r][c].value = 2
        }
      }
      expect(hasEmptyCells(grid)).toBe(false)
    })
  })

  describe('canMove', () => {
    it('有空格时应可移动', () => {
      const grid = createEmptyGrid()
      expect(canMove(grid)).toBe(true)
    })

    it('相邻有相同值时应可移动', () => {
      const grid = createEmptyGrid()
      grid[0][0].value = 2
      grid[0][1].value = 2
      expect(canMove(grid)).toBe(true)
    })

    it('满网格无相邻相同值时应不可移动', () => {
      const grid = createEmptyGrid()
      // 按蛇形填充不同值，确保无相邻相同
      const values = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]
      let idx = 0
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          grid[r][c].value = values[idx++]
        }
      }
      expect(canMove(grid)).toBe(false)
    })
  })

  describe('calculateMaxScore', () => {
    it('空网格分数应为0', () => {
      const grid = createEmptyGrid()
      expect(calculateMaxScore(grid)).toBe(0)
    })

    it('应返回格子中的最大值', () => {
      const grid = createEmptyGrid()
      grid[0][0].value = 2
      grid[0][1].value = 16
      grid[1][0].value = 4
      grid[2][2].value = 8
      expect(calculateMaxScore(grid)).toBe(16)
    })

    it('达到2048时分数应为2048', () => {
      const grid = createEmptyGrid()
      grid[0][0].value = 2048
      grid[0][1].value = 1024
      grid[1][0].value = 512
      expect(calculateMaxScore(grid)).toBe(2048)
    })

    it('多个相同最大值应正确计算', () => {
      const grid = createEmptyGrid()
      grid[0][0].value = 128
      grid[0][1].value = 128
      grid[1][0].value = 128
      expect(calculateMaxScore(grid)).toBe(128)
    })
  })

  describe('getNewCellValue 难度递增', () => {
    describe('初始难度 (0-127)', () => {
      it('随机值 < 0.9 应返回 2', () => {
        expect(getNewCellValue(0, 0.0)).toBe(2)
        expect(getNewCellValue(64, 0.5)).toBe(2)
        expect(getNewCellValue(127, 0.89)).toBe(2)
      })

      it('随机值 >= 0.9 应返回 4', () => {
        expect(getNewCellValue(0, 0.9)).toBe(4)
        expect(getNewCellValue(64, 0.95)).toBe(4)
        expect(getNewCellValue(127, 1.0)).toBe(4)
      })
    })

    describe('难度1 (128-255)', () => {
      it('随机值 < 0.85 应返回 2', () => {
        expect(getNewCellValue(128, 0.0)).toBe(2)
        expect(getNewCellValue(200, 0.84)).toBe(2)
      })

      it('随机值 >= 0.85 应返回 4', () => {
        expect(getNewCellValue(128, 0.85)).toBe(4)
        expect(getNewCellValue(255, 1.0)).toBe(4)
      })
    })

    describe('难度2 (256-511)', () => {
      it('随机值 < 0.8 应返回 2', () => {
        expect(getNewCellValue(256, 0.0)).toBe(2)
        expect(getNewCellValue(400, 0.79)).toBe(2)
      })

      it('随机值 >= 0.8 应返回 4', () => {
        expect(getNewCellValue(256, 0.8)).toBe(4)
        expect(getNewCellValue(511, 1.0)).toBe(4)
      })
    })

    describe('难度3 (512-1023) - 开始出现8', () => {
      it('随机值 < 0.75 应返回 2', () => {
        expect(getNewCellValue(512, 0.0)).toBe(2)
        expect(getNewCellValue(800, 0.74)).toBe(2)
      })

      it('随机值 0.75-0.95 应返回 4', () => {
        expect(getNewCellValue(512, 0.75)).toBe(4)
        expect(getNewCellValue(800, 0.94)).toBe(4)
      })

      it('随机值 >= 0.95 应返回 8', () => {
        expect(getNewCellValue(512, 0.95)).toBe(8)
        expect(getNewCellValue(1023, 1.0)).toBe(8)
      })
    })

    describe('难度4 (1024-2047)', () => {
      it('随机值 < 0.7 应返回 2', () => {
        expect(getNewCellValue(1024, 0.0)).toBe(2)
        expect(getNewCellValue(1500, 0.69)).toBe(2)
      })

      it('随机值 0.7-0.95 应返回 4', () => {
        expect(getNewCellValue(1024, 0.7)).toBe(4)
        expect(getNewCellValue(1500, 0.94)).toBe(4)
      })

      it('随机值 >= 0.95 应返回 8', () => {
        expect(getNewCellValue(1024, 0.95)).toBe(8)
        expect(getNewCellValue(2047, 1.0)).toBe(8)
      })
    })

    describe('最高难度 (2048+)', () => {
      it('随机值 < 0.6 应返回 2', () => {
        expect(getNewCellValue(2048, 0.0)).toBe(2)
        expect(getNewCellValue(4096, 0.59)).toBe(2)
      })

      it('随机值 0.6-0.9 应返回 4', () => {
        expect(getNewCellValue(2048, 0.6)).toBe(4)
        expect(getNewCellValue(4096, 0.89)).toBe(4)
      })

      it('随机值 >= 0.9 应返回 8', () => {
        expect(getNewCellValue(2048, 0.9)).toBe(8)
        expect(getNewCellValue(4096, 1.0)).toBe(8)
      })
    })

    describe('边界值测试', () => {
      it('分数边界 127/128 应切换难度', () => {
        // 127 属于初始难度
        expect(getNewCellValue(127, 0.89)).toBe(2)
        expect(getNewCellValue(127, 0.9)).toBe(4)
        // 128 属于难度1
        expect(getNewCellValue(128, 0.84)).toBe(2)
        expect(getNewCellValue(128, 0.85)).toBe(4)
      })

      it('分数边界 255/256 应切换难度', () => {
        // 255 属于难度1
        expect(getNewCellValue(255, 0.84)).toBe(2)
        expect(getNewCellValue(255, 0.85)).toBe(4)
        // 256 属于难度2
        expect(getNewCellValue(256, 0.79)).toBe(2)
        expect(getNewCellValue(256, 0.8)).toBe(4)
      })

      it('分数边界 511/512 应切换难度（开始出现8）', () => {
        // 511 属于难度2（无8）
        expect(getNewCellValue(511, 0.99)).toBe(4)
        // 512 属于难度3（有8）
        expect(getNewCellValue(512, 0.95)).toBe(8)
      })
    })
  })
})
