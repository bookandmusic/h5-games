import { describe, expect, it, vi } from 'vitest'

vi.mock('../../stores/gameStorage', () => ({
  gameStorage: {
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
  },
}))

import { gameStorage } from '../../stores/gameStorage'
import {
  DEFAULT_MINIGAME_STATS,
  HIGHSCHOOL_TO_EXAM_KNOWLEDGE,
  HIGHSCHOOL_TO_EXAM_PREP,
  LEVEL_EXP_CURVE,
} from './constants'
import { eventMap } from './events'
import { minigameDefinitions } from './minigames'
import {
  canEnterAdultExam,
  getAvailableMinigames,
  getAvailableTasks,
  getSkinUnlocks,
  getSkillCost,
  getVisibleEvents,
  isRequirementMet,
  isBusinessReady,
  getWealthFreeTarget,
  resolveCollegeScoreGain,
  shouldAdvanceToExam,
  shouldForceAdvanceToExam,
  shouldMainClear,
  taskMap,
} from './progression'
import {
  applyEvent,
  applyMiniGameReward,
  applyRewards,
  createInitialPlayerState,
  registerTaskCompletion,
  setFailurePenalty,
  unlockSkin,
} from './reducers'
import { loadCampusJourneyArchive } from './save'
import type { PlayerState, TaskSettlement } from './types'

const mockedGameStorage = vi.mocked(gameStorage)

const succeedTask = (state: PlayerState, taskId: string) => {
  const task = taskMap[taskId]
  const settlement: TaskSettlement = {
    taskId,
    taskName: task.name,
    success: true,
    successRate: 1,
    rewards: task.successRewards,
    failPenaltySec: 0,
    completedAt: Date.now(),
  }

  applyRewards(state, task.successRewards)
  registerTaskCompletion(state, settlement)
}

