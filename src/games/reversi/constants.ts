export const GAME_ID = 'reversi'

export const BOARD_SIZE = 8

export const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const

export const POSITION_WEIGHTS: number[][] = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
]

export const DIFFICULTY_DEPTH: Record<string, number> = {
  easy: 1,
  medium: 4,
  hard: 5,
  expert: 7,
}

export const UNDO_COST = 50
export const HINT_COST = 30
export const INITIAL_COINS = 500

export const RANK_TITLES: { name: string; minLv: number; maxLv: number }[] = [
  { name: '初识棋道', minLv: 1, maxLv: 4 },
  { name: '小试牛刀', minLv: 5, maxLv: 9 },
  { name: '渐入佳境', minLv: 10, maxLv: 14 },
  { name: '棋逢对手', minLv: 15, maxLv: 19 },
  { name: '运筹帷幄', minLv: 20, maxLv: 24 },
  { name: '黑白大师', minLv: 25, maxLv: 29 },
  { name: '翻转乾坤', minLv: 30, maxLv: 34 },
  { name: '棋圣降临', minLv: 35, maxLv: 40 },
]

export const getRankTitle = (level: number): string => {
  for (const r of RANK_TITLES) {
    if (level >= r.minLv && level <= r.maxLv) return r.name
  }
  if (level > 40) return '棋圣降临'
  return '初识棋道'
}
