import { computed, reactive, readonly, ref } from 'vue'

import { eventMap } from './events'
import { minigameDefinitions } from './minigames'
import {
  applyRewards,
  applyEvent,
  applyMiniGameReward,
  buySkin,
  clearRuntimeTask,
  createInitialPlayerState,
  equipSkin,
  registerTaskCompletion,
  setFailurePenalty,
  unlockSkin,
} from './reducers'
import {
  CAMPUS_JOURNEY_MAX_SAVE_SLOTS,
  cloneCampusJourneyState,
  createCampusJourneySaveSlot,
  createEmptyCampusJourneyArchive,
  loadCampusJourneyArchive,
  saveCampusJourneyArchive,
} from './save'
import { skillDefinitions } from './skills'
import { skinDefinitions } from './skins'
import { taskDefinitions } from './tasks'
import { SPRINT_CHARGE_MAX, TASK_TICK_MS } from './constants'
import {
  areRequirementsMet,
  calculateClickReductionSec,
  calculateExamPassRate,
  canBuySkin,
  getAvailableMinigames,
  getAvailableTasks,
  getPhaseTasks,
  getPendingAutoEvents,
  getDifficultyParams,
  getEndingDescription,
  getMainClearEventId,
  getSkinPrice,
  getSkinUnlocks,
  getSkillCost,
  getTaskSuccessRate,
  getUnmetRequirements,
  isBusinessReady,
  canEnterAdultExam,
  shouldAdultGraduateHigh,
  shouldAdultGraduateNormal,
  shouldAdvanceToExam,
  shouldForceAdvanceToExam,
  shouldCollegeGraduateExcellent,
  shouldCollegeGraduateNormal,
  shouldMainClear,
  taskMap,
  resolveTaskRewards,
} from './progression'
import type {
  EventId,
  EventPresentation,
  DifficultyId,
  MiniGameId,
  MiniGameRewardResult,
  PlayerState,
  SaveArchive,
  SkillId,
  TaskSettlement,
} from './types'

const state = reactive<PlayerState>(createInitialPlayerState())
const archive = ref<SaveArchive>(createEmptyCampusJourneyArchive())
const loaded = ref(false)
const pendingEvent = ref<EventPresentation | null>(null)
const activeMiniGameId = ref<MiniGameId | null>(null)
const lastSettlement = ref<TaskSettlement | null>(null)
const lastSprintTip = ref<{ active: boolean; durationSec: number } | null>(null)
const lastQueueTip = ref<{
  title: string
  description: string
  chips: string[]
  icon: 'success' | 'fail' | 'info' | 'warning'
} | null>(null)
const now = ref(Date.now())

let loopTimer: number | null = null
let saveTimer: number | null = null
let lastClickAt: number | null = null
const eventQueue: EventId[] = []
let deferredBusinessQualificationAfterAdultExam = false
const repeatableEventIds = new Set<EventId>([
  'adult-exam-eligible',
  'adult-exam-start-mainline',
  'adult-exam-start-postgame',
  'adult-exam-pass-mainline',
  'adult-exam-pass-postgame',
  'adult-exam-fail-mainline',
  'adult-exam-fail-postgame',
])
const mainClearEventIds = new Set<EventId>([
  'wealth-clear-basic-work',
  'wealth-clear-work-study',
  'wealth-clear-college-work',
  'wealth-clear-adult-high-work',
  'wealth-clear-adult-normal-work',
  'wealth-clear-business',
])
const postgameReplayAutoEventIds = new Set<EventId>([
  'college-midterm',
  'work-promotion',
  'adult-exam-start-postgame',
  'adult-exam-pass-postgame',
  'adult-exam-fail-postgame',
])
const resetRuntimeUi = () => {
  pendingEvent.value = null
  activeMiniGameId.value = null
  lastSettlement.value = null
  lastQueueTip.value = null
  eventQueue.splice(0, eventQueue.length)
  lastClickAt = null
  deferredBusinessQualificationAfterAdultExam = false
}

