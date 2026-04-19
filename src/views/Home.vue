<script setup lang="ts">
import { computed, ref } from 'vue'

import GameCard from '../components/GameCard.vue'
import { useGamesStore } from '../stores/games'

const store = useGamesStore()

const segments = computed(() => ['全部', ...store.categories])
const selectedSegment = ref(0)
const showCategorySheet = ref(false)

const selectSegment = (index: number) => {
  selectedSegment.value = index
  if (index === 0) {
    store.setCategory(null)
  } else {
    store.setCategory(store.categories[index - 1])
  }
}

const showMoreCategories = () => {
  showCategorySheet.value = true
}

const selectCategoryFromSheet = (index: number) => {
  selectedSegment.value = index
  if (index === 0) {
    store.setCategory(null)
  } else {
    store.setCategory(store.categories[index - 1])
  }
  showCategorySheet.value = false
}

const closeSheet = () => {
  showCategorySheet.value = false
}

const currentCategoryTitle = computed(() => {
  if (store.selectedCategory) {
    return store.selectedCategory
  }
  return '推荐游戏'
})
</script>

<template>
  <div class="cyber-app">
    <div class="cyber-bg-grid"></div>
    <div class="cyber-blob-1"></div>
    <div class="cyber-blob-2"></div>
    <div class="cyber-blob-3"></div>

    <header class="cyber-header">
      <div class="cyber-header-content">
        <div class="cyber-header-inner">
          <div class="cyber-header-left">
            <div class="cyber-app-icon">
              <svg class="cyber-icon-svg" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 10H4V8h16v8z"
                />
                <rect x="5" y="9" width="3" height="6" rx="1" />
                <rect x="9" y="9" width="3" height="6" rx="1" />
                <rect x="13" y="9" width="3" height="6" rx="1" />
              </svg>
            </div>
            <div class="cyber-title-wrapper">
              <span class="cyber-header-title">GAME HUB</span>
              <span class="cyber-header-subtitle">游戏中心</span>
            </div>
          </div>
          <div class="cyber-status">
            <span class="cyber-status-dot"></span>
            <span class="cyber-status-text">ONLINE</span>
          </div>
        </div>
      </div>
      <div class="cyber-header-border"></div>
    </header>

    <div class="cyber-search-section">
      <div class="cyber-search-bar">
        <svg
          class="cyber-search-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
        <input
          type="search"
          class="cyber-search-input"
          placeholder="搜索游戏..."
          :value="store.searchQuery"
          @input="store.setSearchQuery(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="store.searchQuery"
          class="cyber-search-clear"
          @click="store.setSearchQuery('')"
        >
          <svg class="cyber-clear-icon" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="cyber-category-section">
      <div class="cyber-segment-control">
        <button
          v-for="(segment, index) in segments.slice(0, 3)"
          :key="index"
          class="cyber-segment"
          :class="{ 'cyber-segment-active': selectedSegment === index }"
          @click="selectSegment(index)"
        >
          <span class="cyber-segment-text">{{ segment }}</span>
        </button>
        <button v-if="segments.length > 3" class="cyber-segment-more" @click="showMoreCategories">
          <span class="cyber-segment-more-text">更多</span>
          <svg
            class="cyber-more-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <div class="cyber-info-section">
      <h2 class="cyber-section-title">{{ currentCategoryTitle }}</h2>
      <div class="cyber-count-badge">
        <span class="cyber-count-number">{{ store.filteredGames.length }}</span>
        <span class="cyber-count-label">GAMES</span>
      </div>
    </div>

    <main class="cyber-list-container">
      <div class="cyber-game-list">
        <GameCard
          v-for="(game, index) in store.filteredGames"
          :key="game.id"
          :game="game"
          :index="index"
        />
      </div>

      <div v-if="store.filteredGames.length === 0" class="cyber-empty-state">
        <div class="cyber-empty-icon">
          <svg
            class="cyber-empty-svg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.182 16.318A4.5 4.5 0 0012.016 15a4.5 4.5 0 00-3.166 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p class="cyber-empty-title">NO RESULTS</p>
        <p class="cyber-empty-subtitle">请尝试其他搜索词或分类</p>
      </div>

      <div class="cyber-safe-area-bottom"></div>
    </main>

    <div v-if="showCategorySheet" class="cyber-sheet-overlay" @click="closeSheet">
      <div class="cyber-sheet-container">
        <div class="cyber-sheet-card">
          <div class="cyber-sheet-header">
            <span class="cyber-sheet-title">SELECT CATEGORY</span>
          </div>
          <div class="cyber-sheet-options">
            <button
              v-for="(segment, index) in segments"
              :key="index"
              class="cyber-sheet-option"
              :class="{ 'cyber-sheet-option-selected': selectedSegment === index }"
              @click.stop="selectCategoryFromSheet(index)"
            >
              <span class="cyber-sheet-option-text">{{ segment }}</span>
              <div v-if="selectedSegment === index" class="cyber-sheet-check">
                <svg class="cyber-check-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 18.83l9-9L16.59 8.5z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
        <button class="cyber-sheet-cancel" @click.stop="closeSheet">CANCEL</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cyber-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #0a0a0f 0%, #020203 100%);
  position: relative;
}

