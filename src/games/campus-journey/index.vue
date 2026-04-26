<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { backgroundAssets, navAssets, subnavAssets, uiAssets } from './assetMap'
import { ADULT_EXAM_RETAKE_MINUTES, LEVEL_EXP_CURVE } from './constants'
import { eventDefinitions } from './events'
import {
  createPhaseProgressCard,
  createProgressMapSteps,
  createStoryGuide,
  getPanelHint,
  phaseLabels,
  routeLabels,
} from './guide'
import EventModal from './components/EventModal.vue'
import MiniGameBizAuction from './components/MiniGameBizAuction.vue'
import MiniGameKnowledgeQuiz from './components/MiniGameKnowledgeQuiz.vue'
import MiniGamePartTimeRush from './components/MiniGamePartTimeRush.vue'
import ProfilePanel from './components/ProfilePanel.vue'
import SkillPanel from './components/SkillPanel.vue'
import SprintPanel from './components/SprintPanel.vue'
import TaskPanel from './components/TaskPanel.vue'
import TipToast from './components/TipToast.vue'
import { getThreshold, getVisibleEvents } from './progression'
import { skinMap } from './skins'
import { useCampusJourneyStore } from './store'
import type {
  CollectionCardState,
  DifficultyId,
  MiniGameId,
  PhaseId,
  PlayerState,
  SkillId,
  TaskDefinition,
} from './types'
import { formatDuration, formatRewardSet } from './utils/format'

const store = useCampusJourneyStore()

type PrimaryPanelId = 'action' | 'progress' | 'skill' | 'role' | 'minigames'
type ActionTabId = 'action-current' | 'action-list' | 'action-todo'
type ProgressTabId = 'progress-map' | 'progress-events' | 'progress-results' | 'progress-saves'

const activePanel = ref<PrimaryPanelId | null>(null)
const activeActionTab = ref<ActionTabId>('action-current')
const activeProgressTab = ref<ProgressTabId>('progress-map')

const difficultyLabels: Record<DifficultyId, string> = {
  easy: '简单',
  medium: '普通',
  hard: '困难',
}

const difficultyOptions = [
  { id: 'easy', label: '简单' },
  { id: 'medium', label: '普通' },
  { id: 'hard', label: '困难' },
] as const satisfies ReadonlyArray<{ id: DifficultyId; label: string }>

const phaseBackgrounds: Record<PhaseId, string> = {
  highschool: backgroundAssets['bg-hs-classroom-day'],
  exam: backgroundAssets['bg-hs-exam-room'],
  college: backgroundAssets['bg-college-campus'],
  'work-basic': backgroundAssets['bg-work-store'],
  'adult-exam': backgroundAssets['bg-hs-exam-room'],
  'work-study': backgroundAssets['bg-college-library'],
  'work-advanced-college': backgroundAssets['bg-work-training-room'],
  'work-advanced-adult-high': backgroundAssets['bg-work-training-room'],
  'work-advanced-adult-normal': backgroundAssets['bg-work-store'],
  business: backgroundAssets['bg-biz-office'],
  postgame: backgroundAssets['bg-biz-milestone-stage'],
}

const currentTaskName = computed(() => store.currentTask.value?.name ?? '未开始任务')
const displayTaskName = computed(() =>
  store.state.task.penaltyEndsAt && store.penaltyRemainingSec.value > 0
    ? '失败恢复中'
    : currentTaskName.value
)
const currentBackground = computed(() => {
  const task = store.currentTask.value
  if (task) return backgroundAssets[task.backgroundId]
  return phaseBackgrounds[store.state.phase]
})

const currentSkinSrc = computed(() => skinMap[store.state.collection.equippedSkinId]?.image ?? '')
const pendingEvent = computed(() => store.pendingEvent.value)
const taskResultTip = computed(() => {
  const settlement = store.lastSettlement.value
  if (!settlement) return null
  return {
    title: settlement.taskName,
    description: settlement.success ? '任务成功完成，奖励已结算。' : '任务失败，已进入恢复时间。',
    chips: [
      `结算率 ${Math.round(settlement.successRate * 100)}%`,
      formatRewardSet(settlement.rewards),
      ...(settlement.success ? [] : [`惩罚 ${settlement.failPenaltySec}s`]),
    ],
    icon: settlement.success ? ('success' as const) : ('fail' as const),
  }
})
const sprintTip = computed(() => {
  const tip = store.lastSprintTip.value
  if (!tip) return null
  return {
    title: '加速已激活',
    description: `任务速度提升 ${tip.durationSec} 秒`,
    icon: 'info' as const,
  }
})
const queueTip = computed(() => store.lastQueueTip.value)
const primaryNavItems = [
  { id: 'action', label: '行动', iconId: 'nav-action-game' },
  { id: 'minigames', label: '游戏', iconId: 'nav-minigames' },
  { id: 'progress', label: '进度', iconId: 'nav-progress-game' },
  { id: 'skill', label: '成长', iconId: 'nav-growth-game' },
  { id: 'role', label: '角色', iconId: 'nav-role-game' },
] as const
const panelTitles: Record<PrimaryPanelId, string> = {
  action: '行动大厅',
  minigames: '游戏',
  progress: '进度档案',
  skill: '成长技能',
  role: '角色图鉴',
}
const currentTask = computed(() => store.currentTask.value)
const queuedTasks = computed(() => store.queuedTasks.value)
type TodoGestureState = {
  pointerId: number
  queueIndex: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  mode: 'pending' | 'swipe'
}
const todoGesture = ref<TodoGestureState | null>(null)
const TODO_GESTURE_THRESHOLD_PX = 10
const TODO_DELETE_THRESHOLD_PX = 88
const currentTaskSuccessRate = computed(() =>
  currentTask.value ? Math.round(store.getTaskSuccessRate(currentTask.value.id) * 100) : 0
)
const isActiveQueuedTask = (index: number) => index === 0 && Boolean(store.state.task.currentTaskId)
const isTodoGestureMode = (index: number, mode: TodoGestureState['mode']) =>
  todoGesture.value?.queueIndex === index && todoGesture.value.mode === mode
const getTodoCardStyle = (index: number) => {
  const gesture = todoGesture.value
  if (!gesture || gesture.queueIndex !== index) return undefined
  if (gesture.mode === 'swipe') {
    const offsetX = Math.max(0, gesture.currentX - gesture.startX)
    return {
      transform: `translateX(${offsetX}px)`,
      opacity: `${Math.max(0.52, 1 - offsetX / 220)}`,
    }
  }
  return undefined
}
const clearTodoGesture = () => {
  todoGesture.value = null
}
const onTodoPointerMove = (event: PointerEvent) => {
  const gesture = todoGesture.value
  if (!gesture || gesture.pointerId !== event.pointerId) return
  gesture.currentX = event.clientX
  gesture.currentY = event.clientY

  if (gesture.mode === 'pending') {
    const deltaX = gesture.currentX - gesture.startX
    const deltaY = gesture.currentY - gesture.startY
    if (
      Math.abs(deltaX) < TODO_GESTURE_THRESHOLD_PX &&
      Math.abs(deltaY) < TODO_GESTURE_THRESHOLD_PX
    ) {
      return
    }

    if (deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      gesture.mode = 'swipe'
      return
    }

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      clearTodoGesture()
    }
  }
}
const onTodoPointerUp = (event: PointerEvent) => {
  const gesture = todoGesture.value
  if (!gesture || gesture.pointerId !== event.pointerId) return
  if (gesture.mode === 'swipe') {
    const offsetX = gesture.currentX - gesture.startX
    if (offsetX >= TODO_DELETE_THRESHOLD_PX) {
      store.removeQueuedTask(gesture.queueIndex)
    }
  }
  clearTodoGesture()
}
const onTodoPointerCancel = (event: PointerEvent) => {
  const gesture = todoGesture.value
  if (!gesture || gesture.pointerId !== event.pointerId) return
  clearTodoGesture()
}
const beginTodoGesture = (index: number, event: PointerEvent) => {
  if (isActiveQueuedTask(index)) return
  todoGesture.value = {
    pointerId: event.pointerId,
    queueIndex: index,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    mode: 'pending',
  }
}
const requirementLabel = (requirement: string) => {
  const [kind, key, rawValue] = requirement.split(':')
  switch (kind) {
    case 'knowledge':
      return `知识达到 ${getThreshold(store.state as PlayerState, Number(key))}`
    case 'money':
      return `金钱达到 ${getThreshold(store.state as PlayerState, Number(key))}`
    case 'reputation':
      return `声望达到 ${getThreshold(store.state as PlayerState, Number(key))}`
    case 'level':
      return `等级达到 ${key}`
    case 'prep':
      return `备考进度达到 ${getThreshold(store.state as PlayerState, Number(key))}`
    case 'collegeScore':
      return `大学评价分达到 ${getThreshold(store.state as PlayerState, Number(key))}`
    case 'adultCredits':
      return `成考学分达到 ${getThreshold(store.state as PlayerState, Number(key))}`
    case 'adultGraduationTier':
      return `成考毕业层级为 ${key}`
    case 'phase':
      return `进入${phaseLabels[key as keyof typeof phaseLabels] ?? key}`
    case 'route':
      return `进入${routeLabels[key as keyof typeof routeLabels] ?? key}`
    case 'event':
      return '完成前置事件'
    case 'mainCleared':
      return key === 'true' ? '主线已通关' : '主线未通关'
    case 'businessReady':
      return key === 'true' ? '已获得经营资格' : '未获得经营资格'
    case 'workPromotion':
      return key === 'true' ? '已完成工作晋升' : '未完成工作晋升'
    case 'graduatedCollege':
      return key === 'true' ? '已完成大学毕业' : '未完成大学毕业'
    case 'adultCollegeGraduated':
      return key === 'true' ? '已完成成考毕业' : '未完成成考毕业'
    case 'task':
      return `完成「${store.taskDefinitions.find((task) => task.id === key)?.name ?? key}」${rawValue} 次`
    default:
      return requirement
  }
}
type TaskListEntry = TaskDefinition & {
  locked: boolean
  unlockConditions: string[]
}
const taskListEntries = computed<TaskListEntry[]>(() =>
  store.phaseTasks.value.map((task) => {
    const unmetRequirements = store.getUnmetTaskRequirements(task.id)
    return {
      ...task,
      locked: unmetRequirements.length > 0,
      unlockConditions: unmetRequirements.map(requirementLabel),
    }
  })
)
const otherTasks = computed(() =>
  taskListEntries.value.filter((task) => task.id !== store.state.task.currentTaskId)
)
const visibleEvents = computed(() => getVisibleEvents(store.state as PlayerState))
const completedEvents = computed(() =>
  eventDefinitions.filter((event) => store.state.completedEventIds.includes(event.id)).reverse()
)
const upgradableSkillCount = computed(
  () =>
    store.skillDefinitions.filter((skill) => {
      const level = store.state.skillLevels[skill.id]
      return level < skill.maxLevel && store.state.knowledge >= store.getSkillCost(skill.id, level)
    }).length
)
const collectionOwnedCount = computed(() => store.state.collection.ownedSkinIds.length)
const levelExpProgress = computed(() => {
  const exp = store.state.exp
  const lvl = store.state.level
  const currentThreshold = LEVEL_EXP_CURVE[lvl - 1] ?? 0
  const nextThreshold = LEVEL_EXP_CURVE[lvl] ?? LEVEL_EXP_CURVE[LEVEL_EXP_CURVE.length - 1]
  const currentExp = exp - currentThreshold
  const neededExp = nextThreshold - currentThreshold
  return { currentExp, neededExp }
})
const levelExpPct = computed(() =>
  levelExpProgress.value.neededExp > 0
    ? Math.round((levelExpProgress.value.currentExp / levelExpProgress.value.neededExp) * 100)
    : 0
)
const saveSlotCards = computed(() =>
  Array.from({ length: store.maxSaveSlots }, (_, index) => {
    const slot = store.saveSlots.value[index] ?? null
    return {
      index,
      slot,
      active: Boolean(slot && slot.id === store.activeSlotId.value),
    }
  })
)

