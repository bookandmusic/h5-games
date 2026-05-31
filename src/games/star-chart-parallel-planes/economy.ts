import type { EconomyData, DailyData, DailyQuest, GameSettings, PlayerData } from './types'
import { STAMINA_MAX, STAMINA_RECOVERY_SEC, STAMINA_REFILL_COST, RARITY_SHOP_PRICE } from './types'
import type { Rarity } from './types'
import { gameStorage } from '../../stores/gameStorage'

const GAME_ID = 'star-chart-parallel-planes'
const HMAC_KEY = 'starchart_h6k9m2p4'

const DEFAULT_ECONOMY: EconomyData = {
  tickets: 0,
  stamina: STAMINA_MAX,
  staminaTimestamp: Date.now(),
  pityCount: 0,
}

const DAILY_QUEST_DEFS = [
  {
    id: 'play_any',
    desc: '完成 1 局任意模式',
    target: 1,
    reward: { type: 'tickets' as const, amount: 1 },
  },
  {
    id: 'hard_3',
    desc: '通关 3 局困难模式',
    target: 3,
    reward: { type: 'tickets' as const, amount: 5 },
  },
  {
    id: 'hard_20moves',
    desc: '单局步数 ≤ 20 (困难通关)',
    target: 1,
    reward: { type: 'tickets' as const, amount: 3 },
  },
  {
    id: 'unlock_new',
    desc: '解锁 1 位全新角色',
    target: 1,
    reward: { type: 'stamina' as const, amount: 2 },
  },
]

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
}

export interface PlayerDataLoadResult {
  data: PlayerData
  integrityFailed: boolean
}

function createDailyQuests(): DailyQuest[] {
  return DAILY_QUEST_DEFS.map((def) => ({
    ...def,
    progress: 0,
    completed: false,
    claimed: false,
  }))
}

function getTodayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function createInitialPlayerData(): PlayerData {
  return {
    unlockedCards: [],
    economy: { ...DEFAULT_ECONOMY, staminaTimestamp: Date.now() },
    daily: { date: getTodayDate(), quests: createDailyQuests() },
    settings: { ...DEFAULT_SETTINGS },
    tutorialStep: 0,
    roundIndex: 0,
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = val[k]
          return sorted
        }, {})
    }
    return val
  })
}

