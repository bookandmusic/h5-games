<script setup lang="ts">
import { settingsStore } from '../settingsStore'
import { getTheme } from '../themes'
import type { GameTheme, Theme } from '../types'

defineEmits<{
  close: []
}>()

const ICON_TILE_VALUES = [2, 4, 8]

const preloadedIconSources = new Set<string>()

const preloadThemeIcons = (themeToLoad: GameTheme) => {
  if (!themeToLoad.useIcons || !themeToLoad.iconMap || typeof window === 'undefined') return

  Object.values(themeToLoad.iconMap).forEach((src) => {
    if (preloadedIconSources.has(src)) return
    preloadedIconSources.add(src)

    const image = new window.Image()
    image.decoding = 'async'
    image.loading = 'eager'
    image.src = src
  })
}

const getTileSrc = (themeValue: Theme, tileValue: number): string | undefined => {
  const theme = getTheme(themeValue)
  if (!theme.useIcons || !theme.iconMap) return undefined
  return theme.iconMap[tileValue]
}

const selectTheme = (t: Theme) => {
  settingsStore.setTheme(t)
  preloadThemeIcons(getTheme(t))
}

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'default', label: '经典 2048' },
  { value: 'energy', label: '机械纪元' },
  { value: 'deity', label: '神祇进阶' },
  { value: 'undead', label: '亡灵天灾' },
]
</script>

<template>
  <div
    class="theme-dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="选择主题"
    @click.self="$emit('close')"
  >
    <div class="theme-dialog-card">
      <button class="theme-dialog-close" aria-label="关闭主题菜单" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <h2 class="theme-dialog-title">选择主题</h2>
      <div class="theme-grid">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          class="theme-option"
          :class="{ active: settingsStore.theme === opt.value }"
          :aria-pressed="settingsStore.theme === opt.value"
          @click="selectTheme(opt.value)"
        >
          <div class="theme-option-preview" :class="opt.value">
            <template v-for="v in ICON_TILE_VALUES" :key="v">
              <img
                v-if="getTileSrc(opt.value, v)"
                :src="getTileSrc(opt.value, v)!"
                :alt="String(v)"
                class="theme-option-tile-img"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
              <span v-else class="theme-option-tile" :class="opt.value">
                {{ v }}
              </span>
            </template>
          </div>
          <span class="theme-option-label">{{ opt.label }}</span>
          <span v-if="settingsStore.theme === opt.value" class="theme-check">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 190;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(28, 23, 18, 0.62);
  backdrop-filter: blur(2px);
}

.theme-dialog-card {
  position: relative;
  width: min(84vw, 390px);
  padding: 56px 24px 30px;
  border-radius: 14px;
  background: #fff7ed;
  border: 1px solid rgba(122, 78, 42, 0.1);
  text-align: center;
  box-shadow:
    0 6px 0 rgba(62, 45, 33, 0.24),
    0 24px 50px rgba(31, 24, 18, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.theme-dialog-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 38px;
  min-height: 38px;
  border: 0;
  background: transparent;
  color: #9f4f36;
  cursor: pointer;
}

.theme-dialog-close svg {
  width: 34px;
  height: 34px;
}

.theme-dialog-title {
  margin: 0 0 20px;
  color: #9f4f36;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.35;
}

.theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px;
  border: 1px solid rgba(188, 116, 58, 0.16);
  border-radius: 10px;
  background: rgba(255, 246, 231, 0.82);
  cursor: pointer;
  text-align: center;
  position: relative;
  box-shadow:
    0 4px 0 rgba(139, 91, 56, 0.14),
    0 8px 16px rgba(126, 81, 44, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.38);
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
}

.theme-option:active {
  transform: translateY(2px) scale(0.98);
  box-shadow:
    0 2px 0 rgba(139, 91, 56, 0.12),
    0 5px 10px rgba(126, 81, 44, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.theme-option.active {
  background: rgba(255, 248, 239, 0.94);
  outline: 3px solid rgba(255, 255, 255, 0.86);
  border-color: rgba(208, 111, 76, 0.5);
}

.theme-option-preview {
  width: 100%;
  aspect-ratio: 3 / 1;
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 3px 0 rgba(139, 91, 56, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.theme-option-preview.default {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #dc2626 100%);
}

.theme-option-preview.energy {
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%);
}

.theme-option-preview.deity {
  background: linear-gradient(135deg, #f5e6b8 0%, #d4a84f 38%, #5c3b1e 100%);
}

.theme-option-preview.undead {
  background: linear-gradient(135deg, #475569 0%, #1e293b 50%, #0f0a0a 100%);
}

.theme-option-tile {
  flex: 1;
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  border-radius: 5px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(8px, 4cqi, 14px);
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}

.theme-option-tile.default {
  background: rgba(255, 248, 235, 0.78);
  color: #7c5220;
}

.theme-option-tile-img {
  flex: 1;
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 5px;
}

.theme-option-label {
  font-size: 14px;
  font-weight: 600;
  color: #7c5220;
  line-height: 1;
}

.theme-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #e59c56 0%, #db9047 100%);
  color: #fff;
  box-shadow:
    0 2px 0 rgba(139, 91, 56, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.theme-check svg {
  width: 14px;
  height: 14px;
}
</style>
