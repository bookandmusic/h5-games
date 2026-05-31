<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { THEMES, THEME_ORDER, getThemeById } from './themeConfig'
import { loadPlayerData, savePlayerData, spendTickets, addUnlockedCard } from './economy'
import GameContainer from '../../components/GameContainer.vue'
import type { PlayerData, Rarity, ThemeId } from './types'
import { RARITY_COLORS, RARITY_SHOP_PRICE, RARITY_LABEL } from './types'
import './game-theme.css'

const GAME_ID = 'star-chart-parallel-planes'
const route = useRoute()
const nav = useGameNavigation(GAME_ID)

const themeId = ref((route.params.themeId as string) || THEME_ORDER[0])
const theme = computed(() => getThemeById(themeId.value))

function switchTheme(id: ThemeId) {
  themeId.value = id
  closeInspect()
}
const playerData = ref<PlayerData | null>(null)
const inspectIndex = ref(-1)
const pointerStartX = ref(0)

const busy = ref(false)
const purchaseTarget = ref<{
  id: number
  name: string
  title: string
  rarity: Rarity
  imageIndex: number
} | null>(null)
const purchaseSuccess = ref(false)

const filteredCharacters = computed(() => {
  if (!theme.value) return []
  return theme.value.characters
})

const unlockedIndices = computed(() => {
  if (!theme.value || !playerData.value) return [] as number[]
  return theme.value.characters
    .map((c, i) => (playerData.value!.unlockedCards.includes(c.id) ? i : -1))
    .filter((i) => i >= 0)
})

const canGoPrev = computed(() => {
  const pos = unlockedIndices.value.indexOf(inspectIndex.value)
  return pos > 0
})

const canGoNext = computed(() => {
  const pos = unlockedIndices.value.indexOf(inspectIndex.value)
  return pos >= 0 && pos < unlockedIndices.value.length - 1
})

const collectedCount = computed(() => {
  if (!theme.value || !playerData.value) return 0
  return theme.value.characters.filter((c) => playerData.value!.unlockedCards.includes(c.id)).length
})

onMounted(async () => {
  playerData.value = await loadPlayerData()
})

function getImageUrl(name: string): string {
  return new URL(`./assets/images/${themeId.value}/chars/${name}.png`, import.meta.url).href
}
function getBgUrl(): string {
  return new URL(`./assets/images/${themeId.value}/bg.png`, import.meta.url).href
}

function isCollected(charId: number): boolean {
  return playerData.value?.unlockedCards.includes(charId) ?? false
}

function canExchange(char: { id: number }): boolean {
  if (!playerData.value || isCollected(char.id)) return false
  return true
}

function canAfford(char: { rarity: Rarity }): boolean {
  if (!playerData.value) return false
  return playerData.value.economy.tickets >= RARITY_SHOP_PRICE[char.rarity]
}

function openInspect(idx: number) {
  const ch = filteredCharacters.value[idx]
  if (!ch || !isCollected(ch.id)) return
  const realIdx = theme.value!.characters.findIndex((c) => c.id === ch.id)
  inspectIndex.value = realIdx
}
function closeInspect() {
  inspectIndex.value = -1
}
function prevImage() {
  const indices = unlockedIndices.value
  const pos = indices.indexOf(inspectIndex.value)
  if (pos > 0) inspectIndex.value = indices[pos - 1]
}
function nextImage() {
  const indices = unlockedIndices.value
  const pos = indices.indexOf(inspectIndex.value)
  if (pos >= 0 && pos < indices.length - 1) inspectIndex.value = indices[pos + 1]
}
function onPointerDown(e: PointerEvent) {
  pointerStartX.value = e.clientX
}
function onPointerUp(e: PointerEvent) {
  const dx = e.clientX - pointerStartX.value
  if (Math.abs(dx) > 50) {
    if (dx > 0) prevImage()
    else nextImage()
  }
}

function goBack() {
  nav.goToHome()
}

function openPurchase(ch: {
  id: number
  name: string
  title: string
  rarity: Rarity
  imageIndex: number
}) {
  purchaseTarget.value = ch
}

function closePurchase() {
  if (busy.value) return
  purchaseTarget.value = null
  purchaseSuccess.value = false
}

