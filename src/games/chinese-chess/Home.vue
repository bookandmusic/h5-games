<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useGameNavigation } from '../../composables/useGameNavigation'
import { settingsStore } from './audio/settingsStore'
import {
  type ChineseChessProfile,
  createDefaultProfile,
  loadProfile,
  resetDailyIfNewDay,
  saveProfile,
  SHOP_PRICES,
} from './store/save'
import { getRankTitle } from './constants'
import DialogBtn from './components/DialogBtn.vue'
import type { GameMode } from './types'
import GameContainer from '../../components/GameContainer.vue'

function imgUrl(name: string): string {
  return new URL(`./assets/images/${name}`, import.meta.url).href
}

const GAME_ID = 'chinese-chess'
const nav = useGameNavigation(GAME_ID)

const profile = ref<ChineseChessProfile>(createDefaultProfile())
const coins = computed(() => profile.value.coins)
const inventory = computed(() => profile.value.inventory)

const showShop = ref(false)
const showProfile = ref(false)
const showTasks = ref(false)
const activeTab = ref<'battle' | 'shop'>('battle')

const openShop = () => {
  showShop.value = true
  activeTab.value = 'shop'
}
const closeShop = () => {
  showShop.value = false
  activeTab.value = 'battle'
}

const relogProfile = async () => {
  profile.value = await loadProfile()
  resetDailyIfNewDay(profile.value)
  await saveProfile(profile.value)
}

const buyItem = async (item: 'undo' | 'hint') => {
  const price = SHOP_PRICES[item]
  if (profile.value.coins < price) return
  profile.value.coins -= price
  profile.value.inventory[item] += 1
  await saveProfile(profile.value)
}

const enterMode = (mode: GameMode) => {
  nav.goToPlay({ mode })
}

const levelTitle = computed(() => `${profile.value.level} · ${getRankTitle(profile.value.level)}`)
const winRate = computed(() => {
  if (profile.value.totalGames === 0) return '--'
  return ((profile.value.totalWins / profile.value.totalGames) * 100).toFixed(1) + '%'
})

const soundOn = computed(() => settingsStore.sfxEnabled || settingsStore.musicEnabled)

const toggleSound = () => {
  settingsStore.toggleAll()
}

const claimLogin = async () => {
  if (profile.value.daily.loginClaimed) return
  profile.value.coins += 30
  profile.value.daily.loginClaimed = true
  await saveProfile(profile.value)
}

const claimTask = async (taskId: 'playGame' | 'winGame' | 'winStreak') => {
  const task = profile.value.daily.tasks[taskId]
  if (!task.completed || task.claimed) return
  const rewards: Record<string, number> = { playGame: 10, winGame: 20, winStreak: 25 }
  profile.value.coins += rewards[taskId]
  task.claimed = true
  await saveProfile(profile.value)
}

const todayTasks = computed(() => {
  const d = profile.value.daily
  return [
    {
      id: 'login',
      label: '每日签到',
      icon: imgUrl('task-sign.png'),
      progress: d.loginClaimed ? 1 : 0,
      target: 1,
      completed: d.loginClaimed,
      claimed: d.loginClaimed,
      reward: 30,
      canClaim: !d.loginClaimed,
      onClaim: claimLogin,
    },
    {
      id: 'playGame',
      label: '完成1局对局',
      icon: imgUrl('task-chess.png'),
      progress: d.tasks.playGame.progress,
      target: d.tasks.playGame.target,
      completed: d.tasks.playGame.completed,
      claimed: d.tasks.playGame.claimed,
      reward: 10,
      canClaim: d.tasks.playGame.completed && !d.tasks.playGame.claimed,
      onClaim: () => claimTask('playGame'),
    },
    {
      id: 'winGame',
      label: '获胜1局',
      icon: imgUrl('task-trophy.png'),
      progress: d.tasks.winGame.progress,
      target: d.tasks.winGame.target,
      completed: d.tasks.winGame.completed,
      claimed: d.tasks.winGame.claimed,
      reward: 20,
      canClaim: d.tasks.winGame.completed && !d.tasks.winGame.claimed,
      onClaim: () => claimTask('winGame'),
    },
    {
      id: 'winStreak',
      label: '连胜2局',
      icon: imgUrl('task-streak.png'),
      progress: d.tasks.winStreak.progress,
      target: d.tasks.winStreak.target,
      completed: d.tasks.winStreak.completed,
      claimed: d.tasks.winStreak.claimed,
      reward: 25,
      canClaim: d.tasks.winStreak.completed && !d.tasks.winStreak.claimed,
      onClaim: () => claimTask('winStreak'),
    },
  ]
})

