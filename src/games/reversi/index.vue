<script setup lang="ts">
import { useRoute } from 'vue-router'

import { GAME_ID } from './constants'
import { useGameNavigation } from '../../composables/useGameNavigation'
import { useReversiGame } from './composables/useReversiGame'
import { settingsStore } from './audio/settingsStore'
import GameContainer from '../../components/GameContainer.vue'
import FloatingPieces from './components/FloatingPieces.vue'
import GameToolbar from './components/GameToolbar.vue'
import './theme.css'
import HomeDialog from './components/HomeDialog.vue'
import ResultDialog from './components/ResultDialog.vue'
import ExitConfirm from './components/ExitConfirm.vue'

const route = useRoute()
const nav = useGameNavigation(GAME_ID)

const {
  board,
  currentPlayer,
  status,
  moveCount,
  blackCount,
  whiteCount,
  activeMode,
  activeHumanSide,
  loaded,
  profile,
  showResultDialog,
  showExitConfirm,
  showStartSetup,
  pendingSetupMode,
  droppingPosition,
  flippingPositions,
  scoreChangedBlack,
  scoreChangedWhite,
  isSinglePlayer,
  isBoardLocked,
  statusText,
  isLegalPosition,
  isHintPosition,
  isLastMove,
  isFlipping,
  handleCellClick,
  handleRestart,
  handleExit,
  handleConfirmExit,
  handleCancelExit,
  handleUndo,
  handleHint,
  handleStartConfig,
} = useReversiGame(route)

const handleToggleSound = () => {
  settingsStore.toggleAll()
}

const handleResultRestart = () => {
  handleRestart()
}

const handleCloseSetup = () => {
  showStartSetup.value = false
}

const handleResultClose = () => {
  nav.goToHome()
}
</script>

<template>
  <GameContainer v-if="loaded" bg-class="felt-bg">
    <template #decoration>
      <FloatingPieces />
    </template>
    <div class="play-inner">
      <!-- Top bar -->
      <div class="top-bar">
        <button class="top-exit-btn" aria-label="退出" @click="handleExit">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
              fill="currentColor"
            />
          </svg>
        </button>
        <span class="top-title">黑白棋</span>
        <div v-if="isSinglePlayer" class="top-coins">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"
              fill="#c9a84c"
            />
          </svg>
          <span class="coins-value">{{ profile.coins }}</span>
        </div>
      </div>

      <!-- Score bar with wood frame -->
      <div class="score-bar">
        <div class="score-side" :class="{ active: currentPlayer === 'black' }">
          <div class="score-disk black-disk" />
          <span class="score-label">黑方</span>
        </div>
        <div class="score-numbers">
          <span class="score-num" :class="{ changed: scoreChangedBlack }">{{ blackCount }}</span>
          <span class="score-colon">:</span>
          <span class="score-num" :class="{ changed: scoreChangedWhite }">{{ whiteCount }}</span>
        </div>
        <div class="score-side" :class="{ active: currentPlayer === 'white' }">
          <div class="score-disk white-disk" />
          <span class="score-label">白方</span>
        </div>
      </div>

      <!-- Board with wood frame -->
      <div class="board-frame">
        <div class="board">
          <template v-for="row in 8" :key="row">
            <button
              v-for="col in 8"
              :key="`${row}-${col}`"
              class="cell"
              :class="{
                legal: isLegalPosition({ row: row - 1, col: col - 1 }),
                hint: isHintPosition({ row: row - 1, col: col - 1 }),
                'last-move': isLastMove({ row: row - 1, col: col - 1 }),
              }"
              :disabled="isBoardLocked || flippingPositions.size > 0"
              @pointerdown="handleCellClick({ row: row - 1, col: col - 1 })"
              :aria-label="`第${row}行第${col}列`"
            >
              <span
                v-if="isLegalPosition({ row: row - 1, col: col - 1 }) && !isBoardLocked"
                class="move-dot"
              />
              <div
                v-if="board[row - 1][col - 1]"
                class="piece"
                :class="{
                  black: board[row - 1][col - 1]?.color === 'black',
                  white: board[row - 1][col - 1]?.color === 'white',
                  flipping: isFlipping({ row: row - 1, col: col - 1 }),
                  dropping: droppingPosition?.row === row - 1 && droppingPosition?.col === col - 1,
                }"
              />
            </button>
          </template>
        </div>
      </div>

      <!-- Status text -->
      <div class="status-text">{{ statusText }}</div>

      <!-- Toolbar -->
      <GameToolbar
        :is-single-player="isSinglePlayer"
        @restart="handleRestart"
        @undo="handleUndo"
        @hint="handleHint"
        @toggle-sound="handleToggleSound"
      />
    </div>

    <HomeDialog
      v-if="showStartSetup"
      :mode="pendingSetupMode ?? 'ai'"
      @start="handleStartConfig"
      @close="handleCloseSetup"
    />

    <ResultDialog
      v-if="showResultDialog"
      :status="status"
      :mode="activeMode"
      :move-count="moveCount"
      :board="board"
      :coins-earned="
        status === 'draw' ? 10 : status === `${activeHumanSide}-wins` && isSinglePlayer ? 20 : 0
      "
      @restart="handleResultRestart"
      @close="handleResultClose"
    />

    <ExitConfirm v-if="showExitConfirm" @confirm="handleConfirmExit" @cancel="handleCancelExit" />
  </GameContainer>
