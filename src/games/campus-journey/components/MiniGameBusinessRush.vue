<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { minigameAssets } from '../assetMap'
import { randomItem, randomInt } from '../utils/rng'

const props = defineProps<{
  open: boolean
  backgroundSrc: string
}>()

const emit = defineEmits<{
  close: []
  complete: [payload: { score: number; rewards: { money: number; reputation: number } }]
}>()

const premium = [minigameAssets['mg-biz-contract'], minigameAssets['mg-biz-coin']]
const normal = [
  minigameAssets['mg-biz-client'],
  minigameAssets['mg-biz-folder'],
  minigameAssets['mg-biz-laptop'],
]

const score = ref(0)
const timeLeft = ref(12)
const targets = ref<
  Array<{ id: number; src: string; premium: boolean; top: number; left: number }>
>([])
let timer: number | null = null
let seq = 0

const spawn = () => {
  targets.value = Array.from({ length: 5 }, (_, index) => {
    const isPremium = index < 2
    return {
      id: seq++,
      src: isPremium ? randomItem(premium) : randomItem(normal),
      premium: isPremium,
      // Keep targets inside safe bounds for mobile tapping.
      top: randomInt(16, 84),
      left: randomInt(16, 84),
    }
  })
}

const finish = () => {
  if (timer) window.clearInterval(timer)
  timer = null
  emit('complete', {
    score: score.value,
    rewards: {
      money: Math.max(20, score.value * 5),
      reputation: Math.max(4, Math.round(score.value / 4)),
    },
  })
}

const hit = (id: number) => {
  const target = targets.value.find((entry) => entry.id === id)
  if (!target) return
  score.value += target.premium ? 5 : 2
  spawn()
}

const start = () => {
  score.value = 0
  timeLeft.value = 12
  spawn()
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => {
    timeLeft.value -= 1
    spawn()
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
            <p class="eyebrow">Business Rush</p>
            <h3>得分 {{ score }} · 额外声望 {{ Math.max(4, Math.round(score / 4)) }}</h3>
          </div>
          <button class="ghost" @click="emit('close')">退出</button>
        </div>
        <div class="arena" :style="{ backgroundImage: `url(${backgroundSrc})` }">
          <button
            v-for="target in targets"
            :key="target.id"
            class="token"
            :class="{ premium: target.premium }"
            :style="{ top: `${target.top}%`, left: `${target.left}%` }"
            @click="hit(target.id)"
          >
            <img :src="target.src" alt="" />
          </button>
        </div>
        <div class="foot">
          <span>剩余 {{ timeLeft }}s</span>
          <span>优先点击合同和金币，高价值目标收益更高。</span>
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
  position: relative;
  height: 420px;
  margin-top: 16px;
  border-radius: 22px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}
.token {
  position: absolute;
  width: 82px;
  height: 82px;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.66);
}
.token.premium {
  background: rgba(255, 217, 103, 0.82);
}
.token img {
  width: 48px;
  height: 48px;
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
    height: min(56dvh, 360px);
    margin-top: 12px;
  }
  .token {
    width: 68px;
    height: 68px;
  }
  .token img {
    width: 42px;
    height: 42px;
  }
}
</style>
