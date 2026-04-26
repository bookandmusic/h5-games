import type { MiniGameId, PlayerState, SkillId } from './types'

export const CAMPUS_JOURNEY_GAME_ID = 'campus-journey'
export const CAMPUS_JOURNEY_SAVE_VERSION = 1
export const SPRINT_CHARGE_MAX = 120
export const BASE_CLICK_REDUCTION_SEC = 1
export const MIN_CLICK_DECAY_MULTIPLIER = 0.5
export const CLICK_CHAIN_RESET_MS = 1400
export const TASK_TICK_MS = 200
export const COLLEGE_TO_BUSINESS_REPUTATION = 100
export const WORK_TO_BUSINESS_REPUTATION = 120
export const WORK_PROMOTION_INCOME_MULTIPLIER = 1.18
export const COLLEGE_BUSINESS_SCORE = 80
export const COLLEGE_NORMAL_GRADUATION_MINUTES = 2880
export const HIGHSCHOOL_FORCE_EXAM_MINUTES = 2160
export const ADULT_HIGH_GRADUATION_CREDITS = 120
export const ADULT_HIGH_GRADUATION_KNOWLEDGE = 180
export const ADULT_HIGH_GRADUATION_REPUTATION = 120
export const ADULT_NORMAL_GRADUATION_MINUTES = 2880
export const ADULT_EXAM_RETAKE_MINUTES = 720
export const BASIC_WORK_ADULT_EXAM_KNOWLEDGE = 110
export const BASIC_WORK_ADULT_EXAM_MONEY = 300
export const COLLEGE_WORK_BUSINESS_REPUTATION = 140
export const COLLEGE_WORK_BUSINESS_MONEY = 1800
export const ADULT_HIGH_WORK_BUSINESS_REPUTATION = 150
export const ADULT_HIGH_WORK_BUSINESS_MONEY = 2200
export const ADULT_NORMAL_WORK_BUSINESS_REPUTATION = 145
export const ADULT_NORMAL_WORK_BUSINESS_MONEY = 2100
export const HIGHSCHOOL_TO_EXAM_KNOWLEDGE = 85
export const HIGHSCHOOL_TO_EXAM_PREP = 45
export const CAREER_MINUTES_PER_YEAR = 720

export const LEVEL_EXP_CURVE = [
  0, 30, 70, 120, 180, 255, 345, 450, 570, 710, 870, 1050, 1255, 1485, 1745, 2040, 2375, 2755, 3185,
  3670,
]

export const DIFFICULTY_PARAMS = {
  easy: {
    thresholdMultiplier: 0.9,
    taskSuccessRateOffset: 0.06,
    expRewardMultiplier: 1.1,
    moneyRewardMultiplier: 1.2,
    knowledgeRewardMultiplier: 1.15,
    reputationRewardMultiplier: 1.1,
    failPenaltyMultiplier: 0.8,
    examBasePassRate: 42,
    examMinPassRate: 20,
    examMaxPassRate: 98,
    examBonusMultiplier: 1.15,
    minigameRewardMultiplier: 1.15,
    wealthFreeTarget: 4200,
  },
  medium: {
    thresholdMultiplier: 1,
    taskSuccessRateOffset: 0,
    expRewardMultiplier: 1,
    moneyRewardMultiplier: 1,
    knowledgeRewardMultiplier: 1,
    reputationRewardMultiplier: 1,
    failPenaltyMultiplier: 1,
    examBasePassRate: 35,
    examMinPassRate: 15,
    examMaxPassRate: 95,
    examBonusMultiplier: 1,
    minigameRewardMultiplier: 1,
    wealthFreeTarget: 5000,
  },
  hard: {
    thresholdMultiplier: 1.12,
    taskSuccessRateOffset: -0.06,
    expRewardMultiplier: 0.92,
    moneyRewardMultiplier: 0.88,
    knowledgeRewardMultiplier: 0.9,
    reputationRewardMultiplier: 0.9,
    failPenaltyMultiplier: 1.25,
    examBasePassRate: 28,
    examMinPassRate: 10,
    examMaxPassRate: 92,
    examBonusMultiplier: 0.85,
    minigameRewardMultiplier: 0.85,
    wealthFreeTarget: 5800,
  },
} as const

export const DEFAULT_SKILL_LEVELS: Record<SkillId, number> = {
  study: 1,
  focus: 1,
  action: 1,
  social: 1,
  business: 1,
}

export const DEFAULT_MINIGAME_STATS: Record<MiniGameId, { bestScore: number; playCount: number }> =
  {
    'knowledge-quiz': { bestScore: 0, playCount: 0 },
    'part-time-rush': { bestScore: 0, playCount: 0 },
    'biz-auction': { bestScore: 0, playCount: 0 },
  }

export const RESOURCE_LABELS: Array<
  keyof Pick<PlayerState, 'exp' | 'money' | 'knowledge' | 'reputation'>
> = ['exp', 'money', 'knowledge', 'reputation']