async function confirmPurchase() {
  const char = purchaseTarget.value
  if (!char || !playerData.value || busy.value) return
  const price = RARITY_SHOP_PRICE[char.rarity]
  if (playerData.value.economy.tickets < price) return

  busy.value = true
  try {
    const newEconomy = spendTickets(playerData.value.economy, price)
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
    purchaseTarget.value = null
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <GameContainer v-if="theme" :bg-image="getBgUrl()">
    <div class="universe star-page">
      <div class="uni-bar star-top-hud">
        <button class="uni-back-btn" @click="goBack" aria-label="返回">
          <svg viewBox="0 0 24 24" fill="currentColor" class="uni-back-arrow">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span>返回</span>
        </button>
        <span class="uni-title">{{ theme.name }}</span>
        <div class="uni-bar-right">
          <span class="uni-progress star-hud-value"
            >{{ collectedCount }}/{{ theme.characters.length }}</span
          >
        </div>
      </div>

      <div class="uni-theme-switcher">
        <button
          v-for="t in THEMES"
          :key="t.id"
          class="theme-chip star-rune-tab"
          :class="{ active: themeId === t.id }"
          :style="themeId === t.id ? { '--chip-color': t.accentColor } : {}"
          @click="switchTheme(t.id)"
        >
          {{ t.name }}
        </button>
      </div>

      <div class="uni-grid-wrap">
        <div class="uni-grid">
          <button
            v-for="(char, i) in filteredCharacters"
            :key="char.id"
            class="uni-card star-card"
            :style="{ '--rarity': RARITY_COLORS[char.rarity] }"
            :class="{
              collected: isCollected(char.id),
              locked: !isCollected(char.id),
              exchangeable: canExchange(char),
            }"
            @click="isCollected(char.id) ? openInspect(i) : openPurchase(char)"
          >
            <span class="uni-rarity-badge">{{ RARITY_LABEL[char.rarity] }}</span>
            <img
              :src="getImageUrl(theme.imageNames[char.imageIndex])"
              :alt="char.name"
              class="uni-img"
              draggable="false"
              loading="lazy"
            />
            <div v-if="!isCollected(char.id)" class="uni-lock-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor" class="lock-icon">
                <path
                  d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V20h-2v-2.277a1.993 1.993 0 0 1 .567-3.677A2.001 2.001 0 0 1 14 16a1.99 1.99 0 0 1-1 1.723z"
                />
              </svg>
            </div>
            <span class="uni-label">{{ isCollected(char.id) ? char.name : '？？？' }}</span>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="inspect">
        <div
          v-if="inspectIndex >= 0 && theme"
          class="inspect-overlay"
          @click.self="closeInspect"
          @pointerdown="onPointerDown"
          @pointerup="onPointerUp"
        >
          <button class="inspect-close-btn star-hit-icon" @click="closeInspect" aria-label="关闭">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div class="inspect-image-wrap">
            <button
              :disabled="!canGoPrev"
              class="inspect-side-btn inspect-side-prev star-hit-icon"
              @click="prevImage"
              aria-label="上一张"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div class="inspect-img-container">
              <span
                class="inspect-img-rarity"
                :style="{ background: RARITY_COLORS[theme.characters[inspectIndex].rarity] }"
              >
                {{ RARITY_LABEL[theme.characters[inspectIndex].rarity] }}
              </span>
              <img
                :src="getImageUrl(theme.imageNames[theme.characters[inspectIndex].imageIndex])"
                :alt="
                  isCollected(theme.characters[inspectIndex].id)
                    ? theme.characters[inspectIndex].name
                    : '沉睡星魂'
                "
                class="inspect-image"
                :class="{ locked: !isCollected(theme.characters[inspectIndex].id) }"
                draggable="false"
              />
            </div>
            <button
              :disabled="!canGoNext"
              class="inspect-side-btn inspect-side-next star-hit-icon"
              @click="nextImage"
              aria-label="下一张"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div class="inspect-info">
            <span class="inspect-title">
              {{
                isCollected(theme.characters[inspectIndex].id)
                  ? theme.characters[inspectIndex].title
                  : '沉睡星魂'
              }}
            </span>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="purchaseTarget && !purchaseSuccess"
        class="modal-overlay"
        @click.self="closePurchase"
      >
        <div class="modal star-modal">
          <button class="star-modal-close" aria-label="关闭" @click="closePurchase">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            class="modal-img-wrap"
            :style="{ '--rarity-color': RARITY_COLORS[purchaseTarget.rarity] }"
          >
            <img
              :src="getImageUrl(theme.imageNames[purchaseTarget.imageIndex])"
              alt="沉睡星魂"
              class="modal-img modal-img-locked"
              draggable="false"
            />
          </div>
          <h2 class="modal-title">？？？</h2>
          <p class="modal-price">
            花费
            <span class="modal-price-amount"
              >🎫 {{ RARITY_SHOP_PRICE[purchaseTarget.rarity] }}</span
            >
            星券兑换此角色？
          </p>
          <div class="modal-actions">
            <button class="dialog-btn star-secondary-btn" :disabled="busy" @click="closePurchase">
              <span class="modal-btn-inner">取消</span>
            </button>
            <button
              class="dialog-btn star-primary-btn"
              :disabled="busy || !canAfford(purchaseTarget)"
              @click="confirmPurchase"
            >
              <span class="modal-btn-inner">
                <template v-if="busy">唤醒中...</template>
                <template v-else-if="!canAfford(purchaseTarget)">星券不足</template>
                <template v-else>星魂唤醒</template>
              </span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="purchaseSuccess" class="purchase-success-overlay" @click="closePurchase">
        <div class="success-starburst" />
        <div class="success-card">
          <p class="success-text">星魂唤醒确认</p>
          <p class="success-sub">角色已加入星魂档案</p>
        </div>
      </div>
    </Teleport>
  </GameContainer>
</template>

<style scoped>
.universe {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.uni-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(4px, 0.8cqh, 8px) clamp(4px, 1.5cqw, 10px);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  background: rgba(8, 12, 35, 0.4);
  border: 1px solid rgba(100, 180, 255, 0.08);
  border-radius: 14px 14px 0 0;
  backdrop-filter: blur(8px);
}
.uni-back-btn {
  position: absolute;
  left: clamp(6px, 1.5cqw, 10px);
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: clamp(16px, 3.5cqw, 20px);
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  padding: 4px 6px;
}
.uni-back-btn:active {
  color: rgba(255, 255, 255, 0.95);
  transform: scale(0.95);
}
.uni-back-arrow {
  width: clamp(22px, 5cqw, 28px);
  height: clamp(22px, 5cqw, 28px);
  flex-shrink: 0;
  color: #ffffff;
}
.uni-title {
  font-size: clamp(16px, 4cqw, 24px);
  font-weight: 800;
  color: #e0e8ff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.uni-progress {
  font-size: clamp(12px, 2.8cqw, 15px);
  font-weight: 700;
  color: rgba(180, 220, 255, 0.7);
  line-height: 1;
}

.uni-bar-right {
  position: absolute;
  right: clamp(6px, 1.5cqw, 10px);
  display: flex;
  align-items: center;
  gap: clamp(4px, 1cqw, 8px);
}

.uni-theme-switcher {
  display: flex;
  gap: clamp(4px, 1cqw, 8px);
  padding: clamp(4px, 0.8cqh, 8px) clamp(12px, 2.5cqw, 20px);
  margin: clamp(4px, 0.8cqh, 8px) 0;
  flex-shrink: 0;
  width: 100%;
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(100, 180, 255, 0.1);
  border-radius: 14px 14px 0 0;
  backdrop-filter: blur(6px);
}
.theme-chip {
  position: relative;
  flex: 1;
  min-width: 0;
  font-size: clamp(11px, 2.2cqw, 13px);
  font-weight: 900;
  padding: clamp(4px, 0.7cqh, 7px) clamp(10px, 2cqw, 16px);
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.theme-chip.active {
  background: rgba(12, 24, 58, 0.92);
  color: #fff;
  border-radius: 4px;
}

/* 左侧三角形 — 覆盖整个侧边高度 */
.uni-theme-switcher .theme-chip.active::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 0;
  width: 8px;
  height: 100%;
  background: rgba(12, 24, 58, 0.92);
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
}

/* 右侧三角形（覆盖 star-rune-tab 的下划线）— 覆盖整个侧边高度 */
.uni-theme-switcher .theme-chip.active::after {
  content: '';
  position: absolute;
  left: auto;
  right: -7px;
  top: 0;
  bottom: auto;
  width: 8px;
  height: 100%;
  border-radius: 0;
  background: rgba(12, 24, 58, 0.92);
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.uni-grid-wrap {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: clamp(4px, 1cqh, 10px) 0;
}
.uni-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(8px, 2cqw, 14px);
}

.uni-card {
  aspect-ratio: 2 / 3;
  position: relative;
  overflow: hidden;
  border-radius: 0;
  border: 1px solid rgba(100, 180, 255, 0.08);
  background: rgba(12, 20, 50, 0.55);
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
  box-shadow:
    0 4px 0 rgba(5, 10, 30, 0.6),
    0 6px 16px rgba(0, 0, 0, 0.35);
}
.uni-card:active {
  transform: scale(0.94) translateY(2px);
}
.uni-card.collected {
  border-color: var(--rarity, rgba(100, 180, 255, 0.3));
}
.uni-card.exchangeable {
  border-color: rgba(255, 215, 79, 0.55);
  box-shadow:
    0 4px 0 rgba(5, 10, 30, 0.6),
    0 0 18px rgba(255, 215, 79, 0.14);
}
.uni-card.locked .uni-img {
  filter: brightness(0) saturate(0) contrast(1.6) blur(1px);
  opacity: 0.58;
  transition: filter 0.3s;
}
.uni-card.locked {
  cursor: pointer;
}

.uni-rarity-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 3;
  padding: 1px clamp(5px, 1.2cqw, 8px);
  font-size: clamp(9px, 2cqw, 11px);
  font-weight: 800;
  color: #fff;
  background: var(--rarity, rgba(100, 180, 255, 0.7));
  border-radius: 5px;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.uni-lock-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lock-icon {
  width: clamp(24px, 6cqw, 36px);
  height: clamp(24px, 6cqw, 36px);
  color: rgba(255, 255, 255, 0.2);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.uni-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.uni-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px clamp(4px, 1cqw, 8px);
  background: linear-gradient(transparent, rgba(8, 12, 35, 0.9));
  font-size: clamp(10px, 2cqw, 12px);
  font-weight: 700;
  color: #e0e8f0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 5;
}
.exchange-mark {
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 5;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 215, 79, 0.92);
  color: #1f2937;
  font-size: clamp(9px, 1.8cqw, 11px);
  font-weight: 900;
}

