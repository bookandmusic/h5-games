import type { MiniGameDefinition } from './types'

export const minigameDefinitions: MiniGameDefinition[] = [
  {
    id: 'knowledge-quiz',
    name: '知识闯关',
    iconId: 'icon-minigame-knowledge-quiz',
    backgroundId: 'bg-mg-knowledge-quiz',
    unlockRequirements: [],
    description: '限时快速答题，连续答对有加成，获得经验与知识。',
  },
  {
    id: 'part-time-rush',
    name: '兼职打工',
    iconId: 'icon-minigame-part-time-rush',
    backgroundId: 'bg-mg-part-time-rush',
    unlockRequirements: [],
    description: '打地鼠玩法完成兼职订单，考验反应与判断，获得经验与金钱。',
  },
  {
    id: 'biz-auction',
    name: '商业竞价',
    iconId: 'icon-minigame-biz-auction',
    backgroundId: 'bg-mg-biz-auction',
    unlockRequirements: [],
    description: '限时竞价拍卖，低买高赚考验商业判断，获得金钱与声望。',
  },
]
