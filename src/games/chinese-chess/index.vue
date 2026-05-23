<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { getPieceLabel } from './engine'
import type { Piece } from './types'
import { useGameNavigation } from '../../composables/useGameNavigation'
import GameContainer from '../../components/GameContainer.vue'
import { useChessGame } from './composables/useChessGame'
import GameToolbar from './components/GameToolbar.vue'
import HomeDialog from './components/HomeDialog.vue'
import ResultDialog from './components/ResultDialog.vue'
import ExitConfirm from './components/ExitConfirm.vue'

const GAME_ID = 'chinese-chess'
const nav = useGameNavigation(GAME_ID)
const route = useRoute()
const boardFrameRef = ref<HTMLElement | null>(null)

const {
  board,
  activeMode,
  loaded,
  pendingSetupMode,
  profile,
  showResultDialog,
  showExitConfirm,
  showStartSetup,
  animatingMove,
  orientation,
  displayedRows,
  displayedCols,
  isBoardLocked,
  moveCount,
  winner,
  statusText,
  getActualPosition,
  isSelected,
  isLegalTarget,
  isHintFrom,
  isHintTo,
  getPieceImage,
  handleSelect,
  handleRestart,
  handleExit,
  handleCancelExit,
  handleUndo,
  handleHint,
  handleStartConfig,
  confirmExit,
} = useChessGame(GAME_ID, route, boardFrameRef, import.meta.url)

function handleConfirmExit() {
  confirmExit()
  nav.goToHome()
}

function getPieceAlt(piece: Piece | null) {
  return piece ? getPieceLabel(piece) : ''
}
</script>

<template>
  <GameContainer v-if="loaded">
    <div class="play-inner">
      <header class="status-bar">
        <div class="mode-plaque">
          <span v-if="activeMode === 'ai'" class="status-mode">人机对战</span>
          <span v-else class="status-mode">双人对战</span>
        </div>
      </header>

      <div class="status-pill">{{ statusText }}</div>

      <section class="board-section">
        <div v-if="animatingMove && animatingMove.phase === 'preview'" class="preview-overlay">
          <div class="preview-piece">
            <img
              class="piece-img"
              :src="getPieceImage(animatingMove.piece)"
              :alt="getPieceAlt(animatingMove.piece)"
            />
          </div>
        </div>
        <div class="board-frame" ref="boardFrameRef" :class="{ locked: isBoardLocked }">
          <div class="board-lines">
            <svg
              class="lines-svg"
              viewBox="0 0 8 9"
              preserveAspectRatio="none"
              :style="{ transform: orientation === 'black' ? 'scaleY(-1)' : '' }"
            >
              <defs>
                <pattern id="g" width="1" height="1" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="1" y2="0" stroke="#5c3d2e" stroke-width="0.03" />
                  <line x1="0" y1="0" x2="0" y2="1" stroke="#5c3d2e" stroke-width="0.03" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="8" height="4" fill="url(#g)" />
              <rect x="0" y="5" width="8" height="4" fill="url(#g)" />
              <line x1="0" y1="0" x2="8" y2="0" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="0" y1="9" x2="8" y2="9" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="0" y1="0" x2="0" y2="9" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="8" y1="0" x2="8" y2="9" stroke="#5c3d2e" stroke-width="0.05" />
              <line x1="0" y1="4" x2="8" y2="4" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="0" y1="5" x2="8" y2="5" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="3" y1="0" x2="5" y2="2" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="5" y1="0" x2="3" y2="2" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="3" y1="7" x2="5" y2="9" stroke="#5c3d2e" stroke-width="0.03" />
              <line x1="5" y1="7" x2="3" y2="9" stroke="#5c3d2e" stroke-width="0.03" />
            </svg>
            <div class="river-text">楚 河 汉 界</div>
          </div>
          <div class="board-points">
            <template v-for="(ar, dr) in displayedRows" :key="'r' + ar">
              <template v-for="(ac, dc) in displayedCols" :key="ar + '-' + ac">
                <button
                  class="point"
                  :class="{
                    selected: isSelected(getActualPosition(dr, dc)),
                    target: isLegalTarget(getActualPosition(dr, dc)),
                    'hint-from': isHintFrom(getActualPosition(dr, dc)),
                    'hint-to': isHintTo(getActualPosition(dr, dc)),
                  }"
                  :disabled="isBoardLocked"
                  :style="{
                    left: `calc(${(dc / 8) * 100}% - var(--ps) / 2)`,
                    top: `calc(${(dr / 9) * 100}% - var(--ps) / 2)`,
                  }"
                  @click="handleSelect(getActualPosition(dr, dc))"
                >
                  <div v-if="board[ar][ac]" class="piece" :class="board[ar][ac]?.color">
                    {{ getPieceLabel(board[ar][ac]) }}
                  </div>
                </button>
              </template>
            </template>
          </div>
        </div>
      </section>

      <GameToolbar
        :single="activeMode === 'ai'"
        :undo-count="profile.inventory.undo"
        :hint-count="profile.inventory.hint"
        @exit="handleExit"
        @undo="handleUndo"
        @hint="handleHint"
        @restart="handleRestart"
      />
    </div>

    <ResultDialog
      v-if="showResultDialog"
      :winner="winner"
      :mode="activeMode"
      :move-count="moveCount"
      @close="showResultDialog = false"
      @restart="handleRestart"
    />

    <ExitConfirm v-if="showExitConfirm" @confirm="handleConfirmExit" @cancel="handleCancelExit" />

    <HomeDialog
      v-if="showStartSetup && pendingSetupMode"
      :mode="pendingSetupMode"
      @start="handleStartConfig"
    />
  </GameContainer>