const applySlotState = (slotState: PlayerState) => {
  Object.assign(state, createInitialPlayerState(), slotState)
  if (!Array.isArray(state.taskResults)) {
    state.taskResults = []
  }
  if (!Array.isArray(state.endingRecords)) {
    state.endingRecords = []
  }
  if (!Array.isArray(state.task.queuedTaskIds)) {
    state.task.queuedTaskIds = []
  }
  state.exam = { ...createInitialPlayerState().exam, ...state.exam }
  state.ending = { ...createInitialPlayerState().ending, ...state.ending }
  state.minigameStats = { ...createInitialPlayerState().minigameStats, ...state.minigameStats }
  pruneTaskQueue()
  startNextQueuedTask()
}

const syncActiveSlot = () => {
  const activeSlot = archive.value.slots.find((slot) => slot.id === archive.value.activeSlotId)
  if (!activeSlot) return
  activeSlot.state = cloneCampusJourneyState(state)
  activeSlot.difficulty = state.difficulty
  activeSlot.updatedAt = Date.now()
  if (state.meta.mainCleared) {
    archive.value.difficultyUnlocked = true
  }
}

const saveArchive = async () => {
  syncActiveSlot()
  return saveCampusJourneyArchive(archive.value)
}

const scheduleSave = () => {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    void saveArchive()
  }, 120)
}

const syncDerived = () => {
  const autoUnlockedSkins = getSkinUnlocks(state)
  autoUnlockedSkins.forEach((skin) => unlockSkin(state, skin.id))
  state.meta.collectionCompleted = skinDefinitions.every((skin) =>
    state.collection.ownedSkinIds.includes(skin.id)
  )
}

const resetActiveTaskRuntime = () => {
  state.task.currentTaskId = null
  state.task.startedAt = null
  state.task.endsAt = null
  state.task.sprintCharge = 0
  state.task.sprintActiveUntil = null
  state.task.clickChain = 0
  lastClickAt = null
}

const pruneTaskQueue = () => {
  const availableTaskIds = new Set(getAvailableTasks(state).map((task) => task.id))
  state.task.queuedTaskIds = state.task.queuedTaskIds.filter((taskId) =>
    availableTaskIds.has(taskId)
  )
  if (state.task.currentTaskId && state.task.queuedTaskIds[0] !== state.task.currentTaskId) {
    resetActiveTaskRuntime()
  }
}

const activateQueuedTask = (taskId: string) => {
  const task = taskMap[taskId]
  if (!task) return
  state.task.currentTaskId = taskId
  state.task.startedAt = Date.now()
  state.task.endsAt = Date.now() + task.durationSec * 1000
  state.task.sprintCharge = 0
  state.task.sprintActiveUntil = null
  state.task.clickChain = 0
  lastClickAt = null
}

const startNextQueuedTask = () => {
  if (state.task.currentTaskId) return
  if (state.task.penaltyEndsAt && state.task.penaltyEndsAt > now.value) return
  pruneTaskQueue()
  const nextTaskId = state.task.queuedTaskIds[0]
  if (!nextTaskId) return
  activateQueuedTask(nextTaskId)
}

const dequeueCurrentTask = (taskId: string) => {
  const taskIndex = state.task.queuedTaskIds.findIndex((queuedTaskId) => queuedTaskId === taskId)
  if (taskIndex >= 0) {
    state.task.queuedTaskIds.splice(taskIndex, 1)
  }
}

const queueEvent = (eventId: EventId) => {
  if (!repeatableEventIds.has(eventId) && state.completedEventIds.includes(eventId)) return
  if (pendingEvent.value?.id === eventId) return
  if (eventQueue.includes(eventId)) return
  eventQueue.push(eventId)
  processEventQueue()
}

