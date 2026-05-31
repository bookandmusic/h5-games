import { type Ref, computed, ref } from 'vue'

import { getAIMove } from '../ai'
import type { Board, Difficulty, DiskColor, GameMode, Move } from '../types'

export function useReversiAI(
  board: Ref<Board>,
  currentPlayer: Ref<DiskColor>,
  status: Ref<string>
) {
  const thinking = ref(false)
  const activeMode = ref<GameMode>('ai')
  const activeDifficulty = ref<Difficulty>('medium')
  const activeHumanSide = ref<DiskColor>('black')

  let aiTimer: ReturnType<typeof setTimeout> | null = null

  const aiSide = computed<DiskColor>(() => (activeHumanSide.value === 'black' ? 'white' : 'black'))

  const isAiTurn = computed(
    () =>
      activeMode.value === 'ai' &&
      status.value === 'playing' &&
      currentPlayer.value === aiSide.value
  )

  const isSinglePlayer = computed(() => activeMode.value === 'ai')

  const canHumanAct = computed(
    () => activeMode.value === 'local' || currentPlayer.value === activeHumanSide.value
  )

  const clearAiTimer = () => {
    if (aiTimer !== null) {
      clearTimeout(aiTimer)
      aiTimer = null
    }
  }

  const getAiDelay = () => {
    switch (activeDifficulty.value) {
      case 'easy':
        return 500 + Math.random() * 600
      case 'medium':
        return 800 + Math.random() * 1000
      case 'hard':
        return 1200 + Math.random() * 1500
      case 'expert':
        return 1500 + Math.random() * 2000
    }
  }

  const performAiMove = (onMove: (move: Move) => void, onSkip: () => void) => {
    if (!isAiTurn.value || thinking.value) return
    thinking.value = true
    aiTimer = setTimeout(() => {
      const move = getAIMove(board.value, currentPlayer.value, activeDifficulty.value)
      thinking.value = false
      aiTimer = null
      if (!move) {
        onSkip()
        return
      }
      onMove(move)
    }, getAiDelay())
  }

  const startGame = (config: { mode: GameMode; difficulty: Difficulty; humanSide: DiskColor }) => {
    clearAiTimer()
    thinking.value = false
    activeMode.value = config.mode
    activeDifficulty.value = config.mode === 'ai' ? config.difficulty : 'medium'
    activeHumanSide.value = config.mode === 'ai' ? config.humanSide : 'black'
  }

  const getHint = (): Move | null => {
    if (!isSinglePlayer.value || currentPlayer.value !== activeHumanSide.value) {
      return null
    }
    return getAIMove(board.value, activeHumanSide.value, activeDifficulty.value)
  }

  return {
    thinking,
    activeMode,
    activeDifficulty,
    activeHumanSide,
    aiSide,
    isAiTurn,
    isSinglePlayer,
    canHumanAct,
    clearAiTimer,
    performAiMove,
    startGame,
    getHint,
  }
}
