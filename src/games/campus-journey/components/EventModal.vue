<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  description: string
  image?: string
  actions?: ReadonlyArray<{
    id: string
    label: string
    primary?: boolean
  }>
}>()

defineEmits<{
  close: []
  action: [id: string]
}>()
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="modal-shell" @click.self="$emit('close')">
      <div class="modal-content">
        <img v-if="image" :src="image" alt="" />
        <h3>{{ title }}</h3>
        <p class="desc">{{ description }}</p>
        <div class="actions">
          <button
            v-for="action in actions?.length
              ? actions
              : [{ id: 'close', label: '继续', primary: true }]"
            :key="action.id"
            :class="{ ghost: !action.primary }"
            @click="$emit('action', action.id)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-shell {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(201, 152, 176, 0.12);
  z-index: 30;
}
.modal-content {
  display: grid;
  justify-items: center;
  width: min(100%, 420px);
  max-height: calc(100dvh - 40px);
  overflow: auto;
  padding: 18px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(252, 228, 236, 0.84)),
    rgba(255, 255, 255, 0.94);
  border: 2px solid rgba(247, 191, 211, 0.86);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 28px 72px rgba(171, 102, 134, 0.24);
  text-align: center;
  color: #6f4a59;
}
.modal-content img {
  width: 100%;
  max-height: min(44dvh, 320px);
  object-fit: cover;
  border-radius: 18px;
  margin-bottom: 14px;
  box-shadow: 0 16px 28px rgba(171, 102, 134, 0.14);
}
h3 {
  margin: 0;
  color: #8b4b67;
  font-size: 22px;
  line-height: 1.2;
}
.desc {
  margin: 10px 0 0;
  color: #6f4a59;
  font-size: 14px;
  line-height: 1.55;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}
button {
  min-width: 132px;
  min-height: 48px;
  padding: 0 22px;
  border: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #f48fb1, #e96c98);
  color: #fff;
  box-shadow: 0 12px 24px rgba(233, 108, 152, 0.2);
}
button.ghost {
  background: rgba(255, 255, 255, 0.88);
  color: #6f4a59;
  box-shadow: inset 0 0 0 1px rgba(247, 191, 211, 0.66);
}
@media (max-width: 720px) {
  .modal-shell {
    padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));
  }
  .modal-content {
    max-height: calc(100dvh - 28px);
    padding: 16px;
  }
}
</style>
