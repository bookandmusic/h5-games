import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useGameNavigation } from '../../../composables/useGameNavigation'
import { sfxManager } from '../audio/sfxManager'
import { settingsStore } from '../audio/settingsStore'
import { GAME_ID, getRankTitle } from '../constants'
import type { Difficulty, DiskColor, GameMode, Move, Position } from '../types'

import { useReversiGameState } from './useReversiGameState'
import { useReversiAI } from './useReversiAI'
import { useReversiPersistence } from './useReversiPersistence'
import { useReversiItems } from './useReversiItems'

export function useReversiGame(route: RouteLocationNormalizedLoaded) {
  const state = useReversiGameState()
  const ai = useReversiAI(state.board, state.currentPlayer, state.status)
  const persistence = useReversiPersistence(GAME_ID, route)
  const nav = useGameNavigation(GAME_ID)

  const items = useReversiItems(
    ai.isSinglePlayer.value,
    ai.canHumanAct.value,
    (m) => {
      state.hintMove.value = m
    },
    (amount) => persistence.spendCoins(amount),
    () => ai.getHint()
  )

  const flippingPositions = ref<Set<string>>(new Set())
  const droppingPosition = ref<Position | null>(null)
  const lastMovePosition = ref<Position | null>(null)
  const scoreChangedBlack = ref(false)
  const scoreChangedWhite = ref(false)

  watch(state.blackCount, () => {
    scoreChangedBlack.value = true
    setTimeout(() => {
      scoreChangedBlack.value = false
    }, 300)
  })

  watch(state.whiteCount, () => {
    scoreChangedWhite.value = true
    setTimeout(() => {
      scoreChangedWhite.value = false
    }, 300)
  })

  const isBoardLocked = computed(
    () => state.status.value !== 'playing' || ai.thinking.value || !ai.canHumanAct.value
  )

  const statusText = computed(() => {
    if (state.status.value === 'black-wins') return '黑方获胜'
    if (state.status.value === 'white-wins') return '白方获胜'
    if (state.status.value === 'draw') return '平局'
    if (ai.thinking.value) return 'AI 思考中...'
    if (ai.isSinglePlayer.value) {
      const who = state.currentPlayer.value === ai.activeHumanSide.value ? '你' : 'AI'
      return `${state.currentPlayer.value === 'black' ? '黑方' : '白方'} · ${who}落子`
    }
    return `${state.currentPlayer.value === 'black' ? '黑方' : '白方'}落子`
  })

  const isLegalPosition = (pos: Position): boolean => {
    return state.legalMoves.value.some(
      (m) => m.position.row === pos.row && m.position.col === pos.col
    )
  }

  const isHintPosition = (pos: Position): boolean => {
    return (
      state.hintMove.value?.position.row === pos.row &&
      state.hintMove.value?.position.col === pos.col
    )
  }

  const isLastMove = (pos: Position): boolean => {
    return lastMovePosition.value?.row === pos.row && lastMovePosition.value?.col === pos.col
  }

  const isFlipping = (pos: Position): boolean => {
    return flippingPositions.value.has(`${pos.row},${pos.col}`)
  }

  const setBoardCell = (row: number, col: number, color: DiskColor) => {
    const newBoard = state.board.value.map((r) => [...r])
    newBoard[row][col] = { color }
    state.board.value = newBoard
  }

  const executeFlipAnimation = (flipped: Position[], callback: () => void) => {
    if (flipped.length === 0) {
      callback()
      return
    }

    sfxManager.play('flip')
    const currentSet = new Set<string>()
    let index = 0

    const startNext = () => {
      if (index >= flipped.length) return

      const pos = flipped[index]
      currentSet.add(`${pos.row},${pos.col}`)
      flippingPositions.value = new Set(currentSet)
      index++

      setTimeout(() => {
        // 400ms CSS animation just completed → finalize this piece
        setBoardCell(pos.row, pos.col, state.currentPlayer.value)
        currentSet.delete(`${pos.row},${pos.col}`)
        flippingPositions.value = new Set(currentSet)

        if (index >= flipped.length) {
          // All pieces done
          callback()
        } else {
          startNext()
        }
      }, 400)
    }
    startNext()
  }

  const commitMove = async (move: Move) => {
    sfxManager.play('place')

    const flipped = move.flipped
    droppingPosition.value = move.position
    lastMovePosition.value = move.position

    // Place new piece immediately on the board
    setBoardCell(move.position.row, move.position.col, state.currentPlayer.value)

    // Wait for drop animation (250ms) before starting flips
    await new Promise((resolve) => setTimeout(resolve, 250))
    droppingPosition.value = null

    // Sort flipped by distance from new piece (closest first → ripple outward)
    const sorted = [...flipped].sort((a, b) => {
      const da = Math.max(Math.abs(a.row - move.position.row), Math.abs(a.col - move.position.col))
      const db = Math.max(Math.abs(b.row - move.position.row), Math.abs(b.col - move.position.col))
      return da - db
    })

    executeFlipAnimation(sorted, () => {
      state.commitMove(move)
    })
  }

  const handleCellClick = (pos: Position) => {
    if (isBoardLocked.value) return
    if (flippingPositions.value.size > 0) return

    const move = state.handleCellClick(pos)
    if (!move) {
      sfxManager.play('invalid')
      return
    }

    void commitMove(move)
  }

  const handleSkip = () => {
    state.skipTurn()
  }

  const startGame = (config: { mode: GameMode; difficulty: Difficulty; humanSide: DiskColor }) => {
    items.showResultDialog.value = false
    items.showStartSetup.value = false
    ai.startGame(config)
    state.resetBoard()
    state.currentPlayer.value = 'black'
    lastMovePosition.value = null
    sfxManager.startBgm()
  }

  const handleRestart = async () => {
    ai.clearAiTimer()
    ai.thinking.value = false
    state.resetBoard()
    lastMovePosition.value = null
    items.pendingSetupMode.value = ai.activeMode.value
    items.showStartSetup.value = true
    await persistence.clearGameState(ai.activeMode.value)
  }

  const handleExit = () => {
    items.showExitConfirm.value = true
  }

  const handleConfirmExit = async () => {
    items.showExitConfirm.value = false
    if (state.moveCount.value > 0) await saveCurrentState()
    nav.goToHome()
  }

  const handleCancelExit = () => {
    items.showExitConfirm.value = false
  }

  const handleUndo = async () => {
    if (state.history.value.length < (ai.isSinglePlayer.value ? 2 : 1)) return

    ai.clearAiTimer()
    ai.thinking.value = true

    const ok = await items.canUndo()
    if (!ok) {
      ai.thinking.value = false
      return
    }

    const count = ai.isSinglePlayer.value ? 2 : 1
    for (let i = 0; i < count; i++) {
      state.undoLastMove()
    }
    ai.thinking.value = false
    ai.clearAiTimer()
    items.commitUndo()

    sfxManager.play('select')
    lastMovePosition.value = null
    await persistence.persistProfile()
    await saveCurrentState()
  }

  const handleHint = async () => {
    const move = await items.handleHint(ai.activeHumanSide.value)
    if (move) {
      state.hintMove.value = move
    }
  }

  const handleStartConfig = (config: { difficulty: Difficulty; side: DiskColor }) => {
    items.showStartSetup.value = false
    startGame({
      mode: items.pendingSetupMode.value ?? 'ai',
      difficulty: config.difficulty,
      humanSide: config.side,
    })
  }

  const saveCurrentState = async () => {
    await persistence.saveGameState(ai.activeMode.value, {
      board: state.board.value,
      currentPlayer: state.currentPlayer.value,
      status: state.status.value,
      difficulty: ai.activeDifficulty.value,
      humanSide: ai.activeHumanSide.value,
      moveCount: state.moveCount.value,
    })
  }

  const trySyncResult = async () => {
    if (state.status.value !== 'playing') {
      if (ai.isSinglePlayer.value) {
        const humanWon = state.status.value === `${ai.activeHumanSide.value}-wins`
        if (humanWon) {
          await persistence.recordResult('win')
          sfxManager.play('win')
        } else if (state.status.value === 'draw') {
          await persistence.recordResult('draw')
        } else {
          await persistence.recordResult('lose')
          sfxManager.play('lose')
        }
      } else {
        sfxManager.play('win')
      }
      await persistence.clearGameState(ai.activeMode.value)
      items.showResultDialog.value = true
    }
  }

  const init = async () => {
    await settingsStore.load()
    await sfxManager.init()

    const routeMode = route.query.mode as string | undefined
    const preferredMode: GameMode | undefined =
      routeMode === 'ai' || routeMode === 'local' ? routeMode : undefined
    const saved = await persistence.init(preferredMode)

    if (saved) {
      const restoreMode = preferredMode || 'ai'
      state.board.value = saved.board
      state.currentPlayer.value = saved.currentPlayer
      state.moveCount.value = saved.moveCount
      state.refreshLegalMoves()
      ai.startGame({
        mode: restoreMode,
        difficulty: saved.difficulty,
        humanSide: saved.humanSide,
      })
    } else {
      const mode = routeMode
      if (mode === 'ai' || mode === 'local') {
        items.pendingSetupMode.value = mode
        items.showStartSetup.value = true
      } else {
        items.pendingSetupMode.value = 'ai'
        items.showStartSetup.value = true
      }
    }

    persistence.loaded.value = true
  }

  watch(state.status, () => {
    void trySyncResult()
  })

  watch(ai.isAiTurn, (val) => {
    if (val) {
      ai.performAiMove(
        (move: Move) => {
          void commitMove(move)
        },
        () => {
          handleSkip()
        }
      )
    }
  })

  onMounted(async () => {
    await init()
  })

  onBeforeUnmount(async () => {
    ai.clearAiTimer()
    if (state.moveCount.value > 0) await saveCurrentState()
    await persistence.persistProfile()
    sfxManager.destroy()
  })

  return {
    board: state.board,
    currentPlayer: state.currentPlayer,
    legalMoves: state.legalMoves,
    status: state.status,
    moveCount: state.moveCount,
    hintMove: state.hintMove,
    blackCount: state.blackCount,
    whiteCount: state.whiteCount,
    thinking: ai.thinking,
    activeMode: ai.activeMode,
    activeDifficulty: ai.activeDifficulty,
    activeHumanSide: ai.activeHumanSide,
    loaded: persistence.loaded,
    profile: persistence.profile,
    showResultDialog: items.showResultDialog,
    showExitConfirm: items.showExitConfirm,
    showStartSetup: items.showStartSetup,
    pendingSetupMode: items.pendingSetupMode,
    droppingPosition,
    flippingPositions,
    lastMovePosition,
    scoreChangedBlack,
    scoreChangedWhite,
    isSinglePlayer: ai.isSinglePlayer,
    isBoardLocked,
    statusText,
    isLegalPosition,
    isHintPosition,
    isLastMove,
    isFlipping,
    handleCellClick,
    handleSkip,
    handleRestart,
    handleExit,
    handleConfirmExit,
    handleCancelExit,
    handleUndo,
    handleHint,
    handleStartConfig,
    startGame,
    getRankTitle,
  }
}
