export const GAME_ID = 'chinese-chess'

export const BOARD_ROWS = 10
export const BOARD_COLS = 9

export const RED_SIDE_ROWS = new Set([5, 6, 7, 8, 9])
export const BLACK_SIDE_ROWS = new Set([0, 1, 2, 3, 4])

export const PALACE_COLUMNS = new Set([3, 4, 5])
export const RED_PALACE_ROWS = new Set([7, 8, 9])
export const BLACK_PALACE_ROWS = new Set([0, 1, 2])

export const RANK_TITLES: { name: string; minLv: number; maxLv: number }[] = [
  { name: '初出茅庐', minLv: 1, maxLv: 9 },
  { name: '登堂入室', minLv: 10, maxLv: 19 },
  { name: '渐入佳境', minLv: 20, maxLv: 29 },
  { name: '融会贯通', minLv: 30, maxLv: 39 },
  { name: '炉火纯青', minLv: 40, maxLv: 49 },
  { name: '出神入化', minLv: 50, maxLv: 59 },
  { name: '独步天下', minLv: 60, maxLv: 69 },
  { name: '登峰造极', minLv: 70, maxLv: 79 },
  { name: '天人合一', minLv: 80, maxLv: 89 },
  { name: '超凡入圣', minLv: 90, maxLv: 99 },
]

export const getRankTitle = (level: number): string => {
  for (const r of RANK_TITLES) {
    if (level >= r.minLv && level <= r.maxLv) return r.name
  }
  return '业余'
}
