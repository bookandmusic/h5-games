import {
  ADULT_EXAM_RETAKE_MINUTES,
  ADULT_HIGH_GRADUATION_CREDITS,
  ADULT_HIGH_GRADUATION_KNOWLEDGE,
  ADULT_HIGH_GRADUATION_REPUTATION,
  ADULT_HIGH_WORK_BUSINESS_MONEY,
  ADULT_HIGH_WORK_BUSINESS_REPUTATION,
  ADULT_NORMAL_GRADUATION_MINUTES,
  ADULT_NORMAL_WORK_BUSINESS_MONEY,
  ADULT_NORMAL_WORK_BUSINESS_REPUTATION,
  BASE_CLICK_REDUCTION_SEC,
  BASIC_WORK_ADULT_EXAM_KNOWLEDGE,
  BASIC_WORK_ADULT_EXAM_MONEY,
  CLICK_CHAIN_RESET_MS,
  COLLEGE_BUSINESS_SCORE,
  COLLEGE_NORMAL_GRADUATION_MINUTES,
  COLLEGE_WORK_BUSINESS_MONEY,
  COLLEGE_WORK_BUSINESS_REPUTATION,
  COLLEGE_TO_BUSINESS_REPUTATION,
  DIFFICULTY_PARAMS,
  HIGHSCHOOL_FORCE_EXAM_MINUTES,
  HIGHSCHOOL_TO_EXAM_KNOWLEDGE,
  HIGHSCHOOL_TO_EXAM_PREP,
  LEVEL_EXP_CURVE,
  MIN_CLICK_DECAY_MULTIPLIER,
  WORK_PROMOTION_INCOME_MULTIPLIER,
  WORK_TO_BUSINESS_REPUTATION,
} from './constants'
import { eventMap } from './events'
import { skillDefinitions } from './skills'
import { skinDefinitions } from './skins'
import { taskDefinitions } from './tasks'
import { clamp } from './utils/math'
import type {
  EventDefinition,
  EventId,
  MiniGameId,
  PlayerState,
  RewardSet,
  SkinDefinition,
  TaskDefinition,
} from './types'

export const taskMap = Object.fromEntries(taskDefinitions.map((task) => [task.id, task]))
const repeatableAutoEventIds = new Set<EventId>([
  'adult-exam-eligible',
  'adult-exam-start-mainline',
  'adult-exam-start-postgame',
  'adult-exam-pass-mainline',
  'adult-exam-pass-postgame',
  'adult-exam-fail-mainline',
  'adult-exam-fail-postgame',
])

export const getSkillCost = (skillId: string, level: number) => {
  const skill = skillDefinitions.find((entry) => entry.id === skillId)
  if (!skill) return Infinity
  return skill.costCurve[Math.min(level, skill.costCurve.length - 1)] ?? Infinity
}

export const getLevelFromExp = (exp: number) => {
  let level = 1
  for (let i = 1; i < LEVEL_EXP_CURVE.length; i += 1) {
    if (exp >= LEVEL_EXP_CURVE[i]) {
      level = i + 1
    }
  }
  return level
}

export const getDifficultyParams = (state: PlayerState) => DIFFICULTY_PARAMS[state.difficulty]

export const getThreshold = (state: PlayerState, baseValue: number) => {
  const multiplier = getDifficultyParams(state).thresholdMultiplier
  if (state.difficulty === 'easy') return Math.floor(baseValue * multiplier)
  if (state.difficulty === 'hard') return Math.ceil(baseValue * multiplier)
  return baseValue
}

export const getWealthFreeTarget = (state: PlayerState) =>
  getDifficultyParams(state).wealthFreeTarget

export const getWorkIncomeMultiplier = (state: PlayerState) => {
  if (state.graduatedCollege) return 1.35
  if (state.adultCollegeGraduated && state.adultGraduationTier === 'high') return 1.24
  if (state.adultCollegeGraduated && state.adultGraduationTier === 'normal') return 1.14
  if (state.phase === 'work-study') return 0.85
  return 1
}

export const getRouteWorkSuccessBonus = (state: PlayerState, task: TaskDefinition) => {
  if (!['parttime', 'work'].includes(task.category)) return 0
  if (state.graduatedCollege) return 0.06
  if (state.adultCollegeGraduated && state.adultGraduationTier === 'high') return 0.04
  if (state.adultCollegeGraduated && state.adultGraduationTier === 'normal') return 0.025
  return 0
}

