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
  if (!props.best) return false
  return props.time <= props.best.time && props.moves <= props.best.moves
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
  position: fixed;
  inset: 0;
  background: rgba(26, 54, 44, 0.54);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}

.scroll-modal {
  width: 100%;
  max-width: min(390px, calc(100vw - 40px));
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 22px 48px rgba(18, 50, 43, 0.34),
    0 7px 0 #84512b;
}

.scroll-header {
  background: linear-gradient(180deg, #d67949 0%, #bd613b 100%);
  padding: 18px 20px;
  text-align: center;
  position: relative;
  border: 3px solid #fff8df;
  border-bottom: none;
  border-radius: 20px 20px 0 0;
}

.scroll-title {
  font-size: clamp(26px, 7vw, 34px);
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
  padding: 26px 24px 28px;
  text-align: center;
}

.new-best {
  display: inline-block;
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(135deg, #f57c00, #ef6c00);
  padding: 5px 16px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 30px;
  font-weight: 900;
  color: #8a3f15;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: #9b6b37;
  font-weight: 800;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #d4c4b0;
}

.best-record {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 16px;
  background: #ffe8bc;
  border: 2px solid rgba(156, 107, 55, 0.28);
  border-radius: 14px;
  margin-bottom: 20px;
}

.best-label {
  font-size: 11px;
  color: #9b6b37;
  font-weight: 800;
}

.best-value {
  font-size: 14px;
  color: #8a3f15;
  font-weight: 900;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wood-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 56px;
  padding: 14px 20px;
  border: 3px solid #df9b4c;
  border-radius: 16px;
  font-size: 16px;
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
  width: 18px;
  height: 18px;
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
