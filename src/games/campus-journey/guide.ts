import {
  ADULT_HIGH_GRADUATION_CREDITS,
  ADULT_HIGH_GRADUATION_KNOWLEDGE,
  ADULT_HIGH_GRADUATION_REPUTATION,
  BASIC_WORK_ADULT_EXAM_KNOWLEDGE,
  BASIC_WORK_ADULT_EXAM_MONEY,
  COLLEGE_TO_BUSINESS_REPUTATION,
  HIGHSCHOOL_TO_EXAM_KNOWLEDGE,
  HIGHSCHOOL_TO_EXAM_PREP,
  WORK_TO_BUSINESS_REPUTATION,
} from './constants'
import { getThreshold, getWealthFreeTarget } from './progression'
import { eventDefinitions } from './events'
import type { EventDefinition, PhaseId, PlayerState, RouteId } from './types'

export const phaseLabels: Record<PhaseId, string> = {
  highschool: '高中阶段',
  exam: '高考阶段',
  college: '大学阶段',
  'work-basic': '基础打工',
  'adult-exam': '成人高考',
  'work-study': '边工边学',
  'work-advanced-college': '大学毕业后工作',
  'work-advanced-adult-high': '成考高标毕业后工作',
  'work-advanced-adult-normal': '成考普通毕业后工作',
  business: '经营阶段',
  postgame: '通关后阶段',
}

export const routeLabels: Record<RouteId, string> = {
  none: '未分线',
  college: '大学线',
  work: '打工线',
}

type StoryGuide = {
  currentStageTitle: string
  currentStageDescription: string
  routeTitle: string
  routeDescription: string
  nextGoalTitle: string
  nextGoalDescription: string
  unlockConditions: string[]
  progressTips: string[]
}

type PhaseProgressCard = {
  title: string
  description: string
  metrics: string[]
}

type PrimaryPanelId = 'action' | 'progress' | 'skill' | 'role' | 'minigames'

type GrowthBonusCard = {
  title: string
  description: string
}

type ProgressMapStep = {
  id: string
  label: string
  active: boolean
  done: boolean
}

type GuideContext = {
  state: PlayerState
  availableTaskCount: number
  totalSkinCount: number
  visibleEvents: EventDefinition[]
  examPassRate: number
  adultExamRetakeHint: string
}

const getRouteCard = (state: PlayerState) =>
  state.route === 'college'
    ? {
        title: '大学线',
        description: '主线已进入大学成长路线，关键目标是做出成果并冲到经营阶段门槛。',
      }
    : state.route === 'work'
      ? {
          title: '打工线',
          description: '主线已进入工作成长路线，关键目标是完成晋升并积累足够声望。',
        }
      : {
          title: '未分线',
          description: '当前仍在高中主线，优先把知识和备考进度推到考试节点。',
        }