describe('campus journey stateflow integration', () => {
  it('advances from highschool into exam and exposes the exam minigame', () => {
    const state = createInitialPlayerState()

    state.knowledge = HIGHSCHOOL_TO_EXAM_KNOWLEDGE
    state.exam.prepProgress = HIGHSCHOOL_TO_EXAM_PREP

    expect(shouldAdvanceToExam(state)).toBe(true)

    state.phase = 'exam'

    const minigames = getAvailableMinigames(state, minigameDefinitions)

    expect(minigames.map((item) => item.id)).toContain('knowledge-quiz')

    applyMiniGameReward(state, 'knowledge-quiz', { score: 28, rewards: { exp: 56, knowledge: 42 } })

    applyEvent(state, eventMap['entrance-exam-pass'])

    expect(state.phase).toBe('college')
    expect(state.route).toBe('college')
    expect(state.graduatedCollege).toBe(false)
  })

  it('applies prep progress from the documented final exam review task', () => {
    const state = createInitialPlayerState()
    state.phase = 'exam'

    succeedTask(state, 'exam-last-review')

    expect(state.exam.prepProgress).toBeGreaterThan(0)
  })

  it('only awards college score for documented college tasks', () => {
    expect(resolveCollegeScoreGain('college-thesis')).toBe(24)
    expect(resolveCollegeScoreGain('college-competition')).toBe(32)
    expect(resolveCollegeScoreGain('college-project')).toBe(0)
  })

  it('does not expose exam-ready before the documented knowledge and prep thresholds', () => {
    const state = createInitialPlayerState()
    state.difficulty = 'medium'
    state.knowledge = HIGHSCHOOL_TO_EXAM_KNOWLEDGE
    state.exam.prepProgress = HIGHSCHOOL_TO_EXAM_PREP - 1

    expect(getVisibleEvents(state).map((event) => event.id)).not.toContain('entrance-exam-ready')

    state.exam.prepProgress = HIGHSCHOOL_TO_EXAM_PREP
    expect(getVisibleEvents(state).map((event) => event.id)).toContain('entrance-exam-ready')
  })

  it('uses a distinct forced exam event after the highschool time limit', () => {
    const state = createInitialPlayerState()
    state.phaseElapsedMinutes = 2160
    state.knowledge = 0
    state.exam.prepProgress = 0

    expect(shouldAdvanceToExam(state)).toBe(true)
    expect(shouldForceAdvanceToExam(state)).toBe(true)

    state.entranceExamForced = true
    expect(getVisibleEvents(state).map((event) => event.id)).toContain('entrance-exam-forced')

    applyEvent(state, eventMap['entrance-exam-forced'])

    expect(state.phase).toBe('exam')
    expect(state.entranceExamForced).toBe(false)
  })

  it('graduates college into business, then postgame, then the collection shop in order', () => {
    const state = createInitialPlayerState()

    applyEvent(state, eventMap['entrance-exam-pass'])

    succeedTask(state, 'college-class')
    succeedTask(state, 'college-class')
    succeedTask(state, 'college-class')
    succeedTask(state, 'college-library')
    succeedTask(state, 'college-library')
    succeedTask(state, 'college-lab')
    succeedTask(state, 'college-lab')
    succeedTask(state, 'college-thesis')
    succeedTask(state, 'college-thesis')
    succeedTask(state, 'college-competition')
    succeedTask(state, 'college-competition')

    state.collegeScore = Math.max(state.collegeScore, 80)
    state.reputation = Math.max(state.reputation, 100)
    expect(isBusinessReady(state)).toBe(true)

    applyEvent(state, eventMap['college-graduate-excellent'])

    expect(state.phase).toBe('business')
    expect(state.graduatedCollege).toBe(true)
    expect(getAvailableMinigames(state, minigameDefinitions).map((item) => item.id)).toContain(
      'biz-auction'
    )

    succeedTask(state, 'biz-orders')
    succeedTask(state, 'biz-orders')
    succeedTask(state, 'biz-team')
    succeedTask(state, 'biz-team')
    succeedTask(state, 'biz-sales')
    succeedTask(state, 'biz-sales')
    succeedTask(state, 'biz-auto-profit')

    state.money = Math.max(state.money, getWealthFreeTarget(state))

    expect(shouldMainClear(state)).toBe(true)

    applyEvent(state, eventMap['wealth-clear-business'])

    expect(state.phase).toBe('postgame')
    expect(state.meta.mainCleared).toBe(true)

    applyEvent(state, eventMap['collection-shop-unlock'])

    expect(state.meta.collectionShopUnlocked).toBe(true)

    const unlockedSkins = getSkinUnlocks(state).map((skin) => skin.id)
    expect(unlockedSkins).toContain('skin-biz-award')
  })

  it('restores penalty timers and collection state from save data', async () => {
    const penaltyState = createInitialPlayerState()
    setFailurePenalty(penaltyState, 9)
    unlockSkin(penaltyState, 'skin-hs-casual-afterclass')
    penaltyState.collection.equippedSkinId = 'skin-hs-casual-afterclass'
    penaltyState.meta.mainCleared = true

    const savedState = {
      ...penaltyState,
      minigameStats: {
        ...DEFAULT_MINIGAME_STATS,
        'knowledge-quiz': { bestScore: 32, playCount: 3 },
      },
    }

    mockedGameStorage.loadGameState.mockResolvedValueOnce({
      version: 1,
      activeSlotId: 'slot-1',
      difficultyUnlocked: true,
      slots: [
        {
          id: 'slot-1',
          difficulty: 'easy',
          state: savedState,
          updatedAt: Date.now(),
        },
      ],
    })

    const restored = await loadCampusJourneyArchive()
    const restoredState = restored.slots[0].state

    expect(restoredState.task.penaltyEndsAt).not.toBeNull()
    expect(restoredState.collection.equippedSkinId).toBe('skin-hs-casual-afterclass')
    expect(restoredState.collection.ownedSkinIds).toContain('skin-hs-casual-afterclass')
    expect(restoredState.meta.mainCleared).toBe(true)
    expect(restoredState.minigameStats['knowledge-quiz'].bestScore).toBe(32)
  })

  it('uses the documented knowledge cost tier for skill upgrades', () => {
    expect(getSkillCost('study', 1)).toBe(20)
    expect(getSkillCost('business', 4)).toBe(160)
  })

  it('caps experience growth at level 20', () => {
    const state = createInitialPlayerState()

    applyRewards(state, { exp: 9999 })

    expect(state.level).toBe(20)
    expect(state.exp).toBe(LEVEL_EXP_CURVE[LEVEL_EXP_CURVE.length - 1])
  })

  it('keeps postgame work-basic replay startable without requiring exam failure history', () => {
    const state = createInitialPlayerState()
    state.meta.mainCleared = true
    state.route = 'work'
    state.phase = 'work-basic'
    state.completedEventIds = ['intro-start', 'entrance-exam-pass']

    expect(getAvailableTasks(state).map((task) => task.id)).toContain('work-store')
  })

  it('applies difficulty threshold conversion to resource requirements', () => {
    const state = createInitialPlayerState()
    state.difficulty = 'hard'
    state.knowledge = 39

    expect(isRequirementMet(state, 'knowledge:35')).toBe(false)

    state.knowledge = 40
    expect(isRequirementMet(state, 'knowledge:35')).toBe(true)
  })

  it('respects the adult exam retry cooldown even when the failure timestamp is zero', () => {
    const state = createInitialPlayerState()
    state.phase = 'work-basic'
    state.route = 'work'
    state.knowledge = 110
    state.money = 300
    state.careerMinutes = 0
    state.adultExamFailedAtMinutes = 0

    expect(canEnterAdultExam(state)).toBe(false)

    state.careerMinutes = 720

    expect(canEnterAdultExam(state)).toBe(true)
  })
})
