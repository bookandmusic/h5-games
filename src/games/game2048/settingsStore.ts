import { reactive } from 'vue'

import { gameStorage } from '../../stores/gameStorage'
import type { Difficulty, Settings, Theme } from './types'

const SETTINGS_KEY = '2048-settings'

const defaultSettings: Settings = {
  difficulty: 'medium',
  theme: 'default',
}

const settings = reactive<Settings>({ ...defaultSettings })

let loaded = false

export const settingsStore = {
  get difficulty(): Difficulty {
    return settings.difficulty
  },
  get theme(): Theme {
    return settings.theme
  },
  get settings(): Settings {
    return settings
  },

  async load() {
    if (loaded) return
    const saved = await gameStorage.loadGameState(SETTINGS_KEY)
    if (saved) {
      const s = saved as Settings
      settings.difficulty = s.difficulty || defaultSettings.difficulty
      settings.theme = s.theme || defaultSettings.theme
    }
    loaded = true
  },

  async save() {
    await gameStorage.saveGameState(SETTINGS_KEY, { ...settings })
  },

  setDifficulty(d: Difficulty) {
    settings.difficulty = d
    this.save()
  },

  setTheme(t: Theme) {
    settings.theme = t
    this.save()
  },

  async update(newSettings: Partial<Settings>) {
    if (newSettings.difficulty) settings.difficulty = newSettings.difficulty
    if (newSettings.theme) settings.theme = newSettings.theme
    await this.save()
  },
}
