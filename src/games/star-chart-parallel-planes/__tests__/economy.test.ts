import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createInitialPlayerData,
  loadPlayerDataWithStatus,
  savePlayerData,
  canPlay,
  spendStamina,
  refillStamina,
  addTickets,
  spendTickets,
  spendConsumableUse,
  buyCharacter,
  updatePity,
  addUnlockedCard,
  addUnlockedCards,
  updateDailyQuests,
  claimDailyRewards,
  recalcStamina,
} from '../economy'
import type { EconomyData, DailyData } from '../types'
import { STAMINA_MAX, STAMINA_RECOVERY_SEC, RARITY_SHOP_PRICE } from '../types'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

afterEach(() => {
  localStorageMock.clear()
  vi.useRealTimers()
})

function makeEconomy(overrides: Partial<EconomyData> = {}): EconomyData {
  return {
    tickets: 10,
    stamina: STAMINA_MAX,
    staminaTimestamp: Date.now(),
    pityCount: 0,
    ...overrides,
  }
}

describe('createInitialPlayerData', () => {
  it('creates data with empty unlockedCards', () => {
    const data = createInitialPlayerData()
    expect(data.unlockedCards).toEqual([])
  })

  it('creates data with max stamina', () => {
    const data = createInitialPlayerData()
    expect(data.economy.stamina).toBe(STAMINA_MAX)
  })

  it('creates data with zero tickets', () => {
    const data = createInitialPlayerData()
    expect(data.economy.tickets).toBe(0)
  })

  it('creates data with today date', () => {
    const data = createInitialPlayerData()
    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(data.daily.date).toBe(expected)
  })

  it('creates data with 4 daily quests', () => {
    const data = createInitialPlayerData()
    expect(data.daily.quests).toHaveLength(4)
  })

  it('all quests start at progress 0 and not completed', () => {
    const data = createInitialPlayerData()
    data.daily.quests.forEach((q) => {
      expect(q.progress).toBe(0)
      expect(q.completed).toBe(false)
    })
  })
})

describe('loadPlayerDataWithStatus', () => {
  it('reports integrity failure and returns fresh data when hmac mismatches', async () => {
    const data = createInitialPlayerData()
    data.economy.tickets = 99
    localStorage.setItem(
      'game_state_star-chart-parallel-planes',
      JSON.stringify({ data, hmac: 'invalid', ts: Date.now() })
    )

    const result = await loadPlayerDataWithStatus()
    expect(result.integrityFailed).toBe(true)
    expect(result.data.economy.tickets).toBe(0)
  })

  it('passes integrity check for valid hmac after save→load cycle', async () => {
    const data = createInitialPlayerData()
    data.economy.tickets = 77
    data.economy.stamina = 8
    data.unlockedCards = [1, 5, 10]
    await savePlayerData(data)

    const result = await loadPlayerDataWithStatus()
    expect(result.integrityFailed).toBe(false)
    expect(result.data.economy.tickets).toBe(77)
    expect(result.data.economy.stamina).toBe(8)
    expect(result.data.unlockedCards).toEqual([1, 5, 10])
  })

  it('survives key-reordered data roundtrip', async () => {
    const data = createInitialPlayerData()
    data.economy.tickets = 42
    data.unlockedCards = [7, 3]
    await savePlayerData(data)

    const raw = localStorage.getItem('game_state_star-chart-parallel-planes')
    const stored = JSON.parse(raw!)
    stored.data = Object.keys(stored.data)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = (stored.data as Record<string, unknown>)[k]
        return acc
      }, {})
    localStorage.setItem('game_state_star-chart-parallel-planes', JSON.stringify(stored))

    const result = await loadPlayerDataWithStatus()
    expect(result.integrityFailed).toBe(false)
    expect(result.data.economy.tickets).toBe(42)
    expect(result.data.unlockedCards).toEqual([7, 3])
  })
})

