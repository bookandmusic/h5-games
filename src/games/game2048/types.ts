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
  powerUps?: PowerUpState
  undoSnapshot?: GameSnapshot | null
}

export interface Settings {
  theme: Theme
}

export interface CellTheme {
  bg: string
  text: string
  glow?: string
}

export interface GameTheme {
  name: string
  cellThemes: Record<number, CellTheme>
  useIcons: boolean
  iconMap?: Record<number, string>
}

export type PowerUpType = 'undo' | 'wand' | 'hammer'
export type TargetPowerUpType = Extract<PowerUpType, 'wand' | 'hammer'>

export type HammerTarget = { row: number; col: number }

export interface PowerUpState {
  undo: number
  wand: number
  hammer: number
}

export interface GameSnapshot {
  grid: StoredCell[][]
  score: number
  gameStatus: GameStatus
}
