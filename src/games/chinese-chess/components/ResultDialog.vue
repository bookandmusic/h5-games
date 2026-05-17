<script setup lang="ts">
import DialogShell from './DialogShell.vue'
import DialogBtn from './DialogBtn.vue'
import type { GameMode, PieceColor } from '../types'

defineProps<{
  winner: PieceColor | null
  mode: GameMode
  moveCount: number
}>()

const emit = defineEmits<{
  close: []
  restart: []
}>()
</script>

<template>
  <DialogShell title="对局结果" width="min(100%, 340px)" @close="emit('close')">
    <div class="trophy" :class="winner">{{ winner === 'red' ? '帅' : '将' }}</div>
    <h2 id="result-title" class="result-title">{{ winner === 'red' ? '红方' : '黑方' }}获胜</h2>
    <p class="result-sub">{{ mode === 'ai' ? '人机对战' : '双人对战' }} · 第 {{ moveCount }} 手</p>
    <div class="actions">
      <DialogBtn variant="primary" @click="emit('restart')">再来一局</DialogBtn>
      <DialogBtn variant="secondary" @click="emit('close')">关闭</DialogBtn>
    </div>
  </DialogShell>
</template>

<style scoped>
.trophy {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 46px;
  font-weight: 700;
  box-shadow:
    0 16px 26px rgba(101, 79, 56, 0.18),
    inset 0 2px 4px rgba(255, 255, 255, 0.85);
  margin-top: 4px;
}

.trophy.red {
  background: radial-gradient(circle at 35% 35%, #fffef8, #f5e2c2 56%, #d4a36a 100%);
  color: #be2c21;
  border: 4px solid #d7ae7d;
}

.trophy.black {
  background: radial-gradient(circle at 35% 35%, #fffef8, #f5e2c2 56%, #d4a36a 100%);
  color: #363331;
  border: 4px solid #d7ae7d;
}

.result-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #8c603a;
  font-family: 'Noto Serif SC', 'STSong', serif;
}

.result-sub {
  margin: 0;
  font-size: 14px;
  color: #8b7358;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 10px;
}
</style>