const actionTabs = computed(() => {
  return [
    { id: 'action-current', iconId: 'subnav-current-task', label: '当前' },
    { id: 'action-list', iconId: 'subnav-task-list', label: '任务' },
    { id: 'action-todo', iconId: 'subnav-task-queue', label: '待办' },
  ] as Array<{ id: ActionTabId; iconId: string; label: string }>
})
const progressTabs = [
  { id: 'progress-map', iconId: 'subnav-stage-map', label: '地图' },
  { id: 'progress-events', iconId: 'subnav-history-log', label: '事件' },
  { id: 'progress-results', iconId: 'subnav-revenue', label: '收益' },
  { id: 'progress-saves', iconId: 'subnav-save-slot', label: '存档' },
] as const satisfies ReadonlyArray<{ id: ProgressTabId; iconId: string; label: string }>
const taskMinigames = computed(() => store.availableMinigames.value)
const taskResultHistory = computed(() => store.state.taskResults ?? [])
const formatSettlementTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
const remainingAdultExamRetakeMinutes = computed(() => {
  const failedAt = store.state.adultExamFailedAtMinutes
  if (typeof failedAt !== 'number') return 0
  return Math.max(0, ADULT_EXAM_RETAKE_MINUTES - (store.state.careerMinutes - failedAt))
})
const hasAdultExamFailure = computed(() => typeof store.state.adultExamFailedAtMinutes === 'number')
const adultExamRetakeHint = computed(() => {
  if (!hasAdultExamFailure.value) return ''
  if (remainingAdultExamRetakeMinutes.value <= 0) return '成考重考已可报名'
  return `成考重考还需 ${remainingAdultExamRetakeMinutes.value} 游戏分钟`
})

const storyGuide = computed(() =>
  createStoryGuide({
    state: store.state as PlayerState,
    availableTaskCount: store.availableTasks.value.length,
    totalSkinCount: store.skinDefinitions.length,
    visibleEvents: visibleEvents.value,
    examPassRate: store.examPassRate.value,
    adultExamRetakeHint: adultExamRetakeHint.value,
  })
)

const rolePanelSkins = computed(() =>
  store.skinDefinitions.map((skin) => {
    let state: CollectionCardState = 'locked'
    if (store.state.collection.equippedSkinId === skin.id) state = 'equipped'
    else if (store.state.collection.ownedSkinIds.includes(skin.id)) state = 'owned'
    else if (store.state.meta.collectionShopUnlocked) state = 'buyable'
    return {
      id: skin.id,
      name: skin.name,
      image: skin.image,
      sourceLabel: skin.sourceLabel,
      state,
      price: store.getSkinPrice(skin),
      canBuy: store.canBuySkin(skin.id),
    }
  })
)

const shopCards = computed(() => rolePanelSkins.value.filter((skin) => skin.state === 'buyable'))
const phaseProgressCard = computed(() =>
  createPhaseProgressCard({
    state: store.state as PlayerState,
    storyGuide: storyGuide.value,
    availableTaskCount: store.availableTasks.value.length,
    totalSkinCount: store.skinDefinitions.length,
    shopCardCount: shopCards.value.length,
    examPassRate: store.examPassRate.value,
    adultExamRetakeHint: adultExamRetakeHint.value,
  })
)

const formatSaveUpdatedAt = (updatedAt: number) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt))

const progressMapSteps = computed(() => createProgressMapSteps(store.state as PlayerState))

const getResultBadge = (success: boolean) =>
  uiAssets[success ? 'ui-result-success-badge' : 'ui-result-fail-badge']

const panelHint = (panelId: PrimaryPanelId) =>
  getPanelHint({
    panelId,
    state: store.state as PlayerState,
    pendingEventId: pendingEvent.value?.id ?? null,
    nextGoalTitle: storyGuide.value.nextGoalTitle,
    availableTaskCount: store.availableTasks.value.length,
    upgradableSkillCount: upgradableSkillCount.value,
    ownedSkinCount: collectionOwnedCount.value,
    totalSkinCount: store.skinDefinitions.length,
  })

const miniGameBackground = (miniGameId: MiniGameId) => {
  const definition = store.minigameDefinitions.find((item) => item.id === miniGameId)
  return definition ? backgroundAssets[definition.backgroundId] : ''
}

const miniGameIcon = (miniGameId: MiniGameId) => {
  const definition = store.minigameDefinitions.find((item) => item.id === miniGameId)
  return definition ? uiAssets[definition.iconId] : ''
}

const miniGameRewardFocus = (miniGameId: MiniGameId) => {
  switch (miniGameId) {
    case 'knowledge-quiz':
      return '经验 + 知识'
    case 'part-time-rush':
      return '经验 + 金钱'
    case 'biz-auction':
      return '金钱 + 声望'
    default:
      return '通用收益'
  }
}

const miniGameStatSummary = (miniGameId: MiniGameId) => {
  const stats = store.state.minigameStats[miniGameId]
  if (!stats) return ['常驻玩法']
  return [`最佳分 ${stats.bestScore}`, `已玩 ${stats.playCount} 次`, miniGameRewardFocus(miniGameId)]
}

const openMiniGame = (miniGameId: MiniGameId) => {
  activePanel.value = null
  store.setMiniGameOpen(miniGameId)
}

const openPanel = (panelId: PrimaryPanelId) => {
  activePanel.value = activePanel.value === panelId ? null : panelId
  if (activePanel.value === 'action') activeActionTab.value = 'action-current'
  if (activePanel.value === 'progress') activeProgressTab.value = 'progress-map'
}

const closePanel = () => {
  activePanel.value = null
}

const isCharging = ref(false)
const chargeStartValue = ref(0)
const chargeInterval = ref<number | null>(null)

const sprintPct = computed(() =>
  store.sprintChargeMax > 0 ? store.state.task.sprintCharge / store.sprintChargeMax : 0
)
const sprintReady = computed(() => store.state.task.sprintCharge >= store.sprintChargeMax)
const CIRCUMFERENCE = 2 * Math.PI * 20
const chargeDashOffset = computed(() => CIRCUMFERENCE * (1 - sprintPct.value))

const onChargeStart = () => {
  if (!store.state.task.currentTaskId || store.state.task.sprintCharge >= store.sprintChargeMax)
    return
  isCharging.value = true
  chargeStartValue.value = store.state.task.sprintCharge
  chargeInterval.value = window.setInterval(() => {
    store.clickTask()
  }, 100)
}

const onChargeEnd = () => {
  if (!isCharging.value) return
  isCharging.value = false
  if (chargeInterval.value) {
    clearInterval(chargeInterval.value)
    chargeInterval.value = null
  }
  if (store.state.task.sprintCharge >= store.sprintChargeMax) {
    store.activateSprint()
  }
}

const switchSaveSlotFromPanel = async (slotId: string) => {
  closePanel()
  await new Promise((resolve) => window.requestAnimationFrame(resolve))
  await store.switchSaveSlot(slotId)
}

const createSaveSlotFromPanel = async (difficulty: DifficultyId) => {
  closePanel()
  await new Promise((resolve) => window.requestAnimationFrame(resolve))
  await store.createSaveSlot(difficulty)
}

onMounted(async () => {
  await store.load()
  store.ensureLoop()
  window.addEventListener('pointermove', onTodoPointerMove)
  window.addEventListener('pointerup', onTodoPointerUp)
  window.addEventListener('pointercancel', onTodoPointerCancel)
})

onBeforeUnmount(() => {
  clearTodoGesture()
  store.stopLoop()
  window.removeEventListener('pointermove', onTodoPointerMove)
  window.removeEventListener('pointerup', onTodoPointerUp)
  window.removeEventListener('pointercancel', onTodoPointerCancel)
})
</script>

