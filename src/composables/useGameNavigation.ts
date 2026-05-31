import { useRouter } from 'vue-router'
import type { LocationQueryRaw, RouteParamsRawGeneric } from 'vue-router'

import {
  getGameHomeRouteLocation,
  getGamePlayRouteLocation,
  getGameRouteLocation,
} from '../router/navigation'
import { markReplaceNav } from '../router/index'

export function useGameNavigation(gameId: string) {
  const router = useRouter()

  function exitGame() {
    markReplaceNav()
    router.replace({ name: 'home' })
  }

  function goToPlay(query?: LocationQueryRaw) {
    router.push(getGamePlayRouteLocation(gameId, query))
  }

  function goToHome() {
    markReplaceNav()
    router.replace(getGameHomeRouteLocation(gameId))
  }

  function goToPage(
    page: string,
    options?: { params?: RouteParamsRawGeneric; query?: LocationQueryRaw }
  ) {
    router.push(getGameRouteLocation(gameId, page, options))
  }

  return { exitGame, goToPlay, goToHome, goToPage }
}
