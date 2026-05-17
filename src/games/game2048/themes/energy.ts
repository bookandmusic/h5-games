import type { GameTheme } from '../types'
import { buildIconMap } from '../utils'

const importIcon = (name: string) =>
  new URL(`../assets/imgs/mecha-era/${name}.png`, import.meta.url).href

export const energyTheme: GameTheme = {
  name: 'energy',
  cellThemes: {
    0: { bg: 'bg-slate-800/50', text: 'text-transparent' },
    2: {
      bg: 'bg-gradient-to-br from-violet-600 to-purple-700',
      text: 'text-white',
      glow: 'shadow-violet-500/50',
    },
    4: {
      bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      text: 'text-white',
      glow: 'shadow-purple-500/50',
    },
    8: {
      bg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
      text: 'text-white',
      glow: 'shadow-indigo-500/50',
    },
    16: {
      bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      text: 'text-white',
      glow: 'shadow-blue-500/50',
    },
    32: {
      bg: 'bg-gradient-to-br from-cyan-500 to-teal-600',
      text: 'text-white',
      glow: 'shadow-cyan-500/50',
    },
    64: {
      bg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
      text: 'text-white',
      glow: 'shadow-teal-500/50',
    },
    128: {
      bg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-white',
      glow: 'shadow-emerald-500/50',
    },
    256: {
      bg: 'bg-gradient-to-br from-green-500 to-lime-600',
      text: 'text-white',
      glow: 'shadow-green-500/50',
    },
    512: {
      bg: 'bg-gradient-to-br from-lime-500 to-yellow-600',
      text: 'text-white',
      glow: 'shadow-lime-500/50',
    },
    1024: {
      bg: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      text: 'text-white',
      glow: 'shadow-yellow-500/50',
    },
    2048: {
      bg: 'bg-gradient-to-br from-orange-500 to-red-600',
      text: 'text-white',
      glow: 'shadow-orange-500/50 shadow-lg',
    },
  },
  useIcons: true,
  iconMap: buildIconMap(importIcon),
}