</template>

<style scoped>
.play-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  background: #1a3a28;
}

/* Top bar */
.top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  /* padding 由 GameContainer 统一控制，游戏根容器禁止自行添加 */
  min-height: 48px;
  position: relative;
}

.top-exit-btn {
  position: absolute;
  left: clamp(4px, 1.5cqw, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #8b9a6e;
  cursor: pointer;
  transition: all 0.1s ease-out;
  flex-shrink: 0;
}

.top-exit-btn:hover {
  color: #e8eae3;
  background: rgba(0, 0, 0, 0.2);
}

.top-exit-btn:active {
  transform: scale(0.92);
}

.top-exit-btn:focus-visible {
  outline: 2px solid #c9a84c;
  outline-offset: 2px;
}

.top-title {
  font-size: 18px;
  font-weight: 700;
  color: #c9a84c;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 4px rgba(201, 168, 76, 0.2);
}

.top-coins {
  position: absolute;
  right: clamp(4px, 1.5cqw, 12px);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 32px;
}

.coins-value {
  font-size: 14px;
  font-weight: 700;
  color: #c9a84c;
}

/* Score bar */
.score-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - clamp(16px, 4cqw, 32px));
  padding: clamp(8px, 1.5cqh, 12px) clamp(12px, 2cqw, 20px);
  background: #5a3a1a;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.score-side {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.5;
  transition: opacity 0.3s ease-out;
}

.score-side.active {
  opacity: 1;
}

.score-side.active .score-label {
  color: #e8eae3;
}

@keyframes side-glow {
  0%,
  100% {
    text-shadow: 0 0 8px rgba(201, 168, 76, 0.2);
  }
  50% {
    text-shadow: 0 0 16px rgba(201, 168, 76, 0.4);
  }
}

.score-side.active .score-label {
  animation: side-glow 1.5s ease-in-out infinite;
}

.score-disk {
  width: clamp(16px, 3cqw, 20px);
  height: clamp(16px, 3cqw, 20px);
  border-radius: 50%;
  flex-shrink: 0;
}

.black-disk {
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
}

.white-disk {
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  border: 1px solid #bbb5ad;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    inset 0 -1px 2px rgba(0, 0, 0, 0.05);
}

.score-label {
  font-size: 14px;
  font-weight: 600;
  color: #8b9a6e;
  transition: color 0.3s ease-out;
}

.score-numbers {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-num {
  font-size: 22px;
  font-weight: 700;
  color: #c9a84c;
  min-width: 24px;
  text-align: center;
  text-shadow: 0 1px 4px rgba(201, 168, 76, 0.15);
  transition: transform 0.2s ease-out;
}

.score-num.changed {
  animation: score-pop 0.2s ease-out;
}

@keyframes score-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

.score-colon {
  font-size: 18px;
  font-weight: 700;
  color: #8b9a6e;
}

/* Board frame */
.board-frame {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: clamp(4px, 1cqh, 8px) 0;
}

.board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: min(100%, calc(var(--gc-aspect-ratio, 0.75) * 100cqh - 200px));
  aspect-ratio: 1;
  border: 4px solid #5a3a1a;
  border-radius: 4px;
  background: #2d5a3d;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.cell {
  position: relative;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.1s ease-out;
  min-width: 0;
  min-height: 0;
}

