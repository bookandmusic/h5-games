<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { gameStorage } from '../../stores/gameStorage'
import {
  ACHIEVEMENTS,
  getEndlessTopEntries,
  loadAchievementState,
  type AchievementDefinition,
} from './archive'
import type { AchievementState, GameMode, GameRecords } from './types'
import GameContainer from '../../components/GameContainer.vue'

const GAME_ID = 'star-catcher'
const nav = useGameNavigation(GAME_ID)

const mode = ref<GameMode>('timed')
const view = ref<'menu' | 'archive'>('menu')
const records = ref<GameRecords | null>(null)
const achievements = ref<AchievementState | null>(null)
const selectedAchievementId = ref(ACHIEVEMENTS[0].id)

const bgUrl = new URL('./assets/images/star-catcher-bg-wide.png', import.meta.url).href
const iconUrl = new URL('./assets/images/star-catcher-icon.png', import.meta.url).href

const selectedAchievement = computed(
  () =>
    ACHIEVEMENTS.find((achievement) => achievement.id === selectedAchievementId.value) ??
    ACHIEVEMENTS[0]
)

const recentEntries = computed(() => {
  if (!records.value) return []
  return getEndlessTopEntries(records.value.endless.history)
})

const recordSlots = computed(() =>
  Array.from({ length: 5 }, (_, index) => recentEntries.value[index] ?? null)
)

const bestScore = computed(() => {
  if (!records.value) return 0
  return Math.max(records.value.timed.highScore, records.value.endless.highScore)
})

function selectMode(nextMode: GameMode) {
  mode.value = nextMode
}

function startGame() {
  nav.goToPlay({ mode: mode.value })
}

function openArchive() {
  view.value = 'archive'
}

function closeArchive() {
  view.value = 'menu'
}

function selectAchievement(achievement: AchievementDefinition) {
  selectedAchievementId.value = achievement.id
}

function isUnlocked(achievement: AchievementDefinition) {
  return Boolean(achievements.value?.unlocked[achievement.id])
}

function getAchievementValue(achievement: AchievementDefinition) {
  return achievement.getValue(achievements.value?.progress ?? createEmptyProgress())
}

function getAchievementProgress(achievement: AchievementDefinition) {
  const value = getAchievementValue(achievement)
  return Math.min(100, Math.round((value / achievement.target) * 100))
}

function formatAchievementValue(achievement: AchievementDefinition) {
  const value = getAchievementValue(achievement)
  return achievement.formatValue ? achievement.formatValue(value) : value.toLocaleString()
}

function createEmptyProgress() {
  return {
    gamesPlayed: 0,
    bestScore: 0,
    bestCombo: 0,
    totalRareGems: 0,
    shieldBlocks: 0,
    noMeteorTimedClears: 0,
  }
}

async function loadArchiveData() {
  const [recordData, achievementData] = await Promise.all([
    gameStorage.loadGameState<GameRecords>(`${GAME_ID}-records`),
    loadAchievementState(),
  ])

  records.value = recordData
  achievements.value = achievementData
}

onMounted(() => {
  loadArchiveData()
})
</script>

