import { describe, expect, it } from 'vitest'

import { getGameHomeRouteLocation, getGamePlayRouteLocation } from './navigation'

describe('router navigation helpers', () => {
  it('应使用命名路由定位游戏首页', () => {
    expect(getGameHomeRouteLocation('2048')).toEqual({
      name: 'game.2048.home',
    })
  })

  it('应使用命名路由和 query 定位游戏对局页', () => {
    expect(getGamePlayRouteLocation('reversi', { mode: 'ai' })).toEqual({
      name: 'game.reversi.play',
      query: { mode: 'ai' },
    })
  })
})
