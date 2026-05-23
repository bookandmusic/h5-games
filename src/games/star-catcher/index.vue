<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import { gameStorage } from '../../stores/gameStorage'
import {
  applyRunToAchievements,
  loadAchievementState,
  saveAchievementState,
  type AchievementDefinition,
} from './archive'
import { soundManager } from './soundManager'
import { particleSystem } from './particleSystem'
import * as renderer from './renderer'
import {
  gameState,
  initGame,
  startGame,
  beginPlaying,
  updateGame,
  handleTap,
  getFinalScore,
} from './gameLogic'
import type { GameMode, GameRecords, HighScoreEntry } from './types'
import GameContainer from '../../components/GameContainer.vue'
import { ITEM_COLORS } from './types'

const GAME_ID = 'star-catcher'
const router = useRouter()
const nav = useGameNavigation(GAME_ID)
const { registerCleanup } = useGameRouteLifecycle()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const phase = ref<'idle' | 'countdown' | 'playing' | 'paused' | 'ended'>('idle')
const score = ref(0)
const combo = ref(0)
const lives = ref(3)
const maxLives = ref(3)
const timeRemaining = ref(60)
const countdownNum = ref(3)
const showCountdown = ref(false)
const isNewRecord = ref(false)
const finalScore = ref(0)
const totalCollected = ref(0)
const maxCombo = ref(0)
const survivedTime = ref(0)
const showComboText = ref(false)
const comboText = ref('')
const shieldActive = ref(false)
const showExitConfirm = ref(false)
const newUnlocks = ref<AchievementDefinition[]>([])

const bgUrl = new URL('./assets/images/star-catcher-bg-wide.png', import.meta.url).href
const bgmUrl = new URL('./assets/audio/bgm_star_catcher.mp3', import.meta.url).href

let mode: GameMode = 'timed'
let timedDuration = 90
let animFrameId = 0
let lastTime = 0
let countdownTimer: ReturnType<typeof window.setTimeout> | null = null
let comboTextTimer: ReturnType<typeof window.setTimeout> | null = null
let hasSavedResult = false
let runStats = {
  rareGems: 0,
  shieldBlocks: 0,
  meteorHits: 0,
  completed: false,
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

async function loadBgm() {
  await soundManager.loadBgmFromUrl(bgmUrl)
}

function gameLoop(time: number) {
  if (phase.value === 'paused') return

  const dt = Math.min(time - lastTime, 33)
  lastTime = time

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  updateGame(dt, canvas.width, canvas.height)

  score.value = gameState.score
  combo.value = gameState.combo
  lives.value = gameState.lives
  if (mode === 'timed') {
    timeRemaining.value = Math.max(0, timedDuration - gameState.elapsed)
  } else {
    survivedTime.value = Math.round(gameState.elapsed)
  }
  phase.value = gameState.phase
  shieldActive.value = gameState.shieldActive

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  particleSystem.drawStars(ctx, time)

  for (const item of gameState.items) {
    renderer.drawItem(ctx, item, time)
  }

  particleSystem.drawParticles(ctx)
  particleSystem.drawComboRings(ctx)
  particleSystem.drawFloatingTexts(ctx)
  particleSystem.drawScorePopups(ctx)

  particleSystem.update()

  if (gameState.phase === 'playing') {
    animFrameId = window.requestAnimationFrame(gameLoop)
  } else if (gameState.phase === 'ended') {
    showResult()
  }
}

function onCanvasClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const tapX = (e.clientX - rect.left) * scaleX
  const tapY = (e.clientY - rect.top) * scaleY
  processTap(tapX, tapY)
}

function onCanvasTouch(e: TouchEvent) {
  e.preventDefault()
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const touch = e.touches[0]
  const tapX = (touch.clientX - rect.left) * scaleX
  const tapY = (touch.clientY - rect.top) * scaleY
  processTap(tapX, tapY)
}