<template>
  <GameContainer :bg-image="bgUrl">
    <div>
      <section v-if="view === 'menu'" class="menu-screen">
        <div class="brand-lockup">
          <img :src="iconUrl" alt="星际捕手" class="brand-mark" draggable="false" />
          <div class="brand-type">星际捕手</div>
          <div class="brand-stroke"></div>
        </div>

        <div class="menu-panel">
          <div class="mode-switch" role="group" aria-label="游戏模式">
            <button
              class="mode-chip"
              :class="{ active: mode === 'timed' }"
              type="button"
              @click="selectMode('timed')"
            >
              限时采集
            </button>
            <button
              class="mode-chip"
              :class="{ active: mode === 'endless' }"
              type="button"
              @click="selectMode('endless')"
            >
              无尽星雨
            </button>
          </div>

          <button class="command-button primary" type="button" @click="startGame">
            <span class="command-icon swirl"></span>
            <span>开始捕获</span>
          </button>
          <button class="command-button" type="button" @click="openArchive">
            <span class="command-icon badge"></span>
            <span>采集档案</span>
          </button>
          <button class="command-button" type="button" @click="nav.exitGame()">
            <span class="command-icon exit"></span>
            <span>退出</span>
          </button>
        </div>
      </section>

      <section v-else class="archive-screen">
        <header class="archive-header">
          <div>
            <div class="archive-kicker">STAR CATCHER FILE</div>
            <h1>采集档案</h1>
          </div>
          <button class="archive-back" type="button" @click="closeArchive">返回</button>
        </header>

        <div class="archive-summary">
          <div class="summary-metric">
            <span>最高捕获</span>
            <strong>{{ bestScore.toLocaleString() }}</strong>
          </div>
          <div class="summary-metric">
            <span>已解锁</span>
            <strong
              >{{ Object.keys(achievements?.unlocked ?? {}).length }}/{{
                ACHIEVEMENTS.length
              }}</strong
            >
          </div>
        </div>

        <div class="badge-grid" aria-label="成就徽章">
          <button
            v-for="achievement in ACHIEVEMENTS"
            :key="achievement.id"
            class="badge-node"
            :class="{
              unlocked: isUnlocked(achievement),
              selected: selectedAchievement.id === achievement.id,
            }"
            type="button"
            @click="selectAchievement(achievement)"
          >
            <span class="badge-icon">{{ achievement.icon }}</span>
            <span class="badge-name">{{ achievement.name }}</span>
          </button>
        </div>

        <div class="archive-detail">
          <div class="detail-copy">
            <span class="detail-status">{{
              isUnlocked(selectedAchievement) ? '档案已解锁' : '信号校准中'
            }}</span>
            <strong>{{ selectedAchievement.name }}</strong>
            <p>{{ selectedAchievement.condition }}</p>
          </div>
          <div class="detail-progress" aria-label="成就进度">
            <div class="progress-bar">
              <span :style="{ width: `${getAchievementProgress(selectedAchievement)}%` }"></span>
            </div>
            <div class="progress-value">
              {{ formatAchievementValue(selectedAchievement) }} / {{ selectedAchievement.target }}
            </div>
          </div>
        </div>

        <div class="record-deck">
          <div class="record-title">无尽高分记录</div>
          <div class="record-list" :class="{ empty: !recentEntries.length }">
            <div
              v-for="(entry, index) in recordSlots"
              :key="entry ? `${entry.date}-${entry.score}-${index}` : `empty-${index}`"
              class="record-strip"
              :class="{ vacant: !entry }"
            >
              <template v-if="entry">
                <span class="record-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <strong>{{ entry.score.toLocaleString() }}</strong>
                <span>{{ entry.modeLabel }}</span>
                <span>{{ entry.duration }}s</span>
              </template>
            </div>
          </div>
        </div>
      </section>
    </div>
  </GameContainer>
</template>

<style scoped>
.menu-screen,
.archive-screen {
  position: relative;
  min-height: 100%;
  padding: 0;
  box-sizing: border-box;
}

.menu-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-lockup {
  width: min(92cqw, 560px);
  margin-top: clamp(108px, 18cqh, 168px);
  text-align: center;
  filter: drop-shadow(8px 8px 0 rgba(3, 12, 22, 0.68));
}

.brand-mark {
  width: clamp(74px, 16cqw, 108px);
  aspect-ratio: 1;
  object-fit: contain;
  opacity: 0.96;
  filter: drop-shadow(0 0 18px rgba(166, 222, 255, 0.32));
}

.brand-type {
  margin-top: 4px;
  font-size: clamp(44px, 11cqw, 72px);
  font-weight: 950;
  line-height: 0.95;
  color: #f7fbff;
  text-shadow:
    4px 4px 0 #102435,
    0 0 18px rgba(203, 235, 255, 0.34);
}

.brand-stroke {
  width: min(78%, 390px);
  height: 8px;
  margin: 10px auto 0;
  border-top: 3px solid rgba(221, 246, 255, 0.88);
  border-bottom: 1px solid rgba(132, 208, 239, 0.78);
}

.menu-panel {
  width: min(92cqw, 390px);
  margin-top: auto;
  margin-bottom: clamp(104px, 16cqh, 170px);
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-chip {
  min-height: 44px;
  border: 1px solid rgba(178, 223, 244, 0.22);
  background: rgba(4, 13, 22, 0.58);
  color: rgba(235, 247, 255, 0.62);
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}

.mode-chip.active {
  color: #faffff;
  border-color: rgba(236, 250, 255, 0.85);
  box-shadow:
    inset 0 0 0 1px rgba(75, 201, 237, 0.36),
    0 0 18px rgba(75, 201, 237, 0.22);
}

.command-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  min-height: 72px;
  margin-top: 10px;
  padding: 0 26px;
  border: 1px solid rgba(162, 223, 248, 0.24);
  background: linear-gradient(180deg, rgba(2, 10, 18, 0.92), rgba(1, 7, 14, 0.86));
  color: #fff;
  font-size: clamp(25px, 7cqw, 36px);
  font-weight: 950;
  text-align: left;
  cursor: pointer;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.72);
  clip-path: polygon(12px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
  box-shadow:
    inset 0 3px 0 rgba(213, 246, 255, 0.82),
    inset 0 -3px 0 rgba(37, 96, 122, 0.42),
    8px 10px 0 rgba(0, 0, 0, 0.22);
}

