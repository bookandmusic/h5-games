export type RouteId = 'none' | 'college' | 'work'

export type PhaseId =
  | 'highschool'
  | 'exam'
  | 'college'
  | 'work-basic'
  | 'adult-exam'
  | 'work-study'
  | 'work-advanced-college'
  | 'work-advanced-adult-high'
  | 'work-advanced-adult-normal'
  | 'business'
  | 'postgame'

export type SkillId = 'study' | 'focus' | 'action' | 'social' | 'business'

export type MiniGameId = 'knowledge-quiz' | 'part-time-rush' | 'biz-auction'

export type DifficultyId = 'easy' | 'medium' | 'hard'

export type AdultExamEntryType = 'mainline' | 'postgame'

export type AdultGraduationTier = 'none' | 'high' | 'normal'

export type EventId =
  | 'intro-start'
  | 'monthly-exam'
  | 'mock-exam'
  | 'entrance-exam'
  | 'entrance-exam-pass'
  | 'entrance-exam-fail'
  | 'entrance-exam-ready'
  | 'entrance-exam-forced'
  | 'college-midterm'
  | 'college-graduate-excellent'
  | 'college-graduate-normal'
  | 'work-promotion'
  | 'adult-exam-eligible'
  | 'adult-exam-start-mainline'
  | 'adult-exam-start-postgame'
  | 'adult-exam-pass-mainline'
  | 'adult-exam-pass-postgame'
  | 'adult-exam-fail-mainline'
  | 'adult-exam-fail-postgame'
  | 'adult-college-graduate-high'
  | 'adult-college-graduate-normal'
  | 'business-qualify-work'
  | 'business-qualify-college'
  | 'business-qualify-adult-high'
  | 'business-qualify-adult-normal'
  | 'business-unlock'
  | 'wealth-clear-basic-work'
  | 'wealth-clear-work-study'
  | 'wealth-clear-college-work'
  | 'wealth-clear-adult-high-work'
  | 'wealth-clear-adult-normal-work'
  | 'wealth-clear-business'
  | 'collection-shop-unlock'

export type RewardSet = {
  exp?: number
  money?: number
  knowledge?: number
  reputation?: number
}

export type MiniGameStats = {
  bestScore: number
  playCount: number
}

export type ExamState = {
  entranceExamTaken: boolean
  entranceExamPassed: boolean | null
  prepProgress: number
  lastScoreBonus: number
  adultExamTaken: boolean
  adultExamPassed: boolean | null
  adultExamEntryType: AdultExamEntryType
  adultExamStartPromptShown: boolean
}

export type CollectionState = {
  ownedSkinIds: string[]
  equippedSkinId: string
}

export type RuntimeTaskState = {
  currentTaskId: string | null
  queuedTaskIds: string[]
  startedAt: number | null
  endsAt: number | null
  penaltyEndsAt: number | null
  sprintCharge: number
  sprintActiveUntil: number | null
  clickChain: number
}

export type MetaState = {
  version: number
  mainCleared: boolean
  collectionShopUnlocked: boolean
  collectionCompleted: boolean
}

export type EndingState = {
  title: string | null
  description: string | null
  careerYears: number | null
  eventId: EventId | null
  achievedAt: number | null
}

export type EndingRecord = {
  title: string
  description: string
  careerYears: number
  eventId: EventId
  achievedAt: number
}

export type PlayerState = {
  difficulty: DifficultyId
  level: number
  exp: number
  money: number
  knowledge: number
  reputation: number
  route: RouteId
  phase: PhaseId
  businessReady: boolean
  workPromotion: boolean
  entranceExamForced: boolean
  graduatedCollege: boolean
  adultExamPassed: boolean
  adultCollegeGraduated: boolean
  adultGraduationTier: AdultGraduationTier
  adultExamFailedAtMinutes: number | null
  adultCredits: number
  collegeScore: number
  phaseElapsedMinutes: number
  careerMinutes: number
  completedEventIds: string[]
  taskCompletionCount: Record<string, number>
  taskResults: TaskSettlement[]
  skillLevels: Record<SkillId, number>
  task: RuntimeTaskState
  exam: ExamState
  minigameStats: Record<MiniGameId, MiniGameStats>
  collection: CollectionState
  ending: EndingState
  endingRecords: EndingRecord[]
  meta: MetaState
}

export type SaveSlot = {
  id: string
  difficulty: DifficultyId
  state: PlayerState
  updatedAt: number
}

export type SaveArchive = {
  version: number
  activeSlotId: string | null
  difficultyUnlocked: boolean
  slots: SaveSlot[]
}

export type TaskCategory =
  | 'study'
  | 'exam-prep'
  | 'campus'
  | 'parttime'
  | 'work'
  | 'business'
  | 'recovery'

export type TaskDefinition = {
  id: string
  name: string
  category: TaskCategory
  phase: PhaseId[]
  route?: RouteId[]
  durationMinutes: number
  durationSec: number
  baseSuccessRate: number
  successRewards: RewardSet
  failRewards: RewardSet
  failPenaltySec: number
  sprintChargePerClick: number
  sprintDurationSec: number
  sprintProgressMultiplier: number
  sprintSuccessBonus: number
  affectedBySkills: SkillId[]
  unlockRequirements: string[]
  backgroundId: string
  description: string
}

export type SkillDefinition = {
  id: SkillId
  name: string
  description: string
  maxLevel: number
  costCurve: number[]
  iconId: string
}

export type SkinPhase = 'highschool' | 'college' | 'work' | 'business'
export type SkinRoute = 'common' | 'college' | 'work' | 'business'
export type SkinRarity = 'common' | 'rare' | 'route'
export type SkinUnlockType = 'story' | 'task' | 'route' | 'money'

export type SkinDefinition = {
  id: string
  name: string
  phase: SkinPhase
  route: SkinRoute
  rarity: SkinRarity
  image: string
  unlockType: SkinUnlockType
  unlockRequirement?: string
  buyPrice?: number
  sourceLabel: string
}

export type EventDefinition = {
  id: EventId
  title: string
  description: string
  phase: PhaseId
  image?: string
  unlockRequirements: string[]
  rewards?: RewardSet
  nextPhase?: PhaseId
  nextRoute?: RouteId
}

export type MiniGameDefinition = {
  id: MiniGameId
  name: string
  iconId: string
  backgroundId: string
  unlockRequirements: string[]
  description: string
}

export type TaskSettlement = {
  taskId: string
  taskName: string
  success: boolean
  successRate: number
  rewards: RewardSet
  failPenaltySec: number
  completedAt: number
}

export type EventPresentation = {
  id: EventId
  title: string
  description: string
  image?: string
  actions?: Array<{
    id: string
    label: string
    primary?: boolean
  }>
}

export type CollectionCardState = 'equipped' | 'owned' | 'buyable' | 'locked'

export type MiniGameRewardResult = {
  score: number
  bonusRate?: number
  rewards?: RewardSet
}
