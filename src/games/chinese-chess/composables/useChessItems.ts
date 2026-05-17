import { ref } from 'vue'

import type { Board, GameMode, Move, PieceColor } from '../types'

export function useChessItems(
  isSinglePlayer: boolean,
  moveHistory: Array<{ board: Board; turn: PieceColor; moveCount: number }>,
  onRestoreState: (state: { board: Board; turn: PieceColor; moveCount: number }) => void,
  onClearSelection: () => void,
  onSetHint: (move: Move | null) => void,
  onSpendUndo: () => Promise<boolean>,
  onSpendHint: () => Promise<boolean>,
  onGetAiMove: (side: PieceColor) => Move | null,
  _onGenerateLegalMoves: (board: Board, color: PieceColor) => Move[],
  currentTurn: PieceColor
) {
  const showResultDialog = ref(false)
  const showExitConfirm = ref(false)
  const showStartSetup = ref(false)
  const pendingSetupMode = ref<GameMode | null>(null)

  const handleUndo = async () => {
    if (!isSinglePlayer || moveHistory.length === 0) return
    const spent = await onSpendUndo()
    if (!spent) return

    const steps = Math.min(2, moveHistory.length)
    const saved = moveHistory.splice(-steps, steps)[0]
    onRestoreState({
      board: saved.board,
      turn: saved.turn,
      moveCount: saved.moveCount,
    })
    onClearSelection()
    onSetHint(null)
    showResultDialog.value = false
  }

  const handleHint = async (humanSide: PieceColor, _board: Board) => {
    if (!isSinglePlayer || currentTurn !== humanSide) return
    const spent = await onSpendHint()
    if (!spent) return

    const suggestion = onGetAiMove(humanSide)
    if (!suggestion) return
    onSetHint(suggestion)
  }

  return {
    showResultDialog,
    showExitConfirm,
    showStartSetup,
    pendingSetupMode,
    handleUndo,
    handleHint,
  }
}