.command-button:active {
  transform: translateY(2px);
}

.command-button.primary {
  border-color: rgba(222, 250, 255, 0.42);
}

.command-icon.swirl::before,
.command-icon.badge::before,
.command-icon.exit::before {
  position: absolute;
  inset: 5px;
  content: '';
  border: 5px solid #fff;
}

.command-icon.swirl::before {
  border-radius: 50%;
  border-left-color: transparent;
}

.command-icon.badge::before {
  transform: rotate(45deg);
}

.command-icon.exit::before {
  border-left: 0;
  border-bottom: 0;
  transform: rotate(45deg);
}

.archive-screen {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, rgba(4, 13, 22, 0.2), rgba(4, 10, 18, 0.34));
}

.archive-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 116px;
  margin: 0 calc(-1 * clamp(18px, 5cqw, 34px)) 0;
  padding: 0 clamp(28px, 7cqw, 56px) 24px;
  background: rgba(5, 16, 26, 0.64);
  box-shadow: inset 0 -1px 0 rgba(203, 233, 255, 0.08);
}

.archive-kicker {
  margin-bottom: 6px;
  color: rgba(197, 225, 242, 0.6);
  font-size: 11px;
  font-weight: 800;
}

.archive-header h1 {
  margin: 0;
  font-size: clamp(36px, 10cqw, 58px);
  line-height: 1;
  color: #fff;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.7);
}

.archive-back {
  min-width: 88px;
  min-height: 46px;
  border: 0;
  background: rgba(0, 0, 0, 0.28);
  color: #fff;
  font-size: 22px;
  font-weight: 950;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.65);
  cursor: pointer;
}

.archive-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.summary-metric {
  padding: 12px 14px;
  background: rgba(1, 8, 15, 0.58);
  border-top: 2px solid rgba(199, 239, 255, 0.55);
}

.summary-metric span {
  display: block;
  color: rgba(235, 247, 255, 0.58);
  font-size: 12px;
  font-weight: 800;
}

.summary-metric strong {
  display: block;
  margin-top: 3px;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  font-weight: 950;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  width: min(100%, 440px);
  margin: 2px auto 0;
  padding: 16px 8px;
}

.badge-node {
  min-height: 92px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(1, 6, 11, 0.58);
  color: rgba(255, 255, 255, 0.28);
  cursor: pointer;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.42);
}

.badge-node.unlocked {
  color: rgba(255, 255, 255, 0.86);
}

.badge-node.selected {
  border-color: #ffd439;
  box-shadow:
    inset 0 0 0 2px rgba(255, 212, 57, 0.68),
    0 0 20px rgba(255, 212, 57, 0.2);
}

.badge-icon {
  display: block;
  font-size: 34px;
  line-height: 1;
}

.badge-name {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 900;
}

.archive-detail {
  display: grid;
  gap: 12px;
  width: min(100%, 520px);
  margin: 0 auto;
  padding: 18px;
  background: rgba(1, 6, 11, 0.66);
  border-top: 1px solid rgba(207, 239, 255, 0.45);
  border-bottom: 1px solid rgba(207, 239, 255, 0.12);
}

.detail-status {
  display: block;
  color: #ffd439;
  font-size: 13px;
  font-weight: 950;
}

.detail-copy strong {
  display: block;
  margin-top: 4px;
  font-size: 24px;
  line-height: 1.1;
}

.detail-copy p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 16px;
  line-height: 1.45;
}

.progress-bar {
  height: 8px;
  overflow: hidden;
  background: #02070d;
}

.progress-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #e8f7ff, #ffd439);
}

.progress-value {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 800;
  text-align: right;
}

.record-deck {
  width: min(100%, 520px);
  margin: auto auto 0;
  padding-bottom: 4px;
}

.record-title {
  margin-bottom: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 950;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6);
}

.record-list {
  display: grid;
  gap: 8px;
}

.record-strip {
  display: grid;
  grid-template-columns: 34px 1fr auto auto;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 12px;
  background: rgba(1, 7, 13, 0.76);
  border-top: 1px solid rgba(199, 239, 255, 0.45);
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 800;
}

.record-strip.vacant {
  visibility: hidden;
}

.record-strip strong {
  color: #fff;
  font-size: 18px;
}

.record-index {
  color: #9fdcf4;
}

@container game (max-width: 380px) {
  .brand-type {
    font-size: 40px;
  }

  .command-button {
    min-height: 64px;
    font-size: 24px;
  }

  .badge-grid {
    gap: 10px;
  }

  .badge-node {
    min-height: 82px;
  }

  .record-strip {
    grid-template-columns: 28px 1fr auto;
  }

  .record-strip span:nth-child(4) {
    display: none;
  }
}
</style>
