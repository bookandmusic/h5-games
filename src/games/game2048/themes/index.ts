import type { GameTheme, Theme } from '../types'
import { defaultTheme } from './default'
import { deityTheme } from './deity'
import { energyTheme } from './energy'

const themes: Record<Theme, GameTheme> = {
  default: defaultTheme,
  energy: energyTheme,
  deity: deityTheme,
}

export const getTheme = (name: Theme): GameTheme => themes[name]

export { defaultTheme, deityTheme, energyTheme }
export type { GameTheme }
