import { ref } from 'vue'

import { HINT_COST, UNDO_COST } from '../constants'
import type { DiskColor, GameMode, Move } from '../types'

export function useReversiItems(
  isSinglePlayer: boolean,
  canHumanAct: boolean,
  onSetHint: (move: Move | null) => void,
  onSpendCoins: (amount: number) => Promise<boolean>,
  onGetAiHint: () => Move | null
) {
  const showResultDialog = ref(false)
  const showExitConfirm = ref(false)
  const showStartSetup = ref(false)
  const pendingSetupMode = ref<GameMode | null>(null)

  const canUndo = async (): Promise<boolean> => {
    if (!isSinglePlayer) return false
    return await onSpendCoins(UNDO_COST)
  }

  const commitUndo = () => {
    onSetHint(null)
    showResultDialog.value = false
  }

  const handleHint = async (_humanSide: DiskColor): Promise<Move | null> => {
    if (!isSinglePlayer || !canHumanAct) return null
    const spent = await onSpendCoins(HINT_COST)
    if (!spent) return null

    const suggestion = onGetAiHint()
    if (!suggestion) return null
    onSetHint(suggestion)
    return suggestion
  }

  return {
    showResultDialog,
    showExitConfirm,
    showStartSetup,
    pendingSetupMode,
    canUndo,
    commitUndo,
    handleHint,
  }
}