<template>
  <div v-if="store.loaded.value" class="campus-journey-page">
    <div class="page-bg" :style="{ backgroundImage: `url(${currentBackground})` }"></div>
    <div class="page-overlay"></div>
    <div class="page-character-shell" aria-hidden="true">
      <div class="page-character-glow"></div>
      <img v-if="currentSkinSrc" class="page-character" :src="currentSkinSrc" alt="" />
    </div>
    <div class="app-shell">
      <div class="phone-frame">
        <header class="top-bar">
          <div class="top-copy">
            <h1>{{ phaseLabels[store.state.phase] }}</h1>
            <div class="top-meta" aria-label="当前状态">
              <div class="meta-line">
                <img :src="uiAssets['icon-current-route']" alt="" />
                <strong>{{ routeLabels[store.state.route] }}</strong>
              </div>
            </div>
          </div>
        </header>

        <nav class="action-hub" aria-label="核心操作">
          <button
            v-for="item in primaryNavItems"
            :key="item.id"
            class="hub-nav-btn"
            :class="{
              active: activePanel === item.id,
              'is-highlighted': item.id === 'action' && !store.state.task.currentTaskId,
            }"
            :aria-label="`${item.label}：${panelHint(item.id)}`"
            :title="item.label"
            @click="openPanel(item.id)"
          >
            <img :src="navAssets[item.iconId]" alt="" />
            <span class="hub-nav-label">{{ item.label }}</span>
          </button>
        </nav>

        <div class="shell-main">
          <section class="control-column full-width">
            <div class="action-dock">
              <SprintPanel
                :has-task="Boolean(store.state.task.currentTaskId)"
                :current-task-name="displayTaskName"
                :remaining-sec="store.taskRemainingSec.value"
              />
            </div>
          </section>
        </div>

        <div
          class="bottom-bar"
          :class="{ charging: isCharging, charged: sprintReady }"
          @touchstart.prevent="onChargeStart"
          @touchend.prevent="onChargeEnd"
          @touchcancel.prevent="onChargeEnd"
          @mousedown.prevent="onChargeStart"
          @mouseup.prevent="onChargeEnd"
          @mouseleave.prevent="onChargeEnd"
        >
          <div class="charge-ring" :class="{ active: isCharging, ready: sprintReady }">
            <svg viewBox="0 0 48 48">
              <circle class="charge-bg" cx="24" cy="24" r="20" />
              <circle
                class="charge-fill"
                cx="24"
                cy="24"
                r="20"
                :stroke-dashoffset="chargeDashOffset"
              />
            </svg>
            <span class="charge-pct">{{ Math.round(sprintPct * 100) }}%</span>
          </div>
          <div class="bottom-bar-info">
            <span class="bottom-task">{{ displayTaskName }}</span>
            <span class="bottom-status" v-if="store.state.task.currentTaskId">
              {{ sprintReady ? '长按释放加速' : '长按蓄能 · 满充加速' }}
            </span>
            <span class="bottom-status" v-else>无进行中任务</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="activePanel" class="panel-modal-shell" @click.self="closePanel">
        <section class="panel-modal">
          <header class="panel-modal-head">
            <div class="panel-title-plaque">
              <span>{{ panelTitles[activePanel] }}</span>
            </div>
            <div class="panel-head-actions">
              <div v-if="activePanel === 'action'" class="panel-tabbar" aria-label="行动页签">
                <button
                  v-for="tab in actionTabs"
                  :key="tab.id"
                  class="panel-tab-btn"
                  :class="{ active: activeActionTab === tab.id }"
                  :title="tab.label"
                  :aria-label="tab.label"
                  @click="activeActionTab = tab.id"
                >
                  <img :src="subnavAssets[tab.iconId]" alt="" />
                  <span>{{ tab.label }}</span>
                </button>
              </div>
              <div
                v-else-if="activePanel === 'progress'"
                class="panel-tabbar"
                aria-label="进度页签"
              >
                <button
                  v-for="tab in progressTabs"
                  :key="tab.id"
                  class="panel-tab-btn"
                  :class="{ active: activeProgressTab === tab.id }"
                  :title="tab.label"
                  :aria-label="tab.label"
                  @click="activeProgressTab = tab.id"
                >
                  <img :src="subnavAssets[tab.iconId]" alt="" />
                  <span>{{ tab.label }}</span>
                </button>
              </div>
              <div v-else-if="activePanel === 'skill'" class="profile-head-info">
                <span class="chip">技能 {{ upgradableSkillCount }}/{{ store.skillDefinitions.length }}</span>
                <span class="chip">知识 {{ store.state.knowledge }}</span>
              </div>
              <div v-else-if="activePanel === 'minigames'" class="profile-head-info">
                <span class="chip">游戏 {{ taskMinigames.length }}</span>
              </div>
              <div v-else-if="activePanel === 'role'" class="profile-head-info level-info">
                <div class="level-line">
                  <span class="level-lv">Lv.{{ store.state.level }}</span>
                  <span class="level-frac">{{ levelExpProgress.currentExp }}/{{ levelExpProgress.neededExp }}</span>
                </div>
                <div class="level-bar"><div class="level-fill" :style="{ width: levelExpPct + '%' }"></div></div>
              </div>
              <div v-else class="head-spacer"></div>
              <button class="close-btn" @click="closePanel">
                <span class="close-btn-icon" aria-hidden="true"></span>
              </button>
            </div>
          </header>

          <div class="panel-modal-body">
            <div v-if="activePanel === 'action'" class="panel-workspace panel-workspace--tasks">
              <div v-if="activeActionTab === 'action-current'" class="story-grid story-grid-middle">
                <article class="status-card compact story-card">
                  <p class="story-card-label">人生阶段</p>
                  <strong>{{ phaseProgressCard.title }}</strong>
                  <p>{{ phaseProgressCard.description }}</p>
                  <div class="story-chip-list chip-tri">
                    <span
                      v-for="metric in phaseProgressCard.metrics"
                      :key="metric"
                      class="story-chip"
                    >
                      {{ metric }}
                    </span>
                  </div>
                </article>

                <article class="status-card compact story-card">
                  <p class="story-card-label">当前行动</p>
                  <strong>{{ currentTask?.name ?? '尚未开始行动' }}</strong>
                  <p>
                    {{
                      currentTask
                        ? `${currentTask.description} · 预计成功率 ${currentTaskSuccessRate}%`
                        : '先从行动列表里选择一个，开始当前主循环。'
                    }}
                  </p>
                  <div class="story-chip-list chip-tri">
                    <span class="story-chip"
                      >剩余 {{ formatDuration(store.taskRemainingSec.value) }}</span
                    >
                    <span v-if="currentTask" class="story-chip"
                      >游戏时间 {{ currentTask.durationMinutes }}分钟</span
                    >
                    <span class="story-chip"
                      >加速槽 {{ store.state.task.sprintCharge }}/{{ store.sprintChargeMax }}</span
                    >
                  </div>
                </article>

                <article
                  v-if="store.state.phase === 'exam' || store.state.phase === 'adult-exam'"
                  class="exam-card"
                >
                  <div>
                    <strong
                      >关键事件：{{
                        store.state.phase === 'adult-exam' ? '成人高考' : '高考'
                      }}</strong
                    >
                    <p>考试归入事件系统，不再单独拆分页。准备完成后可直接在这里提交。</p>
                    <small>当前通过率 {{ store.examPassRate.value.toFixed(0) }}%</small>
                  </div>
                  <div class="exam-actions">
                    <button
                      :disabled="
                        store.state.phase === 'adult-exam'
                          ? store.state.exam.adultExamTaken
                          : store.state.exam.entranceExamTaken
                      "
                      @click="store.takeEntranceExam"
                    >
                      {{
                        (
                          store.state.phase === 'adult-exam'
                            ? store.state.exam.adultExamTaken
                            : store.state.exam.entranceExamTaken
                        )
                          ? '已参加'
                          : '参加考试'
                      }}
                    </button>
                  </div>
                </article>

                <article
                  v-if="store.state.phase === 'postgame'"
                  class="status-card compact story-card"
                >
                  <p class="story-card-label">自由体验</p>
                  <strong>选择自由体验</strong>
                  <p>可回到基础打工或经营；大学体验需先通过通关后成人高考。</p>
                  <div class="save-slot-actions tri-actions">
                    <button class="nn-action-btn" @click="store.enterPostgameWork">基础打工</button>
                    <button class="nn-action-btn" @click="store.enterPostgameBusiness">经营体验</button>
                    <button class="nn-action-btn" @click="store.enterPostgameAdultExam">成人高考</button>
                  </div>
                </article>

                <article
                  v-else-if="store.state.meta.mainCleared"
                  class="status-card compact story-card"
                >
                  <p class="story-card-label">通关自由模式</p>
                  <strong>当前正在自由体验</strong>
                  <p>本阶段不再重复触发主线通关，可继续刷取资源或返回通关补完页。</p>
                  <div class="save-slot-actions">
                    <button class="nn-action-btn" @click="store.returnToPostgame">返回通关补完</button>
                  </div>
                </article>
              </div>

              <TaskPanel
                v-else-if="activeActionTab === 'action-list'"
                :other-tasks="otherTasks"
                :reward-preview-resolver="store.getTaskPreviewRewards"
                :success-rate-resolver="store.getTaskSuccessRate"
                @queue="store.startTask"
              />

              <div v-else-if="activeActionTab === 'action-todo'" class="task-result-list">
                <article class="stacked-note-card todo-summary-card">
                  <div class="todo-summary-main">
                    <div class="todo-summary-copy">
                      <span class="todo-summary-count">{{ queuedTasks.length }}</span>
                      <div class="todo-summary-text">
                        <strong>{{ queuedTasks.length > 0 ? '已加入待办' : '待办队列为空' }}</strong>
                        <small v-if="queuedTasks.length > 0" class="todo-summary-hint">
                          右划删除
                        </small>
                      </div>
                    </div>
                  </div>
                </article>

                <article
                  v-for="(task, index) in queuedTasks"
                  :key="`${task.id}-${index}`"
                  class="task-item game-card todo-task-card"
                  :class="{
                    'is-active': isActiveQueuedTask(index),
                    'is-swiping': isTodoGestureMode(index, 'swipe'),
                  }"
                  :style="getTodoCardStyle(index)"
                  @pointerdown="beginTodoGesture(index, $event)"
                >
                  <div v-if="!isActiveQueuedTask(index)" class="todo-swipe-delete-hint">右划删除</div>
                  <div class="task-top">
                    <div class="todo-task-copy">
                      <strong>{{ task.name }}</strong>
                      <small>
                        {{
                          index === 0 && store.state.task.currentTaskId
                            ? '本轮正在推进'
                            : `日程第 ${index + 1} 站`
                        }}
                      </small>
                    </div>
                  </div>
                  <p>{{ task.description }}</p>
                </article>

              </div>

              <TaskPanel
                v-else
                :other-tasks="otherTasks"
                :reward-preview-resolver="store.getTaskPreviewRewards"
                :success-rate-resolver="store.getTaskSuccessRate"
                @queue="store.startTask"
              />
            </div>

            <div
              v-else-if="activePanel === 'minigames'"
              class="panel-workspace panel-workspace--minigames"
            >
              <div class="minigame-grid-scroll">
                <button
                  v-for="item in taskMinigames"
                  :key="item.id"
                  class="minigame-card"
                  @click="openMiniGame(item.id)"
                >
                  <div class="minigame-main">
                    <span class="minigame-icon-shell">
                      <img :src="miniGameIcon(item.id)" alt="" />
                    </span>
                    <div class="minigame-copy">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.description }}</span>
                    </div>
                  </div>
                  <div class="story-chip-list minigame-chip-list">
                    <span v-for="chip in miniGameStatSummary(item.id)" :key="chip" class="story-chip">
                      {{ chip }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div
              v-else-if="activePanel === 'progress'"
              class="panel-workspace panel-workspace--story"
            >
              <div v-if="activeProgressTab === 'progress-map'" class="story-grid story-grid-middle">
                <article class="status-card compact story-card">
                  <p class="story-card-label">人生路线图</p>
                  <strong>{{ storyGuide.currentStageTitle }}</strong>
                  <p>{{ storyGuide.currentStageDescription }}</p>
                  <div class="story-chip-list">
                    <span
                      v-for="step in progressMapSteps"
                      :key="step.id"
                      class="story-chip"
                      :class="{ active: step.active, done: step.done }"
                    >
                      {{ step.label }}
                    </span>
                  </div>
                </article>

                <article class="status-card compact story-card">
                  <p class="story-card-label">人生路线</p>
                  <strong>{{ storyGuide.routeTitle }}</strong>
                  <p>{{ storyGuide.routeDescription }}</p>
                  <small>当前路线：{{ routeLabels[store.state.route] }}</small>
                </article>
              </div>

              <div v-else-if="activeProgressTab === 'progress-events'" class="story-history-list">
                <section class="history-summary-region">
                  <article class="status-card compact summary-card">
                    <strong>
                      已激活事件 {{ store.state.completedEventIds.length }} /
                      {{ eventDefinitions.length }}
                    </strong>
                    <p>
                      {{
                        completedEvents.length > 0
                          ? `最近记录「${completedEvents[0].title}」`
                          : '尚未激活事件，继续推进任务后会在这里留下记录。'
                      }}
                    </p>
                    <div class="story-chip-list">
                      <span class="story-chip">已记录 {{ completedEvents.length }}</span>
                      <span class="story-chip">当前阶段·{{ phaseLabels[store.state.phase] }}</span>
                      <span class="story-chip">人生路线·{{ routeLabels[store.state.route] }}</span>
                      <span class="story-chip">事件库 {{ eventDefinitions.length }}</span>
                    </div>
                  </article>
                </section>

                <section class="event-list history-event-region">
                  <article v-for="event in completedEvents" :key="event.id" class="event-item">
                    <img v-if="event.image" :src="event.image" alt="" />
                    <div class="event-copy">
                      <p class="event-kicker">{{ phaseLabels[event.phase] }}</p>
                      <strong>{{ event.title }}</strong>
                      <p>{{ event.description }}</p>
                    </div>
                  </article>

                  <article
                    v-if="completedEvents.length === 0"
                    class="status-card compact summary-card"
                  >
                    <strong>暂无历史记录</strong>
                    <p>完成事件后会按时间倒序显示在这里。</p>
                  </article>
                </section>
              </div>

              <div v-else-if="activeProgressTab === 'progress-results'" class="task-result-list">
                <article class="status-card compact summary-card">
                  <strong>收益记录</strong>
                  <p>
                    {{
                      taskResultHistory.length > 0
                        ? `已记录最近 ${taskResultHistory.length} 次任务结算。`
                        : '任务完成后会弹出结算，并在这里保留历史记录。'
                    }}
                  </p>
                </article>

                <article
                  v-for="result in taskResultHistory"
                  :key="`${result.taskId}-${result.completedAt}`"
                  class="settlement-card task-result-card"
                >
                  <img class="badge" :src="getResultBadge(result.success)" alt="" />
                  <div>
                    <strong>{{ result.taskName }}</strong>
                    <p>
                      {{ result.success ? '成功完成' : '任务失败' }} · 结算率
                      {{ Math.round(result.successRate * 100) }}% ·
                      {{ formatSettlementTime(result.completedAt) }}
                    </p>
                    <small>{{ formatRewardSet(result.rewards) }}</small>
                    <small v-if="!result.success">失败惩罚 {{ result.failPenaltySec }}s</small>
                  </div>
                </article>

                <article
                  v-if="taskResultHistory.length === 0"
                  class="status-card compact summary-card"
                >
                  <strong>暂无收益记录</strong>
                  <p>完成任意任务后会按时间倒序显示在这里。</p>
                </article>
              </div>

              <div v-else class="save-slot-list">
                <article class="status-card compact summary-card">
                  <strong>存档管理</strong>
                  <p>
                    {{
                      store.difficultyUnlocked.value
                        ? '多难度已开放，新建存档时可选择难度。'
                        : '首个新存档固定为简单，任意存档主线通关后解锁多难度。'
                    }}
                  </p>
                  <div class="story-chip-list">
                    <span class="story-chip"
                      >存档 {{ store.saveSlots.value.length }}/{{ store.maxSaveSlots }}</span
                    >
                    <span class="story-chip"
                      >难度·{{ difficultyLabels[store.state.difficulty] }}</span
                    >
                    <span class="story-chip">{{
                      store.difficultyUnlocked.value ? '多难度已开放' : '通关解锁多难度'
                    }}</span>
                  </div>
                </article>

                <article
                  v-for="card in saveSlotCards"
                  :key="card.slot?.id ?? `empty-${card.index}`"
                  class="save-slot-card"
                  :class="{ active: card.active, empty: !card.slot }"
                >
                  <template v-if="card.slot">
                    <div class="save-slot-main">
                      <p class="story-card-label">存档 {{ card.index + 1 }}</p>
                      <strong>{{ phaseLabels[card.slot.state.phase] }}</strong>
                      <p>
                        {{ routeLabels[card.slot.state.route] }} ·
                        {{ difficultyLabels[card.slot.difficulty] }} · Lv.{{
                          card.slot.state.level
                        }}
                      </p>
                      <div class="story-chip-list">
                        <span class="story-chip">金钱 {{ card.slot.state.money }}</span>
                        <span class="story-chip">声望 {{ card.slot.state.reputation }}</span>
                        <span class="story-chip">{{
                          card.slot.state.meta.mainCleared ? '主线通关' : '主线推进中'
                        }}</span>
                        <span class="story-chip">{{
                          formatSaveUpdatedAt(card.slot.updatedAt)
                        }}</span>
                      </div>
                    </div>
                    <div class="save-slot-actions">
                      <button
                        class="nn-action-btn"
                        :disabled="card.active"
                        @click="switchSaveSlotFromPanel(card.slot.id)"
                      >
                        {{ card.active ? '游玩中' : '切换到此' }}
                      </button>
                      <button
                        class="nn-action-btn danger-btn"
                        @click="store.deleteSaveSlot(card.slot.id)"
                      >
                        删除
                      </button>
                    </div>
                  </template>

                  <template v-else>
                    <div class="save-slot-main">
                      <p class="story-card-label">存档 {{ card.index + 1 }}</p>
                      <strong>新人生</strong>
                      <p>
                        {{
                          store.difficultyUnlocked.value
                            ? '选择难度后开启新人生。'
                            : '创建后自动使用简单难度。'
                        }}
                      </p>
                    </div>
                    <div class="save-slot-actions">
                      <button
                        v-if="!store.difficultyUnlocked.value"
                        class="nn-action-btn"
                        :disabled="!store.canCreateSaveSlot.value"
                        @click="createSaveSlotFromPanel('easy')"
                      >
                        开始新人生
                      </button>
                      <template v-else>
                        <button
                          v-for="option in difficultyOptions"
                          :key="option.id"
                          class="nn-action-btn"
                          :disabled="!store.canCreateSaveSlot.value"
                          @click="createSaveSlotFromPanel(option.id)"
                        >
                          {{ option.label }}
                        </button>
                      </template>
                    </div>
                  </template>
                </article>
              </div>
            </div>

            <div v-else-if="activePanel === 'skill'" class="panel-workspace panel-workspace--story">
              <SkillPanel
                :skills="store.skillDefinitions"
                :skill-levels="store.state.skillLevels"
                :icons="uiAssets"
                @upgrade="(skillId: SkillId) => store.upgradeSkill(skillId)"
              />
            </div>

            <div v-else class="panel-workspace panel-workspace--profile">
              <ProfilePanel
                :exp="store.state.exp"
                :money="store.state.money"
                :knowledge="store.state.knowledge"
                :reputation="store.state.reputation"
                :current-task-name="displayTaskName"
                :owned-skin-count="store.state.collection.ownedSkinIds.length"
                :total-skin-count="store.skinDefinitions.length"
                :equipped-skin-id="store.state.collection.equippedSkinId"
                :skins="rolePanelSkins"
                :icons="uiAssets"
                :unlocked-frame-src="uiAssets['ui-collection-card-frame']"
                :locked-frame-src="uiAssets['ui-collection-locked-mask']"
                :main-cleared="store.state.meta.mainCleared"
                :collection-shop-unlocked="store.state.meta.collectionShopUnlocked"
                @equip="store.setEquippedSkin"
                @buy="store.purchaseSkin"
              />
            </div>
          </div>
        </section>
      </div>
    </Teleport>

    <EventModal
      :open="Boolean(pendingEvent)"
      :title="pendingEvent?.title ?? ''"
      :description="pendingEvent?.description ?? ''"
      :image="pendingEvent?.image"
      :actions="pendingEvent?.actions"
      @close="store.dismissEvent"
      @action="store.chooseEventAction"
    />

    <Teleport to="body">
      <TipToast
        :open="Boolean(taskResultTip)"
        :title="taskResultTip?.title ?? ''"
        :description="taskResultTip?.description ?? ''"
        :chips="taskResultTip?.chips ?? []"
        :icon="taskResultTip?.icon ?? 'info'"
        @close="store.resetSettlement"
      />

      <TipToast
        :open="Boolean(sprintTip)"
        :title="sprintTip?.title ?? ''"
        :description="sprintTip?.description ?? ''"
        :icon="sprintTip?.icon ?? 'info'"
        @close="store.resetSprintTip"
      />

      <TipToast
        :open="Boolean(queueTip)"
        :title="queueTip?.title ?? ''"
        :description="queueTip?.description ?? ''"
        :chips="queueTip?.chips ?? []"
        :icon="queueTip?.icon ?? 'info'"
        @close="store.resetQueueTip"
      />
    </Teleport>

    <MiniGameKnowledgeQuiz
      :open="store.activeMiniGameId.value === 'knowledge-quiz'"
      :background-src="miniGameBackground('knowledge-quiz')"
      @close="store.setMiniGameOpen(null)"
      @complete="store.submitMiniGameResult('knowledge-quiz', $event)"
    />

    <MiniGamePartTimeRush
      :open="store.activeMiniGameId.value === 'part-time-rush'"
      :background-src="miniGameBackground('part-time-rush')"
      @close="store.setMiniGameOpen(null)"
      @complete="store.submitMiniGameResult('part-time-rush', $event)"
    />

    <MiniGameBizAuction
      :open="store.activeMiniGameId.value === 'biz-auction'"
      :background-src="miniGameBackground('biz-auction')"
      @close="store.setMiniGameOpen(null)"
      @complete="store.submitMiniGameResult('biz-auction', $event)"
    />
  </div>
</template>

<style scoped>
.campus-journey-page,
.panel-modal {
  --cj-pink-100: #fff6fa;
  --cj-pink-200: #fde6ef;
  --cj-pink-300: #f7bfd3;
  --cj-pink-400: #f48fb1;
  --cj-pink-500: #e96c98;
  --cj-pink-600: #c95580;
  --cj-text-title: #8b4b67;
  --cj-text-body: #6f4a59;
  --cj-text-label: #a46583;
  --cj-card-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(253, 237, 243, 0.9));
  --cj-card-border: 2px solid rgba(247, 191, 211, 0.88);
  --cj-card-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 12px 30px rgba(177, 102, 134, 0.14);
  --cj-card-selected-bg:
    radial-gradient(circle at top right, rgba(244, 143, 177, 0.16), transparent 34%),
    var(--cj-card-bg);
}
.campus-journey-page {
  position: relative;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}
