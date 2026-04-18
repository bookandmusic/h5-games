export type Difficulty = 'easy' | 'medium' | 'hard'
export type Theme = 'default' | 'energy' | 'deity'
export type GameStatus = 'playing' | 'won' | 'lost'
export type MoveDirection = 'up' | 'down' | 'left' | 'right'

export type CellValue = number

export interface GameCell {
  value: CellValue
  id: number
}

export interface StoredCell {
  value: CellValue
}

export interface GameState {
  grid: StoredCell[][]
  score: number
  bestScore: number
  gameStatus: GameStatus
}

export interface Settings {
  difficulty: Difficulty
  theme: Theme
}

export interface CellTheme {
  bg: string
  text: string
  glow?: string
  icon?: string
}

export interface GameTheme {
  name: string
  cellThemes: Record<number, CellTheme>
  containerBg: string
  gridBg: string
  gridBorder?: string
  cellBg: string
  titleColor: string
  textColor: string
  labelColor: string
  buttonBg: string
  buttonTextColor: string
  useIcons: boolean
  iconMap?: Record<number, string>
}
