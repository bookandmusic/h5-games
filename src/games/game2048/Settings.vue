<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { Difficulty, Theme } from './types'
import { settingsStore } from './settingsStore'

const difficulty = ref<Difficulty>('medium')
const theme = ref<Theme>('default')
const loading = ref(true)
const settingsThemeClass = computed(() => `settings-theme-${theme.value}`)

onMounted(async () => {
  await settingsStore.load()
  difficulty.value = settingsStore.difficulty
  theme.value = settingsStore.theme
  loading.value = false
})

const difficultyOptions: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: '简单', desc: '主要出现数字 2' },
  { value: 'medium', label: '中等', desc: '标准难度' },
  { value: 'hard', label: '困难', desc: '更多大数字' },
]

const themeOptions: {
  value: Theme
  label: string
  desc: string
  accent: string
  tiles: string[]
  tag: string
}[] = [
  {
    value: 'default',
    label: '经典 2048',
    desc: '温暖橙色系配色',
    accent: '暖调',
    tiles: ['2', '128', '2048'],
    tag: '数字砖块',
  },
  {
    value: 'energy',
    label: '能量进化',
    desc: '科技感能量主题',
    accent: '霓虹',
    tiles: ['Core', 'Flux', 'Nova'],
    tag: '发光科幻',
  },
  {
    value: 'deity',
    label: '神祇进阶',
    desc: '中世纪角色进化图标主题',
    accent: '史诗',
    tiles: ['神使', '骑士', '神祇'],
    tag: '角色图标',
  },
]

const updateDifficulty = async (d: Difficulty) => {
  difficulty.value = d
  await settingsStore.setDifficulty(d)
}

const updateTheme = async (t: Theme) => {
  theme.value = t
  await settingsStore.setTheme(t)
}
</script>

<template>
  <div v-if="!loading" class="settings-page" :class="settingsThemeClass">
    <section class="settings-section">
      <h2 class="section-title">难度设置</h2>
      <div class="option-group">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value"
          class="option-card"
          :class="{ active: difficulty === opt.value }"
          :aria-pressed="difficulty === opt.value"
          :aria-label="`${opt.label}难度，${opt.desc}`"
          @click="updateDifficulty(opt.value)"
        >
          <span class="option-label">{{ opt.label }}</span>
          <span class="option-desc">{{ opt.desc }}</span>
          <span v-if="difficulty === opt.value" class="check-icon">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </button>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="section-title">主题设置</h2>
      <div class="option-group">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          class="option-card theme-card"
          :class="{ active: theme === opt.value }"
          :aria-pressed="theme === opt.value"
          :aria-label="`${opt.label}主题，${opt.desc}，${opt.tag}`"
          @click="updateTheme(opt.value)"
        >
          <div class="theme-preview" :class="opt.value">
            <span v-for="tile in opt.tiles" :key="tile" class="preview-tile" :class="opt.value">
              {{ tile }}
            </span>
          </div>
          <span class="option-label">{{ opt.label }}</span>
          <span class="option-desc">{{ opt.desc }}</span>
          <div class="theme-meta">
            <span class="theme-tag">{{ opt.tag }}</span>
            <span class="theme-accent">{{ opt.accent }}</span>
          </div>
          <span v-if="theme === opt.value" class="check-icon">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  --settings-bg:
    radial-gradient(circle at top left, rgba(249, 168, 37, 0.14), transparent 26%),
    linear-gradient(180deg, #faf4ea 0%, #f1e5d3 100%);
  --settings-section-title: rgba(124, 82, 32, 0.72);
  --settings-surface: rgba(255, 249, 240, 0.72);
  --settings-surface-border: rgba(187, 129, 44, 0.14);
  --settings-card-border: rgba(187, 129, 44, 0.12);
  --settings-card-press: rgba(187, 129, 44, 0.06);
  --settings-card-active: rgba(187, 129, 44, 0.12);
  --settings-label: #7c5220;
  --settings-desc: rgba(120, 84, 41, 0.72);
  --settings-check: #bb812c;
  --settings-tag-bg: rgba(187, 129, 44, 0.14);
  --settings-tag-color: #7c5220;
  --settings-accent-bg: rgba(120, 113, 108, 0.12);
  --settings-accent-color: rgba(120, 84, 41, 0.72);
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  background: var(--settings-bg);
}

