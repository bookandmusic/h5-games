<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import GameContainer from '../../components/GameContainer.vue'
import { claimDailyRewards, loadPlayerDataWithStatus, savePlayerData } from './economy'
import { stopBgm, playBgm } from './soundManager'
import type { DailyQuest, PlayerData } from './types'
import './game-theme.css'

const bgUrl = new URL('./assets/images/common/bg-home.png', import.meta.url).href
const iconDailyUrl = new URL('./assets/images/common/icon-daily.svg', import.meta.url).href

const GAME_ID = 'star-chart-parallel-planes'
const nav = useGameNavigation(GAME_ID)
const { registerCleanup } = useGameRouteLifecycle()

const playerData = ref<PlayerData | null>(null)
const bgmOn = ref(false)
const showDailyPanel = ref(false)
const integrityWarning = ref(false)

const dailyQuests = computed(() => playerData.value?.daily.quests ?? [])
const claimableDailyCount = computed(
  () => dailyQuests.value.filter((quest) => quest.completed && !quest.claimed).length
)

onMounted(async () => {
  const loaded = await loadPlayerDataWithStatus()
  playerData.value = loaded.data
  integrityWarning.value = loaded.integrityFailed
  registerCleanup(GAME_ID, () => {
    stopBgm()
  })
})

onBeforeUnmount(() => {
  stopBgm()
})

function toggleBgm() {
  bgmOn.value = !bgmOn.value
  if (bgmOn.value) {
    playBgm('urban')
  } else {
    stopBgm()
  }
}

function goToStarmap() {
  nav.goToPage('map')
}

function goToUniverse() {
  nav.goToPage('universe', { params: { themeId: 'urban' } })
}

function handleExit() {
  nav.exitGame()
}

function rewardText(quest: DailyQuest): string {
  return quest.reward.type === 'tickets'
    ? `星券 x${quest.reward.amount}`
    : `体力 x${quest.reward.amount}`
}

async function claimDaily() {
  if (!playerData.value || claimableDailyCount.value <= 0) return
  const result = claimDailyRewards(playerData.value.daily, playerData.value.economy)
  playerData.value = {
    ...playerData.value,
    daily: result.daily,
    economy: result.economy,
  }
  await savePlayerData(playerData.value)
}
</script>

