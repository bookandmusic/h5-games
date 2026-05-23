<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import BgDecoration from '../components/BgDecoration.vue'
import GameCard from '../components/GameCard.vue'
import { useBackButton } from '../composables/useBackButton'
import { useGamesStore } from '../stores/games'

const { pushEntry } = useBackButton()

onMounted(() => {
  pushEntry({ page: 'home' })
})

const store = useGamesStore()

const isSearching = ref(false)
const searchInput = ref<HTMLInputElement | undefined>()

const openSearch = async () => {
  isSearching.value = true
  await nextTick()
  searchInput.value?.focus()
}

const closeSearch = () => {
  isSearching.value = false
  store.setSearchQuery('')
}

const hasResults = computed(() => store.filteredGames.length > 0)
</script>

<template>
  <div class="home">
    <div class="bg-decor">
      <BgDecoration />
    </div>

    <header class="curtain">
      <div class="curtain-wave">
        <svg viewBox="0 0 375 60" preserveAspectRatio="none">
          <path d="M0,0 L375,0 L375,60 Q280,60 187,45 Q94,25 0,60 Z" fill="#d0bce8" />
        </svg>
      </div>
      <div class="curtain-bar">
        <div class="curtain-bar-inner">
          <template v-if="isSearching">
            <div class="search-box">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="search-box-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref="searchInput"
                type="search"
                class="search-input"
                placeholder="搜索游戏..."
                :value="store.searchQuery"
                @input="store.setSearchQuery(($event.target as HTMLInputElement).value)"
              />
            </div>
            <button class="curtain-btn" @click="closeSearch">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="curtain-btn-icon"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </template>
          <template v-else>
            <div class="brand">
              <h1 class="brand-title">逸刻</h1>
            </div>
            <div class="curtain-actions">
              <button class="curtain-btn" @click="openSearch" aria-label="搜索">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="curtain-btn-icon"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </template>
        </div>
      </div>
    </header>

    <div class="home-inner">
      <main class="list">
        <div v-if="hasResults" class="grid">
          <GameCard v-for="game in store.filteredGames" :key="game.id" :game="game" />
        </div>
        <div v-else class="empty">
          <p class="empty-title">{{ isSearching ? '没有找到游戏' : '还没有游戏哦~' }}</p>
          <p class="empty-sub">{{ isSearching ? '换个关键词试试？' : '换个分类看看？' }}</p>
        </div>
      </main>
    </div>

    <div class="bar-decor">
      <div class="bar-wave">
        <svg viewBox="0 0 375 40" preserveAspectRatio="none">
          <path d="M0,0 Q94,37 187,0 Q280,37 375,0 L375,40 L0,40 Z" fill="#d0bce8" />
        </svg>
      </div>
      <div class="bar-center-btn">
        <img src="/assets/center-btn-icon.png" alt="" class="center-icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
}

/* Content area — constrained to 3/4 ratio based on viewport height */
.home-inner {
  width: 100%;
  max-width: calc(100vh * 4 / 3);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  padding: 0 clamp(14px, 3.5vw, 28px);
}

/* Background decorations */
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* Curtain header */
.curtain {
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  overflow: hidden;
  padding-top: env(safe-area-inset-top, 0px);
}

.curtain::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: env(safe-area-inset-top, 0px);
  background: #d0bce8;
}

.curtain-wave {
  height: clamp(50px, 12vw, 85px);
  overflow: hidden;
}

.curtain-wave svg {
  display: block;
  width: 100%;
  height: 100%;
}

.curtain-bar {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: env(safe-area-inset-top, 0px);
}

.curtain-bar-inner {
  width: 100%;
  max-width: calc(100vh * 4 / 3);
  margin-inline: auto;
  display: flex;
  align-items: center;
  padding: 6px 16px;
  gap: 8px;
}

@media (min-width: 540px) {
  .curtain-bar-inner {
    padding: 6px 20px;
    gap: 10px;
  }
}

.brand {
  flex: 1;
  min-width: 0;
}

.brand-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(18px, 4.5vw, 28px);
  font-weight: 600;
  color: #fff;
  margin: 0;
  letter-spacing: 0.5px;
}

.curtain-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.curtain-btn {
  width: clamp(34px, 8vw, 44px);
  height: clamp(34px, 8vw, 44px);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all var(--duration-fast) var(--ease);
  flex-shrink: 0;
}

.curtain-btn:active {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.9);
}

.curtain-btn-icon {
  width: clamp(16px, 4vw, 22px);
  height: clamp(16px, 4vw, 22px);
}

/* Search */
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.search-box:focus-within {
  border-color: rgba(255, 255, 255, 0.5);
}

.search-box-icon {
  width: clamp(14px, 3.5vw, 20px);
  height: clamp(14px, 3.5vw, 20px);
  flex-shrink: 0;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #fff;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* Game list */
.list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0 calc(env(safe-area-inset-bottom, 16px) + 16px);
  position: relative;
  z-index: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

@media (min-width: 540px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 800px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1100px) {
  .grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1400px) {
  .grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Empty state */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.empty-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 4px;
}

.empty-sub {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0;
}

/* Decorative bottom bar */
.bar-decor {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  height: clamp(34px, 8vw, 56px);
}

.bar-wave {
  height: 100%;
  overflow: hidden;
}

.bar-wave svg {
  display: block;
  width: 100%;
  height: 100%;
}

.bar-center-btn {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(48px, 12vw, 72px);
  height: clamp(48px, 12vw, 72px);
  border-radius: 50%;
  background: #d0bce8;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(160, 130, 200, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
}

.bar-center-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 55%);
  pointer-events: none;
}

.center-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}
</style>