onMounted(() => {
  relogProfile()
})
</script>

<template>
  <GameContainer>
    <div class="home">
      <div class="top-bar">
        <div class="plaque-outer c-mask">
          <button class="plaque-body c-mask" @click="showProfile = true">
            <div class="player-avatar">
              <span class="avatar-inner">弈</span>
            </div>
            <div class="player-info">
              <span class="player-level-title">{{ levelTitle }}</span>
              <span class="player-coins">
                <img class="coin-img" src="./assets/images/coin.png" alt="" />
                {{ coins }}
              </span>
            </div>
          </button>
        </div>
        <div class="top-actions">
          <button class="icon-btn-plain" @click="showTasks = true" title="任务">
            <img class="icon-plain" src="./assets/images/icon-task.png" alt="任务" />
          </button>
          <button
            class="icon-btn-plain"
            :class="{ muted: !soundOn }"
            @click="toggleSound"
            :title="soundOn ? '关闭音效' : '开启音效'"
          >
            <img class="icon-plain" src="./assets/images/icon-sound.png" alt="音效" />
          </button>
        </div>
      </div>

      <div class="home-main">
        <div class="home-left">
          <img class="hero-logo" src="./assets/images/logo.png" alt="中国象棋" />
        </div>
        <div class="home-right">
          <button class="icon-btn" @click="enterMode('ai')">
            <img src="./assets/images/icon-single.png" alt="单人" />
          </button>
          <button class="icon-btn" @click="enterMode('local')">
            <img src="./assets/images/icon-dual.png" alt="双人" />
          </button>
          <button class="icon-btn" @click="nav.exitGame()">
            <img src="./assets/images/icon-exit.png" alt="退出" />
          </button>
        </div>
      </div>

      <div class="bottom-tabs">
        <div class="tab-item" :class="{ active: activeTab === 'battle' }">
          <img class="tab-icon" src="./assets/images/tab-battle.png" alt="" />
          <span class="tab-label">对战</span>
        </div>
        <div class="tab-divider"></div>
        <div class="tab-item" :class="{ active: activeTab === 'shop' }" @click="openShop">
          <img class="tab-icon" src="./assets/images/tab-shop.png" alt="" />
          <span class="tab-label">商城</span>
        </div>
      </div>

      <Teleport to="body">
        <div v-if="showProfile" class="overlay" @click.self="showProfile = false">
          <div class="card">
            <button class="close-btn" @click="showProfile = false">
              <span class="close-icon">✕</span>
            </button>
            <div class="card-body">
              <div class="header-box">
                <div class="decor-line c-mask"></div>
                <div class="title-card c-mask">
                  <div class="title-card-inner c-mask">个人资料</div>
                </div>
                <div class="decor-line c-mask"></div>
              </div>
              <div class="profile-user">
                <div class="profile-avatar">
                  <span class="profile-avatar-inner">弈</span>
                </div>
                <div class="profile-level">{{ levelTitle }}</div>
              </div>
              <div class="section-title">战绩</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">对局次数</span>
                  <span class="stat-value">{{ profile.totalGames }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">胜场</span>
                  <span class="stat-value">{{ profile.wins }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">胜率</span>
                  <span class="stat-value">{{ winRate }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">当前段位</span>
                  <span class="stat-value">{{ getRankTitle(profile.level) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">历史最高</span>
                  <span class="stat-value">{{ getRankTitle(profile.highestLevel) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="showTasks" class="overlay" @click.self="showTasks = false">
          <div class="card">
            <button class="close-btn" @click="showTasks = false">
              <span class="close-icon">✕</span>
            </button>
            <div class="card-body">
              <div class="header-box">
                <div class="decor-line c-mask"></div>
                <div class="title-card c-mask">
                  <div class="title-card-inner c-mask">任务中心</div>
                </div>
                <div class="decor-line c-mask"></div>
              </div>
              <div class="task-list">
                <div
                  v-for="task in todayTasks"
                  :key="task.id"
                  class="task-item"
                  :class="{ completed: task.completed, claimed: task.claimed }"
                >
                  <img class="task-icon" :src="task.icon" :alt="task.label" />
                  <div class="task-info">
                    <div class="task-head">
                      <span class="task-label">{{ task.label }}</span>
                    </div>
                    <div class="task-bar-wrap">
                      <div
                        class="task-bar"
                        :style="{ width: (task.progress / task.target) * 100 + '%' }"
                      ></div>
                    </div>
                    <div class="task-foot">
                      <span class="task-reward">+{{ task.reward }}</span>
                      <template v-if="task.id === 'login'">
                        <button v-if="task.canClaim" class="task-claim-btn" @click="task.onClaim">
                          领取
                        </button>
                        <span v-else class="task-done">已领</span>
                      </template>
                      <template v-else>
                        <button v-if="task.canClaim" class="task-claim-btn" @click="task.onClaim">
                          领取
                        </button>
                        <span v-else-if="task.claimed" class="task-done">已领</span>
                        <span v-else class="task-progress">{{
                          task.progress + '/' + task.target
                        }}</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="showShop" class="overlay" @click.self="closeShop">
          <div class="card">
            <button class="close-btn" @click="closeShop">
              <span class="close-icon">✕</span>
            </button>
            <div class="card-body">
              <div class="header-box">
                <div class="decor-line c-mask"></div>
                <div class="title-card c-mask">
                  <div class="title-card-inner c-mask">商城</div>
                </div>
                <div class="decor-line c-mask"></div>
              </div>
              <div class="shop-grid">
                <div class="shop-item">
                  <div class="shop-item-icon">悔</div>
                  <div class="shop-item-info">
                    <div class="shop-item-header">
                      <div class="shop-item-name">悔棋</div>
                      <div class="shop-item-price">{{ SHOP_PRICES.undo }} 金币</div>
                    </div>
                    <div class="shop-item-desc">仅单人模式可用</div>
                    <div class="shop-item-footer">
                      <div class="shop-item-owned">持有 {{ inventory.undo }}</div>
                      <DialogBtn
                        compact
                        variant="default"
                        :disabled="coins < SHOP_PRICES.undo"
                        @click="buyItem('undo')"
                        >购买</DialogBtn
                      >
                    </div>
                  </div>
                </div>
                <div class="shop-item">
                  <div class="shop-item-icon">策</div>
                  <div class="shop-item-info">
                    <div class="shop-item-header">
                      <div class="shop-item-name">提示</div>
                      <div class="shop-item-price">{{ SHOP_PRICES.hint }} 金币</div>
                    </div>
                    <div class="shop-item-desc">仅单人模式可用</div>
                    <div class="shop-item-footer">
                      <div class="shop-item-owned">持有 {{ inventory.hint }}</div>
                      <DialogBtn
                        compact
                        variant="default"
                        :disabled="coins < SHOP_PRICES.hint"
                        @click="buyItem('hint')"
                        >购买</DialogBtn
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </GameContainer>
</template>

<style scoped>
.home {
  --text-main: #5d4737;
  --text-sub: #8d7358;
  --seal: #c42d2d;

  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: var(--text-main);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  padding: 0;
}

:deep(.game-bg) {
  background:
    radial-gradient(circle at top left, rgba(255, 252, 245, 0.22), transparent 35%),
    linear-gradient(
      180deg,
      rgba(245, 237, 224, 0.5) 0%,
      rgba(240, 228, 208, 0.36) 55%,
      rgba(229, 213, 188, 0.22) 100%
    ),
    url('./assets/images/bg-mountains.png') center center / cover no-repeat;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(10px, 2.5cqw, 16px);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  width: 100%;
}

.plaque-outer {
  --r: 10px;
  background: #b0885a;
  padding: clamp(2px, 0.8cqw, 4px);
  flex: none;
}

.plaque-body {
  --r: 9px;
  display: flex;
  align-items: center;
  gap: clamp(8px, 2cqw, 14px);
  padding: clamp(4px, 1.2cqw, 8px) clamp(12px, 3cqw, 18px) clamp(4px, 1.2cqw, 8px)
    clamp(4px, 1.2cqw, 8px);
  background: rgba(220, 206, 185, 0.92);
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  width: 100%;
  text-align: left;
}

.player-avatar {
  width: clamp(32px, 8cqw, 46px);
  height: clamp(32px, 8cqw, 46px);
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    #fff6ea 0%,
    #f6dcb4 38%,
    #b97544 74%,
    #8b5736 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow:
    0 0 0 2px rgba(244, 229, 202, 0.55),
    0 4px 10px rgba(72, 52, 36, 0.18);
}

.avatar-inner {
  width: clamp(24px, 6cqw, 34px);
  height: clamp(24px, 6cqw, 34px);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 35%, #fffdf5, #efd4ae 72%, #c18d5f 100%);
  color: #6d2c19;
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: clamp(14px, 3.5cqw, 20px);
  font-weight: 700;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-width: 0;
  line-height: 1.2;
}

.player-level-title {
  font-size: clamp(12px, 3cqw, 17px);
  font-weight: 700;
  color: #4a3528;
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.player-coins {
  font-size: clamp(10px, 2.5cqw, 14px);
  color: #7a5f47;
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.8cqw, 6px);
  font-weight: 700;
}

.coin-img {
  width: clamp(20px, 5cqw, 28px);
  height: clamp(20px, 5cqw, 28px);
  display: block;
}

.top-actions {
  display: flex;
  flex-direction: row;
  gap: clamp(8px, 2.5cqw, 14px);
  flex-shrink: 0;
}

.icon-btn-plain {
  width: clamp(44px, 11cqw, 62px);
  height: clamp(44px, 11cqw, 62px);
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease;
  flex-shrink: 0;
}

.icon-btn-plain:active {
  transform: scale(0.92);
}

.icon-btn-plain.muted {
  opacity: 0.4;
}

.icon-plain {
  width: clamp(32px, 8cqw, 44px);
  height: clamp(32px, 8cqw, 44px);
  display: block;
  object-fit: contain;
}

.home-main {
  flex: 1;
  display: flex;
  gap: 0;
  padding: 0;
  position: relative;
  z-index: 1;
  min-height: 0;
}

.home-left {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 50%;
  width: 65%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 0;
}

.hero-logo {
  width: clamp(200px, 48cqw, 360px);
  height: auto;
  display: block;
  object-fit: contain;
  object-position: left bottom;
}

.home-right {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: clamp(8px, 3cqw, 18px);
  padding: 0;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  width: clamp(100px, 18cqw, 160px);
  transition: transform 120ms ease;
  -webkit-tap-highlight-color: transparent;
}

.icon-btn img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.icon-btn:active {
  transform: scale(0.93);
}

@container game (max-width: 640px) {
  .home-left {
    width: 60%;
  }

  .hero-logo {
    width: clamp(160px, 42cqw, 260px);
  }

  .icon-btn {
    width: clamp(90px, 22cqw, 130px);
  }
}

@container game (max-width: 420px) {
  .top-bar {
    gap: 10px;
    max-width: 420px;
  }

  .plaque-outer {
    padding: 2px;
  }

  .plaque-body {
    gap: 8px;
    padding: 4px 12px 4px 4px;
  }

  .player-avatar {
    width: 32px;
    height: 32px;
  }

  .avatar-inner {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }

  .player-level-title {
    font-size: 12px;
  }

  .player-coins {
    font-size: 10px;
    gap: 2px;
  }

  .coin-img {
    width: 20px;
    height: 20px;
  }

  .icon-btn-plain {
    width: 44px;
    height: 44px;
  }

  .icon-plain {
    width: 32px;
    height: 32px;
  }

  .home-left {
    width: 55%;
  }

  .hero-logo {
    width: 70%;
    max-width: 200px;
  }

  .home-right {
    gap: 6px;
  }

  .icon-btn {
    width: clamp(70px, 20cqw, 100px);
  }
}

.bottom-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 5cqw, 28px);
  margin-top: auto;
  padding: clamp(8px, 2.5cqw, 10px) 0 clamp(10px, 3cqw, 14px);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 5px 0 4px;
  width: clamp(90px, 28cqw, 132px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-radius: 10px;
  background: rgba(220, 206, 185, 0.35);
  transition: all 180ms ease;
  border: none;
}

.tab-item.active {
  background: rgba(160, 120, 80, 0.25);
}

.tab-icon {
  width: clamp(50px, 16cqw, 82px);
  height: clamp(50px, 16cqw, 82px);
  display: block;
}

.tab-label {
  font-size: clamp(10px, 3.2cqw, 14px);
  font-weight: 700;
  color: #7a5f47;
  font-family: 'Noto Serif SC', 'STSong', serif;
  line-height: 1;
}

.tab-item.active .tab-label {
  color: #4a2f20;
  font-weight: 800;
}

.tab-divider {
  width: 1px;
  height: clamp(32px, 9cqw, 56px);
  background: rgba(160, 130, 100, 0.3);
  flex-shrink: 0;
}

@container game (max-width: 420px) {
  .bottom-tabs {
    gap: 12px;
    padding: 8px 0 10px;
  }

  .tab-item {
    gap: 0;
    padding: 3px 0;
    width: 100px;
  }

  .tab-icon {
    width: 60px;
    height: 60px;
  }

  .tab-label {
    font-size: 10px;
  }

  .tab-divider {
    height: 40px;
  }
}

.overlay {
  --text-main: #5d4737;
  --text-sub: #8d7358;
  --seal: #c42d2d;

  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: clamp(16px, 4vw, 24px);
}

.card {
  container-type: inline-size;
  container-name: popup;
  --radius: 22px;
  --gap: 8px;
  --thickness: 3px;
  width: min(92%, 440px);
  max-height: 85vh;
  overflow-y: auto;
  background: #f7f0e4;
  position: relative;
  padding: 0;
  -webkit-mask-image:
    radial-gradient(circle at 0 0, transparent var(--radius), #000 0),
    radial-gradient(circle at 100% 0, transparent var(--radius), #000 0),
    radial-gradient(circle at 0 100%, transparent var(--radius), #000 0),
    radial-gradient(circle at 100% 100%, transparent var(--radius), #000 0);
  -webkit-mask-size: 51% 51%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position:
    top left,
    top right,
    bottom left,
    bottom right;
  mask-image:
    radial-gradient(circle at 0 0, transparent var(--radius), #000 0),
    radial-gradient(circle at 100% 0, transparent var(--radius), #000 0),
    radial-gradient(circle at 0 100%, transparent var(--radius), #000 0),
    radial-gradient(circle at 100% 100%, transparent var(--radius), #000 0);
  mask-size: 51% 51%;
  mask-repeat: no-repeat;
  mask-position:
    top left,
    top right,
    bottom left,
    bottom right;
}

.card::before {
  content: '';
  position: absolute;
  inset: var(--gap);
  background: #b0885a;
  pointer-events: none;
  z-index: 1;
  --offset: calc(-1 * var(--gap));
  --r-gold: calc(var(--radius) + var(--gap));
  mask:
    radial-gradient(circle at var(--offset) var(--offset), transparent var(--r-gold), #000 0) top
      left,
    radial-gradient(
        circle at calc(100% - var(--offset)) var(--offset),
        transparent var(--r-gold),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset)) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom right;
  mask-size: 51% 51%;
  mask-repeat: no-repeat;
  -webkit-mask:
    radial-gradient(circle at var(--offset) var(--offset), transparent var(--r-gold), #000 0) top
      left,
    radial-gradient(
        circle at calc(100% - var(--offset)) var(--offset),
        transparent var(--r-gold),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset)) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom right;
  -webkit-mask-size: 51% 51%;
  -webkit-mask-repeat: no-repeat;
}

.card::after {
  content: '';
  position: absolute;
  inset: calc(var(--gap) + var(--thickness));
  background: #f7f0e4;
  pointer-events: none;
  z-index: 2;
  --offset-i: calc(-1 * (var(--gap) + var(--thickness)));
  --r-inner: calc(var(--radius) + var(--gap) + var(--thickness));
  mask:
    radial-gradient(circle at var(--offset-i) var(--offset-i), transparent var(--r-inner), #000 0)
      top left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) var(--offset-i),
        transparent var(--r-inner),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset-i) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom right;
  mask-size: 51% 51%;
  mask-repeat: no-repeat;
  -webkit-mask:
    radial-gradient(circle at var(--offset-i) var(--offset-i), transparent var(--r-inner), #000 0)
      top left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) var(--offset-i),
        transparent var(--r-inner),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset-i) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom right;
  -webkit-mask-size: 51% 51%;
  -webkit-mask-repeat: no-repeat;
}

.close-btn {
  position: absolute;
  right: 24px;
  top: 24px;
  width: 32px;
  height: 32px;
  border: none;
  background: #b0885a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
  padding: 0;
  z-index: 10;
  -webkit-tap-highlight-color: transparent;
  mask:
    radial-gradient(circle at 0 0, transparent 2px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 2px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 2px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 2px, #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent 2px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 2px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 2px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 2px, #000 0) 100% 100% / 51% 51% no-repeat;
}

.close-btn::before {
  content: '';
  position: absolute;
  inset: 2px;
  background: #ece0ce;
  z-index: -1;
}

.close-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform: rotate(-45deg);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  font-weight: 400;
}

.card-body {
  padding: 28px 28px 24px;
  position: relative;
  z-index: 3;
}

.c-mask {
  mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
}

.header-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  width: 100%;
  justify-content: center;
}

.decor-line {
  --r: 3px;
  width: 8px;
  height: 30px;
  background: #b0885a;
  position: relative;
  flex-shrink: 0;
}

.decor-line::after {
  content: '';
  position: absolute;
  inset: 2px 0;
  background: #ece0ce;
}

.title-card {
  --r: 8px;
  background: #ece0ce;
  padding: 2px;
}

.title-card-inner {
  padding: 8px 28px;
  background: #f7f0e4;
  color: #8c603a;
  font-size: clamp(14px, 4cqw, 16px);
  font-weight: 700;
  letter-spacing: 0.12em;
  font-family: 'Noto Serif SC', 'STSong', serif;
  text-align: center;
  white-space: nowrap;
}

.profile-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 4px 0 8px;
}

.profile-avatar {
  width: clamp(56px, 16cqw, 72px);
  height: clamp(56px, 16cqw, 72px);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff6ea, #f6dcb4 38%, #b97544 74%, #8b5736);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 3px rgba(244, 229, 202, 0.55),
    0 6px 16px rgba(72, 52, 36, 0.2);
}

.profile-avatar-inner {
  width: clamp(42px, 12cqw, 54px);
  height: clamp(42px, 12cqw, 54px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 35%, #fffdf5, #efd4ae 72%, #c18d5f);
  color: #6d2c19;
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: clamp(22px, 7cqw, 30px);
  font-weight: 700;
}

.profile-level {
  font-size: clamp(13px, 4cqw, 16px);
  font-weight: 700;
  color: var(--text-main);
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.section-title {
  font-size: clamp(13px, 3.8cqw, 15px);
  font-weight: 700;
  color: var(--text-main);
  font-family: 'Noto Serif SC', 'STSong', serif;
  text-align: center;
  margin-bottom: clamp(10px, 3cqw, 14px);
  position: relative;
}

.section-title::before,
.section-title::after {
  content: '';
  position: absolute;
  top: 50%;
  width: clamp(15%, 20cqw, 25%);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(160, 130, 100, 0.4), transparent);
}

.section-title::before {
  left: 0;
  transform: translateX(-100%);
}

.section-title::after {
  right: 0;
  transform: translateX(100%);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(6px, 1.8cqw, 8px) clamp(10px, 3cqw, 14px);
  padding: clamp(10px, 3cqw, 14px) clamp(8px, 2.5cqw, 12px);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2px, 0.8cqw, 4px);
}

.stat-label {
  font-size: clamp(10px, 3cqw, 12px);
  color: var(--text-sub);
}

.stat-value {
  font-size: clamp(11px, 3.2cqw, 13px);
  font-weight: 700;
  color: var(--text-main);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2.5cqw, 10px);
}

.task-item {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2.5cqw, 10px);
  padding: clamp(10px, 3cqw, 12px) clamp(10px, 3cqw, 14px);
  background: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  transition: background 150ms ease;
}

.task-item.completed {
  background: rgba(200, 183, 158, 0.4);
}

.task-item.claimed {
  opacity: 0.6;
}

.task-icon {
  width: clamp(26px, 7.5cqw, 32px);
  height: clamp(26px, 7.5cqw, 32px);
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(4px, 1.5cqw, 8px);
}

.task-label {
  font-size: clamp(11px, 3.5cqw, 13px);
  font-weight: 600;
  color: var(--text-main);
}

.task-reward {
  font-size: clamp(11px, 3.5cqw, 13px);
  font-weight: 700;
  color: var(--seal);
}

.task-bar-wrap {
  height: clamp(5px, 1.5cqw, 6px);
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
  margin-top: clamp(4px, 1.5cqw, 6px);
}

.task-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #b0885a, #c9a227);
  transition: width 300ms ease;
}

.task-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: clamp(20px, 5cqw, 22px);
}

.task-progress {
  font-size: clamp(10px, 3cqw, 11px);
  color: var(--text-sub);
}

.task-claim-btn {
  border: none;
  background: none;
  color: var(--seal);
  font-size: clamp(10px, 3cqw, 12px);
  font-weight: 700;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Noto Serif SC', 'STSong', serif;
  transition:
    transform 100ms ease,
    opacity 150ms ease;
}

.task-claim-btn:active {
  transform: scale(0.93);
  opacity: 0.7;
}

.task-done {
  font-size: clamp(10px, 3cqw, 12px);
  color: var(--text-sub);
}

.shop-grid {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 3cqw, 12px);
}

.shop-item {
  display: flex;
  align-items: center;
  gap: clamp(10px, 3cqw, 14px);
  padding: clamp(12px, 4cqw, 16px) clamp(10px, 3cqw, 14px);
  background: rgba(255, 255, 255, 0.35);
  border-radius: 10px;
}

.shop-item-icon {
  width: clamp(44px, 12cqw, 56px);
  height: clamp(52px, 15cqw, 68px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f5ede0, #e8d9c4);
  border-radius: 8px;
  font-size: clamp(18px, 6cqw, 24px);
  font-weight: 700;
  color: var(--seal);
  font-family: 'Noto Serif SC', 'STSong', serif;
  flex-shrink: 0;
}

.shop-item-info {
  flex: 1;
  min-width: 0;
}

.shop-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(4px, 1.5cqw, 8px);
}

.shop-item-name {
  font-size: clamp(13px, 4cqw, 15px);
  font-weight: 700;
  color: var(--text-main);
}

.shop-item-price {
  font-size: clamp(11px, 3.2cqw, 13px);
  font-weight: 700;
  color: var(--seal);
}

.shop-item-desc {
  font-size: clamp(10px, 3cqw, 12px);
  color: var(--text-sub);
  margin-top: clamp(2px, 0.8cqw, 4px);
}

.shop-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(4px, 1.5cqw, 8px);
  margin-top: clamp(6px, 2cqw, 10px);
}

.shop-item-owned {
  font-size: clamp(10px, 3cqw, 12px);
  color: var(--text-sub);
}
</style>
