<script setup lang="ts">
import DialogShell from './DialogShell.vue'

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <DialogShell title="确认退出" width="min(100%, 300px)" @close="emit('cancel')">
    <p class="message">对局将自动保存，确定退出？</p>
    <div class="actions">
      <button class="action-btn secondary" @click="emit('cancel')">继续游戏</button>
      <button class="action-btn primary" @click="emit('confirm')">确认退出</button>
    </div>
  </DialogShell>
</template>

<style scoped>
.message {
  font-size: 14px;
  color: #8b9a6e;
  text-align: center;
  margin: 0;
  padding: 8px 0;
  line-height: 1.5;
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
  .action-btn:active {
    transform: none;
  }
}
</style>