const processEventQueue = () => {
  if (pendingEvent.value || eventQueue.length === 0) return
  const nextId = eventQueue.shift()
  if (!nextId) return
  const event = eventMap[nextId]
  if (
    !event ||
    (!repeatableEventIds.has(event.id) && state.completedEventIds.includes(event.id)) ||
    !areRequirementsMet(state, event.unlockRequirements)
  ) {
    processEventQueue()
    return
  }
  pendingEvent.value = {
    id: event.id,
    title: event.title,
    description: mainClearEventIds.has(event.id) ? getEndingDescription(state) : event.description,
    image: event.image,
    actions:
      event.id === 'adult-exam-eligible'
        ? [
            { id: 'adult-exam-continue-work', label: '继续打工', primary: false },
            { id: 'adult-exam-enter', label: '去成考', primary: true },
          ]
        : undefined,
  }
}

const checkProgression = () => {
  syncDerived()

  if (shouldMainClear(state)) {
    queueEvent(getMainClearEventId(state))
    scheduleSave()
    return
  }

  if (state.meta.mainCleared) {
    if (
      !state.meta.collectionShopUnlocked &&
      !state.completedEventIds.includes('collection-shop-unlock')
    ) {
      queueEvent('collection-shop-unlock')
    }
    getPendingAutoEvents(state).forEach((event) => {
      if (postgameReplayAutoEventIds.has(event.id)) {
        queueEvent(event.id)
      }
    })
    if (shouldCollegeGraduateExcellent(state)) {
      queueEvent('college-graduate-excellent')
    } else if (shouldCollegeGraduateNormal(state)) {
      queueEvent('college-graduate-normal')
    }
    scheduleSave()
    return
  }

  if (shouldAdvanceToExam(state) && !state.completedEventIds.includes('entrance-exam-ready')) {
    clearRuntimeTask(state)
    if (shouldForceAdvanceToExam(state)) {
      state.entranceExamForced = true
      queueEvent('entrance-exam-forced')
    } else {
      queueEvent('entrance-exam-ready')
    }
  }

  const autoEvents = getPendingAutoEvents(state)
  autoEvents.forEach((event) => {
    if (event.id === 'entrance-exam-ready') return
    if (event.id === 'entrance-exam-forced') return
    if (mainClearEventIds.has(event.id)) return
    if (
      event.id === 'adult-exam-eligible' &&
      state.phase === 'work-basic' &&
      deferredBusinessQualificationAfterAdultExam
    ) {
      return
    }
    if (event.id === 'business-unlock' && !isBusinessReady(state)) return
    queueEvent(event.id)
  })

  if (shouldCollegeGraduateExcellent(state)) {
    queueEvent('college-graduate-excellent')
  } else if (shouldCollegeGraduateNormal(state)) {
    queueEvent('college-graduate-normal')
  }

  if (canEnterAdultExam(state)) {
    queueEvent('adult-exam-eligible')
  }

  if (shouldAdultGraduateHigh(state)) {
    queueEvent('adult-college-graduate-high')
  } else if (shouldAdultGraduateNormal(state)) {
    queueEvent('adult-college-graduate-normal')
  }

  scheduleSave()
}

const settleCurrentTask = () => {
  const taskId = state.task.currentTaskId
  if (!taskId) return
  const task = taskMap[taskId]
  if (!task) return

  const successRate = getTaskSuccessRate(state, task)
  const success = Math.random() <= successRate
  const baseRewards = success ? task.successRewards : task.failRewards
  const rewards = resolveTaskRewards(state, task, baseRewards)

  applyRewards(state, rewards)
  state.careerMinutes += task.durationMinutes
  state.phaseElapsedMinutes += task.durationMinutes

  const settlement: TaskSettlement = {
    taskId: task.id,
    taskName: task.name,
    success,
    successRate,
    rewards,
    failPenaltySec: success
      ? 0
      : Math.round(
          task.failPenaltySec *
            getDifficultyParams(state).failPenaltyMultiplier *
            (state.phase === 'work-study' ? 1.15 : 1)
        ),
    completedAt: Date.now(),
  }

  registerTaskCompletion(state, settlement)
  dequeueCurrentTask(task.id)
  lastSettlement.value = settlement
  if (success) {
    resetActiveTaskRuntime()
  } else {
    setFailurePenalty(state, settlement.failPenaltySec)
  }
  checkProgression()
  startNextQueuedTask()
}