function processTap(tapX: number, tapY: number) {
  if (gameState.phase !== 'playing') return

  const wasShieldActive = gameState.shieldActive
  const result = handleTap(tapX, tapY)

  if (!result.hit) return

  if (result.itemType === 'shield') {
    soundManager.playShield()
    particleSystem.emitParticles(tapX, tapY, ITEM_COLORS.shield, 20)
    particleSystem.addFloatingText(tapX, tapY - 20, '护盾!', '#00e676', 22)
    return
  }

  if (result.itemType === 'meteor') {
    if (wasShieldActive) {
      runStats.shieldBlocks++
      soundManager.playShieldBreak()
      particleSystem.emitParticles(tapX, tapY, '#00e676', 30)
      particleSystem.addFloatingText(tapX, tapY - 20, '护盾抵消!', '#00e676', 20)
    } else {
      runStats.meteorHits++
      soundManager.playMeteorHit()
      particleSystem.emitParticles(tapX, tapY, '#ff4444', 25)
      particleSystem.addFloatingText(tapX, tapY - 20, '💥', '#ff4444', 30)
    }
    return
  }

  const color = ITEM_COLORS[result.itemType!]
  if (
    result.itemType === 'sapphire' ||
    result.itemType === 'amethyst' ||
    result.itemType === 'lucky'
  ) {
    runStats.rareGems++
  }
  soundManager.playCollect()
  particleSystem.emitParticles(tapX, tapY, color, 12)
  particleSystem.addScorePopup(tapX, tapY - 10, result.points, combo.value)

  if (result.itemType === 'lucky') {
    soundManager.playCollectLucky()
    particleSystem.emitParticles(tapX, tapY, '#ff6ec7', 25)
  } else if (result.itemType === 'amethyst' || result.itemType === 'sapphire') {
    soundManager.playCollectRare()
  }

  if (combo.value >= 3 && combo.value <= 4) {
    soundManager.playCombo3()
    particleSystem.emitComboRing(tapX, tapY, 1)
    showComboFlash('x1.5!')
  } else if (combo.value >= 5 && combo.value <= 7) {
    soundManager.playCombo5()
    particleSystem.emitComboRing(tapX, tapY, 2)
    showComboFlash('x2!')
  } else if (combo.value >= 8 && combo.value <= 12) {
    soundManager.playCombo8()
    particleSystem.emitComboRing(tapX, tapY, 3)
    showComboFlash('x3 COMBO!')
  } else if (combo.value >= 13) {
    soundManager.playCombo8()
    particleSystem.emitComboRing(tapX, tapY, 4)
    showComboFlash('x4 SUPER!')
  }
}

function showComboFlash(text: string) {
  comboText.value = text
  showComboText.value = true
  if (comboTextTimer) window.clearTimeout(comboTextTimer)
  comboTextTimer = window.setTimeout(() => {
    showComboText.value = false
  }, 800)
}

async function saveGameScore(): Promise<{ isNew: boolean; unlocked: AchievementDefinition[] }> {
  if (hasSavedResult) return { isNew: false, unlocked: [] }
  hasSavedResult = true

  const result = getFinalScore()
  const key = `${GAME_ID}-records`
  const existing = await gameStorage.loadGameState<GameRecords>(key)
  const entry: HighScoreEntry = {
    score: result.score,
    date: new Date().toLocaleDateString('zh-CN'),
    starsCollected: result.starsCollected,
    maxCombo: result.maxCombo,
    duration: result.elapsed,
  }
  let records: GameRecords
  if (existing) {
    records = existing
  } else {
    records = {
      timed: { highScore: 0, history: [] },
      endless: { highScore: 0, longestDuration: 0, history: [] },
    }
  }
  const bucket = mode === 'timed' ? records.timed : records.endless
  const isNew = result.score > bucket.highScore
  if (isNew) {
    bucket.highScore = result.score
  }
  if (mode === 'endless' && result.elapsed > records.endless.longestDuration) {
    records.endless.longestDuration = result.elapsed
  }
  bucket.history.push(entry)
  bucket.history.sort((a, b) => b.score - a.score)
  if (bucket.history.length > 10) bucket.history.length = 10
  await gameStorage.saveGameState(key, records)

  const achievementState = await loadAchievementState()
  const updated = applyRunToAchievements(achievementState, mode, result, runStats)
  await saveAchievementState(updated.state)

  return { isNew, unlocked: updated.newUnlocks }
}

