import { gameStorage } from '../stores/gameStorage'

/**
 * 通用游戏状态保存器，处理基于 gameId 和 mode 的键值存取
 */
export function useGameSaveState(gameId: string) {
  const getStorageKey = (mode: string) => `${gameId}-save-${mode}`

  return {
    getStorageKey,
    clear: async (mode: string) => {
      await gameStorage.clearGameState(getStorageKey(mode))
    },
    save: async <T extends object>(mode: string, data: T) => {
      await gameStorage.saveGameState(getStorageKey(mode), data)
    },
    load: async <T extends object>(mode: string) => {
      return await gameStorage.loadGameState<T>(getStorageKey(mode))
    },
  }
}
