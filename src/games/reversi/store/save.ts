import { gameStorage } from '../../../stores/gameStorage'
import { loadProfileWithDefaults } from '../../../utils/gameProfile'

export type ReversiProfile = {
  coins: number
  rating: number
  wins: number
  losses: number
  draws: number
}

const PROFILE_KEY = 'reversi-profile'

export const createDefaultProfile = (): ReversiProfile => ({
  coins: 500,
  rating: 1,
  wins: 0,
  losses: 0,
  draws: 0,
})

export const loadProfile = async (): Promise<ReversiProfile> =>
  loadProfileWithDefaults(PROFILE_KEY, createDefaultProfile)

export const saveProfile = async (profile: ReversiProfile) => {
  await gameStorage.saveGameState(PROFILE_KEY, profile)
}
