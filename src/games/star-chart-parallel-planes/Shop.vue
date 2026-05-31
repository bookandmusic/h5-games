<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import { THEMES, THEME_ORDER } from './themeConfig'
import { loadPlayerData, savePlayerData, spendTickets, addUnlockedCard } from './economy'
import { stopBgm } from './soundManager'
import { destroyCtx } from '../../utils/soundUtils'
import GameContainer from '../../components/GameContainer.vue'
import type { PlayerData, CharacterData } from './types'
import { RARITY_SHOP_PRICE, RARITY_COLORS, RARITY_ORDER } from './types'
import './game-theme.css'

const bgUrl = new URL('./assets/images/common/bg-home.png', import.meta.url).href
const GAME_ID = 'star-chart-parallel-planes'
const nav = useGameNavigation(GAME_ID)
const { registerCleanup } = useGameRouteLifecycle()

const playerData = ref<PlayerData | null>(null)
const activeTheme = ref(0)
const confirmTarget = ref<CharacterData | null>(null)
const busy = ref(false)
const purchaseSuccess = ref(false)

onMounted(async () => {
  playerData.value = await loadPlayerData()
  registerCleanup(GAME_ID, () => {
    stopBgm()
    destroyCtx()
  })
})

const themeList = computed(() => THEME_ORDER.map((id) => THEMES.find((t) => t.id === id)!))

const currentTheme = computed(() => themeList.value[activeTheme.value])

const currentChars = computed(() => {
  const t = currentTheme.value
  if (!t) return []
  return [...t.characters].sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
  )
})

function getImageUrl(char: CharacterData): string {
  const theme = currentTheme.value
  if (!theme) return ''
  const name = theme.imageNames[char.imageIndex]
  return new URL(`./assets/images/${theme.id}/chars/${name}.png`, import.meta.url).href
}

function isOwned(charId: number): boolean {
  return playerData.value?.unlockedCards.includes(charId) ?? false
}

function canAfford(char: CharacterData): boolean {
  if (!playerData.value) return false
  return playerData.value.economy.tickets >= RARITY_SHOP_PRICE[char.rarity]
}

function rarityLabel(r: string): string {
  return r
}

function openConfirm(char: CharacterData) {
  if (isOwned(char.id)) return
  confirmTarget.value = char
}

function closeConfirm() {
  if (busy.value) return
  confirmTarget.value = null
  purchaseSuccess.value = false
}

async function confirmBuy() {
  const char = confirmTarget.value
  if (!char || !playerData.value || busy.value) return
  if (!canAfford(char)) return

  busy.value = true
  try {
    const newEconomy = spendTickets(playerData.value.economy, RARITY_SHOP_PRICE[char.rarity])
    if (!newEconomy) return
    const newUnlocked = addUnlockedCard(playerData.value.unlockedCards, char.id)
    const newData: PlayerData = {
      ...playerData.value,
      economy: newEconomy,
      unlockedCards: newUnlocked,
    }
    await savePlayerData(newData)
    playerData.value = newData
    purchaseSuccess.value = true
    confirmTarget.value = null
  } finally {
    busy.value = false
  }
}

function goHome() {
  nav.goToHome()
}

const ticketDisplay = computed(() => playerData.value?.economy.tickets ?? 0)
</script>

