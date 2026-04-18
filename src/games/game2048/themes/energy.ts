import type { GameTheme } from '../types'

const importIcon = (name: string) =>
  new URL(`../assets/imgs/energyEpochs/${name}.png`, import.meta.url).href

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
  containerBg: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
  gridBg: 'bg-slate-800/30',
  gridBorder: 'border border-cyan-500/30',
  cellBg: 'bg-slate-700/40',
  titleColor: 'text-cyan-400',
  textColor: 'text-cyan-100',
  labelColor: 'text-cyan-300/70',
  buttonBg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
  buttonTextColor: 'text-white',
  useIcons: true,
  iconMap: {
    2: importIcon('2'),
    4: importIcon('4'),
    8: importIcon('8'),
    16: importIcon('16'),
    32: importIcon('32'),
    64: importIcon('64'),
    128: importIcon('128'),
    256: importIcon('256'),
    512: importIcon('512'),
    1024: importIcon('1024'),
    2048: importIcon('2048'),
  },
}
