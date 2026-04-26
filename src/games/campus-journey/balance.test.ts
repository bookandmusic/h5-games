import { describe, expect, it } from 'vitest'

import { SPRINT_CHARGE_MAX } from './constants'
import { eventMap } from './events'
import {
  calculateExamPassRate,
  getSkillCost,
  getSkinPrice,
  getTaskSuccessRate,
  getThreshold,
  getWealthFreeTarget,
  isBusinessReady,
  resolveTaskRewards,
  shouldMainClear,
  taskMap,
} from './progression'
import {
  applyEvent,
  applyRewards,
  createInitialPlayerState,
  registerTaskCompletion,
} from './reducers'
import { skillDefinitions } from './skills'
import { skinDefinitions } from './skins'
import type { PlayerState, TaskSettlement } from './types'

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

const runTaskPlanUntil = (
  state: PlayerState,
  taskIds: string[],
  stopWhen: (state: PlayerState) => boolean,
  maxTasks: number
) => {
  let completed = 0

  while (!stopWhen(state) && completed < maxTasks) {
    const taskId = taskIds[completed % taskIds.length]
    succeedTask(state, taskId)
    completed += 1
  }

  return completed
}

const upgradeSkillToLevel = (
  state: PlayerState,
  skillId: 'study' | 'social' | 'business',
  targetLevel: number
) => {
  while (state.skillLevels[skillId] < targetLevel) {
    const currentLevel = state.skillLevels[skillId]
    const cost = getSkillCost(skillId, currentLevel)
    if (state.knowledge < cost) return
    state.knowledge -= cost
    state.skillLevels[skillId] += 1
  }
}

