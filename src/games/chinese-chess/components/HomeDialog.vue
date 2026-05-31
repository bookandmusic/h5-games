<script setup lang="ts">
import { ref } from 'vue'
import DialogShell from './DialogShell.vue'
import DialogBtn from './DialogBtn.vue'
import type { Difficulty, GameMode, PieceColor } from '../types'

const props = defineProps<{
  mode: GameMode
}>()

const emit = defineEmits<{
  start: [config: { difficulty: Difficulty; side: PieceColor }]
  close: []
}>()

const difficultyOptions: Array<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: '初出茅庐' },
  { value: 'medium', label: '登堂入室' },
  { value: 'hard', label: '出神入化' },
  { value: 'hardest', label: '天人合一' },
]

const selectedDifficulty = ref<Difficulty>('easy')
const selectedSide = ref<PieceColor>('red')

const handleStart = () => {
  emit('start', { difficulty: selectedDifficulty.value, side: selectedSide.value })
}
</script>

<template>
  <DialogShell
    :title="props.mode === 'ai' ? '单人对局' : '双人对局'"
    width="min(100%, 360px)"
    body-class="no-gap"
    @close="$emit('close')"
  >
    <template v-if="props.mode === 'ai'">
      <div class="section-title">AI 难度</div>
      <div class="option-list">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value"
          class="option-btn"
          :class="{ selected: selectedDifficulty === opt.value }"
          @click="selectedDifficulty = opt.value"
        >
          <span class="radio-circle" :class="{ checked: selectedDifficulty === opt.value }">
            <span v-if="selectedDifficulty === opt.value" class="radio-dot" />
          </span>
          <span class="option-label">{{ opt.label }}</span>
        </button>
      </div>
    </template>

    <div class="section-title">先手设置</div>
    <div class="option-list">
      <button
        class="option-btn"
        :class="{ selected: selectedSide === 'red' }"
        @click="selectedSide = 'red'"
      >
        <span class="radio-circle" :class="{ checked: selectedSide === 'red' }">
          <span v-if="selectedSide === 'red'" class="radio-dot" />
        </span>
        <span class="option-label">红方</span>
      </button>
      <button
        class="option-btn"
        :class="{ selected: selectedSide === 'black' }"
        @click="selectedSide = 'black'"
      >
        <span class="radio-circle" :class="{ checked: selectedSide === 'black' }">
          <span v-if="selectedSide === 'black'" class="radio-dot" />
        </span>
        <span class="option-label">黑方</span>
      </button>
    </div>

    <DialogBtn @click="handleStart">开始</DialogBtn>
  </DialogShell>
</template>

<style scoped>
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #8c603a;
  text-align: center;
  padding: 2px 0;
  position: relative;
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.section-title::before,
.section-title::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 28%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(140, 96, 58, 0.2));
}

.section-title::before {
  left: 0;
}

.section-title::after {
  right: 0;
  background: linear-gradient(90deg, rgba(140, 96, 58, 0.2), transparent);
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 14px;
  border-radius: 14px;
  background: rgba(236, 224, 206, 0.55);
  width: 100%;
  box-sizing: border-box;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;
}

.option-btn.selected {
  background: rgba(255, 248, 236, 0.54);
  border-color: rgba(176, 136, 90, 0.2);
}

.radio-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid rgba(176, 136, 90, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 150ms ease;
}

.radio-circle.checked {
  border-color: #b0885a;
  background: #b0885a;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
}

.option-label {
  font-size: 15px;
  font-weight: 600;
  color: #7a4a2a;
}
</style>
