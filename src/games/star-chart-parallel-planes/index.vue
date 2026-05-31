<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import GameContainer from '../../components/GameContainer.vue'
import MemoryCard from './components/MemoryCard.vue'
import ResultOverlay from './components/ResultOverlay.vue'
import OptionsMenu from './components/OptionsMenu.vue'
import { getThemeById } from './themeConfig'
import {
  generateDeck,
  calculateScore,
  calculateStars,
  generateBlindBox,
  formatTime,
  mulberry32,
  createRoundSeed,
} from './gameLogic'
import {
  loadPlayerDataWithStatus,
  savePlayerData,
  canPlay,
  spendStamina,
  addTickets,
  spendConsumableUse,
  updatePity,
  addUnlockedCard,
  updateDailyQuests,
  refillStamina,
} from './economy'
import type { Card, GamePhase, PlayerData, BlindBoxItem, CharacterData, ThemeId } from './types'
import {
  HARD_TIME_LIMIT,
  HINT_FREE_USES,
  HINT_MAX_USES,
  RARITY_COLORS,
  STAMINA_REFILL_COST,
} from './types'
import './game-theme.css'
import {
  playMatchSound,
  playMismatchSound,
  playBgm,
  stopBgm,
  stopCompletionAudio,
  loadCompletionAudio,
  playCompletionAudio,
} from './soundManager'

const GAME_ID = 'star-chart-parallel-planes'
const route = useRoute()
const nav = useGameNavigation(GAME_ID)
const { registerCleanup } = useGameRouteLifecycle()

const phase = ref<GamePhase>('playing')
const difficulty = ref<'easy' | 'hard'>('easy')
const themeId = ref<string>('urban')
const cards = ref<Card[]>([])
const moves = ref(0)
const elapsed = ref(0)
const shakingIds = ref<Set<number>>(new Set())
const hintHighlightIds = ref<Set<number>>(new Set())
const showOptions = ref(false)
const hintCount = ref(0)
const showResult = ref(false)
const resultScore = ref(0)
const resultStars = ref<0 | 1 | 2 | 3>(0)
const resultTicketReward = ref(0)
const blindBoxItems = ref<BlindBoxItem[]>([])
const selectedBlindBox = ref<BlindBoxItem | null>(null)
const blindBoxRevealed = ref(false)
const blindBoxConfirmed = ref(false)
const playerData = ref<PlayerData>(createEmptyPlayerData())
const matchedCharList = ref<CharacterData[]>([])
const timerWarning = ref(false)
const timedOut = ref(false)
const integrityWarning = ref(false)
const showStaminaDialog = ref(false)
const boardRef = ref<HTMLElement | null>(null)
const gridSize = ref<Record<string, string>>({ width: '100%', height: 'auto' })

let timerId: ReturnType<typeof setInterval> | null = null
let matchTimerId: ReturnType<typeof setTimeout> | null = null
let shakeTimerId: ReturnType<typeof setTimeout> | null = null
let hintTimerId: ReturnType<typeof setTimeout> | null = null

function createEmptyPlayerData(): PlayerData {
  return {
    unlockedCards: [],
    economy: { tickets: 0, stamina: 10, staminaTimestamp: Date.now(), pityCount: 0 },
    daily: { date: '', quests: [] },
    settings: { soundEnabled: true, musicEnabled: true },
    tutorialStep: 0,
    roundIndex: 0,
  }
}

const currentTheme = computed(() => getThemeById(themeId.value))
const matchedPairs = computed(() => cards.value.filter((c) => c.state === 'matched').length / 2)
const totalPairs = computed(() => 8)
const isAllMatched = computed(() => matchedPairs.value >= totalPairs.value)
const isLocked = computed(() => phase.value === 'checking')
const revealedCards = computed(() => cards.value.filter((c) => c.state === 'revealed'))
const ticketDisplay = computed(() => playerData.value.economy.tickets)
const canAffordStamina = computed(() => ticketDisplay.value >= STAMINA_REFILL_COST)
const staminaCost = computed(() => (difficulty.value === 'easy' ? 1 : 2))
const canUseHint = computed(
  () =>
    hintCount.value < HINT_MAX_USES && (hintCount.value < HINT_FREE_USES || ticketDisplay.value > 0)
)

