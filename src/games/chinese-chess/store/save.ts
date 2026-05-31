import { gameStorage } from '../../../stores/gameStorage'

export type ChineseChessInventory = {
  undo: number
  hint: number
}

export type DailyTaskState = {
  progress: number
  target: number
  completed: boolean
  claimed: boolean
}

export type ChineseChessDailyData = {
  date: string
  loginClaimed: boolean
  tasks: {
    playGame: DailyTaskState
    winGame: DailyTaskState
    winStreak: DailyTaskState
  }
}

export type ChineseChessProfile = {
  coins: number
  inventory: ChineseChessInventory
  level: number
  totalGames: number
  totalWins: number
  wins: number
  highestLevel: number
  currentStreak: number
  daily: ChineseChessDailyData
}

export const SHOP_PRICES = { undo: 15, hint: 25 } as const

export const getLevelUpWins = (level: number): number => level * 2

export const LEVEL_UP_BONUS = 50

const createDailyTasks = (): ChineseChessDailyData['tasks'] => ({
  playGame: { progress: 0, target: 1, completed: false, claimed: false },
  winGame: { progress: 0, target: 1, completed: false, claimed: false },
  winStreak: { progress: 0, target: 2, completed: false, claimed: false },
})

export const createDefaultProfile = (): ChineseChessProfile => ({
  coins: 100,
  inventory: { undo: 0, hint: 0 },
  level: 1,
  totalGames: 0,
  totalWins: 0,
  wins: 0,
  highestLevel: 1,
  currentStreak: 0,
  daily: {
    date: '',
    loginClaimed: false,
    tasks: createDailyTasks(),
  },
})

export const loadStoredValue = async <T extends object>(key: string, fallback: T): Promise<T> => {
  const value = await gameStorage.loadGameState<T>(key)
  if (value === null) return fallback
  return value
}

export const PROFILE_KEY = 'chinese-chess-profile'

export const loadProfile = async (): Promise<ChineseChessProfile> => {
  const profile = await loadStoredValue(PROFILE_KEY, createDefaultProfile())
  const merged = { ...createDefaultProfile(), ...profile }
  merged.daily = {
    ...createDefaultProfile().daily,
    ...profile.daily,
    tasks: { ...createDailyTasks(), ...(profile.daily?.tasks ?? {}) },
  }
  return merged
}

export const saveProfile = async (profile: ChineseChessProfile) => {
  await gameStorage.saveGameState(PROFILE_KEY, profile)
}

export const resetDailyIfNewDay = (profile: ChineseChessProfile): boolean => {
  const today = new Date().toISOString().slice(0, 10)
  if (profile.daily.date !== today) {
    profile.daily.date = today
    profile.daily.loginClaimed = false
    profile.daily.tasks = createDailyTasks()
    return true
  }
  return false
}
