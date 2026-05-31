import type { GameManifest } from '../../router/manifests'

export const gameManifest: GameManifest = {
  game: {
    id: 'chinese-chess',
    order: 2,
    name: '中国象棋',
    category: '棋类',
    description: '支持人机与双人对战，可选难度、执红执黑与先后手',
    icon: '/assets/games/chinese-chess.png',
    recordType: 'score',
  },
  routes: [
    {
      page: 'home',
      path: '/game/chinese-chess',
      component: () => import('./Home.vue'),
      appPage: 'game-home',
    },
    {
      page: 'play',
      path: '/game/chinese-chess/play',
      component: () => import('./index.vue'),
      appPage: 'game-play',
      requiresLeaveGuard: true,
      triggersCleanupOnLeave: true,
    },
  ],
}
