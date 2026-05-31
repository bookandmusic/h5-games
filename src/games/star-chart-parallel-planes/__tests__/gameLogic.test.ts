import { describe, expect, it } from 'vitest'
import {
  mulberry32,
  shuffleArray,
  calculateScore,
  calculateStars,
  formatTime,
  generateDeck,
  generateBlindBox,
  createRoundSeed,
} from '../gameLogic'
import type { ThemeConfig, CharacterData } from '../types'
import { SSR_PITY_THRESHOLD } from '../types'

function seededRng(seed: number) {
  return mulberry32(seed)
}

function makeTheme(characters: CharacterData[]): ThemeConfig {
  return {
    id: 'urban',
    name: '都市时空',
    cardBackFallback: 'gradient',
    accentColor: '#FF8A65',
    imageNames: characters.map((_, i) => `char-${i}`),
    characters,
  }
}

function makeChar(id: number, rarity: 'R' | 'SR' | 'SSR', imageIndex: number): CharacterData {
  return {
    id,
    title: `Char ${id}`,
    name: `Char ${id}`,
    rarity,
    imageIndex,
  }
}

describe('mulberry32', () => {
  it('returns deterministic values for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })

  it('returns different values for different seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const resultsA = Array.from({ length: 10 }, () => a())
    const resultsB = Array.from({ length: 10 }, () => b())
    expect(resultsA).not.toEqual(resultsB)
  })

  it('returns values in [0, 1) range', () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const rng = seededRng(1)
    const result = shuffleArray([1, 2, 3, 4, 5], rng)
    expect(result).toHaveLength(5)
  })

  it('contains the same elements', () => {
    const rng = seededRng(1)
    const input = [10, 20, 30, 40]
    const result = shuffleArray(input, rng)
    expect(result.sort((a, b) => a - b)).toEqual([10, 20, 30, 40])
  })

  it('is deterministic with seeded RNG', () => {
    const a = shuffleArray([1, 2, 3, 4, 5, 6], seededRng(7))
    const b = shuffleArray([1, 2, 3, 4, 5, 6], seededRng(7))
    expect(a).toEqual(b)
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3]
    const copy = [...input]
    shuffleArray(input, seededRng(1))
    expect(input).toEqual(copy)
  })
})

describe('createRoundSeed', () => {
  it('returns the same seed for the same round context', () => {
    expect(createRoundSeed(3, 'urban', 'easy')).toBe(createRoundSeed(3, 'urban', 'easy'))
  })

  it('changes seed across round context', () => {
    expect(createRoundSeed(3, 'urban', 'easy')).not.toBe(createRoundSeed(4, 'urban', 'easy'))
  })
})

describe('calculateScore', () => {
  it('returns max score at 0 elapsed and 0 moves', () => {
    expect(calculateScore(0, 0)).toBe(10000)
  })

  it('deducts 15 per second elapsed', () => {
    expect(calculateScore(100, 0)).toBe(10000 - 1500)
  })

  it('deducts 60 per move', () => {
    expect(calculateScore(0, 10)).toBe(10000 - 600)
  })

  it('never returns negative', () => {
    expect(calculateScore(99999, 9999)).toBe(0)
  })

  it('gives correct value for 30 seconds and 10 moves', () => {
    expect(calculateScore(30, 10)).toBe(10000 - 30 * 15 - 10 * 60)
  })
})

describe('calculateStars', () => {
  it('returns 3 for score >= 6500', () => {
    expect(calculateStars(6500)).toBe(3)
    expect(calculateStars(10000)).toBe(3)
  })

  it('returns 2 for score >= 4000 and < 6500', () => {
    expect(calculateStars(4000)).toBe(2)
    expect(calculateStars(6499)).toBe(2)
  })

  it('returns 1 for score > 0 and < 4000', () => {
    expect(calculateStars(1)).toBe(1)
    expect(calculateStars(3999)).toBe(1)
  })

  it('returns 0 for score of 0', () => {
    expect(calculateStars(0)).toBe(0)
  })
})

describe('formatTime', () => {
  it('formats 0 as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formats seconds correctly', () => {
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(45)).toBe('0:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30')
    expect(formatTime(3661)).toBe('61:01')
  })

  it('pads single-digit seconds with leading zero', () => {
    expect(formatTime(61)).toBe('1:01')
  })
})