export const isRequirementMet = (state: PlayerState, requirement: string) => {
  if (!requirement) return true

  const [kind, key, rawValue] = requirement.split(':')

  switch (kind) {
    case 'knowledge':
      return state.knowledge >= getThreshold(state, Number(key))
    case 'money':
      return state.money >= getThreshold(state, Number(key))
    case 'wealthFreeTarget':
      return state.money >= getWealthFreeTarget(state)
    case 'mainCleared':
      return state.meta.mainCleared === (key === 'true')
    case 'collectionShopUnlocked':
      return state.meta.collectionShopUnlocked === (key === 'true')
    case 'reputation':
      return state.reputation >= getThreshold(state, Number(key))
    case 'level':
      return state.level >= Number(key)
    case 'prep':
      return state.exam.prepProgress >= getThreshold(state, Number(key))
    case 'collegeScore':
      return state.collegeScore >= getThreshold(state, Number(key))
    case 'adultCredits':
      return state.adultCredits >= getThreshold(state, Number(key))
    case 'adultGraduationTier':
      return state.adultGraduationTier === key
    case 'adultExamEntryType':
      return state.exam.adultExamEntryType === key
    case 'adultExamTaken':
      return state.exam.adultExamTaken === (key === 'true')
    case 'adultExamStartPromptShown':
      return state.exam.adultExamStartPromptShown === (key === 'true')
    case 'adultExamPassedState':
      return state.exam.adultExamPassed === (key === 'true')
    case 'entranceExamTaken':
      return state.exam.entranceExamTaken === (key === 'true')
    case 'entranceExamPassedState':
      return state.exam.entranceExamPassed === (key === 'true')
    case 'adultCollegeGraduated':
      return state.adultCollegeGraduated === (key === 'true')
    case 'graduatedCollege':
      return state.graduatedCollege === (key === 'true')
    case 'businessReady':
      return state.businessReady === (key === 'true')
    case 'workPromotion':
      return state.workPromotion === (key === 'true')
    case 'entranceExamForced':
      return state.entranceExamForced === (key === 'true')
    case 'phase':
      return state.phase === key
    case 'phaseMinutes':
      return state.phaseElapsedMinutes >= getThreshold(state, Number(key))
    case 'route':
      return state.route === key
    case 'event':
      return state.completedEventIds.includes(key as EventId)
    case 'task':
      return (state.taskCompletionCount[key] ?? 0) >= Number(rawValue)
    default:
      return false
  }
}

export const areRequirementsMet = (state: PlayerState, requirements: string[]) =>
  requirements.every((requirement) => isRequirementMet(state, requirement))

export const getAvailableTasks = (state: PlayerState) =>
  taskDefinitions.filter((task) => {
    if (!task.phase.includes(state.phase)) return false
    if (task.route && state.route !== 'none' && !task.route.includes(state.route)) return false
    return areRequirementsMet(state, task.unlockRequirements)
  })

export const getPhaseTasks = (state: PlayerState) =>
  taskDefinitions.filter((task) => {
    if (!task.phase.includes(state.phase)) return false
    if (task.route && state.route !== 'none' && !task.route.includes(state.route)) return false
    return true
  })

export const getUnmetRequirements = (state: PlayerState, requirements: string[]) =>
  requirements.filter((requirement) => !isRequirementMet(state, requirement))

export const getVisibleEvents = (state: PlayerState) =>
  Object.values(eventMap).filter(
    (event) =>
      !state.completedEventIds.includes(event.id) &&
      areRequirementsMet(state, event.unlockRequirements)
  )

export const getAvailableMinigames = <
  T extends {
    id: MiniGameId
    unlockRequirements: string[]
  },
>(
  state: PlayerState,
  definitions: T[]
) => definitions.filter((item) => areRequirementsMet(state, item.unlockRequirements))

