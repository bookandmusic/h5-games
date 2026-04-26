import { describe, expect, it } from 'vitest'

import { eventMap } from './events'
import { minigameDefinitions } from './minigames'
import {
  applyEvent,
  applyMiniGameReward,
  applyRewards,
  createInitialPlayerState,
  registerTaskCompletion,
} from './reducers'
import {
  getAvailableMinigames,
  getSkinUnlocks,
  getTaskSuccessRate,
  resolveTaskRewards,
  taskMap,
} from './progression'
import { skinDefinitions } from './skins'
import { taskDefinitions } from './tasks'
import type { EventId, PhaseId, PlayerState, RouteId, TaskSettlement } from './types'

const validPhases = new Set<PhaseId>([
  'highschool',
  'exam',
  'college',
  'work-basic',
  'adult-exam',
  'work-study',
  'work-advanced-college',
  'work-advanced-adult-high',
  'work-advanced-adult-normal',
  'business',
  'postgame',
])

const validRoutes = new Set<RouteId>(['none', 'college', 'work'])
const booleanKinds = new Set([
  'mainCleared',
  'collectionShopUnlocked',
  'adultExamTaken',
  'adultExamStartPromptShown',
  'entranceExamTaken',
  'adultCollegeGraduated',
  'graduatedCollege',
  'businessReady',
  'workPromotion',
  'entranceExamForced',
])

const validateRequirement = (requirement: string) => {
  const [kind, key, rawValue] = requirement.split(':')

  switch (kind) {
    case 'knowledge':
    case 'money':
    case 'reputation':
    case 'level':
    case 'prep':
    case 'collegeScore':
    case 'adultCredits':
    case 'phaseMinutes':
      expect(Number.isFinite(Number(key))).toBe(true)
      return
    case 'wealthFreeTarget':
      expect(key).toBe('true')
      return
    case 'mainCleared':
    case 'collectionShopUnlocked':
    case 'adultExamTaken':
    case 'adultExamStartPromptShown':
    case 'entranceExamTaken':
    case 'adultCollegeGraduated':
    case 'graduatedCollege':
    case 'businessReady':
    case 'workPromotion':
    case 'entranceExamForced':
      expect(booleanKinds.has(kind)).toBe(true)
      expect(['true', 'false']).toContain(key)
      return
    case 'adultGraduationTier':
      expect(['none', 'high', 'normal']).toContain(key)
      return
    case 'adultExamEntryType':
      expect(['mainline', 'postgame']).toContain(key)
      return
    case 'adultExamPassedState':
    case 'entranceExamPassedState':
      expect(['true', 'false']).toContain(key)
      return
    case 'phase':
      expect(validPhases.has(key as PhaseId)).toBe(true)
      return
    case 'route':
      expect(validRoutes.has(key as RouteId)).toBe(true)
      return
    case 'event':
      expect(eventMap[key as EventId]).toBeDefined()
      return
    case 'task':
      expect(taskMap[key]).toBeDefined()
      expect(Number.isFinite(Number(rawValue))).toBe(true)
      return
    default:
      throw new Error(`Unknown requirement kind: ${kind}`)
  }
}

const succeedTask = (state: PlayerState, taskId: string) => {
  const task = taskMap[taskId]
  const settlement: TaskSettlement = {
    taskId,
    taskName: task.name,
    success: true,
    successRate: getTaskSuccessRate(state, task),
    rewards: resolveTaskRewards(state, task, task.successRewards),
    failPenaltySec: 0,
    completedAt: Date.now(),
  }

  applyRewards(state, settlement.rewards)
  registerTaskCompletion(state, settlement)
}

