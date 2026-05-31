import type { GameManifest } from '../../router/manifests'

export const gameManifest: GameManifest = {
  game: {
    id: 'star-chart-parallel-planes',
    order: 4,
    name: '星魂录',
    category: '收集',
    description: '翻转星魂卡牌，收集108位平行位面美少女，破译时空波动',
    icon: '/assets/games/star-chart.png',
    recordType: 'score',
  },
  routes: [
    {
      page: 'home',
      path: '/game/star-chart-parallel-planes',
      component: () => import('./Home.vue'),
      appPage: 'game-home',
    },
    {
      page: 'play',
      path: '/game/star-chart-parallel-planes/play',
      component: () => import('./index.vue'),
      appPage: 'game-play',
      requiresLeaveGuard: true,
      triggersCleanupOnLeave: true,
    },
    {
      page: 'map',
      path: '/game/star-chart-parallel-planes/map',
      component: () => import('./GalleryMap.vue'),
      appPage: 'game-subpage',
    },
    {
      page: 'shop',
      path: '/game/star-chart-parallel-planes/shop',
      component: () => import('./Shop.vue'),
      appPage: 'game-subpage',
    },
    {
      page: 'universe',
      path: '/game/star-chart-parallel-planes/universe/:themeId',
      component: () => import('./Universe.vue'),
      appPage: 'game-subpage',
    },
  ],
}