</template>

<style scoped>
.play-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

:deep(.game-bg) {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.28), transparent 35%),
    linear-gradient(
      180deg,
      rgba(239, 230, 212, 0.42) 0%,
      rgba(236, 224, 198, 0.26) 54%,
      rgba(217, 204, 177, 0.18) 100%
    ),
    url('./assets/images/bg-mountains.png') center center / cover no-repeat;
}

.status-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(10px, 2.5cqw, 12px) 4px;
  position: relative;
  z-index: 1;
}

.mode-plaque {
  min-width: clamp(140px, 38cqw, 168px);
  text-align: center;
  padding: clamp(10px, 3cqh, 14px) clamp(18px, 5cqw, 28px);
  border-radius: clamp(8px, 2.5cqw, 10px);
  background: linear-gradient(180deg, #d8bea8, #c8ab92);
  box-shadow:
    inset 0 0 0 2px rgba(249, 239, 222, 0.7),
    0 10px 20px rgba(100, 79, 58, 0.12);
}

.status-mode {
  font-size: clamp(15px, 4.5cqw, 18px);
  font-weight: 700;
  color: #fff7eb;
  letter-spacing: 0.16em;
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.status-pill {
  align-self: center;
  margin: clamp(6px, 2cqh, 8px) auto clamp(4px, 1.5cqh, 6px);
  padding: clamp(4px, 1.5cqw, 6px) clamp(10px, 3cqw, 14px);
  border-radius: 999px;
  background: rgba(140, 126, 105, 0.18);
  color: #7d6247;
  font-size: clamp(11px, 3cqw, 13px);
  font-weight: 600;
  letter-spacing: 0.04em;
  position: relative;
  z-index: 1;
}

.board-section {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(4px, 1.5cqh, 8px) clamp(4px, 1.5cqw, 8px) clamp(8px, 3cqh, 14px);
  position: relative;
  z-index: 1;
}

.board-frame {
  --ps: min(10cqw, 10cqh, 50px);
  --board-padding-v: clamp(8px, 3cqh, 16px);
  --board-padding-h: clamp(10px, 3.5cqw, 18px);
  width: 100%;
  max-height: 100%;
  aspect-ratio: 8 / 9;
  position: relative;
  padding: var(--board-padding-v) var(--board-padding-h);
  border-radius: clamp(8px, 2.5cqw, 12px) clamp(8px, 2.5cqw, 12px) clamp(18px, 5cqw, 26px)
    clamp(18px, 5cqw, 26px);
  border: clamp(3px, 0.8cqw, 4px) solid #c48749;
  box-shadow:
    0 16px 28px rgba(122, 90, 55, 0.18),
    inset 0 0 0 2px rgba(241, 196, 144, 0.6),
    inset 0 clamp(-8px, -2.5cqh, -12px) clamp(12px, 3cqw, 18px) rgba(168, 106, 48, 0.12);
  background:
    linear-gradient(180deg, rgba(249, 223, 178, 0.98), rgba(240, 199, 145, 0.96)),
    repeating-linear-gradient(
      90deg,
      rgba(183, 121, 59, 0.08) 0 4px,
      rgba(255, 255, 255, 0.02) 4px 16px
    );
}

.board-frame.locked {
  box-shadow: 0 16px 28px rgba(122, 90, 55, 0.22);
}

/* --ps 分断点优化 */
@container game (max-width: 375px) {
  .board-frame {
    --ps: min(11cqw, 11cqh, 42px);
  }
}

@container game (min-width: 376px) and (max-width: 500px) {
  .board-frame {
    --ps: min(9cqw, 9cqh, 48px);
  }
}

@container game (min-width: 501px) and (max-width: 600px) {
  .board-frame {
    --ps: min(8cqw, 8cqh, 52px);
  }
}

@container game (min-width: 601px) {
  .board-frame {
    --ps: min(7cqw, 14cqh, 55px);
  }
}

@container game (max-height: 500px) {
  .board-frame {
    --ps: min(6cqw, 12cqh, 55px);
  }
}

.board-lines {
  position: absolute;
  inset: var(--board-padding-v) var(--board-padding-h);
  pointer-events: none;
}

.lines-svg {
  width: 100%;
  height: 100%;
}

.river-text {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  text-align: center;
  color: #c87331;
  font-size: clamp(18px, 5cqw, 28px);
  font-weight: 700;
  letter-spacing: 0.4em;
  text-shadow: 0 1px 0 rgba(255, 250, 236, 0.75);
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.board-points {
  position: absolute;
  inset: var(--board-padding-v) var(--board-padding-h);
}

.point {
  position: absolute;
  width: var(--ps);
  height: var(--ps);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.point:disabled {
  cursor: not-allowed;
}

.point.selected {
  background: rgba(237, 178, 90, 0.18);
}

.point.hint-from::before,
.point.hint-to::before {
  content: '';
  position: absolute;
  inset: clamp(-3px, -0.8cqw, -4px);
  border-radius: 50%;
  border: 2px dashed rgba(83, 141, 115, 0.9);
}

.point.target::after {
  content: '';
  position: absolute;
  width: clamp(10px, 2.8cqw, 14px);
  height: clamp(10px, 2.8cqw, 14px);
  border-radius: 50%;
  background: rgba(190, 44, 33, 0.36);
  box-shadow: 0 0 8px rgba(190, 44, 33, 0.28);
}

.point.hint-to::after {
  background: rgba(83, 141, 115, 0.38);
  box-shadow: 0 0 8px rgba(83, 141, 115, 0.28);
}

.piece {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--ps) * 0.55);
  font-weight: 700;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.25),
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  user-select: none;
}

.point.selected .piece {
  transform: scale(1.06);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(237, 178, 90, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.piece.red {
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(255, 243, 235, 0.98),
      rgba(252, 220, 191, 0.98) 60%,
      rgba(218, 172, 121, 0.95)
    ),
    linear-gradient(180deg, #f5ddd0, #d9ae7c);
  border: clamp(1.5px, 0.5cqw, 2px) solid #cb945f;
  color: #be2c21;
}

.piece.black {
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(248, 248, 246, 0.98),
      rgba(230, 225, 215, 0.98) 60%,
      rgba(200, 190, 175, 0.95)
    ),
    linear-gradient(180deg, #eae5dc, #ccc5b9);
  border: clamp(1.5px, 0.5cqw, 2px) solid #8a7a6a;
  color: #2a2a28;
}

.piece-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(139, 109, 76, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: preview-in 300ms ease-out;
}

.preview-piece {
  width: min(40cqw, 40cqh);
  height: min(40cqw, 40cqh);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: preview-zoom 300ms ease-out;
}

@keyframes preview-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes preview-zoom {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
