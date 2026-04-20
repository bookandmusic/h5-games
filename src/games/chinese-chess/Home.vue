<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'

import { gameStorage } from '../../stores/gameStorage'
import { createInitialBoard } from './engine'
import { musicManager } from './musicManager'
import { settingsStore } from './settingsStore'
import type { MatchConfig, MatchState } from './types'

const router = useRouter()
const GAME_ID = 'chinese-chess'

const defaultConfig: MatchConfig = {
  mode: 'ai',
  difficulty: 'medium',
  humanSide: 'red',
  startingSide: 'red',
}

const showSetupModal = ref(false)
const setupMode = ref<'ai' | 'local'>('ai')
const draftConfig = ref<MatchConfig>({ ...defaultConfig })
const loaded = ref(false)
const localResumeAvailable = ref(false)

const localModeLabel = computed(() => (localResumeAvailable.value ? '继续双人对战' : '双人对战'))
const localModeDesc = computed(() =>
  localResumeAvailable.value ? '发现存档，点击继续' : '同屏对弈，支持存档'
)
const setupSummary = computed(() => {
  if (setupMode.value === 'local') {
    return ['双人同屏', draftConfig.value.startingSide === 'red' ? '红方先手' : '黑方先手']
  }

  return [
    draftConfig.value.difficulty === 'easy'
      ? '简单'
      : draftConfig.value.difficulty === 'medium'
        ? '普通'
        : '困难',
    draftConfig.value.humanSide === 'red' ? '你执红方' : '你执黑方',
    draftConfig.value.startingSide === 'red' ? '红方先手' : '黑方先手',
  ]
})
const setupActionLabel = computed(() =>
  setupMode.value === 'ai' ? '开始人机对战' : '开始双人对局'
)

const refreshLocalResumeStatus = async () => {
  const saved = await gameStorage.loadGameState<MatchState>(GAME_ID + '-local')
  localResumeAvailable.value = Boolean(saved && saved.winner === null)
  return saved
}

const handleAiMode = async () => {
  setupMode.value = 'ai'
  draftConfig.value = { ...defaultConfig, mode: 'ai' }
  showSetupModal.value = true
}

const handleLocalMode = async () => {
  const saved = await refreshLocalResumeStatus()
  if (saved && saved.winner === null) {
    await gameStorage.saveGameState(GAME_ID + '-pending', {
      mode: 'local',
      resume: true,
    })
    router.push(`/game/${GAME_ID}/play`)
  } else {
    setupMode.value = 'local'
    draftConfig.value = { ...defaultConfig, mode: 'local' }
    showSetupModal.value = true
  }
}

const goToSettings = () => {
  router.push(`/game/${GAME_ID}/settings`)
}

const closeSetupModal = () => {
  showSetupModal.value = false
}

const startGame = async () => {
  const stateKey = setupMode.value === 'ai' ? GAME_ID : GAME_ID + '-local'
  const state: MatchState = {
    board: createInitialBoard(),
    currentTurn: draftConfig.value.startingSide,
    winner: null,
    config: { ...draftConfig.value, mode: setupMode.value },
    moveCount: 0,
  }
  await gameStorage.saveGameState(stateKey, state)
  await gameStorage.saveGameState(GAME_ID + '-pending', {
    mode: setupMode.value,
    resume: false,
  })
  if (setupMode.value === 'local') {
    localResumeAvailable.value = true
  }
  showSetupModal.value = false
  router.push(`/game/${GAME_ID}/play`)
}

onMounted(async () => {
  await settingsStore.load()
  await refreshLocalResumeStatus()
  musicManager.play('01')
  loaded.value = true
})
</script>

