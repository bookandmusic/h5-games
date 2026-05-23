import { reactive } from 'vue'

import { gameStorage } from '../../../stores/gameStorage'

interface ChineseChessSettings {
  sfxEnabled: boolean
  musicEnabled: boolean
  volume: number
}

const SETTINGS_KEY = 'chinese-chess-settings'

const defaultSettings: ChineseChessSettings = {
  sfxEnabled: true,
  musicEnabled: true,
  volume: 0.5,
}

const settings = reactive<ChineseChessSettings>({ ...defaultSettings })

let loaded = false

export const settingsStore = {
  get sfxEnabled(): boolean {
    return settings.sfxEnabled
  },
  get musicEnabled(): boolean {
    return settings.musicEnabled
  },
  get volume(): number {
    return settings.volume
  },
  get all(): ChineseChessSettings {
    return { ...settings }
  },

  async load() {
    if (loaded) return
    const saved = await gameStorage.loadGameState(SETTINGS_KEY)
    if (saved) {
      const s = saved as ChineseChessSettings
      settings.sfxEnabled = s.sfxEnabled ?? defaultSettings.sfxEnabled
      settings.musicEnabled = s.musicEnabled ?? defaultSettings.musicEnabled
      settings.volume = s.volume ?? defaultSettings.volume
    }
    loaded = true
  },

  async save() {
    await gameStorage.saveGameState(SETTINGS_KEY, { ...settings })
  },

  setSfxEnabled(enabled: boolean) {
    settings.sfxEnabled = enabled
    this.save()
  },

  setMusicEnabled(enabled: boolean) {
    settings.musicEnabled = enabled
    this.save()
  },

  setVolume(vol: number) {
    settings.volume = Math.max(0, Math.min(1, vol))
    this.save()
  },

  toggleAll() {
    const next = !(settings.sfxEnabled && settings.musicEnabled)
    settings.sfxEnabled = next
    settings.musicEnabled = next
    this.save()
  },
}