describe('canPlay', () => {
  it('returns true when stamina >= cost', () => {
    const eco = makeEconomy({ stamina: 5 })
    expect(canPlay(eco, 1)).toBe(true)
    expect(canPlay(eco, 5)).toBe(true)
  })

  it('returns false when stamina < cost', () => {
    const eco = makeEconomy({ stamina: 2 })
    expect(canPlay(eco, 3)).toBe(false)
  })
})

describe('spendStamina', () => {
  it('reduces stamina by the cost', () => {
    const eco = makeEconomy({ stamina: 10 })
    const result = spendStamina(eco, 3)
    expect(result.stamina).toBe(7)
  })

  it('never goes below 0', () => {
    const eco = makeEconomy({ stamina: 1 })
    const result = spendStamina(eco, 100)
    expect(result.stamina).toBe(0)
  })

  it('does not mutate the original economy', () => {
    const eco = makeEconomy({ stamina: 10 })
    spendStamina(eco, 3)
    expect(eco.stamina).toBe(10)
  })
})

describe('refillStamina', () => {
  it('returns null when not enough tickets', () => {
    const eco = makeEconomy({ tickets: 1 })
    expect(refillStamina(eco)).toBeNull()
  })

  it('deducts tickets and refills stamina', () => {
    const eco = makeEconomy({ tickets: 10, stamina: 0 })
    const result = refillStamina(eco)
    expect(result).not.toBeNull()
    expect(result!.tickets).toBe(5)
    expect(result!.stamina).toBe(STAMINA_MAX)
  })
})

describe('addTickets', () => {
  it('adds tickets to the economy', () => {
    const eco = makeEconomy({ tickets: 5 })
    const result = addTickets(eco, 3)
    expect(result.tickets).toBe(8)
  })
})

describe('spendTickets', () => {
  it('returns null when not enough tickets', () => {
    const eco = makeEconomy({ tickets: 2 })
    expect(spendTickets(eco, 5)).toBeNull()
  })

  it('deducts tickets when sufficient', () => {
    const eco = makeEconomy({ tickets: 10 })
    const result = spendTickets(eco, 7)
    expect(result).not.toBeNull()
    expect(result!.tickets).toBe(3)
  })
})

describe('spendConsumableUse', () => {
  it('uses a free charge before the free limit', () => {
    const eco = makeEconomy({ tickets: 2 })
    const result = spendConsumableUse(eco, 1, 2)
    expect(result).toEqual({ economy: eco, paid: false })
  })

  it('spends one ticket after free charges are used', () => {
    const eco = makeEconomy({ tickets: 2 })
    const result = spendConsumableUse(eco, 2, 2)
    expect(result).not.toBeNull()
    expect(result!.economy.tickets).toBe(1)
    expect(result!.paid).toBe(true)
  })

  it('returns null for paid use when tickets are insufficient', () => {
    const eco = makeEconomy({ tickets: 0 })
    expect(spendConsumableUse(eco, 2, 2)).toBeNull()
  })
})

describe('buyCharacter', () => {
  it('returns null when not enough tickets', () => {
    const eco = makeEconomy({ tickets: 0 })
    expect(buyCharacter(eco, 'R')).toBeNull()
  })

  it('deducts correct price for each rarity', () => {
    for (const rarity of ['R', 'SR', 'SSR'] as const) {
      const price = RARITY_SHOP_PRICE[rarity]
      const eco = makeEconomy({ tickets: price + 5 })
      const result = buyCharacter(eco, rarity)!
      expect(result.tickets).toBe(5)
    }
  })
})

describe('updatePity', () => {
  it('sets pityCount to the given value', () => {
    const eco = makeEconomy({ pityCount: 0 })
    const result = updatePity(eco, 3)
    expect(result.pityCount).toBe(3)
  })
})

