<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    width?: string
    showClose?: boolean
  }>(),
  { showClose: true }
)

defineEmits<{
  close: []
}>()

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const cardStyle = computed(() => (props.width ? { width: props.width } : undefined))
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="mounted" class="overlay" @click.self="$emit('close')">
        <div class="card" :style="cardStyle" role="dialog" :aria-label="title">
          <div v-if="title" class="card-header">
            <span class="header-title">{{ title }}</span>
          </div>
          <button v-if="showClose" class="close-btn" :aria-label="'关闭'" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div class="card-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.card {
  width: min(100%, 320px);
  background: #2d5a3d;
  border: 2px solid #c9a84c;
  border-radius: 16px;
  position: relative;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 8px 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(201, 168, 76, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 44px 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #c9a84c;
  letter-spacing: 0.06em;
  text-align: center;
}

.close-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #8b9a6e;
  cursor: pointer;
  z-index: 10;
  transition: all 0.15s ease-out;
}

.close-btn:hover {
  color: #e8eae3;
  background: rgba(0, 0, 0, 0.2);
}

.close-btn:active {
  transform: scale(0.92);
}

.card-body {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.dialog-enter-active {
  transition: all 250ms ease-out;
}

.dialog-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.dialog-leave-active {
  transition: all 150ms ease-in;
}

.dialog-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active,
  .dialog-leave-active {
    transition: none;
  }

  .dialog-enter-from,
  .dialog-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
