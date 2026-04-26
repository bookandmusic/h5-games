import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TASK_TICK_MS } from './constants'
import type { SaveArchive } from './types'

vi.mock('../../stores/gameStorage', () => ({
  gameStorage: {
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(true),
    clearGameState: vi.fn().mockResolvedValue(true),
  },
}))

const loadFreshStore = async (savedState: object | null = null) => {
  vi.resetModules()

  const { gameStorage } = await import('../../stores/gameStorage')
  vi.mocked(gameStorage.loadGameState).mockReset()
  vi.mocked(gameStorage.saveGameState).mockReset()
  vi.mocked(gameStorage.clearGameState).mockReset()
  vi.mocked(gameStorage.loadGameState).mockResolvedValue(savedState)
  vi.mocked(gameStorage.saveGameState).mockResolvedValue(true)
  vi.mocked(gameStorage.clearGameState).mockResolvedValue(true)

  const { useCampusJourneyStore } = await import('./store')
  const store = useCampusJourneyStore()
  await store.load()

  return { store, gameStorage }
}

const createArchive = (state: object): SaveArchive => ({
  version: 1,
  activeSlotId: 'slot-1',
  difficultyUnlocked: false,
  slots: [
    {
      id: 'slot-1',
      difficulty: 'easy',
      state: state as SaveArchive['slots'][number]['state'],
      updatedAt: Date.now(),
    },
  ],
})

