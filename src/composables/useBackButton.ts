import { useRouter } from 'vue-router'
import { useGameRouteLifecycle } from './useGameRouteLifecycle'

type NavEntry =
  | { page: 'home' }
  | { page: 'game-home'; gameId: string }
  | { page: 'game-play'; gameId: string }

const MAX_STACK = 20
const navStack: NavEntry[] = []
let initialized = false

/**
 * Returns true when two entries are semantically the same page.
 */
function isSameEntry(a: NavEntry, b: NavEntry): boolean {
  if (a.page !== b.page) return false
  if (a.page === 'home') return true
  type GameEntry = Extract<NavEntry, { gameId: string }>
  return (a as GameEntry).gameId === (b as GameEntry).gameId
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

      await onBackButtonPress(async () => {
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
            router.replace('/')
            break
          case 'game-play':
            router.replace(`/game/${entry.gameId}`)
            break
        }
      })
    } catch {
      // not running in Tauri
    }
  }

  function pushEntry(entry: NavEntry) {
    if (navStack.length >= MAX_STACK) {
      navStack.shift()
    }
    const prev = navStack.at(-1)
    if (prev && isSameEntry(prev, entry)) {
      return
    }
    navStack.push(entry)
  }

  function clearStack() {
    navStack.length = 0
  }

  return { setup, pushEntry, clearStack }
}
