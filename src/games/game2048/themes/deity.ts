import type { GameTheme } from '../types'

const importIcon = (name: string) =>
  new URL(`../assets/imgs/deity/${name}.png`, import.meta.url).href

export const deityTheme: GameTheme = {
  name: 'deity',
  cellThemes: {
    0: { bg: 'bg-stone-900/35', text: 'text-transparent' },
    2: {
      bg: 'bg-gradient-to-br from-amber-100 to-yellow-200',
      text: 'text-amber-950',
      glow: 'shadow-amber-200/60',
    },
    4: {
      bg: 'bg-gradient-to-br from-stone-200 to-amber-200',
      text: 'text-stone-900',
      glow: 'shadow-stone-300/60',
    },
    8: {
      bg: 'bg-gradient-to-br from-slate-400 to-stone-500',
      text: 'text-white',
      glow: 'shadow-slate-400/55',
    },
    16: {
      bg: 'bg-gradient-to-br from-slate-500 to-zinc-700',
      text: 'text-white',
      glow: 'shadow-slate-500/55',
    },
    32: {
      bg: 'bg-gradient-to-br from-orange-500 to-amber-700',
      text: 'text-white',
      glow: 'shadow-orange-500/55',
    },
    64: {
      bg: 'bg-gradient-to-br from-zinc-100 to-slate-300',
      text: 'text-slate-900',
      glow: 'shadow-slate-200/70',
    },
    128: {
      bg: 'bg-gradient-to-br from-yellow-300 to-amber-500',
      text: 'text-amber-950',
      glow: 'shadow-yellow-300/70',
    },
    256: {
      bg: 'bg-gradient-to-br from-slate-200 to-zinc-100',
      text: 'text-slate-900',
      glow: 'shadow-slate-100/75',
    },
    512: {
      bg: 'bg-gradient-to-br from-stone-100 to-rose-100',
      text: 'text-stone-900',
      glow: 'shadow-rose-100/80',
    },
    1024: {
      bg: 'bg-gradient-to-br from-cyan-100 to-sky-300',
      text: 'text-sky-950',
      glow: 'shadow-cyan-200/80',
    },
    2048: {
      bg: 'bg-gradient-to-br from-fuchsia-200 via-amber-100 to-cyan-200',
      text: 'text-slate-950',
      glow: 'shadow-yellow-200/90 shadow-lg',
    },
  },
  containerBg: 'bg-gradient-to-br from-slate-950 via-stone-900 to-amber-950',
  gridBg: 'bg-stone-950/35',
  gridBorder: 'border border-amber-200/15',
  cellBg: 'bg-stone-800/45',
  titleColor: 'text-amber-100',
  textColor: 'text-stone-100',
  labelColor: 'text-amber-200/70',
  buttonBg: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500',
  buttonTextColor: 'text-stone-950',
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