<template>
  <GameContainer :bg-image="bgUrl">
    <template #decoration>
      <div class="bg-overlay" />
    </template>
    <div class="shop star-page">
      <div class="shop-top star-top-hud">
        <button class="top-back-btn star-hit-icon" @click="goHome" aria-label="返回">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            width="18"
            height="18"
          >
            <path d="M19 12H5" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
        </button>
        <h1 class="shop-title">星券兑换舱</h1>
        <div class="ticket-display star-hud-value">
          <span class="ticket-icon">🎫</span>
          <span class="ticket-count">{{ ticketDisplay }}</span>
        </div>
      </div>

      <div class="theme-tabs">
        <button
          v-for="(theme, i) in themeList"
          :key="theme.id"
          class="theme-tab star-rune-tab"
          :class="{ active: i === activeTheme }"
          :style="{ '--accent': theme.accentColor }"
          @click="activeTheme = i"
        >
          {{ theme.name }}
        </button>
      </div>

      <div class="grid">
        <button
          v-for="char in currentChars"
          :key="char.id"
          class="char-card star-card"
          :class="{ owned: isOwned(char.id), unowned: !isOwned(char.id) }"
          :style="{ '--rarity-color': RARITY_COLORS[char.rarity] }"
          :disabled="isOwned(char.id)"
          @click="openConfirm(char)"
        >
          <div class="char-img-wrap">
            <img
              :src="getImageUrl(char)"
              :alt="char.name"
              class="char-img"
              draggable="false"
              loading="lazy"
            />
            <span v-if="isOwned(char.id)" class="owned-badge">已唤醒</span>
          </div>
          <div class="char-info">
            <span class="char-name">{{ char.name }}</span>
            <div class="char-meta">
              <span class="rarity-tag" :style="{ background: RARITY_COLORS[char.rarity] }">
                {{ rarityLabel(char.rarity) }}
              </span>
              <span class="price-tag">
                <span class="price-icon">🎫</span>
                {{ RARITY_SHOP_PRICE[char.rarity] }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <Teleport to="body">
        <div v-if="confirmTarget" class="modal-overlay" @click.self="closeConfirm">
          <div class="modal star-modal">
            <button class="star-modal-close" aria-label="关闭" @click="closeConfirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div
              class="modal-img-wrap"
              :style="{ '--rarity-color': RARITY_COLORS[confirmTarget.rarity] }"
            >
              <img
                :src="getImageUrl(confirmTarget)"
                :alt="confirmTarget.name"
                class="modal-img"
                draggable="false"
              />
            </div>
            <h2 class="modal-title">{{ confirmTarget.title }}</h2>
            <p class="modal-rarity" :style="{ color: RARITY_COLORS[confirmTarget.rarity] }">
              {{ rarityLabel(confirmTarget.rarity) }}
            </p>
            <p class="modal-price">
              花费
              <span class="modal-price-amount"
                >🎫 {{ RARITY_SHOP_PRICE[confirmTarget.rarity] }}</span
              >
              星券兑换此角色？
            </p>
            <div class="modal-actions">
              <button
                class="modal-btn modal-btn-cancel star-secondary-btn"
                :disabled="busy"
                @click="closeConfirm"
              >
                取消
              </button>
              <button
                class="modal-btn modal-btn-confirm star-primary-btn"
                :class="{ disabled: !canAfford(confirmTarget) }"
                :disabled="busy || !canAfford(confirmTarget)"
                @click="confirmBuy"
              >
                <template v-if="busy">唤醒中...</template>
                <template v-else-if="!canAfford(confirmTarget)">星券不足</template>
                <template v-else>星魂唤醒</template>
              </button>
            </div>
          </div>
        </div>

        <div v-if="purchaseSuccess" class="purchase-success" @click="closeConfirm">
          <div class="success-starburst" />
          <div class="success-card">
            <p class="success-text">星魂唤醒确认</p>
            <p class="success-sub">角色已加入星魂档案</p>
          </div>
        </div>
      </Teleport>
    </div>
  </GameContainer>
</template>

<style scoped>
.shop {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shop-top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(8px, 2cqh, 12px) 0;
  gap: 8px;
}

.shop-title {
  font-size: clamp(16px, 4cqw, 22px);
  font-weight: 800;
  color: #e0e8f0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  margin: 0;
  flex: 1;
  text-align: center;
  letter-spacing: 2px;
}

.ticket-display {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0 clamp(4px, 1.2cqw, 8px);
  flex-shrink: 0;
}
.ticket-icon {
  font-size: clamp(14px, 3cqw, 18px);
}
.bg-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 8, 25, 0.5) 0%,
    rgba(5, 8, 25, 0.3) 50%,
    rgba(5, 8, 25, 0.5) 100%
  );
  pointer-events: none;
}
.ticket-count {
  font-size: clamp(16px, 4cqw, 20px);
  font-weight: 800;
  color: #ffd700;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
  text-align: right;
}

.theme-tabs {
  flex-shrink: 0;
  display: flex;
  gap: clamp(4px, 1cqw, 8px);
  padding: clamp(6px, 1cqh, 10px) clamp(8px, 2cqw, 14px);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.theme-tabs::-webkit-scrollbar {
  display: none;
}

.theme-tab {
  flex-shrink: 0;
  padding: clamp(6px, 1.2cqh, 10px) clamp(10px, 2.5cqw, 16px);
  border-radius: 0;
  border: 0;
  background: transparent;
  color: rgba(180, 210, 255, 0.6);
  font-size: clamp(12px, 3cqw, 14px);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.theme-tab.active {
  background: transparent;
  border-color: transparent;
  color: #e0e8f0;
  box-shadow: 0 0 12px var(--accent, rgba(100, 180, 255, 0.15));
}
.theme-tab:active {
  transform: scale(0.95);
}

.grid {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(8px, 2cqw, 14px);
  padding: clamp(8px, 1.5cqh, 14px) clamp(8px, 2cqw, 14px);
  align-content: start;
}

.char-card {
  display: flex;
  flex-direction: column;
  border-radius: clamp(10px, 2cqw, 16px);
  border: 1.5px solid rgba(100, 160, 255, 0.1);
  background: linear-gradient(160deg, rgba(20, 30, 60, 0.5), rgba(10, 20, 50, 0.3));
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  -webkit-tap-highlight-color: transparent;
  padding: 0;
  text-align: left;
  font: inherit;
  color: inherit;
  position: relative;
}
.char-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(160deg, transparent 40%, rgba(100, 160, 255, 0.06));
  pointer-events: none;
  z-index: 1;
}
.char-card.unowned:active {
  transform: scale(0.96);
  border-color: var(--rarity-color, rgba(100, 180, 255, 0.2));
}
.char-card.owned {
  opacity: 0.5;
  cursor: default;
  filter: grayscale(0.6);
}

.char-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}
.char-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}
.owned-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #4fc3f7;
  font-size: clamp(10px, 2.5cqw, 12px);
  font-weight: 700;
  border: 1px solid rgba(79, 195, 247, 0.3);
}