.page-bg {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transform: scale(1.06);
  transform-origin: center;
  z-index: 0;
}
.page-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(252, 228, 236, 0.22), transparent 30%),
    radial-gradient(circle at bottom right, rgba(248, 187, 208, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(255, 248, 250, 0.08), rgba(255, 248, 250, 0.2));
  z-index: 1;
}
.page-character-shell {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.page-character-glow {
  position: absolute;
  right: max(4%, calc(50% - 300px));
  bottom: 4%;
  width: min(44vw, 360px);
  height: min(44vw, 360px);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(247, 191, 211, 0.38) 0%, rgba(247, 191, 211, 0) 72%);
  filter: blur(10px);
}
.page-character {
  position: absolute;
  right: max(1%, calc(50% - 290px));
  bottom: 0;
  height: min(92%, 860px);
  max-width: min(82vw, 540px);
  object-fit: contain;
  object-position: bottom right;
  filter: drop-shadow(0 24px 36px rgba(18, 10, 6, 0.26));
}
.app-shell {
  position: relative;
  z-index: 3;
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 100%;
}
.phone-frame {
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 10px;
  width: min(100%, 430px);
  height: min(100%, 920px);
  max-height: 100%;
  padding: 14px;
  border-radius: 36px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 244, 248, 0.12)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.16), transparent 60%);
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow:
    0 28px 80px rgba(113, 58, 83, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
  overflow: hidden;
}
.bottom-bar {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: max(10px, env(safe-area-inset-bottom));
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(247, 191, 211, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(171, 102, 134, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    background 200ms ease;
}
.bottom-bar.charging {
  border-color: rgba(233, 108, 152, 0.95);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(233, 108, 152, 0.32);
  background: rgba(255, 248, 252, 0.96);
}
.bottom-bar.charged {
  border-color: rgba(118, 212, 215, 0.95);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(118, 212, 215, 0.32);
  background: rgba(248, 252, 255, 0.96);
}
.bottom-bar-info {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.bottom-task {
  font-size: 15px;
  font-weight: 800;
  color: var(--cj-text-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bottom-status {
  font-size: 12px;
  color: #8d6171;
}
.bottom-bar.charging .bottom-status {
  color: #e96c98;
  font-weight: 700;
}
.bottom-bar.charged .bottom-status {
  color: #5bb8bb;
  font-weight: 700;
  animation: chargedPulse 0.8s ease-in-out infinite;
}
.charge-ring {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.charge-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.charge-bg {
  fill: none;
  stroke: rgba(200, 167, 181, 0.18);
  stroke-width: 4;
}
.charge-fill {
  fill: none;
  stroke: #e96c98;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 125.664;
  transition:
    stroke-dashoffset 100ms linear,
    stroke 200ms ease;
}
.bottom-bar.charging .charge-fill {
  stroke: #e96c98;
}
.bottom-bar.charged .charge-fill {
  stroke: #76d4d7;
}
.charge-pct {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  color: var(--cj-text-title);
  line-height: 1;
}
.charge-ring.active {
  animation: ringPulse 0.6s ease-in-out infinite alternate;
}
.charge-ring.ready {
  animation: ringReady 0.5s ease-in-out infinite alternate;
}
@keyframes chargedPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
@keyframes ringPulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
}
@keyframes ringReady {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.12);
  }
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 18px 14px 0 100px;
}
.top-copy {
  display: grid;
  gap: 8px;
  justify-items: start;
}
.top-bar h1 {
  margin: 0;
  color: var(--cj-text-title);
  font-size: clamp(28px, 6vw, 36px);
  line-height: 1.05;
  text-shadow: 0 8px 22px rgba(255, 255, 255, 0.36);
  text-align: left;
}
.top-meta {
  display: grid;
  gap: 4px;
}
.meta-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.94);
  font-size: 14px;
  line-height: 1.35;
  text-shadow:
    -1px -1px 0 rgba(107, 65, 84, 0.5),
    1px -1px 0 rgba(107, 65, 84, 0.5),
    -1px 1px 0 rgba(107, 65, 84, 0.5),
    1px 1px 0 rgba(107, 65, 84, 0.5),
    0 4px 12px rgba(88, 49, 68, 0.18);
}
.meta-line img {
  width: 22px;
  height: 22px;
}
.meta-line strong {
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.action-hub {
  position: absolute;
  left: 10px;
  top: 126px;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 8px 5px;
  border: 2px solid rgba(247, 191, 211, 0.9);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(171, 102, 134, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.shell-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-height: 0;
  padding-left: 100px;
  padding-bottom: 80px;
}
.hub-nav-btn {
  position: relative;
  width: 110px;
  height: 110px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--cj-text-title);
  display: grid;
  place-items: center;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    transform 180ms ease,
    filter 180ms ease;
}
.hub-nav-btn img {
  width: 110px;
  height: 110px;
  display: block;
  filter: drop-shadow(0 6px 10px rgba(190, 114, 145, 0.2));
}
.hub-nav-btn.active {
  box-shadow: none;
  filter: saturate(1.08) brightness(1.02);
}
.hub-nav-btn:active {
  filter: saturate(1.08) brightness(0.98);
}
.hub-nav-btn.is-highlighted {
  animation: navPulse 1.4s ease-in-out infinite;
}
.hub-nav-label {
  position: absolute;
  bottom: 10px;
  right: 2px;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, rgba(255, 153, 178, 0.92), rgba(255, 183, 196, 0.88));
  border: 1px solid rgba(255, 140, 160, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 3px 8px rgba(255, 150, 180, 0.3);
  backdrop-filter: blur(4px);
  white-space: nowrap;
  pointer-events: none;
}
@keyframes navPulse {
  0%,
  100% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.16) brightness(1.07);
  }
}
.shell-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-height: 0;
  padding-left: 100px;
}
.control-column {
  display: grid;
  gap: 12px;
  align-content: start;
}
.action-dock {
  position: relative;
  z-index: 1;
}
.ghost,
.hub-btn,
.exam-card button {
  min-height: 44px;
  border: 0;
  border-radius: 16px;
  font-weight: 700;
}
.ghost {
  background: rgba(255, 255, 255, 0.88);
  color: var(--cj-text-body);
  border: 1px solid rgba(247, 191, 211, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
.nn-action-btn {
  position: relative;
  min-height: 44px;
  padding: 10px 6px;
  border: 2px solid rgba(244, 143, 177, 0.72);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0) 40%),
    linear-gradient(135deg, #fff6fa 0%, #fde6ef 40%, #f7bfd3 100%);
  color: var(--cj-text-title);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.78),
    inset 0 -3px 0 rgba(233, 108, 152, 0.12),
    0 4px 0 rgba(201, 85, 128, 0.14),
    0 6px 14px rgba(201, 85, 128, 0.2);
  transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
}
.nn-action-btn:hover:not(:disabled) {
  border-color: var(--cj-pink-400);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.88),
    inset 0 -3px 0 rgba(233, 108, 152, 0.16),
    0 5px 0 rgba(201, 85, 128, 0.18),
    0 10px 20px rgba(201, 85, 128, 0.26);
}
.nn-action-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 6px rgba(201, 85, 128, 0.2),
    0 1px 0 rgba(201, 85, 128, 0.12),
    0 2px 6px rgba(201, 85, 128, 0.12);
}
.nn-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.panel {
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(236, 176, 96, 0.42), rgba(154, 88, 38, 0.18)),
    rgba(255, 230, 178, 0.62);
  border: 2px solid rgba(119, 63, 22, 0.16);
  box-shadow:
    inset 0 2px 0 rgba(255, 247, 213, 0.34),
    0 20px 54px rgba(70, 34, 14, 0.12);
  backdrop-filter: blur(14px);
  overflow: hidden;
}
.panel-head,
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}
.panel-head-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
}
.head-spacer {
  flex: 1;
}
.panel-title-plaque {
  align-self: center;
  min-width: 136px;
  margin: 0 auto 10px;
  padding: 7px 18px 9px;
  border: 2px solid rgba(247, 191, 211, 0.9);
  border-radius: 0 0 20px 20px;
  background: linear-gradient(180deg, #f8b7ce, #ec85ab 70%, #d96b93);
  color: #fff8fd;
  text-align: center;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -3px 0 rgba(173, 79, 118, 0.16),
    0 10px 18px rgba(201, 85, 128, 0.24);
}
.panel-title-plaque span {
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 2px 5px rgba(146, 57, 93, 0.26);
}
.profile-head-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}
.profile-head-info.level-info {
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.level-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
}
.level-lv {
  color: #8b4b67;
  font-size: 18px;
  font-weight: 900;
}
.level-frac {
  color: #a46583;
  font-size: 12px;
  font-weight: 600;
}
.level-bar {
  width: 100%;
  height: 4px;
  background: rgba(247, 191, 211, 0.3);
  border-radius: 2px;
  overflow: hidden;
}
.level-fill {
  height: 100%;
  background: linear-gradient(90deg, #f48fb1, #e96c98);
  border-radius: 2px;
  transition: width 0.3s;
}
.profile-head-info .chip {
  min-height: 34px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid rgba(244, 198, 169, 0.74);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 42%),
    linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(255, 233, 214, 0.88));
  color: #8a5b36;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(236, 194, 167, 0.24),
    0 4px 10px rgba(192, 138, 104, 0.12);
  letter-spacing: 0.01em;
  transition:
    background 180ms ease,
    border-color 180ms ease;
}
.panel-tabbar {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(62px, 1fr);
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px;
  border: 2px solid rgba(247, 191, 211, 0.56);
  border-radius: 22px;
  background: rgba(248, 230, 238, 0.78);
  box-shadow:
    inset 0 2px 6px rgba(201, 85, 128, 0.06),
    0 10px 18px rgba(171, 102, 134, 0.1);
}
.panel-tab-btn {
  position: relative;
  min-width: 0;
  height: 62px;
  padding: 4px 4px 5px;
  border: 0;
  border-radius: 18px;
  border: 2px solid rgba(247, 191, 211, 0.7);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 237, 243, 0.92));
  display: grid;
  grid-template-rows: 34px 1fr;
  gap: 1px;
  place-items: center;
  color: var(--cj-text-title);
  cursor: pointer;
  touch-action: manipulation;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.6),
    inset 0 -3px 0 rgba(221, 175, 194, 0.22),
    0 7px 12px rgba(171, 102, 134, 0.12);
  transition:
    transform 160ms ease,
    filter 160ms ease,
    box-shadow 160ms ease;
}
.panel-tab-btn img {
  width: 36px;
  height: 36px;
  display: block;
  filter: drop-shadow(0 3px 4px rgba(64, 32, 10, 0.24));
}
.panel-tab-btn span {
  max-width: 100%;
  color: var(--cj-text-body);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.56);
  white-space: nowrap;
}
.panel-tab-btn.active {
  border-color: rgba(233, 108, 152, 0.82);
  background:
    radial-gradient(circle at 50% 0, rgba(255, 255, 255, 0.76), transparent 42%),
    linear-gradient(180deg, #ffd5e5, #f59dbe 62%, #e96c98);
  filter: saturate(1.12);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.74),
    inset 0 -4px 0 rgba(173, 79, 118, 0.18),
    0 10px 16px rgba(201, 85, 128, 0.24),
    0 0 0 3px rgba(244, 143, 177, 0.18);
}
.panel-tab-btn.active span {
  color: #fffaff;
  text-shadow: 0 2px 4px rgba(146, 57, 93, 0.2);
}
.panel-tab-btn:active {
  filter: saturate(1.06) brightness(0.98);
}
.section-pill {
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--cj-text-title);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}
.section-copy {
  margin: 0;
  color: var(--cj-text-body);
  font-size: 13px;
  line-height: 1.5;
}
.section-stack {
  display: grid;
  gap: 10px;
  align-content: start;
}
.section-scroll {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
  align-content: start;
}
.panel-workspace {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.panel-workspace--tasks {
  overflow-y: auto;
  overflow-x: hidden;
}
.panel-workspace--story {
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
.panel-workspace--minigames {
  overflow-y: auto;
  overflow-x: hidden;
}
.growth-summary,
.growth-actions,
.page-actions {
  display: grid;
  gap: 12px;
}
.region-full {
  height: 100%;
  min-height: 0;
}
.panel-fill {
  grid-template-rows: minmax(0, 1fr);
}
.growth-summary.single-column {
  grid-template-columns: 1fr;
}
.page-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}
.shop-preview-shell {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 12px;
}
.shop-status-card {
  flex-shrink: 0;
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  color: var(--cj-text-body);
}
.shop-status-card strong {
  color: var(--cj-text-title);
}
.shop-status-card p {
  margin: 0;
  font-size: 13px;
}
.shop-preview-carousel {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(248, 183, 206, 0.18), transparent 56%),
    rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(247, 191, 211, 0.48);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.shop-carousel-track {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  transition: transform 240ms ease;
}
.shop-carousel-slide {
  flex: 0 0 100%;
  position: relative;
  display: grid;
  place-items: center;
}
.shop-carousel-skin {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 24px 18px 12px;
  filter: drop-shadow(0 18px 28px rgba(171, 102, 134, 0.22));
}
.shop-slide-btn {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--cj-text-title);
  transform: translateY(-50%);
  box-shadow: 0 10px 18px rgba(171, 102, 134, 0.14);
}
.shop-slide-btn.prev {
  left: 10px;
}
.shop-slide-btn.next {
  right: 10px;
}
.shop-slide-btn:disabled {
  opacity: 0.45;
}
.shop-carousel-dots {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 2;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}
.shop-dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
}
.shop-dot.active {
  width: 18px;
  background: rgba(233, 108, 152, 0.94);
}
.shop-complete-state {
  height: 100%;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 32px;
  border-radius: 22px;
  background:
    radial-gradient(circle at center, rgba(73, 140, 88, 0.16), transparent 48%), var(--cj-card-bg);
  border: 2px solid rgba(73, 140, 88, 0.18);
  text-align: center;
}
.shop-complete-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(73, 140, 88, 0.18), rgba(47, 108, 63, 0.22));
  color: #2f6c3f;
  font-size: 32px;
  display: grid;
  place-items: center;
}
.shop-complete-state strong {
  color: #2f6c3f;
  font-size: 18px;
}
.shop-complete-state p {
  color: #5a8a5a;
  font-size: 14px;
}
.shop-preview-meta {
  flex-shrink: 0;
  padding: 14px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(255, 239, 182, 0.28), transparent 34%),
    var(--cj-card-bg);
  border: var(--cj-card-border);
  box-shadow: var(--cj-card-shadow);
}
.shop-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.shop-preview-meta strong {
  color: var(--cj-text-title);
}
.shop-price-hint {
  min-height: 26px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(248, 183, 206, 0.24);
  color: var(--cj-text-title);
  font-size: 13px;
  font-weight: 700;
}
.shop-preview-meta p {
  margin: 8px 0 0;
  color: var(--cj-text-body);
  font-size: 13px;
}
.shop-buy-btn {
  margin-top: 12px;
  width: 100%;
  min-height: 38px;
}
.shop-buy-btn:disabled {
  opacity: 0.5;
}
.summary-preview-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  color: var(--cj-text-body);
}
.summary-preview-card img {
  width: 100%;
  height: 136px;
  object-fit: contain;
  filter: drop-shadow(0 12px 20px rgba(40, 21, 11, 0.14));
}
.summary-preview-card strong {
  color: var(--cj-text-title);
}
.summary-preview-card span {
  font-size: 12px;
}
.summary-card {
  display: grid;
  gap: 6px;
}
.stacked-note-card {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  align-self: start;
  height: fit-content;
  color: var(--cj-text-body);
}
.stacked-note-card strong {
  color: var(--cj-text-title);
}
.stacked-note-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.todo-summary-card {
  position: relative;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(244, 143, 177, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(255, 249, 241, 0.98), rgba(255, 239, 246, 0.92));
  border: 1px solid rgba(235, 175, 198, 0.78);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4),
    0 8px 18px rgba(188, 120, 146, 0.12);
}
.todo-summary-card::after {
  content: '';
  position: absolute;
  inset: auto -12px -28px auto;
  width: 84px;
  height: 84px;
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}
.todo-summary-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.todo-summary-copy {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.todo-summary-count {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 44%),
    linear-gradient(180deg, rgba(255, 244, 232, 0.96), rgba(255, 221, 200, 0.82));
  border: 1px solid rgba(240, 191, 162, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 6px 12px rgba(207, 157, 126, 0.12);
  color: #aa6648;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}
.todo-summary-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.todo-summary-eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #b26d8a;
}
.todo-summary-card strong {
  font-size: 15px;
  color: #8e4c68;
}
.todo-summary-hint {
  margin: 2px 0 0;
  color: #b07a91;
  font-size: 11px;
  line-height: 1.35;
}
.todo-icon-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid rgba(235, 184, 204, 0.78);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.86), transparent 42%),
    linear-gradient(180deg, rgba(255, 250, 244, 0.96), rgba(255, 231, 240, 0.84));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 6px 14px rgba(192, 125, 151, 0.12);
  color: #b55c83;
  transition:
    transform 180ms ease,
    filter 180ms ease,
    border-color 180ms ease;
}
.todo-icon-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: saturate(1.05) brightness(1.02);
}
.todo-icon-btn:disabled {
  opacity: 0.45;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}
