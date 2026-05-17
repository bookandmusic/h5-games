import { getCtx, retainCtx, setMasterVolume, destroyCtx, osc } from '../../utils/soundUtils'

let sfxVolume = 0.5
let winBuffer: AudioBuffer | null = null
let loseBuffer: AudioBuffer | null = null

async function loadAudio(url: string): Promise<AudioBuffer | null> {
  try {
    const a = getCtx()
    const resp = await fetch(url)
    const arrayBuffer = await resp.arrayBuffer()
    return await a.decodeAudioData(arrayBuffer)
  } catch {
    return null
  }
}

function playBuffer(buffer: AudioBuffer, volume: number) {
  const a = getCtx()
  const source = a.createBufferSource()
  const g = a.createGain()
  g.gain.value = volume * sfxVolume
  source.buffer = buffer
  source.connect(g).connect(a.destination)
  source.start()
}

export const soundManager = {
  async init() {
    setMasterVolume(sfxVolume)
    retainCtx()
    const winUrl = new URL('./assets/audio/win.mp3', import.meta.url).href
    const loseUrl = new URL('./assets/audio/lose.mp3', import.meta.url).href
    ;[winBuffer, loseBuffer] = await Promise.all([loadAudio(winUrl), loadAudio(loseUrl)])
  },

  setVolume(v: number) {
    sfxVolume = v
    setMasterVolume(v)
  },

  playSlide() {
    osc(1200, 0.04, 'square', 0.4)
    osc(1600, 0.03, 'sine', 0.25)
  },

  playMerge() {
    const base = 440
    osc(base, 0.1, 'sine', 0.25)
    osc(base * 1.5, 0.1, 'sine', 0.15, 0.04)
    osc(base * 2, 0.12, 'sine', 0.2, 0.08)
  },

  playPowerUpOpen() {
    osc(520, 0.06, 'triangle', 0.18)
    osc(780, 0.08, 'sine', 0.14, 0.035)
  },

  playUndoPowerUp() {
    osc(620, 0.08, 'sine', 0.2)
    osc(420, 0.1, 'triangle', 0.18, 0.045)
    osc(260, 0.12, 'sine', 0.12, 0.09)
  },

  playWandPowerUp() {
    osc(880, 0.07, 'triangle', 0.18)
    osc(1320, 0.09, 'sine', 0.16, 0.045)
    osc(1760, 0.12, 'triangle', 0.14, 0.1)
  },

  playHammerPowerUp() {
    osc(160, 0.08, 'square', 0.22)
    osc(90, 0.12, 'sine', 0.18, 0.035)
  },

  playWin() {
    if (winBuffer) playBuffer(winBuffer, 1)
  },

  playLose() {
    if (loseBuffer) playBuffer(loseBuffer, 1)
  },

  destroy() {
    destroyCtx()
    winBuffer = null
    loseBuffer = null
  },
}
