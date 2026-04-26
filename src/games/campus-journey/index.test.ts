import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SaveArchive } from './types'

vi.mock('../../stores/gameStorage', () => ({
  gameStorage: {
    loadGameState: vi.fn(),
    saveGameState: vi.fn().mockResolvedValue(true),
    clearGameState: vi.fn().mockResolvedValue(true),
  },
}))

const mountFreshPage = async (savedState: object) => {
  vi.resetModules()

  const { gameStorage } = await import('../../stores/gameStorage')
  vi.mocked(gameStorage.loadGameState).mockReset()
  vi.mocked(gameStorage.saveGameState).mockReset()
  vi.mocked(gameStorage.clearGameState).mockReset()
  vi.mocked(gameStorage.loadGameState).mockResolvedValue(savedState)
  vi.mocked(gameStorage.saveGameState).mockResolvedValue(true)
  vi.mocked(gameStorage.clearGameState).mockResolvedValue(true)

  const CampusJourneyPage = (await import('./index.vue')).default
  const wrapper = mount(CampusJourneyPage, {
    attachTo: document.body,
  })

  await flushPromises()

  return { wrapper }
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

const openActionPanel = async (wrapper: Awaited<ReturnType<typeof mountFreshPage>>['wrapper']) => {
  const actionNavButton = wrapper
    .findAll('button.hub-nav-btn')
    .find((node) => node.attributes('title') === '行动')
  expect(actionNavButton).toBeTruthy()
  await actionNavButton!.trigger('click')
  await flushPromises()
}

describe('campus journey page', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T00:00:00Z'))
    document.body.innerHTML = ''
  })

  afterEach(async () => {
    document.body.innerHTML = ''
    const maybeStoreModule = await import('./store')
    maybeStoreModule.useCampusJourneyStore().stopLoop()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders the five primary navigation entries from UI.md', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      completedEventIds: ['intro-start'],
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    const navButtons = wrapper.findAll('button.hub-nav-btn')
    const navTitles = navButtons.map((node) => node.attributes('title'))

    expect(navTitles).toEqual(['行动', '小游戏', '进度', '成长', '角色'])
    expect(navTitles).not.toContain('主线')

    wrapper.unmount()
  })

  it('opens 知识闯关 from the minigames panel', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'exam',
      knowledge: 120,
      completedEventIds: ['intro-start', 'entrance-exam'],
      exam: {
        entranceExamTaken: false,
        entranceExamPassed: null,
        prepProgress: 70,
        lastScoreBonus: 0,
      },
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))

    const minigamesNavButton = wrapper
      .findAll('button.hub-nav-btn')
      .find((node) => node.attributes('title') === '小游戏')
    expect(minigamesNavButton).toBeTruthy()

    await minigamesNavButton!.trigger('click')
    await flushPromises()

    const quizCard = Array.from(document.body.querySelectorAll('.minigame-card')).find((node) =>
      node.textContent?.includes('知识闯关')
    ) as HTMLButtonElement | undefined
    expect(quizCard).toBeTruthy()

    quizCard!.click()
    await flushPromises()

    expect(document.body.textContent).toContain('剩余 60s')
    expect(document.body.textContent).toContain('得分 0')

    wrapper.unmount()
  })

  it('shows normal adult graduate work node on the progress map', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-advanced-adult-normal',
      route: 'work',
      completedEventIds: ['intro-start', 'adult-college-graduate-normal'],
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    const progressNavButton = wrapper
      .findAll('button.hub-nav-btn')
      .find((node) => node.attributes('title') === '进度')
    expect(progressNavButton).toBeTruthy()

    await progressNavButton!.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('成考普通毕业后工作')

    wrapper.unmount()
  })

  it('shows difficulty-adjusted highschool thresholds in stage cards', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      difficulty: 'hard',
      completedEventIds: ['intro-start'],
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    await openActionPanel(wrapper)

    expect(document.body.textContent).toContain('知识 0/96')
    expect(document.body.textContent).toContain('备考 0/51')

    wrapper.unmount()
  })

  it('shows adult exam retake cooldown in work-basic guidance', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'work-basic',
      route: 'work',
      careerMinutes: 900,
      adultExamFailedAtMinutes: 300,
      completedEventIds: ['intro-start'],
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    await openActionPanel(wrapper)

    expect(document.body.textContent).toContain('成考重考还需 120 游戏分钟')

    wrapper.unmount()
  })

  it('shows explicit choice buttons when adult exam becomes available during work-basic', async () => {
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

    const { wrapper } = await mountFreshPage(createArchive(savedState))

    expect(document.body.textContent).toContain('成考报名资格')
    expect(
      Array.from(document.body.querySelectorAll('button')).some((node) =>
        node.textContent?.includes('继续打工')
      )
    ).toBe(true)
    expect(
      Array.from(document.body.querySelectorAll('button')).some((node) =>
        node.textContent?.includes('去成考')
      )
    ).toBe(true)

    wrapper.unmount()
  })

  it('shows postgame college experience as a graduate-to-work path instead of direct business', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'college',
      route: 'college',
      collegeScore: 80,
      reputation: 60,
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

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    const progressNavButton = wrapper
      .findAll('button.hub-nav-btn')
      .find((node) => node.attributes('title') === '进度')
    expect(progressNavButton).toBeTruthy()

    await progressNavButton!.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain(
      '当前是通关后大学体验，不再重复判定主线通关，也不会自动跳转经营阶段。'
    )
    expect(document.body.textContent).toContain('大学毕业后工作')
    expect(document.body.textContent).toContain('返回通关后阶段')
    expect(document.body.textContent).toContain(
      '通关后的大学体验仍按毕业规则推进，高标准或普通毕业后都会转入大学毕业后工作。'
    )
    expect(document.body.textContent).toContain('成人高考')
    expect(document.body.textContent).not.toContain('下一关键节点：回到补完')
    expect(document.body.textContent).not.toContain('声望达到 90')

    wrapper.unmount()
  })

  it('shows replay business guidance without repeating main-clear messaging', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const savedState = {
      ...createInitialPlayerState(),
      phase: 'business',
      businessReady: true,
      route: 'work',
      meta: {
        ...createInitialPlayerState().meta,
        mainCleared: true,
        collectionShopUnlocked: true,
      },
      completedEventIds: ['intro-start', 'collection-shop-unlock'],
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    await openActionPanel(wrapper)

    expect(document.body.textContent).toContain('下一关键节点：经营体验循环')
    expect(document.body.textContent).toContain(
      '通关后不再重复判定主线通关，继续经营主要用于刷钱和补完收藏。'
    )
    expect(document.body.textContent).not.toContain('金币达到财富自由目标后会首次触发主线通关。')

    wrapper.unmount()
  })

  it('renders the title wall entries after main clear', async () => {
    const { createInitialPlayerState } = await import('./reducers')
    const achievedAt = new Date('2026-04-20T00:00:00Z').getTime()
    const savedState = {
      ...createInitialPlayerState(),
      meta: {
        ...createInitialPlayerState().meta,
        mainCleared: true,
        collectionShopUnlocked: true,
      },
      ending: {
        title: '创业掌舵人',
        description: '通过 7 年经营，你终于实现财富自由。恭喜您获得「创业掌舵人」',
        careerYears: 7,
        eventId: 'wealth-clear-business',
        achievedAt,
      },
      endingRecords: [
        {
          title: '创业掌舵人',
          description: '通过 7 年经营，你终于实现财富自由。恭喜您获得「创业掌舵人」',
          careerYears: 7,
          eventId: 'wealth-clear-business',
          achievedAt,
        },
      ],
      completedEventIds: ['intro-start', 'wealth-clear-business', 'collection-shop-unlock'],
    }

    const { wrapper } = await mountFreshPage(createArchive(savedState))
    const growthNavButton = wrapper
      .findAll('button.hub-nav-btn')
      .find((node) => node.attributes('title') === '成长')
    expect(growthNavButton).toBeTruthy()

    await growthNavButton!.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('头衔展示墙')
    expect(document.body.textContent).toContain('创业掌舵人')
    expect(document.body.textContent).toContain('生涯年数 7 年')

    wrapper.unmount()
  })
})
