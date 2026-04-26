import type { RewardSet } from '../types'

const resourceNames: Record<keyof RewardSet, string> = {
  exp: '经验',
  money: '金钱',
  knowledge: '知识',
  reputation: '声望',
}

export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.max(0, Math.ceil(seconds))}秒`
  const mins = Math.floor(seconds / 60)
  const rest = Math.max(0, Math.ceil(seconds % 60))
  return rest > 0 ? `${mins}分${rest}秒` : `${mins}分钟`
}

export const formatGameMinutes = (minutes: number) => `${minutes}分钟`

export const formatRewardSet = (rewards: RewardSet) =>
  (Object.entries(rewards) as Array<[keyof RewardSet, number | undefined]>)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => `${resourceNames[key]} +${value}`)
    .join(' · ')
