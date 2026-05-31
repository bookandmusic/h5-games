import { ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useGameSaveState } from '../../../composables/useGameSaveState'
import {
  type ReversiProfile,
  createDefaultProfile,
  loadProfile,
  saveProfile as saveProfileToStore,
} from '../store/save'
import type { Board, Difficulty, DiskColor, GameMode } from '../types'

export function useReversiPersistence(gameId: string, _route: RouteLocationNormalizedLoaded) {
  const profile = ref<ReversiProfile>(createDefaultProfile())
  const loaded = ref(false)

  const saver = useGameSaveState(gameId)

  const persistProfile = async () => {
    await saveProfileToStore(profile.value)
  }

  const saveGameState = async (
    mode: GameMode,
    state: {
      board: Board
      currentPlayer: DiskColor
      status: string
      difficulty: Difficulty
      humanSide: DiskColor
      moveCount: number
    }
  ) => {
    if (state.status !== 'playing') {
      await saver.clear(mode)
      return
    }
    await saver.save(mode, state)
  }

  const clearGameState = async (mode: GameMode) => {
    await saver.clear(mode)
  }

  const loadGameState = async (mode: GameMode) => {
    type SaveData = {
      board: Board
      currentPlayer: DiskColor
      status: string
      difficulty: Difficulty
      humanSide: DiskColor
      moveCount: number
    }
    return await saver.load<SaveData>(mode)
  }

  const spendCoins = async (amount: number): Promise<boolean> => {
    if (profile.value.coins < amount) return false
    profile.value.coins -= amount
    await persistProfile()
    return true
  }

  const COIN_REWARDS = {
    win: 20,
    draw: 10,
    lose: 0,
  }

  const recordResult = async (result: 'win' | 'lose' | 'draw') => {
    const ratingChange = result === 'win' ? 8 : result === 'draw' ? 3 : -5
    profile.value.rating = Math.max(1, profile.value.rating + ratingChange)
    if (result === 'win') profile.value.wins += 1
    else if (result === 'lose') profile.value.losses += 1
    else profile.value.draws += 1

    profile.value.coins += COIN_REWARDS[result]
    await persistProfile()
  }

  const init = async (preferredMode?: GameMode) => {
    profile.value = await loadProfile()
    if (preferredMode) {
      const saved = await loadGameState(preferredMode)
      loaded.value = true
      return saved
    }
    const saved = await loadGameState('ai')
    loaded.value = true
    return saved
  }

  return {
    profile,
    loaded,
    persistProfile,
    saveGameState,
    clearGameState,
    loadGameState,
    spendCoins,
    recordResult,
    init,
  }
}