<template>
  <GameContainer :bg-image="bgUrl">
    <template #decoration>
      <div class="bg-overlay" />
    </template>
    <div class="home-content star-page">
      <Teleport to="body">
        <Transition name="daily-panel">
          <div
            v-if="showDailyPanel && playerData"
            class="daily-overlay"
            role="dialog"
            aria-modal="true"
            @click.self="showDailyPanel = false"
          >
            <div class="daily-panel star-modal">
              <button class="star-modal-close" aria-label="关闭" @click="showDailyPanel = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div class="daily-head">
                <img :src="iconDailyUrl" alt="" class="daily-head-icon" />
                <h2>每日星图任务</h2>
              </div>

              <div class="daily-list">
                <div
                  v-for="quest in dailyQuests"
                  :key="quest.id"
                  class="daily-quest star-tech-item"
                  :class="{
                    completed: quest.completed,
                    claimable: quest.completed && !quest.claimed,
                    claimed: quest.claimed,
                  }"
                >
                  <div class="quest-main">
                    <span class="quest-title">{{ quest.desc }}</span>
                    <span class="quest-reward">{{ rewardText(quest) }}</span>
                  </div>
                  <div class="quest-progress">
                    <div class="quest-track">
                      <div
                        class="quest-fill"
                        :style="{ width: (quest.progress / quest.target) * 100 + '%' }"
                      />
                    </div>
                    <span class="quest-count">{{ quest.progress }}/{{ quest.target }}</span>
                  </div>
                  <span class="quest-state">
                    <template v-if="quest.claimed">已领取</template>
                    <template v-else-if="quest.completed">可领取</template>
                    <template v-else>进行中</template>
                  </span>
                </div>
              </div>

              <button
                class="daily-claim star-primary-btn"
                :disabled="claimableDailyCount <= 0"
                @click="claimDaily"
              >
                <span v-if="claimableDailyCount > 0">领取奖励 x{{ claimableDailyCount }}</span>
                <span v-else>暂无可领取奖励</span>
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <Transition name="daily-panel">
          <div v-if="integrityWarning" class="integrity-overlay" role="dialog" aria-modal="true">
            <div class="integrity-panel star-modal">
              <h2>星图波动异常</h2>
              <p>本地存档校验失败，星图已重置为新的稳定状态。</p>
              <button class="daily-claim star-primary-btn" @click="integrityWarning = false">
                确认
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <main class="hero-stage">
        <div class="title-section">
          <h1 class="game-title-top">星魂录</h1>
          <div class="compass-wrap">
            <svg class="compass-svg" viewBox="0 0 200 200" fill="none">
              <!-- 外环 -->
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="rgba(255,255,255,0.9)"
                stroke-width="3"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="82"
                stroke="rgba(255,255,255,0.35)"
                stroke-width="1.5"
                fill="none"
              />
              <!-- 刻度 -->
              <g stroke="rgba(255,255,255,0.5)" stroke-width="2.5">
                <line x1="100" y1="10" x2="100" y2="28" />
                <line x1="100" y1="172" x2="100" y2="190" />
                <line x1="10" y1="100" x2="28" y2="100" />
                <line x1="172" y1="100" x2="190" y2="100" />
                <line x1="36" y1="36" x2="48" y2="48" />
                <line x1="152" y1="152" x2="164" y2="164" />
                <line x1="164" y1="36" x2="152" y2="48" />
                <line x1="48" y1="152" x2="36" y2="164" />
              </g>
              <!-- 内环 -->
              <circle
                cx="100"
                cy="100"
                r="55"
                stroke="rgba(255,255,255,0.3)"
                stroke-width="1.5"
                fill="none"
              />
              <!-- 指针 -->
              <polygon points="100,16 108,100 100,184 92,100" fill="rgba(255,255,255,0.85)" />
              <polygon points="16,100 100,108 184,100 100,92" fill="rgba(255,255,255,0.55)" />
              <!-- 中心 -->
              <circle
                cx="100"
                cy="100"
                r="12"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="2.5"
              />
              <circle cx="100" cy="100" r="5" fill="rgba(255,255,255,0.95)" />
            </svg>
          </div>
        </div>

        <button class="start-btn" @click="goToStarmap" aria-label="开始">
          <span class="start-btn-text">开始</span>
        </button>
      </main>

      <footer class="home-footer">
        <div class="dock-actions">
          <div class="dock-item">
            <button
              class="dock-btn"
              :class="{ claimable: claimableDailyCount > 0 }"
              @click="showDailyPanel = true"
              aria-label="任务"
            >
              <svg class="dock-icon dock-icon-svg" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"
                />
              </svg>
              <span v-if="claimableDailyCount > 0" class="dock-badge">{{
                claimableDailyCount
              }}</span>
            </button>
            <span class="dock-label">任务</span>
          </div>

          <div class="dock-item">
            <button class="dock-btn" @click="goToUniverse" aria-label="画廊">
              <svg class="dock-icon dock-icon-svg" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
              </svg>
            </button>
            <span class="dock-label">画廊</span>
          </div>

          <div class="dock-item">
            <button
              class="dock-btn"
              :class="{ active: bgmOn }"
              @click="toggleBgm"
              aria-label="音效"
            >
              <template v-if="bgmOn">
                <svg
                  class="dock-icon dock-icon-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path
                    fill="currentColor"
                    d="M5 6.5v11H1v-11zm2 11.71l8 4.5V1.29l-8 4.5zM21.581 7.78l-.602-.799l-1.596 1.206l.602.798a5 5 0 0 1-.002 6.03l-.603.797l1.595 1.206l.603-.797a7 7 0 0 0 .003-8.442"
                  />
                  <path
                    fill="currentColor"
                    d="m18.789 9.889l-.603-.798l-1.596 1.205l.603.798a1.5 1.5 0 0 1 0 1.809l-.604.797l1.595 1.207l.603-.798a3.5 3.5 0 0 0 .002-4.22"
                  />
                </svg>
              </template>
              <template v-else>
                <svg
                  class="dock-icon dock-icon-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill="currentColor" d="M9 17.5v-11H5v11zm10 5.21l-8-4.5V5.79l8-4.5z" />
                </svg>
              </template>
            </button>
            <span class="dock-label">音效</span>
          </div>

          <div class="dock-item">
            <button class="dock-btn" @click="handleExit" aria-label="退出">
              <svg
                class="dock-icon dock-icon-svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M9.707 2.409C9 3.036 9 4.183 9 6.476v11.048c0 2.293 0 3.44.707 4.067s1.788.439 3.95.062l2.33-.406c2.394-.418 3.591-.627 4.302-1.505c.711-.879.711-2.149.711-4.69V8.948c0-2.54 0-3.81-.71-4.689c-.712-.878-1.91-1.087-4.304-1.504l-2.328-.407c-2.162-.377-3.243-.565-3.95.062M12 10.169c.414 0 .75.351.75.784v2.094c0 .433-.336.784-.75.784s-.75-.351-.75-.784v-2.094c0-.433.336-.784.75-.784"
                  clip-rule="evenodd"
                />
                <path
                  fill="currentColor"
                  d="M7.547 4.5c-2.058.003-3.131.048-3.815.732C3 5.964 3 7.142 3 9.5v5c0 2.357 0 3.535.732 4.268c.684.683 1.757.729 3.815.732c-.047-.624-.047-1.344-.047-2.123V6.623c0-.78 0-1.5.047-2.123"
                />
              </svg>
            </button>
            <span class="dock-label">退出</span>
          </div>
        </div>
      </footer>
    </div>
  </GameContainer>
