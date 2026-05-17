<script setup lang="ts">
import { useGameNavigation } from '../../composables/useGameNavigation'
import './theme.css'

const GAME_ID = '2048'
const nav = useGameNavigation(GAME_ID)
</script>

<template>
  <div class="home-page theme-2048-surface">
    <div class="home-inner">
      <div class="logo-lockup" aria-hidden="true">
        <div class="logo-row">
          <div class="logo-tile logo-tile-2">2</div>
          <div class="logo-tile logo-tile-0">0</div>
          <div class="logo-tile logo-tile-4">4</div>
          <div class="logo-tile logo-tile-8">8</div>
        </div>
        <div class="logo-label">
          <span>数</span>
          <span>字</span>
          <span>方</span>
          <span>块</span>
        </div>
      </div>

      <div class="menu">
        <div class="menu-row">
          <button class="menu-btn" @click="nav.goToPlay()">开始游戏</button>
          <button class="icon-btn" aria-label="开始游戏" @click="nav.goToPlay()">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
        <div class="menu-row">
          <button class="menu-btn" @click="nav.exitGame()">退出</button>
          <button class="icon-btn" aria-label="退出" @click="nav.exitGame()">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  overflow: hidden;
}

.home-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  aspect-ratio: 3 / 4;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 78px;
  padding: clamp(24px, 8vh, 72px) 18px 24px;
  box-sizing: border-box;
}

.logo-lockup {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 340px);
  min-height: 112px;
}

.logo-row {
  position: relative;
  display: flex;
  gap: 9px;
  align-items: center;
  padding-right: 38px;
}