export const createStoryGuide = ({
  state,
  availableTaskCount,
  totalSkinCount,
  visibleEvents,
  examPassRate,
  adultExamRetakeHint,
}: GuideContext): StoryGuide => {
  const completedEventCount = state.completedEventIds.length
  const nextVisibleEvent = visibleEvents[0] ?? null
  const collegeCompetitionCount = state.taskCompletionCount['college-competition'] ?? 0
  const workOvertimeCount = state.taskCompletionCount['work-overtime'] ?? 0
  const bizAutoProfitCount = state.taskCompletionCount['biz-auto-profit'] ?? 0
  const bizTeamCount = state.taskCompletionCount['biz-team'] ?? 0
  const bizSalesCount = state.taskCompletionCount['biz-sales'] ?? 0
  const wealthTarget = getWealthFreeTarget(state)
  const isPostgameReplay = state.meta.mainCleared && state.phase !== 'postgame'
  const routeCard = getRouteCard(state)
  const thresholdFor = (baseValue: number) => getThreshold(state, baseValue)

  switch (state.phase) {
    case 'highschool':
      return {
        currentStageTitle: '高中积累期',
        currentStageDescription: '先稳住知识成长，再把备考进度推到高考开启线。',
        routeTitle: routeCard.title,
        routeDescription: routeCard.description,
        nextGoalTitle: '下一关键节点：高考',
        nextGoalDescription:
          nextVisibleEvent?.id === 'monthly-exam' || nextVisibleEvent?.id === 'mock-exam'
            ? `当前最近的主线事件是「${nextVisibleEvent.title}」，继续学习即可自然推进。`
            : '达到考试门槛后会自动进入高考阶段。',
        unlockConditions: [
          `知识达到 ${thresholdFor(HIGHSCHOOL_TO_EXAM_KNOWLEDGE)}（当前 ${state.knowledge}）`,
          `备考进度达到 ${thresholdFor(HIGHSCHOOL_TO_EXAM_PREP)}（当前 ${state.exam.prepProgress}）`,
        ],
        progressTips: [
          `推荐优先做备考任务，当前考试通过率 ${examPassRate.toFixed(0)}%`,
          `已完成主线事件 ${completedEventCount} / ${eventDefinitions.length}`,
        ],
      }
    case 'exam':
      return {
        currentStageTitle: '高考阶段',
        currentStageDescription: '先通过高考冲刺提高额外加成，再决定是否参加正式考试。',
        routeTitle: routeCard.title,
        routeDescription: '考试结果会决定后续进入大学线还是打工线。',
        nextGoalTitle: '下一关键节点：考试结算',
        nextGoalDescription: state.exam.entranceExamTaken
          ? '正式考试已经提交，等待结算事件推进主线。'
          : '当前可以直接打开考试冲刺，小游戏加成会计入最终通过率。',
        unlockConditions: [
          `当前正式考试通过率 ${examPassRate.toFixed(0)}%`,
          `考试冲刺最佳分 ${state.minigameStats['knowledge-quiz'].bestScore}，已玩 ${state.minigameStats['knowledge-quiz'].playCount} 次`,
        ],
        progressTips: [
          state.exam.entranceExamTaken
            ? '本次考试已结算，后续以事件弹窗结果为准。'
            : '建议先打一局小游戏再点击参加考试。',
          `最近小游戏考试加成 ${state.exam.lastScoreBonus.toFixed(0)}%`,
        ],
      }
    case 'college':
      return {
        currentStageTitle: '大学成长阶段',
        currentStageDescription: isPostgameReplay
          ? '通关后的大学体验仍按毕业规则推进，高标准或普通毕业后都会转入大学毕业后工作。'
          : '推进课程、毕设与竞赛，优先冲高标准毕业，否则四年后普通毕业。',
        routeTitle: routeCard.title,
        routeDescription: isPostgameReplay
          ? '当前是通关后大学体验，不再重复判定主线通关，也不会自动跳转经营阶段。'
          : routeCard.description,
        nextGoalTitle: isPostgameReplay
          ? state.collegeScore >= thresholdFor(80)
            ? '下一关键节点：大学毕业后工作'
            : '下一关键节点：大学评价分'
          : state.collegeScore >= thresholdFor(80)
            ? '下一关键节点：高标准毕业'
            : '下一关键节点：大学评价分',
        nextGoalDescription: isPostgameReplay
          ? state.collegeScore >= thresholdFor(80)
            ? '大学评价分已达标，继续推进毕业流程后会以大学毕业身份进入毕业后工作阶段。'
            : '继续完成大学体验任务，补足评价分并推进毕业流程后会进入大学毕业后工作阶段。'
          : state.collegeScore >= thresholdFor(80)
            ? '大学评价分已达标，接下来补足声望即可进入经营阶段。'
            : '毕设攻坚和竞赛冲刺会提高大学评价分。',
        unlockConditions: isPostgameReplay
          ? state.collegeScore >= thresholdFor(80)
            ? [
                `大学评价分 ${state.collegeScore}`,
                `阶段累计 ${state.phaseElapsedMinutes} / 2880`,
                '毕业后将进入大学毕业后工作',
              ]
            : [
                `大学评价分达到 ${thresholdFor(80)}（当前 ${state.collegeScore}）`,
                `竞赛冲刺完成 ${collegeCompetitionCount} 次`,
                `阶段累计 ${state.phaseElapsedMinutes} / 2880`,
              ]
          : state.collegeScore >= thresholdFor(80)
            ? [
                `声望达到 ${thresholdFor(COLLEGE_TO_BUSINESS_REPUTATION)}（当前 ${state.reputation}）`,
                `大学评价分 ${state.collegeScore}`,
              ]
            : [
                `大学评价分达到 ${thresholdFor(80)}（当前 ${state.collegeScore}）`,
                `竞赛冲刺完成 ${collegeCompetitionCount} 次`,
                `当前声望 ${state.reputation}`,
              ],
        progressTips: [
          `课程链推进会逐步解锁更高收益任务，当前可接任务 ${availableTaskCount} 个`,
          `当前财富目标 ${state.money}/${wealthTarget}`,
        ],
      }
    case 'work-basic':
      return {
        currentStageTitle: '基础打工阶段',
        currentStageDescription: isPostgameReplay
          ? '当前处于通关后的基础打工体验，可继续积累金币、声望与知识，并随时返回通关补完。'
          : '积累金币、声望与成考所需知识；财富自由仍优先结算，满足成考资格时会先进入成考阶段。',
        routeTitle: routeCard.title,
        routeDescription: routeCard.description,
        nextGoalTitle: state.workPromotion ? '下一关键节点：经营或成考' : '下一关键节点：工作晋升',
        nextGoalDescription: isPostgameReplay
          ? '当前是通关后基础打工体验，可持续刷取资源并手动返回通关补完。'
          : state.workPromotion
            ? '晋升已完成后，知识和资金达标会先进入成考；未报名时继续补足声望也可保留经营资格。'
            : '加班冲业绩是当前关键任务，完成两次会触发工作晋升事件。',
        unlockConditions: state.workPromotion
          ? [
              `声望达到 ${thresholdFor(WORK_TO_BUSINESS_REPUTATION)}（当前 ${state.reputation}）`,
              `财富目标 ${state.money}/${wealthTarget}`,
              '已完成工作晋升事件',
            ]
          : [
              `加班冲业绩完成 2 次（当前 ${workOvertimeCount}）`,
              `当前声望 ${state.reputation}`,
              `成考报名知识 ${state.knowledge}/${thresholdFor(BASIC_WORK_ADULT_EXAM_KNOWLEDGE)}`,
              `成考报名资金 ${state.money}/${thresholdFor(BASIC_WORK_ADULT_EXAM_MONEY)}`,
              ...(adultExamRetakeHint ? [adultExamRetakeHint] : []),
            ],
        progressTips: [
          isPostgameReplay
            ? '这是通关后的自由体验，不再重复触发主线通关。'
            : '基础打工也可以直接靠金币通关，但经营路线通常更快。',
          `当前可接任务 ${availableTaskCount} 个`,
        ],
      }
    case 'adult-exam':
      return {
        currentStageTitle: '成人高考阶段',
        currentStageDescription: '通过成考后，主线进入边工边学；通关后入口则进入大学体验。',
        routeTitle: routeCard.title,
        routeDescription: routeCard.description,
        nextGoalTitle: '下一关键节点：成考结算',
        nextGoalDescription: state.exam.adultExamTaken
          ? '成人高考已经提交，等待事件结算。'
          : '可以先做成考复习或成考冲刺，再参加成人高考。',
        unlockConditions: [
          `当前成考通过率 ${examPassRate.toFixed(0)}%`,
          `入口类型 ${state.exam.adultExamEntryType === 'postgame' ? '通关后' : '主线'}`,
        ],
        progressTips: [
          `考试冲刺最佳分 ${state.minigameStats['knowledge-quiz'].bestScore}`,
          `当前财富目标 ${state.money}/${wealthTarget}`,
        ],
      }
    case 'work-study':
      return {
        currentStageTitle: '边工边学阶段',
        currentStageDescription: '固定保持边工边学，工作和学习效率较低，毕业后才会切到单独工作。',
        routeTitle: routeCard.title,
        routeDescription: routeCard.description,
        nextGoalTitle: '下一关键节点：成考毕业',
        nextGoalDescription: '学分、知识和声望达标可高标准毕业；四年后未达标则普通毕业。',
        unlockConditions: [
          `成考学分 ${state.adultCredits}/${getThreshold(state, ADULT_HIGH_GRADUATION_CREDITS)}`,
          `知识 ${state.knowledge}/${getThreshold(state, ADULT_HIGH_GRADUATION_KNOWLEDGE)}`,
          `声望 ${state.reputation}/${getThreshold(state, ADULT_HIGH_GRADUATION_REPUTATION)}`,
        ],
        progressTips: [
          `当前财富目标 ${state.money}/${wealthTarget}`,
          `阶段累计 ${state.phaseElapsedMinutes} / 2880`,
        ],
      }
    case 'work-advanced-college':
    case 'work-advanced-adult-high':
    case 'work-advanced-adult-normal':
      return {
        currentStageTitle: phaseLabels[state.phase],
        currentStageDescription:
          '毕业后工作阶段会按学历/毕业评价提供不同收益，仍可通过打工或转经营达成财富自由。',
        routeTitle: routeCard.title,
        routeDescription: routeCard.description,
        nextGoalTitle: '下一关键节点：财富自由或经营资格',
        nextGoalDescription: '优先检查财富自由；未通关时，声望与资金达标会进入经营阶段。',
        unlockConditions: [
          `当前资金 ${state.money}/${wealthTarget}`,
          `当前声望 ${state.reputation}`,
        ],
        progressTips: [
          `当前可接任务 ${availableTaskCount} 个`,
          '毕业后工作路线收益高于基础打工，低于经营路线。',
        ],
      }
    case 'business':
      return {
        currentStageTitle: '经营主线阶段',
        currentStageDescription: isPostgameReplay
          ? '当前处于通关后的经营体验，可持续刷取高收益并随时返回通关补完。'
          : '经营循环已经打开，继续提高金币效率并冲财富自由目标。',
        routeTitle: '经营阶段',
        routeDescription: '经营阶段是高收益路线，但不是唯一通关路径。',
        nextGoalTitle: isPostgameReplay ? '下一关键节点：经营体验循环' : '下一关键节点：主线通关',
        nextGoalDescription: isPostgameReplay
          ? '通关后不再重复判定主线通关，继续经营主要用于刷钱和补完收藏。'
          : '金币达到财富自由目标后会首次触发主线通关。',
        unlockConditions: [
          `管理团队完成 2 次（当前 ${bizTeamCount}） / 拓展客户完成 2 次（当前 ${bizSalesCount}）`,
          `自动化收益完成 1 次（当前 ${bizAutoProfitCount}）`,
          `金币达到 ${wealthTarget}（当前 ${state.money}）`,
        ],
        progressTips: [
          `当前可接任务 ${availableTaskCount} 个，优先把终局任务链解锁完整`,
          isPostgameReplay
            ? '这是通关后的经营体验，可持续刷取资源并手动返回通关补完。'
            : '主线通关后会进入补完阶段并开放商店。',
        ],
      }
    case 'postgame':
      return {
        currentStageTitle: '通关后阶段',
        currentStageDescription: '主线已经完成，后续目标是继续赚钱、补齐皮肤并完善图鉴。',
        routeTitle: '补完阶段',
        routeDescription: state.meta.collectionShopUnlocked
          ? '衣橱商店已开放，可以直接购买缺失皮肤。'
          : '衣橱商店尚未开放，但主线已进入自由补完循环。',
        nextGoalTitle: '下一关键节点：衣橱补完',
        nextGoalDescription: state.meta.collectionCompleted
          ? '当前图鉴已经补完，可以继续刷收益或尝试不同路线节奏。'
          : '继续经营赚钱，并通过衣橱商店入手未拥有的皮肤。',
        unlockConditions: [
          `已拥有皮肤 ${state.collection.ownedSkinIds.length} / ${totalSkinCount}`,
          `当前资金 ${state.money}`,
        ],
        progressTips: [
          `自动化收益已完成 ${bizAutoProfitCount} 次，后续以赚钱和收藏为主`,
          '事件记录继续保留节点履历，这里只负责告诉你下一步该补什么。',
        ],
      }
    default:
      return {
        currentStageTitle: phaseLabels[state.phase],
        currentStageDescription: '继续完成当前阶段任务，主线会按条件自动推进。',
        routeTitle: routeCard.title,
        routeDescription: routeCard.description,
        nextGoalTitle: '下一关键节点：人生阶段',
        nextGoalDescription: '完成当前可接任务并积累资源。',
        unlockConditions: [`财富目标 ${state.money}/${wealthTarget}`],
        progressTips: [`当前可接任务 ${availableTaskCount} 个`],
      }
  }
}

