import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: () => import('../views/GameView.vue'),
    children: [
      {
        path: 'play',
        name: 'GamePlay',
        component: () => import('../views/GameView.vue'),
      },
      {
        path: 'settings',
        name: 'GameSettings',
        component: () => import('../views/GameView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