const tick = () => {
  now.value = Date.now()
  const currentTaskId = state.task.currentTaskId
  if (!currentTaskId || !state.task.endsAt) {
    if (state.task.penaltyEndsAt && now.value >= state.task.penaltyEndsAt) {
      state.task.penaltyEndsAt = null
      startNextQueuedTask()
      scheduleSave()
    }
    return
  }

  if (state.task.sprintActiveUntil && state.task.sprintActiveUntil <= now.value) {
    state.task.sprintActiveUntil = null
  }

  if (state.task.sprintActiveUntil && state.task.sprintActiveUntil > now.value) {
    const task = taskMap[currentTaskId]
    if (task) {
      const extraMs = TASK_TICK_MS * (task.sprintProgressMultiplier - 1)
      state.task.endsAt -= extraMs
    }
  }

  if (now.value >= state.task.endsAt) {
    settleCurrentTask()
  }
}

const ensureLoop = () => {
  if (loopTimer !== null) return
  loopTimer = window.setInterval(tick, TASK_TICK_MS)
}

const stopLoop = () => {
  if (loopTimer === null) return
  window.clearInterval(loopTimer)
  loopTimer = null
}

const load = async () => {
  archive.value = await loadCampusJourneyArchive()
  if (archive.value.slots.length === 0 && !archive.value.difficultyUnlocked) {
    const firstSlot = createCampusJourneySaveSlot('easy', 0)
    archive.value.slots.push(firstSlot)
    archive.value.activeSlotId = firstSlot.id
    await saveCampusJourneyArchive(archive.value)
  }
  if (archive.value.slots.length === 0) {
    archive.value.activeSlotId = null
    Object.assign(state, createInitialPlayerState())
    loaded.value = true
    resetRuntimeUi()
    syncDerived()
    return
  }
  const activeSlot =
    archive.value.slots.find((slot) => slot.id === archive.value.activeSlotId) ??
    archive.value.slots[0]
  archive.value.activeSlotId = activeSlot.id
  applySlotState(activeSlot.state)
  loaded.value = true
  resetRuntimeUi()
  syncDerived()
  if (!state.completedEventIds.includes('intro-start')) {
    queueEvent('intro-start')
  } else {
    checkProgression()
  }
}

const startTask = (taskId: string) => {
  const task = taskMap[taskId]
  if (!task) return
  if (state.task.penaltyEndsAt && state.task.penaltyEndsAt > now.value) return
  if (!getAvailableTasks(state).some((entry) => entry.id === taskId)) return
  state.task.queuedTaskIds.push(taskId)
  lastQueueTip.value = {
    title: '已加入待办',
    description: `「${task.name}」已经排入今日日程。`,
    chips: [`游戏时间 ${task.durationMinutes} 分钟`, `当前待办 ${state.task.queuedTaskIds.length} 项`],
    icon: 'success',
  }
  startNextQueuedTask()
  scheduleSave()
}

const moveQueuedTask = (queueIndex: number, direction: -1 | 1) => {
  if (queueIndex < 0 || queueIndex >= state.task.queuedTaskIds.length) return
  const lockedCurrentTask = state.task.currentTaskId ? 1 : 0
  const targetIndex = queueIndex + direction
  if (targetIndex < lockedCurrentTask || targetIndex >= state.task.queuedTaskIds.length) return
  const [taskToMove] = state.task.queuedTaskIds.splice(queueIndex, 1)
  state.task.queuedTaskIds.splice(targetIndex, 0, taskToMove)
  scheduleSave()
}

const removeQueuedTask = (queueIndex: number) => {
  if (queueIndex < 0 || queueIndex >= state.task.queuedTaskIds.length) return
  if (state.task.currentTaskId && queueIndex === 0) return
  state.task.queuedTaskIds.splice(queueIndex, 1)
  scheduleSave()
}

const clearQueuedTasks = () => {
  if (state.task.currentTaskId) {
    state.task.queuedTaskIds = [state.task.currentTaskId]
  } else {
    state.task.queuedTaskIds = []
  }
  scheduleSave()
}

