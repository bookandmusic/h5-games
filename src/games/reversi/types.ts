export type DiskColor = 'black' | 'white'

export interface Position {
  row: number
  col: number
}

export interface Disk {
  color: DiskColor
}

export type Board = Array<Array<Disk | null>>

export interface Move {
  position: Position
  flipped: Position[]
}

export interface GameHistory {
  board: Board
  currentPlayer: DiskColor
  blackCount: number
  whiteCount: number
  move: Move | null
}

export type GameMode = 'ai' | 'local'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type GameStatus = 'playing' | 'black-wins' | 'white-wins' | 'draw'
