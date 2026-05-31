<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { STAMINA_MAX, STAMINA_RECOVERY_SEC, STAMINA_REFILL_COST } from '../types'
import { canPlay, refillStamina, savePlayerData } from '../economy'
import type { PlayerData, ThemeConfig } from '../types'

const props = defineProps<{
  theme: ThemeConfig
  playerData: PlayerData
  collected: number
}>()

const emit = defineEmits<{
  close: []
  start: [difficulty: 'easy' | 'hard']
}>()

const showStaminaDialog = ref(false)
const staminaDialogMode = ref<'easy' | 'hard'>('easy')
const staminaDialogCost = computed(() => (staminaDialogMode.value === 'easy' ? 1 : 2))

const canPlayEasy = computed(() => canPlay(props.playerData.economy, 1))
const canPlayHard = computed(() => canPlay(props.playerData.economy, 2))

function handleStart(difficulty: 'easy' | 'hard') {
  const cost = difficulty === 'easy' ? 1 : 2
  if (!canPlay(props.playerData.economy, cost)) {
    staminaDialogMode.value = difficulty
    showStaminaDialog.value = true
    return
  }
  emit('start', difficulty)
}

async function handleRefill() {
  const result = refillStamina(props.playerData.economy)
  if (result) {
    props.playerData.economy = result
    await savePlayerData(props.playerData)
    showStaminaDialog.value = false
    const cost = staminaDialogMode.value === 'easy' ? 1 : 2
    if (canPlay(props.playerData.economy, cost)) {
      emit('start', staminaDialogMode.value)
    }
  }
}

const canRefill = computed(() => props.playerData.economy.tickets >= STAMINA_REFILL_COST)

const recoveryCountdown = ref('--:--')

