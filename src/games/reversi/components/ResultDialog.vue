<script setup lang="ts">
import type { GameMode, GameStatus } from '../types'
import { countDisks } from '../engine/board'
import type { Board } from '../types'
import DialogShell from './DialogShell.vue'

const props = defineProps<{
  status: GameStatus
  mode: GameMode
  moveCount: number
  board: Board
  coinsEarned?: number
}>()

const emit = defineEmits<{
  restart: []
  close: []
}>()

const winnerText =
  props.status === 'black-wins' ? '黑方' : props.status === 'white-wins' ? '白方' : ''
const isDraw = props.status === 'draw'
const blackCount = countDisks(props.board, 'black')
const whiteCount = countDisks(props.board, 'white')
</script>

<template>
  <DialogShell
    :title="isDraw ? '平局' : '对局结束'"
    width="min(100%, 320px)"
    @close="emit('close')"
  >
    <div class="winner-section" :class="{ draw: isDraw }">
      <svg v-if="!isDraw" class="crown-icon" width="40" height="40" viewBox="0 0 24 24">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#c9a84c"
        />
      </svg>
      <h2 class="winner-title">
        {{ isDraw ? '势均力敌' : `${winnerText}获胜！` }}
      </h2>
    </div>
    <div class="score-display">
      <div class="score-item">
        <div class="score-disk black" />
        <span class="score-value">{{ blackCount }}</span>
      </div>
      <span class="score-vs">:</span>
      <div class="score-item">
        <div class="score-disk white" />
        <span class="score-value">{{ whiteCount }}</span>
      </div>
    </div>
    <div class="result-meta">
      {{ mode === 'ai' ? '人机对战' : '双人对战' }} · {{ moveCount }} 手
    </div>
    <div v-if="coinsEarned && coinsEarned > 0" class="coins-earned">
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"
          fill="#c9a84c"
        />
      </svg>
      <span>+{{ coinsEarned }}</span>
    </div>
    <div class="actions">
      <button class="action-btn primary" @click="emit('restart')">
        <span>再来一局</span>
      </button>
      <button class="action-btn secondary" @click="emit('close')">
        <span>返回首页</span>
      </button>
    </div>
  </DialogShell>
</template>

<style scoped>
.winner-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.crown-icon {
  filter: drop-shadow(0 2px 8px rgba(201, 168, 76, 0.4));
  animation: crown-bounce 0.5s ease-out;
}

@keyframes crown-bounce {
  0% {
    transform: scale(0.5) translateY(-20px);
    opacity: 0;
  }
  60% {
    transform: scale(1.1) translateY(0);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.winner-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #e8eae3;
}

.winner-section.draw .winner-title {
  color: #c9a84c;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-disk {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.score-disk.black {
  background: radial-gradient(circle at 35% 35%, #555, #1a1a1a);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.score-disk.white {
  background: radial-gradient(circle at 35% 35%, #fff, #d4cfc8);
  border: 1px solid #bbb5ad;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.score-value {
  font-size: 22px;
  font-weight: 700;
  color: #c9a84c;
  min-width: 24px;
  text-align: center;
}

.score-vs {
  font-size: 14px;
  font-weight: 700;
  color: #8b9a6e;
}

.result-meta {
  margin: 0;
  font-size: 14px;
  color: #8b9a6e;
}

.coins-earned {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #c9a84c;
  font-size: 14px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-align: center;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.primary {
  background: linear-gradient(135deg, #c9a84c, #b8922e);
  color: #1a3a28;
  box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3);
}

.action-btn.primary:hover {
  box-shadow: 0 6px 16px rgba(201, 168, 76, 0.45);
  background: linear-gradient(135deg, #d4b65a, #c4a03a);
}

.action-btn.secondary {
  background: rgba(0, 0, 0, 0.25);
  color: #8b9a6e;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn.secondary:hover {
  background: rgba(0, 0, 0, 0.35);
  color: #e8eae3;
}

@media (prefers-reduced-motion: reduce) {
  .crown-icon {
    animation: none;
  }

  .action-btn:active {
    transform: none;
  }
}
</style>
