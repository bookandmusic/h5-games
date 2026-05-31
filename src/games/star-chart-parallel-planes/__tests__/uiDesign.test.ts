import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readGameFile(file: string) {
  return readFileSync(resolve(root, file), 'utf8')
}

describe('star-chart UI system', () => {
  const pageFiles = ['Home.vue', 'GalleryMap.vue', 'Universe.vue', 'Shop.vue', 'index.vue'] as const
  const hudPageFiles = ['GalleryMap.vue', 'Universe.vue', 'Shop.vue', 'index.vue'] as const

  it('loads the shared star chart theme on every screen', () => {
    for (const file of pageFiles) {
      expect(readGameFile(file), file).toContain("import './game-theme.css'")
    }
  })

  it('uses the shared mobile HUD classes across screens', () => {
    for (const file of hudPageFiles) {
      const source = readGameFile(file)
      expect(source, file).toMatch(/star-(page|play)/)
      expect(source, file).toContain('star-top-hud')
      expect(source, file).toMatch(
        /star-(top-hud|hit-icon|hud-value|rune-tab|card|primary-btn|modal)/
      )
    }

    expect(readGameFile('Home.vue')).toMatch(/star-page/)
    expect(readGameFile('Home.vue')).not.toContain('star-top-hud')
  })

  it('renders the home page without a top resource hud and with a bottom action dock', () => {
    const source = readGameFile('Home.vue')

    expect(source).not.toContain('top-bar star-top-hud')
    expect(source).not.toContain('resource-dash')
    expect(source).not.toContain('top-actions')
    expect(source).toContain('home-footer')
    expect(source).toContain('dock-actions')
    expect(source).toContain('dock-btn')
    expect(source).toContain('nav.exitGame()')
  })

  it('keeps icon art and numeric HUD values out of framed button boxes', () => {
    for (const file of pageFiles) {
      const source = readGameFile(file)
      expect(source, file).not.toContain('star-icon-btn')
      expect(source, file).not.toContain('star-resource-pill')
    }

    expect(readGameFile('index.vue')).not.toContain('footer-stat star-card')
    expect(readGameFile('components/PlaneTuningPanel.vue')).not.toContain(
      'tuning-mode-btn tuning-mode-easy star-card'
    )
    expect(readGameFile('components/PlaneTuningPanel.vue')).not.toContain(
      'tuning-mode-btn tuning-mode-hard star-card'
    )
  })

  it('defines reusable star chart components with touch-sized transparent icon controls', () => {
    const themeSource = readGameFile('game-theme.css')
    for (const selector of [
      '.star-page',
      '.star-top-hud',
      '.star-hit-icon',
      '.star-hud-value',
      '.star-hud-meter',
      '.star-panel',
      '.star-rune-tab',
      '.star-card',
      '.star-primary-btn',
      '.star-modal',
      '.star-modal-close',
    ]) {
      expect(themeSource).toContain(selector)
    }
    expect(themeSource).toMatch(/min-height:\s*48px/)
    expect(themeSource).toMatch(/min-width:\s*48px/)
  })

  it('uses the approved hard-edge sci-fi modal system', () => {
    const themeSource = readGameFile('game-theme.css')

    for (const selector of [
      '.star-modal::before',
      '.star-modal::after',
      '.star-tech-item',
      '.star-primary-btn::before',
      '.star-secondary-btn::before',
    ]) {
      expect(themeSource).toContain(selector)
    }

    expect(themeSource).toContain('mask-composite')
    expect(themeSource).toContain('color: #0b2348')
    expect(themeSource).not.toContain('top: -18px')
    expect(themeSource).not.toContain('right: -18px')
    expect(readGameFile('components/PlaneTuningPanel.vue')).toContain('star-tech-item')
    expect(readGameFile('Home.vue')).toContain('daily-quest star-tech-item')
  })

  it('keeps the map tuning modal aligned with the approved modal lab layout', () => {
    const source = readGameFile('components/PlaneTuningPanel.vue')

    for (const text of [
      'Parallel Plane Tuning',
      '位面调律',
      '稳定调律',
      '不限时，稳定收益',
      'energy-icon',
      '⚡',
      '紊乱调律',
      '限时 5:00，可获取更高收益',
      '位面状态',
      '稳定度 {{ collected }} / 18',
      '当前能量',
      '{{ playerData.economy.stamina }} / {{ STAMINA_MAX }}',
      '剩余星券',
      '{{ playerData.economy.tickets }}',
      '恢复倒计时',
      '{{ recoveryCountdown }}',
    ]) {
      expect(source).toContain(text)
    }

    // 方案一：模式按钮直接触发进入游戏，不再显示底部确认栏
    expect(source).not.toContain('开始调律')
    expect(source).not.toContain('tuning-actions')

    expect(source).toContain('white-space: nowrap')
    expect(source).toContain('font-size: 12px')
    expect(source).toContain('font-size: 20px')
  })
})
