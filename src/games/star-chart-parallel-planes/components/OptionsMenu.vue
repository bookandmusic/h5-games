<script setup lang="ts">
const emit = defineEmits<{
  close: []
  restart: []
  home: []
}>()

function handleRestart(): void {
  emit('restart')
}
function handleHome(): void {
  emit('home')
}
</script>

<template>
  <div class="options-panel star-modal">
    <button class="opt-btn star-secondary-btn" @click="handleHome">
      <span class="opt-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"
          />
        </svg>
      </span>
      <span class="opt-label">返回星图</span>
    </button>

    <button class="opt-btn star-secondary-btn" @click="handleRestart">
      <span class="opt-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </span>
      <span class="opt-label">重新开始</span>
    </button>

    <button class="opt-btn opt-btn-primary star-primary-btn" @click="emit('close')">
      <span class="opt-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="8 5 19 12 8 19 8 5" />
        </svg>
      </span>
      <span class="opt-label">继续</span>
    </button>
  </div>
</template>

<style scoped>
.options-panel {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 150;
  width: min(100%, 420px);
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(16px, 3cqh, 20px);
  padding: 20px;
  background: linear-gradient(180deg, var(--c-surface-light), #0a102e);
  border: 1.5px solid rgba(100, 180, 255, 0.12);
  border-radius: 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.opt-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: clamp(14px, 3cqw, 18px);
  min-height: clamp(48px, 8cqh, 56px);
  padding: clamp(10px, 1.5cqh, 14px) clamp(20px, 5cqw, 30px);
  border: 1.5px solid rgba(100, 180, 255, 0.1);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(15, 25, 65, 0.6), rgba(8, 12, 35, 0.6));
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 0 6px rgba(100, 180, 255, 0.04),
    inset 0 1px 0 rgba(180, 220, 255, 0.05);
  color: var(--c-text);
}

.opt-btn:active {
  transform: scale(0.97);
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(180, 220, 255, 0.03);
}

.opt-btn-primary {
  background: linear-gradient(180deg, #6a9eff 0%, #4a7dcc 60%, #3a5cb8 100%);
  box-shadow:
    0 4px 0 #2a3d94,
    0 6px 16px rgba(60, 100, 200, 0.35);
  border-color: transparent;
  color: #e8f0ff;
}

.opt-btn-primary:active {
  transform: scale(0.97) translateY(2px);
  box-shadow:
    0 1px 0 #2a3d94,
    0 3px 8px rgba(60, 100, 200, 0.25);
}

.opt-icon {
  width: clamp(36px, 8cqw, 42px);
  height: clamp(36px, 8cqw, 42px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.opt-icon svg {
  width: 100%;
  height: 100%;
}

.opt-label {
  flex: 1;
  font-size: clamp(20px, 5.5cqw, 28px);
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .opt-btn {
    transition: none;
  }
}
</style>