describe('campus journey content integrity', () => {
  it('only uses unlock requirements that point to valid ids and values', () => {
    const requirementSets = [
      ...taskDefinitions.flatMap((task) => task.unlockRequirements),
      ...Object.values(eventMap).flatMap((event) => event.unlockRequirements),
      ...minigameDefinitions.flatMap((minigame) => minigame.unlockRequirements),
      ...skinDefinitions.flatMap((skin) =>
        skin.unlockRequirement ? [skin.unlockRequirement] : []
      ),
    ]

    requirementSets.forEach(validateRequirement)
  })

  it('keeps every story skin tied to a real story milestone', () => {
    const storySkinEventIds = skinDefinitions
      .filter((skin) => skin.unlockType === 'story' && skin.unlockRequirement?.startsWith('event:'))
      .map((skin) => skin.unlockRequirement?.slice('event:'.length) ?? '')

    expect(storySkinEventIds).not.toHaveLength(0)
    storySkinEventIds.forEach((eventId) => {
      expect(eventMap[eventId as EventId]).toBeDefined()
    })
  })

  it('keeps key story skins reachable through valid gameplay milestones', () => {
    const highschoolState = createInitialPlayerState()
    applyEvent(highschoolState, eventMap['intro-start'])
    highschoolState.knowledge = 35
    applyEvent(highschoolState, eventMap['monthly-exam'])

    const collegeState = createInitialPlayerState()
    applyEvent(collegeState, eventMap['entrance-exam-pass'])
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-class')
    applyEvent(collegeState, eventMap['college-midterm'])

    const workState = createInitialPlayerState()
    applyEvent(workState, eventMap['entrance-exam-fail'])
    succeedTask(workState, 'work-store')
    succeedTask(workState, 'work-store')
    succeedTask(workState, 'work-restaurant')
    succeedTask(workState, 'work-restaurant')
    succeedTask(workState, 'work-training')
    succeedTask(workState, 'work-training')
    succeedTask(workState, 'work-overtime')
    succeedTask(workState, 'work-overtime')
    applyEvent(workState, eventMap['work-promotion'])

    const businessState = createInitialPlayerState()
    businessState.meta.mainCleared = true
    businessState.money = 9999
    businessState.businessReady = true
    businessState.phase = 'business'
    applyEvent(businessState, eventMap['business-unlock'])

    expect(getSkinUnlocks(highschoolState).map((skin) => skin.id)).toContain('skin-hs-honor-award')
    expect(getSkinUnlocks(collegeState).map((skin) => skin.id)).toContain(
      'skin-college-competition'
    )
    expect(getSkinUnlocks(workState).map((skin) => skin.id)).toContain('skin-work-commuter')
    expect(getSkinUnlocks(businessState).map((skin) => skin.id)).toContain('skin-biz-manager')
  })

  it('keeps all minigames reachable from valid phase states', () => {
    const examState = createInitialPlayerState()
    examState.phase = 'exam'

    const adultExamState = createInitialPlayerState()
    adultExamState.phase = 'adult-exam'

    const workState = createInitialPlayerState()
    applyEvent(workState, eventMap['entrance-exam-fail'])
    applyEvent(workState, eventMap['work-promotion'])

    const businessState = createInitialPlayerState()
    businessState.phase = 'business'
    businessState.businessReady = true

    expect(getAvailableMinigames(examState, minigameDefinitions).map((game) => game.id)).toContain(
      'knowledge-quiz'
    )
    expect(
      getAvailableMinigames(adultExamState, minigameDefinitions).map((game) => game.id)
    ).toContain('knowledge-quiz')
    expect(getAvailableMinigames(workState, minigameDefinitions).map((game) => game.id)).toContain(
      'part-time-rush'
    )
    expect(
      getAvailableMinigames(businessState, minigameDefinitions).map((game) => game.id)
    ).toContain('biz-auction')
  })

  it('keeps representative route events reachable through valid state transitions', () => {
    const collegeState = createInitialPlayerState()
    applyEvent(collegeState, eventMap['entrance-exam-pass'])
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-class')
    succeedTask(collegeState, 'college-library')
    succeedTask(collegeState, 'college-library')
    succeedTask(collegeState, 'college-lab')
    succeedTask(collegeState, 'college-lab')
    succeedTask(collegeState, 'college-thesis')
    succeedTask(collegeState, 'college-thesis')
    succeedTask(collegeState, 'college-competition')
    succeedTask(collegeState, 'college-competition')

    expect(collegeState.collegeScore).toBeGreaterThanOrEqual(80)
    expect(collegeState.reputation).toBeGreaterThanOrEqual(100)

    const workState = createInitialPlayerState()
    applyEvent(workState, eventMap['entrance-exam-fail'])
    succeedTask(workState, 'work-store')
    succeedTask(workState, 'work-store')
    succeedTask(workState, 'work-restaurant')
    succeedTask(workState, 'work-restaurant')
    succeedTask(workState, 'work-training')
    succeedTask(workState, 'work-training')
    succeedTask(workState, 'work-overtime')
    succeedTask(workState, 'work-overtime')

    expect(workState.taskCompletionCount['work-overtime']).toBeGreaterThanOrEqual(2)

    const businessState = createInitialPlayerState()
    businessState.phase = 'business'
    businessState.businessReady = true
    businessState.money = 300
    applyMiniGameReward(businessState, 'biz-auction', {
      score: 20,
      rewards: { money: 120, reputation: 8 },
    })

    expect(collegeState.completedEventIds).not.toContain('college-graduate-excellent')
    applyEvent(collegeState, eventMap['college-graduate-excellent'])
    expect(collegeState.phase).toBe('business')

    expect(workState.completedEventIds).not.toContain('work-promotion')
    applyEvent(workState, eventMap['work-promotion'])
    expect(workState.workPromotion).toBe(true)

    expect(businessState.minigameStats['biz-auction'].playCount).toBe(1)
    expect(businessState.money).toBeGreaterThan(300)
  })
})