async function computeHMAC(data: string): Promise<string> {
  if (!crypto.subtle) {
    return ''
  }
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(HMAC_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function saveWithIntegrity(data: PlayerData): Promise<void> {
  const payload = stableStringify(data)
  const hmac = await computeHMAC(payload)
  const stored = hmac ? { data, hmac, ts: Date.now() } : { data, ts: Date.now() }
  await gameStorage.saveGameState(GAME_ID, stored)
}

async function loadWithIntegrity(): Promise<{ data: PlayerData | null; integrityFailed: boolean }> {
  try {
    const stored = await gameStorage.loadGameState<{
      data: PlayerData
      hmac?: string
      ts: number
    }>(GAME_ID)
    if (!stored || !stored.data) return { data: null, integrityFailed: false }
    if (!stored.hmac) return { data: stored.data, integrityFailed: false }
    const payload = stableStringify(stored.data)
    const expected = await computeHMAC(payload)
    if (!expected || expected !== stored.hmac) return { data: null, integrityFailed: true }
    return { data: stored.data, integrityFailed: false }
  } catch {
    return { data: null, integrityFailed: true }
  }
}

export async function loadPlayerDataWithStatus(): Promise<PlayerDataLoadResult> {
  const { data, integrityFailed } = await loadWithIntegrity()
  if (data) {
    data.economy = recalcStamina(data.economy)
    data.daily = checkDailyReset(data.daily)
    return { data, integrityFailed }
  }
  return { data: createInitialPlayerData(), integrityFailed }
}

export async function loadPlayerData(): Promise<PlayerData> {
  return (await loadPlayerDataWithStatus()).data
}

export async function savePlayerData(data: PlayerData): Promise<void> {
  data.economy = recalcStamina(data.economy)
  data.daily = checkDailyReset(data.daily)
  await saveWithIntegrity(data)
}

export function recalcStamina(economy: EconomyData): EconomyData {
  const elapsed = Math.floor((Date.now() - economy.staminaTimestamp) / 1000)
  if (elapsed <= 0 || economy.stamina >= STAMINA_MAX) return economy
  const gained = Math.floor(elapsed / STAMINA_RECOVERY_SEC)
  if (gained <= 0) return economy
  const newStamina = Math.min(economy.stamina + gained, STAMINA_MAX)
  const remainder = elapsed % STAMINA_RECOVERY_SEC
  return {
    ...economy,
    stamina: newStamina,
    staminaTimestamp: Date.now() - remainder * 1000,
  }
}

function checkDailyReset(daily: DailyData): DailyData {
  const today = getTodayDate()
  if (daily.date !== today) {
    return { date: today, quests: createDailyQuests() }
  }
  return daily
}

export function canPlay(economy: EconomyData, cost: number): boolean {
  return economy.stamina >= cost
}

export function spendStamina(economy: EconomyData, cost: number): EconomyData {
  return {
    ...economy,
    stamina: Math.max(0, economy.stamina - cost),
    staminaTimestamp: Date.now(),
  }
}

export function refillStamina(economy: EconomyData): EconomyData | null {
  if (economy.tickets < STAMINA_REFILL_COST) return null
  return {
    ...economy,
    tickets: economy.tickets - STAMINA_REFILL_COST,
    stamina: STAMINA_MAX,
    staminaTimestamp: Date.now(),
  }
}

export function addTickets(economy: EconomyData, amount: number): EconomyData {
  return { ...economy, tickets: economy.tickets + amount }
}

export function spendTickets(economy: EconomyData, amount: number): EconomyData | null {
  if (economy.tickets < amount) return null
  return { ...economy, tickets: economy.tickets - amount }
}

export function spendConsumableUse(
  economy: EconomyData,
  usedCount: number,
  freeUses: number
): { economy: EconomyData; paid: boolean } | null {
  if (usedCount < freeUses) {
    return { economy, paid: false }
  }
  const paidEconomy = spendTickets(economy, 1)
  if (!paidEconomy) return null
  return { economy: paidEconomy, paid: true }
}

export function buyCharacter(economy: EconomyData, rarity: Rarity): EconomyData | null {
  return spendTickets(economy, RARITY_SHOP_PRICE[rarity])
}

export function updatePity(economy: EconomyData, newPity: number): EconomyData {
  return { ...economy, pityCount: newPity }
}

export function addUnlockedCard(unlockedCards: number[], cardId: number): number[] {
  if (unlockedCards.includes(cardId)) return unlockedCards
  return [...unlockedCards, cardId]
}

export function addUnlockedCards(unlockedCards: number[], cardIds: number[]): number[] {
  const set = new Set(unlockedCards)
  cardIds.forEach((id) => set.add(id))
  return Array.from(set)
}

export function updateDailyQuests(
  daily: DailyData,
  events: { playAny: boolean; hardCompleted: boolean; moves: number; newUnlock: boolean }
): DailyData {
  const quests = daily.quests.map((q) => {
    if (q.completed) return q
    let progress = q.progress
    switch (q.id) {
      case 'play_any':
        if (events.playAny) progress = Math.min(progress + 1, q.target)
        break
      case 'hard_3':
        if (events.hardCompleted) progress = Math.min(progress + 1, q.target)
        break
      case 'hard_20moves':
        if (events.hardCompleted && events.moves <= 20) progress = Math.min(progress + 1, q.target)
        break
      case 'unlock_new':
        if (events.newUnlock) progress = Math.min(progress + 1, q.target)
        break
    }
    return { ...q, progress, completed: progress >= q.target }
  })
  return { ...daily, quests }
}

export function claimDailyRewards(
  daily: DailyData,
  economy: EconomyData
): { daily: DailyData; economy: EconomyData } {
  let newEconomy = { ...economy }
  const newQuests = daily.quests.map((q) => {
    if (!q.completed || q.claimed) return q
    const reward = q.reward
    if (reward.type === 'tickets') {
      newEconomy = addTickets(newEconomy, reward.amount)
    } else {
      newEconomy = {
        ...newEconomy,
        stamina: Math.min(newEconomy.stamina + reward.amount, STAMINA_MAX),
        staminaTimestamp: Date.now(),
      }
    }
    return { ...q, claimed: true }
  })
  return { daily: { ...daily, quests: newQuests }, economy: newEconomy }
}

export const DAILY_QUESTS = DAILY_QUEST_DEFS
