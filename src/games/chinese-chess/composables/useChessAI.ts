import { type Ref, computed, ref } from 'vue'

import { chooseAiMove } from '../ai'
import type { Board, Difficulty, GameMode, Move, PieceColor } from '../types'

export function useChessAI(
  board: Ref<Board>,
  currentTurn: Ref<PieceColor>,
  winner: Ref<PieceColor | null>
) {
  const thinking = ref(false)
  const activeMode = ref<GameMode>('ai')
  const activeDifficulty = ref<Difficulty>('medium')
  const activeHumanSide = ref<PieceColor>('red')

  let aiTimer: number | null = null

  const aiSide = computed<PieceColor>(() => (activeHumanSide.value === 'red' ? 'black' : 'red'))

  const isAiTurn = computed(
    () => activeMode.value === 'ai' && winner.value === null && currentTurn.value === aiSide.value
  )

  const isSinglePlayer = computed(() => activeMode.value === 'ai')

  const canHumanAct = computed(
    () => activeMode.value === 'local' || currentTurn.value === activeHumanSide.value
  )

  const clearAiTimer = () => {
    if (aiTimer !== null) {
      window.clearTimeout(aiTimer)
      aiTimer = null
    }
  }

  const getAiDelay = () => {
    switch (activeDifficulty.value) {
      case 'easy':
        return 500 + Math.random() * 800
      case 'medium':
        return 1000 + Math.random() * 1200
      case 'hard':
        return 1500 + Math.random() * 2000
      case 'hardest':
        return 2000 + Math.random() * 2500
    }
  }

  const performAiMove = (onMove: (move: Move) => void, onSyncWinner: () => void) => {
    if (!isAiTurn.value || thinking.value) return
    thinking.value = true
    aiTimer = window.setTimeout(() => {
      const move = chooseAiMove(board.value, currentTurn.value, activeDifficulty.value)
      thinking.value = false
      aiTimer = null
      if (!move) {
        onSyncWinner()
        return
      }
      onMove(move)
    }, getAiDelay())
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
    if (!isSinglePlayer.value || currentTurn.value !== activeHumanSide.value) {
      return null
    }
    return chooseAiMove(board.value, activeHumanSide.value, activeDifficulty.value)
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