export const createGrowthBonusCards = ({
  state,
  storyGuide,
  availableTaskCount,
  sprintChargeMax,
  examPassRate,
  shopCardCount,
}: {
  state: PlayerState
  storyGuide: StoryGuide
  availableTaskCount: number
  sprintChargeMax: number
  examPassRate: number
  shopCardCount: number
}): GrowthBonusCard[] => [
  {
    title: '人生阶段',
    description: `当前阶段为 ${phaseLabels[state.phase]}，下一目标是「${storyGuide.nextGoalTitle}」。`,
  },
  {
    title: '任务收益',
    description: `当前可接任务 ${availableTaskCount} 个，加速槽 ${state.task.sprintCharge} / ${sprintChargeMax}。`,
  },
  {
    title: '考试加成',
    description: `当前考试通过率 ${examPassRate.toFixed(0)}%，最近小游戏加成 ${state.exam.lastScoreBonus.toFixed(0)}%。`,
  },
  {
    title: '商店进度',
    description: state.meta.collectionShopUnlocked
      ? `衣橱商店已开放，当前可入手 ${shopCardCount} 套皮肤。`
      : '主线通关后会开放衣橱商店，角色页会出现购买入口。',
  },
]

export const createProgressMapSteps = (state: PlayerState): ProgressMapStep[] => {
  const currentWorkAdvancedStepId =
    state.phase === 'work-advanced-adult-normal'
      ? 'work-advanced-adult-normal'
      : 'work-advanced-adult-high'

  const steps =
    state.route === 'work'
      ? [
          { id: 'highschool', label: '高中积累' },
          { id: 'exam', label: '高考阶段' },
          { id: 'work-basic', label: '基础打工' },
          { id: 'adult-exam', label: '成人高考' },
          { id: 'work-study', label: '边工边学' },
          {
            id: currentWorkAdvancedStepId,
            label:
              currentWorkAdvancedStepId === 'work-advanced-adult-normal'
                ? '成考普通毕业后工作'
                : '成考高标毕业后工作',
          },
          { id: 'business', label: '经营阶段' },
          { id: 'postgame', label: '通关后阶段' },
        ]
      : state.route === 'college'
        ? state.meta.mainCleared
          ? [
              { id: 'postgame', label: '通关后阶段' },
              { id: 'adult-exam', label: '成人高考' },
              { id: 'college', label: '大学体验' },
              { id: 'work-advanced-college', label: '大学毕业后工作' },
              { id: 'postgame-return', label: '返回通关后阶段' },
            ]
          : [
              { id: 'highschool', label: '高中积累' },
              { id: 'exam', label: '高考阶段' },
              { id: 'college', label: '大学成长' },
              { id: 'work-advanced-college', label: '大学毕业后工作' },
              { id: 'business', label: '经营阶段' },
              { id: 'postgame', label: '通关后阶段' },
            ]
        : [
            { id: 'highschool', label: '高中积累' },
            { id: 'exam', label: '高考阶段' },
            { id: 'route', label: '大学 / 打工' },
            { id: 'business', label: '经营阶段' },
            { id: 'postgame', label: '通关后阶段' },
          ]

  const currentOrder = [
    'highschool',
    'exam',
    'college',
    'work-basic',
    'adult-exam',
    'work-study',
    'work-advanced-college',
    'work-advanced-adult-high',
    'work-advanced-adult-normal',
    'business',
    'postgame',
  ]
  const currentIndex = currentOrder.indexOf(state.phase)

  return steps.map((step) => ({
    ...step,
    active: step.id === state.phase,
    done:
      step.id !== 'route' &&
      currentOrder.indexOf(step.id) >= 0 &&
      currentOrder.indexOf(step.id) < currentIndex,
  }))
}

