<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { CollectionCardState } from '../types'

type ProfileSkinCard = {
  id: string
  name: string
  image: string
  sourceLabel: string
  state: CollectionCardState
  price?: number
  canBuy?: boolean
}

const props = defineProps<{
  exp: number
  money: number
  knowledge: number
  reputation: number
  currentTaskName: string
  ownedSkinCount: number
  totalSkinCount: number
  equippedSkinId: string
  skins: ProfileSkinCard[]
  icons: Record<string, string>
  unlockedFrameSrc: string
  lockedFrameSrc: string
  mainCleared: boolean
  collectionShopUnlocked: boolean
}>()

const emit = defineEmits<{
  (e: 'equip', skinId: string): void
  (e: 'buy', skinId: string): void
}>()

const activeIndex = ref(0)
const touchStartX = ref<number | null>(null)

const syncActiveIndex = () => {
  const index = props.skins.findIndex((skin) => skin.id === props.equippedSkinId)
  activeIndex.value = index >= 0 ? index : 0
}

watch(
  () => [props.equippedSkinId, props.skins],
  () => syncActiveIndex(),
  { immediate: true }
)

const activeSkin = computed(() => props.skins[activeIndex.value] ?? props.skins[0] ?? null)
const canGoPrev = computed(() => activeIndex.value > 0)
const canGoNext = computed(() => activeIndex.value < props.skins.length - 1)
const visibleDots = computed(() => {
  const total = props.skins.length
  if (total <= 3) {
    return props.skins.map((skin, index) => ({ id: skin.id, index }))
  }

  let start = Math.max(0, activeIndex.value - 1)
  let end = start + 3
  if (end > total) {
    end = total
    start = end - 3
  }

  return props.skins.slice(start, end).map((skin, offset) => ({
    id: skin.id,
    index: start + offset,
  }))
})

const goPrev = () => {
  if (!canGoPrev.value) return
  activeIndex.value -= 1
}

const goNext = () => {
  if (!canGoNext.value) return
  activeIndex.value += 1
}

const onTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0]?.clientX ?? null
}

const onTouchEnd = (event: TouchEvent) => {
  if (touchStartX.value === null) return
  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.value
  const deltaX = touchEndX - touchStartX.value
  touchStartX.value = null
  if (Math.abs(deltaX) < 36) return
  if (deltaX > 0) goPrev()
  else goNext()
}

const equipActiveSkin = () => {
  if (!activeSkin.value) return
  if (activeSkin.value.state === 'owned') {
    emit('equip', activeSkin.value.id)
  }
}

const canShowBuyButton = computed(() => activeSkin.value?.state === 'buyable')

const buyButtonDisabled = computed(() => {
  if (!canShowBuyButton.value) return true
  if (!props.mainCleared || !props.collectionShopUnlocked) return true
  return !activeSkin.value?.canBuy
})

const buyButtonLabel = computed(() => {
  if (!canShowBuyButton.value) return ''
  const price = activeSkin.value?.price ?? 0
  if (!props.mainCleared || !props.collectionShopUnlocked) {
    return '衣橱店开放后可带回'
  }
  if (!activeSkin.value?.canBuy) {
    return `金币还差一点 · ${price} 金币`
  }
  return `带回衣橱 · ${price} 金币`
})

const buyActiveSkin = () => {
  if (!activeSkin.value || buyButtonDisabled.value) return
  emit('buy', activeSkin.value.id)
}
</script>