const themeBgImage = computed(() => {
  if (!currentTheme.value) return ''
  return new URL(`./assets/images/${themeId.value}/bg.png`, import.meta.url).href
})

function getCardImage(card: Card): string {
  if (!currentTheme.value) return ''
  return new URL(`./assets/images/${themeId.value}/chars/${card.imageName}.png`, import.meta.url)
    .href
}

const isThemeComplete = computed(() => {
  const theme = currentTheme.value
  if (!theme || !playerData.value) return false
  const charIds = theme.characters.map((c) => c.id)
  return charIds.every((id) => playerData.value!.unlockedCards.includes(id))
})

function getCardBackImage(): string | undefined {
  return new URL(`./assets/images/${themeId.value}/back.png`, import.meta.url).href
}

function getBlindBoxImage(item: BlindBoxItem): string {
  return new URL(`./assets/images/${themeId.value}/chars/${item.imageName}.png`, import.meta.url)
    .href
}

async function initPlay() {
  const loaded = await loadPlayerDataWithStatus()
  playerData.value = loaded.data
  integrityWarning.value = loaded.integrityFailed
  const theme = (route.query.theme as string) || playerData.value.lastTheme || 'urban'
  const diff = (route.query.difficulty as string) || playerData.value.lastDifficulty || 'easy'
  themeId.value = theme
  difficulty.value = diff as 'easy' | 'hard'

  startGame()
}

async function startGame() {
  const theme = currentTheme.value
  if (!theme) return

  const diff = difficulty.value
  const cost = diff === 'easy' ? 1 : 2

  if (!canPlay(playerData.value.economy, cost)) {
    showStaminaDialog.value = true
    return
  }

  const seed = createRoundSeed(playerData.value.roundIndex, themeId.value, diff)
  const rng = mulberry32(seed)
  const result = generateDeck(
    theme,
    diff,
    playerData.value.unlockedCards,
    playerData.value.economy.pityCount,
    rng
  )

  cards.value = result.cards
  matchedCharList.value = result.selectedChars
  phase.value = 'playing'
  moves.value = 0
  elapsed.value = 0
  shakingIds.value = new Set()
  hintHighlightIds.value = new Set()
  hintCount.value = 0
  showResult.value = false
  selectedBlindBox.value = null
  blindBoxRevealed.value = false
  blindBoxConfirmed.value = false
  timerWarning.value = false
  timedOut.value = false

  playerData.value.economy = spendStamina(playerData.value.economy, cost)
  playerData.value.economy = updatePity(playerData.value.economy, result.newPity)
  playerData.value.roundIndex++
  await savePlayerData(playerData.value)

  startTimer()
  playBgm(themeId.value as string)
}

async function handleBuyStamina() {
  const newEconomy = refillStamina(playerData.value.economy)
  if (!newEconomy) return
  playerData.value.economy = newEconomy
  await savePlayerData(playerData.value)
  showStaminaDialog.value = false
  startGame()
}

function handleCancelStamina() {
  showStaminaDialog.value = false
  nav.goToHome()
}

