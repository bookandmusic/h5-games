import { ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useGameSaveState } from '../../../composables/useGameSaveState'
import {
  type ChineseChessProfile,
  createDefaultProfile,
  getLevelUpWins,
  LEVEL_UP_BONUS,
  loadProfile,
  resetDailyIfNewDay,
  saveProfile as saveProfileToStore,
} from '../store/save'
import type { Board, Difficulty, GameMode, PieceColor } from '../types'

export function useChessPersistence(gameId: string, route: RouteLocationNormalizedLoaded) {
  const profile = ref<ChineseChessProfile>(createDefaultProfile())
  const loaded = ref(false)

  const saver = useGameSaveState(gameId)

  const persistProfile = async () => {
    await saveProfileToStore(profile.value)
  }

  const saveGameState = async (
    mode: GameMode,
    state: {
      board: Board
      currentTurn: PieceColor
      winner: PieceColor | null
      difficulty: Difficulty
      humanSide: PieceColor
      moveCount: number
    }
  ) => {
    if (state.winner !== null) {
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
      currentTurn: PieceColor
      winner: PieceColor | null
      mode: GameMode
      difficulty: Difficulty
      humanSide: PieceColor
      moveCount: number
    }
    return await saver.load<SaveData>(mode)
  }

  const loadProfileData = async () => {
    profile.value = await loadProfile()
    resetDailyIfNewDay(profile.value)
  }

  const updateTask = (
    task: { progress: number; target: number; completed: boolean; claimed: boolean },
    inc: number
  ) => {
    task.progress = Math.min(task.target, task.progress + inc)
    if (task.progress >= task.target) task.completed = true
  }

  const applyWinRewards = (difficulty: Difficulty) => {
    const WIN_COINS: Record<Difficulty, number> = {
      easy: 15,
      medium: 30,
      hard: 50,
      hardest: 80,
    }

    profile.value.totalGames += 1
    profile.value.totalWins += 1
    updateTask(profile.value.daily.tasks.playGame, 1)
    profile.value.wins += 1
    profile.value.currentStreak += 1
    const baseCoins = WIN_COINS[difficulty]
    profile.value.coins += baseCoins
    updateTask(profile.value.daily.tasks.winGame, 1)
    const st = profile.value.daily.tasks.winStreak
    st.progress = Math.min(st.target, profile.value.currentStreak)
    if (st.progress >= st.target) st.completed = true
    while (profile.value.wins >= getLevelUpWins(profile.value.level)) {
      profile.value.wins -= getLevelUpWins(profile.value.level)
      profile.value.level += 1
      profile.value.coins += LEVEL_UP_BONUS
      if (profile.value.level > profile.value.highestLevel) {
        profile.value.highestLevel = profile.value.level
      }
    }
  }

  const applyLossReset = () => {
    profile.value.totalGames += 1
    updateTask(profile.value.daily.tasks.playGame, 1)
    profile.value.currentStreak = 0
  }

  const spendItem = async (item: 'undo' | 'hint'): Promise<boolean> => {
    if (profile.value.inventory[item] <= 0) return false
    profile.value.inventory[item] -= 1
    await persistProfile()
    return true
  }

  const restoreOrStart = async () => {
    await loadProfileData()
    const queryMode = route.query.mode as GameMode | undefined
    const resolvedMode = queryMode || 'ai'

    const saved = await loadGameState(resolvedMode)
    return {
      mode: resolvedMode,
      savedState: saved && saved.winner === null && saved.moveCount > 0 ? saved : null,
    }
  }

  return {
    profile,
    loaded,
    persistProfile,
    saveGameState,
    clearGameState,
    loadGameState,
    loadProfileData,
    updateTask,
    applyWinRewards,
    applyLossReset,
    spendItem,
    restoreOrStart,
  }
}
