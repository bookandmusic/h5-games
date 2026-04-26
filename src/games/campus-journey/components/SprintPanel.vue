<script setup lang="ts">
import { uiAssets } from '../assetMap'
import { formatDuration } from '../utils/format'

defineProps<{
  hasTask: boolean
  currentTaskName: string
  remainingSec: number
}>()
</script>

<template>
  <section class="sprint-panel">
    <template v-if="hasTask">
      <div class="task-info">
        <div class="task-head">
          <img :src="uiAssets['icon-sprint']" alt="" class="task-icon" />
          <div class="task-text">
            <strong>{{ currentTaskName }}</strong>
            <small>剩余 {{ formatDuration(remainingSec) }}</small>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="idle-hint" role="note" aria-label="任务提示">
        <img :src="uiAssets['icon-sprint']" alt="" />
        <div>
          <strong>还没有进行中的行动</strong>
          <small>点击左侧行动图标，进入行动卡片后开始。</small>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.sprint-panel {
  padding: 12px 16px;
  border-radius: 22px;
  background: var(
    --cj-card-bg,
    linear-gradient(180deg, rgba(255, 233, 181, 0.48), rgba(142, 83, 35, 0.28)),
    rgba(69, 38, 18, 0.2)
  );
  border: var(--cj-card-border, 2px solid rgba(91, 52, 25, 0.28));
  box-shadow: var(
    --cj-card-shadow,
    inset 0 2px 0 rgba(255, 255, 255, 0.34),
    0 14px 28px rgba(35, 20, 11, 0.18)
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.task-info {
  display: flex;
  align-items: center;
}
.task-head {
  display: flex;
  align-items: center;
  gap: 0;
}
.task-icon {
  width: 48px;
  height: 48px;
}
.task-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.task-text strong {
  font-size: 15px;
  color: #8b4b67;
}
.task-text small {
  font-size: 12px;
  color: #8d6171;
}
.idle-hint {
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 52px;
  color: #6f4a59;
}
.idle-hint img {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.idle-hint div {
  display: grid;
  gap: 2px;
}
.idle-hint strong {
  font-size: 14px;
  color: #8b4b67;
}
.idle-hint small {
  font-size: 12px;
  color: #8d6171;
}
</style>