describe('addUnlockedCard', () => {
  it('adds a new card id', () => {
    expect(addUnlockedCard([], 5)).toEqual([5])
  })

  it('does not duplicate existing cards', () => {
    expect(addUnlockedCard([1, 2, 3], 2)).toEqual([1, 2, 3])
  })
})

describe('addUnlockedCards', () => {
  it('adds multiple new card ids', () => {
    expect(addUnlockedCards([1], [2, 3, 4])).toEqual([1, 2, 3, 4])
  })

  it('deduplicates across existing and new', () => {
    const result = addUnlockedCards([1, 2], [2, 3, 1])
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3])
  })
})

describe('updateDailyQuests', () => {
  const daily: DailyData = {
    date: '2026-01-01',
    quests: [
      {
        id: 'play_any',
        desc: 'Play any',
        progress: 0,
        target: 1,
        reward: { type: 'tickets', amount: 1 },
        completed: false,
        claimed: false,
      },
      {
        id: 'hard_3',
        desc: 'Hard 3',
        progress: 0,
        target: 3,
        reward: { type: 'tickets', amount: 5 },
        completed: false,
        claimed: false,
      },
      {
        id: 'hard_20moves',
        desc: 'Hard ≤20',
        progress: 0,
        target: 1,
        reward: { type: 'tickets', amount: 3 },
        completed: false,
        claimed: false,
      },
      {
        id: 'unlock_new',
        desc: 'Unlock new',
        progress: 0,
        target: 1,
        reward: { type: 'stamina', amount: 2 },
        completed: false,
        claimed: false,
      },
    ],
  }

  it('increments play_any quest', () => {
    const result = updateDailyQuests(daily, {
      playAny: true,
      hardCompleted: false,
      moves: 0,
      newUnlock: false,
    })
    expect(result.quests[0].progress).toBe(1)
    expect(result.quests[0].completed).toBe(true)
  })

  it('increments hard_3 quest on hard completed', () => {
    const result = updateDailyQuests(daily, {
      playAny: false,
      hardCompleted: true,
      moves: 0,
      newUnlock: false,
    })
    expect(result.quests[1].progress).toBe(1)
  })

  it('increments hard_20moves when hard completed and moves ≤20', () => {
    const result = updateDailyQuests(daily, {
      playAny: false,
      hardCompleted: true,
      moves: 15,
      newUnlock: false,
    })
    expect(result.quests[2].progress).toBe(1)
  })

  it('does not increment hard_20moves when moves > 20', () => {
    const result = updateDailyQuests(daily, {
      playAny: false,
      hardCompleted: true,
      moves: 25,
      newUnlock: false,
    })
    expect(result.quests[2].progress).toBe(0)
  })

  it('increments unlock_new quest', () => {
    const result = updateDailyQuests(daily, {
      playAny: false,
      hardCompleted: false,
      moves: 0,
      newUnlock: true,
    })
    expect(result.quests[3].progress).toBe(1)
  })

  it('does not increment completed quests', () => {
    const completedDaily: DailyData = {
      date: '2026-01-01',
      quests: daily.quests.map((q) => ({ ...q, completed: true, progress: q.target })),
    }
    const result = updateDailyQuests(completedDaily, {
      playAny: true,
      hardCompleted: true,
      moves: 5,
      newUnlock: true,
    })
    result.quests.forEach((q) => expect(q.progress).toBe(q.target))
  })
})

