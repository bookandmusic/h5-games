import { gameStorage } from '../../stores/gameStorage'
import type {
  AchievementId,
  AchievementProgress,
  AchievementState,
  GameMode,
  HighScoreEntry,
  RunStats,
} from './types'

export interface AchievementDefinition {
  id: AchievementId
  name: string
  icon: string
  condition: string
  target: number
  getValue: (progress: AchievementProgress) => number
  formatValue?: (value: number) => string
}

export interface FinalRunSummary {
  score: number
  starsCollected: number
  maxCombo: number
  elapsed: number
}

export const ACHIEVEMENT_STORAGE_KEY = 'star-catcher-achievements'

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-catch',
    name: '星尘初采',
    icon: '✦',
    condition: '完成 1 次捕获',
    target: 1,
    getValue: (progress) => progress.gamesPlayed,
  },
  {
    id: 'combo-chain',
    name: '连锁捕获',
    icon: '◇',
    condition: '单局达到 10 连击',
    target: 10,
    getValue: (progress) => progress.bestCombo,
  },
  {
    id: 'crystal-hunter',
    name: '晶簇猎手',
    icon: '◆',
    condition: '累计捕获 10 个稀有晶体',
    target: 10,
    getValue: (progress) => progress.totalRareGems,
  },
  {
    id: 'shield-calibration',
    name: '护盾校准',
    icon: '⬡',
    condition: '用护盾抵消 1 次陨石',
    target: 1,
    getValue: (progress) => progress.shieldBlocks,
  },
  {
    id: 'meteor-dodge',
    name: '陨石规避',
    icon: '△',
    condition: '限时采集无陨石伤害完成 1 局',
    target: 1,
    getValue: (progress) => progress.noMeteorTimedClears,
  },
  {
    id: 'peak-catch',
    name: '最高捕获',
    icon: '◎',
    condition: '单局分数达到 1000',
    target: 1000,
    getValue: (progress) => progress.bestScore,
    formatValue: (value) => value.toLocaleString(),
  },
]

export function createDefaultAchievementState(): AchievementState {
  return {
    unlocked: {},
    progress: {
      gamesPlayed: 0,
      bestScore: 0,
      bestCombo: 0,
      totalRareGems: 0,
      shieldBlocks: 0,
      noMeteorTimedClears: 0,
    },
  }
}

export async function loadAchievementState(): Promise<AchievementState> {
  const saved = await gameStorage.loadGameState<AchievementState>(ACHIEVEMENT_STORAGE_KEY)
  const fallback = createDefaultAchievementState()

  return {
    unlocked: saved?.unlocked ?? fallback.unlocked,
    progress: {
      ...fallback.progress,
      ...(saved?.progress ?? {}),
    },
  }
}

export async function saveAchievementState(state: AchievementState): Promise<void> {
  await gameStorage.saveGameState(ACHIEVEMENT_STORAGE_KEY, state)
}

export function applyRunToAchievements(
  current: AchievementState,
  mode: GameMode,
  result: FinalRunSummary,
  runStats: RunStats
): { state: AchievementState; newUnlocks: AchievementDefinition[] } {
  const progress: AchievementProgress = {
    gamesPlayed: current.progress.gamesPlayed + 1,
    bestScore: Math.max(current.progress.bestScore, result.score),
    bestCombo: Math.max(current.progress.bestCombo, result.maxCombo),
    totalRareGems: current.progress.totalRareGems + runStats.rareGems,
    shieldBlocks: current.progress.shieldBlocks + runStats.shieldBlocks,
    noMeteorTimedClears:
      current.progress.noMeteorTimedClears +
      (mode === 'timed' && runStats.completed && runStats.meteorHits === 0 ? 1 : 0),
  }

  const unlocked = { ...current.unlocked }
  const newUnlocks: AchievementDefinition[] = []
  const unlockedAt = new Date().toLocaleDateString('zh-CN')

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked[achievement.id]) continue
    if (achievement.getValue(progress) >= achievement.target) {
      unlocked[achievement.id] = unlockedAt
      newUnlocks.push(achievement)
    }
  }

  return { state: { unlocked, progress }, newUnlocks }
}

export function getEndlessTopEntries(endless: HighScoreEntry[]) {
  return endless
    .map((entry) => ({ ...entry, modeLabel: '无尽星雨' }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
