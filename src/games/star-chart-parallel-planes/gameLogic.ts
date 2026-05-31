import type { Card, CharacterData, ThemeConfig, Difficulty, BlindBoxItem } from './types'
import { RARITY_WEIGHTS, RARITY_TICKET_VALUE, SSR_PITY_THRESHOLD } from './types'

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRoundSeed(
  roundIndex: number,
  themeId: string,
  difficulty: Difficulty
): number {
  let hash = 2166136261
  const input = `${themeId}:${difficulty}:${roundIndex}`
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function shuffleArray<T>(array: T[], rng?: () => number): T[] {
  const rand = rng || Math.random
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateDeck(
  theme: ThemeConfig,
  difficulty: Difficulty,
  unlockedCards: number[],
  pityCount: number,
  rng: () => number
): { cards: Card[]; selectedChars: CharacterData[]; newPity: number } {
  const pairs = 8
  const chars = [...theme.characters]

  let selectedChars: CharacterData[]
  let newPity = pityCount

  if (difficulty === 'easy') {
    const rChars = chars.filter((c) => c.rarity === 'R')
    const weights = rChars.map((c) => (unlockedCards.includes(c.id) ? 10 : 30))
    selectedChars = pickUnique(rChars, weights, pairs, rng)
  } else {
    const weights = chars.map((c) => {
      const base = RARITY_WEIGHTS[c.rarity]
      if (c.rarity === 'SSR') return base
      return base + (unlockedCards.includes(c.id) ? 0 : 20)
    })
    selectedChars = pickUnique(chars, weights, pairs, rng)
    const hasSSR = selectedChars.some((c) => c.rarity === 'SSR')
    if (hasSSR) {
      newPity = 0
    } else {
      newPity = pityCount + 1
    }
  }

  // 保底替换：选中的角色全是稀有度非R时 rIndices 为空，跳过替换。概率极低，行为正确。
  if (difficulty === 'hard' && newPity >= SSR_PITY_THRESHOLD) {
    const rIndices = selectedChars.map((c, i) => (c.rarity === 'R' ? i : -1)).filter((i) => i >= 0)
    if (rIndices.length > 0) {
      const unownedSSR = chars.filter((c) => c.rarity === 'SSR' && !selectedChars.includes(c))
      const pool = unownedSSR.length > 0 ? unownedSSR : chars.filter((c) => c.rarity === 'SSR')
      if (pool.length > 0) {
        const replaceIdx = rIndices[Math.floor(rng() * rIndices.length)]
        selectedChars[replaceIdx] = pool[Math.floor(rng() * pool.length)]
        newPity = 0
      }
    }
  }

  let idCounter = 0
  const cards: Card[] = []
  selectedChars.forEach((char, index) => {
    const imageName = theme.imageNames[char.imageIndex]
    for (let j = 0; j < 2; j++) {
      cards.push({
        id: idCounter++,
        patternId: index,
        state: 'hidden',
        imageName,
        rarity: char.rarity,
        themeId: theme.id,
      })
    }
  })

  return { cards: shuffleArray(cards, rng), selectedChars, newPity }
}

function pickUnique(
  pool: CharacterData[],
  weights: number[],
  count: number,
  rng: () => number
): CharacterData[] {
  const result: CharacterData[] = []
  const available = pool.map((c, i) => ({ char: c, weight: weights[i] }))

  for (let n = 0; n < count; n++) {
    const total = available.reduce((s, a) => s + a.weight, 0)
    let r = rng() * total
    let idx = 0
    for (let i = 0; i < available.length; i++) {
      r -= available[i].weight
      if (r <= 0) {
        idx = i
        break
      }
    }
    result.push(available[idx].char)
    available.splice(idx, 1)
  }

  return result
}

export function calculateScore(elapsed: number, moves: number): number {
  return Math.max(10000 - elapsed * 15 - moves * 60, 0)
}

export function calculateStars(score: number): 0 | 1 | 2 | 3 {
  if (score >= 6500) return 3
  if (score >= 4000) return 2
  if (score > 0) return 1
  return 0
}

export function generateBlindBox(
  characters: CharacterData[],
  theme: ThemeConfig,
  difficulty: Difficulty,
  unlockedCards: number[],
  rng: () => number
): BlindBoxItem[] {
  const shuffled = shuffleArray(characters, rng)
  const pool = shuffled.slice(0, 6)

  if (difficulty === 'hard') {
    const maxRarity = pool.reduce((max, c) => {
      const order = ['R', 'SR', 'SSR']
      return order.indexOf(c.rarity) > order.indexOf(max) ? c.rarity : max
    }, 'R' as string)

    if (maxRarity === 'R') {
      const gameSR = characters.filter((c) => c.rarity === 'SR' || c.rarity === 'SSR')
      const unowned = theme.characters.filter(
        (c) => c.rarity === 'SR' && !unlockedCards.includes(c.id)
      )
      const replacement =
        unowned.length > 0
          ? unowned[Math.floor(rng() * unowned.length)]
          : gameSR.length > 0
            ? gameSR[Math.floor(rng() * gameSR.length)]
            : null
      if (replacement) {
        const rIdx = pool.findIndex((c) => c.rarity === 'R')
        if (rIdx >= 0) pool[rIdx] = replacement
      }
    }
  }

  return pool.map((char) => {
    const isNew = !unlockedCards.includes(char.id)
    return {
      character: char,
      imageName: theme.imageNames[char.imageIndex],
      isNew,
      ticketAward: isNew ? 0 : RARITY_TICKET_VALUE[char.rarity],
    }
  })
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
