import { BOARD_SIZE, POSITION_WEIGHTS } from '../constants'
import type { Board, DiskColor } from '../types'
import { countDisks, opponent } from '../engine/board'
import { getGameStatus } from '../engine/judge'

/**
 * Count stable disks — pieces that can never be flipped.
 * Simple edge-based stability: scan from each corner along edges;
 * a disk on an edge is stable if all disks between it and the nearest
 * corner belong to the same player.
 */
function countStableDisks(board: Board, color: DiskColor): number {
  const stable = new Set<string>()
  const same = (r: number, c: number) => board[r]?.[c]?.color === color

  const scan = (sr: number, sc: number, dr: number, dc: number) => {
    let r = sr,
      c = sc
    while (same(r, c)) {
      stable.add(`${r},${c}`)
      r += dr
      c += dc
    }
  }

  // Corner anchors — only scan outward if corner is owned
  if (same(0, 0)) {
    scan(0, 1, 0, 1)
    scan(1, 0, 1, 0)
  }
  if (same(0, 7)) {
    scan(0, 6, 0, -1)
    scan(1, 7, 1, 0)
  }
  if (same(7, 0)) {
    scan(7, 1, 0, 1)
    scan(6, 0, -1, 0)
  }
  if (same(7, 7)) {
    scan(7, 6, 0, -1)
    scan(6, 7, -1, 0)
  }

  return stable.size
}

export function evaluate(board: Board, color: DiskColor): number {
  const status = getGameStatus(board, color)
  const enemy = opponent(color)

  if (status === `${color}-wins`) return 10000
  if (status === `${enemy}-wins`) return -10000
  if (status === 'draw') return 0

  let score = 0

  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const disk = board[r][c]
      if (!disk) continue

      if (disk.color === color) {
        score += POSITION_WEIGHTS[r][c]
      } else {
        score -= POSITION_WEIGHTS[r][c]
      }
    }
  }

  const myDisks = countDisks(board, color)
  const enemyDisks = countDisks(board, enemy)
  const totalDisks = myDisks + enemyDisks

  if (totalDisks > 50) {
    score += (myDisks - enemyDisks) * 10
  }

  // Stable disks bonus: edge stability is the most important positional
  // factor in reversi — once you own an edge anchored at a corner,
  // those pieces are permanently safe
  const myStable = countStableDisks(board, color)
  const enemyStable = countStableDisks(board, enemy)
  score += (myStable - enemyStable) * 60

  return score
}
