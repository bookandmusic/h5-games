import { settingsStore } from './settingsStore'

export type SfxType = 'move' | 'eat' | 'check' | 'win' | 'select' | 'back'

interface SfxEntry {
  url: string
  buffer: AudioBuffer | null
  status: 'pending' | 'loaded' | 'failed'
}

const sfxEntries: Record<SfxType, SfxEntry> = {
  move: {
    url: new URL('../assets/audio/moveChess.wav', import.meta.url).href,
    buffer: null,
    status: 'pending',
  },
  eat: {
    url: new URL('../assets/audio/eatChess.wav', import.meta.url).href,
    buffer: null,
    status: 'pending',
  },
  check: {
    url: new URL('../assets/audio/generalSound.wav', import.meta.url).href,
    buffer: null,
    status: 'pending',
  },
  win: {
    url: new URL('../assets/audio/WinSound.wav', import.meta.url).href,
    buffer: null,
    status: 'pending',
  },
  select: {
    url: new URL('../assets/audio/selectChess.wav', import.meta.url).href,
    buffer: null,
    status: 'pending',
  },
  back: {
    url: new URL('../assets/audio/backChess.wav', import.meta.url).href,
    buffer: null,
    status: 'pending',
  },
}

let ctx: AudioContext | null = null
let initialized = false
let pendingPlays: Array<() => void> = []

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

function resumeCtx() {
  if (ctx?.state === 'suspended') {
    ctx.resume().then(flushPending)
  } else if (ctx?.state === 'running') {
    flushPending()
  }
}

function flushPending() {
  if (!ctx) return
  const list = pendingPlays
  pendingPlays = []
  list.forEach((fn) => fn())
}

async function loadEntry(entry: SfxEntry): Promise<void> {
  if (entry.status === 'loaded') return
  entry.status = 'pending'
  try {
    const resp = await fetch(entry.url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const raw = await resp.arrayBuffer()
    const audioCtx = getCtx()
    entry.buffer = await audioCtx.decodeAudioData(raw)
    entry.status = 'loaded'
  } catch (e) {
    entry.status = 'failed'
    console.warn(`[sfxManager] Failed to load audio: ${entry.url}`, e)
  }
}

function generateCheckBuffer(audioCtx: AudioContext): AudioBuffer {
  const duration = 0.35
  const sr = audioCtx.sampleRate
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 880 + Math.sin(t * 30) * 40
    const envelope = Math.max(0, 1 - t / duration)
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
  }
  return buffer
}

function generateWinBuffer(audioCtx: AudioContext): AudioBuffer {
  const duration = 0.8
  const sr = audioCtx.sampleRate
  const length = Math.ceil(sr * duration)
  const buffer = audioCtx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const t = i / sr
    const freq = 523 + (t / duration) * 400
    const envelope = Math.max(0, 1 - t / duration) * 0.6
    data[i] =
      Math.sin(2 * Math.PI * freq * t) * envelope +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * envelope * 0.3
  }
  return buffer
}

const fallbackGenerators: Partial<Record<SfxType, (ctx: AudioContext) => AudioBuffer>> = {
  check: generateCheckBuffer,
  win: generateWinBuffer,
  select: (c) => {
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * 0.12), c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate
      d[i] = Math.sin(2 * Math.PI * 660 * t) * Math.max(0, 1 - t / 0.12) * 0.3
    }
    return b
  },
  back: (c) => {
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * 0.15), c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate
      d[i] = Math.sin(2 * Math.PI * 330 * t) * Math.max(0, 1 - t / 0.15) * 0.3
    }
    return b
  },
  move: (c) => {
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * 0.1), c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate
      d[i] = Math.sin(2 * Math.PI * 440 * t) * Math.max(0, 1 - t / 0.1) * 0.25
    }
    return b
  },
  eat: (c) => {
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * 0.15), c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate
      const freq = 300 + (t / 0.15) * 200
      d[i] =
        (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 0.5 * t)) *
        Math.max(0, 1 - t / 0.15) *
        0.3
    }
    return b
  },
}

function getBuffer(type: SfxType): AudioBuffer | null {
  const entry = sfxEntries[type]
  if (entry.status === 'loaded' && entry.buffer) return entry.buffer
  const gen = fallbackGenerators[type]
  if (gen) return gen(getCtx())
  return null
}

function doPlay(type: SfxType) {
  const buffer = getBuffer(type)
  if (!buffer) return
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
      const resumeOnInteraction = () => {
        resumeCtx()
        document.removeEventListener('pointerdown', resumeOnInteraction, { capture: true })
        document.removeEventListener('keydown', resumeOnInteraction, { capture: true })
      }
      document.addEventListener('pointerdown', resumeOnInteraction, { capture: true })
      document.addEventListener('keydown', resumeOnInteraction, { capture: true })
    }

    await Promise.allSettled(
      (Object.entries(sfxEntries) as [SfxType, SfxEntry][]).map(([, entry]) => loadEntry(entry))
    )
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
    pendingPlays = []
    if (ctx) {
      ctx.close().catch(() => {})
      ctx = null
    }
    initialized = false
    for (const entry of Object.values(sfxEntries)) {
      entry.buffer = null
      entry.status = 'pending'
    }
  },
}
