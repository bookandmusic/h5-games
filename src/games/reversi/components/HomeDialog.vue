<script setup lang="ts">
import { ref } from 'vue'

import type { Difficulty, DiskColor, GameMode } from '../types'
import DialogShell from './DialogShell.vue'

const props = defineProps<{
  mode: GameMode
}>()

const emit = defineEmits<{
  start: [config: { difficulty: Difficulty; side: DiskColor }]
  close: []
}>()

const difficultyOptions: Array<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: '初识棋道' },
  { value: 'medium', label: '小试牛刀' },
  { value: 'hard', label: '棋逢对手' },
  { value: 'expert', label: '翻转乾坤' },
]

const selectedDifficulty = ref<Difficulty>('easy')
const selectedSide = ref<DiskColor>('black')

const handleStart = () => {
  emit('start', {
    difficulty: selectedDifficulty.value,
    side: selectedSide.value,
  })
}
</script>

<template>
  <DialogShell
    :title="props.mode === 'ai' ? '人机对战' : '双人对战'"
    width="min(100%, 320px)"
    @close="$emit('close')"
  >
    <template v-if="props.mode === 'ai'">
      <div class="section-label">AI 难度</div>
      <div class="chip-list">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value"
          class="chip"
          :class="{ selected: selectedDifficulty === opt.value }"
          @click="selectedDifficulty = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </template>

    <div class="section-label">执子选择</div>
    <div class="side-options">
      <button
        class="side-btn"
        :class="{ selected: selectedSide === 'black' }"
        @click="selectedSide = 'black'"
      >
        <div class="side-disk black" />
        <span class="side-label">黑先</span>
      </button>
      <button
        class="side-btn"
        :class="{ selected: selectedSide === 'white' }"
        @click="selectedSide = 'white'"
      >
        <div class="side-disk white" />
        <span class="side-label">白先</span>
      </button>
    </div>

    <button class="start-btn" @click="handleStart">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
          fill="currentColor"
        />
      </svg>
      <span>开始对战</span>
    </button>
  </DialogShell>
</template>

<style scoped>
.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #8b9a6e;
  text-align: left;
  width: 100%;
  letter-spacing: 0.04em;
}

.chip-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.chip {
  padding: 10px 12px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: #8b9a6e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-out;
  letter-spacing: 0.02em;
}

.chip:hover {
  background: rgba(0, 0, 0, 0.3);
  color: #e8eae3;
}

.chip.selected {
  border-color: #c9a84c;
  background: rgba(201, 168, 76, 0.15);
  color: #c9a84c;
}

.side-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.side-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.side-btn:hover {
  background: rgba(0, 0, 0, 0.3);
}

.side-btn.selected {
  border-color: #c9a84c;
  background: rgba(201, 168, 76, 0.15);
}

.side-disk {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.side-disk.black {
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    inset 0 2px 3px rgba(255, 255, 255, 0.15);
}

.side-disk.white {
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  border: 1px solid #bbb5ad;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.05),
    inset 0 2px 3px rgba(255, 255, 255, 0.8);
}

.side-label {
  font-size: 14px;
  font-weight: 600;
  color: #8b9a6e;
}

.side-btn.selected .side-label {
  color: #c9a84c;
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #c9a84c, #b8922e);
  border: none;
  border-radius: 12px;
  color: #1a3a28;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3);
  letter-spacing: 0.04em;
  margin-top: 4px;
}

.start-btn:hover {
  box-shadow: 0 6px 16px rgba(201, 168, 76, 0.45);
  background: linear-gradient(135deg, #d4b65a, #c4a03a);
}

.start-btn:active {
  transform: scale(0.97);
}

.start-btn svg {
  color: #1a3a28;
}

@media (prefers-reduced-motion: reduce) {
  .start-btn:active {
    transform: none;
  }
}
</style>
