import { createGameSettingsStore } from '../../../utils/createGameSettingsStore'

interface ChineseChessSettings {
  sfxEnabled: boolean
  musicEnabled: boolean
  volume: number
}

const defaultSettings: ChineseChessSettings = {
  sfxEnabled: true,
  musicEnabled: true,
  volume: 0.5,
}

export const settingsStore = createGameSettingsStore('chinese-chess-settings', defaultSettings)
