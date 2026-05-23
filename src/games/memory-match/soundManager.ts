let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function ensureResumed(): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    return ctx.resume()
  }
  return Promise.resolve()
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  startTime: number = 0,
  gainValue: number = 0.3
): void {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime)
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + startTime)
  osc.stop(ctx.currentTime + startTime + duration)
}

export function playMatchSound(): void {
  void ensureResumed()
  playTone(523.25, 0.12, 'sine', 0, 0.25)
  playTone(659.25, 0.12, 'sine', 0.1, 0.25)
  playTone(783.99, 0.18, 'sine', 0.2, 0.25)
}

export function playMismatchSound(): void {
  void ensureResumed()
  playTone(220, 0.25, 'square', 0, 0.15)
  playTone(165, 0.3, 'square', 0.15, 0.12)
}

let bgmAudio: HTMLAudioElement | null = null

export function playBgm(themeId: string): void {
  stopBgm()
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
  }
}
