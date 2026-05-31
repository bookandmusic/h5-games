import { describe, expect, it } from 'vitest'

import { getGameCatalog, getGameRouteRecords } from './manifests'

describe('router manifests', () => {
  it('应从 manifest 聚合游戏目录，并为首页提供命名路由', () => {
    const games = getGameCatalog()
    const game2048 = games.find((game) => game.id === '2048')

    expect(game2048).toBeDefined()
    expect(game2048?.route).toBe('/game/2048')
    expect(game2048?.routeName).toBe('game.2048.home')
  })

  it('应为所有游戏路由注入统一 meta 语义', () => {
    const routes = getGameRouteRecords()
    const playRoute = routes.find((route) => route.name === 'game.star-chart-parallel-planes.play')

    expect(playRoute).toBeDefined()
    expect(playRoute?.meta).toMatchObject({
      appPage: 'game-play',
      gameId: 'star-chart-parallel-planes',
      requiresLeaveGuard: true,
    })
  })
})