</template>

<style scoped>
.home-content {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  text-align: center;
  color: #eef6ff;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 8, 25, 0.46) 0%,
    rgba(5, 8, 25, 0.22) 45%,
    rgba(5, 8, 25, 0.5) 100%
  );
  pointer-events: none;
}

.hero-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(24px, 4cqh, 40px);
  min-height: 0;
  padding-top: clamp(4px, 1cqh, 10px);
}

.title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.5cqh, 14px);
}

.game-title-top {
  margin: 0;
  font-size: clamp(36px, 10cqw, 56px);
  font-weight: 900;
  letter-spacing: 12px;
  text-indent: 12px;
  line-height: 1;
  color: #eef6ff;
  text-shadow:
    0 0 30px rgba(104, 184, 255, 0.4),
    0 0 60px rgba(104, 184, 255, 0.2);
}

.compass-wrap {
  position: relative;
  width: clamp(160px, 38cqw, 220px);
  height: clamp(160px, 38cqw, 220px);
  filter: drop-shadow(0 0 24px rgba(104, 184, 255, 0.35));
}

.compass-svg {
  width: 100%;
  height: 100%;
  animation: compass-rotate 20s linear infinite;
}

@keyframes compass-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ── 开始按钮（尖角样式）── */
.start-btn {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(72vw, 320px);
  height: clamp(52px, 10cqh, 68px);
  padding: 0;
  border: 0;
  background: linear-gradient(180deg, rgba(79, 195, 247, 0.95), rgba(2, 136, 209, 0.95));
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.14s ease,
    filter 0.14s ease;
  box-shadow: 0 0 32px rgba(104, 184, 255, 0.3);
}

.start-btn::before {
  content: '';
  position: absolute;
  left: -13px;
  top: 0;
  width: 14px;
  height: 100%;
  background: linear-gradient(180deg, rgba(79, 195, 247, 0.95), rgba(2, 136, 209, 0.95));
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
}

