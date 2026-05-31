import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useGameRouteLifecycle } from '../composables/useGameRouteLifecycle'
import { pushEntry } from '../composables/useBackButton'
import { getGameRouteRecords } from './manifests'
import type { AppRouteMeta } from './meta'

function getRouteMeta(route: { meta: unknown }): AppRouteMeta {
  return (route.meta ?? {}) as AppRouteMeta
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { appPage: 'home' },
  },
  ...getGameRouteRecords(),
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
]

const router = createRouter({ history: createWebHistory(), routes })

let isReplaceNav = false

export function markReplaceNav() {
  isReplaceNav = true
}

router.beforeEach(async (to, from) => {
  const fromMeta = getRouteMeta(from)
  const toMeta = getRouteMeta(to)
  const fromGameId = fromMeta.gameId ?? null
  const toGameId = toMeta.gameId ?? null

  if (!fromGameId) return

  const isSameGame = fromGameId === toGameId
  const isLeavingPlay = fromMeta.appPage === 'game-play' && toMeta.appPage !== 'game-play'

  const { runLeaveGuard, runGameCleanups } = useGameRouteLifecycle()

  if (isLeavingPlay && fromMeta.requiresLeaveGuard) {
    const canLeave = await runLeaveGuard(fromGameId, from)
    if (!canLeave) return false
  }

  if (!isSameGame && fromMeta.triggersCleanupOnLeave) {
    runGameCleanups(fromGameId)
  }
})

router.afterEach((to) => {
  if (isReplaceNav) {
    isReplaceNav = false
    return
  }
  const meta = getRouteMeta(to)
  const gameId = meta.gameId
  if (gameId) {
    pushEntry({
      page: meta.appPage === 'game-play' ? 'game-play' : 'game-home',
      gameId,
    })
  } else if (to.name === 'home') {
    pushEntry({ page: 'home' })
  }
})

export default router
