import { invoke } from '@tauri-apps/api/core'

// 检测是否在 Tauri 环境
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// 通用游戏状态存储服务
export const gameStorage = {
  /**
   * 保存游戏状态
   * @param gameId 游戏ID (如 "2048")
   * @param state 游戏状态对象
   */
  async saveGameState<T extends object>(gameId: string, state: T): Promise<boolean> {
    if (isTauri()) {
      return invoke<boolean>('save_game_state', { gameId, state })
    } else {
      // 纯前端开发模式，使用 localStorage fallback
      const key = `game_state_${gameId}`
      localStorage.setItem(key, JSON.stringify(state))
      return true
    }
  },

  /**
   * 加载游戏状态
   * @param gameId 游戏ID
   * @returns 游戏状态对象，不存在则返回 null
   */
  async loadGameState<T extends object>(gameId: string): Promise<T | null> {
    if (isTauri()) {
      return invoke<T | null>('load_game_state', { gameId })
    } else {
      const key = `game_state_${gameId}`
      const data = localStorage.getItem(key)
      try {
        return data ? (JSON.parse(data) as T) : null
      } catch {
        return null
      }
    }
  },

  /**
   * 清除游戏状态
   * @param gameId 游戏ID
   */
  async clearGameState(gameId: string): Promise<boolean> {
    if (isTauri()) {
      return invoke<boolean>('clear_game_state', { gameId })
    } else {
      const key = `game_state_${gameId}`
      localStorage.removeItem(key)
      return true
    }
  },
}
