<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    width?: string
    showClose?: boolean
    bodyClass?: string
  }>(),
  { showClose: true }
)

defineEmits<{
  close: []
}>()

const cardStyle = computed(() => (props.width ? { width: props.width } : undefined))
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="card" role="dialog" aria-modal="true" :style="cardStyle">
        <button v-if="showClose" class="close-btn" @click="$emit('close')">
          <span class="close-icon">✕</span>
        </button>
        <div class="card-body" :class="bodyClass">
          <div v-if="title" class="header-box">
            <div class="decor-line" />
            <div class="title-card">
              <div class="title-card-inner">{{ title }}</div>
            </div>
            <div class="decor-line" />
          </div>
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.card {
  --radius: 22px;
  --gap: 8px;
  --thickness: 3px;
  width: min(100%, 340px);
  background: #f7f0e4;
  position: relative;
  mask:
    radial-gradient(circle at 0 0, transparent var(--radius), #000 0) top left,
    radial-gradient(circle at 100% 0, transparent var(--radius), #000 0) top right,
    radial-gradient(circle at 0 100%, transparent var(--radius), #000 0) bottom left,
    radial-gradient(circle at 100% 100%, transparent var(--radius), #000 0) bottom right;
  mask-size: 51% 51%;
  mask-repeat: no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent var(--radius), #000 0) top left,
    radial-gradient(circle at 100% 0, transparent var(--radius), #000 0) top right,
    radial-gradient(circle at 0 100%, transparent var(--radius), #000 0) bottom left,
    radial-gradient(circle at 100% 100%, transparent var(--radius), #000 0) bottom right;
  -webkit-mask-size: 51% 51%;
  -webkit-mask-repeat: no-repeat;
}

.card::before {
  content: '';
  position: absolute;
  inset: var(--gap);
  background: #b0885a;
  pointer-events: none;
  z-index: 1;
  --offset: calc(-1 * var(--gap));
  --r-gold: calc(var(--radius) + var(--gap));
  mask:
    radial-gradient(circle at var(--offset) var(--offset), transparent var(--r-gold), #000 0) top
      left,
    radial-gradient(
        circle at calc(100% - var(--offset)) var(--offset),
        transparent var(--r-gold),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset)) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom right;
  mask-size: 51% 51%;
  mask-repeat: no-repeat;
  -webkit-mask:
    radial-gradient(circle at var(--offset) var(--offset), transparent var(--r-gold), #000 0) top
      left,
    radial-gradient(
        circle at calc(100% - var(--offset)) var(--offset),
        transparent var(--r-gold),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset)) calc(100% - var(--offset)),
        transparent var(--r-gold),
        #000 0
      )
      bottom right;
  -webkit-mask-size: 51% 51%;
  -webkit-mask-repeat: no-repeat;
}

.card::after {
  content: '';
  position: absolute;
  inset: calc(var(--gap) + var(--thickness));
  background: #f7f0e4;
  pointer-events: none;
  z-index: 2;
  --offset-i: calc(-1 * (var(--gap) + var(--thickness)));
  --r-inner: calc(var(--radius) + var(--gap) + var(--thickness));
  mask:
    radial-gradient(circle at var(--offset-i) var(--offset-i), transparent var(--r-inner), #000 0)
      top left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) var(--offset-i),
        transparent var(--r-inner),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset-i) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom right;
  mask-size: 51% 51%;
  mask-repeat: no-repeat;
  -webkit-mask:
    radial-gradient(circle at var(--offset-i) var(--offset-i), transparent var(--r-inner), #000 0)
      top left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) var(--offset-i),
        transparent var(--r-inner),
        #000 0
      )
      top right,
    radial-gradient(
        circle at var(--offset-i) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom left,
    radial-gradient(
        circle at calc(100% - var(--offset-i)) calc(100% - var(--offset-i)),
        transparent var(--r-inner),
        #000 0
      )
      bottom right;
  -webkit-mask-size: 51% 51%;
  -webkit-mask-repeat: no-repeat;
}

.close-btn {
  position: absolute;
  right: 24px;
  top: 24px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0;
  background: #b0885a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
  padding: 0;
  z-index: 10;
  mask:
    radial-gradient(circle at 0 0, transparent 2px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 2px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 2px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 2px, #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent 2px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 2px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 2px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 2px, #000 0) 100% 100% / 51% 51% no-repeat;
}

.close-btn::before {
  content: '';
  position: absolute;
  inset: 2px;
  background: #ece0ce;
  z-index: -1;
}

.close-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform: rotate(-45deg);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  font-weight: 400;
}

.card-body {
  padding: 28px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 3;
}

.card-body.no-gap {
  gap: 0;
}

.header-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  width: 100%;
  justify-content: center;
}

.decor-line {
  width: 8px;
  height: 30px;
  background: #b0885a;
  position: relative;
  flex-shrink: 0;
  mask:
    radial-gradient(circle at 0 0, transparent 3px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 3px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 3px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 3px, #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent 3px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 3px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 3px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 3px, #000 0) 100% 100% / 51% 51% no-repeat;
}

.decor-line::after {
  content: '';
  position: absolute;
  inset: 2px 0;
  background: #ece0ce;
}

.title-card {
  background: #ece0ce;
  padding: 2px;
  mask:
    radial-gradient(circle at 0 0, transparent 8px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 8px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 8px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 8px, #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent 8px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 8px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 8px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 8px, #000 0) 100% 100% / 51% 51% no-repeat;
}

.title-card-inner {
  padding: 8px 28px;
  background: #f7f0e4;
  color: #8c603a;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-family: 'Noto Serif SC', 'STSong', serif;
  text-align: center;
  white-space: nowrap;
  mask:
    radial-gradient(circle at 0 0, transparent 6px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 6px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 6px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 6px, #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent 6px, #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent 6px, #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 6px, #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 6px, #000 0) 100% 100% / 51% 51% no-repeat;
}
</style>
