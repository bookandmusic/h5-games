import type { Particle, ComboRing, FloatingText, ScorePopup } from './types'

const particles: Particle[] = []
const comboRings: ComboRing[] = []
const floatingTexts: FloatingText[] = []
const scorePopups: ScorePopup[] = []
const starField: {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinklePhase: number
}[] = []

const MAX_PARTICLES = 500

export const particleSystem = {
  initStarField(width: number, height: number) {
    starField.length = 0
    for (let i = 0; i < 120; i++) {
      starField.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }
  },

  emitParticles(x: number, y: number, color: string, count = 15) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) {
        particles.shift()
      }
      const angle = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.5
      const speed = Math.random() * 4 + 1.5
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: Math.random() * 4 + 2,
        color,
        decay: 0.015 + Math.random() * 0.02,
      })
    }
  },

  emitComboRing(x: number, y: number, comboLevel: number) {
    const colors = ['#ffd700', '#00d4ff', '#b388ff', '#ff6ec7', '#ff4444']
    comboRings.push({
      x,
      y,
      radius: 10,
      maxRadius: 60 + comboLevel * 15,
      opacity: 1,
      color: colors[Math.min(comboLevel, colors.length - 1)],
    })
  },

  addFloatingText(x: number, y: number, text: string, color = '#ffffff', size = 18) {
    floatingTexts.push({
      x,
      y,
      text,
      life: 1,
      color,
      size,
    })
  },

  addScorePopup(x: number, y: number, value: number, combo: number) {
    scorePopups.push({
      x,
      y,
      value,
      life: 1,
      combo,
    })
  },

  update() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.97
      p.vy *= 0.97
      p.life -= p.decay
      if (p.life <= 0) {
        particles[i] = particles[particles.length - 1]
        particles.pop()
      }
    }

    for (let i = comboRings.length - 1; i >= 0; i--) {
      const r = comboRings[i]
      r.radius += 2
      r.opacity = 1 - r.radius / r.maxRadius
      if (r.opacity <= 0) {
        comboRings[i] = comboRings[comboRings.length - 1]
        comboRings.pop()
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i]
      t.y -= 1.2
      t.life -= 0.02
      if (t.life <= 0) {
        floatingTexts[i] = floatingTexts[floatingTexts.length - 1]
        floatingTexts.pop()
      }
    }

    for (let i = scorePopups.length - 1; i >= 0; i--) {
      const s = scorePopups[i]
      s.y -= 1.5
      s.life -= 0.018
      if (s.life <= 0) {
        scorePopups[i] = scorePopups[scorePopups.length - 1]
        scorePopups.pop()
      }
    }
  },

  drawStars(ctx: CanvasRenderingContext2D, time: number) {
    for (const star of starField) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7
      const alpha = star.brightness * twinkle
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.fill()
    }
  },

  drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life * 0.8
      ctx.fill()
      ctx.globalAlpha = 1
    }
  },

  drawComboRings(ctx: CanvasRenderingContext2D) {
    for (const r of comboRings) {
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
      ctx.strokeStyle = r.color
      ctx.globalAlpha = r.opacity * 0.6
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  },

  drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const t of floatingTexts) {
      ctx.globalAlpha = t.life
      ctx.font = `bold ${t.size}px "Avenir Next", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = t.color
      ctx.shadowColor = t.color
      ctx.shadowBlur = 10
      ctx.fillText(t.text, t.x, t.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  },

  drawScorePopups(ctx: CanvasRenderingContext2D) {
    for (const s of scorePopups) {
      ctx.globalAlpha = s.life
      const size = s.combo > 1 ? 26 + s.combo * 3 : 22
      ctx.font = `bold ${Math.min(size, 48)}px "Avenir Next", sans-serif`
      ctx.textAlign = 'center'
      const color = s.combo >= 3 ? '#ffd700' : s.combo >= 2 ? '#00d4ff' : '#ffffff'
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 15
      let text = `+${s.value}`
      if (s.combo >= 3) {
        text += ` x${s.combo}`
      }
      ctx.fillText(text, s.x, s.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  },

  clear() {
    particles.length = 0
    comboRings.length = 0
    floatingTexts.length = 0
    scorePopups.length = 0
  },
}