.start-btn::after {
  content: '';
  position: absolute;
  right: -13px;
  top: 0;
  width: 14px;
  height: 100%;
  background: linear-gradient(180deg, rgba(79, 195, 247, 0.95), rgba(2, 136, 209, 0.95));
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.start-btn:active {
  transform: scale(0.96) translateY(2px);
  filter: brightness(1.1);
}

.start-btn-text {
  position: relative;
  z-index: 1;
  font-size: clamp(22px, 5cqw, 30px);
  font-weight: 900;
  letter-spacing: 6px;
  text-indent: 6px;
  color: #ffffff;
  text-shadow: 0 0 16px rgba(104, 184, 255, 0.6);
  pointer-events: none;
}

/* ── 底部 Dock ── */
.home-footer {
  flex-shrink: 0;
  padding: clamp(12px, 2.2cqh, 20px) clamp(14px, 3cqw, 28px);
}

.dock-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(10px, 2.5cqw, 16px);
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dock-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(48px, 11cqw, 58px);
  height: clamp(48px, 11cqw, 58px);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #121f44;
  aspect-ratio: 1;
  flex-shrink: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s ease;
}

.dock-btn:active {
  transform: scale(0.9);
}

.dock-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.dock-btn.active {
  background: #1a2e5e;
  box-shadow: 0 0 16px rgba(104, 184, 255, 0.2);
}

.dock-btn.claimable {
  background: #1a2e5e;
  box-shadow: 0 0 16px rgba(255, 215, 106, 0.15);
}

.dock-icon {
  width: 65%;
  height: 65%;
  pointer-events: none;
  filter: brightness(0) invert(1) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
}

.dock-label {
  font-size: clamp(13px, 2.8cqw, 15px);
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.92);
}

.dock-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ffd76a;
  color: #11203c;
  font-size: 11px;
  font-weight: 900;
  line-height: 18px;
  box-shadow: 0 0 10px rgba(255, 215, 106, 0.45);
}

/* ── 弹窗（保留原有样式）── */
.daily-overlay,
.integrity-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 8, 22, 0.72);
  backdrop-filter: blur(6px);
}

.daily-overlay {
  z-index: 500;
}

.integrity-overlay {
  z-index: 520;
}

.daily-panel,
.integrity-panel {
  width: min(380px, 88vw);
  max-height: min(620px, 84vh);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
}

.integrity-panel {
  max-width: 330px;
  text-align: center;
}

.integrity-panel h2 {
  margin: 0;
  color: #ff8a80;
  font-size: 20px;
  font-weight: 900;
}

.integrity-panel p {
  margin: 0;
  color: rgba(238, 246, 255, 0.72);
  font-size: 13px;
  line-height: 1.6;
}

.daily-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.daily-head h2 {
  flex: 1;
  margin: 0;
  color: #eef6ff;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 0;
  text-align: left;
}

.daily-head-icon {
  width: 34px;
  height: 34px;
}

.daily-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.daily-quest {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(104, 184, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.045);
  text-align: left;
}

.daily-quest.claimable {
  border-color: rgba(255, 215, 106, 0.48);
  box-shadow: inset 0 0 18px rgba(255, 215, 106, 0.08);
}

.daily-quest.claimed {
  opacity: 0.58;
}

.quest-main,
.quest-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.quest-title {
  color: #eef6ff;
  font-size: 13px;
  font-weight: 800;
}

.quest-reward,
.quest-state {
  color: #ffd76a;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.quest-track {
  flex: 1;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.quest-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #35e6ff, #68b8ff);
}

.quest-count {
  min-width: 42px;
  color: #a9bce6;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.daily-claim {
  min-height: 52px;
  border: 1px solid rgba(255, 215, 106, 0.35);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffe08a 0%, #d59b2f 100%);
  color: #142036;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.daily-claim:disabled {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(238, 246, 255, 0.45);
  cursor: default;
}

.daily-panel-enter-active,
.daily-panel-leave-active {
  transition: opacity 0.18s ease;
}

.daily-panel-enter-from,
.daily-panel-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .compass-svg {
    animation: none;
  }
  .start-btn,
  .dock-btn {
    transition: none;
  }
}
</style>
