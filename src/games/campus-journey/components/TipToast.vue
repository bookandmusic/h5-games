<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    chips?: ReadonlyArray<string>
    icon?: 'success' | 'fail' | 'info' | 'warning'
    duration?: number
    actions?: ReadonlyArray<{ id: string; label: string; primary?: boolean }>
  }>(),
  {
    description: '',
    chips: () => [],
    icon: 'info',
    duration: 2000,
    actions: () => [],
  }
)

const emit = defineEmits<{
  close: []
  action: [id: string]
}>()

let autoCloseTimer: number | null = null

const clearTimer = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

const doClose = () => {
  clearTimer()
  emit('close')
}

const handleAction = (id: string) => {
  clearTimer()
  emit('action', id)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (!props.actions.length) {
        clearTimer()
        autoCloseTimer = window.setTimeout(() => doClose(), props.duration)
      }
    } else {
      clearTimer()
    }
  }
)
</script>

<template>
  <Transition name="tip-slide" @after-leave="doClose">
    <div v-if="open" class="tip-toast">
      <div class="tip-inner" :class="'tip-' + icon">
        <div class="tip-deco"></div>
        <div class="tip-content">
          <p class="tip-title">{{ title }}</p>
          <p v-if="description" class="tip-desc">{{ description }}</p>
          <div v-if="chips.length" class="tip-chips">
            <span v-for="chip in chips" :key="chip" class="tip-chip">{{ chip }}</span>
          </div>
        </div>
        <div class="tip-deco"></div>
      </div>
      <div v-if="actions.length" class="tip-actions">
        <button
          v-for="action in actions"
          :key="action.id"
          :class="{ ghost: !action.primary }"
          @click="handleAction(action.id)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tip-toast {
  position: fixed;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: min(calc(100% - 48px), 320px);
  z-index: 31;
  display: grid;
  gap: 8px;
}
.tip-inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 252, 248, 0.96), rgba(255, 243, 235, 0.94));
  border: 2px solid rgba(247, 191, 211, 0.7);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 12px 28px rgba(180, 110, 130, 0.16);
  color: #6f4a59;
}
.tip-success .tip-inner {
  background: linear-gradient(180deg, rgba(255, 246, 252, 0.98), rgba(248, 210, 230, 0.96));
  border-color: rgba(233, 108, 152, 0.5);
}
.tip-fail .tip-inner {
  background: linear-gradient(180deg, rgba(255, 244, 248, 0.98), rgba(252, 208, 222, 0.96));
  border-color: rgba(201, 85, 128, 0.5);
}
.tip-info .tip-inner {
  background: linear-gradient(180deg, rgba(255, 248, 252, 0.98), rgba(242, 218, 232, 0.96));
  border-color: rgba(220, 140, 180, 0.45);
}
.tip-warning .tip-inner {
  background: linear-gradient(180deg, rgba(255, 248, 242, 0.98), rgba(252, 222, 200, 0.96));
  border-color: rgba(230, 160, 120, 0.5);
}
.tip-deco {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(247, 191, 211, 0.5);
}
.tip-success .tip-deco {
  background: rgba(233, 108, 152, 0.5);
}
.tip-fail .tip-deco {
  background: rgba(201, 85, 128, 0.5);
}
.tip-info .tip-deco {
  background: rgba(220, 140, 180, 0.45);
}
.tip-warning .tip-deco {
  background: rgba(230, 160, 120, 0.5);
}
.tip-content {
  text-align: center;
  min-width: 0;
}
.tip-title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.3;
  color: #8b4b67;
}
.tip-success .tip-title {
  color: #8b4b67;
}
.tip-fail .tip-title {
  color: #c95580;
}
.tip-info .tip-title {
  color: #8b5a78;
}
.tip-warning .tip-title {
  color: #9a6a40;
}
.tip-desc {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #8d6171;
}
.tip-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 6px;
}
.tip-chip {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 10px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 230, 200, 0.6), rgba(255, 230, 200, 0.3));
  border: 1px solid rgba(230, 190, 150, 0.35);
  color: #8a6b4a;
  font-size: 11px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.tip-success .tip-chip {
  background: rgba(233, 108, 152, 0.1);
  border-color: rgba(233, 108, 152, 0.25);
  color: #8b4b67;
}
.tip-fail .tip-chip {
  background: rgba(233, 108, 152, 0.1);
  border-color: rgba(233, 108, 152, 0.2);
  color: #c95580;
}
.tip-actions {
  display: flex;
  gap: 8px;
}
.tip-actions button {
  flex: 1;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(180deg, #f8b7ce, #e96c98);
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 6px 14px rgba(201, 85, 128, 0.16);
}
.tip-actions button.ghost {
  background: linear-gradient(180deg, rgba(255, 252, 248, 0.96), rgba(255, 243, 235, 0.94));
  color: #8b4b67;
  border: 1.5px solid rgba(247, 191, 211, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.tip-slide-enter-active {
  transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tip-slide-leave-active {
  transition: transform 350ms cubic-bezier(0.55, 0, 1, 0.45);
}
.tip-slide-enter-from {
  transform: translateY(-50%) translateX(120%);
}
.tip-slide-leave-to {
  transform: translateY(-50%) translateX(120%);
}
@media (max-width: 720px) {
  .tip-toast {
    width: min(calc(100% - 32px), 300px);
    right: 8px;
  }
  .tip-inner {
    padding: 12px 14px;
    border-radius: 16px;
  }
  .tip-title {
    font-size: 14px;
  }
}
</style>
