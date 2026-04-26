<script setup lang="ts">
import { computed, ref } from 'vue'

import { uiAssets } from '../assetMap'
import TaskInfoSummary from './TaskInfoSummary.vue'
import type { TaskDefinition } from '../types'

type TaskListEntry = TaskDefinition & {
  locked?: boolean
  unlockConditions?: string[]
}

const props = defineProps<{
  successRateResolver: (taskId: string) => number
  rewardPreviewResolver: (taskId: string) => Partial<TaskDefinition['successRewards']>
  otherTasks: TaskListEntry[]
}>()

const emit = defineEmits<{
  queue: [taskId: string]
}>()

const lastTapTaskId = ref<string | null>(null)
const lastTapAt = ref(0)
const doubleTapWindowMs = 420

const taskSortRank = (task: TaskListEntry) => {
  if (!task.locked) return 0
  return 1
}

const allTasks = computed(() => {
  const listById = new Map<string, TaskListEntry>()
  props.otherTasks.forEach((task) => listById.set(task.id, task))
  return Array.from(listById.values()).sort((a, b) => taskSortRank(a) - taskSortRank(b))
})

const hasTasks = computed(() => allTasks.value.length > 0)

const formatDurationValue = (minutes: number) => `${minutes}m`

const formatSuccessRateValue = (task: TaskListEntry) =>
  task.locked ? '--' : `${Math.round(props.successRateResolver(task.id) * 100)}%`

const queueTask = (taskId: string) => {
  const task = allTasks.value.find((item) => item.id === taskId)
  if (!task || task.locked) return false
  emit('queue', task.id)
  return true
}

const handleTaskTap = (taskId: string) => {
  const now = Date.now()
  const isSameTask = lastTapTaskId.value === taskId
  const isWithinDoubleTapWindow = now - lastTapAt.value < doubleTapWindowMs
  if (isSameTask && isWithinDoubleTapWindow) {
    queueTask(taskId)
    lastTapTaskId.value = null
    lastTapAt.value = 0
    return
  }

  lastTapTaskId.value = taskId
  lastTapAt.value = now
}
</script>

<template>
  <div v-if="hasTasks" class="task-list">
    <button
      v-for="task in allTasks"
      :key="task.id"
      class="task-item game-card"
      :class="{ locked: task.locked, 'is-locked': task.locked }"
      @click="handleTaskTap(task.id)"
    >
      <div v-if="task.locked" class="item-marker">
        <span class="lock-marker game-chip is-muted" aria-label="锁定">
          <span aria-hidden="true">🔒</span>
          剧情未到
        </span>
      </div>
      <div class="task-top">
        <strong>{{ task.name }}</strong>
      </div>
      <p>{{ task.description }}</p>
      <p v-if="task.locked" class="unlock-conditions">
        激活条件：{{ task.unlockConditions?.join(' · ') || '完成前置条件' }}
      </p>
      <div class="task-meta-divider"></div>
      <div class="task-meta-cluster">
        <span class="task-meta-badge">
          <img :src="uiAssets['icon-task-duration']" alt="任务时间" />
          <strong>{{ formatDurationValue(task.durationMinutes) }}</strong>
        </span>
        <span class="task-meta-badge" :class="{ 'is-muted': task.locked }">
          <img :src="uiAssets['icon-task-success-rate']" alt="成功率" />
          <strong>{{ formatSuccessRateValue(task) }}</strong>
        </span>
      </div>
      <div class="task-reward-divider"></div>
      <TaskInfoSummary :rewards="rewardPreviewResolver(task.id)" />
    </button>
  </div>

  <div v-else class="empty-state game-card">
    <p>暂无可用任务</p>
  </div>
</template>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
.task-item {
  text-align: left;
  display: grid;
  gap: 0;
  padding: 0;
  border-radius: 18px;
  transition:
    border-color 180ms ease,
    filter 180ms ease;
}
.task-item:hover {
  filter: saturate(1.06) brightness(1.02);
}
.item-marker {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}
.item-marker span {
  font-size: 11px;
  gap: 4px;
}
.item-marker .lock-marker span {
  min-height: auto;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  box-shadow: none;
}
.task-top {
  display: flex;
  align-items: center;
  padding: 10px 12px 0;
}
.task-item strong {
  color: #8b4b67;
  font-size: 16px;
}
.task-meta-divider {
  height: 1px;
  margin: 0;
  background: linear-gradient(90deg, transparent, rgba(247, 191, 211, 0.45), transparent);
}
.task-reward-divider {
  height: 1px;
  margin: 0;
  background: linear-gradient(90deg, transparent, rgba(247, 191, 211, 0.35), transparent);
}
.task-meta-cluster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.task-meta-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 2px 10px;
  border-radius: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}
.task-meta-badge img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.task-meta-badge strong {
  color: #8b5a34;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.task-meta-badge.is-muted {
  background: transparent;
  border: none;
  box-shadow: none;
}
.task-meta-badge.is-muted strong {
  color: #958890;
}
.task-item p {
  color: #6f4a59;
  font-size: 12px;
  margin: 4px 12px 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-item .unlock-conditions {
  color: #8a7b84;
  margin: 0 12px;
  -webkit-line-clamp: 3;
}
.task-meta-divider {
  height: 1px;
  margin: 0 12px;
  background: linear-gradient(90deg, transparent, rgba(247, 191, 211, 0.45), transparent);
}
.task-reward-divider {
  height: 1px;
  margin: 0 12px;
  background: linear-gradient(90deg, transparent, rgba(247, 191, 211, 0.35), transparent);
}
.task-meta-cluster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 8px;
}
.task-bottom {
  margin-top: 4px;
  padding: 0 8px;
}
.empty-state {
  text-align: center;
  padding: 24px 10px;
  color: #8b4b67;
  border-radius: 20px;
}
</style>