function startTimer() {
  stopTimer()
  timerId = setInterval(() => {
    if (phase.value === 'playing' || phase.value === 'checking') {
      elapsed.value++
      if (difficulty.value === 'hard') {
        const remaining = HARD_TIME_LIMIT - elapsed.value
        if (remaining <= 30) timerWarning.value = true
        if (remaining <= 0) handleTimeout()
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

async function handleTimeout() {
  stopTimer()
  timedOut.value = true
  stopBgm()
  phase.value = 'completed'
  showResult.value = true
  resultScore.value = 0
  resultStars.value = 0
  resultTicketReward.value = 0

  playerData.value.daily = updateDailyQuests(playerData.value.daily, {
    playAny: true,
    hardCompleted: false,
    moves: moves.value,
    newUnlock: false,
  })
  playerData.value.lastTheme = themeId.value as ThemeId
  playerData.value.lastDifficulty = difficulty.value
  await savePlayerData(playerData.value)
}

watch(showOptions, (open) => {
  if (open) {
    stopTimer()
  } else if (phase.value === 'playing') {
    startTimer()
  }
})

function flipCard(cardId: number) {
  if (isLocked.value || phase.value === 'completed') return
  const card = cards.value.find((c) => c.id === cardId)
  if (!card || card.state !== 'hidden') return
  if (revealedCards.value.length >= 2) return

  card.state = 'revealed'
  if (revealedCards.value.length === 2) {
    moves.value++
    phase.value = 'checking'
    matchTimerId = setTimeout(() => checkMatch(), 500)
  }
}

async function checkMatch() {
  const revealed = revealedCards.value
  if (revealed.length !== 2) return

  if (revealed[0].patternId === revealed[1].patternId) {
    revealed[0].state = 'matched'
    revealed[1].state = 'matched'
    playMatchSound()
    phase.value = 'playing'

    if (isAllMatched.value) {
      await completeGame()
    }
  } else {
    playMismatchSound()
    shakingIds.value = new Set(revealed.map((c) => c.id))
    shakeTimerId = setTimeout(() => {
      revealed[0].state = 'hidden'
      revealed[1].state = 'hidden'
      shakingIds.value = new Set()
      phase.value = 'playing'
    }, 700)
  }
}

async function completeGame() {
  stopTimer()
  stopBgm()
  stopCompletionAudio()

  const score = calculateScore(elapsed.value, moves.value)
  const stars = calculateStars(score)
  const isHard = difficulty.value === 'hard'
  const ticketReward = isHard ? [0, 1, 2, 3][stars] : 0

  resultScore.value = score
  resultStars.value = stars
  resultTicketReward.value = ticketReward

  loadCompletionAudio()
  playCompletionAudio()

  const theme = currentTheme.value
  if (!theme) return

  if (stars > 0 || !isHard) {
    const matchedChars = extractMatchedCharacters()
    const rng = mulberry32(Date.now() + moves.value)
    const pool = generateBlindBox(
      matchedChars,
      theme,
      difficulty.value,
      playerData.value.unlockedCards,
      rng
    )
    blindBoxItems.value = pool
  }

  if (ticketReward > 0) {
    playerData.value.economy = addTickets(playerData.value.economy, ticketReward)
  }

  playerData.value.daily = updateDailyQuests(playerData.value.daily, {
    playAny: true,
    hardCompleted: isHard,
    moves: moves.value,
    newUnlock: false,
  })
  playerData.value.lastTheme = themeId.value as ThemeId
  playerData.value.lastDifficulty = difficulty.value
  await savePlayerData(playerData.value)

  phase.value = 'completed'
  showResult.value = true
}

function extractMatchedCharacters(): CharacterData[] {
  const matchedPatterns = new Set<number>()
  cards.value.filter((c) => c.state === 'matched').forEach((c) => matchedPatterns.add(c.patternId))
  return Array.from(matchedPatterns).map((pid) => matchedCharList.value[pid])
}

async function onBlindBoxSelect(item: BlindBoxItem) {
  if (selectedBlindBox.value || blindBoxConfirmed.value) return
  selectedBlindBox.value = item
  blindBoxRevealed.value = true
  blindBoxConfirmed.value = true

  if (item.isNew) {
    playerData.value.unlockedCards = addUnlockedCard(
      playerData.value.unlockedCards,
      item.character.id
    )
  } else if (item.ticketAward > 0) {
    playerData.value.economy = addTickets(playerData.value.economy, item.ticketAward)
  }

  const dailyEvents = {
    playAny: false,
    hardCompleted: false,
    moves: moves.value,
    newUnlock: item.isNew,
  }
  playerData.value.daily = updateDailyQuests(playerData.value.daily, dailyEvents)
  await savePlayerData(playerData.value)
}

function goToBlindBox() {
  showResult.value = false
  phase.value = 'blindbox'
}

function onBlindBoxRestart() {
  restartGame()
}

function onBlindBoxHome() {
  goHome()
}

async function useHint() {
  const hidden = cards.value.filter((c) => c.state === 'hidden')
  if (hidden.length === 0) return

  for (let i = 0; i < hidden.length; i++) {
    for (let j = i + 1; j < hidden.length; j++) {
      if (hidden[i].patternId === hidden[j].patternId) {
        const payment = spendConsumableUse(
          playerData.value.economy,
          hintCount.value,
          HINT_FREE_USES
        )
        if (!payment) return
        playerData.value.economy = payment.economy
        hintCount.value++
        if (payment.paid) await savePlayerData(playerData.value)

        hintHighlightIds.value = new Set([hidden[i].id, hidden[j].id])
        if (hintTimerId !== null) clearTimeout(hintTimerId)
        hintTimerId = setTimeout(() => {
          hintHighlightIds.value = new Set()
          hintTimerId = null
        }, 3000)

        return
      }
    }
  }
}

async function restartGame() {
  blindBoxItems.value = []
  showResult.value = false
  showOptions.value = false
  stopCompletionAudio()
  startGame()
}

function goHome() {
  stopTimer()
  stopBgm()
  stopCompletionAudio()
  nav.goToPage('map')
}

const remainingTime = computed(() => {
  if (difficulty.value !== 'hard') return 0
  return Math.max(0, HARD_TIME_LIMIT - elapsed.value)
})

onMounted(async () => {
  await initPlay()
  registerCleanup(GAME_ID, () => {
    stopTimer()
    if (matchTimerId !== null) clearTimeout(matchTimerId)
    if (shakeTimerId !== null) clearTimeout(shakeTimerId)
    if (hintTimerId !== null) clearTimeout(hintTimerId)
    stopBgm()
    stopCompletionAudio()
  })

  const board = boardRef.value
  if (board) {
    const updateGridSize = () => {
      const rect = board.getBoundingClientRect()
      const bw = rect.width
      const bh = rect.height
      const gridAspect = 2 / 3
      if (bw > 0 && bh > 0) {
        if (bw / bh < gridAspect) {
          gridSize.value = { width: 'calc(100% - 2px)', height: 'auto' }
        } else {
          gridSize.value = { width: 'auto', height: 'calc(100% - 2px)' }
        }
      }
    }
    updateGridSize()
    const observer = new ResizeObserver(updateGridSize)
    observer.observe(board)
    registerCleanup(GAME_ID, () => observer.disconnect())
  }
})

onBeforeUnmount(() => {
  stopTimer()
  if (matchTimerId !== null) clearTimeout(matchTimerId)
  if (shakeTimerId !== null) clearTimeout(shakeTimerId)
  if (hintTimerId !== null) clearTimeout(hintTimerId)
  stopBgm()
  stopCompletionAudio()
})
</script>

<template>
  <GameContainer v-if="currentTheme" :bg-class="'star-chart-bg'" :bg-image="themeBgImage">
    <div class="star-play">
      <div class="game-header star-top-hud">
        <div class="header-left">
          <span class="theme-name">{{ currentTheme.name }}</span>
          <span class="diff-badge" :class="difficulty">{{
            difficulty === 'easy' ? '简单' : '困难'
          }}</span>
        </div>
        <div class="header-right">
          <button
            class="header-btn star-hit-icon"
            @click="showOptions = !showOptions"
            aria-label="菜单"
          >
            ☰
          </button>
        </div>
      </div>

      <div v-if="difficulty === 'hard'" class="timer-bar" :class="{ warning: timerWarning }">
        <span class="timer-label">时空稳定度</span>
        <div class="timer-fill" :style="{ width: (remainingTime / HARD_TIME_LIMIT) * 100 + '%' }" />
        <span class="timer-text">{{ formatTime(remainingTime) }}</span>
      </div>

      <div ref="boardRef" v-if="phase !== 'blindbox'" class="game-board" @pointerdown.prevent>
        <TransitionGroup name="grid" tag="div" class="card-grid" :style="gridSize">
          <MemoryCard
            v-for="card in cards"
            :key="card.id"
            :image-url="getCardImage(card)"
            :card-back-url="getCardBackImage()"
            :card-back-fallback="currentTheme.cardBackFallback"
            :theme-complete="isThemeComplete"
            :is-revealed="card.state === 'revealed' || card.state === 'matched'"
            :is-matched="card.state === 'matched'"
            :shaking="shakingIds.has(card.id)"
            :hint-highlighted="hintHighlightIds.has(card.id)"
            :rarity="card.rarity"
            @flip="flipCard(card.id)"
          />
        </TransitionGroup>
      </div>

      <div v-if="phase !== 'blindbox'" class="game-footer">
        <div class="footer-stat star-secondary-btn">
          <span class="footer-label">步数</span>
          <span class="footer-value">{{ moves }}</span>
        </div>
        <div class="footer-stat star-secondary-btn">
          <span class="footer-label">配对</span>
          <span class="footer-value">{{ matchedPairs }}/{{ totalPairs }}</span>
        </div>
        <button
          v-if="difficulty === 'easy'"
          class="action-btn star-secondary-btn"
          :disabled="!canUseHint"
          @pointerup.prevent="useHint"
        >
          <span class="footer-label">调律之光</span>
          <span class="footer-value">{{ HINT_MAX_USES - hintCount }}</span>
        </button>
      </div>

      <Transition name="fade">
        <div v-if="showOptions" class="options-overlay" @click.self="showOptions = false">
          <OptionsMenu @close="showOptions = false" @restart="restartGame" @home="goHome" />
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="integrityWarning" class="integrity-overlay" role="dialog" aria-modal="true">
          <div class="integrity-panel star-modal">
            <h3>星图波动异常</h3>
            <p>本地存档校验失败，星图已重置为新的稳定状态。</p>
            <button class="star-primary-btn" @click="integrityWarning = false">
              <span style="position: relative; z-index: 1">确认</span>
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="showStaminaDialog"
          class="integrity-panel star-modal"
          role="dialog"
          aria-modal="true"
          style="
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 520;
          "
        >
          <h3>体力不足</h3>
          <p>当前体力：{{ playerData.economy.stamina }} / 需要：{{ staminaCost }}</p>
          <p>花费 {{ STAMINA_REFILL_COST }} 星券恢复体力至满值？</p>
          <p>当前星券：{{ ticketDisplay }}</p>
          <div style="display: flex; gap: 8px; margin-top: 12px">
            <button class="star-secondary-btn" style="flex: 1" @click="handleCancelStamina">
              <span style="position: relative; z-index: 1">取消</span>
            </button>
            <button
              class="star-primary-btn"
              style="flex: 1"
              :disabled="!canAffordStamina"
              @click="handleBuyStamina"
            >
              <span style="position: relative; z-index: 1">购买并继续</span>
            </button>
          </div>
        </div>
      </Transition>

      <ResultOverlay
        :visible="showResult"
        :moves="moves"
        :time="elapsed"
        :score="resultScore"
        :stars="resultStars"
        :ticket-reward="resultTicketReward"
        :is-hard="difficulty === 'hard'"
        :timed-out="timedOut"
        :matched-pairs="matchedPairs"
        :total-pairs="totalPairs"
        @restart="restartGame"
        @home="goHome"
        @continue="goToBlindBox"
      />

      <Transition name="fade">
        <div v-if="phase === 'blindbox'" class="blindbox-overlay" role="dialog" aria-modal="true">
          <div class="blindbox-panel star-modal">
            <h2 class="blindbox-title">星魂胶囊</h2>
            <p class="blindbox-subtitle">选择一颗星魂胶囊唤醒角色</p>

            <div class="blindbox-grid">
              <button
                v-for="(item, idx) in blindBoxItems"
                :key="idx"
                class="blindbox-card star-card"
                :class="{
                  selected: selectedBlindBox === item,
                  revealed: blindBoxRevealed,
                  new: item.isNew,
                }"
                :disabled="selectedBlindBox !== null"
                @pointerup.prevent="onBlindBoxSelect(item)"
              >
                <div v-if="!blindBoxRevealed" class="bb-card-back">
                  <img
                    :src="getCardBackImage()"
                    alt=""
                    class="bb-card-back-img"
                    draggable="false"
                  />
                </div>
                <div v-else class="bb-card-front">
                  <img :src="getBlindBoxImage(item)" alt="" class="bb-image" draggable="false" />
                  <span
                    class="bb-rarity-badge"
                    :style="{ background: RARITY_COLORS[item.character.rarity] }"
                  >
                    {{ item.character.rarity }}
                  </span>
                  <div v-if="item.isNew" class="bb-badge bb-new">NEW!</div>
                  <div v-else class="bb-badge bb-duplicate">+{{ item.ticketAward }}🎫</div>
                  <div class="bb-name">{{ item.character.name }}</div>
                </div>
              </button>
            </div>

            <Transition name="fade-up">
              <div v-if="blindBoxRevealed" class="blindbox-result">
                <p v-if="selectedBlindBox" class="result-text">
                  {{
                    selectedBlindBox.isNew
                      ? '✨ 新角色已唤醒！'
                      : `🎫 重复转化 +${selectedBlindBox.ticketAward} 星券`
                  }}
                </p>
                <div class="blindbox-actions">
                  <button class="blindbox-action" @click="onBlindBoxRestart">
                    <span>再来一局</span>
                  </button>
                  <button class="blindbox-action" @click="onBlindBoxHome">
                    <span>返回星图</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>
  </GameContainer>
</template>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: clamp(8px, 1.5cqw, 12px);
  padding-bottom: clamp(8px, 1.5cqw, 12px);
}
.header-left,
.header-right {
  display: flex;
  gap: clamp(6px, 1cqw, 10px);
  align-items: center;
}
.theme-name {
  font-size: clamp(14px, 3cqw, 18px);
  font-weight: 800;
  color: #e0e8f0;
}
.diff-badge {
  font-size: clamp(10px, 2cqw, 12px);
  font-weight: 700;
  padding: 2px clamp(6px, 1cqw, 10px);
  border-radius: 20px;
}
.diff-badge.easy {
  background: rgba(79, 195, 247, 0.2);
  color: #4fc3f7;
}
.diff-badge.hard {
  background: rgba(239, 83, 80, 0.2);
  color: #ef5350;
}
.header-btn {
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: rgba(240, 244, 255, 0.85);
  font-size: clamp(18px, 4cqw, 22px);
  width: clamp(42px, 8cqw, 48px);
  height: clamp(42px, 8cqw, 48px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.header-btn:active {
  transform: scale(0.9);
  background: transparent;
}
.timer-bar {
  position: relative;
  height: clamp(18px, 4cqw, 28px);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0;
  margin-bottom: clamp(8px, 1.5cqw, 12px);
  overflow: hidden;
}
.timer-label {
  position: absolute;
  left: clamp(6px, 1cqw, 10px);
  top: 50%;
  transform: translateY(-50%);
  font-size: clamp(10px, 1.8cqw, 12px);
  color: rgba(180, 210, 255, 0.6);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7, #29b6f6);
  border-radius: 10px;
  transition: width 0.3s linear;
}
.timer-bar.warning .timer-fill {
  background: linear-gradient(90deg, #ef5350, #e53935);
  animation: pulse 0.5s ease-in-out infinite;
}
.timer-text {
  position: absolute;
  right: clamp(6px, 1cqw, 10px);
  top: 50%;
  transform: translateY(-50%);
  font-size: clamp(11px, 1.8cqw, 13px);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.game-board {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 8px;
  box-sizing: border-box;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  box-sizing: border-box;
  aspect-ratio: 2 / 3;
  max-width: 100%;
  max-height: 100%;
}

.game-footer {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5cqw, 12px);
  padding: clamp(8px, 1.5cqw, 12px) 0;
}
.footer-stat {
  cursor: default;
  flex: 1;
  padding-inline: clamp(20px, 3.5cqw, 28px);
}
.footer-label {
  font-size: clamp(11px, 2cqw, 13px);
  color: rgba(180, 210, 255, 0.72);
  font-weight: 600;
}
.footer-value {
  font-size: clamp(16px, 3.5cqw, 20px);
  font-weight: 900;
  color: #f0f4ff;
}
.footer-actions {
  display: flex;
  gap: clamp(6px, 1cqw, 10px);
  justify-content: center;
  width: 100%;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  color: #f0f4ff;
  font-size: clamp(12px, 2.2cqw, 14px);
  font-weight: 700;
  padding: clamp(8px, 1.2cqw, 12px) clamp(18px, 3cqw, 26px);
  min-height: 44px;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn-icon {
  width: clamp(16px, 3cqw, 20px);
  height: clamp(16px, 3cqw, 20px);
  filter: brightness(1.2);
}
.action-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.action-btn:not(:disabled):active {
  transform: scale(0.96);
}

.game-footer .star-secondary-btn {
  clip-path: polygon(
    var(--tech-cut) 0%,
    100% 0%,
    100% calc(100% - var(--tech-cut)),
    calc(100% - var(--tech-cut)) 100%,
    0% 100%,
    0% var(--tech-cut)
  ) !important;
}

.game-footer .star-secondary-btn::before {
  clip-path: polygon(
    calc(var(--tech-cut) - 2px) 0%,
    100% 0%,
    100% calc(100% - var(--tech-cut) + 2px),
    calc(100% - var(--tech-cut) + 2px) 100%,
    0% 100%,
    0% calc(var(--tech-cut) - 2px)
  ) !important;
}

.game-footer .star-secondary-btn::after {
  clip-path: polygon(
    calc(var(--tech-cut) - 3px) 0%,
    100% 0%,
    100% calc(100% - var(--tech-cut) + 3px),
    calc(100% - var(--tech-cut) + 3px) 100%,
    0% 100%,
    0% calc(var(--tech-cut) - 3px)
  ) !important;
}

.options-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}
.options-panel {
  background: #0d1b2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: clamp(24px, 5cqh, 36px);
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2cqh, 14px);
  min-width: min(280px, 80cqw);
}
.options-panel .star-primary-btn {
  width: 100%;
  min-height: clamp(48px, 8cqh, 54px);
}

.integrity-overlay {
  position: absolute;
  inset: 0;
  z-index: 520;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 8, 22, 0.72);
  backdrop-filter: blur(6px);
}

.integrity-panel {
  width: min(330px, 84cqw);
  padding: 22px;
  text-align: center;
}

.integrity-panel h3 {
  margin: 0 0 8px;
  color: #ff8a80;
  font-size: 20px;
  font-weight: 900;
}

.integrity-panel p {
  margin: 0 0 18px;
  color: rgba(238, 246, 255, 0.72);
  font-size: 13px;
  line-height: 1.6;
}

.blindbox-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
}
.blindbox-panel {
  width: 100%;
  max-width: min(420px, 90cqw);
  padding: clamp(20px, 4cqh, 32px);
  text-align: center;
}
.blindbox-title {
  font-size: clamp(20px, 5cqw, 26px);
  font-weight: 900;
  color: #7ec8f8;
  text-shadow: 0 0 20px rgba(126, 200, 248, 0.3);
  margin: 0 0 4px;
}
.blindbox-subtitle {
  font-size: clamp(12px, 2.5cqw, 14px);
  color: rgba(160, 200, 255, 0.6);
  margin: 0 0 clamp(16px, 3cqh, 24px);
}

.blindbox-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(8px, 1.5cqw, 14px);
  margin-bottom: clamp(16px, 3cqh, 24px);
}
.blindbox-card {
  aspect-ratio: 2 / 3;
  border-radius: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: #0a1628;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  padding: 0;
  transition: all 0.2s;
}
.blindbox-card:disabled {
  cursor: default;
}
.blindbox-card.selected {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  transform: scale(1.05);
}
.blindbox-card.revealed .bb-card-back {
  display: none;
}
.bb-card-back {
  width: 100%;
  height: 100%;
}
.bb-card-back-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}
.bb-card-front {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.bb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.bb-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: clamp(9px, 1.8cqw, 11px);
  font-weight: 800;
  padding: 1px clamp(6px, 1cqw, 8px);
  border-radius: 6px;
}
.bb-new {
  background: #ffd700;
  color: #000;
}
.bb-duplicate {
  background: rgba(100, 180, 255, 0.2);
  color: #4fc3f7;
}
.bb-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: clamp(9px, 1.8cqw, 11px);
  font-weight: 700;
  color: #e0e8f0;
  padding: 18px 4px 4px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(transparent, rgba(6, 14, 34, 0.85) 40%);
  pointer-events: none;
}

