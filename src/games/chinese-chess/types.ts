export type PieceColor = 'red' | 'black'
export type PieceType =
  | 'general'
  | 'advisor'
  | 'elephant'
  | 'horse'
  | 'chariot'
  | 'cannon'
  | 'soldier'

export interface Position {
  row: number
  col: number
}

export interface Piece {
  id: string
  color: PieceColor
  type: PieceType
}

export type Board = Array<Array<Piece | null>>

export interface Move {
  from: Position
  to: Position
  piece: Piece
  captured?: Piece | null
}

export type GameMode = 'ai' | 'local'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'hardest'
export type Side = PieceColor
