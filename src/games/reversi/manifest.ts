import type { GameManifest } from '../../router/manifests'

export const gameManifest: GameManifest = {
  game: {
    id: 'reversi',
    order: 3,
    name: '黑白棋',
    category: '棋类',
    description: '经典黑白翻转棋，支持人机对战与双人对战，可选四档难度',
    icon: '/assets/games/reversi.png',
    recordType: 'score',
  },
  routes: [
    {
      page: 'home',
      path: '/game/reversi',
      component: () => import('./Home.vue'),
      appPage: 'game-home',
    },
    {
      page: 'play',
      path: '/game/reversi/play',
      component: () => import('./index.vue'),
      appPage: 'game-play',
      requiresLeaveGuard: true,
      triggersCleanupOnLeave: true,
    },
  ],
}