.cyber-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

.cyber-blob-1 {
  position: absolute;
  top: 5%;
  left: -10%;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 60%);
  filter: blur(60px);
  animation: blobFloat1 12s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.cyber-blob-2 {
  position: absolute;
  top: 40%;
  right: -15%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 0, 255, 0.12) 0%, transparent 60%);
  filter: blur(80px);
  animation: blobFloat2 15s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.cyber-blob-3 {
  position: absolute;
  bottom: -20%;
  left: 30%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%);
  filter: blur(70px);
  animation: blobFloat3 10s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes blobFloat1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -20px) scale(1.1);
  }
}

@keyframes blobFloat2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-40px, 30px) scale(1.05);
  }
}

@keyframes blobFloat3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20px, 40px) scale(1.15);
  }
}

.cyber-header {
  flex-shrink: 0;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding-top: env(safe-area-inset-top);
  position: relative;
  z-index: 10;
}

.cyber-header-content {
  padding: 16px 20px;
}

.cyber-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cyber-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cyber-app-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00ffff, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.3),
    0 0 40px rgba(99, 102, 241, 0.2);
}

.cyber-app-icon::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00ffff, #ff00ff, #6366f1);
  opacity: 0.5;
  filter: blur(8px);
  z-index: -1;
}

.cyber-icon-svg {
  width: 26px;
  height: 26px;
  color: #0a0a0f;
}

.cyber-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cyber-header-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--ios-text-primary);
  letter-spacing: 2px;
}

.cyber-header-subtitle {
  font-size: 12px;
  color: var(--ios-text-tertiary);
  letter-spacing: 0.5px;
}

.cyber-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.cyber-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.cyber-status-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #00ff88;
  letter-spacing: 1px;
}

.cyber-header-border {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.3),
    rgba(255, 0, 255, 0.3),
    transparent
  );
}

.cyber-search-section {
  flex-shrink: 0;
  padding: 12px 16px;
  position: relative;
  z-index: 5;
}

.cyber-search-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 14px;
  padding: 12px 16px;
  gap: 12px;
  border: 1px solid rgba(0, 255, 255, 0.15);
  transition: all var(--ios-duration-fast) var(--ios-ease);
}

.cyber-search-bar:focus-within {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 255, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.15);
}

.cyber-search-icon {
  width: 20px;
  height: 20px;
  color: rgba(0, 255, 255, 0.7);
  flex-shrink: 0;
}

.cyber-search-input {
  flex: 1;
  background: none;
  border: none;
  font-size: 16px;
  color: var(--ios-text-primary);
  outline: none;
}

.cyber-search-input::placeholder {
  color: var(--ios-text-tertiary);
}

