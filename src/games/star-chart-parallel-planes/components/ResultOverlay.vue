<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { formatTime } from '../gameLogic'

const props = defineProps<{
  visible: boolean
  moves: number
  time: number
  score: number
  stars: 0 | 1 | 2 | 3
  ticketReward: number
  isHard: boolean
  timedOut: boolean
  matchedPairs: number
  totalPairs: number
}>()

const emit = defineEmits<{
  restart: []
  home: []
  continue: []
}>()

const formattedTime = computed(() => formatTime(props.time))
const showStar1 = ref(false)
const showStar2 = ref(false)
const showStar3 = ref(false)
const showStats = ref(false)
const showActions = ref(false)
let animationTimeouts: number[] = []

function clearTimeouts() {
  animationTimeouts.forEach((id) => window.clearTimeout(id))
  animationTimeouts = []
}

function resetAnimation() {
  showStar1.value = false
  showStar2.value = false
  showStar3.value = false
  showStats.value = false
  showActions.value = false
}

function scheduleAnimation() {
  resetAnimation()
  if (props.isHard && !props.timedOut && props.stars > 0) {
    const delays = [200, 500, 800]
    const setters = [showStar1, showStar2, showStar3]
    for (let i = 0; i < 3; i++) {
      const tid = window.setTimeout(() => {
        setters[i].value = true
      }, delays[i])
      animationTimeouts.push(tid)
    }
  }
  animationTimeouts.push(
    window.setTimeout(
      () => {
        showStats.value = true
      },
      props.isHard && !props.timedOut && props.stars > 0 ? 1100 : 200
    )
  )
  animationTimeouts.push(
    window.setTimeout(
      () => {
        showActions.value = true
      },
      props.isHard && !props.timedOut && props.stars > 0 ? 1400 : 500
    )
  )
}

watch(
  () => props.visible,
  (v) => {
    clearTimeouts()
    if (!v) {
      resetAnimation()
      return
    }
    scheduleAnimation()
  },
  { immediate: true }
)