.char-info {
  padding: clamp(6px, 1cqh, 10px) clamp(6px, 1.5cqw, 10px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.char-name {
  font-size: clamp(12px, 3cqw, 14px);
  font-weight: 700;
  color: #e0e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.char-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.rarity-tag {
  font-size: clamp(10px, 2cqw, 12px);
  font-weight: 800;
  color: #fff;
  padding: 1px 8px;
  border-radius: 10px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
.price-tag {
  font-size: clamp(11px, 2.5cqw, 13px);
  font-weight: 800;
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 2px;
}
.price-icon {
  font-size: clamp(10px, 2cqw, 13px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  padding: 24px;
}

.modal {
  max-width: 320px;
  width: 100%;
  text-align: center;
}

.modal-img-wrap {
  width: clamp(120px, 40cqw, 160px);
  height: clamp(160px, 55cqw, 220px);
  margin: 0 auto clamp(12px, 2cqh, 16px);
  border-radius: 12px;
  overflow: hidden;
  border: 2.5px solid var(--rarity-color, rgba(100, 180, 255, 0.3));
}
.modal-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.modal-title {
  font-size: clamp(16px, 4cqw, 20px);
  font-weight: 800;
  color: #e0e8f0;
  margin: 0 0 4px;
}

.modal-rarity {
  font-size: clamp(14px, 3.5cqw, 16px);
  font-weight: 700;
  margin: 0 0 12px;
}

.modal-price {
  font-size: clamp(14px, 3.5cqw, 16px);
  color: rgba(180, 210, 255, 0.7);
  margin: 0 0 20px;
}
.modal-price-amount {
  color: #ffd700;
  font-weight: 800;
}

.modal-actions {
  display: flex;
  gap: 12px;
}
.modal-btn {
  flex: 1;
  padding: clamp(10px, 2.5cqh, 14px);
  border-radius: 12px;
  font-size: clamp(14px, 3.5cqw, 16px);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.modal-btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(180, 210, 255, 0.6);
}
.modal-btn-cancel:active {
  transform: scale(0.96);
}
.modal-btn-confirm {
  background: linear-gradient(135deg, #ffd700, #ffb300);
  color: #1a0a2e;
  border: 1px solid rgba(255, 215, 0, 0.3);
}
.modal-btn-confirm:active {
  transform: scale(0.96);
}
.modal-btn-confirm.disabled {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: default;
}
.modal-btn:disabled {
  cursor: default;
}

.purchase-success {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  cursor: pointer;
}
.success-starburst {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 180, 255, 0.2) 0%, transparent 70%);
  animation: starburst-pulse 0.6s ease-out;
}
@keyframes starburst-pulse {
  0% {
    transform: scale(0.3);
    opacity: 1;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
.success-card {
  position: relative;
  text-align: center;
  z-index: 2;
}
.success-text {
  font-size: clamp(20px, 5cqw, 28px);
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 24px rgba(255, 215, 0, 0.4);
  margin: 0 0 8px;
  animation: success-fade-in 0.4s ease-out;
}
.success-sub {
  font-size: clamp(14px, 3.5cqw, 18px);
  color: rgba(200, 220, 255, 0.7);
  margin: 0;
  animation: success-fade-in 0.4s ease-out 0.15s both;
}
@keyframes success-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.top-back-btn {
  width: clamp(48px, 9cqw, 58px);
  height: clamp(48px, 9cqw, 58px);
  border-radius: 50%;
  background: transparent;
  border: 0;
  color: rgba(200, 220, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.top-back-btn:active {
  transform: scale(0.9);
  background: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .char-card,
  .theme-tab,
  .modal-btn {
    transition: none;
  }
}
</style>
