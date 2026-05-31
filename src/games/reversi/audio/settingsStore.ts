import { createGameSettingsStore } from '../../../utils/createGameSettingsStore'

interface ReversiSettings {
  sfxEnabled: boolean
  musicEnabled: boolean
  volume: number
}

const defaultSettings: ReversiSettings = {
  sfxEnabled: true,
  musicEnabled: true,
  volume: 0.5,
}

export const settingsStore = createGameSettingsStore('reversi-settings', defaultSettings)
