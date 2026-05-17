import { useRouter } from 'vue-router'

export function useGameNavigation(gameId: string) {
  const router = useRouter()

  function exitGame() {
    router.replace('/')
  }

  function goToPlay() {
    router.push(`/game/${gameId}/play`)
  }

  function goToHome() {
    router.replace(`/game/${gameId}`)
  }

  return { exitGame, goToPlay, goToHome }
}
