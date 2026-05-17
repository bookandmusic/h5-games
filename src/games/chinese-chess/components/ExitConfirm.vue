<script setup lang="ts">
import DialogShell from './DialogShell.vue'
import DialogBtn from './DialogBtn.vue'

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <DialogShell title="提示" width="min(100%, 340px)" @close="emit('cancel')">
    <p class="message">你确定退出游戏吗？</p>
    <div class="actions">
      <DialogBtn variant="confirm" @click="emit('confirm')">确定</DialogBtn>
      <DialogBtn variant="cancel" @click="emit('cancel')">取消</DialogBtn>
    </div>
  </DialogShell>
</template>

<style scoped>
.message {
  font-size: 17px;
  font-weight: 500;
  color: #4d473f;
  text-align: center;
  margin: 0;
  padding: 12px 0;
}

.actions {
  display: flex;
  gap: 12px;
  width: 100%;
}
</style>
