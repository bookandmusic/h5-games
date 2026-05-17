<script setup lang="ts">
import { onMounted } from 'vue'
import { useBackButton } from './composables/useBackButton'

const { setup } = useBackButton()

onMounted(() => {
  setup()
})
</script>

<template>
  <div class="app-shell">
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
