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
  <div class="options-panel">
    <button class="opt-btn" @click="handleHome">
      <span class="opt-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </span>
      <span class="opt-label">主页菜单</span>
    </button>

    <button class="opt-btn" @click="handleRestart">
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

    <button class="opt-btn opt-btn-primary" @click="emit('close')">
      <span class="opt-icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="7 4 19 12 7 20 7 4" />
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
  width: min(100%, 480px);
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(24px, 4cqh, 26px);
  padding-bottom: 8px;
}

.opt-btn {
  width: 100%;
  max-width: 80cqw;
  min-height: clamp(40px, 6.5cqh, 52px);
  display: flex;
  align-items: center;
  gap: clamp(14px, 3cqw, 18px);
  padding: clamp(8px, 1.2cqh, 12px) clamp(30px, 7cqw, 40px);
  border: clamp(5px, 0.8cqw, 6px) solid #eda84f;
  border-radius: 24px;
  background: linear-gradient(180deg, #fff5db 0%, #ffe2a9 100%);
  box-shadow:
    0 8px 0 #815125,
    0 13px 20px rgba(19, 47, 39, 0.3),
    inset 0 3px 0 rgba(255, 255, 255, 0.84);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.opt-btn:active {
  transform: translateY(5px) scale(0.985);
  box-shadow:
    0 3px 0 #815125,
    0 7px 12px rgba(19, 47, 39, 0.24),
    inset 0 3px 0 rgba(255, 255, 255, 0.72);
}

.opt-icon {
  width: clamp(38px, 8cqw, 44px);
  height: clamp(38px, 8cqw, 44px);
  color: #8a3f15;
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
  font-size: clamp(22px, 6cqw, 32px);
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  color: #fff;
  text-shadow:
    0 -2px 0 #9b682d,
    2px 0 0 #9b682d,
    0 2px 0 #9b682d,
    -2px 0 0 #9b682d,
    2px 2px 0 #9b682d,
    -2px 2px 0 #9b682d,
    2px -2px 0 #9b682d,
    -2px -2px 0 #9b682d,
    0 6px 0 rgba(98, 52, 22, 0.12);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@container game (max-width: 430px) {
  .opt-btn {
    gap: 12px;
    min-height: 54px;
    padding: 8px 22px;
    border-width: 5px;
  }

  .opt-icon {
    width: 38px;
    height: 38px;
  }

  .opt-label {
    font-size: 26px;
    text-shadow:
      0 -1.5px 0 #9b682d,
      1.5px 0 0 #9b682d,
      0 1.5px 0 #9b682d,
      -1.5px 0 0 #9b682d,
      1.5px 1.5px 0 #9b682d,
      -1.5px 1.5px 0 #9b682d,
      1.5px -1.5px 0 #9b682d,
      -1.5px -1.5px 0 #9b682d,
      0 5px 0 rgba(98, 52, 22, 0.12);
  }
}

@container game (min-width: 800px) {
  .options-panel {
    width: min(100%, 480px);
  }
}

@container game (max-height: 600px) {
  .opt-btn {
    min-height: 52px;
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .opt-btn {
    transition: none;
  }
}
</style>
