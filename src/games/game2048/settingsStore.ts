import { reactive } from 'vue'

import { gameStorage } from '../../stores/gameStorage'
import type { Settings, Theme } from './types'

const SETTINGS_KEY = '2048-settings'

const defaultSettings: Settings = {
  theme: 'default',
}

const settings = reactive<Settings>({ ...defaultSettings })

let loaded = false

export const settingsStore = {
  get theme(): Theme {
    return settings.theme
  },
  async load() {
    if (loaded) return
    const saved = await gameStorage.loadGameState(SETTINGS_KEY)
    if (saved) {
      const s = saved as Settings
      settings.theme = s.theme || defaultSettings.theme
    }
    loaded = true
  },

  async save() {
    await gameStorage.saveGameState(SETTINGS_KEY, { ...settings })
  },

  setTheme(t: Theme) {
    settings.theme = t
    this.save()
  },
}
