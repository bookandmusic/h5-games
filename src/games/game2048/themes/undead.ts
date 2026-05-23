import type { GameTheme } from '../types'
import { buildIconMap } from '../utils'

const importIcon = (name: string) =>
  new URL(`../assets/imgs/undead/${name}.png`, import.meta.url).href

export const undeadTheme: GameTheme = {
  name: 'undead',
  cellThemes: {
    0: {
      bg: 'bg-gradient-to-br from-stone-700/50 to-zinc-800/40',
      text: 'text-transparent',
    },
    2: {
      bg: 'bg-gradient-to-br from-stone-100 to-amber-50',
      text: 'text-stone-800',
      glow: 'shadow-stone-300/50',
    },
    4: {
      bg: 'bg-gradient-to-br from-green-200 to-emerald-300',
      text: 'text-green-900',
      glow: 'shadow-green-300/50',
    },
    8: {
      bg: 'bg-gradient-to-br from-purple-300 to-violet-400',
      text: 'text-white',
      glow: 'shadow-purple-400/50',
    },
    16: {
      bg: 'bg-gradient-to-br from-slate-300 to-zinc-400',
      text: 'text-slate-900',
      glow: 'shadow-slate-400/50',
    },
    32: {
      bg: 'bg-gradient-to-br from-indigo-200 to-purple-300',
      text: 'text-indigo-900',
      glow: 'shadow-indigo-300/50',
    },
    64: {
      bg: 'bg-gradient-to-br from-purple-300 to-fuchsia-400',
      text: 'text-white',
      glow: 'shadow-purple-400/50',
    },
    128: {
      bg: 'bg-gradient-to-br from-lime-200 to-green-300',
      text: 'text-green-900',
      glow: 'shadow-lime-300/50',
    },
    256: {
      bg: 'bg-gradient-to-br from-zinc-300 to-stone-400',
      text: 'text-stone-900',
      glow: 'shadow-zinc-400/50',
    },
    512: {
      bg: 'bg-gradient-to-br from-cyan-200 to-blue-300',
      text: 'text-cyan-900',
      glow: 'shadow-cyan-300/50',
    },
    1024: {
      bg: 'bg-gradient-to-br from-blue-200 to-indigo-300',
      text: 'text-blue-900',
      glow: 'shadow-blue-300/50',
    },
    2048: {
      bg: 'bg-gradient-to-br from-slate-300 via-amber-200 to-blue-300',
      text: 'text-slate-900',
      glow: 'shadow-amber-200/60 shadow-lg',
    },
  },
  useIcons: true,
  iconMap: buildIconMap(importIcon),
}
