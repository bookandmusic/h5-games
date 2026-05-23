import type {
  FallingItem,
  GamePhase,
  GameMode,
  GameDifficulty,
  ItemType,
  GameConfig,
} from './types'
import { ITEM_WEIGHTS, ITEM_SCORES, COMBO_THRESHOLDS, COMBO_MULTIPLIERS } from './types'
import { TrailBuffer } from './trailBuffer'

let nextItemId = 0
let gamePhase: GamePhase = 'idle'
let gameMode: GameMode = 'timed'
let timedDuration = 90
let score = 0
let lives = 3
let elapsed = 0
let combo = 0
let maxCombo = 0
let starsCollected = 0
let shieldActive = false
let items: FallingItem[] = []
let spawnTimer = 0
let gameLevel = 0
let canvasWidth = 400
let canvasHeight = 600

const ITEM_BASE_SIZE = 40

export const gameState = {
  get phase() {
    return gamePhase
  },
  get mode() {
    return gameMode
  },
  get score() {
    return score
  },
  get lives() {
    return lives
  },
  get elapsed() {
    return elapsed
  },
  get combo() {
    return combo
  },
  get maxCombo() {
    return maxCombo
  },
  get starsCollected() {
    return starsCollected
  },
  get items() {
    return items
  },
  get level() {
    return gameLevel
  },
  get timedDuration() {
    return timedDuration
  },
  get shieldActive() {
    return shieldActive
  },
}

function getDifficulty(): GameDifficulty {
  const t = elapsed
  let level: number
  if (gameMode === 'timed') {
    level = Math.floor(t / 10)
  } else {
    level = Math.floor(t / 8)
  }
  gameLevel = level

  const spawnInterval = Math.max(400, 1200 - level * 80)
  const speedMin = Math.min(210, 60 + level * 15)
  const speedMax = Math.min(360, 120 + level * 18)
  const meteorWeight = Math.min(30, 12 + level * 2)
  const shieldWeight = Math.max(1, 4 - level * 0.3)

  return { spawnInterval, speedMin, speedMax, meteorWeight, shieldWeight }
}

function pickItemType(diff: GameDifficulty): ItemType {
  const weights: Record<ItemType, number> = {
    star: ITEM_WEIGHTS.star,
    sapphire: ITEM_WEIGHTS.sapphire,
    amethyst: ITEM_WEIGHTS.amethyst,
    lucky: ITEM_WEIGHTS.lucky,
    meteor: diff.meteorWeight,
    shield: diff.shieldWeight,
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total

  for (const [type, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return type as ItemType
  }
  return 'star'
}

function spawnItem(diff: GameDifficulty, width: number) {
  const type = pickItemType(diff)
  const size = ITEM_BASE_SIZE + (type === 'lucky' ? 6 : type === 'meteor' ? 4 : 0)
  const x = Math.random() * (width - size * 4) + size * 2
  const speed = diff.speedMin + Math.random() * (diff.speedMax - diff.speedMin)

  const item: FallingItem = {
    id: nextItemId++,
    type,
    x,
    y: -size * 2,
    speed,
    size,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 3,
    glowIntensity: 0.8 + Math.random() * 0.4,
    glowPhase: Math.random() * Math.PI * 2,
    trail: new TrailBuffer(8),
    opacity: 1,
    points: ITEM_SCORES[type],
  }

  items.push(item)
}

export function initGame(config: GameConfig) {
  gameMode = config.mode
  timedDuration = config.timedDuration
  gamePhase = 'idle'
  score = 0
  lives = config.mode === 'endless' ? 5 : 3
  elapsed = 0
  combo = 0
  maxCombo = 0
  starsCollected = 0
  shieldActive = false
  items = []
  spawnTimer = 0
  gameLevel = 0
  nextItemId = 0
}

export function startGame() {
  gamePhase = 'countdown'
}

export function beginPlaying() {
  gamePhase = 'playing'
}

export function endGame() {
  gamePhase = 'ended'
}

export function updateGame(dt: number, _cw: number, _ch: number) {
  if (gamePhase !== 'playing') return

  elapsed += dt / 1000
  canvasWidth = _cw
  canvasHeight = _ch

  if (gameMode === 'timed' && elapsed >= timedDuration) {
    endGame()
    return
  }

  const diff = getDifficulty()

  spawnTimer += dt
  if (spawnTimer >= diff.spawnInterval) {
    spawnTimer = 0
    spawnItem(diff, canvasWidth)
  }

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    item.y += item.speed * (dt / 1000)
    item.rotation += item.rotationSpeed * (dt / 1000)

    item.trail.push(item.x, item.y)

    if (item.y > canvasHeight + item.size * 2) {
      if (item.type !== 'meteor' && item.type !== 'shield') {
        combo = 0
      }
      items.splice(i, 1)
    }
  }
}

export function handleTap(
  tapX: number,
  tapY: number
): {
  hit: boolean
  itemType: ItemType | null
  points: number
  comboLevel: number
} {
  if (gamePhase !== 'playing') {
    return { hit: false, itemType: null, points: 0, comboLevel: 0 }
  }

  let closestItem: FallingItem | null = null
  let closestDist = Infinity

  for (const item of items) {
    if (item.opacity < 0.5) continue
    const dx = tapX - item.x
    const dy = tapY - item.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const hitRadius = item.size * 1.5
    if (dist < hitRadius && dist < closestDist) {
      closestItem = item
      closestDist = dist
    }
  }

  if (!closestItem) {
    return { hit: false, itemType: null, points: 0, comboLevel: 0 }
  }

  const item = closestItem
  const type = item.type

  item.opacity = 0

  const comboLevel = getComboLevel()

  if (type === 'shield') {
    shieldActive = true
    combo = 0
    return { hit: true, itemType: type, points: 0, comboLevel: 0 }
  }

  if (type === 'meteor') {
    if (shieldActive) {
      shieldActive = false
      combo = 0
      return { hit: true, itemType: type, points: -1, comboLevel: 0 }
    }
    combo = 0
    lives--
    if (lives <= 0) {
      window.setTimeout(() => endGame(), 500)
    }
    return { hit: true, itemType: type, points: -1, comboLevel: 0 }
  }

  const mult = COMBO_MULTIPLIERS[comboLevel]
  const basePoints = ITEM_SCORES[type]
  const points = Math.round(basePoints * mult)
  score += points
  combo++
  starsCollected++
  if (combo > maxCombo) maxCombo = combo

  return { hit: true, itemType: type, points, comboLevel }
}

function getComboLevel(): number {
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (combo >= COMBO_THRESHOLDS[i]) return i
  }
  return 0
}

export function getFinalScore() {
  return { score, starsCollected, maxCombo, elapsed: Math.round(elapsed) }
}
