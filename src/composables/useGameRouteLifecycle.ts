import type { RouteLocationNormalized } from 'vue-router'

type LeaveGuard = (from: RouteLocationNormalized) => Promise<boolean> | boolean

const leaveGuards = new Map<string, LeaveGuard>()
const cleanups = new Map<string, Set<() => void>>()

function runCleanups(gameId: string) {
  const gameCleanups = cleanups.get(gameId)
  if (!gameCleanups) return
  gameCleanups.forEach((fn) => {
    try {
      fn()
    } catch {
      // ignore cleanup errors
    }
  })
  gameCleanups.clear()
}

export function useGameRouteLifecycle() {
  function registerCleanup(gameId: string, fn: () => void) {
    if (!cleanups.has(gameId)) {
      cleanups.set(gameId, new Set())
    }
    cleanups.get(gameId)!.add(fn)
    return () => {
      cleanups.get(gameId)?.delete(fn)
    }
  }

  function runGameCleanups(gameId: string) {
    runCleanups(gameId)
  }

  async function runLeaveGuard(gameId: string, from: RouteLocationNormalized): Promise<boolean> {
    const guard = leaveGuards.get(gameId)
    if (!guard) return true
    return await guard(from)
  }

  return {
    registerCleanup,
    runGameCleanups,
    runLeaveGuard,
  }
}
