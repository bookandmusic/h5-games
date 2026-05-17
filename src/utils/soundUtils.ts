let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let masterVolume = 1
let refCount = 0

export function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 1
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

export function retainCtx(): void {
  getCtx()
  refCount++
}

export function releaseCtx() {
  refCount--
  if (refCount <= 0) {
    refCount = 0
    if (ctx) {
      ctx.close()
      ctx = null
      masterGain = null
    }
  }
}

function getMaster(): GainNode {
  getCtx()
  return masterGain!
}

export function setMasterVolume(v: number) {
  masterVolume = v
}

export function destroyCtx() {
  refCount = 0
  if (ctx) {
    ctx.close()
    ctx = null
  }
  masterGain = null
}

export function osc(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 1,
  startOffset = 0
) {
  const a = getCtx()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, a.currentTime + startOffset)
  g.gain.linearRampToValueAtTime(volume * masterVolume, a.currentTime + startOffset + 0.005)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + startOffset + duration)
  o.connect(g)
  g.connect(getMaster())
  o.start(a.currentTime + startOffset)
  o.stop(a.currentTime + startOffset + duration)
}
