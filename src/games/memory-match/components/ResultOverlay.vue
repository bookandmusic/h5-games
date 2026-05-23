<script setup lang="ts">
import { computed } from 'vue'
import type { BestScore } from '../types'
import { formatTime } from '../gameLogic'

const props = defineProps<{
  visible: boolean
  moves: number
  time: number
  best: BestScore | undefined
}>()

const emit = defineEmits<{
  restart: []
  home: []
}>()

const formattedTime = computed(() => formatTime(props.time))
const bestText = computed(() => {
  if (!props.best) return ''
  return `${formatTime(props.best.time)} / ${props.best.moves} 次`
})
const isNewBest = computed(() => {
  if (!props.best) return true
  return (
    props.time < props.best.time ||
    (props.time === props.best.time && props.moves <= props.best.moves)
  )
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="overlay" role="dialog" aria-modal="true">
      <div class="scroll-modal">
        <!-- Title bar -->
        <div class="scroll-header">
          <span class="scroll-title">恭喜完成！</span>
        </div>

        <!-- Scroll body -->
        <div class="scroll-body">
          <div v-if="isNewBest" class="new-best">新纪录！</div>

          <div class="stats">
            <div class="stat">
              <span class="stat-value">{{ formattedTime }}</span>
              <span class="stat-label">用时</span>
            </div>
            <div class="stat-divider" />
            <div class="stat">
              <span class="stat-value">{{ moves }}</span>
              <span class="stat-label">翻牌次数</span>
            </div>
          </div>

          <div v-if="best" class="best-record">
            <span class="best-label">最佳记录</span>
            <span class="best-value">{{ bestText }}</span>
          </div>

          <div class="actions">
            <button class="wood-btn wood-btn-primary" @click="emit('restart')">
              <svg
                class="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              再来一局
            </button>
            <button class="wood-btn wood-btn-secondary" @click="emit('home')">
              <svg
                class="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 54, 44, 0.54);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: clamp(12px, 3cqw, 24px);
}

.scroll-modal {
  width: 100%;
  max-width: min(390px, 90cqw);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 22px 48px rgba(18, 50, 43, 0.34),
    0 7px 0 #84512b;
}

.scroll-header {
  background: linear-gradient(180deg, #d67949 0%, #bd613b 100%);
  padding: clamp(12px, 2.5cqh, 18px) clamp(14px, 3cqw, 20px);
  text-align: center;
  position: relative;
  border: 3px solid #fff8df;
  border-bottom: none;
  border-radius: 20px 20px 0 0;
}

.scroll-title {
  font-size: clamp(22px, 6cqw, 34px);
  font-weight: 900;
  color: #fff;
  text-shadow:
    0 2px 0 rgba(122, 62, 27, 0.62),
    0 4px 0 rgba(98, 52, 22, 0.14);
}

.scroll-body {
  background: #fffef0;
  border: 3px solid #fff8df;
  border-top: none;
  padding: clamp(18px, 4cqh, 26px) clamp(16px, 4cqw, 24px) clamp(20px, 4cqh, 28px);
  text-align: center;
}

.new-best {
  display: inline-block;
  font-size: clamp(11px, 2.5cqw, 13px);
  font-weight: 900;
  color: #fff;
  background: linear-gradient(135deg, #f57c00, #ef6c00);
  padding: clamp(4px, 0.8cqh, 5px) clamp(12px, 3cqw, 16px);
  border-radius: 20px;
  margin-bottom: clamp(12px, 2.5cqh, 16px);
}

.stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(14px, 3cqw, 20px);
  margin-bottom: clamp(12px, 2.5cqh, 16px);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: clamp(24px, 6cqw, 30px);
  font-weight: 900;
  color: #8a3f15;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: clamp(10px, 2.2cqw, 12px);
  color: #9b6b37;
  font-weight: 800;
}

.stat-divider {
  width: 1px;
  height: clamp(24px, 5cqh, 32px);
  background: #d4c4b0;
}

.best-record {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: clamp(8px, 1.5cqh, 10px) clamp(12px, 3cqw, 16px);
  background: #ffe8bc;
  border: 2px solid rgba(156, 107, 55, 0.28);
  border-radius: 14px;
  margin-bottom: clamp(14px, 3cqh, 20px);
}

.best-label {
  font-size: clamp(9px, 2cqw, 11px);
  color: #9b6b37;
  font-weight: 800;
}

.best-value {
  font-size: clamp(12px, 2.8cqw, 14px);
  color: #8a3f15;
  font-weight: 900;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5cqh, 10px);
}

.wood-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5cqw, 8px);
  min-height: clamp(48px, 8cqh, 56px);
  padding: clamp(10px, 2cqh, 14px) clamp(14px, 3cqw, 20px);
  border: 3px solid #df9b4c;
  border-radius: 16px;
  font-size: clamp(14px, 3cqw, 16px);
  font-weight: 900;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  box-shadow:
    0 5px 0 #945425,
    0 9px 12px rgba(36, 58, 42, 0.2),
    inset 0 2px 0 rgba(255, 255, 255, 0.68);
}

.wood-btn:active {
  transform: translateY(3px) scale(0.98);
  box-shadow:
    0 2px 0 #945425,
    0 5px 8px rgba(36, 58, 42, 0.18),
    inset 0 2px 0 rgba(255, 255, 255, 0.55);
}

.btn-icon {
  width: clamp(16px, 3.5cqw, 18px);
  height: clamp(16px, 3.5cqw, 18px);
  flex-shrink: 0;
}

.wood-btn-primary {
  background: linear-gradient(180deg, #ffe9b5 0%, #f2b966 100%);
  color: #8a3f15;
}

.wood-btn-primary:active {
  box-shadow: 0 2px 6px rgba(141, 110, 99, 0.15);
}

.wood-btn-secondary {
  background: linear-gradient(180deg, #fff6db 0%, #f6d79c 100%);
  color: #8a3f15;
}

.wood-btn-secondary:active {
  background: linear-gradient(180deg, #ffe9b5 0%, #efc67e 100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .wood-btn {
    transition: none;
  }
}
</style>
