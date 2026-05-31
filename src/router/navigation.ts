import type { LocationQueryRaw, RouteLocationRaw, RouteParamsRawGeneric } from 'vue-router'

import { getGameRouteName } from './manifests'

interface GameRouteLocationOptions {
  params?: RouteParamsRawGeneric
  query?: LocationQueryRaw
}

export function getGameRouteLocation(
  gameId: string,
  page: string,
  options: GameRouteLocationOptions = {}
): RouteLocationRaw {
  return {
    name: getGameRouteName(gameId, page),
    ...(options.params ? { params: options.params } : {}),
    ...(options.query ? { query: options.query } : {}),
  }
}

export function getGameHomeRouteLocation(gameId: string): RouteLocationRaw {
  return getGameRouteLocation(gameId, 'home')
}

export function getGamePlayRouteLocation(
  gameId: string,
  query?: LocationQueryRaw
): RouteLocationRaw {
  return getGameRouteLocation(gameId, 'play', { query })
}
