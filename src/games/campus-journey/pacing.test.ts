import { describe, expect, it } from 'vitest'

import { SPRINT_CHARGE_MAX } from './constants'
import { taskMap } from './progression'

type PlayStyle = 'idle' | 'active'

const simulateTaskDuration = (taskId: string, style: PlayStyle, actionLevel = 1) => {
  const task = taskMap[taskId]

  if (style === 'idle') {
    return task.durationSec
  }

  const clickReduction = 1 * (1 + actionLevel * 0.1)
  const clicksNeeded = Math.ceil(SPRINT_CHARGE_MAX / task.sprintChargePerClick)
  const clickSavings = clickReduction * clicksNeeded
  const sprintSavings = task.sprintDurationSec * (task.sprintProgressMultiplier - 1)

  return Math.max(0, task.durationSec - clickSavings - sprintSavings)
}

describe('campus journey pacing audit', () => {
  it('uses minute-scale real durations derived from design minutes', () => {
    expect(taskMap['recover-rest'].durationSec).toBeGreaterThanOrEqual(60)
    expect(taskMap['study-class'].durationMinutes).toBe(45)
    expect(taskMap['study-class'].durationSec).toBeGreaterThanOrEqual(180)
    expect(taskMap['biz-auto-profit'].durationMinutes).toBe(240)
  })

  it('active play speeds up tasks without collapsing minute-scale durations', () => {
    const representativeTasks = [
      'study-notes',
      'study-mock-exam',
      'college-thesis',
      'work-overtime',
      'biz-auto-profit',
    ]

    representativeTasks.forEach((taskId) => {
      const idleDuration = simulateTaskDuration(taskId, 'idle')
      const activeDuration = simulateTaskDuration(taskId, 'active', 2)

      expect(activeDuration).toBeLessThan(idleDuration)
      expect(activeDuration).toBeGreaterThanOrEqual(60)
      expect(activeDuration / idleDuration).toBeGreaterThanOrEqual(0.9)
    })
  })

  it('idle progression still leaves room for active advantage on longer tasks', () => {
    const longerTasks = [
      'study-mock-exam',
      'college-competition',
      'work-overtime',
      'biz-auto-profit',
    ]

    const gains = longerTasks.map((taskId) => {
      const idleDuration = simulateTaskDuration(taskId, 'idle')
      const activeDuration = simulateTaskDuration(taskId, 'active', 2)
      return 1 - activeDuration / idleDuration
    })

    expect(Math.min(...gains)).toBeGreaterThan(0.01)
    expect(Math.max(...gains)).toBeLessThan(0.15)
  })

  it('work and college late-midgame chains remain in comparable minute-scale bands', () => {
    const collegeChain = [
      'college-class',
      'college-library',
      'college-thesis',
      'college-competition',
    ]
    const workChain = ['work-store', 'work-restaurant', 'work-training', 'work-overtime']

    const totalIdle = (taskIds: string[]) =>
      taskIds.reduce((sum, taskId) => sum + simulateTaskDuration(taskId, 'idle'), 0)
    const totalActive = (taskIds: string[]) =>
      taskIds.reduce((sum, taskId) => sum + simulateTaskDuration(taskId, 'active', 2), 0)

    const idleGap = Math.abs(totalIdle(collegeChain) - totalIdle(workChain))
    const activeGap = Math.abs(totalActive(collegeChain) - totalActive(workChain))

    expect(idleGap / Math.max(totalIdle(collegeChain), totalIdle(workChain))).toBeLessThanOrEqual(
      0.3
    )
    expect(
      activeGap / Math.max(totalActive(collegeChain), totalActive(workChain))
    ).toBeLessThanOrEqual(0.3)
  })
})
