import type { GameManifest } from '../../router/manifests'

export const gameManifest: GameManifest = {
  game: {
    id: '2048',
    order: 1,
    dir: 'game2048',
    name: '2048',
    category: '益智',
    description: '经典数字合成游戏，移动方块将相同数字合并，目标是达到2048',
    icon: '/assets/games/2048.png',
    recordType: 'score',
  },
  routes: [
    {
      page: 'home',
      path: '/game/2048',
      component: () => import('./Home.vue'),
      appPage: 'game-home',
    },
    {
      page: 'play',
      path: '/game/2048/play',
      component: () => import('./index.vue'),
      appPage: 'game-play',
      requiresLeaveGuard: true,
      triggersCleanupOnLeave: true,
    },
  ],
}