export const getTaskSuccessRate = (state: PlayerState, task: TaskDefinition) => {
  const studyBonus = task.affectedBySkills.includes('study') ? state.skillLevels.study * 0.025 : 0
  const focusBonus = task.affectedBySkills.includes('focus') ? state.skillLevels.focus * 0.018 : 0
  const actionBonus = task.affectedBySkills.includes('action')
    ? state.skillLevels.action * 0.012
    : 0
  const socialBonus = task.affectedBySkills.includes('social') ? state.skillLevels.social * 0.02 : 0
  const businessBonus = task.affectedBySkills.includes('business')
    ? state.skillLevels.business * 0.025
    : 0
  const sprintBonus =
    state.task.sprintActiveUntil && state.task.sprintActiveUntil > Date.now()
      ? task.sprintSuccessBonus
      : 0
  return clamp(
    task.baseSuccessRate +
      studyBonus +
      focusBonus +
      actionBonus +
      socialBonus +
      businessBonus +
      sprintBonus +
      getRouteWorkSuccessBonus(state, task) +
      getDifficultyParams(state).taskSuccessRateOffset +
      Math.min(state.level * 0.002, 0.04),
    0.35,
    0.98
  )
}

export const resolveTaskRewards = (
  state: PlayerState,
  task: TaskDefinition,
  rewards: RewardSet
) => {
  const workIncomeMultiplier = ['parttime', 'work'].includes(task.category)
    ? getWorkIncomeMultiplier(state)
    : 1
  const promotionMultiplier =
    state.phase === 'work-basic' &&
    state.workPromotion &&
    ['parttime', 'work'].includes(task.category)
      ? WORK_PROMOTION_INCOME_MULTIPLIER
      : 1
  const workStudyStudyMultiplier =
    state.phase === 'work-study' && ['study', 'exam-prep', 'campus'].includes(task.category)
      ? 0.75
      : 1
  const difficultyParams = getDifficultyParams(state)
  const socialMultiplier = task.affectedBySkills.includes('social')
    ? 1 + state.skillLevels.social * 0.08
    : 1
  const businessMultiplier = task.affectedBySkills.includes('business')
    ? 1 + state.skillLevels.business * 0.1
    : 1
  const studyMultiplier = task.affectedBySkills.includes('study')
    ? 1 + state.skillLevels.study * 0.08
    : 1
  const canProduceMoney = ['parttime', 'work', 'business'].includes(task.category)
  const baseMoney = canProduceMoney ? (rewards.money ?? 0) : 0

  return {
    exp: Math.round(
      (rewards.exp ?? 0) *
        (1 + Math.min(state.level, 20) * 0.02) *
        difficultyParams.expRewardMultiplier
    ),
    money: Math.round(
      baseMoney *
        workIncomeMultiplier *
        promotionMultiplier *
        socialMultiplier *
        businessMultiplier *
        (['parttime', 'work', 'business'].includes(task.category)
          ? 1 + Math.min(0.004 * Math.min(state.level, 20), 0.08)
          : 1) *
        difficultyParams.moneyRewardMultiplier
    ),
    knowledge: Math.round(
      (rewards.knowledge ?? 0) *
        studyMultiplier *
        workStudyStudyMultiplier *
        (1 + Math.min(0.006 * Math.min(state.level, 20), 0.12)) *
        difficultyParams.knowledgeRewardMultiplier
    ),
    reputation: Math.round(
      (rewards.reputation ?? 0) *
        socialMultiplier *
        businessMultiplier *
        (1 + Math.min(0.005 * Math.min(state.level, 20), 0.1)) *
        difficultyParams.reputationRewardMultiplier
    ),
  }
}

export const calculateClickReductionSec = (
  actionLevel: number,
  clickChain: number,
  lastClickAt: number | null
) => {
  const chain = lastClickAt && Date.now() - lastClickAt > CLICK_CHAIN_RESET_MS ? 0 : clickChain
  const decay = clamp(1 - chain * 0.06, MIN_CLICK_DECAY_MULTIPLIER, 1)
  return BASE_CLICK_REDUCTION_SEC * (1 + actionLevel * 0.1) * decay
}

export const calculateExamPassRate = (state: PlayerState) => {
  const difficultyParams = getDifficultyParams(state)
  const knowledgeBonus = clamp((state.knowledge / 140) * 25, 0, 25)
  const studyBonus = clamp((state.skillLevels.study - 1) * 3, 0, 15)
  const prepBonus = clamp((state.exam.prepProgress / 100) * 10, 0, 10)
  const minigameBonus = clamp(
    state.exam.lastScoreBonus * difficultyParams.examBonusMultiplier,
    0,
    10
  )
  return clamp(
    difficultyParams.examBasePassRate + knowledgeBonus + studyBonus + prepBonus + minigameBonus,
    difficultyParams.examMinPassRate,
    difficultyParams.examMaxPassRate
  )
}

