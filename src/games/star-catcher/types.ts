export type ItemType = 'star' | 'sapphire' | 'amethyst' | 'lucky' | 'meteor' | 'shield'

export type GamePhase = 'idle' | 'countdown' | 'playing' | 'ended'

export type GameMode = 'timed' | 'endless'

export interface FallingItem {
  id: number
  type: ItemType
  x: number
  y: number
  speed: number
  size: number
  rotation: number
  rotationSpeed: number
  glowIntensity: number
  glowPhase: number
  trail: import('./trailBuffer').TrailBuffer
  opacity: number
  points: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  decay: number
}

export interface ComboRing {
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  color: string
}

export interface FloatingText {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
  color: string
  size: number
}

export interface ScorePopup {
  x: number
  y: number
  value: number
  life: number
  maxLife: number
  combo: number
}

export interface GameConfig {
  mode: GameMode
  timedDuration: number
}

export interface HighScoreEntry {
  score: number
  date: string
  starsCollected: number
  maxCombo: number
  duration: number
  modeLabel?: string
}

export interface RunStats {
  rareGems: number
  shieldBlocks: number
  meteorHits: number
  completed: boolean
}

export type AchievementId =
  | 'first-catch'
  | 'combo-chain'
  | 'crystal-hunter'
  | 'shield-calibration'
  | 'meteor-dodge'
  | 'peak-catch'

export interface AchievementProgress {
  gamesPlayed: number
  bestScore: number
  bestCombo: number
  totalRareGems: number
  shieldBlocks: number
  noMeteorTimedClears: number
}

export interface AchievementState {
  unlocked: Partial<Record<AchievementId, string>>
  progress: AchievementProgress
}

export interface GameRecords {
  timed: {
    highScore: number
    history: HighScoreEntry[]
  }
  endless: {
    highScore: number
    longestDuration: number
    history: HighScoreEntry[]
  }
}

export interface GameDifficulty {
  spawnInterval: number
  speedMin: number
  speedMax: number
  meteorWeight: number
  shieldWeight: number
}

export const ITEM_SCORES: Record<ItemType, number> = {
  star: 10,
  sapphire: 20,
  amethyst: 30,
  lucky: 50,
  meteor: -1,
  shield: 0,
}

export const ITEM_WEIGHTS: Record<ItemType, number> = {
  star: 55,
  sapphire: 18,
  amethyst: 8,
  lucky: 4,
  meteor: 12,
  shield: 3,
}

export const ITEM_COLORS: Record<ItemType, string> = {
  star: '#ffd700',
  sapphire: '#00d4ff',
  amethyst: '#b388ff',
  lucky: '#ff6ec7',
  meteor: '#ff4444',
  shield: '#00e676',
}

export const COMBO_THRESHOLDS = [0, 3, 5, 8, 13, 20]
export const COMBO_MULTIPLIERS = [1, 1.5, 2, 3, 4, 5]
