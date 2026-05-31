import { gameStorage } from '../stores/gameStorage'

/**
 * 加载游戏存档，若不存在则返回默认值；若存在则与默认值合并
 */
export async function loadProfileWithDefaults<T extends object>(
  key: string,
  defaults: () => T
): Promise<T> {
  const value = await gameStorage.loadGameState<T>(key)
  if (value === null) return defaults()
  return { ...defaults(), ...value }
}