.settings-page.settings-theme-energy {
  --settings-bg:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.16), transparent 22%),
    radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 26%),
    linear-gradient(180deg, #090b1b 0%, #120a25 55%, #090f1f 100%);
  --settings-section-title: rgba(103, 232, 249, 0.76);
  --settings-surface: rgba(8, 13, 30, 0.78);
  --settings-surface-border: rgba(34, 211, 238, 0.16);
  --settings-card-border: rgba(34, 211, 238, 0.14);
  --settings-card-press: rgba(34, 211, 238, 0.08);
  --settings-card-active: linear-gradient(
    90deg,
    rgba(34, 211, 238, 0.12),
    rgba(59, 130, 246, 0.12)
  );
  --settings-label: #e0f2fe;
  --settings-desc: rgba(186, 230, 253, 0.72);
  --settings-check: #67e8f9;
  --settings-tag-bg: rgba(34, 211, 238, 0.14);
  --settings-tag-color: #67e8f9;
  --settings-accent-bg: rgba(139, 92, 246, 0.16);
  --settings-accent-color: #ddd6fe;
}

.settings-page.settings-theme-deity {
  --settings-bg:
    radial-gradient(circle at top center, rgba(251, 191, 36, 0.14), transparent 28%),
    linear-gradient(180deg, #1b140c 0%, #24190f 45%, #120c07 100%);
  --settings-section-title: rgba(253, 230, 138, 0.74);
  --settings-surface: rgba(28, 20, 12, 0.82);
  --settings-surface-border: rgba(245, 158, 11, 0.18);
  --settings-card-border: rgba(245, 158, 11, 0.16);
  --settings-card-press: rgba(245, 158, 11, 0.08);
  --settings-card-active: linear-gradient(90deg, rgba(245, 158, 11, 0.14), rgba(120, 53, 15, 0.16));
  --settings-label: #fef3c7;
  --settings-desc: rgba(253, 230, 138, 0.7);
  --settings-check: #fbbf24;
  --settings-tag-bg: rgba(245, 158, 11, 0.16);
  --settings-tag-color: #fde68a;
  --settings-accent-bg: rgba(120, 53, 15, 0.26);
  --settings-accent-color: #fcd34d;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--settings-section-title);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 4px;
}

.option-group {
  background: var(--settings-surface);
  border: 1px solid var(--settings-surface-border);
  border-radius: var(--ios-radius-lg);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  overflow: hidden;
}

.option-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--settings-card-border);
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: background 150ms var(--ios-ease);
}

.option-card:last-child {
  border-bottom: none;
}

.option-card:active {
  background: var(--settings-card-press);
}

.option-card.active {
  background: var(--settings-card-active);
}

.option-label {
  font-size: 17px;
  font-weight: 500;
  color: var(--settings-label);
}

.option-desc {
  font-size: 13px;
  color: var(--settings-desc);
  margin-top: 2px;
}

.check-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--settings-check);
}

.theme-card {
  display: grid;
  grid-template-columns: minmax(88px, 104px) 1fr auto;
  align-items: center;
  gap: 12px;
}

.theme-card .option-label,
.theme-card .option-desc,
.theme-card .theme-meta {
  grid-column: 2;
}

.theme-card .check-icon {
  grid-column: 3;
  position: static;
  transform: none;
}

.theme-preview {
  width: 100%;
  min-height: 72px;
  border-radius: 14px;
  grid-row: span 3;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: stretch;
}

.theme-preview.default {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #dc2626 100%);
}

.theme-preview.energy {
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%);
}

.theme-preview.deity {
  background: linear-gradient(135deg, #f5e6b8 0%, #d4a84f 38%, #5c3b1e 100%);
}

.preview-tile {
  border-radius: 10px;
  min-height: 20px;
  padding: 6px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}

.preview-tile.default {
  background: rgba(255, 248, 235, 0.78);
  color: #7c5220;
}

.preview-tile.energy {
  background: rgba(15, 23, 42, 0.52);
  color: #cffafe;
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.2);
}

.preview-tile.deity {
  background: rgba(28, 25, 23, 0.6);
  color: #fef3c7;
  border: 1px solid rgba(245, 230, 184, 0.22);
}

.theme-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.theme-tag,
.theme-accent {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.theme-tag {
  background: var(--settings-tag-bg);
  color: var(--settings-tag-color);
}

.theme-accent {
  background: var(--settings-accent-bg);
  color: var(--settings-accent-color);
}
</style>
