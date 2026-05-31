<script setup lang="ts">
import IconHammer from './IconHammer.vue'
import IconUndo from './IconUndo.vue'
import IconWand from './IconWand.vue'
import type { PowerUpType } from '../types'

defineProps<{
  type: PowerUpType
  description: string
  count: number
}>()

const emit = defineEmits<{
  use: []
  close: []
}>()
</script>

<template>
  <div
    class="power-dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="power-dialog-title"
    aria-describedby="power-dialog-desc"
  >
    <div class="power-dialog-card">
      <button class="power-dialog-close" aria-label="关闭道具菜单" @click="emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <h2 id="power-dialog-title" class="power-dialog-title">
        {{ description }}
      </h2>
      <div class="power-dialog-icon" :class="type" aria-hidden="true">
        <IconUndo v-if="type === 'undo'" />
        <IconWand v-else-if="type === 'wand'" />
        <IconHammer v-else />
      </div>
      <p id="power-dialog-desc" class="power-dialog-count">剩余 {{ count }} 次</p>
      <button class="power-dialog-use" @click="emit('use')">立即使用</button>
    </div>
  </div>
</template>

<style scoped>
.power-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 190;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(28, 23, 18, 0.62);
  backdrop-filter: blur(2px);
}

.power-dialog-card {
  position: relative;
  width: min(84vw, 390px);
  padding: 66px 28px 34px;
  border-radius: 14px;
  background: #fff7ed;
  border: 1px solid rgba(122, 78, 42, 0.1);
  text-align: center;
  box-shadow:
    0 6px 0 rgba(62, 45, 33, 0.24),
    0 24px 50px rgba(31, 24, 18, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.power-dialog-close {
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

.power-dialog-close svg {
  width: 34px;
  height: 34px;
}

.power-dialog-title {
  min-height: 72px;
  margin: 0 0 22px;
  color: #9f4f36;
  font-size: 28px;
  font-weight: 500;
  line-height: 1.35;
}

.power-dialog-icon {
  width: 68px;
  height: 68px;
  margin: 0 auto 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(180deg, #ff805f 0%, #f36f50 100%);
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 4px 0 rgba(118, 77, 58, 0.18),
    0 10px 20px rgba(126, 81, 44, 0.12);
}

.power-dialog-icon.wand,
.power-dialog-icon.hammer {
  background: linear-gradient(180deg, #d39418 0%, #bf7907 100%);
}

.power-dialog-icon svg {
  width: 38px;
  height: 38px;
}

.power-dialog-count {
  margin: 0 0 20px;
  color: rgba(120, 84, 41, 0.72);
  font-size: 16px;
}

.power-dialog-use {
  width: min(100%, 220px);
  min-height: 58px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(180deg, #eba45a 0%, #df964c 100%);
  box-shadow:
    0 5px 0 rgba(118, 77, 58, 0.28),
    0 12px 20px rgba(126, 81, 44, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
  cursor: pointer;
  font-size: 26px;
  font-weight: 500;
  transition:
    transform 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
}

.power-dialog-use:active {
  transform: translateY(3px) scale(0.98);
  box-shadow:
    0 2px 0 rgba(118, 77, 58, 0.28),
    0 7px 12px rgba(126, 81, 44, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
</style>
