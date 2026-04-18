<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { Difficulty, Theme } from './types'
import { settingsStore } from './settingsStore'

const difficulty = ref<Difficulty>('medium')
const theme = ref<Theme>('default')
const loading = ref(true)

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

const themeOptions: { value: Theme; label: string; desc: string }[] = [
  { value: 'default', label: '经典 2048', desc: '温暖橙色系配色' },
  { value: 'energy', label: '能量进化', desc: '科技感能量主题' },
  { value: 'deity', label: '神祇进阶', desc: '中世纪角色进化图标主题' },
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
  <div v-if="!loading" class="settings-page">
    <section class="settings-section">
      <h2 class="section-title">难度设置</h2>
      <div class="option-group">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value"
          class="option-card"
          :class="{ active: difficulty === opt.value }"
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
          @click="updateTheme(opt.value)"
        >
          <div class="theme-preview" :class="opt.value"></div>
          <span class="option-label">{{ opt.label }}</span>
          <span class="option-desc">{{ opt.desc }}</span>
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
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  background: var(--ios-background);
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ios-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 4px;
}

.option-group {
  background: var(--ios-surface);
  border-radius: var(--ios-radius-lg);
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
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: background 150ms var(--ios-ease);
}

.option-card:last-child {
  border-bottom: none;
}

.option-card:active {
  background: rgba(0, 0, 0, 0.03);
}

.option-card.active {
  background: rgba(124, 58, 237, 0.05);
}

.option-label {
  font-size: 17px;
  font-weight: 500;
  color: var(--ios-text-primary);
}

.option-desc {
  font-size: 13px;
  color: var(--ios-text-secondary);
  margin-top: 2px;
}

.check-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ios-primary);
}

.theme-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 12px;
}

.theme-card .option-label,
.theme-card .option-desc {
  grid-column: 2;
}

.theme-card .check-icon {
  grid-column: 3;
  position: static;
  transform: none;
}

.theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  grid-row: span 2;
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
</style>