.cell:disabled {
  cursor: default;
}

.cell:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
}

.cell:active:not(:disabled) {
  background: rgba(201, 168, 76, 0.12);
  transition: background 0.05s ease-out;
}

.cell.last-move {
  background: rgba(201, 168, 76, 0.08);
}

.cell.legal:not(:disabled) {
  cursor: pointer;
}

/* Move dot (legal move indicator) */
.move-dot {
  width: 28%;
  height: 28%;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.35);
  border: 2px solid rgba(201, 168, 76, 0.5);
  position: absolute;
  z-index: 0;
  pointer-events: none;
}

.cell.hint .move-dot {
  background: rgba(201, 168, 76, 0.5);
  border-color: #c9a84c;
  animation: hint-pulse 1s ease-in-out infinite;
}

@keyframes hint-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

/* Piece */
.piece {
  width: 82%;
  height: 82%;
  border-radius: 50%;
  position: relative;
  z-index: 1;
}

.piece::after {
  content: '';
  position: absolute;
  top: 8%;
  left: 15%;
  width: 35%;
  height: 25%;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.piece.black {
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    inset 0 2px 3px rgba(255, 255, 255, 0.1);
}

.piece.black::after {
  background: linear-gradient(135deg, rgba(100, 100, 100, 0.25), rgba(100, 100, 100, 0));
}

.piece.white {
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  border: 1px solid #bbb5ad;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.12),
    inset 0 -2px 4px rgba(0, 0, 0, 0.05),
    inset 0 2px 3px rgba(255, 255, 255, 0.8);
}

/* Piece appear animation - scale from center (only newly placed piece) */
.piece.dropping {
  animation: piece-appear 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes piece-appear {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Flipping animation with perspective 3D */
.piece.black.flipping {
  animation: flip-to-white 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.piece.white.flipping {
  animation: flip-to-black 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes flip-to-white {
  0% {
    transform: perspective(500px) rotateY(0deg);
    background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
    border: 0;
  }
  49% {
    transform: perspective(500px) rotateY(90deg);
    background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
    border: 0;
  }
  50% {
    transform: perspective(500px) rotateY(90deg);
    background: #2d5a3d;
    border: 0;
  }
  100% {
    transform: perspective(500px) rotateY(180deg);
    background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
    border: 1px solid #bbb5ad;
  }
}

@keyframes flip-to-black {
  0% {
    transform: perspective(500px) rotateY(0deg);
    background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
    border: 1px solid #bbb5ad;
  }
  49% {
    transform: perspective(500px) rotateY(90deg);
    background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
    border: 1px solid #bbb5ad;
  }
  50% {
    transform: perspective(500px) rotateY(90deg);
    background: #2d5a3d;
    border: 0;
  }
  100% {
    transform: perspective(500px) rotateY(180deg);
    background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
    border: 0;
  }
}

/* Status text */
.status-text {
  flex-shrink: 0;
  font-size: 14px;
  color: #e8eae3;
  padding: clamp(4px, 1cqh, 8px) 0;
  min-height: 1.5em;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* Responsive: smaller pieces on narrow containers */
@container game (max-width: 400px) {
  .piece {
    width: 76%;
    height: 76%;
  }

  .move-dot {
    width: 24%;
    height: 24%;
  }
}

/* Focus visible */
.cell:focus-visible {
  outline: 2px solid #c9a84c;
  outline-offset: -2px;
  z-index: 2;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .piece,
  .piece.dropping,
  .piece.flipping,
  .piece.black.flipping,
  .piece.white.flipping {
    animation: none !important;
  }

  .move-dot {
    animation: none !important;
  }

  .score-side.active .score-label {
    animation: none;
  }

  .score-num.changed {
    animation: none;
  }

  .top-exit-btn:active {
    transform: none;
  }

  .cell:active:not(:disabled) {
    background: transparent;
  }
}
</style>