.todo-icon-btn span {
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}
.todo-clear-btn span {
  font-size: 16px;
}
.todo-icon-btn.is-danger {
  color: #c35e72;
  border-color: rgba(237, 164, 178, 0.82);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.82), transparent 42%),
    linear-gradient(180deg, rgba(255, 244, 245, 0.96), rgba(255, 224, 229, 0.84));
}
@media (max-width: 560px) {
  .todo-summary-card {
    padding: 10px;
  }
  .todo-summary-copy {
    gap: 10px;
  }
  .todo-summary-count {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 18px;
  }
  .todo-summary-card strong {
    font-size: 14px;
  }
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--cj-text-label);
}
h3 {
  margin: 0;
  color: var(--cj-text-title);
}
.summary-preview-card,
.stacked-note-card,
.status-card,
.settlement-card,
.shop-status-card,
.save-slot-card,
.event-item,
.minigame-card {
  background: var(--cj-card-bg);
  border: var(--cj-card-border);
  box-shadow: var(--cj-card-shadow);
}
.status-card,
.settlement-card {
  display: grid;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 16px;
}
.status-card.compact {
  padding: 14px;
}
.story-grid {
  display: grid;
  gap: 10px;
  align-items: start;
}
.story-grid-top {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.story-card {
  display: grid;
  gap: 6px;
  align-items: start;
}
.story-card-label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--cj-text-label);
  letter-spacing: 0.02em;
}
.story-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.story-chip-list.chip-tri {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.story-chip-list.chip-tri .story-chip {
  display: inline-flex;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.story-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 13px;
  border-radius: 999px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 42%),
    linear-gradient(180deg, rgba(255, 251, 245, 0.96), rgba(255, 232, 214, 0.7));
  color: #7f5969;
  font-size: 12px;
  line-height: 1.35;
  border: 1px solid rgba(243, 199, 173, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    inset 0 -1px 0 rgba(239, 206, 188, 0.24),
    0 4px 10px rgba(188, 139, 112, 0.08);
  transition:
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}
.story-chip.active {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 42%),
    linear-gradient(180deg, rgba(255, 241, 236, 0.98), rgba(248, 187, 208, 0.5));
  color: #b4557e;
  border-color: rgba(232, 151, 182, 0.54);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(238, 176, 201, 0.24),
    0 6px 12px rgba(215, 124, 164, 0.14);
}
.story-chip.done {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 42%),
    linear-gradient(180deg, rgba(248, 255, 245, 0.96), rgba(198, 233, 188, 0.58));
  color: #5c8761;
  border-color: rgba(152, 194, 141, 0.44);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(174, 212, 164, 0.22),
    0 5px 10px rgba(111, 157, 102, 0.1);
}
.story-list {
  margin: 0;
  padding-left: 18px;
  color: var(--cj-text-body);
  font-size: 12px;
  line-height: 1.4;
}
.story-list li + li {
  margin-top: 6px;
}
.title-wall-list {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}
.title-wall-item {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(247, 191, 211, 0.42);
}
.title-wall-item strong {
  color: #5c2f14;
  font-size: 13px;
}
.title-wall-item span {
  color: #8a5b36;
  font-size: 11px;
}
.story-history-list {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  overflow: hidden;
}
.save-slot-list {
  display: grid;
  gap: 10px;
  align-content: start;
}
.save-slot-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  color: var(--cj-text-body);
}
.save-slot-card.active {
  border-color: rgba(233, 108, 152, 0.42);
  background:
    radial-gradient(circle at top right, rgba(244, 143, 177, 0.18), transparent 34%),
    var(--cj-card-bg);
}
.save-slot-card.empty {
  border-style: dashed;
}
.save-slot-main {
  display: grid;
  gap: 4px;
}
.save-slot-main strong {
  color: var(--cj-text-title);
  font-size: 16px;
}
.save-slot-main p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.save-slot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.save-slot-actions.tri-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.save-slot-actions button {
  min-width: 72px;
  min-height: 40px;
}
.save-slot-actions.tri-actions .nn-action-btn {
  width: 100%;
  text-align: center;
}
.history-summary-region {
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto;
  gap: 8px;
  overflow: hidden;
}
.history-summary-region .settlement-card {
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 10px;
  padding: 10px;
}
.history-summary-region .settlement-card p,
.history-summary-region .settlement-card small {
  margin-top: 4px;
}
.history-summary-region .subtle-danger-btn {
  align-self: end;
}
.history-event-region {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}
.task-result-list {
  min-height: 0;
  display: grid;
  gap: 10px;
  align-content: start;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}
