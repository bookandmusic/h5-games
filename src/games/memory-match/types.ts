export type CardState = 'hidden' | 'revealed' | 'matched'
export type GamePhase = 'playing' | 'checking' | 'completed'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type ThemeId = 'animals' | 'desserts' | 'stars' | 'ocean' | 'plants' | 'magic'

export interface Card {
  id: number
  patternId: number
  state: CardState
  imageName: string
}

export interface DifficultyConfig {
  label: string
  pairs: number
  cols: number
}

export interface ThemeConfig {
  id: ThemeId
  name: string
  cardBackFallback: string
  cardBackImage?: string
  accentColor: string
  backgroundImage: string
  imageNames: string[]
}

export interface BestScore {
  time: number
  moves: number
  date: string
}

export interface SavedData {
  best: Partial<Record<Difficulty, BestScore>>
  stats: { totalGames: number; lastTheme: ThemeId }
}