const clickTask = () => {
  if (!state.task.currentTaskId || !state.task.endsAt) return
  const task = taskMap[state.task.currentTaskId]
  if (!task) return
  const reductionSec = calculateClickReductionSec(
    state.skillLevels.action,
    state.task.clickChain,
    lastClickAt
  )
  state.task.endsAt -= reductionSec * 1000
  state.task.clickChain += 1
  state.task.sprintCharge = Math.min(
    SPRINT_CHARGE_MAX,
    state.task.sprintCharge + task.sprintChargePerClick
  )
  lastClickAt = Date.now()
  if (Date.now() >= state.task.endsAt) {
    settleCurrentTask()
    return
  }
  scheduleSave()
}

const activateSprint = () => {
  const currentTaskId = state.task.currentTaskId
  if (!currentTaskId) return
  const task = taskMap[currentTaskId]
  if (!task) return
  if (state.task.sprintCharge < SPRINT_CHARGE_MAX) return
  state.task.sprintCharge = 0
  state.task.sprintActiveUntil = Date.now() + task.sprintDurationSec * 1000
  lastSprintTip.value = { active: true, durationSec: task.sprintDurationSec }
  scheduleSave()
}

const resetSprintTip = () => {
  lastSprintTip.value = null
}

const resetQueueTip = () => {
  lastQueueTip.value = null
}

const settlePendingEvent = (actionId = 'close') => {
  const current = pendingEvent.value
  if (!current) return
  pendingEvent.value = null
  const event = eventMap[current.id]
  if (current.id === 'adult-exam-eligible' && actionId === 'adult-exam-continue-work') {
    deferredBusinessQualificationAfterAdultExam = true
    checkProgression()
    processEventQueue()
    return
  }
  if (current.id === 'adult-exam-eligible' && actionId === 'adult-exam-enter') {
    deferredBusinessQualificationAfterAdultExam = false
  }
  if (event && (repeatableEventIds.has(event.id) || !state.completedEventIds.includes(event.id))) {
    applyEvent(state, event)
    syncDerived()
  }
  checkProgression()
  processEventQueue()
}

const dismissEvent = () => {
  settlePendingEvent()
}

const chooseEventAction = (actionId: string) => {
  settlePendingEvent(actionId)
}

const upgradeSkill = (skillId: SkillId) => {
  const definition = skillDefinitions.find((entry) => entry.id === skillId)
  if (!definition) return
  const level = state.skillLevels[skillId]
  if (level >= definition.maxLevel) return
  const cost = getSkillCost(skillId, level)
  if (state.knowledge < cost) return
  state.knowledge -= cost
  state.skillLevels[skillId] += 1
  checkProgression()
}

const setMiniGameOpen = (miniGameId: MiniGameId | null) => {
  activeMiniGameId.value = miniGameId
}

const submitMiniGameResult = (miniGameId: MiniGameId, result: MiniGameRewardResult) => {
  if (result.rewards) {
    const multiplier = getDifficultyParams(state).minigameRewardMultiplier
    result = {
      ...result,
      rewards: {
        exp: result.rewards.exp,
        money: result.rewards.money ? Math.round(result.rewards.money * multiplier) : undefined,
        knowledge: result.rewards.knowledge,
        reputation: result.rewards.reputation
          ? Math.round(result.rewards.reputation * multiplier)
          : undefined,
      },
    }
  }
  applyMiniGameReward(state, miniGameId, result)
  activeMiniGameId.value = null
  checkProgression()
}

const takeEntranceExam = () => {
  if (state.phase === 'adult-exam') {
    if (state.exam.adultExamTaken) return
    const passRate = calculateExamPassRate(state)
    state.exam.adultExamTaken = true
    const passed = Math.random() * 100 <= passRate
    state.exam.adultExamPassed = passed
    if (passed && state.exam.adultExamEntryType === 'postgame') {
      queueEvent('adult-exam-pass-postgame')
    } else if (passed) {
      queueEvent('adult-exam-pass-mainline')
    } else if (state.exam.adultExamEntryType === 'postgame') {
      queueEvent('adult-exam-fail-postgame')
    } else {
      queueEvent('adult-exam-fail-mainline')
    }
    scheduleSave()
    return
  }
  if (state.phase !== 'exam' || state.exam.entranceExamTaken) return
  const passRate = calculateExamPassRate(state)
  state.exam.entranceExamTaken = true
  const passed = Math.random() * 100 <= passRate
  state.exam.entranceExamPassed = passed
  if (passed) {
    queueEvent('entrance-exam-pass')
  } else {
    queueEvent('entrance-exam-fail')
  }
  scheduleSave()
}