onBeforeUnmount(() => clearTimeouts())
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="overlay" role="dialog" aria-modal="true">
      <div class="result-card star-modal" :class="{ timedout: timedOut }">
        <h3 class="result-title">
          {{ timedOut ? '位面调律失败' : '调律报告' }}
        </h3>

        <template v-if="!timedOut">
          <div v-if="isHard && stars > 0" class="stars-row">
            <span v-for="i in 3" :key="i" class="star" :class="{ lit: showStar1 && i <= stars }">
              <svg viewBox="0 0 48 48" fill="currentColor">
                <polygon
                  points="24 4 29.3 17.2 44 18.8 33 29.4 35.6 44 24 37.2 12.4 44 15 29.4 4 18.8 18.7 17.2"
                />
              </svg>
            </span>
          </div>

          <div v-if="!isHard" class="easy-message">
            <svg
              class="easy-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>星魂胶囊就绪</span>
          </div>
        </template>

        <Transition name="fade-up">
          <div v-if="showStats" class="stats-section">
            <div v-if="timedOut" class="stat">
              <svg
                class="stat-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              <span class="stat-value">{{ matchedPairs }}/{{ totalPairs }}</span>
              <span class="stat-label">已配对</span>
            </div>
            <div v-if="timedOut" class="stat-divider" />
            <div class="stat">
              <span class="stat-value">{{ formattedTime }}</span>
              <span class="stat-label">用时</span>
            </div>
            <div class="stat-divider" />
            <div class="stat">
              <span class="stat-value">{{ moves }}</span>
              <span class="stat-label">翻牌</span>
            </div>
            <div class="stat-divider" />
            <div class="stat">
              <span class="stat-value score-value">{{ score.toLocaleString() }}</span>
              <span class="stat-label">得分</span>
            </div>
          </div>
        </Transition>

        <Transition name="fade-up">
          <div v-if="showStats && !timedOut && isHard && ticketReward > 0" class="reward-badge">
            <svg
              class="reward-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span class="reward-text">+{{ ticketReward }} 星券</span>
          </div>
        </Transition>

        <Transition name="fade-up">
          <div v-if="showActions" class="actions">
            <button
              v-if="!timedOut && (stars > 0 || !isHard)"
              class="star-primary-btn"
              @click="emit('continue')"
            >
              <span>抽取盲盒</span>
            </button>
            <button class="star-secondary-btn" @click="emit('restart')">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                width="16"
                height="16"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>{{ timedOut ? '重新调律' : '再来一局' }}</span>
            </button>
            <button class="star-secondary-btn" @click="emit('home')">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                width="16"
                height="16"
              >
                <path
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"
                />
              </svg>
              <span>返回星图</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.result-card {
  width: 100%;
  max-width: min(360px, 85cqw);
  background: linear-gradient(180deg, #0d1b2a, #0a102e);
  border: 1.5px solid rgba(100, 180, 255, 0.12);
  border-radius: 24px;
  padding: clamp(24px, 5cqh, 36px) clamp(16px, 4cqw, 28px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  text-align: center;
}
.result-card.timedout {
  border-color: rgba(255, 80, 80, 0.3);
  box-shadow: 0 16px 48px rgba(255, 30, 30, 0.15);
}
.result-title {
  font-size: clamp(22px, 5cqw, 28px);
  font-weight: 900;
  color: #e0e8f0;
  margin: 0 0 clamp(16px, 3cqh, 24px);
  letter-spacing: 0.05em;
}
.timedout .result-title {
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 80, 80, 0.4);
}
.easy-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: clamp(12px, 2.5cqh, 16px);
  padding: clamp(10px, 2cqh, 14px);
  background: rgba(100, 180, 255, 0.08);
  color: #4fc3f7;
  font-size: clamp(15px, 3.5cqw, 18px);
  font-weight: 700;
}
.easy-icon {
  width: clamp(20px, 4cqw, 24px);
  height: clamp(20px, 4cqw, 24px);
}
.stars-row {
  display: flex;
  justify-content: center;
  gap: clamp(4px, 1.5cqw, 10px);
  margin-bottom: clamp(16px, 3cqh, 24px);
}
.star {
  width: clamp(40px, 10cqw, 56px);
  height: clamp(40px, 10cqw, 56px);
  opacity: 0.1;
  transform: scale(0.5);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: rgba(255, 255, 255, 0.15);
}
.star.lit {
  opacity: 1;
  transform: scale(1);
  color: #ffd700;
  filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.5));
}
.star svg {
  width: 100%;
  height: 100%;
}
.stats-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(10px, 2.5cqw, 16px);
  margin-bottom: clamp(12px, 2.5cqh, 16px);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-icon {
  width: clamp(16px, 3.5cqw, 20px);
  height: clamp(16px, 3.5cqw, 20px);
  color: #4fc3f7;
  margin-bottom: 2px;
}
.stat-value {
  font-size: clamp(20px, 5cqw, 26px);
  font-weight: 900;
  color: #e0e8f0;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.score-value {
  color: #4fc3f7;
}
.stat-label {
  font-size: clamp(11px, 2.4cqw, 12px);
  color: rgba(180, 210, 255, 0.7);
  font-weight: 600;
}
.stat-divider {
  width: 1px;
  height: clamp(20px, 4cqh, 28px);
  background: rgba(100, 180, 255, 0.12);
}
.reward-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: clamp(8px, 1.5cqh, 12px);
  margin-bottom: clamp(10px, 2cqh, 14px);
  background: rgba(255, 215, 0, 0.1);
}
.reward-icon-svg {
  width: clamp(18px, 4cqw, 24px);
  height: clamp(18px, 4cqw, 24px);
  color: #ffd700;
}
.reward-text {
  font-size: clamp(16px, 3.5cqw, 20px);
  font-weight: 800;
  color: #ffd700;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5cqh, 10px);
  margin-top: clamp(4px, 1cqh, 8px);
}
.actions .star-primary-btn,
.actions .star-secondary-btn {
  width: 100%;
  min-height: clamp(48px, 8cqh, 54px);
  font-size: clamp(14px, 3.5cqw, 16px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-up-enter-active {
  transition: all 0.35s ease-out;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
@media (prefers-reduced-motion: reduce) {
  .star {
    transition: none;
  }
  .fade-enter-active,
  .fade-leave-active,
  .fade-up-enter-active {
    transition: none;
  }
}
</style>