export const shouldAdvanceToExam = (state: PlayerState) => {
  if (state.phase !== 'highschool') return false
  if (state.phaseElapsedMinutes >= HIGHSCHOOL_FORCE_EXAM_MINUTES) return true
  return (
    state.knowledge >= getThreshold(state, HIGHSCHOOL_TO_EXAM_KNOWLEDGE) &&
    state.exam.prepProgress >= getThreshold(state, HIGHSCHOOL_TO_EXAM_PREP)
  )
}

export const shouldForceAdvanceToExam = (state: PlayerState) =>
  state.phase === 'highschool' &&
  state.phaseElapsedMinutes >= HIGHSCHOOL_FORCE_EXAM_MINUTES &&
  !(
    state.knowledge >= getThreshold(state, HIGHSCHOOL_TO_EXAM_KNOWLEDGE) &&
    state.exam.prepProgress >= getThreshold(state, HIGHSCHOOL_TO_EXAM_PREP)
  )

export const isBusinessReady = (state: PlayerState) => {
  if (state.phase === 'college') {
    return (
      state.collegeScore >= getThreshold(state, COLLEGE_BUSINESS_SCORE) &&
      state.reputation >= getThreshold(state, COLLEGE_TO_BUSINESS_REPUTATION)
    )
  }
  if (state.phase === 'work-basic') {
    return (
      state.workPromotion && state.reputation >= getThreshold(state, WORK_TO_BUSINESS_REPUTATION)
    )
  }
  if (state.phase === 'work-advanced-college') {
    return (
      state.reputation >= getThreshold(state, COLLEGE_WORK_BUSINESS_REPUTATION) &&
      state.money >= getThreshold(state, COLLEGE_WORK_BUSINESS_MONEY)
    )
  }
  if (state.phase === 'work-advanced-adult-high') {
    return (
      state.reputation >= getThreshold(state, ADULT_HIGH_WORK_BUSINESS_REPUTATION) &&
      state.money >= getThreshold(state, ADULT_HIGH_WORK_BUSINESS_MONEY)
    )
  }
  if (state.phase === 'work-advanced-adult-normal') {
    return (
      state.reputation >= getThreshold(state, ADULT_NORMAL_WORK_BUSINESS_REPUTATION) &&
      state.money >= getThreshold(state, ADULT_NORMAL_WORK_BUSINESS_MONEY)
    )
  }
  return false
}

export const shouldMainClear = (state: PlayerState) => {
  return !state.meta.mainCleared && state.money >= getWealthFreeTarget(state)
}

export const getMainClearEventId = (state: PlayerState): EventId => {
  if (state.phase === 'business') return 'wealth-clear-business'
  if (state.phase === 'work-study') return 'wealth-clear-work-study'
  if (state.phase === 'work-advanced-college') return 'wealth-clear-college-work'
  if (state.phase === 'work-advanced-adult-high') return 'wealth-clear-adult-high-work'
  if (state.phase === 'work-advanced-adult-normal') return 'wealth-clear-adult-normal-work'
  return 'wealth-clear-basic-work'
}

export const getCareerYears = (state: PlayerState) =>
  Math.max(1, Math.ceil(state.careerMinutes / 720))

export const getEndingTitle = (state: PlayerState) => {
  if (state.ending?.title) return state.ending.title
  if (state.phase === 'business') return '创业掌舵人'
  if (state.graduatedCollege) return '高知实干派'
  if (state.adultCollegeGraduated) return '逆袭进修生'
  if (state.adultExamPassed && !state.adultCollegeGraduated) return '边工边学践行者'
  return '牛马打工人'
}