.status-card,
.exam-card,
.settlement-card {
  color: var(--cj-text-body);
}
.status-card strong,
.exam-card strong,
.settlement-card strong {
  color: var(--cj-text-title);
  font-size: 16px;
}
.status-card p,
.exam-card p,
.settlement-card p,
.status-card small,
.exam-card small,
.settlement-card small {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
}
.settlement-card > button {
  justify-self: start;
}
.task-result-card {
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
}
.task-item {
  text-align: left;
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  color: var(--cj-text-body);
}
.task-item strong {
  color: #8b4b67;
  font-size: 16px;
}
.task-item p {
  color: #6f4a59;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}
.todo-task-card {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease,
    filter 180ms ease;
}
.todo-task-card:hover {
  filter: saturate(1.06) brightness(1.02);
}
.todo-task-card.is-swiping {
  border-color: rgba(234, 166, 179, 0.92);
}
.todo-task-card.is-active {
  position: relative;
  background:
    radial-gradient(circle at top right, rgba(244, 189, 208, 0.28), transparent 30%),
    radial-gradient(circle at left center, rgba(255, 235, 214, 0.3), transparent 24%),
    linear-gradient(180deg, rgba(255, 251, 245, 0.99), rgba(255, 239, 244, 0.94));
  border-color: rgba(236, 184, 202, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28),
    0 12px 24px rgba(198, 132, 158, 0.16);
}
.todo-task-card.is-active::after {
  content: '';
  position: absolute;
  inset: 10px 10px auto auto;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #f0a8bf;
  box-shadow: 0 0 0 4px rgba(240, 168, 191, 0.18);
}
.todo-task-card.is-active strong {
  color: #a45274;
}
.todo-task-card.is-active p,
.todo-task-card.is-active small {
  color: #8d5f71;
}
.todo-swipe-delete-hint {
  position: absolute;
  inset: 50% auto auto 14px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.84), transparent 42%),
    linear-gradient(180deg, rgba(255, 245, 246, 0.98), rgba(255, 223, 229, 0.88));
  border: 1px solid rgba(238, 177, 189, 0.88);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 4px 10px rgba(203, 118, 141, 0.14);
  color: #bf617f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}