async function showResult() {
  if (animFrameId) {
    window.cancelAnimationFrame(animFrameId)
    animFrameId = 0
  }

  const result = getFinalScore()
  finalScore.value = result.score
  totalCollected.value = result.starsCollected
  maxCombo.value = result.maxCombo
  survivedTime.value = result.elapsed
  runStats.completed = true

  soundManager.playGameOver()

  const saveResult = await saveGameScore()
  newUnlocks.value = saveResult.unlocked
  if (saveResult.isNew) {
    isNewRecord.value = true
    soundManager.playHighScore()
  }
}

function goHome() {
  soundManager.stopBgm()
  nav.goToHome()
}

function restart() {
  soundManager.stopBgm()
  initGame({ mode, timedDuration })
  particleSystem.clear()
  isNewRecord.value = false
  newUnlocks.value = []
  showExitConfirm.value = false
  showComboText.value = false
  hasSavedResult = false
  runStats = {
    rareGems: 0,
    shieldBlocks: 0,
    meteorHits: 0,
    completed: false,
  }
  startCountdown()
}

function pauseGame() {
  if (phase.value !== 'playing') return
  if (animFrameId) {
    window.cancelAnimationFrame(animFrameId)
    animFrameId = 0
  }
  phase.value = 'paused'
  soundManager.stopBgm()
}

function resumeGame() {
  if (phase.value !== 'paused') return
  showExitConfirm.value = false
  phase.value = 'playing'
  lastTime = window.performance.now()
  soundManager.startBgm()
  animFrameId = window.requestAnimationFrame(gameLoop)
}

function requestHomeExit() {
  showExitConfirm.value = true
}

async function confirmHomeExit() {
  showExitConfirm.value = false
  soundManager.stopBgm()
  if (animFrameId) {
    window.cancelAnimationFrame(animFrameId)
    animFrameId = 0
  }
  nav.goToHome()
}

function startCountdown() {
  startGame()
  phase.value = 'countdown'
  countdownNum.value = 3
  showCountdown.value = true
  soundManager.playTick()

  let count = 3
  countdownTimer = window.setInterval(() => {
    count--
    if (count > 0) {
      countdownNum.value = count
      soundManager.playTick()
    } else {
      window.clearInterval(countdownTimer!)
      countdownTimer = null
      showCountdown.value = false
      beginPlaying()
      phase.value = 'playing'
      soundManager.playGameStart()
      soundManager.startBgm()
      animFrameId = window.requestAnimationFrame(gameLoop)
    }
  }, 600)
}

onMounted(async () => {
  registerCleanup(GAME_ID, () => {
    if (animFrameId) window.cancelAnimationFrame(animFrameId)
    if (countdownTimer) window.clearInterval(countdownTimer)
    soundManager.stopBgm()
  })

  const q = router.currentRoute.value.query as Record<string, string>
  mode = q.mode === 'timed' || q.mode === 'endless' ? q.mode : 'timed'
  maxLives.value = mode === 'endless' ? 5 : 3

  await soundManager.init()
  await renderer.loadImages()
  loadBgm()

  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = Math.min(window.innerWidth, 480)
    canvas.height = Math.min(window.innerHeight * 0.85, 800)
    particleSystem.initStarField(canvas.width, canvas.height)
  }

  initGame({ mode, timedDuration })
  hasSavedResult = false
  runStats = {
    rareGems: 0,
    shieldBlocks: 0,
    meteorHits: 0,
    completed: false,
  }
  startCountdown()
})

