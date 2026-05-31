export type Rarity = 'R' | 'SR' | 'SSR'
export type CardState = 'hidden' | 'revealed' | 'matched'
export type GamePhase = 'playing' | 'checking' | 'completed' | 'blindbox'
export type Difficulty = 'easy' | 'hard'
export type ThemeId = 'urban' | 'ancient' | 'magic' | 'fairytale' | 'steam' | 'scifi'

export interface Card {
  id: number
  patternId: number
  state: CardState
  imageName: string
  rarity: Rarity
  themeId: ThemeId
}

export interface CharacterData {
  id: number
  title: string
  name: string
  rarity: Rarity
  imageIndex: number
}

export interface ThemeConfig {
  id: ThemeId
  name: string
  cardBackFallback: string
  accentColor: string
  imageNames: string[]
  characters: CharacterData[]
}

export interface EconomyData {
  tickets: number
  stamina: number
  staminaTimestamp: number
  pityCount: number
}

export interface DailyQuest {
  id: string
  desc: string
  progress: number
  target: number
  reward: { type: 'tickets' | 'stamina'; amount: number }
  completed: boolean
  claimed: boolean
}

export interface DailyData {
  date: string
  quests: DailyQuest[]
}

export interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
}

export interface PlayerData {
  unlockedCards: number[]
  economy: EconomyData
  daily: DailyData
  settings: GameSettings
  tutorialStep: number
  roundIndex: number
  lastTheme?: ThemeId
  lastDifficulty?: Difficulty
}

export interface BlindBoxItem {
  character: CharacterData
  imageName: string
  isNew: boolean
  ticketAward: number
}

export interface RoundResult {
  stars: 0 | 1 | 2 | 3
  ticketReward: number
  matchedCharacters: CharacterData[]
  blindBoxPool: BlindBoxItem[]
  staminaCost: number
}

export interface DailyQuestDef {
  id: string
  desc: string
  target: number
  reward: { type: 'tickets' | 'stamina'; amount: number }
}

export const RARITY_LABEL: Record<Rarity, string> = { R: 'R', SR: 'SR', SSR: 'SSR' }
export const RARITY_ORDER: Rarity[] = ['R', 'SR', 'SSR']
export const RARITY_WEIGHTS: Record<Rarity, number> = { R: 50, SR: 25, SSR: 5 }
export const RARITY_TICKET_VALUE: Record<Rarity, number> = { R: 1, SR: 3, SSR: 10 }
export const RARITY_SHOP_PRICE: Record<Rarity, number> = { R: 10, SR: 30, SSR: 100 }
export const RARITY_COLORS: Record<Rarity, string> = {
  R: '#4FC3F7',
  SR: '#CE93D8',
  SSR: '#FFD54F',
}

export const STAMINA_MAX = 10
export const STAMINA_RECOVERY_SEC = 1800
export const STAMINA_REFILL_COST = 5
export const SSR_PITY_THRESHOLD = 3
export const HARD_TIME_LIMIT = 120
export const HINT_FREE_USES = 1
export const HINT_MAX_USES = 3
export const EXTRA_TIME_FREE_USES = 1
export const EXTRA_TIME_AMOUNT = 30
