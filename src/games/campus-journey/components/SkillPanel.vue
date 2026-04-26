<script setup lang="ts">
import type { SkillDefinition, SkillId } from '../types'

const props = defineProps<{
  skillLevels: Record<SkillId, number>
  skills: SkillDefinition[]
  icons: Record<string, string>
}>()

const emit = defineEmits<{
  upgrade: [skillId: SkillId]
}>()

const getNextLevelCost = (skill: SkillDefinition, currentLevel: number) => {
  if (currentLevel >= skill.maxLevel) return null
  return skill.costCurve[currentLevel] ?? Infinity
}

const handleClick = (skill: SkillDefinition) => {
  if (props.skillLevels[skill.id] < skill.maxLevel) {
    emit('upgrade', skill.id)
  }
}
</script>

<template>
  <div class="skill-list">
    <article
      v-for="skill in skills"
      :key="skill.id"
      class="skill-item game-card"
      :class="{ 'is-maxed': skillLevels[skill.id] >= skill.maxLevel }"
      @click="handleClick(skill)"
    >
      <div class="skill-main">
        <span class="skill-icon-shell">
          <img :src="icons[skill.iconId]" alt="" />
        </span>
        <div class="skill-copy">
          <div class="skill-header">
            <strong>{{ skill.name }}</strong>
          </div>
          <span>{{ skill.description }}</span>
        </div>
      </div>
      <span class="level-badge">
        Lv.{{ skillLevels[skill.id] }} / {{ getNextLevelCost(skill, skillLevels[skill.id]) ?? '—' }}
      </span>
    </article>
  </div>
</template>

<style scoped>
.skill-list {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 10px;
  align-content: start;
}
.skill-item {
  padding: 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 180ms ease, filter 180ms ease;
  position: relative;
}
.skill-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.skill-icon-shell {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: none;
  border: none;
  box-shadow: none;
}
.skill-icon-shell img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(179, 123, 95, 0.16));
}
.skill-copy {
  display: grid;
  gap: 4px;
}
.skill-header {
  display: flex;
  align-items: center;
}
.skill-copy strong {
  display: block;
  color: #8b4b67;
  font-size: 16px;
}
.skill-copy span {
  display: block;
  color: #6f4a59;
  font-size: 12px;
  line-height: 1.45;
}
.level-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 11px;
  font-weight: 600;
  background: linear-gradient(135deg, #fff7df, #ffd986 48%, #ffbf61);
  color: #82501f;
  border: 1px solid rgba(218, 163, 61, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 4px 10px rgba(224, 170, 72, 0.2);
  white-space: nowrap;
  text-align: center;
}
.skill-item:not(.is-maxed):hover {
  transform: translateY(-2px);
  filter: brightness(1.02);
}
.skill-item.is-maxed {
  cursor: default;
  opacity: 0.75;
}
</style>