const enterPostgameWork = () => {
  if (!state.meta.mainCleared || state.phase !== 'postgame') return
  state.route = 'work'
  state.phase = 'work-basic'
  state.phaseElapsedMinutes = 0
  clearRuntimeTask(state)
  scheduleSave()
}

const enterPostgameBusiness = () => {
  if (!state.meta.mainCleared || state.phase !== 'postgame') return
  state.businessReady = true
  state.phase = 'business'
  state.phaseElapsedMinutes = 0
  clearRuntimeTask(state)
  scheduleSave()
}

const enterPostgameAdultExam = () => {
  if (!state.meta.mainCleared || state.phase !== 'postgame') return
  state.exam.adultExamEntryType = 'postgame'
  state.phase = 'adult-exam'
  state.phaseElapsedMinutes = 0
  state.exam.adultExamTaken = false
  state.exam.adultExamPassed = null
  state.exam.adultExamStartPromptShown = false
  clearRuntimeTask(state)
  queueEvent('adult-exam-start-postgame')
  scheduleSave()
}

const returnToPostgame = () => {
  if (!state.meta.mainCleared || state.phase === 'postgame') return
  state.phase = 'postgame'
  state.phaseElapsedMinutes = 0
  clearRuntimeTask(state)
  scheduleSave()
}

const purchaseSkin = (skinId: string) => {
  const skin = skinDefinitions.find((entry) => entry.id === skinId)
  if (!skin || !canBuySkin(state, { ...skin, buyPrice: getSkinPrice(skin) })) return
  if (buySkin(state, skinId)) {
    syncDerived()
    scheduleSave()
  }
}

const resetSettlement = () => {
  lastSettlement.value = null
}

const setEquippedSkin = (skinId: string) => {
  equipSkin(state, skinId)
  scheduleSave()
}

const activateSlotState = async (slotId: string) => {
  const slot = archive.value.slots.find((entry) => entry.id === slotId)
  if (!slot) return
  resetRuntimeUi()
  archive.value.activeSlotId = slot.id
  applySlotState(slot.state)
  syncDerived()
  await saveCampusJourneyArchive(archive.value)
  if (!state.completedEventIds.includes('intro-start')) {
    queueEvent('intro-start')
  } else {
    checkProgression()
  }
}

const createSaveSlot = async (difficulty: DifficultyId = 'medium') => {
  if (archive.value.slots.length >= CAMPUS_JOURNEY_MAX_SAVE_SLOTS) return
  syncActiveSlot()
  const resolvedDifficulty =
    archive.value.slots.length === 0 || !archive.value.difficultyUnlocked ? 'easy' : difficulty
  const slot = createCampusJourneySaveSlot(resolvedDifficulty, archive.value.slots.length)
  archive.value.slots.push(slot)
  await activateSlotState(slot.id)
}

const switchSaveSlot = async (slotId: string) => {
  if (slotId === archive.value.activeSlotId) return
  syncActiveSlot()
  await activateSlotState(slotId)
}

const deleteSaveSlot = async (slotId: string) => {
  const slotIndex = archive.value.slots.findIndex((slot) => slot.id === slotId)
  if (slotIndex < 0) return
  const removingActiveSlot = archive.value.activeSlotId === slotId
  archive.value.slots.splice(slotIndex, 1)
  if (archive.value.slots.length === 0) {
    archive.value.activeSlotId = null
    resetRuntimeUi()
    Object.assign(state, createInitialPlayerState())
    await saveCampusJourneyArchive(archive.value)
    return
  }
  if (removingActiveSlot) {
    await activateSlotState(archive.value.slots[Math.max(0, slotIndex - 1)].id)
    return
  }
  await saveCampusJourneyArchive(archive.value)
}

