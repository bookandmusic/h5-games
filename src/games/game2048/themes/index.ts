import type { GameTheme, Theme } from '../types'
import { defaultTheme } from './default'
import { deityTheme } from './deity'
import { energyTheme } from './energy'
import { undeadTheme } from './undead'

const themes: Record<Theme, GameTheme> = {
  default: defaultTheme,
  energy: energyTheme,
  deity: deityTheme,
  undead: undeadTheme,
}

export const getTheme = (name: Theme): GameTheme => themes[name]