onUnmounted(() => {
  if (animFrameId) window.cancelAnimationFrame(animFrameId)
  if (countdownTimer) window.clearInterval(countdownTimer)
  if (comboTextTimer) window.clearTimeout(comboTextTimer)
  soundManager.stopBgm()
  if (gameState.phase === 'playing' && !hasSavedResult) {
    saveGameScore()
  }
})
</script>

<template>
  <GameContainer :bg-image="bgUrl">
    <div class="play-inner">
      <div class="hud">
        <button class="pause-button" type="button" aria-label="暂停" @click="pauseGame">
          <span></span>
          <span></span>
        </button>

        <div class="hud-objective">
          <span>{{ mode === 'timed' ? '限时采集' : '无尽星雨' }}</span>
          <strong v-if="mode === 'timed'" :class="{ urgent: timeRemaining <= 10 }">{{
            formatTime(timeRemaining)
          }}</strong>
          <strong v-else>{{ formatTime(survivedTime) }}</strong>
        </div>

        <div class="hud-status">
          <div class="score-readout">
            <span>捕获</span>
            <strong>{{ score.toLocaleString() }}</strong>
          </div>
          <div class="life-track" aria-label="生命">
            <span v-for="i in lives" :key="i" class="life-dot"></span>
            <span
              v-for="i in Math.max(0, maxLives - lives)"
              :key="'e' + i"
              class="life-dot empty"
            ></span>
          </div>
          <div v-if="shieldActive" class="shield-chip">护盾</div>
        </div>
      </div>

      <div class="canvas-wrapper">
        <canvas
          ref="canvasRef"
          class="game-canvas"
          @click="onCanvasClick"
          @touchstart="onCanvasTouch"
        />
        <Transition name="combo-pop">
          <div v-if="showComboText" class="combo-flash">{{ comboText }}</div>
        </Transition>
        <Transition name="combo-pop">
          <div v-if="combo >= 3" class="combo-counter">{{ combo }} 连锁捕获</div>
        </Transition>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="phase === 'countdown'" class="overlay countdown-overlay">
        <div class="countdown-number">{{ countdownNum }}</div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="phase === 'paused'" class="overlay pause-overlay">
        <div class="pause-panel">
          <div class="pause-title">暂停</div>
          <div v-if="!showExitConfirm" class="pause-menu">
            <button type="button" @click="resumeGame">继续游戏</button>
            <button type="button" @click="restart">重新开始</button>
            <button type="button" @click="requestHomeExit">主界面</button>
          </div>
          <div v-else class="confirm-panel">
            <p>确定要结束当前采集并返回主界面么？</p>
            <div class="confirm-actions">
              <button type="button" @click="confirmHomeExit">确定</button>
              <button type="button" @click="showExitConfirm = false">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="phase === 'ended'" class="overlay result-overlay">
        <div class="result-panel">
          <div class="result-kicker">CAPTURE COMPLETE</div>
          <div class="result-title">采集结束</div>
          <div v-if="isNewRecord" class="result-alert">采集纪录刷新</div>
          <div v-if="newUnlocks.length" class="result-alert archive">
            新档案解锁：{{ newUnlocks.map((item) => item.name).join(' / ') }}
          </div>
          <div class="result-score">{{ finalScore.toLocaleString() }}</div>
          <div class="result-stats">
            <div class="stat-item">
              <span>捕获星尘</span>
              <strong>{{ totalCollected }}</strong>
            </div>
            <div class="stat-item">
              <span>最高连锁</span>
              <strong>{{ maxCombo }}</strong>
            </div>
            <div class="stat-item">
              <span>采集时长</span>
              <strong>{{ survivedTime }}s</strong>
            </div>
          </div>
          <div class="result-buttons">
            <button class="menu-action primary" type="button" @click="restart">再次捕获</button>
            <button class="menu-action" type="button" @click="goHome">返回首页</button>
          </div>
        </div>
      </div>
    </Transition>
  </GameContainer>
</template>