.logo-tile {
  width: clamp(56px, 16vw, 70px);
  height: clamp(56px, 16vw, 70px);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Trebuchet MS', 'Avenir Next', 'PingFang SC', sans-serif;
  font-size: clamp(32px, 9vw, 41px);
  font-weight: 900;
  line-height: 1;
  color: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 5px 10px rgba(114, 77, 48, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.logo-tile-2 {
  background: #e8b940;
}

.logo-tile-0 {
  position: absolute;
  z-index: 2;
  top: clamp(-36px, -10vw, -42px);
  left: clamp(48px, 14vw, 60px);
  background: #f67256;
  transform: rotate(30deg);
}

.logo-tile-4 {
  margin-left: 40px;
  background: #c96749;
}

.logo-tile-8 {
  background: #f3ad4f;
}

.logo-label {
  position: absolute;
  right: 0;
  top: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: rgba(124, 82, 32, 0.78);
  font-family: 'Trebuchet MS', 'Avenir Next', 'PingFang SC', sans-serif;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.02;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}

.menu {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 28px;
  align-items: center;
}

.menu-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: min(72%, 300px);
}

.menu-btn {
  flex: 1;
  min-height: 58px;
  padding: 12px 22px;
  border: 1px solid rgba(174, 103, 55, 0.12);
  border-radius: 9px;
  font-family: 'Trebuchet MS', 'Avenir Next', 'PingFang SC', sans-serif;
  font-size: 23px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  text-align: center;
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
  background: linear-gradient(180deg, #e59c56 0%, #db9047 100%);
  box-shadow:
    0 5px 0 rgba(139, 91, 56, 0.34),
    0 12px 20px rgba(126, 81, 44, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  text-shadow: 0 1px 1px rgba(116, 73, 42, 0.18);
}

.menu-btn:hover {
  filter: brightness(1.03);
}

.menu-btn:active {
  transform: translateY(3px) scale(0.99);
  box-shadow:
    0 2px 0 rgba(139, 91, 56, 0.34),
    0 7px 12px rgba(126, 81, 44, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.icon-btn {
  width: 58px;
  min-height: 58px;
  border: 1px solid rgba(174, 103, 55, 0.12);
  border-radius: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
  background: linear-gradient(180deg, #cf795d 0%, #c96d53 100%);
  box-shadow:
    0 5px 0 rgba(118, 77, 58, 0.34),
    0 12px 20px rgba(126, 81, 44, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.9);
}

.icon-btn:hover {
  filter: brightness(1.03);
}

.icon-btn svg {
  width: 25px;
  height: 25px;
}

.icon-btn:active {
  transform: translateY(3px) scale(0.98);
  box-shadow:
    0 2px 0 rgba(118, 77, 58, 0.34),
    0 7px 12px rgba(126, 81, 44, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

@media (max-width: 420px) {
  .home-inner {
    gap: 48px;
    padding: clamp(18px, 6vh, 48px) 14px 22px;
  }

  .logo-lockup {
    transform: scale(0.86);
  }

  .menu-row {
    width: min(80%, 300px);
    gap: 12px;
  }

  .menu-btn {
    min-height: 54px;
    font-size: 21px;
  }

  .icon-btn {
    width: 54px;
    min-height: 54px;
  }
}

@media (min-width: 768px) {
  .home-inner {
    gap: 96px;
    padding: clamp(32px, 10vh, 88px) 22px 28px;
  }

  .logo-lockup {
    width: min(100%, 400px);
    min-height: 132px;
  }

  .logo-row {
    gap: 11px;
    padding-right: 46px;
  }

  .logo-tile {
    width: 80px;
    height: 80px;
    font-size: 46px;
  }

  .logo-tile-0 {
    top: -48px;
    left: 70px;
  }

  .logo-tile-4 {
    margin-left: 48px;
  }

  .logo-label {
    font-size: 22px;
  }

  .menu {
    gap: 34px;
  }

  .menu-row {
    width: min(68%, 340px);
    gap: 18px;
  }

  .menu-btn {
    min-height: 64px;
    font-size: 25px;
  }

  .icon-btn {
    width: 64px;
    min-height: 64px;
  }

  .icon-btn svg {
    width: 28px;
    height: 28px;
  }
}

@media (min-width: 1024px) {
  .home-inner {
    gap: 128px;
    padding: clamp(48px, 14vh, 120px) 30px 36px;
  }

  .logo-lockup {
    width: min(100%, 520px);
    min-height: 172px;
  }

  .logo-row {
    gap: 15px;
    padding-right: 62px;
  }

  .logo-tile {
    width: 100px;
    height: 100px;
    font-size: 58px;
  }

  .logo-tile-0 {
    top: -60px;
    left: 90px;
  }

  .logo-tile-4 {
    margin-left: 64px;
  }

  .logo-label {
    font-size: 28px;
  }

  .menu {
    gap: 46px;
  }

  .menu-row {
    width: min(60%, 420px);
    gap: 22px;
  }

  .menu-btn {
    min-height: 76px;
    font-size: 29px;
  }

  .icon-btn {
    width: 76px;
    min-height: 76px;
  }

  .icon-btn svg {
    width: 32px;
    height: 32px;
  }
}

@media (min-width: 1440px) {
  .home-inner {
    gap: 148px;
    padding: clamp(56px, 16vh, 140px) 34px 40px;
  }

  .logo-lockup {
    width: min(100%, 600px);
    min-height: 200px;
  }

  .logo-row {
    gap: 18px;
    padding-right: 72px;
  }

  .logo-tile {
    width: 116px;
    height: 116px;
    font-size: 68px;
  }

  .logo-tile-0 {
    top: -70px;
    left: 104px;
  }

  .logo-tile-4 {
    margin-left: 74px;
  }

  .logo-label {
    font-size: 32px;
  }

  .menu {
    gap: 54px;
  }

  .menu-row {
    width: min(56%, 480px);
    gap: 24px;
  }

  .menu-btn {
    min-height: 84px;
    font-size: 32px;
  }

  .icon-btn {
    width: 84px;
    min-height: 84px;
  }

  .icon-btn svg {
    width: 36px;
    height: 36px;
  }
}
</style>