describe('campus journey balance audit', () => {
  it('uses knowledge rather than money as the early skill upgrade currency', () => {
    const state = createInitialPlayerState()
    const cheapestFirstUpgrade = Math.min(...skillDefinitions.map((skill) => skill.costCurve[1]))

    expect(cheapestFirstUpgrade).toBeGreaterThan(0)
    expect(state.knowledge).toBeLessThan(cheapestFirstUpgrade)
  })

  it('can reach a credible exam pass rate with a normal prep path', () => {
    const state = createInitialPlayerState()

    succeedTask(state, 'study-class')
    succeedTask(state, 'study-class')
    succeedTask(state, 'study-notes')
    succeedTask(state, 'study-notes')
    succeedTask(state, 'study-notes')
    succeedTask(state, 'study-review')
    succeedTask(state, 'study-mock-exam')
    state.exam.lastScoreBonus = 6

    expect(state.knowledge).toBeGreaterThanOrEqual(85)
    expect(state.exam.prepProgress).toBeGreaterThanOrEqual(45)
    expect(calculateExamPassRate(state)).toBeGreaterThanOrEqual(65)
  })

  it('still reaches an exam-ready pass rate on hard with an extended prep path', () => {
    const state = createInitialPlayerState()
    state.difficulty = 'hard'

    succeedTask(state, 'study-class')
    succeedTask(state, 'study-class')
    succeedTask(state, 'study-notes')
    succeedTask(state, 'study-notes')
    succeedTask(state, 'study-notes')
    succeedTask(state, 'study-review')
    succeedTask(state, 'study-review')
    succeedTask(state, 'study-mock-exam')
    state.exam.lastScoreBonus = 6

    expect(state.knowledge).toBeGreaterThanOrEqual(96)
    expect(state.exam.prepProgress).toBeGreaterThanOrEqual(51)
    expect(calculateExamPassRate(state)).toBeGreaterThanOrEqual(60)
  })

  it('college route reaches high-standard graduation within the expected task chain', () => {
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

    expect(state.reputation).toBeGreaterThanOrEqual(90)
    expect(state.collegeScore).toBeGreaterThanOrEqual(80)
  })

  it('work route reaches business in a similar number of successful tasks', () => {
    const state = createInitialPlayerState()
    applyEvent(state, eventMap['entrance-exam-fail'])

    succeedTask(state, 'work-store')
    succeedTask(state, 'work-store')
    succeedTask(state, 'work-restaurant')
    succeedTask(state, 'work-restaurant')
    succeedTask(state, 'work-training')
    succeedTask(state, 'work-training')
    succeedTask(state, 'work-overtime')
    succeedTask(state, 'work-overtime')
    applyEvent(state, eventMap['work-promotion'])
    succeedTask(state, 'work-overtime')

    expect(state.reputation).toBeGreaterThanOrEqual(120)
    expect(state.workPromotion).toBe(true)
  })

  it('hard mode still lets the work route reach business with extra late-game pressure', () => {
    const state = createInitialPlayerState()
    state.difficulty = 'hard'
    applyEvent(state, eventMap['entrance-exam-fail'])

    succeedTask(state, 'work-store')
    succeedTask(state, 'work-store')
    succeedTask(state, 'work-restaurant')
    succeedTask(state, 'work-restaurant')
    succeedTask(state, 'work-training')
    succeedTask(state, 'work-training')
    succeedTask(state, 'work-overtime')
    succeedTask(state, 'work-overtime')
    applyEvent(state, eventMap['work-promotion'])
    succeedTask(state, 'work-overtime')
    succeedTask(state, 'work-overtime')
    succeedTask(state, 'work-overtime')

    expect(state.reputation).toBeGreaterThanOrEqual(135)
    expect(state.workPromotion).toBe(true)
    expect(isBusinessReady(state)).toBe(true)
  })

  it('raises basic work income after promotion without changing study rewards', () => {
    const beforePromotion = createInitialPlayerState()
    beforePromotion.phase = 'work-basic'
    beforePromotion.route = 'work'

    const afterPromotion = createInitialPlayerState()
    afterPromotion.phase = 'work-basic'
    afterPromotion.route = 'work'
    afterPromotion.workPromotion = true

    expect(
      resolveTaskRewards(afterPromotion, taskMap['work-overtime'], { money: 100 }).money
    ).toBeGreaterThan(
      resolveTaskRewards(beforePromotion, taskMap['work-overtime'], { money: 100 }).money ?? 0
    )
    expect(
      resolveTaskRewards(afterPromotion, taskMap['night-selfstudy'], { knowledge: 100 })
    ).toEqual(resolveTaskRewards(beforePromotion, taskMap['night-selfstudy'], { knowledge: 100 }))
  })

  it('adds route advantage to work success rates without affecting study tasks', () => {
    const baseline = createInitialPlayerState()
    baseline.phase = 'work-advanced-college'
    baseline.route = 'college'

    const advantaged = createInitialPlayerState()
    advantaged.phase = 'work-advanced-college'
    advantaged.route = 'college'
    advantaged.graduatedCollege = true

    expect(
      getTaskSuccessRate(advantaged, taskMap['wc-industry-network']) -
        getTaskSuccessRate(baseline, taskMap['wc-industry-network'])
    ).toBeCloseTo(0.06)
    expect(getTaskSuccessRate(advantaged, taskMap['study-class'])).toBe(
      getTaskSuccessRate(baseline, taskMap['study-class'])
    )
  })

  it('requires multiple clicks to trigger sprint even on late tasks', () => {
    const lateTaskIds = [
      'study-mock-exam',
      'college-competition',
      'work-overtime',
      'biz-auto-profit',
    ]

    const clicksNeeded = lateTaskIds.map((taskId) =>
      Math.ceil(SPRINT_CHARGE_MAX / taskMap[taskId].sprintChargePerClick)
    )

    expect(Math.min(...clicksNeeded)).toBeGreaterThanOrEqual(7)
    expect(Math.max(...clicksNeeded)).toBeLessThanOrEqual(10)
  })

  it('postgame skin completion still has a bounded price ceiling', () => {
    const maxPrice = Math.max(...skinDefinitions.map((skin) => getSkinPrice(skin)))

    expect(maxPrice).toBeLessThanOrEqual(180)
  })

  it('keeps the college mainline path within bounded task counts across difficulties', () => {
    const difficulties: Array<PlayerState['difficulty']> = ['easy', 'medium', 'hard']
    const taskCounts = difficulties.map((difficulty) => {
      const state = createInitialPlayerState()
      state.difficulty = difficulty

      const highschoolPlan =
        difficulty === 'hard'
          ? [
              'study-class',
              'study-class',
              'study-notes',
              'study-notes',
              'study-notes',
              'study-review',
              'study-review',
              'study-mock-exam',
            ]
          : [
              'study-class',
              'study-class',
              'study-notes',
              'study-notes',
              'study-notes',
              'study-review',
              'study-mock-exam',
            ]
      const collegePlan = [
        'college-class',
        'college-class',
        'college-class',
        'college-library',
        'college-library',
        'college-lab',
        'college-lab',
        'college-thesis',
        'college-thesis',
        'college-competition',
        'college-competition',
      ]
      const businessPlan = [
        'biz-orders',
        'biz-orders',
        'biz-team',
        'biz-team',
        'biz-sales',
        'biz-sales',
        'biz-auto-profit',
      ]

      highschoolPlan.forEach((taskId) => succeedTask(state, taskId))
      state.exam.lastScoreBonus = 6

      expect(state.knowledge).toBeGreaterThanOrEqual(getThreshold(state, 85))
      expect(state.exam.prepProgress).toBeGreaterThanOrEqual(getThreshold(state, 45))
      expect(calculateExamPassRate(state)).toBeGreaterThanOrEqual(difficulty === 'hard' ? 60 : 65)

      applyEvent(state, eventMap['entrance-exam-pass'])

      const collegeTasks = runTaskPlanUntil(
        state,
        collegePlan,
        (current) => isBusinessReady(current),
        24
      )

      expect(isBusinessReady(state)).toBe(true)

      applyEvent(state, eventMap['college-graduate-excellent'])
      upgradeSkillToLevel(state, 'social', 3)
      upgradeSkillToLevel(state, 'business', 3)

      const businessTasks = runTaskPlanUntil(
        state,
        businessPlan,
        (current) => shouldMainClear(current),
        140
      )

      expect(shouldMainClear(state)).toBe(true)
      expect(state.money).toBeGreaterThanOrEqual(getWealthFreeTarget(state))

      return highschoolPlan.length + collegeTasks + businessTasks
    })

    expect(taskCounts[0]).toBeLessThanOrEqual(taskCounts[1])
    expect(taskCounts[1]).toBeLessThanOrEqual(taskCounts[2])
    expect(taskCounts[0]).toBeLessThanOrEqual(70)
    expect(taskCounts[2]).toBeLessThanOrEqual(95)
  })

  it('keeps the work-to-business mainline path within bounded task counts across difficulties', () => {
    const difficulties: Array<PlayerState['difficulty']> = ['easy', 'medium', 'hard']
    const taskCounts = difficulties.map((difficulty) => {
      const state = createInitialPlayerState()
      state.difficulty = difficulty
      applyEvent(state, eventMap['entrance-exam-fail'])

      const workPlan =
        difficulty === 'hard'
          ? [
              'work-store',
              'work-store',
              'work-restaurant',
              'work-restaurant',
              'work-training',
              'work-training',
              'work-overtime',
              'work-overtime',
              'work-overtime',
              'work-overtime',
              'work-overtime',
            ]
          : [
              'work-store',
              'work-store',
              'work-restaurant',
              'work-restaurant',
              'work-training',
              'work-training',
              'work-overtime',
              'work-overtime',
              'work-overtime',
            ]
      const businessPlan = [
        'biz-orders',
        'biz-orders',
        'biz-team',
        'biz-team',
        'biz-sales',
        'biz-sales',
        'biz-auto-profit',
      ]

      workPlan.forEach((taskId) => succeedTask(state, taskId))
      applyEvent(state, eventMap['work-promotion'])

      const lateWorkTasks = runTaskPlanUntil(
        state,
        ['work-overtime', 'work-training'],
        (current) => isBusinessReady(current),
        18
      )

      expect(isBusinessReady(state)).toBe(true)

      applyEvent(state, eventMap['business-qualify-work'])
      upgradeSkillToLevel(state, 'social', 3)
      upgradeSkillToLevel(state, 'business', 3)

      const businessTasks = runTaskPlanUntil(
        state,
        businessPlan,
        (current) => shouldMainClear(current),
        150
      )

      expect(shouldMainClear(state)).toBe(true)
      expect(state.money).toBeGreaterThanOrEqual(getWealthFreeTarget(state))

      return workPlan.length + lateWorkTasks + businessTasks
    })

    expect(taskCounts[0]).toBeLessThanOrEqual(taskCounts[1])
    expect(taskCounts[1]).toBeLessThanOrEqual(taskCounts[2])
    expect(taskCounts[0]).toBeLessThanOrEqual(85)
    expect(taskCounts[2]).toBeLessThanOrEqual(110)
  })
})
