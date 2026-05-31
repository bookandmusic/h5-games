<script setup lang="ts">
import { computed } from 'vue'
import type { GameStatus } from '../types'

const props = defineProps<{
  gameStatus: GameStatus
  score: number
  bestScore: number
  themeName: string
}>()

const emit = defineEmits<{
  restart: []
}>()

const themeLabel: Record<string, string> = {
  default: '经典 2048',
  energy: '机械纪元',
  deity: '神祇进阶',
  undead: '亡灵天灾',
}

const resultTitle = computed(() => (props.gameStatus === 'won' ? '恭喜获胜' : '本局结束'))
const resultDescription = computed(
  () =>
    `${themeLabel[props.themeName] || '经典 2048'}主题 · 得分 ${props.score} · 最高 ${props.bestScore}`
)
</script>

<template>
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="result-modal-title"
    aria-describedby="result-modal-desc"
  >
    <div class="modal-card">
      <div class="modal-icon" :class="{ 'modal-lost': gameStatus === 'lost' }">
        <svg v-if="gameStatus === 'won'" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M16 52h32" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
          <path d="M20 16h24v8c0 10.493-8.507 19-19 19h-5V16z" fill="currentColor" opacity="0.22" />
          <path
            d="M20 16h24v8c0 10.493-8.507 19-19 19h-5V16z"
            stroke="currentColor"
            stroke-width="4"
            stroke-linejoin="round"
          />
          <path
            d="M20 21H12c0 8 4 14 11 14"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />
          <path
            d="M44 21h8c0 8-4 14-11 14"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="4" opacity="0.3" />
          <path
            d="M24 24 40 40M40 24 24 40"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <h3 id="result-modal-title" class="modal-title">{{ resultTitle }}</h3>
      <p id="result-modal-desc" class="modal-score">{{ resultDescription }}</p>
      <button class="modal-btn" @click="emit('restart')">再来一次</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(92, 59, 34, 0.28);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  background: rgba(255, 246, 231, 0.94);
  border: 1px solid rgba(188, 116, 58, 0.18);
  border-radius: 14px;
  padding: 32px 24px;
  width: 280px;
  text-align: center;
  box-shadow:
    0 6px 0 rgba(139, 91, 56, 0.18),
    0 20px 38px rgba(75, 48, 30, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.36);
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 9px;
  background: linear-gradient(180deg, #f3ad4f 0%, #db9047 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #fff;
  box-shadow:
    0 5px 0 rgba(139, 91, 56, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.modal-icon svg {
  width: 36px;
  height: 36px;
}

.modal-lost {
  background: linear-gradient(180deg, #cf795d 0%, #c96d53 100%);
  color: #fff7ed;
}

.modal-title {
  font-size: 22px;
  font-weight: 600;
  color: #7c5220;
  margin: 0 0 8px;
}

.modal-score {
  font-size: 15px;
  color: rgba(120, 84, 41, 0.72);
  margin: 0 0 24px;
}

.modal-btn {
  width: 100%;
  padding: 14px 20px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  border: 1px solid rgba(174, 103, 55, 0.12);
  border-radius: 9px;
  cursor: pointer;
  background: linear-gradient(180deg, #e59c56 0%, #db9047 100%);
  box-shadow:
    0 5px 0 rgba(139, 91, 56, 0.34),
    0 12px 20px rgba(126, 81, 44, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
}

.modal-btn:hover {
  filter: brightness(1.03);
}

.modal-btn:active {
  transform: translateY(3px) scale(0.99);
  box-shadow:
    0 2px 0 rgba(139, 91, 56, 0.34),
    0 7px 12px rgba(126, 81, 44, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
</style>
