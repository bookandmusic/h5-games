<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { bizAuctionPool } from '../bizAuctions'
import type { RewardSet } from '../types'

const props = defineProps<{ open: boolean; backgroundSrc?: string }>()
const emit = defineEmits<{ close: []; complete: [{ score: number; rewards: RewardSet }] }>()

const DURATION = 90
const STARTING_CAPITAL = 1000
const BID_LEVELS = [0.4, 0.6, 0.85] as const
const BID_LABELS = ['保守出价', '适中控价', '激进竞拍']

const timeLeft = ref(DURATION)
const capital = ref(STARTING_CAPITAL)
const score = ref(0)
const currentAuction = ref(0)
const phase = ref<'bidding' | 'result' | 'ended'>('bidding')
const resultMsg = ref('')
const resultGain = ref(0)
let timer: number | null = null

const auction = computed(() => bizAuctionPool[currentAuction.value])
const capitalPct = computed(() => Math.max(0, Math.min(100, (capital.value / STARTING_CAPITAL) * 100)))

const pickAuction = () => {
  currentAuction.value = Math.floor(Math.random() * bizAuctionPool.length)
}

const start = () => {
  timeLeft.value = DURATION
  capital.value = STARTING_CAPITAL
  score.value = 0
  phase.value = 'bidding'
  pickAuction()
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
  phase.value = 'ended'
  const finalCapital = Math.max(0, capital.value)
  const finalScore = Math.round(finalCapital / 10)
  emit('complete', {
    score: finalScore,
    rewards: { money: Math.max(50, Math.round(finalCapital / 2)), reputation: Math.max(5, Math.round(finalCapital / 100)) },
  })
}

const placeBid = (level: number) => {
  if (phase.value !== 'bidding') return
  const val = auction.value
  const bidAmount = Math.round(val.valueMin + (val.valueMax - val.valueMin) * BID_LEVELS[level])

  if (bidAmount > capital.value) {
    resultMsg.value = `资金不足！需要 ${bidAmount}`
    resultGain.value = 0
    phase.value = 'result'
    window.setTimeout(() => {
      phase.value = 'bidding'
      pickAuction()
    }, 1200)
    return
  }

  // 真实价值在范围内随机
  const trueValue = Math.floor(val.valueMin + Math.random() * (val.valueMax - val.valueMin))

  if (bidAmount <= trueValue) {
    // 成功买入，获得差价
    const profit = Math.round((trueValue - bidAmount) * 0.6)
    capital.value += profit
    score.value += profit
    resultMsg.value = `成功！买入价 ${bidAmount}，真实价值 ${trueValue}，获利 ${profit}`
    resultGain.value = profit
  } else {
    // 买贵了，亏损
    const loss = Math.round((bidAmount - trueValue) * 0.5)
    capital.value -= loss
    score.value -= loss
    resultMsg.value = `溢价！买入价 ${bidAmount}，真实价值 ${trueValue}，亏损 ${loss}`
    resultGain.value = -loss
  }

  phase.value = 'result'
  window.setTimeout(() => {
    phase.value = 'bidding'
    pickAuction()
  }, 1500)
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
            <span class="hud-capital">资金 ¥{{ capital }}</span>
          </div>

          <div class="capital-bar">
            <div class="capital-fill" :style="{ width: capitalPct + '%' }"></div>
          </div>

          <div v-if="phase === 'bidding'" class="auction-area">
            <div class="auction-card">
              <h3 class="auction-name">{{ auction.name }}</h3>
              <p class="auction-desc">{{ auction.description }}</p>
              <p class="auction-hint">估值范围：???</p>
            </div>
            <div class="bid-buttons">
              <button
                v-for="(label, i) in BID_LABELS"
                :key="i"
                class="bid-btn"
                :class="{ 'bid-low': i === 0, 'bid-mid': i === 1, 'bid-high': i === 2 }"
                @click="placeBid(i)"
              >
                {{ label }}
                <span class="bid-amount">
                  ¥{{
                    Math.round(
                      auction.valueMin + (auction.valueMax - auction.valueMin) * BID_LEVELS[i]
                    )
                  }}
                </span>
              </button>
              <button class="bid-btn bid-skip" @click="placeBid(-1)">放弃本轮</button>
            </div>
          </div>

          <div v-else-if="phase === 'result'" class="result-area">
            <p class="result-msg" :class="{ positive: resultGain > 0, negative: resultGain < 0 }">
              {{ resultMsg }}
            </p>
          </div>

          <div v-else class="ended-area">
            <h3>竞价结束</h3>
            <p>最终资金：¥{{ capital }}</p>
            <p>得分：{{ Math.round(capital / 10) }}</p>
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
  height: min(56dvh, 380px);
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}
.hud {
  display: flex;
  justify-content: space-between;
}
.hud-timer,
.hud-capital {
  background: rgba(255, 255, 255, 0.85);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #8b4b67;
}
.capital-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  overflow: hidden;
}
.capital-fill {
  height: 100%;
  background: linear-gradient(90deg, #f48fb1, #e96c98);
  transition: width 0.3s;
}
.auction-card {
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 10px;
  text-align: center;
}
.auction-name {
  margin: 0 0 4px;
  font-size: 16px;
  color: #8b4b67;
}
.auction-desc {
  margin: 0 0 6px;
  font-size: 13px;
  color: #6f4a59;
}
.auction-hint {
  margin: 0;
  font-size: 12px;
  color: #a46583;
}
.bid-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bid-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(247, 191, 211, 0.6);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #6f4a59;
  cursor: pointer;
  transition: all 0.15s;
}
.bid-btn:active {
  transform: scale(0.98);
}
.bid-low { border-color: rgba(100, 180, 100, 0.5); }
.bid-mid { border-color: rgba(247, 191, 211, 0.8); }
.bid-high { border-color: rgba(220, 53, 69, 0.5); }
.bid-skip {
  background: rgba(200, 200, 200, 0.5);
  border-color: rgba(180, 180, 180, 0.6);
}
.bid-amount {
  font-size: 13px;
  color: #a46583;
}
.result-msg {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  margin: auto 0;
}
.result-msg.positive { color: #e96c98; }
.result-msg.negative { color: #c95580; }
.ended-area {
  text-align: center;
  padding: 20px;
  color: #6f4a59;
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