export const getEndingDescription = (state: PlayerState) => {
  if (state.ending?.description) return state.ending.description
  const years = state.ending?.careerYears ?? getCareerYears(state)
  const title = getEndingTitle(state)
  if (title === '创业掌舵人') {
    return `通过 ${years} 年经营，你终于实现财富自由。恭喜您获得「创业掌舵人」`
  }
  if (title === '高知实干派') {
    return `经过 ${years} 年实干，你终于实现财富自由。恭喜您获得「高知实干派」`
  }
  if (title === '逆袭进修生') {
    return `经过 ${years} 年打拼与进修，你终于实现财富自由。恭喜您获得「逆袭进修生」`
  }
  if (title === '边工边学践行者') {
    return `经过 ${years} 年边工边学，你终于实现财富自由。恭喜您获得「边工边学践行者」`
  }
  return `经过 ${years} 年打拼，你终于实现财富自由。恭喜您获得「牛马打工人」`
}

export const shouldCollegeGraduateExcellent = (state: PlayerState) =>
  state.phase === 'college' &&
  state.collegeScore >= getThreshold(state, COLLEGE_BUSINESS_SCORE) &&
  state.reputation >= getThreshold(state, COLLEGE_TO_BUSINESS_REPUTATION)

export const shouldCollegeGraduateNormal = (state: PlayerState) =>
  state.phase === 'college' && state.phaseElapsedMinutes >= COLLEGE_NORMAL_GRADUATION_MINUTES

export const canEnterAdultExam = (state: PlayerState) => {
  if (state.phase !== 'work-basic') return false
  const retakeAt = state.adultExamFailedAtMinutes
  const retakeReady =
    retakeAt === null || state.careerMinutes - retakeAt >= ADULT_EXAM_RETAKE_MINUTES
  return (
    retakeReady &&
    state.knowledge >= getThreshold(state, BASIC_WORK_ADULT_EXAM_KNOWLEDGE) &&
    state.money >= getThreshold(state, BASIC_WORK_ADULT_EXAM_MONEY)
  )
}

export const shouldAdultGraduateHigh = (state: PlayerState) =>
  state.phase === 'work-study' &&
  state.adultCredits >= getThreshold(state, ADULT_HIGH_GRADUATION_CREDITS) &&
  state.knowledge >= getThreshold(state, ADULT_HIGH_GRADUATION_KNOWLEDGE) &&
  state.reputation >= getThreshold(state, ADULT_HIGH_GRADUATION_REPUTATION)

export const shouldAdultGraduateNormal = (state: PlayerState) =>
  state.phase === 'work-study' && state.phaseElapsedMinutes >= ADULT_NORMAL_GRADUATION_MINUTES

export const getPendingAutoEvents = (state: PlayerState) => {
  const triggered: EventDefinition[] = []
  for (const event of Object.values(eventMap)) {
    if (!repeatableAutoEventIds.has(event.id) && state.completedEventIds.includes(event.id))
      continue
    if (areRequirementsMet(state, event.unlockRequirements)) {
      triggered.push(event)
    }
  }
  return triggered
}

export const resolvePrepGain = (taskId: string) => {
  if (taskId === 'study-notes') return 8
  if (taskId === 'study-review') return 10
  if (taskId === 'study-mock-exam') return 12
  if (taskId === 'exam-last-review') return 10
  return 0
}

export const resolveCollegeScoreGain = (taskId: string) => {
  if (taskId === 'college-thesis') return 24
  if (taskId === 'college-competition') return 32
  return 0
}

export const resolveAdultCreditGain = (taskId: string) => {
  if (taskId === 'ws-night-class') return 16
  if (taskId === 'ws-weekend-project') return 22
  if (taskId === 'ws-exam-prep') return 28
  return 0
}

export const getSkinUnlocks = (state: PlayerState) =>
  skinDefinitions.filter(
    (skin) =>
      !state.collection.ownedSkinIds.includes(skin.id) &&
      !!skin.unlockRequirement &&
      isRequirementMet(state, skin.unlockRequirement)
  )

export const canBuySkin = (state: PlayerState, skin: SkinDefinition) => {
  if (state.collection.ownedSkinIds.includes(skin.id)) return false
  if (!state.meta.collectionShopUnlocked) return false
  return (skin.buyPrice ?? 0) > 0 && state.money >= (skin.buyPrice ?? 0)
}

export const getSkinPrice = (skin: SkinDefinition) => {
  if (skin.buyPrice) return skin.buyPrice
  if (skin.rarity === 'route') return 180
  if (skin.rarity === 'rare') return 120
  return 80
}
