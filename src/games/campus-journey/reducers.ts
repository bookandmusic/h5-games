import {
  CAMPUS_JOURNEY_SAVE_VERSION,
  DEFAULT_MINIGAME_STATS,
  DEFAULT_SKILL_LEVELS,
  LEVEL_EXP_CURVE,
} from './constants'
import {
  getCareerYears,
  getEndingDescription,
  getEndingTitle,
  getLevelFromExp,
  getSkinPrice,
  resolveAdultCreditGain,
  resolveCollegeScoreGain,
  resolvePrepGain,
} from './progression'
import { skinDefinitions } from './skins'
import type {
  EventDefinition,
  EndingRecord,
  MiniGameId,
  MiniGameRewardResult,
  PlayerState,
  RewardSet,
  TaskSettlement,
} from './types'

const defaultOwnedSkins = ['skin-hs-uniform-basic']
const repeatableEventIds = new Set<string>([
  'adult-exam-eligible',
  'adult-exam-start-mainline',
  'adult-exam-start-postgame',
  'adult-exam-pass-mainline',
  'adult-exam-pass-postgame',
  'adult-exam-fail-mainline',
  'adult-exam-fail-postgame',
])
const mainClearEventIds = new Set<string>([
  'wealth-clear-basic-work',
  'wealth-clear-work-study',
  'wealth-clear-college-work',
  'wealth-clear-adult-high-work',
  'wealth-clear-adult-normal-work',
  'wealth-clear-business',
])

export const createInitialPlayerState = (): PlayerState => ({
  difficulty: 'easy',
  level: 1,
  exp: 0,
  money: 24,
  knowledge: 0,
  reputation: 0,
  route: 'none',
  phase: 'highschool',
  businessReady: false,
  workPromotion: false,
  entranceExamForced: false,
  graduatedCollege: false,
  adultExamPassed: false,
  adultCollegeGraduated: false,
  adultGraduationTier: 'none',
  adultExamFailedAtMinutes: null,
  adultCredits: 0,
  collegeScore: 0,
  phaseElapsedMinutes: 0,
  careerMinutes: 0,
  completedEventIds: [],
  taskCompletionCount: {},
  taskResults: [],
  skillLevels: { ...DEFAULT_SKILL_LEVELS },
  task: {
    currentTaskId: null,
    queuedTaskIds: [],
    startedAt: null,
    endsAt: null,
    penaltyEndsAt: null,
    sprintCharge: 0,
    sprintActiveUntil: null,
    clickChain: 0,
  },
  exam: {
    entranceExamTaken: false,
    entranceExamPassed: null,
    prepProgress: 0,
    lastScoreBonus: 0,
    adultExamTaken: false,
    adultExamPassed: null,
    adultExamEntryType: 'mainline',
    adultExamStartPromptShown: false,
  },
  minigameStats: structuredClone(DEFAULT_MINIGAME_STATS),
  collection: {
    ownedSkinIds: [...defaultOwnedSkins],
    equippedSkinId: 'skin-hs-uniform-basic',
  },
  ending: {
    title: null,
    description: null,
    careerYears: null,
    eventId: null,
    achievedAt: null,
  },
  endingRecords: [],
  meta: {
    version: CAMPUS_JOURNEY_SAVE_VERSION,
    mainCleared: false,
    collectionShopUnlocked: false,
    collectionCompleted: false,
  },
})

export const applyRewards = (state: PlayerState, rewards: RewardSet) => {
  state.exp = Math.min(LEVEL_EXP_CURVE[LEVEL_EXP_CURVE.length - 1], state.exp + (rewards.exp ?? 0))
  state.money += rewards.money ?? 0
  state.knowledge += rewards.knowledge ?? 0
  state.reputation += rewards.reputation ?? 0
  state.level = getLevelFromExp(state.exp)
}

export const clearRuntimeTask = (state: PlayerState) => {
  state.task.currentTaskId = null
  state.task.queuedTaskIds = []
  state.task.startedAt = null
  state.task.endsAt = null
  state.task.penaltyEndsAt = null
  state.task.sprintCharge = 0
  state.task.sprintActiveUntil = null
  state.task.clickChain = 0
}

export const setFailurePenalty = (state: PlayerState, penaltySec: number) => {
  state.task.currentTaskId = null
  state.task.startedAt = null
  state.task.endsAt = null
  state.task.sprintCharge = 0
  state.task.sprintActiveUntil = null
  state.task.clickChain = 0
  state.task.penaltyEndsAt = penaltySec > 0 ? Date.now() + penaltySec * 1000 : null
}

export const registerTaskCompletion = (state: PlayerState, settlement: TaskSettlement) => {
  state.taskCompletionCount[settlement.taskId] =
    (state.taskCompletionCount[settlement.taskId] ?? 0) + 1
  state.taskResults.unshift(settlement)
  state.taskResults = state.taskResults.slice(0, 50)
  if (settlement.success) {
    state.exam.prepProgress = Math.min(
      100,
      state.exam.prepProgress + resolvePrepGain(settlement.taskId)
    )
    state.collegeScore += resolveCollegeScoreGain(settlement.taskId)
    state.adultCredits += resolveAdultCreditGain(settlement.taskId)
  }
}

