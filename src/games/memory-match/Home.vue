<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { gameStorage } from '../../stores/gameStorage'
import type { BestScore, Difficulty, SavedData, ThemeId } from './types'
import { DEFAULT_DIFFICULTY, DEFAULT_THEME_ID, DIFFICULTIES, THEMES } from './themeConfig'
import { formatTime } from './gameLogic'
import { isBgmPlaying, playBgm, stopBgm, toggleBgm } from './soundManager'
import GameContainer from '../../components/GameContainer.vue'

const GAME_ID = 'memory-match'
type SettingsView = 'main' | 'theme' | 'difficulty'
const router = useRouter()
const nav = useGameNavigation(GAME_ID)

const difficulty = ref<Difficulty>(DEFAULT_DIFFICULTY)
const themeId = ref<ThemeId>(DEFAULT_THEME_ID)
const bestScores = ref<Partial<Record<Difficulty, BestScore>>>({})
const showSettings = ref(false)
const showRecords = ref(false)
const bgmOn = ref(false)
const settingsView = ref<SettingsView>('main')

const currentTheme = computed(() => THEMES.find((t) => t.id === themeId.value)!)
const bgUrl = computed(
  () =>
    new URL(`./assets/images/themes/${currentTheme.value.backgroundImage}`, import.meta.url).href
)
const trophyIconUrl = new URL('./assets/images/icon-trophy.png', import.meta.url).href
const gearIconUrl = new URL('./assets/images/icon-gear.png', import.meta.url).href
const cardTimeModeUrl = new URL('./assets/images/card-time-mode.png', import.meta.url).href

const themeStripModules = import.meta.glob('./assets/images/themes/strip-*.png', {
  eager: true,
}) as Record<string, { default: string }>
function getThemeStripUrl(themeId: string): string {
  return themeStripModules[`./assets/images/themes/strip-${themeId}.png`]?.default ?? ''
}

const bestRecordRows = computed(() =>
  (Object.entries(DIFFICULTIES) as Array<[Difficulty, (typeof DIFFICULTIES)[Difficulty]]>).map(
    ([key, cfg]) => ({
      key,
      label: cfg.label,
      record: bestScores.value[key],
    })
  )
)

function startGame() {
  router.push({
    path: `/game/${GAME_ID}/play`,
    query: { theme: themeId.value, difficulty: difficulty.value },
  })
}

function openSettings() {
  bgmOn.value = isBgmPlaying()
  settingsView.value = 'main'
  showSettings.value = true
}

function backToSettingsMain() {
  settingsView.value = 'main'
}

function selectTheme(nextThemeId: ThemeId) {
  themeId.value = nextThemeId
}

function selectDifficulty(nextDifficulty: Difficulty) {
  difficulty.value = nextDifficulty
}

function toggleHomeBgm() {
  if (isBgmPlaying()) {
    bgmOn.value = toggleBgm()
    return
  }

  playBgm(themeId.value)
  bgmOn.value = true
}

function exitGame() {
  stopBgm()
  nav.exitGame()
}

async function loadData() {
  const saved = await gameStorage.loadGameState<SavedData>(GAME_ID)
  if (saved) {
    bestScores.value = saved.best || {}
    themeId.value = saved.stats?.lastTheme || DEFAULT_THEME_ID
  }
}

onMounted(() => {
  bgmOn.value = isBgmPlaying()
  loadData()
})

onUnmounted(() => {
  stopBgm()
})
</script>

