import { getCtx, retainCtx, setMasterVolume, destroyCtx, osc } from '../../utils/soundUtils'

let bgmGain: GainNode | null = null
let bgmSource: AudioBufferSourceNode | null = null
let bgmBuffer: AudioBuffer | null = null
let isBgmPlaying = false
const bgmVolume = 0.3
const sfxVolume = 0.6

function noise(duration: number, volume = 1) {
  const a = getCtx()
  const bufferSize = a.sampleRate * duration
  const buffer = a.createBuffer(1, bufferSize, a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
  }
  const source = a.createBufferSource()
  source.buffer = buffer
  const g = a.createGain()
  g.gain.setValueAtTime(volume * sfxVolume, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + duration)
  source.connect(g)
  g.connect(a.destination)
  source.start()
}

export const soundManager = {
  async init() {
    setMasterVolume(sfxVolume)
    retainCtx()
  },

  playCollect() {
    osc(880, 0.2, 'sine', 1)
  },

  playCollectRare() {
    osc(880, 0.3, 'sine', 0.8)
    osc(1320, 0.3, 'sine', 0.4)
  },

  playCollectLucky() {
    osc(523, 0.12, 'sine', 0.7)
    osc(659, 0.12, 'sine', 0.7, 0.1)
    osc(784, 0.12, 'sine', 0.7, 0.2)
    osc(1047, 0.2, 'sine', 0.8, 0.3)
  },

  playCombo3() {
    osc(523, 0.08, 'sine', 0.6)
    osc(659, 0.08, 'sine', 0.6, 0.08)
    osc(784, 0.12, 'sine', 0.7, 0.16)
  },

  playCombo5() {
    osc(523, 0.07, 'sine', 0.6)
    osc(659, 0.07, 'sine', 0.6, 0.07)
    osc(784, 0.07, 'sine', 0.6, 0.14)
    osc(1047, 0.15, 'sine', 0.8, 0.21)
  },

  playCombo8() {
    const notes = [523, 659, 784, 1047, 1319, 1568]
    notes.forEach((f, i) => {
      osc(f, 0.07, i % 2 === 0 ? 'sine' : 'triangle', 0.5, i * 0.06)
    })
    osc(1047, 0.15, 'sine', 0.6, notes.length * 0.06)
  },

  playMeteorHit() {
    noise(0.25, 0.5)
    osc(80, 0.25, 'sine', 0.8)
    osc(60, 0.15, 'sawtooth', 0.3)
  },

  playGameStart() {
    osc(262, 0.15, 'sine', 0.5)
    osc(330, 0.15, 'sine', 0.5, 0.12)
    osc(392, 0.15, 'sine', 0.5, 0.24)
    osc(523, 0.3, 'sine', 0.7, 0.36)
  },

  playGameOver() {
    osc(523, 0.15, 'sine', 0.5)
    window.setTimeout(() => osc(440, 0.15, 'sine', 0.5), 150)
    window.setTimeout(() => osc(349, 0.15, 'sine', 0.5), 300)
    window.setTimeout(() => osc(262, 0.4, 'sine', 0.6), 450)
    window.setTimeout(() => noise(0.3, 0.2), 600)
  },

  playTick() {
    osc(1000, 0.05, 'square', 0.4)
  },

  playHighScore() {
    osc(523, 0.2, 'sine', 0.6)
    osc(659, 0.2, 'sine', 0.6, 0.15)
    osc(784, 0.2, 'sine', 0.6, 0.3)
    osc(1047, 0.4, 'sine', 0.8, 0.45)
    osc(784, 0.3, 'triangle', 0.4, 0.45)
    osc(1047, 0.3, 'triangle', 0.4, 0.45)
  },

  playShield() {
    osc(500, 0.15, 'sine', 0.5)
    window.setTimeout(() => osc(800, 0.15, 'sine', 0.5), 100)
    window.setTimeout(() => osc(1200, 0.2, 'sine', 0.6), 200)
  },

  playShieldBreak() {
    noise(0.15, 0.4)
    osc(2000, 0.05, 'sine', 0.3)
    window.setTimeout(() => osc(200, 0.1, 'sine', 0.3), 50)
  },

  async loadBgmFromUrl(url: string) {
    try {
      const a = getCtx()
      const resp = await fetch(url)
      const arrayBuffer = await resp.arrayBuffer()
      const decoded = await a.decodeAudioData(arrayBuffer)
      bgmBuffer = decoded
    } catch {
      console.warn('BGM load failed')
    }
  },

  startBgm() {
    if (isBgmPlaying || !bgmBuffer) return
    const a = getCtx()
    bgmGain = a.createGain()
    bgmGain.gain.value = bgmVolume
    bgmSource = a.createBufferSource()
    bgmSource.buffer = bgmBuffer
    bgmSource.loop = true
    bgmSource.connect(bgmGain)
    bgmGain.connect(a.destination)
    bgmSource.start()
    isBgmPlaying = true
  },

  stopBgm() {
    if (!isBgmPlaying) return
    try {
      bgmSource?.stop()
    } catch {
      /* ignore */
    }
    bgmSource?.disconnect()
    bgmGain?.disconnect()
    bgmSource = null
    bgmGain = null
    isBgmPlaying = false
  },

  destroy() {
    this.stopBgm()
    destroyCtx()
  },
}