export const applyEvent = (state: PlayerState, event: EventDefinition) => {
  const repeatable = repeatableEventIds.has(event.id)
  const pendingEndingRecord = mainClearEventIds.has(event.id)
    ? ({
        title: getEndingTitle(state),
        description: getEndingDescription(state),
        careerYears: getCareerYears(state),
        eventId: event.id,
        achievedAt: Date.now(),
      } as EndingRecord)
    : null
  if (!repeatable && state.completedEventIds.includes(event.id)) return
  if (!state.completedEventIds.includes(event.id)) {
    state.completedEventIds.push(event.id)
  }
  if (event.rewards) applyRewards(state, event.rewards)
  if (event.nextPhase && state.phase !== event.nextPhase) {
    state.phase = event.nextPhase
    state.phaseElapsedMinutes = 0
  }
  if (event.nextRoute) state.route = event.nextRoute
  if (event.id === 'entrance-exam-ready') {
    state.phase = 'exam'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'entrance-exam-forced') {
    state.entranceExamForced = false
    state.phase = 'exam'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'entrance-exam-pass') {
    state.exam.entranceExamPassed = true
    state.route = 'college'
    state.phase = 'college'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'entrance-exam-fail') {
    state.exam.entranceExamPassed = false
    state.route = 'work'
    state.phase = 'work-basic'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'college-graduate-excellent') {
    state.graduatedCollege = true
    const isPostgameCollegeExperience =
      state.meta.mainCleared && state.exam.adultExamEntryType === 'postgame'
    if (isPostgameCollegeExperience) {
      state.phase = 'work-advanced-college'
    } else {
      state.businessReady = true
      state.phase = 'business'
    }
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'college-graduate-normal') {
    state.graduatedCollege = true
    state.phase = 'work-advanced-college'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'work-promotion') {
    state.workPromotion = true
  }
  if (event.id === 'adult-exam-eligible') {
    state.exam.adultExamEntryType = 'mainline'
    state.phase = 'adult-exam'
    state.phaseElapsedMinutes = 0
    state.exam.adultExamTaken = false
    state.exam.adultExamPassed = null
    state.exam.adultExamStartPromptShown = false
  }
  if (event.id === 'adult-exam-start-mainline' || event.id === 'adult-exam-start-postgame') {
    state.exam.adultExamStartPromptShown = true
  }
  if (event.id === 'adult-exam-pass-mainline') {
    state.adultExamPassed = true
    state.exam.adultExamPassed = true
    state.phase = 'work-study'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'adult-exam-pass-postgame') {
    state.adultExamPassed = true
    state.exam.adultExamPassed = true
    state.route = 'college'
    state.phase = 'college'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'adult-exam-fail-mainline') {
    state.exam.adultExamPassed = false
    state.adultExamFailedAtMinutes = state.careerMinutes
    state.phase = 'work-basic'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'adult-exam-fail-postgame') {
    state.exam.adultExamPassed = false
    state.phase = 'postgame'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'adult-college-graduate-high') {
    state.adultCollegeGraduated = true
    state.adultGraduationTier = 'high'
    state.phase = 'work-advanced-adult-high'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'adult-college-graduate-normal') {
    state.adultCollegeGraduated = true
    state.adultGraduationTier = 'normal'
    state.phase = 'work-advanced-adult-normal'
    state.phaseElapsedMinutes = 0
  }
  if (
    event.id === 'business-qualify-work' ||
    event.id === 'business-qualify-college' ||
    event.id === 'business-qualify-adult-high' ||
    event.id === 'business-qualify-adult-normal'
  ) {
    state.businessReady = true
    state.phase = 'business'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'business-unlock') {
    state.businessReady = true
    state.phase = 'business'
    state.phaseElapsedMinutes = 0
  }
  if (mainClearEventIds.has(event.id)) {
    if (!state.ending.title && pendingEndingRecord) {
      state.ending.title = pendingEndingRecord.title
      state.ending.description = pendingEndingRecord.description
      state.ending.careerYears = pendingEndingRecord.careerYears
      state.ending.eventId = pendingEndingRecord.eventId
      state.ending.achievedAt = pendingEndingRecord.achievedAt
      state.endingRecords = [pendingEndingRecord, ...state.endingRecords]
    }
    state.meta.mainCleared = true
    state.phase = 'postgame'
    state.phaseElapsedMinutes = 0
  }
  if (event.id === 'collection-shop-unlock') {
    state.meta.collectionShopUnlocked = true
  }
  clearRuntimeTask(state)
}

export const unlockSkin = (state: PlayerState, skinId: string) => {
  if (!state.collection.ownedSkinIds.includes(skinId)) {
    state.collection.ownedSkinIds.push(skinId)
  }
}

export const equipSkin = (state: PlayerState, skinId: string) => {
  if (state.collection.ownedSkinIds.includes(skinId)) {
    state.collection.equippedSkinId = skinId
  }
}

export const buySkin = (state: PlayerState, skinId: string) => {
  const skin = skinDefinitions.find((entry) => entry.id === skinId)
  if (!skin) return false
  const price = getSkinPrice(skin)
  if (state.money < price) return false
  state.money -= price
  unlockSkin(state, skinId)
  state.meta.collectionCompleted = skinDefinitions.every(
    (entry) => state.collection.ownedSkinIds.includes(entry.id) || entry.id === skinId
  )
  return true
}

export const applyMiniGameReward = (
  state: PlayerState,
  miniGameId: MiniGameId,
  result: MiniGameRewardResult
) => {
  const stats = state.minigameStats[miniGameId]
  stats.bestScore = Math.max(stats.bestScore, result.score)
  stats.playCount += 1
  if (result.rewards) {
    applyRewards(state, result.rewards)
  }
}