<template>
  <div v-if="loaded" class="home-page">
    <div class="home-content">
      <div class="game-logo">
        <div class="logo-piece red">
          <span>帥</span>
        </div>
        <div class="logo-piece black">
          <span>將</span>
        </div>
      </div>
      <h1 class="game-title">中国象棋</h1>
      <p class="game-subtitle">楚河汉界，纵横捭阖</p>

      <div class="menu-list">
        <button class="menu-item" aria-label="开始人机对战" @click="handleAiMode">
          <div class="menu-icon">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="menu-text">
            <span class="menu-label">人机对战</span>
            <span class="menu-desc">与 AI 对弈，可选择难度</span>
          </div>
          <svg
            class="menu-arrow"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          class="menu-item"
          :class="{ resumable: localResumeAvailable }"
          :aria-label="localResumeAvailable ? '继续双人对战' : '开始双人对战'"
          @click="handleLocalMode"
        >
          <div class="menu-icon">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div class="menu-text">
            <div class="menu-title-row">
              <span class="menu-label">{{ localModeLabel }}</span>
              <span v-if="localResumeAvailable" class="menu-badge">继续</span>
            </div>
            <span class="menu-desc">{{ localModeDesc }}</span>
          </div>
          <svg
            class="menu-arrow"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button class="menu-item utility" aria-label="打开中国象棋设置" @click="goToSettings">
          <div class="menu-icon">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.156-.43 1.962 1.026 1.572 2.137a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.43 1.156-1.026 1.962-2.137 1.572a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.156.43-1.962-1.026-1.572-2.137a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.43-1.156 1.026-1.962 2.137-1.572a1.724 1.724 0 002.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div class="menu-text">
            <span class="menu-label">游戏设置</span>
            <span class="menu-desc">音效、显示等选项</span>
          </div>
          <svg
            class="menu-arrow"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <footer class="home-footer">
      <p class="footer-text">传统棋类 · 策略对战</p>
    </footer>

    <div v-if="showSetupModal" class="modal-overlay" @click.self="closeSetupModal">
      <div
        class="setup-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'setup-modal-title'"
        :aria-describedby="'setup-modal-desc'"
      >
        <header class="modal-header">
          <h2 id="setup-modal-title" class="modal-title">
            {{ setupMode === 'ai' ? '人机对战' : '双人对战' }}
          </h2>
          <button class="modal-close" aria-label="关闭开局设置" @click="closeSetupModal">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <p id="setup-modal-desc" class="modal-intro">
            {{
              setupMode === 'ai'
                ? '选择对局难度与执子方，然后开始棋局。'
                : '确认先手方后开始同屏对战。'
            }}
          </p>
          <div class="setup-summary-card">
            <span class="summary-label">当前配置</span>
            <div class="summary-chips">
              <span v-for="item in setupSummary" :key="item" class="summary-chip">{{ item }}</span>
            </div>
          </div>
          <section v-if="setupMode === 'ai'" class="settings-section">
            <h3 class="section-title">难度等级</h3>
            <p class="section-note">只在人机模式下出现，难度越高 AI 思考更久。</p>
            <div class="option-grid three-col">
              <button
                class="option-btn compact"
                :class="{ active: draftConfig.difficulty === 'easy' }"
                :aria-pressed="draftConfig.difficulty === 'easy'"
                @click="draftConfig.difficulty = 'easy'"
              >
                <span class="option-label">简单</span>
              </button>
              <button
                class="option-btn compact"
                :class="{ active: draftConfig.difficulty === 'medium' }"
                :aria-pressed="draftConfig.difficulty === 'medium'"
                @click="draftConfig.difficulty = 'medium'"
              >
                <span class="option-label">普通</span>
              </button>
              <button
                class="option-btn compact"
                :class="{ active: draftConfig.difficulty === 'hard' }"
                :aria-pressed="draftConfig.difficulty === 'hard'"
                @click="draftConfig.difficulty = 'hard'"
              >
                <span class="option-label">困难</span>
              </button>
            </div>
          </section>

          <section v-if="setupMode === 'ai'" class="settings-section">
            <h3 class="section-title">执子方</h3>
            <p class="section-note">选择你控制的阵营，棋盘会自动调整朝向。</p>
            <div class="option-grid two-col">
              <button
                class="option-btn"
                :class="{ active: draftConfig.humanSide === 'red' }"
                :aria-pressed="draftConfig.humanSide === 'red'"
                @click="draftConfig.humanSide = 'red'"
              >
                <span class="option-label red">红方</span>
              </button>
              <button
                class="option-btn"
                :class="{ active: draftConfig.humanSide === 'black' }"
                :aria-pressed="draftConfig.humanSide === 'black'"
                @click="draftConfig.humanSide = 'black'"
              >
                <span class="option-label black">黑方</span>
              </button>
            </div>
          </section>

          <section class="settings-section">
            <h3 class="section-title">先手方</h3>
            <p class="section-note">先手决定首回合由哪一方开始行动。</p>
            <div class="option-grid two-col">
              <button
                class="option-btn"
                :class="{ active: draftConfig.startingSide === 'red' }"
                :aria-pressed="draftConfig.startingSide === 'red'"
                @click="draftConfig.startingSide = 'red'"
              >
                <span class="option-label red">红方先手</span>
              </button>
              <button
                class="option-btn"
                :class="{ active: draftConfig.startingSide === 'black' }"
                :aria-pressed="draftConfig.startingSide === 'black'"
                @click="draftConfig.startingSide = 'black'"
              >
                <span class="option-label black">黑方先手</span>
              </button>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="modal-btn secondary" @click="closeSetupModal">取消</button>
          <button class="modal-btn primary" @click="startGame">{{ setupActionLabel }}</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  --bg-deep: #1a0f0a;
  --bg-surface: #2d1810;
  --bg-card: #3d2518;
  --accent-gold: #c9a227;
  --accent-red: #b91c1c;
  --text-primary: #f5e6d3;
  --text-secondary: #a8927a;

  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 30% 0%, rgba(201, 162, 39, 0.12), transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(185, 28, 28, 0.08), transparent 50%),
    linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-surface) 50%, var(--bg-deep) 100%);
  color: var(--text-primary);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.home-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.game-logo {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.logo-piece {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.logo-piece.red {
  background: linear-gradient(135deg, #fef3e2, #f5d5b8);
  border: 3px solid var(--accent-red);
  color: var(--accent-red);
}

.logo-piece.black {
  background: linear-gradient(135deg, #4a4a4f, #353538);
  border: 3px solid #1f1f22;
  color: #c9a227;
}

.game-title {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.05em;
}

.game-subtitle {
  margin: 0 0 40px;
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
}

.menu-list {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(201, 162, 39, 0.15);
  border-radius: 16px;
  background: var(--bg-card);
  cursor: pointer;
  transition:
    transform 150ms ease,
    background 150ms ease,
    border-color 150ms ease;
}

.menu-item:active {
  transform: scale(0.98);
}

.menu-item.resumable {
  border-color: rgba(185, 28, 28, 0.3);
  background: linear-gradient(135deg, rgba(185, 28, 28, 0.12), rgba(61, 37, 24, 0.92));
}

.menu-item.utility {
  opacity: 0.84;
}

.menu-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(201, 162, 39, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-gold);
}

.menu-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.menu-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.menu-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(185, 28, 28, 0.18);
  color: #fbd5d5;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.menu-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.menu-arrow {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.home-footer {
  flex-shrink: 0;
  padding: 16px;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 15, 10, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  min-height: 100dvh;
  overflow-y: auto;
  z-index: 100;
}

.setup-modal {
  width: min(100%, 340px);
  max-height: calc(100dvh - 48px);
  border-radius: 20px;
  border: 2px solid rgba(201, 162, 39, 0.25);
  background:
    linear-gradient(180deg, rgba(61, 37, 24, 0.98), rgba(45, 24, 16, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(201, 162, 39, 0.1), transparent 60%);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(201, 162, 39, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-gold);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(201, 162, 39, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:active {
  background: rgba(201, 162, 39, 0.2);
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-summary-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(201, 162, 39, 0.08);
  border: 1px solid rgba(201, 162, 39, 0.16);
}

.summary-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent-gold);
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(61, 37, 24, 0.92);
  border: 1px solid rgba(201, 162, 39, 0.2);
  color: #f5e6d3;
  font-size: 12px;
  font-weight: 600;
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.section-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(168, 146, 122, 0.92);
}

.option-grid {
  display: grid;
  gap: 8px;
}

.two-col {
  grid-template-columns: repeat(2, 1fr);
}

.three-col {
  grid-template-columns: repeat(3, 1fr);
}

.option-btn {
  border: 1px solid rgba(201, 162, 39, 0.15);
  border-radius: 12px;
  background: var(--bg-card);
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 150ms ease,
    background 150ms ease,
    border-color 150ms ease;
}

.option-btn:active {
  transform: scale(0.97);
}

.option-btn.active {
  background: linear-gradient(180deg, rgba(201, 162, 39, 0.18), rgba(201, 162, 39, 0.12));
  border-color: var(--accent-gold);
}

.option-btn.compact {
  padding: 8px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
}

.option-label.red {
  color: var(--accent-red);
}

.option-label.black {
  color: #64748b;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(201, 162, 39, 0.15);
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 150ms ease,
    background 150ms ease;
}

.modal-close svg {
  display: block;
  flex-shrink: 0;
}

.modal-btn:active {
  transform: scale(0.96);
}

.modal-btn.primary {
  background: linear-gradient(180deg, var(--accent-gold), #a68520);
  color: #fff8e8;
  box-shadow: 0 2px 8px rgba(201, 162, 39, 0.3);
}

.modal-btn.secondary {
  background: rgba(201, 162, 39, 0.12);
  border: 1px solid rgba(201, 162, 39, 0.25);
  color: var(--accent-gold);
}
</style>
