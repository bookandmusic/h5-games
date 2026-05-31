export type AppPage = 'home' | 'game-home' | 'game-play' | 'game-subpage'

export interface AppRouteMeta {
  appPage: AppPage
  gameId?: string
  requiresLeaveGuard?: boolean
  triggersCleanupOnLeave?: boolean
}