<style scoped>
.play-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 58px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 86px;
  padding: 12px 16px 12px;
  background: linear-gradient(90deg, rgba(4, 11, 19, 0.7), rgba(9, 26, 39, 0.54));
  box-shadow: inset 0 -1px 0 rgba(205, 239, 255, 0.08);
  pointer-events: none;
}

.pause-button,
.hud button {
  pointer-events: auto;
}

.pause-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 54px;
  height: 54px;
  border: 1px solid rgba(207, 234, 255, 0.18);
  background: rgba(1, 9, 16, 0.34);
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.28);
}

.pause-button span {
  width: 8px;
  height: 34px;
  border: 3px solid rgba(239, 249, 255, 0.75);
  box-sizing: border-box;
}

.hud-objective {
  min-width: 0;
  color: #fff;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.62);
}

.hud-objective span {
  display: block;
  font-size: clamp(18px, 4.8cqw, 30px);
  font-weight: 950;
  line-height: 1;
}

.hud-objective strong {
  display: block;
  margin-top: 4px;
  font-size: clamp(22px, 6cqw, 34px);
  line-height: 1;
  color: #eaff2d;
  font-variant-numeric: tabular-nums;
}

.hud-objective strong.urgent {
  color: #ff3d35;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

.hud-status {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.score-readout span {
  display: block;
  color: rgba(232, 247, 255, 0.62);
  font-size: 10px;
  font-weight: 900;
  text-align: right;
}

.score-readout strong {
  display: block;
  color: #fff;
  font-size: clamp(20px, 5cqw, 30px);
  line-height: 1;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.62);
}

.life-track {
  display: flex;
  gap: 4px;
}

.life-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ffd439;
  box-shadow: 0 0 8px rgba(255, 212, 57, 0.45);
}

.life-dot.empty {
  background: rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.shield-chip {
  padding: 2px 7px;
  background: rgba(27, 221, 214, 0.16);
  color: #c9ffff;
  font-size: 11px;
  font-weight: 950;
  box-shadow: inset 0 0 0 1px rgba(143, 255, 248, 0.32);
}

.canvas-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  touch-action: none;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 22px 26px;
  box-sizing: border-box;
  background: rgba(3, 10, 18, 0.68);
}

.countdown-number {
  color: #fff;
  font-size: clamp(92px, 24cqw, 142px);
  font-weight: 950;
  text-shadow:
    7px 7px 0 rgba(0, 0, 0, 0.72),
    0 0 34px rgba(199, 239, 255, 0.46);
  animation: countPop 0.5s ease-out;
}

.pause-overlay {
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
}

.pause-panel {
  width: 100%;
  min-height: 100%;
  padding: 98px clamp(26px, 7cqw, 56px) 36px;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(4, 12, 20, 0.84), rgba(3, 9, 16, 0.76));
}

.pause-title {
  margin-bottom: clamp(80px, 13cqh, 128px);
  color: #fff;
  font-size: clamp(42px, 12cqw, 70px);
  font-weight: 950;
  text-shadow: 6px 6px 0 rgba(0, 0, 0, 0.72);
}

.pause-menu {
  display: grid;
  gap: 18px;
  justify-items: center;
}

.pause-menu button,
.confirm-actions button,
.menu-action {
  min-height: 56px;
  border: 0;
  background: rgba(1, 7, 13, 0.58);
  color: #fff;
  font-size: clamp(30px, 8cqw, 52px);
  font-weight: 950;
  line-height: 1;
  text-shadow: 5px 5px 0 rgba(0, 0, 0, 0.72);
  cursor: pointer;
}

.pause-menu button {
  width: min(100%, 560px);
}

.confirm-panel {
  width: min(100%, 620px);
  margin: 38cqh auto 0;
  padding: 26px 20px 22px;
  background: rgba(1, 6, 11, 0.68);
  box-shadow: inset 0 1px 0 rgba(206, 238, 255, 0.2);
}

.confirm-panel p {
  margin: 0 0 28px;
  color: #fff;
  font-size: clamp(23px, 6cqw, 34px);
  font-weight: 950;
  line-height: 1.28;
  text-align: center;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.72);
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.confirm-actions button {
  font-size: clamp(28px, 7cqw, 44px);
}

