import type { SkillDefinition } from './types'

export const skillDefinitions: SkillDefinition[] = [
  {
    id: 'study',
    name: '学习力',
    description: '提升学习与备考收益，并显著提高高考与成考的分数修正。',
    maxLevel: 6,
    costCurve: [0, 20, 45, 80, 130, 200, 280],
    iconId: 'icon-skill-study',
  },
  {
    id: 'focus',
    name: '专注力',
    description: '降低长时任务失败率，也让考试冲刺的容错更高。',
    maxLevel: 6,
    costCurve: [0, 18, 42, 78, 120, 175, 245],
    iconId: 'icon-skill-focus',
  },
  {
    id: 'action',
    name: '行动力',
    description: '强化点击缩时与冲刺推进倍率，是主动玩法的核心技能。',
    maxLevel: 6,
    costCurve: [0, 18, 40, 72, 115, 168, 235],
    iconId: 'icon-skill-action',
  },
  {
    id: 'social',
    name: '社交力',
    description: '提升项目、兼职、工作类任务的金钱与声望收益。',
    maxLevel: 6,
    costCurve: [0, 16, 36, 66, 104, 150, 210],
    iconId: 'icon-skill-social',
  },
  {
    id: 'business',
    name: '商业力',
    description: '提高经营阶段任务收益，并放大经营冲刺的回报。',
    maxLevel: 6,
    costCurve: [0, 26, 60, 104, 160, 228, 308],
    iconId: 'icon-skill-business',
  },
]
