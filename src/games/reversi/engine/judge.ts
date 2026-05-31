import type { Board, DiskColor, GameStatus } from '../types'
import { countDisks, hasLegalMove, opponent } from './board'

export function getGameStatus(board: Board, currentPlayer: DiskColor): GameStatus {
  const currentHasMove = hasLegalMove(board, currentPlayer)
  const oppHasMove = hasLegalMove(board, opponent(currentPlayer))

  if (!currentHasMove && !oppHasMove) {
    const blackCount = countDisks(board, 'black')
    const whiteCount = countDisks(board, 'white')
    if (blackCount > whiteCount) return 'black-wins'
    if (whiteCount > blackCount) return 'white-wins'
    return 'draw'
  }

  return 'playing'
}

export function shouldSkipTurn(board: Board, currentPlayer: DiskColor): boolean {
  return !hasLegalMove(board, currentPlayer)
}
