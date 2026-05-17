import type { GameTheme } from '../types'

export const defaultTheme: GameTheme = {
  name: 'default',
  cellThemes: {
    0: { bg: 'bg-gray-200', text: 'text-gray-300' },
    2: { bg: 'bg-amber-100', text: 'text-amber-800' },
    4: { bg: 'bg-amber-200', text: 'text-amber-900' },
    8: { bg: 'bg-orange-300', text: 'text-white' },
    16: { bg: 'bg-orange-400', text: 'text-white' },
    32: { bg: 'bg-red-400', text: 'text-white' },
    64: { bg: 'bg-red-500', text: 'text-white' },
    128: { bg: 'bg-yellow-400', text: 'text-white' },
    256: { bg: 'bg-yellow-500', text: 'text-white' },
    512: { bg: 'bg-purple-400', text: 'text-white' },
    1024: { bg: 'bg-purple-500', text: 'text-white' },
    2048: { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-white' },
  },
  useIcons: false,
}
