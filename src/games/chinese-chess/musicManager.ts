import { settingsStore } from './settingsStore'

type MusicType = '01' | '02'

let currentAudio: HTMLAudioElement | null = null
let currentType: MusicType | null = null

const musicUrls: Record<MusicType, string> = {
  '01': new URL('./assets/music/01.mp3', import.meta.url).href,
  '02': new URL('./assets/music/02.mp3', import.meta.url).href,
}

export const musicManager = {
  play(type: MusicType) {
    if (!settingsStore.bgMusicEnabled) return
    if (currentType === type && currentAudio) return

    this.stop()

    currentAudio = new Audio(musicUrls[type])
    currentAudio.loop = true
    currentAudio.volume = type === '01' ? 0.3 : 0.5
    currentAudio.play().catch(() => {})
    currentType = type
  },

  stop() {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio = null
      currentType = null
    }
  },

  getCurrentType(): MusicType | null {
    return currentType
  },
}