describe('recalcStamina', () => {
  it('does nothing when stamina is already at max', () => {
    const eco = makeEconomy({ stamina: STAMINA_MAX, staminaTimestamp: 0 })
    const result = recalcStamina(eco)
    expect(result.stamina).toBe(STAMINA_MAX)
  })

  it('recovers stamina based on elapsed time', () => {
    const base = 1000000000000
    vi.setSystemTime(base)
    const eco = makeEconomy({
      stamina: 3,
      staminaTimestamp: base - STAMINA_RECOVERY_SEC * 1000 * 4,
    })
    const result = recalcStamina(eco)
    expect(result.stamina).toBe(7)
    vi.useRealTimers()
  })

  it('does not exceed max stamina', () => {
    const base = 1000000000000
    vi.setSystemTime(base)
    const eco = makeEconomy({
      stamina: 9,
      staminaTimestamp: base - STAMINA_RECOVERY_SEC * 1000 * 10,
    })
    const result = recalcStamina(eco)
    expect(result.stamina).toBe(STAMINA_MAX)
    vi.useRealTimers()
  })

  it('does not recover when elapsed is less than recovery period', () => {
    const base = 1000000000000
    vi.setSystemTime(base)
    const eco = makeEconomy({
      stamina: 2,
      staminaTimestamp: base - STAMINA_RECOVERY_SEC * 1000 + 10000,
    })
    const result = recalcStamina(eco)
    expect(result.stamina).toBe(2)
    vi.useRealTimers()
  })
})

describe('claimDailyRewards', () => {
  it('grants ticket rewards', () => {
    const eco = makeEconomy({ tickets: 0 })
    const daily: DailyData = {
      date: '2026-01-01',
      quests: [
        {
          id: 'play_any',
          desc: '',
          progress: 1,
          target: 1,
          reward: { type: 'tickets', amount: 3 },
          completed: true,
          claimed: false,
        },
        {
          id: 'hard_20moves',
          desc: '',
          progress: 1,
          target: 1,
          reward: { type: 'tickets', amount: 5 },
          completed: true,
          claimed: false,
        },
        {
          id: 'unlock_new',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'stamina', amount: 2 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_3',
          desc: '',
          progress: 0,
          target: 3,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
      ],
    }
    const result = claimDailyRewards(daily, eco)
    expect(result.economy.tickets).toBe(8)
  })

  it('grants stamina rewards', () => {
    const eco = makeEconomy({ stamina: 5 })
    const daily: DailyData = {
      date: '2026-01-01',
      quests: [
        {
          id: 'unlock_new',
          desc: '',
          progress: 1,
          target: 1,
          reward: { type: 'stamina', amount: 3 },
          completed: true,
          claimed: false,
        },
        {
          id: 'play_any',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_3',
          desc: '',
          progress: 0,
          target: 3,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_20moves',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
      ],
    }
    const result = claimDailyRewards(daily, eco)
    expect(result.economy.stamina).toBe(8)
  })

  it('stamina reward does not exceed max', () => {
    const eco = makeEconomy({ stamina: 9 })
    const daily: DailyData = {
      date: '2026-01-01',
      quests: [
        {
          id: 'unlock_new',
          desc: '',
          progress: 1,
          target: 1,
          reward: { type: 'stamina', amount: 5 },
          completed: true,
          claimed: false,
        },
        {
          id: 'play_any',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_3',
          desc: '',
          progress: 0,
          target: 3,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_20moves',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 1 },
          completed: false,
          claimed: false,
        },
      ],
    }
    const result = claimDailyRewards(daily, eco)
    expect(result.economy.stamina).toBe(STAMINA_MAX)
  })

  it('does not claim rewards for incomplete quests', () => {
    const eco = makeEconomy({ tickets: 0 })
    const daily: DailyData = {
      date: '2026-01-01',
      quests: [
        {
          id: 'play_any',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 100 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_3',
          desc: '',
          progress: 0,
          target: 3,
          reward: { type: 'tickets', amount: 100 },
          completed: false,
          claimed: false,
        },
        {
          id: 'hard_20moves',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 100 },
          completed: false,
          claimed: false,
        },
        {
          id: 'unlock_new',
          desc: '',
          progress: 0,
          target: 1,
          reward: { type: 'tickets', amount: 100 },
          completed: false,
          claimed: false,
        },
      ],
    }
    const result = claimDailyRewards(daily, eco)
    expect(result.economy.tickets).toBe(0)
  })
})