.bb-rarity-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: clamp(9px, 1.6cqw, 11px);
  font-weight: 800;
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  z-index: 2;
}

.blindbox-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.5cqh, 10px);
  margin-top: clamp(4px, 1cqh, 8px);
}
.result-text {
  font-size: clamp(14px, 3cqw, 18px);
  font-weight: 800;
  color: #ffd700;
  margin: 0;
}
.blindbox-actions {
  display: flex;
  gap: clamp(8px, 1.5cqw, 12px);
  width: 100%;
}
.blindbox-action {
  flex: 1;
  --tech-cut: 18px;
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: clamp(48px, 8cqh, 54px);
  font-size: clamp(14px, 3.5cqw, 16px);
  font-weight: 900;
  cursor: pointer;
  border: 0;
  border-radius: 0;
  color: #fff;
  overflow: hidden;
  clip-path: polygon(
    var(--tech-cut) 0%,
    100% 0%,
    100% calc(100% - var(--tech-cut)),
    calc(100% - var(--tech-cut)) 100%,
    0% 100%,
    0% var(--tech-cut)
  );
  background: rgba(92, 139, 232, 0.34);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}
.blindbox-action::before {
  content: '';
  position: absolute;
  inset: 2px;
  clip-path: polygon(
    calc(var(--tech-cut) - 2px) 0%,
    100% 0%,
    100% calc(100% - var(--tech-cut) + 2px),
    calc(100% - var(--tech-cut) + 2px) 100%,
    0% 100%,
    0% calc(var(--tech-cut) - 2px)
  );
  background: linear-gradient(180deg, rgba(9, 19, 46, 0.94), rgba(8, 16, 38, 0.98));
  pointer-events: none;
}
.blindbox-action::after {
  content: '';
  position: absolute;
  inset: 3px;
  padding: 1px;
  clip-path: polygon(
    calc(var(--tech-cut) - 3px) 0%,
    100% 0%,
    100% calc(100% - var(--tech-cut) + 3px),
    calc(100% - var(--tech-cut) + 3px) 100%,
    0% 100%,
    0% calc(var(--tech-cut) - 3px)
  );
  background: rgba(112, 171, 255, 0.22);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
}
.blindbox-action:active {
  transform: scale(0.94) translateY(2px);
}

.blindbox-action > * {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .timer-fill,
  .timer-bar.warning .timer-fill {
    animation: none;
  }
}
</style>
