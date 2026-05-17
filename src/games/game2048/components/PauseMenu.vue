<script setup lang="ts">
import { ref } from 'vue'
import { useGameNavigation } from '../../../composables/useGameNavigation'

const GAME_ID = '2048'
const nav = useGameNavigation(GAME_ID)

defineProps<{
  muted: boolean
}>()

defineEmits<{
  close: []
  restart: []
  toggleMute: []
}>()

const helpOpen = ref(false)
</script>

<template>
  <div class="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-menu-title">
    <div class="pause-card">
      <button class="pause-close" aria-label="关闭暂停菜单" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <h2 id="pause-menu-title" class="sr-only">暂停菜单</h2>
      <button class="resume-btn" aria-label="继续游戏" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <div v-if="!helpOpen" class="pause-actions">
        <button class="pause-action" aria-label="返回首页" @click="nav.goToHome()">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
          </svg>
        </button>
        <button class="pause-action" aria-label="重新开始" @click="$emit('restart')">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12a8 8 0 1 1-2.3-5.7" />
            <path d="M20 4v6h-6" />
          </svg>
        </button>
        <button
          class="pause-action"
          :class="{ muted }"
          :aria-label="muted ? '开启音效' : '关闭音效'"
          @click="$emit('toggleMute')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path v-if="!muted" d="M17 9.5a4 4 0 0 1 0 5" />
            <path v-if="muted" d="m18 9 4 4M22 9l-4 4" />
          </svg>
        </button>
        <button class="pause-action" aria-label="查看帮助" @click="helpOpen = true">
          <span aria-hidden="true">?</span>
        </button>
      </div>
      <div v-else class="pause-help">
        <h3>2048 游戏规则</h3>
        <p>
          上下左右滑动移动全部方块；相同数字相撞会合并成更大的数字；每次有效移动后会生成新方块。合成
          2048 即获胜，棋盘填满且无法合并时本局结束。
        </p>
        <button class="help-back" @click="helpOpen = false">返回</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pause-overlay {
  position: fixed;
  inset: 0;
  z-index: 180;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(28, 23, 18, 0.62);
  backdrop-filter: blur(2px);
}

.pause-card {
  position: relative;
  width: min(84vw, 390px);
  padding: 46px 26px 34px;
  border-radius: 12px;
  background: #fff7ed;
  border: 1px solid rgba(122, 78, 42, 0.1);
  box-shadow:
    0 6px 0 rgba(62, 45, 33, 0.24),
    0 24px 50px rgba(31, 24, 18, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.pause-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 38px;
  min-height: 38px;
  border: 0;
  background: transparent;
  color: #9f4f36;
  cursor: pointer;
}

.pause-close svg {
  width: 34px;
  height: 34px;
}

.resume-btn {
  width: 164px;
  min-height: 112px;
  margin: 0 auto 26px;
  border: 1px solid rgba(174, 103, 55, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  background: linear-gradient(180deg, #eba45a 0%, #df964c 100%);
  box-shadow:
    0 5px 0 rgba(118, 77, 58, 0.25),
    0 14px 24px rgba(126, 81, 44, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.resume-btn svg {
  width: 72px;
  height: 72px;
  transform: translateX(5px);
}

.pause-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.pause-action {
  aspect-ratio: 1;
  border: 1px solid rgba(174, 103, 55, 0.12);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(180deg, #d48463 0%, #cd7657 100%);
  box-shadow:
    0 5px 0 rgba(118, 77, 58, 0.28),
    0 10px 18px rgba(126, 81, 44, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
}

.pause-action svg {
  width: 38px;
  height: 38px;
}

.pause-action span {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
}

.pause-action.muted {
  filter: saturate(0.65);
}

.pause-action:active,
.resume-btn:active {
  transform: translateY(3px) scale(0.98);
  box-shadow:
    0 2px 0 rgba(118, 77, 58, 0.28),
    0 7px 12px rgba(126, 81, 44, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.pause-help {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.pause-help h3 {
  margin: 0;
  color: #9f4f36;
  font-size: 24px;
  font-weight: 700;
}

.pause-help p {
  margin: 0;
  color: #7c5220;
  font-size: 17px;
  line-height: 1.7;
}

.help-back {
  min-width: 110px;
  min-height: 42px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: #cf7d5e;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  white-space: nowrap;
}
</style>