const currentTask = computed(() =>
  state.task.currentTaskId
    ? (taskDefinitions.find((task) => task.id === state.task.currentTaskId) ?? null)
    : null
)

const queuedTasks = computed(() =>
  state.task.queuedTaskIds
    .map((taskId) => taskDefinitions.find((task) => task.id === taskId) ?? null)
    .filter((task): task is (typeof taskDefinitions)[number] => task !== null)
)

const penaltyRemainingSec = computed(() => {
  if (!state.task.penaltyEndsAt) return 0
  return Math.max(0, (state.task.penaltyEndsAt - now.value) / 1000)
})

const taskRemainingSec = computed(() => {
  if (state.task.endsAt) {
    return Math.max(0, (state.task.endsAt - now.value) / 1000)
  }
  return penaltyRemainingSec.value
})

const examPassRate = computed(() => calculateExamPassRate(state))
const availableTasks = computed(() => getAvailableTasks(state))
const phaseTasks = computed(() => getPhaseTasks(state))
const availableMinigames = computed(() => getAvailableMinigames(state, minigameDefinitions))
const saveSlots = computed(() => archive.value.slots)
const activeSlotId = computed(() => archive.value.activeSlotId)
const difficultyUnlocked = computed(() => archive.value.difficultyUnlocked)
const canCreateSaveSlot = computed(() => archive.value.slots.length < CAMPUS_JOURNEY_MAX_SAVE_SLOTS)

export const useCampusJourneyStore = () => ({
  state: readonly(state),
  loaded: readonly(loaded),
  pendingEvent: readonly(pendingEvent),
  activeMiniGameId: readonly(activeMiniGameId),
  lastSettlement: readonly(lastSettlement),
  lastSprintTip: readonly(lastSprintTip),
  lastQueueTip: readonly(lastQueueTip),
  saveSlots,
  activeSlotId,
  difficultyUnlocked,
  maxSaveSlots: CAMPUS_JOURNEY_MAX_SAVE_SLOTS,
  canCreateSaveSlot,
  currentTask,
  queuedTasks,
  penaltyRemainingSec,
  taskRemainingSec,
  sprintChargeMax: SPRINT_CHARGE_MAX,
  examPassRate,
  availableTasks,
  phaseTasks,
  availableMinigames,
  skinDefinitions,
  skillDefinitions,
  taskDefinitions,
  minigameDefinitions,
  getSkinPrice,
  getSkillCost,
  getTaskSuccessRate: (taskId: string) => {
    const task = taskMap[taskId]
    return task ? getTaskSuccessRate(state, task) : 0
  },
  getTaskPreviewRewards: (taskId: string) => {
    const task = taskMap[taskId]
    return task ? resolveTaskRewards(state, task, task.successRewards) : {}
  },
  getUnmetTaskRequirements: (taskId: string) => {
    const task = taskMap[taskId]
    return task ? getUnmetRequirements(state, task.unlockRequirements) : []
  },
  canBuySkin: (skinId: string) => {
    const skin = skinDefinitions.find((entry) => entry.id === skinId)
    if (!skin) return false
    return canBuySkin(state, { ...skin, buyPrice: getSkinPrice(skin) })
  },
  load,
  ensureLoop,
  stopLoop,
  startTask,
  moveQueuedTask,
  removeQueuedTask,
  clearQueuedTasks,
  clickTask,
  activateSprint,
  dismissEvent,
  chooseEventAction,
  upgradeSkill,
  setMiniGameOpen,
  submitMiniGameResult,
  takeEntranceExam,
  enterPostgameWork,
  enterPostgameBusiness,
  enterPostgameAdultExam,
  returnToPostgame,
  purchaseSkin,
  setEquippedSkin,
  resetSettlement,
  resetSprintTip,
  resetQueueTip,
  createSaveSlot,
  switchSaveSlot,
  deleteSaveSlot,
})
