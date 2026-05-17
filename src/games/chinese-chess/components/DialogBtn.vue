<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'confirm' | 'cancel' | 'primary' | 'secondary'
    compact?: boolean
  }>(),
  { variant: 'default', compact: false }
)
</script>

<template>
  <div class="btn-outer" :class="{ compact }">
    <div class="btn-inner">
      <button class="btn-final" :class="[variant, { compact }]">
        <slot />
      </button>
    </div>
  </div>
</template>

<style scoped>
.btn-outer {
  --r: 6px;
  background: #b0885a;
  padding: 2px;
  cursor: pointer;
  width: 100%;
  mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
}

.btn-inner {
  --r: 5px;
  background: #ece0ce;
  padding: 2px;
  mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
}

.btn-final {
  --r: 4px;
  border: none;
  background: transparent;
  color: #fff;
  padding: 10px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  font-family: 'Noto Serif SC', 'STSong', serif;
  cursor: pointer;
  transition: transform 100ms ease;
  display: block;
  width: 100%;
  text-align: center;
  mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
  -webkit-mask:
    radial-gradient(circle at 0 0, transparent var(--r), #000 0) 0 0 / 51% 51% no-repeat,
    radial-gradient(circle at 100% 0, transparent var(--r), #000 0) 100% 0 / 51% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent var(--r), #000 0) 0 100% / 51% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent var(--r), #000 0) 100% 100% / 51% 51% no-repeat;
}

.btn-final:active {
  transform: scale(0.96);
}

.btn-final:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-final.compact {
  padding: 4px 12px;
  font-size: 13px;
  background: #b55a48;
  white-space: nowrap;
  width: auto;
  display: inline-block;
}

.btn-outer.compact {
  display: inline-flex;
  width: auto;
  flex: none;
}

.btn-final.default {
  background: #b55a48;
}

.btn-final.confirm,
.btn-final.primary {
  background: #b55a48;
}

.btn-final.cancel,
.btn-final.secondary {
  background: #6a8a7a;
}
</style>
