<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { minigameAssets } from '../assetMap'
import { randomInt } from '../utils/rng'

const props = defineProps<{
  open: boolean
  backgroundSrc: string
}>()

const emit = defineEmits<{
  close: []
  complete: [payload: { score: number; rewards: { money: number } }]
}>()

const tokens = [
  minigameAssets['mg-work-box'],
  minigameAssets['mg-work-cashier'],
  minigameAssets['mg-work-paybag'],
  minigameAssets['mg-work-ticket'],
  minigameAssets['mg-work-tray'],
]

const score = ref(0)
const timeLeft = ref(10)
const activeIndex = ref(0)
let timer: number | null = null

const move = () => {
  activeIndex.value = randomInt(0, tokens.length - 1)
}

const finish = () => {
  if (timer) window.clearInterval(timer)
  timer = null
  emit('complete', { score: score.value, rewards: { money: Math.max(12, score.value * 4) } })
}

const hit = (index: number) => {
  if (index !== activeIndex.value) return
  score.value += 3
  move()
}

const start = () => {
  score.value = 0
  timeLeft.value = 10
  move()
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => {
    timeLeft.value -= 1
    move()
    if (timeLeft.value <= 0) finish()
  }, 1000)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      start()
    } else if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="shell">
      <div class="panel">
        <div class="head">
          <div>
            <p class="eyebrow">Work Rush</p>
            <h3>得分 {{ score }} · 现金奖励 {{ Math.max(12, score * 4) }}</h3>
          </div>
          <button class="ghost" @click="emit('close')">退出</button>
        </div>
        <div class="arena" :style="{ backgroundImage: `url(${backgroundSrc})` }">
          <button
            v-for="(token, index) in tokens"
            :key="token"
            class="lane"
            :class="{ active: index === activeIndex }"
            @click="hit(index)"
          >
            <img :src="token" alt="" />
          </button>
        </div>
        <div class="foot">
          <span>剩余 {{ timeLeft }}s</span>
          <span>快速处理当前高亮订单位。</span>
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
  display: block;
  background: rgba(17, 11, 8, 0.78);
}
.panel {
  width: 100%;
  height: 100dvh;
  overflow: auto;
  padding: 18px;
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(255, 246, 218, 0.82), rgba(232, 169, 91, 0.7)),
    radial-gradient(ellipse at 18% 20%, rgba(255, 241, 190, 0.36), transparent 32%),
    radial-gradient(ellipse at 76% 72%, rgba(128, 68, 24, 0.18), transparent 38%),
    repeating-linear-gradient(
      92deg,
      rgba(96, 51, 20, 0.14) 0,
      rgba(96, 51, 20, 0.14) 2px,
      rgba(255, 228, 170, 0.16) 3px,
      rgba(255, 228, 170, 0.16) 8px,
      rgba(159, 87, 33, 0.12) 10px,
      rgba(159, 87, 33, 0.12) 14px
    ),
    linear-gradient(90deg, #bd762f, #e2a653 18%, #c47b34 42%, #f0bd6c 62%, #a96028);
  border: 4px solid rgba(99, 51, 20, 0.38);
  box-shadow:
    inset 0 3px 0 rgba(255, 255, 255, 0.52),
    inset 0 -8px 0 rgba(128, 66, 24, 0.08);
}
.head,
.foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  color: #a05d2c;
}
.ghost {
  min-height: 40px;
  border-radius: 12px;
  border: 0;
}
.arena {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  height: 360px;
  margin-top: 16px;
  padding: 18px;
  border-radius: 22px;
  background-size: cover;
  background-position: center;
}
.lane {
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.25);
}
.lane.active {
  background: rgba(252, 207, 102, 0.74);
  transform: translateY(-6px);
}
.lane img {
  width: 58px;
  height: 58px;
}
.foot {
  margin-top: 12px;
  color: #6d4326;
  font-size: 13px;
}
@media (max-width: 720px) {
  .panel {
    height: 100dvh;
    padding: 14px;
    padding-top: max(14px, env(safe-area-inset-top));
    padding-bottom: max(14px, env(safe-area-inset-bottom));
  }
  .head,
  .foot {
    flex-direction: column;
    align-items: flex-start;
  }
  .arena {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    height: auto;
    min-height: 240px;
    margin-top: 12px;
    padding: 12px;
  }
  .lane {
    min-height: 88px;
  }
  .lane img {
    width: 50px;
    height: 50px;
  }
}
</style>
