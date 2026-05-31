import { osc, retainCtx, releaseCtx } from '../../utils/soundUtils'

export function playMatchSound(): void {
  osc(523.25, 0.12, 'sine', 0.25)
  osc(659.25, 0.12, 'sine', 0.25, 0.1)
  osc(783.99, 0.18, 'sine', 0.25, 0.2)
}

export function playMismatchSound(): void {
  osc(220, 0.25, 'square', 0.15)
  osc(165, 0.3, 'square', 0.12, 0.15)
}

let bgmAudio: HTMLAudioElement | null = null

export function playBgm(themeId: string): void {
  stopBgm()
  retainCtx()
  const src = new URL(`./assets/audio/bgm-${themeId}.mp3`, import.meta.url).href
  const audio = new Audio()
  audio.loop = true
  audio.volume = 0.35
  audio.preload = 'auto'
  audio.src = src
  void audio.play()
  bgmAudio = audio
}

export function isBgmPlaying(): boolean {
  return bgmAudio !== null && !bgmAudio.paused
}

export function toggleBgm(): boolean {
  if (isBgmPlaying()) {
    bgmAudio!.pause()
    return false
  }
  if (bgmAudio) {
    bgmAudio.volume = 0.35
    void bgmAudio.play()
    return true
  }
  return false
}

export function stopBgm(): void {
  if (bgmAudio) {
    bgmAudio.pause()
    bgmAudio.currentTime = 0
    bgmAudio = null
    releaseCtx()
  }
}

let completionAudio: HTMLAudioElement | null = null

function loadAudio(src: string): HTMLAudioElement | null {
  const audio = new Audio()
  audio.volume = 0.7
  audio.preload = 'auto'
  audio.src = src
  return audio
}

export function loadCompletionAudio(): void {
  stopCompletionAudio()
  retainCtx()
  const src = new URL('./assets/audio/completion-1-star.mp3', import.meta.url).href
  completionAudio = loadAudio(src)
}

export function playCompletionAudio(): void {
  if (!completionAudio) return
  completionAudio.currentTime = 0
  void completionAudio.play()
}

export function stopCompletionAudio(): void {
  if (completionAudio) {
    completionAudio.pause()
    completionAudio.currentTime = 0
    completionAudio = null
    releaseCtx()
  }
}
