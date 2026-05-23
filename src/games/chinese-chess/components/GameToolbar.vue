<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  undoCount: number
  hintCount: number
  single: boolean
}>()

const emit = defineEmits<{
  exit: []
  undo: []
  hint: []
  restart: []
}>()

const allButtons: Array<{ label: string; action: () => void; key: string }> = [
  { label: '重开', action: () => emit('restart'), key: 'restart' },
  { label: '悔棋', action: () => emit('undo'), key: 'undo' },
  { label: '提示', action: () => emit('hint'), key: 'hint' },
  { label: '退出', action: () => emit('exit'), key: 'exit' },
]

const visibleButtons = computed(() =>
  allButtons.filter((btn) => btn.key === 'restart' || btn.key === 'exit' || props.single)
)
</script>

<template>
  <div class="toolbar">
    <button
      v-for="btn in visibleButtons"
      :key="btn.key"
      class="toolbar-btn"
      :class="{
        disabled:
          (btn.key === 'undo' && undoCount === 0) || (btn.key === 'hint' && hintCount === 0),
      }"
      :disabled="(btn.key === 'undo' && undoCount === 0) || (btn.key === 'hint' && hintCount === 0)"
      @click="btn.action"
    >
      <span class="toolbar-label">{{ btn.label }}</span>
      <span v-if="single && (btn.key === 'undo' || btn.key === 'hint')" class="toolbar-count">
        {{ btn.key === 'undo' ? undoCount : hintCount }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 2.5cqw, 16px);
  padding: clamp(8px, 2.5cqw, 10px) clamp(6px, 2cqw, 14px) clamp(10px, 3cqh, 16px);
}

.toolbar-btn {
  width: auto;
  height: auto;
  padding: clamp(8px, 2.5cqw, 12px) clamp(16px, 4cqw, 30px);
  border-radius: clamp(10px, 3.2cqw, 16px);
  border: 1px solid rgba(144, 130, 110, 0.25);
  background: linear-gradient(180deg, #9f9580, #857c69);
  box-shadow: 0 4px 10px rgba(104, 91, 72, 0.12);
  color: #fff9ed;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.toolbar-btn:active:not(.disabled) {
  transform: scale(0.95);
  background: linear-gradient(180deg, #8f8570, #756c59);
}

.toolbar-label {
  font-size: clamp(15px, 3.5cqw, 20px);
  letter-spacing: 0.06em;
}

.toolbar-count {
  position: absolute;
  top: clamp(-6px, -1.5cqw, -4px);
  right: clamp(-6px, -1.5cqw, -4px);
  min-width: clamp(18px, 4cqw, 24px);
  height: clamp(18px, 4cqw, 24px);
  padding: 0 clamp(5px, 1.2cqw, 7px);
  border-radius: 999px;
  background: #fff5de;
  color: #8d2b1f;
  font-size: clamp(11px, 2.5cqw, 14px);
  font-weight: 700;
  line-height: clamp(18px, 4cqw, 24px);
  text-align: center;
}

.toolbar-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

@container game (max-width: 420px) {
  .toolbar {
    gap: 10px;
    padding: 8px 8px 12px;
  }

  .toolbar-btn {
    padding: 8px 20px;
    border-radius: 12px;
    font-size: 15px;
  }

  .toolbar-label {
    font-size: 15px;
  }

  .toolbar-count {
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 11px;
    line-height: 18px;
  }
}
</style>
