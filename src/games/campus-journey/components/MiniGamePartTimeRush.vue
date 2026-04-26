<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { RewardSet } from '../types'

const props = defineProps<{ open: boolean; backgroundSrc?: string }>()
const emit = defineEmits<{ close: []; complete: [{ score: number; rewards: RewardSet }] }>()

const DURATION = 30
const GRID_SIZE = 9
const timeLeft = ref(DURATION)
const score = ref(0)
const moles = ref<boolean[]>(Array(GRID_SIZE).fill(false))
const isReal = ref<boolean[]>(Array(GRID_SIZE).fill(true))
const moleTimers: number[] = []
let timer: number | null = null

const POINTS_REAL = 5
const POINTS_FAKE = -3

const clearMoles = () => {
  moles.value = Array(GRID_SIZE).fill(false)
  moleTimers.forEach((t) => clearTimeout(t))
  moleTimers.length = 0
}

const spawnMole = () => {
  const idx = Math.floor(Math.random() * GRID_SIZE)
  const real = Math.random() > 0.2
  moles.value[idx] = true
  isReal.value[idx] = real

  const t = window.setTimeout(() => {
    moles.value[idx] = false
  }, 1200)
  moleTimers.push(t)
}

const whack = (idx: number) => {
  if (!moles.value[idx]) return
  moles.value[idx] = false
  if (isReal.value[idx]) {
    score.value += POINTS_REAL
  } else {
    score.value += POINTS_FAKE
  }
}

const start = () => {
  timeLeft.value = DURATION
  score.value = 0
  clearMoles()

  let spawnCount = 1
  let spawnInterval = window.setInterval(() => {
    if (spawnCount <= 3) {
      for (let i = 0; i < spawnCount; i++) spawnMole()
      spawnCount++
    } else {
      for (let i = 0; i < 3; i++) spawnMole()
    }
  }, 800)
  moleTimers.push(spawnInterval as unknown as number)

  timer = window.setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      finish()
    }
  }, 1000)
}

const finish = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  clearMoles()
  const finalScore = Math.max(0, score.value)
  emit('complete', {
    score: finalScore,
    rewards: { exp: finalScore * 2, money: Math.max(15, finalScore * 5) },
  })
}

watch(
  () => props.open,
  (open) => {
    if (open) start()
    else finish()
  },
  { immediate: true }
)

onBeforeUnmount(finish)
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="shell">
      <div class="panel">
        <div class="arena" :style="{ backgroundImage: `url(${backgroundSrc})` }">
          <div class="hud">
            <span class="hud-timer">剩余 {{ timeLeft }}s</span>
            <span class="hud-score">得分 {{ score }}</span>
          </div>

          <div class="mole-grid">
            <button
              v-for="i in GRID_SIZE"
              :key="i"
              class="mole-cell"
              :class="{ active: moles[i - 1], fake: moles[i - 1] && !isReal[i - 1] }"
              @click="whack(i - 1)"
            >
              <span v-if="moles[i - 1]" class="mole-icon">{{ isReal[i - 1] ? '📦' : '⚠️' }}</span>
            </button>
          </div>
        </div>

        <div class="foot">
          <button class="close-btn" @click="finish()">退出</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.shell {
  position: fixed;
  inset: 0;
  z-index: 26;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 16px;
}
.panel {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(253, 237, 243, 0.94));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
}
.arena {
  position: relative;
  height: min(56dvh, 360px);
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  padding: 12px;
}
.hud {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.hud-timer,
.hud-score {
  background: rgba(255, 255, 255, 0.85);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #8b4b67;
}
.mole-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
}
.mole-cell {
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(247, 191, 211, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  cursor: pointer;
  transition: all 0.15s;
}
.mole-cell.active {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(244, 143, 177, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(244, 143, 177, 0.3);
}
.mole-cell.fake.active {
  border-color: rgba(220, 53, 69, 0.6);
  background: rgba(248, 215, 218, 0.9);
}
.mole-cell:active {
  transform: scale(0.95);
}
.foot {
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  background: linear-gradient(180deg, rgba(253, 237, 243, 0.5), rgba(255, 255, 255, 0.8));
}
.close-btn {
  background: rgba(247, 191, 211, 0.5);
  border: 1px solid rgba(247, 191, 211, 0.8);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  color: #8b4b67;
  cursor: pointer;
}
</style>
