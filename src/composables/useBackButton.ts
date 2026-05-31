import { useRouter } from 'vue-router'
import { useGameRouteLifecycle } from './useGameRouteLifecycle'
import { getGameHomeRouteLocation } from '../router/navigation'
import type { PluginListener } from '@tauri-apps/api/core'

export type NavEntry =
  | { page: 'home' }
  | { page: 'game-home'; gameId: string }
  | { page: 'game-play'; gameId: string }

const MAX_STACK = 20
const navStack: NavEntry[] = []
let initialized = false
let unlisten: PluginListener | null = null

function isSameEntry(a: NavEntry, b: NavEntry): boolean {
  if (a.page !== b.page) return false
  if (a.page === 'home') return true
  type GameEntry = Extract<NavEntry, { gameId: string }>
  return (a as GameEntry).gameId === (b as GameEntry).gameId
}

export function pushEntry(entry: NavEntry) {
  if (navStack.length >= MAX_STACK) {
    navStack.shift()
  }
  const prev = navStack.at(-1)
  if (prev && isSameEntry(prev, entry)) {
    return
  }
  navStack.push(entry)
}

export function clearStack() {
  navStack.length = 0
}

export function useBackButton() {
  const router = useRouter()

  async function setup() {
    if (initialized) return
    initialized = true

    try {
      const { onBackButtonPress } = await import('@tauri-apps/api/app')
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const { runLeaveGuard, runGameCleanups } = useGameRouteLifecycle()

      unlisten = await onBackButtonPress(async () => {
        const entry = navStack.pop()
        if (!entry) {
          await getCurrentWindow().destroy()
          return
        }

        const gameEntry = entry.page === 'game-play' || entry.page === 'game-home' ? entry : null

        if (gameEntry) {
          const canLeave = await runLeaveGuard(gameEntry.gameId, router.currentRoute.value)
          if (!canLeave) {
            navStack.push(entry)
            return
          }
          runGameCleanups(gameEntry.gameId)
        }

        switch (entry.page) {
          case 'home':
            await getCurrentWindow().destroy()
            break
          case 'game-home':
            router.replace({ name: 'home' })
            break
          case 'game-play':
            router.replace(getGameHomeRouteLocation(entry.gameId))
            break
        }
      })
    } catch {
      // not running in Tauri
    }
  }

  function teardown() {
    if (unlisten) {
      unlisten.unregister()
      unlisten = null
    }
    initialized = false
  }

  return { setup, teardown }
}
