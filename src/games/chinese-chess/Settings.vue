<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'

import { musicManager } from './musicManager'
import { settingsStore } from './settingsStore'

const router = useRouter()
const GAME_ID = 'chinese-chess'

const bgMusicEnabled = ref(true)
const loaded = ref(false)

const goBack = () => {
  router.push(`/game/${GAME_ID}/home`)
}

const toggleBgMusic = () => {
  bgMusicEnabled.value = !bgMusicEnabled.value
  settingsStore.setBgMusicEnabled(bgMusicEnabled.value)
  if (bgMusicEnabled.value) {
    musicManager.play('01')
  } else {
    musicManager.stop()
  }
}

onMounted(async () => {
  await settingsStore.load()
  bgMusicEnabled.value = settingsStore.bgMusicEnabled
  musicManager.play('01')
  loaded.value = true
})
</script>

<template>
  <div v-if="loaded" class="settings-page">
    <div class="settings-content">
      <section class="settings-section">
        <h2 class="section-title">音效设置</h2>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">背景音乐</span>
            <span class="setting-desc">游戏过程中的背景音乐</span>
          </div>
          <button class="toggle-btn" :class="{ active: bgMusicEnabled }" @click="toggleBgMusic">
            <span class="toggle-label">{{ bgMusicEnabled ? '开启' : '关闭' }}</span>
          </button>
        </div>
      </section>
    </div>

    <footer class="settings-footer">
      <button class="back-btn" @click="goBack">返回首页</button>
    </footer>
  </div>
</template>

<style scoped>
.settings-page {
  --bg-deep: #1a0f0a;
  --bg-surface: #2d1810;
  --bg-card: #3d2518;
  --accent-gold: #c9a227;
  --accent-red: #b91c1c;
  --text-primary: #f5e6d3;
  --text-secondary: #a8927a;

  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 30% 0%, rgba(201, 162, 39, 0.1), transparent 45%),
    radial-gradient(ellipse at 70% 100%, rgba(185, 28, 28, 0.06), transparent 40%),
    linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-surface) 50%, var(--bg-deep) 100%);
  color: var(--text-primary);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.settings-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-section.placeholder {
  padding: 16px;
  border: 1px dashed rgba(201, 162, 39, 0.2);
  border-radius: 12px;
  background: rgba(201, 162, 39, 0.05);
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid rgba(201, 162, 39, 0.15);
  border-radius: 14px;
  background: var(--bg-card);
}

.setting-item.disabled {
  opacity: 0.5;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.toggle-btn {
  padding: 8px 16px;
  border: 1px solid rgba(201, 162, 39, 0.2);
  border-radius: 10px;
  background: rgba(201, 162, 39, 0.08);
  color: var(--accent-gold);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 150ms ease,
    background 150ms ease;
}

.toggle-btn:active {
  transform: scale(0.96);
}

.toggle-btn.active {
  background: linear-gradient(180deg, rgba(201, 162, 39, 0.2), rgba(201, 162, 39, 0.1));
  border-color: var(--accent-gold);
}

.toggle-btn.disabled {
  cursor: not-allowed;
}

.placeholder-text {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.settings-footer {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid rgba(201, 162, 39, 0.15);
}

.back-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, var(--accent-gold), #a68520);
  color: #fff8e8;
  box-shadow: 0 2px 8px rgba(201, 162, 39, 0.25);
  transition: transform 150ms ease;
}

.back-btn:active {
  transform: scale(0.97);
}
</style>
