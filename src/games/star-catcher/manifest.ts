import type { GameManifest } from '../../router/manifests'

export const gameManifest: GameManifest = {
  game: {
    id: 'star-catcher',
    order: 5,
    name: '星际捕手',
    category: '益智',
    description: '点击收集掉落的星辰宝石，躲避陨石，挑战连击最高分！',
    icon: '/assets/games/star-catcher.png',
    recordType: 'score',
  },
  routes: [
    {
      page: 'home',
      path: '/game/star-catcher',
      component: () => import('./Home.vue'),
      appPage: 'game-home',
    },
    {
      page: 'play',
      path: '/game/star-catcher/play',
      component: () => import('./index.vue'),
      appPage: 'game-play',
      requiresLeaveGuard: true,
      triggersCleanupOnLeave: true,
    },
  ],
}