describe('generateDeck', () => {
  const chars = [
    makeChar(1, 'SSR', 0),
    makeChar(2, 'SSR', 1),
    makeChar(3, 'SSR', 2),
    makeChar(4, 'SR', 3),
    makeChar(5, 'SR', 4),
    makeChar(6, 'SR', 5),
    makeChar(7, 'SR', 6),
    makeChar(8, 'SR', 7),
    makeChar(9, 'SR', 8),
    makeChar(10, 'R', 9),
    makeChar(11, 'R', 10),
    makeChar(12, 'R', 11),
    makeChar(13, 'R', 12),
    makeChar(14, 'R', 13),
    makeChar(15, 'R', 14),
    makeChar(16, 'R', 15),
    makeChar(17, 'R', 16),
    makeChar(18, 'R', 17),
  ]
  const theme = makeTheme(chars)

  it('returns 16 cards (8 pairs)', () => {
    const { cards } = generateDeck(theme, 'easy', [], 0, seededRng(1))
    expect(cards).toHaveLength(16)
  })

  it('each pattern appears exactly twice', () => {
    const { cards } = generateDeck(theme, 'easy', [], 0, seededRng(1))
    const counts = new Map<number, number>()
    cards.forEach((c) => counts.set(c.patternId, (counts.get(c.patternId) || 0) + 1))
    counts.forEach((count) => expect(count).toBe(2))
  })

  it('easy mode only selects R rarity characters', () => {
    const { selectedChars } = generateDeck(theme, 'easy', [], 0, seededRng(1))
    selectedChars.forEach((c) => expect(c.rarity).toBe('R'))
  })

  it('hard mode picks characters across rarities', () => {
    const { selectedChars } = generateDeck(theme, 'hard', [], 0, seededRng(99))
    const rarities = new Set(selectedChars.map((c) => c.rarity))
    expect(rarities.size).toBeGreaterThan(1)
  })

  it('increments pity when no SSR is drawn in hard mode', () => {
    const { newPity } = generateDeck(theme, 'hard', [], 0, seededRng(55))
    expect(newPity).toBe(1)
  })

  it('resets pity to 0 when SSR is drawn in hard mode', () => {
    const { newPity, selectedChars } = generateDeck(theme, 'hard', [], 0, seededRng(99))
    const hasSSR = selectedChars.some((c) => c.rarity === 'SSR')
    if (hasSSR) {
      expect(newPity).toBe(0)
    }
  })

  it('forces an SSR when pity reaches threshold in hard mode', () => {
    const { selectedChars, newPity } = generateDeck(
      theme,
      'hard',
      [],
      SSR_PITY_THRESHOLD,
      seededRng(55)
    )
    const hasSSR = selectedChars.some((c) => c.rarity === 'SSR')
    expect(hasSSR).toBe(true)
    expect(newPity).toBe(0)
  })

  it('cards have correct themeId', () => {
    const { cards } = generateDeck(theme, 'easy', [], 0, seededRng(1))
    cards.forEach((c) => expect(c.themeId).toBe('urban'))
  })

  it('pity increments correctly over consecutive games', () => {
    const { newPity: p1 } = generateDeck(theme, 'hard', [], 0, seededRng(55))
    const { newPity: p2 } = generateDeck(theme, 'hard', [], p1, seededRng(55))
    expect(p2).toBe(p1 + 1)
  })
})

describe('generateBlindBox', () => {
  const chars = [
    makeChar(1, 'SSR', 0),
    makeChar(2, 'SSR', 1),
    makeChar(3, 'SSR', 2),
    makeChar(4, 'SR', 3),
    makeChar(5, 'SR', 4),
    makeChar(6, 'SR', 5),
    makeChar(7, 'SR', 6),
    makeChar(8, 'SR', 7),
    makeChar(9, 'SR', 8),
    makeChar(10, 'R', 9),
    makeChar(11, 'R', 10),
    makeChar(12, 'R', 11),
    makeChar(13, 'R', 12),
    makeChar(14, 'R', 13),
    makeChar(15, 'R', 14),
    makeChar(16, 'R', 15),
    makeChar(17, 'R', 16),
    makeChar(18, 'R', 17),
  ]
  const theme = makeTheme(chars)

  it('returns 6 items', () => {
    const items = generateBlindBox(chars, theme, 'easy', [], seededRng(1))
    expect(items).toHaveLength(6)
  })

  it('new characters have ticketAward of 0', () => {
    const items = generateBlindBox(chars, theme, 'easy', [], seededRng(1))
    items.forEach((item) => {
      if (item.isNew) expect(item.ticketAward).toBe(0)
    })
  })

  it('owned characters have ticketAward according to rarity', () => {
    const allIds = chars.map((c) => c.id)
    const items = generateBlindBox(chars, theme, 'easy', allIds, seededRng(1))
    items.forEach((item) => {
      expect(item.isNew).toBe(false)
      expect(item.ticketAward).toBeGreaterThan(0)
    })
  })

  it('hard mode upgrades pool when no SR/SSR present', () => {
    const unlocked = [1, 2, 4] // unlock SSR id:1, SR id:4
    const items = generateBlindBox(chars, theme, 'hard', unlocked, seededRng(55))
    const hasSRorHigher = items.some(
      (item) => item.character.rarity === 'SR' || item.character.rarity === 'SSR'
    )
    expect(hasSRorHigher).toBe(true)
  })

  it('outputs correct imageName for each character', () => {
    const items = generateBlindBox(chars, theme, 'easy', [], seededRng(1))
    items.forEach((item) => {
      expect(item.imageName).toBe(`char-${item.character.imageIndex}`)
    })
  })

  it('all owned chars have ticketAward > 0', () => {
    const allIds = chars.map((c) => c.id)
    const items = generateBlindBox(chars, theme, 'easy', allIds, seededRng(1))
    items.forEach((item) => {
      expect(item.isNew).toBe(false)
      expect(item.ticketAward).toBeGreaterThan(0)
    })
  })

  it('hard mode does not upgrade when SR/SSR already in pool', () => {
    const onlySR = chars.filter((c) => c.rarity === 'SR')
    const items = generateBlindBox(onlySR, theme, 'hard', [], seededRng(1))
    const maxRarity = items.reduce((max, item) => {
      const order = ['R', 'SR', 'SSR']
      return order.indexOf(item.character.rarity) > order.indexOf(max) ? item.character.rarity : max
    }, 'R')
    expect(maxRarity).not.toBe('R')
  })
})
