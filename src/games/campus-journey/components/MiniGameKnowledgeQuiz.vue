<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { generateMathQuestion } from '../mathQuestions'
import type { MathQuestion } from '../mathQuestions'
import type { RewardSet } from '../types'

const props = defineProps<{ open: boolean; backgroundSrc?: string }>()
const emit = defineEmits<{ close: []; complete: [{ score: number; rewards: RewardSet }] }>()

const DURATION = 60
const timeLeft = ref(DURATION)
const score = ref(0)
const combo = ref(0)
const question = ref<MathQuestion>(generateMathQuestion())
const feedback = ref<'correct' | 'wrong' | null>(null)
let timer: number | null = null

const comboLabel = computed(() => (combo.value > 1 ? `🔥 连击 ×${combo.value}` : ''))

const nextQuestion = () => {
  question.value = generateMathQuestion()
}

const start = () => {
  timeLeft.value = DURATION
  score.value = 0
  combo.value = 0
  feedback.value = null
  nextQuestion()
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
  const finalScore = Math.max(0, score.value)
  emit('complete', {
    score: finalScore,
    rewards: { exp: finalScore * 2, knowledge: Math.round(finalScore * 1.5) },
  })
}

const answer = (idx: number) => {
  if (feedback.value) return
  if (idx === question.value.correctIndex) {
    combo.value += 1
    const bonus = combo.value > 1 ? combo.value : 1
    score.value += 10 * bonus
    feedback.value = 'correct'
  } else {
    combo.value = 0
    score.value -= 3
    feedback.value = 'wrong'
  }
  window.setTimeout(() => {
    feedback.value = null
    nextQuestion()
  }, 350)
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
          <div v-if="comboLabel" class="combo-badge">{{ comboLabel }}</div>

          <div class="question-area">
            <p class="question-text">{{ question.question }}</p>
            <div class="options-grid">
              <button
                v-for="(opt, i) in question.options"
                :key="i"
                class="option-btn"
                :class="{
                  correct: feedback === 'correct' && i === question.correctIndex,
                  wrong: feedback === 'wrong' && i !== question.correctIndex,
                }"
                @click="answer(i)"
              >
                {{ opt }}
              </button>
            </div>
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
.combo-badge {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff6b6b, #ff9a56);
  color: #fff;
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  animation: pulse 0.4s ease-out;
}
@keyframes pulse {
  0% { transform: translateX(-50%) scale(1.2); }
  100% { transform: translateX(-50%) scale(1); }
}
.question-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.question-text {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #6f4a59;
  background: rgba(255, 255, 255, 0.92);
  padding: 14px;
  border-radius: 10px;
  margin: 0;
}
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.option-btn {
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(247, 191, 211, 0.6);
  border-radius: 10px;
  padding: 14px 8px;
  font-size: 16px;
  font-weight: 600;
  color: #6f4a59;
  cursor: pointer;
  transition: all 0.15s;
}
.option-btn:active {
  transform: scale(0.97);
}
.option-btn.correct {
  background: #fce4ef;
  border-color: #e96c98;
  color: #8b4b67;
}
.option-btn.wrong {
  background: #f8d7e2;
  border-color: #c95580;
  color: #7a3050;
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
