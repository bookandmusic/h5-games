import { getCtx } from '../../../utils/soundUtils'
import { settingsStore } from './settingsStore'

export type SfxType = 'place' | 'flip' | 'invalid' | 'win' | 'lose' | 'select'

let initialized = false
const pendingPlays: Array<() => void> = []
let bgmAudio: HTMLAudioElement | null = null
let resumeHandler: (() => void) | null = null
let bgmUnsubscribes: Array<() => void> | null = null

function getBgmUrl(): string {
  return new URL('../assets/audio/bgm.mp3', import.meta.url).href
}

function resumeCtx() {
  const ctx = getCtx()
  if (ctx.state === 'suspended') {
    ctx.resume().then(flushPending)
  } else if (ctx.state === 'running') {
    flushPending()
  }
}

function flushPending() {
  pendingPlays.splice(0).forEach((fn) => fn())
}

function generatePlaceBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate
  const duration = 0.12
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 520 + Math.sin(t * 80) * 60
    const envelope = Math.max(0, 1 - t / duration)
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3
  }
  return buffer
}

function generateFlipBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate
  const duration = 0.06
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const noise = Math.random() * 2 - 1
    const freq = 2000
    const filtered = noise * Math.exp(-t * 60) * 0.15
    data[i] = filtered * Math.sin(2 * Math.PI * freq * t) * Math.max(0, 1 - t / duration)
  }
  return buffer
}

function generateInvalidBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate
  const duration = 0.15
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 200
    const envelope = Math.max(0, 1 - t / duration)
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25
  }
  return buffer
}

function generateWinBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate
  const duration = 0.7
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 523 + (t / duration) * 500
    const envelope = Math.max(0, 1 - t / duration) * 0.5
    data[i] =
      Math.sin(2 * Math.PI * freq * t) * envelope +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * envelope * 0.25
  }
  return buffer
}

function generateLoseBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate
  const duration = 0.6
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 400 - (t / duration) * 200
    const envelope = Math.max(0, 1 - t / duration) * 0.4
    data[i] =
      Math.sin(2 * Math.PI * freq * t) * envelope +
      Math.sin(2 * Math.PI * freq * 0.75 * t) * envelope * 0.3
  }
  return buffer
}

function generateSelectBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate
  const duration = 0.08
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 800
    const envelope = Math.max(0, 1 - t / duration)
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2
  }
  return buffer
}

const generators: Record<SfxType, (ctx: AudioContext) => AudioBuffer> = {
  place: generatePlaceBuffer,
  flip: generateFlipBuffer,
  invalid: generateInvalidBuffer,
  win: generateWinBuffer,
  lose: generateLoseBuffer,
  select: generateSelectBuffer,
}

const bufferCache: Partial<Record<SfxType, AudioBuffer>> = {}

function stopBgm() {
  if (bgmAudio) {
    bgmAudio.pause()
    bgmAudio.currentTime = 0
    bgmAudio = null
  }
}

function getBuffer(type: SfxType): AudioBuffer {
  if (bufferCache[type]) return bufferCache[type]!
  const gen = generators[type]
  const buffer = gen(getCtx())
  bufferCache[type] = buffer
  return buffer
}

function doPlay(type: SfxType) {
  const buffer = getBuffer(type)
  const audioCtx = getCtx()
  const source = audioCtx.createBufferSource()
  const gain = audioCtx.createGain()
  gain.gain.value = settingsStore.volume
  source.buffer = buffer
  source.connect(gain).connect(audioCtx.destination)
  source.start(0)
}

export const sfxManager = {
  async init() {
    if (initialized) return
    initialized = true

    const audioCtx = getCtx()
    if (audioCtx.state === 'suspended') {
      resumeHandler = () => {
        resumeCtx()
        if (resumeHandler) {
          document.removeEventListener('pointerdown', resumeHandler, { capture: true })
          document.removeEventListener('keydown', resumeHandler, { capture: true })
          resumeHandler = null
        }
      }
      document.addEventListener('pointerdown', resumeHandler, { capture: true })
      document.addEventListener('keydown', resumeHandler, { capture: true })
    }
  },

  play(type: SfxType) {
    if (!settingsStore.sfxEnabled) return
    const audioCtx = getCtx()
    if (audioCtx.state === 'suspended') {
      pendingPlays.push(() => doPlay(type))
      audioCtx.resume().then(flushPending)
      return
    }
    doPlay(type)
  },

  destroy() {
    if (resumeHandler) {
      document.removeEventListener('pointerdown', resumeHandler, { capture: true })
      document.removeEventListener('keydown', resumeHandler, { capture: true })
      resumeHandler = null
    }
    if (bgmUnsubscribes) {
      bgmUnsubscribes.forEach((fn) => fn())
      bgmUnsubscribes = null
    }
    pendingPlays.splice(0)
    stopBgm()
    initialized = false
    for (const key of Object.keys(bufferCache) as SfxType[]) {
      delete bufferCache[key]
    }
  },

  startBgm() {
    if (!settingsStore.musicEnabled) return
    if (!bgmAudio) {
      bgmAudio = new Audio(getBgmUrl())
      bgmAudio.loop = true
      bgmAudio.volume = settingsStore.volume * 0.3
      const unsub1 = settingsStore.onMusicChange((enabled) => {
        if (enabled) {
          bgmAudio?.play().catch(() => {})
        } else {
          bgmAudio?.pause()
        }
      })
      const unsub2 = settingsStore.onVolumeChange((vol) => {
        if (bgmAudio) bgmAudio.volume = vol * 0.3
      })
      bgmUnsubscribes = [unsub1, unsub2]
    }
    bgmAudio.play().catch(() => {})
  },
}