<template>
  <GameContainer :bg-image="bgUrl">
    <div class="home">
      <div class="top-tools" aria-label="游戏菜单">
        <button class="badge-btn" type="button" aria-label="历史最佳" @click="showRecords = true">
          <span class="badge-body">
            <img :src="trophyIconUrl" alt="" class="badge-icon" draggable="false" />
          </span>
          <span class="badge-ribbon" aria-hidden="true" />
        </button>

        <button class="badge-btn" type="button" aria-label="设置" @click="openSettings">
          <span class="badge-body">
            <img :src="gearIconUrl" alt="" class="badge-icon" draggable="false" />
          </span>
          <span class="badge-ribbon" aria-hidden="true" />
        </button>
      </div>

      <main class="home-stage">
        <div class="game-title" aria-label="记忆翻牌">
          <span>记忆翻牌</span>
        </div>

        <button class="mode-card" type="button" @click="startGame">
          <img class="mode-card-img" :src="cardTimeModeUrl" alt="时间模式" draggable="false" />
        </button>
      </main>

      <Transition name="fade">
        <div v-if="showSettings" class="modal-layer menu-layer" @click.self="showSettings = false">
          <div
            class="menu-panel"
            :class="{ 'menu-panel-compact': settingsView !== 'main' }"
            role="dialog"
            aria-modal="true"
            aria-label="设置菜单"
          >
            <template v-if="settingsView === 'main'">
              <button class="menu-item" type="button" @click="settingsView = 'theme'">
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="13.5" cy="6.5" r=".5" />
                    <circle cx="17.5" cy="10.5" r=".5" />
                    <circle cx="8.5" cy="7.5" r=".5" />
                    <circle cx="6.5" cy="12.5" r=".5" />
                    <path
                      d="M12 2C6.5 2 2 5.8 2 10.5S5.8 19 10.5 19H12a2 2 0 0 1 2 2 1 1 0 0 0 1 1c3.9-1.2 7-4.8 7-9.5C22 6.7 17.5 2 12 2Z"
                    />
                  </svg>
                </span>
                <span class="menu-label">主题选择</span>
              </button>

              <button class="menu-item" type="button" @click="settingsView = 'difficulty'">
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m13 2-9 13h7l-1 7 9-13h-7Z" />
                  </svg>
                </span>
                <span class="menu-label">难度选择</span>
              </button>

              <button class="menu-item" type="button" @click="toggleHomeBgm">
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    v-if="bgmOn"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="22" y1="9" x2="17" y2="14" />
                    <line x1="17" y1="9" x2="22" y2="14" />
                  </svg>
                </span>
                <span class="menu-label">音乐音效</span>
              </button>

              <button class="menu-item" type="button" @click="exitGame">
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                <span class="menu-label">退出游戏</span>
              </button>

              <button class="menu-item" type="button" @click="showSettings = false">
                <span class="menu-icon play-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="7 4 20 12 7 20 7 4" />
                  </svg>
                </span>
                <span class="menu-label">继续</span>
              </button>
            </template>

            <template v-else-if="settingsView === 'theme'">
              <button class="menu-item menu-item-compact" type="button" @click="backToSettingsMain">
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </span>
                <span class="menu-label">返回</span>
                <span class="menu-check" aria-hidden="true"></span>
              </button>

              <button
                v-for="theme in THEMES"
                :key="theme.id"
                class="menu-item menu-item-compact menu-item-strip"
                :class="{ selected: theme.id === themeId }"
                :style="{
                  backgroundImage: `url(${getThemeStripUrl(theme.id)})`,
                  borderColor: theme.accentColor,
                }"
                type="button"
                @click="selectTheme(theme.id)"
              >
                <span class="menu-label">{{ theme.name }}</span>
                <span
                  class="menu-check"
                  :style="{ visibility: theme.id === themeId ? 'visible' : 'hidden' }"
                  aria-hidden="true"
                  >✓</span
                >
              </button>
            </template>

            <template v-else>
              <button class="menu-item menu-item-compact" type="button" @click="backToSettingsMain">
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </span>
                <span class="menu-label">返回</span>
                <span class="menu-check" aria-hidden="true"></span>
              </button>

              <button
                v-for="(cfg, key) in DIFFICULTIES"
                :key="key"
                class="menu-item menu-item-compact"
                :class="{ selected: difficulty === key }"
                type="button"
                @click="selectDifficulty(key as Difficulty)"
              >
                <span class="menu-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m13 2-9 13h7l-1 7 9-13h-7Z" />
                  </svg>
                </span>
                <span class="menu-label">{{ cfg.label }}</span>
                <span
                  class="menu-check"
                  :style="{ visibility: difficulty === key ? 'visible' : 'hidden' }"
                  aria-hidden="true"
                  >✓</span
                >
              </button>
            </template>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="showRecords" class="modal-layer records-layer" @click.self="showRecords = false">
          <section class="records-card" role="dialog" aria-modal="true" aria-label="历史最佳">
            <header class="records-header">
              <span class="records-title">历史最佳</span>
              <button
                class="records-close"
                type="button"
                aria-label="关闭历史最佳"
                @click="showRecords = false"
              >
                ×
              </button>
            </header>

            <div class="records-body">
              <div class="records-inner">
                <div v-for="row in bestRecordRows" :key="row.key" class="record-row">
                  <span class="record-difficulty">{{ row.label }}</span>
                  <span v-if="row.record" class="record-value">
                    {{ formatTime(row.record.time) }} / {{ row.record.moves }} 次
                  </span>
                  <span v-else class="record-empty">暂无记录</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </div>
  </GameContainer>
</template>

