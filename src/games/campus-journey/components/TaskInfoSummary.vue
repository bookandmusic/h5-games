<script setup lang="ts">
import { computed } from 'vue'

import { uiAssets } from '../assetMap'
import type { RewardSet } from '../types'

const props = defineProps<{
  rewards: Partial<RewardSet>
}>()

const rewardIcons: Record<keyof RewardSet, string> = {
  exp: 'icon-resource-exp',
  money: 'icon-resource-money',
  knowledge: 'icon-resource-knowledge',
  reputation: 'icon-resource-reputation',
}

const rewardItems = computed(() =>
  (Object.entries(props.rewards) as Array<[keyof RewardSet, number | undefined]>)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => ({
      key,
      icon: uiAssets[rewardIcons[key]],
      value: `+${value}`,
    }))
)
</script>

<template>
  <div class="task-info-card">
    <div class="task-reward-list">
      <div v-for="reward in rewardItems" :key="reward.key" class="reward-pill">
        <img :src="reward.icon" alt="" />
        <strong>{{ reward.value }}</strong>
      </div>
      <div v-if="!rewardItems.length" class="reward-pill reward-pill--empty">
        <span class="reward-pill-fallback-dot" aria-hidden="true"></span>
        <strong>--</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-info-card {
  display: block;
}
.task-reward-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.reward-pill {
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
.reward-pill img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}
.reward-pill strong {
  color: #8e5a2e;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.reward-pill--empty {
  border: none;
  background: transparent;
}
.reward-pill--empty strong {
  color: #958890;
}
</style>