export const getPanelHint = ({
  panelId,
  state,
  pendingEventId,
  nextGoalTitle,
  availableTaskCount,
  upgradableSkillCount,
  ownedSkinCount,
  totalSkinCount,
}: {
  panelId: PrimaryPanelId
  state: PlayerState
  pendingEventId: string | null
  nextGoalTitle: string
  availableTaskCount: number
  upgradableSkillCount: number
  ownedSkinCount: number
  totalSkinCount: number
}) => {
  switch (panelId) {
    case 'action':
      if (state.phase === 'exam' && !state.exam.entranceExamTaken) return '考试阶段'
      if (state.task.currentTaskId) return '进行中'
      if (state.task.queuedTaskIds.length > 0) return `${state.task.queuedTaskIds.length} 个排队中`
      return `${availableTaskCount} 个可选`
    case 'progress':
      return pendingEventId ? '有待处理' : nextGoalTitle
    case 'skill':
      return upgradableSkillCount > 0 ? `${upgradableSkillCount} 项可升级` : '查看成长'
    case 'role':
      return `${ownedSkinCount}/${totalSkinCount} 收集`
    case 'minigames':
      return '休闲放松'
  }
}

export const getPanelBadge = ({
  panelId,
  state,
  pendingEventId,
  visibleEventCount,
  upgradableSkillCount,
  collectionShopUnlocked,
  shopAvailableCount,
}: {
  panelId: PrimaryPanelId
  state: PlayerState
  pendingEventId: string | null
  visibleEventCount: number
  upgradableSkillCount: number
  collectionShopUnlocked: boolean
  shopAvailableCount: number
}) => {
  switch (panelId) {
    case 'action':
      return !state.task.currentTaskId && state.task.queuedTaskIds.length === 0 ? '!' : ''
    case 'progress':
      return pendingEventId ? '1' : visibleEventCount > 0 ? String(visibleEventCount) : ''
    case 'skill':
      return upgradableSkillCount > 0 ? String(upgradableSkillCount) : ''
    case 'role':
      return collectionShopUnlocked && shopAvailableCount > 0 ? String(shopAvailableCount) : ''
    case 'minigames':
      return ''
    default:
      return ''
  }
}

