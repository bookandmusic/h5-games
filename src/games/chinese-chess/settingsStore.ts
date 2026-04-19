import { reactive } from 'vue'

import { gameStorage } from '../../stores/gameStorage'

export interface ChineseChessSettings {
  bgMusicEnabled: boolean
}

const SETTINGS_KEY = 'chinese-chess-settings'

const defaultSettings: ChineseChessSettings = {
  bgMusicEnabled: true,
}

const settings = reactive<ChineseChessSettings>({ ...defaultSettings })

let loaded = false

export const settingsStore = {
  get bgMusicEnabled(): boolean {
    return settings.bgMusicEnabled
  },
  get settings(): ChineseChessSettings {
    return settings
  },

  async load() {
    if (loaded) return
    const saved = await gameStorage.loadGameState(SETTINGS_KEY)
    if (saved) {
      const s = saved as ChineseChessSettings
      settings.bgMusicEnabled = s.bgMusicEnabled ?? defaultSettings.bgMusicEnabled
    }
    loaded = true
  },

  async save() {
    await gameStorage.saveGameState(SETTINGS_KEY, { ...settings })
  },

  setBgMusicEnabled(enabled: boolean) {
    settings.bgMusicEnabled = enabled
    this.save()
  },
}
