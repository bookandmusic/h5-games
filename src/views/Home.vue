<script setup lang="ts">
import { computed, ref } from 'vue'

import GameCard from '../components/GameCard.vue'
import { useGamesStore } from '../stores/games'

const store = useGamesStore()

// iOS 分段控制器
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

// 显示更多分类
const showMoreCategories = () => {
  showCategorySheet.value = true
}

// 从弹窗选择分类
const selectCategoryFromSheet = (index: number) => {
  selectedSegment.value = index
  if (index === 0) {
    store.setCategory(null)
  } else {
    store.setCategory(store.categories[index - 1])
  }
  showCategorySheet.value = false
}

// 关闭弹窗
const closeSheet = () => {
  showCategorySheet.value = false
}

// 当前选中分类的标题
const currentCategoryTitle = computed(() => {
  if (store.selectedCategory) {
    return store.selectedCategory
  }
  return '推荐游戏'
})
</script>

<template>
  <div class="ios-app">
    <!-- iOS 导航栏 - 固定 -->
    <header class="ios-header">
      <div class="ios-header-content">
        <div class="ios-header-small">
          <div class="ios-header-left">
            <div class="ios-app-icon">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"
                />
              </svg>
            </div>
            <span class="ios-header-title">游戏中心</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 搜索栏 - 固定 -->
    <div class="ios-search-section">
      <div class="ios-search-bar">
        <svg
          class="ios-search-icon"
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
          class="ios-search-input"
          placeholder="搜索游戏"
          :value="store.searchQuery"
          @input="store.setSearchQuery(($event.target as HTMLInputElement).value)"
        />
        <button v-if="store.searchQuery" class="ios-search-clear" @click="store.setSearchQuery('')">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 分类栏 - 固定 -->
    <div class="ios-category-section">
      <div class="ios-segment-control">
        <button
          v-for="(segment, index) in segments.slice(0, 3)"
          :key="index"
          class="ios-segment"
          :class="{ 'ios-segment-active': selectedSegment === index }"
          @click="selectSegment(index)"
        >
          {{ segment }}
        </button>
        <button v-if="segments.length > 3" class="ios-segment-more" @click="showMoreCategories">
          更多
        </button>
      </div>
    </div>

    <!-- 提示信息 - 固定 -->
    <div class="ios-info-section">
      <h2 class="ios-section-title">{{ currentCategoryTitle }}</h2>
      <span class="ios-section-count">{{ store.filteredGames.length }} 个</span>
    </div>

    <!-- 游戏列表 - 可滚动区域 -->
    <main class="ios-list-container">
      <div class="ios-grouped-list">
        <GameCard
          v-for="(game, index) in store.filteredGames"
          :key="game.id"
          :game="game"
          :index="index"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="store.filteredGames.length === 0" class="ios-empty-state">
        <div class="ios-empty-icon">
          <svg
            class="w-8 h-8 text-gray-400"
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
        <p class="ios-empty-title">没有找到游戏</p>
        <p class="ios-empty-subtitle">请尝试其他搜索词或分类</p>
      </div>

      <!-- 底部安全区域 -->
      <div class="ios-safe-area-bottom"></div>
    </main>

    <!-- iOS Action Sheet 分类选择器 -->
    <div v-if="showCategorySheet" class="ios-sheet-overlay" @click="closeSheet">
      <div class="ios-sheet-container">
        <div class="ios-sheet-card">
          <div class="ios-sheet-options">
            <button
              v-for="(segment, index) in segments"
              :key="index"
              class="ios-sheet-option"
              :class="{ 'ios-sheet-option-selected': selectedSegment === index }"
              @click.stop="selectCategoryFromSheet(index)"
            >
              <span class="ios-sheet-option-text">{{ segment }}</span>
              <div v-if="selectedSegment === index" class="ios-sheet-check">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 18.83l9-9L16.59 8.5z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
        <button class="ios-sheet-cancel" @click.stop="closeSheet">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ios-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--ios-background);
}

/* 头部 - 固定 */
.ios-header {
  flex-shrink: 0;
  background: var(--ios-header-bg);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}

.ios-header-content {
  padding: 12px 16px;
}

.ios-header-small {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ios-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ios-app-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, #7c3aed, #f43f5e);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ios-header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--ios-text-primary);
}

/* 搜索栏 - 固定 */
.ios-search-section {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--ios-background);
}

.ios-search-bar {
  display: flex;
  align-items: center;
  background: var(--ios-search-bg);
  border-radius: 10px;
  padding: 8px 10px;
  gap: 8px;
}

.ios-search-icon {
  width: 18px;
  height: 18px;
  color: var(--ios-text-tertiary);
  flex-shrink: 0;
}

.ios-search-input {
  flex: 1;
  background: none;
  border: none;
  font-size: 17px;
  color: var(--ios-text-primary);
  outline: none;
}

.ios-search-input::placeholder {
  color: var(--ios-text-tertiary);
}

.ios-search-clear {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ios-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 分类栏 - 固定 */
.ios-category-section {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--ios-background);
}

.ios-segment-control {
  display: flex;
  background: var(--ios-segment-bg);
  border-radius: 9px;
  padding: 2px;
}

.ios-segment {
  flex: 1;
  min-width: 60px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ios-text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

.ios-segment:active {
  transform: scale(0.97);
}

.ios-segment-active {
  background: var(--ios-surface);
  color: var(--ios-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ios-segment-more {
  flex: 1;
  min-width: 60px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ios-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

.ios-segment-more:active {
  transform: scale(0.97);
}

/* 提示信息 - 固定 */
.ios-info-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  background: var(--ios-background);
}

.ios-section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ios-text-primary);
  margin: 0;
}

.ios-section-count {
  font-size: 14px;
  color: var(--ios-text-secondary);
}

/* 游戏列表 - 可滚动区域 */
.ios-list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px;
  background: var(--ios-background);
}

.ios-grouped-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ios-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
}

.ios-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--ios-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.ios-empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ios-text-primary);
  margin-bottom: 4px;
}

.ios-empty-subtitle {
  font-size: 14px;
  color: var(--ios-text-secondary);
}

.ios-safe-area-bottom {
  height: 34px;
}

/* iOS Action Sheet */
.ios-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 34px;
}

.ios-sheet-container {
  width: 100%;
  max-width: 500px;
  padding: 8px;
}

.ios-sheet-card {
  background: var(--ios-surface);
  border-radius: 14px;
  overflow: hidden;
}

.ios-sheet-options {
  display: flex;
  flex-direction: column;
}

.ios-sheet-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: transparent;
  border: none;
  font-size: 17px;
  color: var(--ios-text-primary);
  cursor: pointer;
  transition: background 150ms;
}

.ios-sheet-option:not(:last-child) {
  border-bottom: 0.5px solid #c6c6c8;
}

.ios-sheet-option:active {
  background: var(--ios-background);
}

.ios-sheet-option-selected .ios-sheet-option-text {
  color: var(--ios-primary);
  font-weight: 500;
}

.ios-sheet-check {
  width: 20px;
  height: 20px;
  color: var(--ios-primary);
}

.ios-sheet-cancel {
  width: 100%;
  margin-top: 8px;
  padding: 14px 16px;
  background: var(--ios-surface);
  border-radius: 14px;
  border: none;
  font-size: 17px;
  font-weight: 600;
  color: var(--ios-primary);
  cursor: pointer;
}

.ios-sheet-cancel:active {
  opacity: 0.8;
}
</style>
