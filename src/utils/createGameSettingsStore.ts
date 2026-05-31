import { reactive } from 'vue'
import { gameStorage } from '../stores/gameStorage'

export interface GameAudioSettings {
  sfxEnabled: boolean
  musicEnabled: boolean
  volume: number
}

export type MusicListener = (enabled: boolean) => void
export type VolumeListener = (vol: number) => void

export function createGameSettingsStore<T extends GameAudioSettings>(
  settingsKey: string,
  defaults: T
) {
  const settings = reactive<T>({ ...defaults })
  let loaded = false

  const musicListeners: MusicListener[] = []
  const volumeListeners: VolumeListener[] = []
  const sfxListeners: MusicListener[] = []

  function notifyMusic(enabled: boolean) {
    musicListeners.forEach((fn) => fn(enabled))
  }

  function notifyVolume(vol: number) {
    volumeListeners.forEach((fn) => fn(vol))
  }

  function notifySfx(enabled: boolean) {
    sfxListeners.forEach((fn) => fn(enabled))
  }

  return {
    get sfxEnabled(): boolean {
      return settings.sfxEnabled
    },
    get musicEnabled(): boolean {
      return settings.musicEnabled
    },
    get volume(): number {
      return settings.volume
    },

    async load() {
      if (loaded) return
      const saved = await gameStorage.loadGameState(settingsKey)
      if (saved) {
        const s = saved as T
        settings.sfxEnabled = (s.sfxEnabled ?? defaults.sfxEnabled) as T['sfxEnabled']
        settings.musicEnabled = (s.musicEnabled ?? defaults.musicEnabled) as T['musicEnabled']
        settings.volume = (s.volume ?? defaults.volume) as T['volume']
      }
      loaded = true
    },

    async save() {
      await gameStorage.saveGameState(settingsKey, { ...settings })
    },

    setSfxEnabled(enabled: boolean) {
      settings.sfxEnabled = enabled as T['sfxEnabled']
      void this.save()
      notifySfx(enabled)
    },

    setMusicEnabled(enabled: boolean) {
      settings.musicEnabled = enabled as T['musicEnabled']
      void this.save()
      notifyMusic(enabled)
    },

    setVolume(vol: number) {
      settings.volume = Math.max(0, Math.min(1, vol)) as T['volume']
      void this.save()
      notifyVolume(settings.volume)
    },

    toggleAll() {
      const next = !(settings.sfxEnabled && settings.musicEnabled)
      settings.sfxEnabled = next as T['sfxEnabled']
      settings.musicEnabled = next as T['musicEnabled']
      void this.save()
      notifyMusic(next)
      notifySfx(next)
    },

    onMusicChange(fn: MusicListener) {
      musicListeners.push(fn)
      return () => {
        const idx = musicListeners.indexOf(fn)
        if (idx >= 0) musicListeners.splice(idx, 1)
      }
    },

    onVolumeChange(fn: VolumeListener) {
      volumeListeners.push(fn)
      return () => {
        const idx = volumeListeners.indexOf(fn)
        if (idx >= 0) volumeListeners.splice(idx, 1)
      }
    },

    onSfxChange(fn: MusicListener) {
      sfxListeners.push(fn)
      return () => {
        const idx = sfxListeners.indexOf(fn)
        if (idx >= 0) sfxListeners.splice(idx, 1)
      }
    },
  }
}
