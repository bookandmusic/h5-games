<script setup lang="ts">
import { computed } from 'vue'
import { settingsStore } from '../audio/settingsStore'
import Icon from './Icon.vue'

import type { IconName } from './Icon.vue'

const props = defineProps<{
  isSinglePlayer: boolean
}>()

const emit = defineEmits<{
  restart: []
  undo: []
  hint: []
  toggleSound: []
}>()

const allButtons = computed(() => {
  const buttons: Array<{ key: string; label: string; icon: IconName }> = []
  if (props.isSinglePlayer) {
    buttons.push({ key: 'undo', label: '悔棋', icon: 'undo' })
    buttons.push({ key: 'hint', label: '提示', icon: 'hint' })
  }
  buttons.push({ key: 'restart', label: '重开', icon: 'restart' })
  buttons.push({
    key: 'sound',
    label: '音效',
    icon: settingsStore.sfxEnabled ? 'sound' : 'sound-off',
  })
  return buttons
})

const handleAction = (key: string) => {
  switch (key) {
    case 'restart':
      emit('restart')
      break
    case 'undo':
      emit('undo')
      break
    case 'hint':
      emit('hint')
      break
    case 'sound':
      emit('toggleSound')
      break
  }
}
</script>

<template>
  <div class="toolbar">
    <button
      v-for="btn in allButtons"
      :key="btn.key"
      class="toolbar-btn"
      :class="{ single: allButtons.length <= 3 }"
      @click="handleAction(btn.key)"
      :aria-label="btn.label"
    >
      <Icon :name="btn.icon" :size="24" />
      <span class="toolbar-label">{{ btn.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 1.5cqw, 8px);
  padding: clamp(6px, 1.5cqh, 10px) 0 clamp(8px, 2cqh, 14px);
  width: 100%;
}

.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: clamp(8px, 2cqh, 12px) clamp(10px, 3cqw, 18px);
  min-width: 56px;
  min-height: 56px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #8b9a6e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.1s ease-out;
  flex: 1;
  max-width: 80px;
}

.toolbar-btn.single {
  flex: 0 1 auto;
  max-width: none;
}

.toolbar-btn:hover {
  color: #c9a84c;
  background: rgba(201, 168, 76, 0.08);
}

.toolbar-btn:active {
  transform: scale(0.92);
  color: #c9a84c;
}

.toolbar-btn:focus-visible {
  outline: 2px solid #c9a84c;
  outline-offset: 2px;
}

.toolbar-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.toolbar-btn svg {
  transition: transform 0.1s ease-out;
}

.toolbar-btn:active svg {
  transform: scale(0.9);
}

@container game (max-width: 420px) {
  .toolbar-btn {
    min-width: 48px;
    min-height: 48px;
    padding: 6px 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toolbar-btn:active {
    transform: none;
  }

  .toolbar-btn:active svg {
    transform: none;
  }
}
</style>