.cyber-search-clear {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 0, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid rgba(255, 0, 255, 0.3);
  transition: all var(--ios-duration-fast) var(--ios-ease);
}

.cyber-search-clear:hover {
  background: rgba(255, 0, 255, 0.3);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
}

.cyber-clear-icon {
  width: 12px;
  height: 12px;
  color: #ff00ff;
}

.cyber-category-section {
  flex-shrink: 0;
  padding: 8px 16px;
  position: relative;
  z-index: 5;
}

.cyber-segment-control {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 4px;
}

.cyber-segment {
  flex: 1;
  min-width: 60px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all var(--ios-duration-fast) var(--ios-ease);
}

.cyber-segment:active {
  transform: scale(0.97);
}

.cyber-segment-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--ios-text-secondary);
  letter-spacing: 1px;
  transition: all var(--ios-duration-fast) var(--ios-ease);
}

.cyber-segment-active {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(99, 102, 241, 0.2));
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.cyber-segment-active .cyber-segment-text {
  color: #00ffff;
}

.cyber-segment-active::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(99, 102, 241, 0.2));
  filter: blur(8px);
  z-index: -1;
}

.cyber-segment-more {
  flex: 0;
  min-width: 70px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid rgba(255, 0, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all var(--ios-duration-fast) var(--ios-ease);
}

.cyber-segment-more:active {
  transform: scale(0.97);
}

.cyber-segment-more:hover {
  background: rgba(255, 0, 255, 0.1);
  box-shadow: 0 0 12px rgba(255, 0, 255, 0.2);
}

.cyber-segment-more-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #ff00ff;
  letter-spacing: 1px;
}

.cyber-more-icon {
  width: 14px;
  height: 14px;
  color: #ff00ff;
}

.cyber-info-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  position: relative;
  z-index: 5;
}

.cyber-section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin: 0;
  letter-spacing: 1px;
}

.cyber-count-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.cyber-count-number {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #6366f1;
}

.cyber-count-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: rgba(99, 102, 241, 0.7);
  letter-spacing: 1px;
}

.cyber-list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px;
  position: relative;
  z-index: 5;
}

.cyber-game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cyber-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 16px;
}

.cyber-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 0, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.15);
}

.cyber-empty-svg {
  width: 36px;
  height: 36px;
  color: rgba(255, 0, 255, 0.6);
}

.cyber-empty-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.cyber-empty-subtitle {
  font-size: 14px;
  color: var(--ios-text-secondary);
}

.cyber-safe-area-bottom {
  height: env(safe-area-inset-bottom, 34px);
}

.cyber-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 34px;
}

.cyber-sheet-container {
  width: 100%;
  max-width: 500px;
  padding: 8px;
}

.cyber-sheet-card {
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.1);
}

.cyber-sheet-header {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cyber-sheet-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 255, 255, 0.7);
  letter-spacing: 2px;
}

.cyber-sheet-options {
  display: flex;
  flex-direction: column;
}

.cyber-sheet-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--ios-duration-fast) var(--ios-ease);
  position: relative;
}

.cyber-sheet-option:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cyber-sheet-option:active {
  background: rgba(0, 255, 255, 0.1);
}

.cyber-sheet-option-selected {
  background: rgba(0, 255, 255, 0.05);
}

.cyber-sheet-option-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #00ffff;
}

.cyber-sheet-option-text {
  font-size: 17px;
  color: var(--ios-text-primary);
}

.cyber-sheet-option-selected .cyber-sheet-option-text {
  color: #00ffff;
  font-weight: 600;
}

.cyber-sheet-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cyber-check-icon {
  width: 18px;
  height: 18px;
  color: #00ffff;
}

.cyber-sheet-cancel {
  width: 100%;
  margin-top: 8px;
  padding: 16px 18px;
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 0, 255, 0.3);
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ff00ff;
  cursor: pointer;
  letter-spacing: 2px;
}

.cyber-sheet-cancel:active {
  opacity: 0.9;
  background: rgba(255, 0, 255, 0.1);
}
</style>
