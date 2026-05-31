<script setup lang="ts">
import { computed } from 'vue'

export type IconName =
  | 'exit'
  | 'sound'
  | 'sound-off'
  | 'restart'
  | 'undo'
  | 'hint'
  | 'ai-mode'
  | 'dual-mode'
  | 'exit-page'
  | 'crown'
  | 'coin'

const props = defineProps<{
  name: IconName
  size?: number
}>()

const iconSize = computed(() => props.size ?? 24)

const paths: Record<string, string> = {
  exit: `<path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/>`,
  sound: `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v4.99c1.24-.38 2.5-1.16 2.5-2.49zm3.5 0c0-2.97-1.54-5.57-3.83-7.07l-.6.98c1.74 1.11 2.93 3.07 2.93 6.09s-1.19 4.98-2.93 6.09l.6.98A8.99 8.99 0 0020 12z" fill="currentColor"/>`,
  'sound-off': `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM16 12l3.59-3.59L18.59 7 15 10.59 11.41 7l-1 1L14 11.59l-3.59 3.59 1 1L15 12.59l3.59 3.59 1-1L16 12z" fill="currentColor"/>`,
  restart: `<path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>`,
  undo: `<path d="M12.5 8c-2.65 0-4.97 1.69-5.76 4H3.5l4.5 4.5L12.5 12H8.74c.67-1.33 2.05-2.25 3.6-2.25 2.21 0 4 1.79 4 4s-1.79 4-4 4c-.74 0-1.44-.2-2.04-.56l-1.27 1.27A6.46 6.46 0 0012.5 19c3.59 0 6.5-2.91 6.5-6.5S16.09 6 12.5 6z" fill="currentColor"/>`,
  hint: `<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" fill="currentColor"/>`,
  'ai-mode': `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>`,
  'dual-mode': `<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>`,
  'exit-page': `<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>`,
  crown: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>`,
  coin: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" fill="currentColor"/>`,
}

const svgContent = computed(() => paths[props.name] ?? '')
</script>

<template>
  <svg
    :width="iconSize"
    :height="iconSize"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g v-html="svgContent" />
  </svg>
</template>