<style scoped>
.home {
  height: 100%;
  position: relative;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.top-tools {
  position: absolute;
  top: 16px;
  left: clamp(14px, 4cqw, 44px);
  display: flex;
  gap: clamp(18px, 4cqw, 44px);
  z-index: 3;
}

.badge-btn {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  transition: transform 0.14s ease;
  -webkit-tap-highlight-color: transparent;
}

.badge-btn:active {
  transform: translateY(4px) scale(0.97);
}

.badge-body {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(58px, 14cqw, 130px);
  height: clamp(58px, 14cqw, 130px);
  border: 4px solid #d4a574;
  border-radius: clamp(12px, 2.5cqw, 22px);
  background:
    radial-gradient(circle at 40% 30%, rgba(180, 140, 100, 0.12), transparent 70%),
    linear-gradient(170deg, #8d6e63 0%, #6d4c41 50%, #5d4037 100%);
  box-shadow:
    inset 0 -3px 0 rgba(255, 255, 255, 0.08),
    inset 0 3px 6px rgba(0, 0, 0, 0.35),
    0 6px 12px rgba(30, 50, 40, 0.25);
  position: relative;
  transition:
    box-shadow 0.14s ease,
    transform 0.14s ease;
}

.badge-btn:active .badge-body {
  box-shadow:
    inset 0 -3px 0 rgba(255, 255, 255, 0.06),
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 3px 6px rgba(30, 50, 40, 0.18);
  transform: scale(0.97);
}

.badge-ribbon {
  display: block;
  width: clamp(34px, 8cqw, 78px);
  height: clamp(24px, 5cqw, 44px);
  background: #4fc3f7;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 50%, 0 100%);
  margin-top: -2px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
}

.badge-icon {
  width: 80%;
  height: 80%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
}

.home-stage {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: clamp(120px, 18cqh, 240px);
}

.game-title {
  font-size: clamp(36px, 9cqw, 96px);
  font-weight: 900;
  line-height: 1.08;
  color: #fff;
  text-align: center;
  margin: 0 0 clamp(48px, 7cqh, 96px);
  text-shadow:
    0 -5px 0 #b2ebf2,
    5px 0 0 #b2ebf2,
    0 5px 0 #80deea,
    -5px 0 0 #b2ebf2,
    4px 4px 0 #80deea,
    -4px 4px 0 #80deea,
    4px -4px 0 #b2ebf2,
    -4px -4px 0 #b2ebf2,
    0 0 18px rgba(128, 222, 234, 0.7),
    0 10px 16px rgba(20, 80, 70, 0.22);
}

.mode-card {
  width: min(100%, clamp(280px, 40cqw, 420px));
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border-radius: 8px;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.mode-card:active {
  transform: translateY(2px);
}

.mode-card-img {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  user-select: none;
}

.modal-layer {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(16, 45, 43, 0.52);
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
}

.menu-layer {
  align-items: center;
  justify-content: center;
}

.menu-panel {
  width: min(100%, 480px);
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(24px, 4cqh, 26px);
  padding-bottom: 8px;
}

.menu-panel-compact {
  gap: clamp(12px, 2cqh, 18px);
}

.menu-item {
  min-height: clamp(40px, 6.5cqh, 52px);
  width: 100%;
  max-width: 80cqw;
  display: flex;
  align-items: center;
  gap: clamp(14px, 3cqw, 18px);
  padding: clamp(8px, 1.2cqh, 12px) clamp(30px, 7cqw, 40px);
  border: clamp(5px, 0.8cqw, 6px) solid #eda84f;
  border-radius: 24px;
  background: linear-gradient(180deg, #fff5db 0%, #ffe2a9 100%);
  box-shadow:
    0 8px 0 #815125,
    0 13px 20px rgba(19, 47, 39, 0.3),
    inset 0 3px 0 rgba(255, 255, 255, 0.84);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.menu-item-compact {
  min-height: clamp(38px, 5cqh, 48px);
  gap: clamp(12px, 2.5cqw, 18px);
  padding: clamp(8px, 1.2cqh, 12px) clamp(22px, 5cqw, 40px);
}

.menu-item-compact .menu-icon {
  width: clamp(38px, 8cqw, 44px);
  height: clamp(38px, 8cqw, 44px);
}

.menu-item:active {
  transform: translateY(5px) scale(0.985);
  box-shadow:
    0 3px 0 #815125,
    0 7px 12px rgba(19, 47, 39, 0.24),
    inset 0 3px 0 rgba(255, 255, 255, 0.72);
}

.menu-icon {
  width: clamp(38px, 8cqw, 44px);
  height: clamp(38px, 8cqw, 44px);
  color: #8a3f15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon svg {
  width: 100%;
  height: 100%;
}

.play-mark {
  width: clamp(48px, 8cqw, 44px);
}

.menu-item-strip {
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.menu-item-strip::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.7),
    rgba(0, 0, 0, 0.25) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.menu-item-strip .menu-label,
.menu-item-strip .menu-check {
  position: relative;
  z-index: 1;
}

.menu-label {
  flex: 1;
  color: #fff;
  font-size: clamp(22px, 6cqw, 32px);
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 -2px 0 #9b682d,
    2px 0 0 #9b682d,
    0 2px 0 #9b682d,
    -2px 0 0 #9b682d,
    2px 2px 0 #9b682d,
    -2px 2px 0 #9b682d,
    2px -2px 0 #9b682d,
    -2px -2px 0 #9b682d,
    0 6px 0 rgba(98, 52, 22, 0.12);
}

.menu-check {
  width: clamp(24px, 5cqw, 30px);
  color: #8a3f15;
  font-size: clamp(20px, 5cqw, 28px);
  font-weight: 900;
  line-height: 1;
  text-align: right;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.records-card {
  width: min(100%, 812px);
  border-radius: 32px;
  overflow: hidden;
  background: #fee8c1;
  box-shadow:
    0 12px 0 rgba(107, 67, 32, 0.25),
    0 24px 48px rgba(17, 48, 42, 0.36);
}

.records-header {
  min-height: clamp(80px, 13cqh, 126px);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d36e46;
  border: 3px solid rgba(255, 218, 171, 0.45);
  border-bottom: 0;
  border-radius: 32px 32px 0 0;
  overflow: hidden;
}

.records-title {
  color: #fff;
  font-size: clamp(30px, 8cqw, 60px);
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 3px 0 rgba(129, 69, 38, 0.28);
}

.records-close {
  position: absolute;
  right: clamp(24px, 6cqw, 52px);
  top: 50%;
  width: 54px;
  height: 54px;
  transform: translateY(-50%);
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 58px;
  line-height: 44px;
  font-weight: 900;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.records-body {
  min-height: clamp(300px, 49cqh, 610px);
  padding: clamp(28px, 5cqh, 44px) clamp(22px, 5cqw, 36px);
  background: #fee8c1;
}

.records-inner {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.record-row {
  min-height: clamp(60px, 9cqh, 92px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 12px clamp(18px, 5cqw, 32px);
  border-radius: 18px;
  background: rgba(255, 252, 238, 0.86);
  box-shadow:
    inset 0 0 0 3px rgba(212, 121, 54, 0.12),
    0 5px 0 rgba(148, 84, 37, 0.16);
}

.record-difficulty {
  color: #8a3f15;
  font-size: clamp(18px, 4.5cqw, 30px);
  font-weight: 900;
  flex-shrink: 0;
}

.record-value,
.record-empty {
  color: #9b6b37;
  font-size: clamp(14px, 3.5cqw, 24px);
  font-weight: 900;
  text-align: right;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@container game (max-width: 430px) {
  .top-tools {
    top: 12px;
    left: 12px;
    gap: 14px;
  }

  .badge-body {
    width: 58px;
    height: 58px;
    border-width: 3px;
    border-radius: 12px;
  }

  .badge-ribbon {
    width: 40px;
    height: 18px;
  }

  .home-stage {
    padding-top: 144px;
  }

  .game-title {
    margin-bottom: 42px;
  }

  .mode-card {
    width: min(100%, 280px);
  }

  .records-card {
    border-radius: 24px;
  }

  .menu-panel {
    width: min(100%, 360px);
    gap: 22px;
  }

  .menu-panel-compact {
    gap: 12px;
  }

  .menu-item {
    gap: 12px;
    min-height: 54px;
    padding: 8px 22px;
  }

  .menu-icon {
    width: 38px;
    height: 38px;
  }

  .menu-label {
    font-size: 26px;
    text-shadow:
      0 -1.5px 0 #9b682d,
      1.5px 0 0 #9b682d,
      0 1.5px 0 #9b682d,
      -1.5px 0 0 #9b682d,
      1.5px 1.5px 0 #9b682d,
      -1.5px 1.5px 0 #9b682d,
      1.5px -1.5px 0 #9b682d,
      -1.5px -1.5px 0 #9b682d,
      0 5px 0 rgba(98, 52, 22, 0.12);
  }

  .menu-item-compact .menu-label {
    font-size: 22px;
  }

  .menu-check {
    width: 24px;
    font-size: 26px;
  }
}

@container game (min-width: 800px) {
  .menu-panel {
    width: min(100%, 480px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge-btn,
  .badge-body,
  .mode-card,
  .menu-item,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