export const createPhaseProgressCard = ({
  state,
  storyGuide,
  availableTaskCount,
  totalSkinCount,
  shopCardCount,
  examPassRate,
  adultExamRetakeHint,
}: {
  state: PlayerState
  storyGuide: StoryGuide
  availableTaskCount: number
  totalSkinCount: number
  shopCardCount: number
  examPassRate: number
  adultExamRetakeHint: string
}): PhaseProgressCard => {
  const guide = storyGuide
  const collegeCompetitionCount = state.taskCompletionCount['college-competition'] ?? 0
  const workOvertimeCount = state.taskCompletionCount['work-overtime'] ?? 0
  const bizAutoProfitCount = state.taskCompletionCount['biz-auto-profit'] ?? 0
  const bizTeamCount = state.taskCompletionCount['biz-team'] ?? 0
  const bizSalesCount = state.taskCompletionCount['biz-sales'] ?? 0

  switch (state.phase) {
    case 'highschool':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `知识 ${state.knowledge}/${getThreshold(state, HIGHSCHOOL_TO_EXAM_KNOWLEDGE)}`,
          `备考 ${state.exam.prepProgress}/${getThreshold(state, HIGHSCHOOL_TO_EXAM_PREP)}`,
          `通过率 ${examPassRate.toFixed(0)}%`,
        ],
      }
    case 'exam':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `正式通过率 ${examPassRate.toFixed(0)}%`,
          `最佳分 ${state.minigameStats['knowledge-quiz'].bestScore}`,
          `最近加成 ${state.exam.lastScoreBonus.toFixed(0)}%`,
        ],
      }
    case 'college':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `竞赛冲刺 ${collegeCompetitionCount}/2`,
          `评价分 ${state.collegeScore}/${getThreshold(state, 80)}`,
          state.meta.mainCleared
            ? `阶段累计 ${state.phaseElapsedMinutes} / 2880`
            : `声望 ${state.reputation}/${getThreshold(state, COLLEGE_TO_BUSINESS_REPUTATION)}`,
        ],
      }
    case 'work-basic':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `加班冲业绩 ${workOvertimeCount}/2`,
          `工作晋升 ${state.workPromotion ? '已完成' : '未完成'}`,
          `声望 ${state.reputation}/${getThreshold(state, WORK_TO_BUSINESS_REPUTATION)}`,
          ...(adultExamRetakeHint ? [adultExamRetakeHint] : []),
        ],
      }
    case 'adult-exam':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `通过率 ${examPassRate.toFixed(0)}%`,
          `最近加成 ${state.exam.lastScoreBonus.toFixed(0)}%`,
          `入口 ${state.exam.adultExamEntryType === 'postgame' ? '通关后' : '主线'}`,
        ],
      }
    case 'work-study':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `学分 ${state.adultCredits}/${getThreshold(state, ADULT_HIGH_GRADUATION_CREDITS)}`,
          `知识 ${state.knowledge}/${getThreshold(state, ADULT_HIGH_GRADUATION_KNOWLEDGE)}`,
          `声望 ${state.reputation}/${getThreshold(state, ADULT_HIGH_GRADUATION_REPUTATION)}`,
        ],
      }
    case 'work-advanced-college':
    case 'work-advanced-adult-high':
    case 'work-advanced-adult-normal':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `资金 ${state.money}/${getWealthFreeTarget(state)}`,
          `声望 ${state.reputation}`,
          `可接任务 ${availableTaskCount}`,
        ],
      }
    case 'business':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `管理团队 ${bizTeamCount}/2`,
          `拓展客户 ${bizSalesCount}/2`,
          `自动化收益 ${bizAutoProfitCount}/1`,
          `资金 ${state.money}/${getWealthFreeTarget(state)}`,
        ],
      }
    case 'postgame':
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [
          `已拥有 ${state.collection.ownedSkinIds.length}/${totalSkinCount}`,
          `剩余 ${shopCardCount}`,
          `资金 ${state.money}`,
        ],
      }
    default:
      return {
        title: guide.nextGoalTitle,
        description: guide.nextGoalDescription,
        metrics: [`资金 ${state.money}/${getWealthFreeTarget(state)}`],
      }
  }
}