.todo-task-card.is-swiping .todo-swipe-delete-hint {
  opacity: 1;
}
.todo-task-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.todo-task-copy small {
  margin: 0;
}
.empty-history-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: var(--cj-card-bg);
  border: var(--cj-card-border);
  box-shadow: var(--cj-card-shadow);
  color: var(--cj-text-body);
}
.empty-history-card strong {
  color: var(--cj-text-title);
  font-size: 16px;
}
.empty-history-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.section-label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--cj-text-label);
}
.event-section,
.event-list {
  display: grid;
  gap: 10px;
  align-content: start;
}
.event-item {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
}
.event-item img {
  width: 100%;
  border-radius: 14px;
  object-fit: cover;
}
.event-copy {
  display: grid;
  gap: 4px;
  color: var(--cj-text-body);
}
.event-kicker {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--cj-text-label);
}
.event-copy strong {
  color: var(--cj-text-title);
  font-size: 16px;
}
.event-copy p:last-child {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.exam-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-items: center;
  align-self: start;
  height: fit-content;
  padding: 12px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(244, 143, 177, 0.16), transparent 32%),
    var(--cj-card-bg);
  border: 2px solid rgba(247, 191, 211, 0.68);
  box-shadow: var(--cj-card-shadow);
}
.badge {
  width: 42px;
  height: 42px;
  align-self: start;
}
.exam-card button {
  min-width: 92px;
  background: linear-gradient(135deg, var(--cj-pink-400), var(--cj-pink-500));
  color: #fff;
  box-shadow: 0 12px 24px rgba(233, 108, 152, 0.22);
}
.exam-actions {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.exam-ghost-btn {
  color: #7a4825;
}
.hub-btn {
  background: linear-gradient(135deg, var(--cj-pink-400), var(--cj-pink-500));
  color: #fff;
  box-shadow: 0 12px 24px rgba(233, 108, 152, 0.22);
}
.hub-btn:disabled {
  opacity: 0.5;
}
.panel-modal-shell {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: block;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 12%, rgba(248, 183, 206, 0.18), transparent 34%),
    rgba(99, 59, 77, 0.2);
}
.panel-modal {
  position: relative;
  --game-card-bg: var(--cj-card-bg);
  --game-card-border: var(--cj-card-border);
  --game-card-shadow: var(--cj-card-shadow);
  --game-card-selected-bg: var(--cj-card-selected-bg);
  --game-chip-bg:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.74), transparent 42%),
    linear-gradient(180deg, rgba(255, 250, 244, 0.96), rgba(255, 229, 212, 0.76));
  --game-chip-color: #85556b;
  --game-chip-border: 1px solid rgba(244, 196, 171, 0.56);
  --game-action-bg: linear-gradient(135deg, var(--cj-pink-400), var(--cj-pink-500));
  --game-action-shadow: 0 12px 24px rgba(233, 108, 152, 0.22);
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  margin: 0;
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(255, 252, 254, 0.94), rgba(252, 228, 236, 0.78)),
    radial-gradient(ellipse at 18% 20%, rgba(248, 187, 208, 0.2), transparent 32%),
    radial-gradient(ellipse at 76% 72%, rgba(236, 64, 122, 0.08), transparent 38%),
    rgba(255, 252, 254, 0.92);
  background-size:
    auto,
    280px 220px,
    360px 260px,
    auto;
  border: 3px solid rgba(247, 191, 211, 0.92);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.82),
    inset 0 -8px 0 rgba(212, 156, 179, 0.08),
    0 28px 72px rgba(171, 102, 134, 0.22);
  overflow: hidden;
}
.panel-modal-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-bottom: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.close-btn {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid rgba(247, 191, 211, 0.82);
  border-radius: 999px;
  background: #ec85ab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 12px rgba(201, 85, 128, 0.16);
  box-sizing: border-box;
  line-height: 0;
  appearance: none;
  transition:
    filter 120ms ease,
    transform 120ms ease;
}
.close-btn-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 18px;
  height: 18px;
}
.close-btn-icon::before,
.close-btn-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 2.5px;
  border-radius: 999px;
  background: #fff8fd;
  transform-origin: center;
}
.close-btn-icon::before {
  transform: translate(-50%, -50%) rotate(45deg);
}
.close-btn-icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.close-btn:hover {
  filter: brightness(1.05);
}
.close-btn:active {
  filter: brightness(0.98);
}
.panel-modal-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.panel-modal :global(.game-card) {
  background: var(--game-card-bg);
  border: var(--game-card-border);
  box-shadow: var(--game-card-shadow);
}
.panel-modal :global(.game-card.is-selected) {
  background: var(--game-card-selected-bg);
  border-color: rgba(233, 108, 152, 0.42);
  box-shadow: var(--game-card-shadow);
}
.panel-modal :global(.game-card.is-locked) {
  background: linear-gradient(180deg, rgba(235, 229, 232, 0.92), rgba(214, 204, 209, 0.82));
  border-color: rgba(176, 176, 176, 0.4);
  filter: saturate(0.75);
}
.panel-modal :global(.game-chip) {
  min-height: 26px;
  padding: 4px 13px;
  border-radius: 999px;
  background: var(--game-chip-bg);
  color: var(--game-chip-color);
  border: var(--game-chip-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 -1px 0 rgba(243, 203, 184, 0.24),
    0 4px 10px rgba(189, 141, 110, 0.1);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  letter-spacing: 0.01em;
  transition:
    background 180ms ease,
    border-color 180ms ease;
}
.panel-modal :global(.game-chip.is-success) {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.78), transparent 40%),
    linear-gradient(180deg, rgba(255, 246, 250, 0.98), rgba(248, 210, 228, 0.72));
  color: #8b4b67;
  border-color: rgba(233, 108, 152, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(234, 180, 206, 0.22),
    0 5px 10px rgba(177, 102, 134, 0.12);
}
.panel-modal :global(.game-chip.is-muted) {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.52), transparent 42%),
    linear-gradient(180deg, rgba(242, 239, 240, 0.86), rgba(220, 211, 215, 0.68));
  color: #9d8f96;
  border-color: rgba(192, 184, 188, 0.36);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 3px 8px rgba(150, 137, 144, 0.08);
}
.panel-modal :global(.game-action-btn) {
  min-height: 36px;
  border: 0;
  border-radius: 14px;
  background: var(--game-action-bg);
  color: #fff;
  box-shadow: var(--game-action-shadow);
  font-size: 14px;
  font-weight: 800;
}
.danger-btn {
  min-height: 44px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 165, 180, 0.22), rgba(239, 83, 108, 0.12));
  color: #c14d72;
  font-weight: 700;
  border: 1px solid rgba(239, 83, 108, 0.14);
}
.subtle-danger-btn {
  justify-self: start;
  min-width: 112px;
  background: rgba(154, 52, 18, 0.08);
  box-shadow: none;
}
.minigame-grid-scroll {
  display: grid;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  padding-right: 2px;
  align-content: start;
}
.minigame-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  color: var(--cj-text-body);
  background: var(--cj-card-bg);
  border: var(--cj-card-border);
  box-shadow: var(--cj-card-shadow);
  cursor: pointer;
  text-align: left;
  transition:
    transform 180ms ease,
    filter 180ms ease,
    border-color 180ms ease;
}
.minigame-card:hover {
  transform: translateY(-1px);
  filter: saturate(1.05) brightness(1.01);
}
.minigame-card:active {
  transform: translateY(0);
}
.minigame-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.minigame-icon-shell {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: none;
  border: none;
  box-shadow: none;
}
.minigame-icon-shell img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(179, 123, 95, 0.16));
}
.minigame-copy {
  display: grid;
  gap: 4px;
}
.minigame-card strong {
  display: block;
  color: var(--cj-text-title);
  font-size: 16px;
}
.minigame-card > .minigame-copy span {
  display: block;
  color: var(--cj-text-body);
  font-size: 12px;
  line-height: 1.45;
}
.minigame-chip-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 4px;
}
.minigame-chip-list .story-chip {
  display: inline-flex;
  justify-content: center;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}
