import { gameStorage } from '../../stores/gameStorage'
import {
  CAMPUS_JOURNEY_GAME_ID,
  CAMPUS_JOURNEY_SAVE_VERSION,
  DEFAULT_MINIGAME_STATS,
  DEFAULT_SKILL_LEVELS,
} from './constants'
import { createInitialPlayerState } from './reducers'
import type { DifficultyId, PlayerState, SaveArchive, SaveSlot } from './types'

export const CAMPUS_JOURNEY_MAX_SAVE_SLOTS = 3
const difficultyIds = new Set<DifficultyId>(['easy', 'medium', 'hard'])

export const createEmptyCampusJourneyArchive = (): SaveArchive => ({
  version: CAMPUS_JOURNEY_SAVE_VERSION,
  activeSlotId: null,
  difficultyUnlocked: false,
  slots: [],
})

export const createCampusJourneySaveSlot = (
  difficulty: DifficultyId,
  index: number,
  now = Date.now()
): SaveSlot => {
  const state = createInitialPlayerState()
  state.difficulty = difficulty
  return {
    id: `slot-${index + 1}`,
    difficulty,
    state,
    updatedAt: now,
  }
}

export const normalizeCampusJourneyState = (rawState: Partial<PlayerState> = {}): PlayerState => {
  const base = createInitialPlayerState()
  const state = {
    ...base,
    ...rawState,
  } as PlayerState

  if (!difficultyIds.has(state.difficulty)) {
    state.difficulty = base.difficulty
  }

  state.completedEventIds = Array.isArray(rawState.completedEventIds)
    ? [...rawState.completedEventIds]
    : []
  state.taskCompletionCount = { ...base.taskCompletionCount, ...rawState.taskCompletionCount }
  state.taskResults = Array.isArray(rawState.taskResults) ? [...rawState.taskResults] : []
  state.skillLevels = { ...DEFAULT_SKILL_LEVELS, ...rawState.skillLevels }
  state.task = { ...base.task, ...rawState.task }
  state.exam = { ...base.exam, ...rawState.exam }
  state.minigameStats = { ...DEFAULT_MINIGAME_STATS, ...rawState.minigameStats }
  state.endingRecords = Array.isArray(rawState.endingRecords) ? [...rawState.endingRecords] : []
  state.collection = { ...base.collection, ...rawState.collection }
  if (!Array.isArray(state.collection.ownedSkinIds)) {
    state.collection.ownedSkinIds = [...base.collection.ownedSkinIds]
  }
  state.ending = { ...base.ending, ...rawState.ending }
  state.meta = {
    ...base.meta,
    ...rawState.meta,
    version: CAMPUS_JOURNEY_SAVE_VERSION,
  }
  if (state.meta.collectionShopUnlocked) {
    state.completedEventIds = Array.from(
      new Set([...state.completedEventIds, 'collection-shop-unlock'])
    )
  }

  return state
}

export const normalizeCampusJourneyArchive = (
  rawArchive: Partial<SaveArchive> | null | undefined
): SaveArchive => {
  const base = createEmptyCampusJourneyArchive()
  if (!rawArchive) return base

  const slots = Array.isArray(rawArchive.slots)
    ? rawArchive.slots.slice(0, CAMPUS_JOURNEY_MAX_SAVE_SLOTS).map((slot, index) => {
        const normalizedState = normalizeCampusJourneyState(slot.state)
        const rawStateDifficulty = slot.state?.difficulty
        const difficulty = difficultyIds.has(rawStateDifficulty)
          ? rawStateDifficulty
          : difficultyIds.has(slot.difficulty)
            ? slot.difficulty
            : normalizedState.difficulty
        normalizedState.difficulty = difficulty
        return {
          id: slot.id || `slot-${index + 1}`,
          difficulty,
          state: normalizedState,
          updatedAt: Number.isFinite(slot.updatedAt) ? slot.updatedAt : Date.now(),
        }
      })
    : []
  const activeSlotId = slots.some((slot) => slot.id === rawArchive.activeSlotId)
    ? (rawArchive.activeSlotId ?? null)
    : (slots[0]?.id ?? null)
  const difficultyUnlocked =
    Boolean(rawArchive.difficultyUnlocked) || slots.some((slot) => slot.state.meta.mainCleared)

  return {
    version: CAMPUS_JOURNEY_SAVE_VERSION,
    activeSlotId,
    difficultyUnlocked,
    slots,
  }
}

export const loadCampusJourneyArchive = async () => {
  const archive = await gameStorage.loadGameState<SaveArchive>(CAMPUS_JOURNEY_GAME_ID)
  return normalizeCampusJourneyArchive(archive)
}

export const saveCampusJourneyArchive = async (archive: SaveArchive) => {
  return gameStorage.saveGameState(CAMPUS_JOURNEY_GAME_ID, archive)
}

export const cloneCampusJourneyState = (state: PlayerState): PlayerState =>
  JSON.parse(JSON.stringify(state)) as PlayerState

export const clearCampusJourneySave = async () => {
  return gameStorage.clearGameState(CAMPUS_JOURNEY_GAME_ID)
}