<template>
  <div class="profile-scroll">
    <div class="profile-body">
      <div class="portrait-card game-card">
        <div class="portrait-stage" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
          <div class="portrait-track" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
            <div v-for="skin in skins" :key="skin.id" class="portrait-slide">
              <img
                class="portrait-frame"
                :src="skin.state === 'locked' ? lockedFrameSrc : unlockedFrameSrc"
                alt=""
              />
              <img
                class="portrait-skin"
                :class="{ locked: skin.state === 'locked' }"
                :src="skin.image"
                :alt="skin.name"
              />
              <div class="portrait-veil" :class="{ locked: skin.state === 'locked' }"></div>
            </div>
          </div>
          <button class="slide-btn prev" :disabled="!canGoPrev" @click="goPrev">
            <span aria-hidden="true">‹</span>
          </button>
          <button class="slide-btn next" :disabled="!canGoNext" @click="goNext">
            <span aria-hidden="true">›</span>
          </button>
          <div class="portrait-dots">
            <button
              v-for="dot in visibleDots"
              :key="dot.id"
              class="dot"
              :class="{ active: dot.index === activeIndex }"
              :aria-label="`查看${skins[dot.index]?.name ?? ''}`"
              @click="activeIndex = dot.index"
            ></button>
          </div>
        </div>
        <div class="portrait-meta">
          <strong>{{ activeSkin?.name ?? currentTaskName }}</strong>
          <p>{{ activeSkin?.sourceLabel ?? '当前聚焦任务' }}</p>
          <div v-if="activeSkin" class="skin-meta-row">
            <span
              class="skin-state game-chip"
              :class="{
                [activeSkin.state]: true,
                'is-success': activeSkin.state === 'equipped',
                'is-muted': activeSkin.state === 'locked',
              }"
              >{{
                activeSkin.state === 'equipped'
                  ? '正在穿戴'
                  : activeSkin.state === 'owned'
                    ? '衣橱已有'
                    : activeSkin.state === 'buyable'
                      ? '衣橱可购入'
                      : '未解锁'
              }}</span
            >
            <button
              v-if="activeSkin.state === 'owned'"
              class="equip-btn game-action-btn"
              @click="equipActiveSkin"
            >
              换上看看
            </button>
            <button
              v-else-if="canShowBuyButton"
              class="equip-btn buy-btn game-action-btn"
              :disabled="buyButtonDisabled"
              @click="buyActiveSkin"
            >
              {{ buyButtonLabel }}
            </button>
            <span v-else class="equip-placeholder" aria-hidden="true"></span>
          </div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="resource-grid">
          <div class="resource-card game-card">
            <span class="resource-icon"><img :src="icons['icon-resource-exp']" alt="" /></span>
            <div class="resource-info">
              <strong>{{ exp }}</strong><span>经验</span>
            </div>
          </div>
          <div class="resource-card game-card">
            <span class="resource-icon"><img :src="icons['icon-resource-money']" alt="" /></span>
            <div class="resource-info">
              <strong>{{ money }}</strong><span>金钱</span>
            </div>
          </div>
          <div class="resource-card game-card">
            <span class="resource-icon"><img :src="icons['icon-resource-knowledge']" alt="" /></span>
            <div class="resource-info">
              <strong>{{ knowledge }}</strong><span>知识</span>
            </div>
          </div>
          <div class="resource-card game-card">
            <span class="resource-icon"><img :src="icons['icon-resource-reputation']" alt="" /></span>
            <div class="resource-info">
              <strong>{{ reputation }}</strong><span>声望</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-scroll {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: grid;
}
.profile-body {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
}
.portrait-card,
.resource-card {
  border-radius: 22px;
}
.portrait-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 14px;
  min-height: 0;
  overflow: hidden;
}
.portrait-stage {
  position: relative;
  min-height: 0;
  border-radius: 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(248, 183, 206, 0.18), transparent 56%),
    rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(247, 191, 211, 0.48);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.portrait-track {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  transition: transform 240ms ease;
}
.portrait-slide {
  flex: 0 0 100%;
  position: relative;
}
.portrait-frame,
.portrait-skin,
.portrait-veil {
  position: absolute;
  inset: 0;
}
.portrait-frame {
  z-index: 3;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.portrait-skin {
  z-index: 1;
  width: 65%;
  height: 65%;
  position: absolute;
  left: 50%;
  top: 55%;
  transform: translate(-50%, -50%);
  object-fit: contain;
  filter: drop-shadow(0 18px 24px rgba(171, 102, 134, 0.2));
}
.portrait-skin.locked {
  filter: grayscale(0.35) saturate(0.72) brightness(0.86);
}
.portrait-veil {
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(143, 95, 117, 0.03) 0%, rgba(143, 95, 117, 0.14) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, transparent 45%);
  pointer-events: none;
}
.portrait-veil.locked {
  background:
    linear-gradient(180deg, rgba(17, 23, 34, 0.1) 0%, rgba(17, 23, 34, 0.22) 100%),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.06), transparent 58%);
}
.slide-btn {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: var(--game-action-bg);
  color: #fffafd;
  transform: translateY(-50%);
  box-shadow: var(--game-action-shadow);
}
.slide-btn.prev {
  left: 10px;
}
.slide-btn.next {
  right: 10px;
}
.slide-btn:disabled {
  opacity: 0.45;
}
.portrait-dots {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 2;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}
.dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(184, 128, 151, 0.34);
}
.dot.active {
  width: 18px;
  background: #e96c98;
}
.portrait-meta {
  padding: 2px 4px 0;
  min-height: 0;
}
.portrait-meta strong,
.resource-card strong {
  color: #8b4b67;
}
.portrait-meta p {
  margin: 4px 0 0;
  color: #6f4a59;
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.skin-meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  min-height: 34px;
}
.skin-state {
  min-height: 30px;
  font-size: 12px;
  width: fit-content;
  max-width: 100%;
}
.equip-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}
.buy-btn {
  min-width: 120px;
}
.buy-btn:disabled {
  opacity: 0.55;
  box-shadow: none;
}
.equip-placeholder {
  display: block;
  width: 90px;
  min-height: 34px;
  visibility: hidden;
}
.profile-stats {
  display: grid;
  min-width: 0;
  flex-shrink: 0;
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
.resource-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  gap: 4px 9px;
  min-width: 0;
  min-height: 54px;
  padding: 8px 10px;
  border-radius: 18px;
}
.resource-row .resource-label {
  display: block;
  color: #8d6171;
  font-size: 11px;
  line-height: 1.2;
}
.resource-row .resource-bar {
  grid-column: 1 / -1;
  height: 4px;
  background: rgba(247, 191, 211, 0.3);
  border-radius: 2px;
  overflow: hidden;
}
.resource-row .resource-fill {
  height: 100%;
  background: linear-gradient(90deg, #f48fb1, #e96c98);
  border-radius: 2px;
  transition: width 0.3s;
}
.resource-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  align-items: center;
  gap: 4px 9px;
  min-width: 0;
  min-height: 58px;
  padding: 8px 10px;
  border-radius: 18px;
}
.resource-info {
  align-self: center;
  min-width: 0;
}
.resource-bar {
  grid-column: 1 / -1;
  height: 4px;
  background: rgba(247, 191, 211, 0.3);
  border-radius: 2px;
  overflow: hidden;
}
.resource-fill {
  height: 100%;
  background: linear-gradient(90deg, #f48fb1, #e96c98);
  border-radius: 2px;
  transition: width 0.3s;
}
.resource-icon {
  width: 42px;
  height: 100%;
  min-height: 42px;
  display: grid;
  place-items: center;
  align-self: stretch;
  justify-self: center;
  line-height: 0;
}
.resource-icon img {
  width: 38px;
  height: 38px;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 3px 4px rgba(171, 102, 134, 0.18));
}
.resource-card strong {
  display: block;
  overflow: hidden;
  font-size: 17px;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.resource-card > div > span {
  display: block;
  color: #8d6171;
  font-size: 11px;
  line-height: 1.2;
}
@media (max-height: 700px) {
  .portrait-card {
    gap: 8px;
    padding: 12px;
  }
  .portrait-meta p {
    -webkit-line-clamp: 1;
  }
  .skin-meta-row {
    margin-top: 8px;
  }
  .resource-card {
    min-height: 50px;
  }
}
@media (max-width: 560px) {
  .resource-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .resource-card {
    grid-template-columns: 38px minmax(0, 1fr);
    min-height: 54px;
    padding: 7px 9px;
  }
  .resource-icon {
    width: 38px;
    height: 38px;
  }
  .resource-icon img {
    width: 34px;
    height: 34px;
  }
  .resource-card strong {
    font-size: 15px;
  }
  .slide-btn {
    width: 30px;
    height: 30px;
  }
  .skin-meta-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