function calcCountdown() {
  const { stamina, staminaTimestamp } = props.playerData.economy
  if (stamina >= STAMINA_MAX) {
    recoveryCountdown.value = '已满'
    return
  }
  const elapsed = Math.floor((Date.now() - staminaTimestamp) / 1000)
  const remaining = STAMINA_RECOVERY_SEC - (elapsed % STAMINA_RECOVERY_SEC)
  const m = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0')
  const s = (remaining % 60).toString().padStart(2, '0')
  recoveryCountdown.value = `${m}:${s}`
}

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  calcCountdown()
  timer = setInterval(calcCountdown, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <Transition name="fade">
    <div v-if="true" class="tuning-overlay" @click.self="emit('close')">
      <div class="tuning-panel star-modal">
        <button class="star-modal-close" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div class="tuning-intro">
          <div class="tuning-kicker">
            <span class="tuning-kicker-mark" />
            Parallel Plane Tuning
          </div>
          <h2 class="tuning-title">位面调律</h2>
        </div>

        <div class="tuning-modes">
          <button
            class="tuning-mode-btn tuning-mode-easy star-tech-item active"
            :class="{ insufficient: !canPlayEasy }"
            @pointerup.prevent="handleStart('easy')"
          >
            <div class="tuning-mode-inner">
              <div>
                <div class="mode-label">稳定调律</div>
                <div class="mode-desc">不限时，稳定收益</div>
              </div>
              <span class="mode-cost"><span class="energy-icon">⚡</span> 1</span>
            </div>
          </button>
          <button
            class="tuning-mode-btn tuning-mode-hard star-tech-item"
            :class="{ insufficient: !canPlayHard }"
            @pointerup.prevent="handleStart('hard')"
          >
            <div class="tuning-mode-inner">
              <div>
                <div class="mode-label">紊乱调律</div>
                <div class="mode-desc">限时 5:00，可获取更高收益</div>
              </div>
              <span class="mode-cost"><span class="energy-icon">⚡</span> 2</span>
            </div>
          </button>
        </div>

        <div class="tuning-state">
          <div class="tuning-state-head">
            <span>位面状态</span>
            <strong>稳定度 {{ collected }} / 18</strong>
          </div>
          <div class="tuning-state-track">
            <div class="tuning-state-fill" :style="{ width: (collected / 18) * 100 + '%' }" />
          </div>
          <div class="tuning-metrics">
            <div class="tuning-metric">
              <span>当前能量</span>
              <strong>{{ playerData.economy.stamina }} / {{ STAMINA_MAX }}</strong>
            </div>
            <div class="tuning-metric">
              <span>剩余星券</span>
              <strong>{{ playerData.economy.tickets }}</strong>
            </div>
            <div class="tuning-metric">
              <span>恢复倒计时</span>
              <strong>{{ recoveryCountdown }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <div v-if="showStaminaDialog" class="tuning-dialog-mask" @click.self="showStaminaDialog = false">
    <div class="tuning-dialog star-modal">
      <div class="dialog-content">
        <h3 class="dialog-title">星核能量不足</h3>
        <p class="dialog-msg">
          当前星核能量 {{ playerData.economy.stamina }}，需要
          <strong>⚡ {{ staminaDialogCost }}</strong>
        </p>
        <div class="dialog-actions">
          <button class="dialog-btn star-secondary-btn" @click="showStaminaDialog = false">
            <span class="tuning-btn-inner">取消</span>
          </button>
          <button class="dialog-btn star-primary-btn" :disabled="!canRefill" @click="handleRefill">
            <span class="tuning-btn-inner">星券充能 (🎫 {{ STAMINA_REFILL_COST }})</span>
          </button>
        </div>
        <p v-if="!canRefill" class="dialog-hint">星券不足，无法充能</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tuning-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.tuning-panel {
  width: min(620px, calc(100cqw - 8px));
  max-height: min(720px, 92cqh);
  padding: clamp(22px, 3cqh, 30px) clamp(24px, 4.5cqw, 32px) clamp(48px, 7cqh, 60px);
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.5cqh, 14px);
  overflow-y: auto;
}

.tuning-intro {
  padding-right: 58px;
  text-align: left;
}

.tuning-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: rgba(182, 220, 255, 0.78);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.tuning-kicker-mark {
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  background: linear-gradient(180deg, #a6e8ff, #66b7ff);
  box-shadow: 0 0 10px rgba(102, 183, 255, 0.34);
}

.tuning-title {
  margin: 0 0 8px;
  color: #f1f7ff;
  font-size: clamp(34px, 8cqw, 44px);
  font-weight: 900;
  text-shadow: 0 0 16px rgba(90, 168, 255, 0.2);
}

.tuning-modes {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2cqh, 14px);
  width: 100%;
}

.tuning-mode-btn {
  min-height: clamp(64px, 11cqh, 72px);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.tuning-mode-btn:active {
  transform: scale(0.97);
}

.tuning-mode-btn.insufficient {
  opacity: 0.55;
}

.tuning-mode-inner {
  position: relative;
  z-index: 1;
  min-height: clamp(64px, 11cqh, 72px);
  padding: 0 clamp(22px, 5cqw, 28px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.star-modal-close {
  top: 22px;
  right: 22px;
}

.tuning-btn-inner {
  position: relative;
  z-index: 1;
  min-height: 56px;
  display: grid;
  place-items: center;
}

.mode-label {
  color: #eef5ff;
  font-size: clamp(24px, 5cqw, 30px);
  font-weight: 900;
  line-height: 1.1;
}

.mode-cost {
  color: #eef5ff;
  font-size: clamp(18px, 4cqw, 24px);
  font-weight: 900;
  white-space: nowrap;
}

.mode-desc {
  margin-top: 6px;
  color: rgba(171, 196, 236, 0.72);
  font-size: 14px;
}

.tuning-state {
  padding: 18px 0;
}

.tuning-state-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  color: #eef5ff;
  font-size: 17px;
  font-weight: 800;
}

.tuning-state-head strong {
  color: #84d7ff;
  font-size: 15px;
}

.tuning-state-track {
  height: 8px;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%, 0 8px);
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-bottom: 14px;
}

.tuning-state-fill {
  width: 42%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(145, 235, 255, 0.96),
    rgba(88, 171, 255, 0.9),
    rgba(73, 112, 220, 0.86)
  );
  box-shadow: 0 0 14px rgba(120, 208, 255, 0.24);
}

.tuning-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.tuning-metric {
  min-width: 0;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
}

.tuning-metric span {
  display: block;
  margin-bottom: 6px;
  color: rgba(167, 194, 232, 0.68);
  font-size: 12px;
  white-space: nowrap;
}

.tuning-metric strong {
  color: #eef6ff;
  font-size: 20px;
  font-weight: 900;
  white-space: nowrap;
}

.energy-icon {
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.5));
}

.tuning-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 22, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
}

.tuning-dialog {
  width: min(320px, 82cqw);
  padding: 0;
}

.dialog-content {
  position: relative;
  z-index: 1;
  padding: clamp(20px, 4cqh, 28px);
  text-align: center;
}

.dialog-title {
  margin: 0 0 12px;
  font-size: clamp(16px, 3.5cqw, 20px);
  font-weight: 900;
  color: #ff8a80;
  text-shadow: 0 0 12px rgba(239, 83, 80, 0.2);
}

.dialog-msg {
  margin: 0 0 18px;
  font-size: clamp(13px, 2.5cqw, 15px);
  color: rgba(180, 210, 255, 0.65);
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  gap: clamp(8px, 1.5cqw, 12px);
  justify-content: center;
}

.dialog-btn {
  min-height: 52px;
  padding: 0 18px;
  font-size: clamp(13px, 2.5cqw, 14px);
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.dialog-btn .tuning-btn-inner {
  min-height: 52px;
}

.dialog-hint {
  margin: 8px 0 0;
  font-size: clamp(11px, 2cqw, 12px);
  color: rgba(239, 83, 80, 0.55);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
  .tuning-mode-btn,
  .dialog-btn {
    transition: none;
  }
}
</style>