@media (max-width: 720px) {
  .page-character-glow {
    right: -6%;
    bottom: 10%;
    width: 220px;
    height: 220px;
  }
  .page-character {
    right: -18%;
    height: min(74%, 620px);
    max-width: 80vw;
    opacity: 0.94;
  }
  .app-shell {
    min-height: 100%;
  }
  .phone-frame {
    width: 100%;
    height: 100%;
    padding: max(10px, env(safe-area-inset-top)) 12px max(10px, env(safe-area-inset-bottom)) 12px;
    border-radius: 0;
  }
  .action-hub {
    left: 6px;
    top: 92px;
    gap: 7px;
    padding: 6px 4px;
    border-radius: 21px;
  }
  .top-bar {
    padding: 10px 8px 0 96px;
  }
  .hub-nav-btn {
    width: 72px;
    height: 72px;
  }
  .hub-nav-btn img {
    width: 72px;
    height: 72px;
  }
  .hub-nav-label {
    right: -2px;
    bottom: 6px;
    font-size: 10px;
    padding: 2px 6px;
  }
  .top-bar h1 {
    font-size: clamp(24px, 7vw, 30px);
  }
  .meta-line {
    gap: 8px;
    font-size: 13px;
  }
  .meta-line img {
    width: 20px;
    height: 20px;
  }
  .meta-line strong {
    font-size: 14px;
  }
  .shell-main {
    padding-left: 96px;
  }
  .story-grid-top {
    grid-template-columns: 1fr;
  }
  .page-summary-grid {
    grid-template-columns: 1fr;
  }
  .exam-card {
    grid-template-columns: 1fr;
  }
  .exam-actions {
    grid-template-columns: 1fr;
  }
  .panel-tabbar {
    grid-auto-columns: minmax(52px, 1fr);
    gap: 6px;
    padding: 5px;
    border-radius: 19px;
  }
  .panel-head-actions {
    gap: 8px;
  }
  .panel-modal-head {
    margin-bottom: 10px;
  }
  .panel-tab-btn {
    height: 56px;
    border-radius: 16px;
  }
  .panel-tab-btn img {
    width: 32px;
    height: 32px;
  }
  .panel-tab-btn span {
    font-size: 10px;
  }
  .panel-title-plaque {
    min-width: 124px;
    margin-bottom: 8px;
    padding: 6px 16px 8px;
  }
  .panel-title-plaque span {
    font-size: 17px;
  }
  .panel {
    padding: 14px;
  }
  .panel-modal {
    width: 100%;
    height: 100dvh;
    padding: 12px;
    padding-top: max(12px, env(safe-area-inset-top));
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
  .shop-preview-shell {
    gap: 10px;
  }
  .shop-slide-btn {
    width: 30px;
    height: 30px;
  }
  .shop-preview-meta {
    padding: 12px;
  }
  .shop-buy-btn {
    min-height: 36px;
  }
  .bottom-bar {
    padding: 10px 14px;
    border-radius: 16px;
  }
  .bottom-task {
    font-size: 14px;
  }
  .charge-ring {
    width: 42px;
    height: 42px;
  }
}
@media (max-width: 420px) {
  .hub-nav-btn {
    width: 58px;
    height: 58px;
  }
  .hub-nav-btn img {
    width: 58px;
    height: 58px;
  }
  .hub-nav-label {
    right: -4px;
    bottom: 4px;
    font-size: 9px;
    padding: 2px 5px;
  }
}
</style>