.inspect-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(8, 4, 16, 0.96);
  display: flex;
  flex-direction: column;
}
.inspect-close-btn {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  z-index: 20;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: transparent;
  color: rgba(180, 220, 255, 0.9);
  box-shadow: none;
}
.inspect-image-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 0 12px;
  position: relative;
}
.inspect-img-rarity {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 15;
  padding: 2px clamp(6px, 1.5cqw, 10px);
  font-size: clamp(11px, 2.5cqw, 14px);
  font-weight: 900;
  color: #fff;
  border-radius: 0 8px 0 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.inspect-img-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}
.inspect-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 2px solid rgba(100, 180, 255, 0.18);
  border-radius: 0;
}
.inspect-image.locked {
  filter: brightness(0) saturate(0) contrast(1.8) blur(2px);
  opacity: 0.65;
}
.inspect-side-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: transparent;
  color: rgba(180, 220, 255, 0.8);
}
.inspect-side-btn:disabled {
  opacity: 0.15;
  cursor: default;
}
.inspect-side-prev {
  left: 8px;
}
.inspect-side-next {
  right: 8px;
}
.inspect-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 0;
  flex-shrink: 0;
}
.inspect-title {
  font-size: clamp(14px, 3.5cqw, 20px);
  font-weight: 700;
  color: #e0e8f0;
  text-align: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
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
  height: clamp(180px, 60cqw, 250px);
  margin: 0 auto clamp(12px, 2cqh, 16px);
  border-radius: 0;
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

.modal-img-locked {
  filter: brightness(0) saturate(0) contrast(1.6) blur(1px);
  opacity: 0.58;
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
  gap: clamp(8px, 1.5cqw, 12px);
  justify-content: center;
}

.dialog-btn {
  flex: 1;
  min-height: 52px;
  padding: 0 18px;
  font-size: clamp(13px, 2.5cqw, 14px);
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.modal-btn-inner {
  position: relative;
  z-index: 1;
  min-height: 52px;
  display: grid;
  place-items: center;
}

.purchase-success-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
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

.inspect-enter-active,
.inspect-leave-active {
  transition: opacity 0.25s ease;
}
.inspect-enter-from,
.inspect-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .uni-card,
  .uni-card.locked .uni-img,
  .inspect-enter-active,
  .inspect-leave-active,
  .modal-btn,
  .success-starburst,
  .success-text,
  .success-sub,
  .theme-chip {
    transition: none;
    animation: none;
  }
}
</style>
