<script setup lang="ts">
import { GAME_ID } from './constants'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useGameRouteLifecycle } from '../../composables/useGameRouteLifecycle'
import { retainCtx, destroyCtx } from '../../utils/soundUtils'
import type { GameMode } from './types'
import GameContainer from '../../components/GameContainer.vue'
import FloatingPieces from './components/FloatingPieces.vue'
import { sfxManager } from './audio/sfxManager'
import { settingsStore } from './audio/settingsStore'
import './theme.css'

const nav = useGameNavigation(GAME_ID)
const { registerCleanup } = useGameRouteLifecycle()

const openPlay = (mode: GameMode) => {
  nav.goToPlay({ mode })
}

retainCtx()
sfxManager.init().then(() => {
  settingsStore.load()
})

registerCleanup(GAME_ID, () => {
  sfxManager.destroy()
  destroyCtx()
})
</script>

<template>
  <GameContainer bg-class="felt-bg">
    <template #decoration>
      <FloatingPieces />
    </template>
    <div class="home">
      <!-- Decorative scattered pieces -->
      <div class="deco-piece top-left" />
      <div class="deco-piece top-right" />
      <div class="deco-piece bottom-left" />
      <div class="deco-piece bottom-right" />

      <div class="logo-area">
        <div class="logo-bar" />
        <h1 class="logo-text">黑白棋</h1>
        <p class="logo-subtitle">REVERSI</p>
        <div class="logo-bar" />
      </div>

      <div class="mode-buttons">
        <button class="mode-btn" @click="openPlay('ai')">
          <div class="mode-btn-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div class="mode-btn-content">
            <span class="mode-btn-title">人机对战</span>
            <span class="mode-btn-desc">与 AI 一决高下</span>
          </div>
        </button>

        <button class="mode-btn" @click="openPlay('local')">
          <div class="mode-btn-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div class="mode-btn-content">
            <span class="mode-btn-title">双人对战</span>
            <span class="mode-btn-desc">和好友同一设备对战</span>
          </div>
        </button>
      </div>

      <button class="exit-btn" @click="nav.exitGame()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
            fill="currentColor"
          />
        </svg>
        <span>退出游戏</span>
      </button>
    </div>
  </GameContainer>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(20px, 4cqh, 36px);
  height: 100%;
  /* padding 由 GameContainer 统一控制，游戏根容器禁止自行添加 */
  position: relative;
  overflow: hidden;
}

/* Decorative scattered pieces */
.deco-piece {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  opacity: 0.15;
  pointer-events: none;
}

.deco-piece.top-left {
  top: 8%;
  left: 6%;
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  transform: rotate(-15deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.deco-piece.top-right {
  top: 12%;
  right: 8%;
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  transform: rotate(25deg);
  border: 1px solid #bbb5ad;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.deco-piece.bottom-left {
  bottom: 18%;
  left: 5%;
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  transform: rotate(-30deg);
  border: 1px solid #bbb5ad;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.deco-piece.bottom-right {
  bottom: 15%;
  right: 6%;
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  transform: rotate(20deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.logo-bar {
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #5a3a1a, transparent);
  border-radius: 2px;
}

.logo-text {
  font-size: clamp(36px, 8cqw, 52px);
  font-weight: 800;
  color: #c9a84c;
  margin: 0;
  letter-spacing: 0.12em;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(201, 168, 76, 0.25);
}

.logo-subtitle {
  font-size: clamp(11px, 2.5cqw, 13px);
  color: #8b9a6e;
  margin: 0;
  letter-spacing: 0.3em;
  font-weight: 600;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 300px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: clamp(14px, 3cqh, 20px);
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid #5a3a1a;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-align: left;
  width: 100%;
  min-height: 56px;
}

.mode-btn:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: #c9a84c;
}

.mode-btn:active {
  transform: scale(0.97);
}

.mode-btn-icon {
  flex-shrink: 0;
  color: #c9a84c;
  opacity: 0.8;
}

.mode-btn:hover .mode-btn-icon {
  opacity: 1;
}

.mode-btn-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-btn-title {
  font-size: 16px;
  font-weight: 700;
  color: #e8eae3;
}

.mode-btn-desc {
  font-size: 13px;
  color: #8b9a6e;
}

.exit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #8b9a6e;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease-out;
  min-height: 44px;
}

.exit-btn:hover {
  color: #e8eae3;
}

.exit-btn:focus-visible {
  outline: 2px solid #c9a84c;
  outline-offset: 2px;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .mode-btn:active {
    transform: none;
  }
}
</style>
