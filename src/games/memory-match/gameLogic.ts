import type { Card } from './types'

let nextId = 0

export function resetIdCounter(): void {
  nextId = 0
}

function getId(): number {
  return nextId++
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateDeck(pairs: number, imageNames: string[]): Card[] {
  const selected = shuffleArray(imageNames).slice(0, pairs)
  const cards: Card[] = []

  selected.forEach((name, index) => {
    cards.push({
      id: getId(),
      patternId: index,
      state: 'hidden',
      imageName: name,
    })
    cards.push({
      id: getId(),
      patternId: index,
      state: 'hidden',
      imageName: name,
    })
  })

  return shuffleArray(cards)
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