.result-panel {
  width: min(100%, 560px);
  padding: 24px 20px 22px;
  background: rgba(1, 7, 13, 0.76);
  border-top: 2px solid rgba(208, 239, 255, 0.55);
  border-bottom: 1px solid rgba(208, 239, 255, 0.18);
  box-shadow: 14px 16px 0 rgba(0, 0, 0, 0.18);
}

.result-kicker {
  color: rgba(216, 239, 255, 0.58);
  font-size: 11px;
  font-weight: 900;
}

.result-title {
  margin-top: 4px;
  color: #fff;
  font-size: clamp(34px, 9cqw, 58px);
  font-weight: 950;
  line-height: 1;
  text-shadow: 5px 5px 0 rgba(0, 0, 0, 0.7);
}

.result-alert {
  margin-top: 12px;
  padding: 8px 10px;
  background: rgba(255, 212, 57, 0.12);
  color: #ffe76d;
  font-size: 15px;
  font-weight: 950;
  box-shadow: inset 3px 0 0 #ffd439;
}

.result-alert.archive {
  background: rgba(111, 218, 255, 0.12);
  color: #d9f7ff;
  box-shadow: inset 3px 0 0 #8beaff;
}

.result-score {
  margin-top: 12px;
  color: #fff;
  font-size: clamp(54px, 15cqw, 92px);
  font-weight: 950;
  line-height: 0.95;
  font-variant-numeric: tabular-nums;
  text-shadow:
    7px 7px 0 rgba(0, 0, 0, 0.72),
    0 0 28px rgba(205, 239, 255, 0.32);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 18px;
}

.stat-item {
  min-height: 70px;
  padding: 10px 8px;
  background: rgba(0, 0, 0, 0.32);
  box-sizing: border-box;
}

.stat-item span,
.stat-item strong {
  display: block;
  text-align: center;
}

.stat-item span {
  color: rgba(235, 247, 255, 0.6);
  font-size: 12px;
  font-weight: 900;
}

.stat-item strong {
  margin-top: 8px;
  color: #fff;
  font-size: 24px;
  line-height: 1;
  font-weight: 950;
}

.result-buttons {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.menu-action {
  width: 100%;
  font-size: clamp(24px, 7cqw, 38px);
  clip-path: polygon(10px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
  box-shadow: inset 0 2px 0 rgba(213, 246, 255, 0.65);
}

.menu-action.primary {
  box-shadow:
    inset 0 2px 0 rgba(255, 250, 205, 0.75),
    0 0 18px rgba(255, 212, 57, 0.14);
}

.combo-flash {
  position: absolute;
  top: 25%;
  left: 50%;
  z-index: 20;
  color: #ffd439;
  font-size: 38px;
  font-weight: 950;
  white-space: nowrap;
  text-shadow:
    4px 4px 0 rgba(0, 0, 0, 0.74),
    0 0 28px rgba(255, 212, 57, 0.45);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.combo-counter {
  position: absolute;
  top: 84px;
  left: 50%;
  z-index: 20;
  padding: 5px 12px;
  background: rgba(1, 8, 15, 0.62);
  color: #ffd439;
  font-size: 16px;
  font-weight: 950;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.62);
  pointer-events: none;
  transform: translateX(-50%);
}

@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.48;
  }
}

@keyframes countPop {
  from {
    transform: scale(1.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.24s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.combo-pop-enter-active {
  animation: comboIn 0.26s ease-out;
}

.combo-pop-leave-active {
  animation: comboOut 0.24s ease-in;
}

@keyframes comboIn {
  from {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes comboOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.3);
  }
}

@container game (max-width: 380px) {
  .hud {
    grid-template-columns: 50px 1fr auto;
    padding-left: 10px;
    padding-right: 10px;
  }

  .pause-button {
    width: 48px;
    height: 48px;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }
}
</style>
