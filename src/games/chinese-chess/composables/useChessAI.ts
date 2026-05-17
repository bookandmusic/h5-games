import { computed, ref } from 'vue'

import { chooseAiMove } from '../ai'
import type { Board, Difficulty, GameMode, Move, PieceColor } from '../types'

export function useChessAI(board: Board, currentTurn: PieceColor, winner: PieceColor | null) {
  const thinking = ref(false)
  const activeMode = ref<GameMode>('ai')
  const activeDifficulty = ref<Difficulty>('medium')
  const activeHumanSide = ref<PieceColor>('red')

  let aiTimer: number | null = null

  const aiSide = computed<PieceColor>(() => (activeHumanSide.value === 'red' ? 'black' : 'red'))

  const isAiTurn = computed(
    () => activeMode.value === 'ai' && winner === null && currentTurn === aiSide.value
  )

  const isSinglePlayer = computed(() => activeMode.value === 'ai')

  const canHumanAct = computed(
    () => activeMode.value === 'local' || currentTurn === activeHumanSide.value
  )

  const clearAiTimer = () => {
    if (aiTimer !== null) {
      window.clearTimeout(aiTimer)
      aiTimer = null
    }
  }

  const performAiMove = (onMove: (move: Move) => void, onSyncWinner: () => void) => {
    if (!isAiTurn.value || thinking.value) return
    thinking.value = true
    aiTimer = window.setTimeout(
      () => {
        const move = chooseAiMove(board, currentTurn, activeDifficulty.value)
        thinking.value = false
        aiTimer = null
        if (!move) {
          onSyncWinner()
          return
        }
        onMove(move)
      },
      1500 + Math.random() * 2000
    )
  }

  const startGame = (config: {
    mode: GameMode
    difficulty: Difficulty
    startingSide: PieceColor
  }) => {
    clearAiTimer()
    thinking.value = false
    activeMode.value = config.mode
    activeDifficulty.value = config.mode === 'ai' ? config.difficulty : 'medium'
    activeHumanSide.value = config.mode === 'ai' ? config.startingSide : 'red'
  }

  const getHint = (): Move | null => {
    if (!isSinglePlayer.value || currentTurn !== activeHumanSide.value) {
      return null
    }
    return chooseAiMove(board, activeHumanSide.value, activeDifficulty.value)
  }

  return {
    thinking,
    activeMode,
    activeDifficulty,
    activeHumanSide,
    aiTimer,
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
