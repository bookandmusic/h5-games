import type { RouteRecordRaw, RouteRecordSingleView } from 'vue-router'

import type { Game } from '../types/game'
import type { AppPage, AppRouteMeta } from './meta'

type RouteComponent = Exclude<RouteRecordRaw['component'], null | undefined>

export interface GameRouteManifest {
  page: string
  path: string
  component: RouteComponent
  appPage: AppPage
  requiresLeaveGuard?: boolean
  triggersCleanupOnLeave?: boolean
}

export interface GameManifest {
  game: Omit<Game, 'route' | 'routeName'> & { order: number }
  routes: GameRouteManifest[]
}

const modules = import.meta.glob<{ gameManifest: GameManifest }>('../games/*/manifest.ts', {
  eager: true,
})

const manifests = Object.values(modules)
  .map((mod) => mod.gameManifest)
  .sort((a, b) => a.game.order - b.game.order)

function getRouteName(gameId: string, page: string): string {
  return `game.${gameId}.${page}`
}

export function getGameCatalog(): Game[] {
  return manifests.map(({ game, routes }) => {
    const homeRoute = routes.find((route) => route.page === 'home')

    if (!homeRoute) {
      throw new Error(`Game "${game.id}" is missing a home route manifest`)
    }

    return {
      ...game,
      route: homeRoute.path,
      routeName: getRouteName(game.id, homeRoute.page),
    }
  })
}

export function getGameRouteRecords(): RouteRecordRaw[] {
  return manifests.flatMap(({ game, routes }) =>
    routes.map((route) => {
      const routeRecord: RouteRecordSingleView = {
        path: route.path,
        name: getRouteName(game.id, route.page),
        component: route.component,
        meta: {
          appPage: route.appPage,
          gameId: game.id,
          requiresLeaveGuard: route.requiresLeaveGuard ?? false,
          triggersCleanupOnLeave: route.triggersCleanupOnLeave ?? true,
        } satisfies AppRouteMeta,
      }

      return routeRecord
    })
  )
}

export function getGameRouteName(gameId: string, page: string): string {
  return getRouteName(gameId, page)
}
