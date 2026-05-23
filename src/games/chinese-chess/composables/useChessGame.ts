import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { BOARD_COLS, BOARD_ROWS, generateLegalMoves, isInCheck } from '../engine'
import { sfxManager } from '../audio/sfxManager'
import { settingsStore } from '../audio/settingsStore'
import { getRankTitle } from '../constants'
import type { Difficulty, GameMode, Move, Piece, PieceColor, Position } from '../types'

import { useChessGameState } from './useChessGameState'
import { useChessAI } from './useChessAI'
import { useChessPersistence } from './useChessPersistence'
import { useChessItems } from './useChessItems'

export function useChessGame(
  gameId: string,
  route: RouteLocationNormalizedLoaded,
  boardFrameRef?: { value: HTMLElement | null },
  baseUrl?: string
) {
  const state = useChessGameState()
  const ai = useChessAI(state.board, state.currentTurn, state.winner)
  const persistence = useChessPersistence(gameId, route)
  const items = useChessItems(
    ai.isSinglePlayer.value,
    state.moveHistory.value,
    (s) =>
      state.restoreState({
        board: s.board,
        currentTurn: s.turn,
        winner: null,
        moveCount: s.moveCount,
      }),
    state.clearSelection,
    (m) => {
      state.hintMove.value = m
    },
    () => persistence.spendItem('undo'),
    () => persistence.spendItem('hint'),
    ai.getHint,
    state.currentTurn.value
  )

  const animatingMove = ref<{
    move: Move
    piece: Piece
    fromPos: { x: number; y: number }
    toPos: { x: number; y: number }
    phase: 'preview' | 'move'
  } | null>(null)

  const inCheck = computed(
    () => state.winner.value === null && isInCheck(state.board.value, state.currentTurn.value)
  )

  const orientation = computed(() => {
    if (ai.activeMode.value === 'ai' && ai.activeHumanSide.value === 'black') return 'black'
    return 'red'
  })

  const displayedRows = computed(() => {
    const rows = Array.from({ length: BOARD_ROWS }, (_, i) => i)
    return orientation.value === 'red' ? rows : rows.reverse()
  })

  const displayedCols = computed(() => {
    const cols = Array.from({ length: BOARD_COLS }, (_, i) => i)
    return orientation.value === 'red' ? cols : cols.reverse()
  })

  const statusText = computed(() => {
    if (state.winner.value !== null)
      return (state.winner.value === 'red' ? '红方' : '黑方') + '获胜'
    if (ai.thinking.value) return 'AI 思考中...'
    const turn = state.currentTurn.value === 'red' ? '红方' : '黑方'
    const check = inCheck.value ? ' · 将军！' : ''
    if (ai.activeMode.value === 'ai') {
      const who = state.currentTurn.value === ai.activeHumanSide.value ? '你' : 'AI'
      return turn + ' · ' + who + check
    }
    return turn + check
  })

  const isBoardLocked = computed(
    () =>
      state.winner.value !== null ||
      ai.thinking.value ||
      ai.canHumanAct.value === false ||
      animatingMove.value !== null
  )

  const getActualPosition = (displayRow: number, displayCol: number): Position => ({
    row: displayedRows.value[displayRow],
    col: displayedCols.value[displayCol],
  })

  const isSelected = (pos: Position) =>
    state.selected.value?.row === pos.row && state.selected.value?.col === pos.col

  const isLegalTarget = (pos: Position) =>
    state.legalMoves.value.some((m) => m.to.row === pos.row && m.to.col === pos.col)

  const isHintFrom = (pos: Position) =>
    state.hintMove.value?.from.row === pos.row && state.hintMove.value?.from.col === pos.col

  const isHintTo = (pos: Position) =>
    state.hintMove.value?.to.row === pos.row && state.hintMove.value?.to.col === pos.col

  const getPieceImage = (piece: Piece | null) => {
    if (!piece) return ''
    const src = baseUrl || import.meta.url
    return new URL(
      `./assets/imgs/${piece.color}_${
        piece.type === 'advisor' ? 'guard' : piece.type === 'elephant' ? 'minister' : piece.type
      }.png`,
      src
    ).href
  }

  const getPixelPosition = (row: number, col: number): { x: number; y: number } => {
    const el = boardFrameRef?.value ?? null
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    const paddingH = parseFloat(style.paddingRight)
    const paddingV = parseFloat(style.paddingTop)
    const bw = rect.width - paddingH * 2
    const bh = rect.height - paddingV * 2
    const dr = orientation.value === 'red' ? row : BOARD_ROWS - 1 - row
    const dc = orientation.value === 'red' ? col : BOARD_COLS - 1 - col
    return { x: paddingH + (dc / BOARD_COLS) * bw, y: paddingV + (dr / (BOARD_ROWS - 1)) * bh }
  }

  const commitMove = async (move: Move) => {
    sfxManager.play(move.captured ? 'eat' : 'move')
    state.commitMove(move)
    await syncWinner()
    await saveCurrentState()
  }

  const syncWinner = async () => {
    state.syncWinner()
    if (state.winner.value !== null) {
      if (ai.activeMode.value === 'ai') {
        if (state.winner.value === ai.activeHumanSide.value) {
          persistence.applyWinRewards(ai.activeDifficulty.value)
        } else {
          persistence.applyLossReset()
        }
      } else {
        persistence.applyWinRewards('medium')
      }
      await persistence.persistProfile()
      await persistence.clearGameState(ai.activeMode.value)
      items.showResultDialog.value = true
    }
  }

  const startAttackAnimation = (move: Move) => {
    const piece = state.board.value[move.from.row][move.from.col]
    if (!piece) return
    const fromPos = getPixelPosition(move.from.row, move.from.col)
    const toPos = getPixelPosition(move.to.row, move.to.col)
    animatingMove.value = { move, piece, fromPos, toPos, phase: 'preview' }
    state.clearSelection()
    window.setTimeout(() => {
      void commitMove(move)
      animatingMove.value = null
    }, 600)
  }

  const handleSelect = (pos: Position) => {
    if (state.winner.value !== null || ai.thinking.value || ai.canHumanAct.value === false) return
    if (animatingMove.value !== null) return

    const move = state.handleSelect(pos, ai.canHumanAct.value)
    if (move) {
      startAttackAnimation(move)
      return
    }
    if (
      state.board.value[pos.row][pos.col] === null ||
      state.board.value[pos.row][pos.col]!.color !== state.currentTurn.value
    ) {
      state.clearSelection()
      return
    }
    sfxManager.play('select')
  }

  const performAiMove = () => {
    ai.performAiMove(startAttackAnimation, () => {
      void syncWinner()
    })
  }

  const startGame = async (config: {
    mode: GameMode
    difficulty: Difficulty
    startingSide: PieceColor
  }) => {
    items.showResultDialog.value = false
    ai.startGame(config)
    state.resetBoard()
    state.currentTurn.value = config.startingSide
    await persistence.clearGameState(config.mode)
  }

  const handleRestart = async () => {
    ai.clearAiTimer()
    ai.thinking.value = false
    await persistence.clearGameState(ai.activeMode.value)
    state.resetBoard()
    items.pendingSetupMode.value = ai.activeMode.value
    items.showStartSetup.value = true
  }

  const handleExit = () => {
    items.showExitConfirm.value = true
  }

  const handleConfirmExit = async () => {
    items.showExitConfirm.value = false
    if (state.moveCount.value > 0) await saveCurrentState()
  }

  const handleCancelExit = () => {
    items.showExitConfirm.value = false
  }

  const handleUndo = async () => {
    await items.handleUndo()
    await persistence.persistProfile()
    await saveCurrentState()
  }

  const handleHint = async () => {
    await items.handleHint(ai.activeHumanSide.value)
    if (state.hintMove.value) {
      state.selected.value = state.hintMove.value.from
      state.legalMoves.value = generateLegalMoves(
        state.board.value,
        state.currentTurn.value
      ).filter(
        (m) =>
          m.from.row === state.hintMove.value!.from.row &&
          m.from.col === state.hintMove.value!.from.col
      )
    }
  }

  const handleStartConfig = async (config: { difficulty: Difficulty; side: PieceColor }) => {
    items.showStartSetup.value = false
    const nextMode = items.pendingSetupMode.value ?? 'ai'
    await startGame({
      mode: nextMode,
      difficulty: nextMode === 'ai' ? config.difficulty : 'medium',
      startingSide: config.side,
    })
  }

  const saveCurrentState = async () => {
    await persistence.saveGameState(ai.activeMode.value, {
      board: state.board.value,
      currentTurn: state.currentTurn.value,
      winner: state.winner.value,
      difficulty: ai.activeDifficulty.value,
      humanSide: ai.activeHumanSide.value,
      moveCount: state.moveCount.value,
    })
  }

  const restoreOrStart = async () => {
    await settingsStore.load()
    await sfxManager.init()
    await persistence.loadProfileData()

    const { mode, savedState } = await persistence.restoreOrStart()
    ai.activeMode.value = mode

    if (savedState) {
      state.restoreState(savedState)
      ai.activeDifficulty.value = savedState.difficulty
      ai.activeHumanSide.value = savedState.humanSide
    } else {
      items.pendingSetupMode.value = mode
      items.showStartSetup.value = true
    }

    persistence.loaded.value = true
  }

  let prevInCheck = false
  watch(inCheck, (val) => {
    if (val && !prevInCheck && state.winner.value === null) sfxManager.play('check')
    prevInCheck = val
  })

  watch(state.winner, (val) => {
    if (val !== null) sfxManager.play('win')
  })

  watch(ai.isAiTurn, (val) => {
    if (val) performAiMove()
  })

  onMounted(async () => {
    await restoreOrStart()
  })

  onBeforeUnmount(async () => {
    ai.clearAiTimer()
    if (state.moveCount.value > 0) await saveCurrentState()
    await persistence.persistProfile()
    sfxManager.destroy()
  })

  return {
    board: state.board,
    currentTurn: state.currentTurn,
    selected: state.selected,
    legalMoves: state.legalMoves,
    winner: state.winner,
    moveCount: state.moveCount,
    thinking: ai.thinking,
    moveHistory: state.moveHistory,
    activeMode: ai.activeMode,
    activeDifficulty: ai.activeDifficulty,
    activeHumanSide: ai.activeHumanSide,
    loaded: persistence.loaded,
    pendingSetupMode: items.pendingSetupMode,
    hintMove: state.hintMove,
    profile: persistence.profile,
    showResultDialog: items.showResultDialog,
    showExitConfirm: items.showExitConfirm,
    showStartSetup: items.showStartSetup,
    animatingMove,
    aiSide: ai.aiSide,
    isAiTurn: ai.isAiTurn,
    isSinglePlayer: ai.isSinglePlayer,
    isBoardLocked,
    inCheck,
    orientation,
    displayedRows,
    displayedCols,
    statusText,
    getActualPosition,
    isSelected,
    isLegalTarget,
    isHintFrom,
    isHintTo,
    canHumanAct: ai.canHumanAct,
    getPieceImage,
    getPixelPosition,
    clearSelection: state.clearSelection,
    saveHistory: state.saveHistory,
    getStorageKey: (mode: GameMode) => `${gameId}-save-${mode}`,
    persistProfile: persistence.persistProfile,
    saveCurrentState,
    commitMove,
    syncWinner,
    startAttackAnimation,
    handleSelect,
    performAiMove,
    startGame,
    handleRestart,
    handleExit,
    handleCancelExit,
    handleUndo,
    handleHint,
    handleStartConfig,
    confirmExit: handleConfirmExit,
    restoreOrStart,
    getRankTitle,
  }
}