describe('campus journey store runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T00:00:00Z'))
  })

  afterEach(async () => {
    const maybeStoreModule = await import('./store')
    maybeStoreModule.useCampusJourneyStore().stopLoop()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('loads intro event and applies it when dismissed', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        completedEventIds: [],
        knowledge: 0,
        exam: {
          entranceExamTaken: false,
          entranceExamPassed: null,
          prepProgress: 0,
          lastScoreBonus: 0,
        },
      })
    )

    expect(store.pendingEvent.value?.id).toBe('intro-start')

    store.dismissEvent()

    expect(store.pendingEvent.value).toBeNull()
    expect(store.state.completedEventIds).toContain('intro-start')
  })

  it('settles failed tasks into a penalty window and clears it after time passes', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        completedEventIds: ['intro-start'],
      })
    )

    vi.spyOn(Math, 'random').mockReturnValue(0.9999)

    store.startTask('study-class')
    store.ensureLoop()
    vi.advanceTimersByTime(181_000)

    expect(store.lastSettlement.value?.success).toBe(false)
    expect(store.state.task.penaltyEndsAt).not.toBeNull()
    expect(store.state.task.queuedTaskIds).toEqual([])

    const blockedTaskId = store.state.task.currentTaskId
    store.startTask('study-notes')
    expect(store.state.task.currentTaskId).toBe(blockedTaskId)
    expect(store.state.task.queuedTaskIds).toEqual([])

    vi.advanceTimersByTime(5_000 + TASK_TICK_MS)

    expect(store.state.task.penaltyEndsAt).toBeNull()

    store.startTask('study-notes')
    expect(store.state.task.currentTaskId).toBe('study-notes')
    expect(store.state.task.queuedTaskIds).toEqual(['study-notes'])
  })

  it('queues multiple tasks and executes them in order', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        completedEventIds: ['intro-start'],
      })
    )

    vi.spyOn(Math, 'random').mockReturnValue(0)

    store.startTask('study-class')
    store.startTask('study-notes')

    expect(store.state.task.currentTaskId).toBe('study-class')
    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-notes'])

    store.ensureLoop()
    vi.advanceTimersByTime(181_000)

    expect(store.lastSettlement.value?.taskId).toBe('study-class')
    expect(store.lastSettlement.value?.success).toBe(true)
    expect(store.state.task.currentTaskId).toBe('study-notes')
    expect(store.state.task.queuedTaskIds).toEqual(['study-notes'])
  })

  it('allows the same task to be queued multiple times and consumes one entry per completion', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        completedEventIds: ['intro-start'],
      })
    )

    vi.spyOn(Math, 'random').mockReturnValue(0)

    store.startTask('study-class')
    store.startTask('study-class')
    store.startTask('study-notes')

    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-class', 'study-notes'])

    store.ensureLoop()
    vi.advanceTimersByTime(181_000)

    expect(store.lastSettlement.value?.taskId).toBe('study-class')
    expect(store.state.task.currentTaskId).toBe('study-class')
    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-notes'])
  })

  it('removes and reorders duplicate queued tasks by queue position instead of task id', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        completedEventIds: ['intro-start'],
      })
    )

    store.startTask('study-class')
    store.startTask('study-class')
    store.startTask('study-notes')

    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-class', 'study-notes'])

    store.removeQueuedTask(1)
    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-notes'])

    store.startTask('study-class')
    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-notes', 'study-class'])

    store.moveQueuedTask(2, -1)
    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-class', 'study-notes'])

    store.removeQueuedTask(0)
    expect(store.state.task.queuedTaskIds).toEqual(['study-class', 'study-class', 'study-notes'])
  })

  it('keeps locked current-phase tasks visible separately from startable tasks', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        completedEventIds: ['intro-start'],
        knowledge: 0,
      })
    )

    expect(store.availableTasks.value.map((task) => task.id)).not.toContain('study-review')
    expect(store.phaseTasks.value.map((task) => task.id)).toContain('study-review')
    expect(store.getUnmetTaskRequirements('study-review')).toEqual(['knowledge:20'])
  })

  it('writes minigame rewards back and resolves exam branching through the event queue', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        phase: 'exam',
        knowledge: 120,
        completedEventIds: ['intro-start', 'entrance-exam'],
        exam: {
          entranceExamTaken: false,
          entranceExamPassed: null,
          prepProgress: 70,
          lastScoreBonus: 0,
        },
      })
    )

    store.setMiniGameOpen('knowledge-quiz')
    store.submitMiniGameResult('knowledge-quiz', { score: 30, rewards: { exp: 60, knowledge: 45 } })

    expect(store.activeMiniGameId.value).toBeNull()
    expect(store.state.minigameStats['knowledge-quiz'].bestScore).toBe(30)

    vi.spyOn(Math, 'random').mockReturnValue(0)
    store.takeEntranceExam()

    expect(store.state.exam.entranceExamTaken).toBe(true)
    expect(store.pendingEvent.value?.id).toBe('entrance-exam-pass')

    store.dismissEvent()

    expect(store.state.phase).toBe('college')
    expect(store.state.route).toBe('college')
    expect(store.state.completedEventIds).toContain('entrance-exam-pass')
  })

  it('queues the documented entrance-exam event automatically after entering exam', async () => {
    const { store } = await loadFreshStore(
      createArchive({
        ...(await import('./reducers')).createInitialPlayerState(),
        phase: 'exam',
        completedEventIds: ['intro-start'],
      })
    )

    expect(store.pendingEvent.value?.id).toBe('entrance-exam')
  })

  it('scales business minigame money and reputation rewards by difficulty', async () => {
    const state = (await import('./reducers')).createInitialPlayerState()
    const { store } = await loadFreshStore(
      createArchive({
        ...state,
        difficulty: 'hard',
        phase: 'business',
        businessReady: true,
        completedEventIds: ['intro-start'],
      })
    )

    store.submitMiniGameResult('biz-auction', {
      score: 20,
      rewards: { money: 100, reputation: 10 },
    })

    expect(store.state.money).toBe(state.money + 85)
    expect(store.state.reputation).toBe(9)
  })

  it('keeps postgame replay phases active until the player returns manually', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-basic',
      route: 'work',
      meta: { ...createInitialPlayerState().meta, mainCleared: true },
      completedEventIds: ['intro-start', 'collection-shop-unlock'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    vi.spyOn(Math, 'random').mockReturnValue(0)

    store.startTask('work-store')
    store.ensureLoop()
    vi.advanceTimersByTime(241_000)

    expect(store.lastSettlement.value?.success).toBe(true)
    expect(store.state.phase).toBe('work-basic')

    store.returnToPostgame()

    expect(store.state.phase).toBe('postgame')
  })

  it('does not auto-create a forced easy slot after difficulty unlock when the archive is empty', async () => {
    const { store } = await loadFreshStore({
      version: 1,
      activeSlotId: null,
      difficultyUnlocked: true,
      slots: [],
    })

    expect(store.saveSlots.value).toEqual([])
    expect(store.difficultyUnlocked.value).toBe(true)
  })

  it('keeps the postgame hub separate from replay task loops', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'postgame',
      route: 'work',
      businessReady: true,
      meta: {
        ...createInitialPlayerState().meta,
        mainCleared: true,
        collectionShopUnlocked: true,
      },
      completedEventIds: ['intro-start', 'collection-shop-unlock'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.availableTasks.value.map((task) => task.id)).toEqual([])
    expect(store.phaseTasks.value.map((task) => task.id)).toEqual([])
    expect(store.availableMinigames.value.map((game) => game.id)).toEqual([
      'knowledge-quiz',
      'part-time-rush',
      'biz-auction',
    ])

    store.enterPostgameWork()
    expect(store.state.phase).toBe('work-basic')
    expect(store.availableTasks.value.map((task) => task.id)).toContain('work-store')

    store.returnToPostgame()
    store.enterPostgameBusiness()
    expect(store.state.phase).toBe('business')
    expect(store.availableTasks.value.map((task) => task.id)).toContain('biz-orders')
    expect(store.availableMinigames.value.map((game) => game.id)).toContain('biz-auction')
  })

  it('still applies whitelisted replay events after the main story is cleared', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-basic',
      route: 'work',
      reputation: 120,
      money: 300,
      knowledge: 110,
      taskCompletionCount: { 'work-overtime': 2 },
      meta: {
        ...createInitialPlayerState().meta,
        mainCleared: true,
        collectionShopUnlocked: true,
      },
      completedEventIds: ['intro-start', 'collection-shop-unlock'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('work-promotion')

    store.dismissEvent()

    expect(store.state.workPromotion).toBe(true)
    expect(store.state.phase).toBe('work-basic')
    expect(store.pendingEvent.value?.id).not.toBe('adult-exam-eligible')
    expect(store.pendingEvent.value?.id).not.toBe('business-qualify-work')
  })

  it('restores postgame adult exam start prompts after reload', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'adult-exam',
      exam: {
        ...createInitialPlayerState().exam,
        adultExamEntryType: 'postgame',
      },
      meta: {
        ...createInitialPlayerState().meta,
        mainCleared: true,
        collectionShopUnlocked: true,
      },
      completedEventIds: ['intro-start', 'collection-shop-unlock'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('adult-exam-start-postgame')

    store.dismissEvent()

    expect(store.state.phase).toBe('adult-exam')
  })

  it('allows postgame college experience to graduate and grant college advantage', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'college',
      route: 'college',
      collegeScore: 80,
      reputation: 100,
      exam: {
        ...createInitialPlayerState().exam,
        adultExamEntryType: 'postgame',
      },
      meta: {
        ...createInitialPlayerState().meta,
        mainCleared: true,
        collectionShopUnlocked: true,
      },
      completedEventIds: ['intro-start', 'collection-shop-unlock'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('college-graduate-excellent')

    store.dismissEvent()

    expect(store.state.graduatedCollege).toBe(true)
    expect(store.state.phase).toBe('work-advanced-college')
    expect(store.state.businessReady).toBe(false)
    expect(store.state.meta.mainCleared).toBe(true)
  })

  it('prioritizes main clear over other eligible work-basic exits', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const { getWealthFreeTarget } = await import('./progression')
    const baseState = createInitialPlayerState()
    const savedState = {
      ...baseState,
      phase: 'work-basic',
      route: 'work',
      money: getWealthFreeTarget(baseState),
      reputation: 200,
      workPromotion: true,
      completedEventIds: ['intro-start', 'work-promotion'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('wealth-clear-basic-work')

    store.dismissEvent()

    expect(store.state.meta.mainCleared).toBe(true)
    expect(store.state.phase).toBe('postgame')
    expect(store.state.businessReady).toBe(false)
    expect(store.state.ending.title).toBe('牛马打工人')
    expect(store.state.ending.careerYears).toBeGreaterThanOrEqual(1)
    expect(store.state.ending.eventId).toBe('wealth-clear-basic-work')
  })

  it('prioritizes adult exam over business when both work-basic exits are eligible', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-basic',
      route: 'work',
      knowledge: 110,
      money: 300,
      reputation: 120,
      workPromotion: true,
      completedEventIds: ['intro-start', 'work-promotion'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('adult-exam-eligible')

    store.dismissEvent()

    expect(store.state.phase).toBe('adult-exam')
    expect(store.state.businessReady).toBe(false)
    expect(store.pendingEvent.value?.id).toBe('adult-exam-start-mainline')
  })

  it('allows choosing to keep working when adult exam and business are both available', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-basic',
      route: 'work',
      knowledge: 110,
      money: 300,
      reputation: 120,
      workPromotion: true,
      completedEventIds: ['intro-start', 'work-promotion'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('adult-exam-eligible')

    store.chooseEventAction('adult-exam-continue-work')

    expect(store.state.phase).toBe('work-basic')
    expect(store.pendingEvent.value?.id).toBe('business-qualify-work')

    store.dismissEvent()

    expect(store.state.phase).toBe('business')
    expect(store.state.businessReady).toBe(true)
  })

  it('drops queued work business qualification after adult exam eligibility changes phase', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-basic',
      route: 'work',
      knowledge: 110,
      money: 300,
      reputation: 120,
      workPromotion: true,
      completedEventIds: ['intro-start', 'work-promotion'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('adult-exam-eligible')

    store.dismissEvent()

    expect(store.state.phase).toBe('adult-exam')
    expect(store.pendingEvent.value?.id).toBe('adult-exam-start-mainline')

    store.dismissEvent()

    expect(store.state.phase).toBe('adult-exam')
    expect(store.pendingEvent.value?.id).not.toBe('business-qualify-work')
  })

  it('records the unlocked ending in the title wall after main clear', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const { getWealthFreeTarget } = await import('./progression')
    const baseState = createInitialPlayerState()
    const savedState = {
      ...baseState,
      phase: 'business',
      businessReady: true,
      money: getWealthFreeTarget(baseState),
      completedEventIds: ['intro-start', 'business-unlock'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('wealth-clear-business')

    store.dismissEvent()

    expect(store.state.ending.title).toBe('创业掌舵人')
    expect(store.state.endingRecords).toHaveLength(1)
    expect(store.state.endingRecords[0]?.title).toBe('创业掌舵人')
    expect(store.state.endingRecords[0]?.eventId).toBe('wealth-clear-business')
  })

  it('prioritizes main clear over business qualification on the adult high graduate work branch', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const { getWealthFreeTarget } = await import('./progression')
    const baseState = createInitialPlayerState()
    const savedState = {
      ...baseState,
      phase: 'work-advanced-adult-high',
      route: 'work',
      adultCollegeGraduated: true,
      adultGraduationTier: 'high',
      money: getWealthFreeTarget(baseState),
      reputation: 200,
      completedEventIds: ['intro-start', 'adult-college-graduate-high'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('wealth-clear-adult-high-work')

    store.dismissEvent()

    expect(store.state.meta.mainCleared).toBe(true)
    expect(store.state.phase).toBe('postgame')
    expect(store.state.ending.title).toBe('逆袭进修生')
  })

  it('enters business from the adult high graduate work branch when not yet wealth cleared', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-advanced-adult-high',
      route: 'work',
      adultCollegeGraduated: true,
      adultGraduationTier: 'high',
      money: 2200,
      reputation: 150,
      completedEventIds: ['intro-start', 'adult-college-graduate-high'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('business-qualify-adult-high')

    store.dismissEvent()

    expect(store.state.phase).toBe('business')
    expect(store.state.businessReady).toBe(true)
  })

  it('prioritizes main clear over business qualification on the adult normal graduate work branch', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const { getWealthFreeTarget } = await import('./progression')
    const baseState = createInitialPlayerState()
    const savedState = {
      ...baseState,
      phase: 'work-advanced-adult-normal',
      route: 'work',
      adultCollegeGraduated: true,
      adultGraduationTier: 'normal',
      money: getWealthFreeTarget(baseState),
      reputation: 180,
      completedEventIds: ['intro-start', 'adult-college-graduate-normal'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('wealth-clear-adult-normal-work')

    store.dismissEvent()

    expect(store.state.meta.mainCleared).toBe(true)
    expect(store.state.phase).toBe('postgame')
    expect(store.state.ending.title).toBe('逆袭进修生')
  })

  it('enters business from the adult normal graduate work branch when not yet wealth cleared', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-advanced-adult-normal',
      route: 'work',
      adultCollegeGraduated: true,
      adultGraduationTier: 'normal',
      money: 2100,
      reputation: 145,
      completedEventIds: ['intro-start', 'adult-college-graduate-normal'],
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('business-qualify-adult-normal')

    store.dismissEvent()

    expect(store.state.phase).toBe('business')
    expect(store.state.businessReady).toBe(true)
  })

  it('creates up to three save slots and forces easy before difficulty unlock', async () => {
    const { store } = await loadFreshStore(null)

    expect(store.saveSlots.value).toHaveLength(1)
    expect(store.saveSlots.value[0].difficulty).toBe('easy')

    await store.createSaveSlot('hard')
    await store.createSaveSlot('medium')
    await store.createSaveSlot('hard')

    expect(store.saveSlots.value).toHaveLength(3)
    expect(store.saveSlots.value.map((slot) => slot.difficulty)).toEqual(['easy', 'easy', 'easy'])
  })

  it('unlocks selectable difficulty after an active save has cleared the main story', async () => {
    const clearedState = {
      ...(await import('./reducers')).createInitialPlayerState(),
      completedEventIds: ['intro-start'],
      meta: {
        ...(await import('./reducers')).createInitialPlayerState().meta,
        mainCleared: true,
      },
    }
    const { store } = await loadFreshStore(createArchive(clearedState))

    await store.createSaveSlot('hard')

    expect(store.difficultyUnlocked.value).toBe(true)
    expect(store.saveSlots.value[1].difficulty).toBe('hard')
    expect(store.state.difficulty).toBe('hard')
  })

  it('applies repeatable adult exam events and clears transient flags', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      completedEventIds: ['intro-start', 'adult-exam-eligible', 'adult-exam-start-mainline'],
      phase: 'work-basic',
      route: 'work',
      knowledge: 110,
      money: 300,
    }
    const { store } = await loadFreshStore(createArchive(savedState))

    expect(store.pendingEvent.value?.id).toBe('adult-exam-eligible')

    store.dismissEvent()

    expect(store.state.phase).toBe('adult-exam')
    expect(store.pendingEvent.value?.id).toBe('adult-exam-start-mainline')

    store.dismissEvent()

    expect(store.pendingEvent.value).toBeNull()
  })
})
