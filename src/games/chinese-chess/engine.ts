import type { Board, Move, Piece, PieceColor, PieceType, Position, Side } from './types'

export const BOARD_ROWS = 10
export const BOARD_COLS = 9

const RED_SIDE_ROWS = new Set([5, 6, 7, 8, 9])
const BLACK_SIDE_ROWS = new Set([0, 1, 2, 3, 4])

const palaceColumns = new Set([3, 4, 5])
const redPalaceRows = new Set([7, 8, 9])
const blackPalaceRows = new Set([0, 1, 2])

const inBounds = (row: number, col: number) =>
  row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS

const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col

export const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((piece) => (piece ? { ...piece } : null)))

const createPiece = (color: PieceColor, type: PieceType, index: number): Piece => ({
  id: `${color}-${type}-${index}`,
  color,
  type,
})

export const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  )

  const place = (row: number, col: number, color: PieceColor, type: PieceType, index: number) => {
    board[row][col] = createPiece(color, type, index)
  }

  ;(
    [
      [0, 0, 'black', 'chariot', 0],
      [0, 1, 'black', 'horse', 0],
      [0, 2, 'black', 'elephant', 0],
      [0, 3, 'black', 'advisor', 0],
      [0, 4, 'black', 'general', 0],
      [0, 5, 'black', 'advisor', 1],
      [0, 6, 'black', 'elephant', 1],
      [0, 7, 'black', 'horse', 1],
      [0, 8, 'black', 'chariot', 1],
      [2, 1, 'black', 'cannon', 0],
      [2, 7, 'black', 'cannon', 1],
      [3, 0, 'black', 'soldier', 0],
      [3, 2, 'black', 'soldier', 1],
      [3, 4, 'black', 'soldier', 2],
      [3, 6, 'black', 'soldier', 3],
      [3, 8, 'black', 'soldier', 4],
      [9, 0, 'red', 'chariot', 0],
      [9, 1, 'red', 'horse', 0],
      [9, 2, 'red', 'elephant', 0],
      [9, 3, 'red', 'advisor', 0],
      [9, 4, 'red', 'general', 0],
      [9, 5, 'red', 'advisor', 1],
      [9, 6, 'red', 'elephant', 1],
      [9, 7, 'red', 'horse', 1],
      [9, 8, 'red', 'chariot', 1],
      [7, 1, 'red', 'cannon', 0],
      [7, 7, 'red', 'cannon', 1],
      [6, 0, 'red', 'soldier', 0],
      [6, 2, 'red', 'soldier', 1],
      [6, 4, 'red', 'soldier', 2],
      [6, 6, 'red', 'soldier', 3],
      [6, 8, 'red', 'soldier', 4],
    ] as const
  ).forEach(([row, col, color, type, index]) => {
    place(row, col, color, type, index)
  })

  return board
}

const isInPalace = (row: number, col: number, color: PieceColor) => {
  if (!palaceColumns.has(col)) return false
  return color === 'red' ? redPalaceRows.has(row) : blackPalaceRows.has(row)
}

const isOwnSide = (row: number, color: PieceColor) => {
  return color === 'red' ? RED_SIDE_ROWS.has(row) : BLACK_SIDE_ROWS.has(row)
}

const getPiece = (board: Board, position: Position) => board[position.row]?.[position.col] ?? null

const pushMoveIfValid = (
  board: Board,
  moves: Move[],
  piece: Piece,
  from: Position,
  to: Position
) => {
  if (!inBounds(to.row, to.col)) return
  const target = board[to.row][to.col]
  if (target && target.color === piece.color) return
  moves.push({ from, to, piece, captured: target })
}

const getGeneralPosition = (board: Board, color: PieceColor): Position | null => {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = board[row][col]
      if (piece?.type === 'general' && piece.color === color) {
        return { row, col }
      }
    }
  }
  return null
}

const getFlyingGeneralMove = (board: Board, piece: Piece, from: Position): Move | null => {
  const enemy = piece.color === 'red' ? 'black' : 'red'
  const enemyGeneral = getGeneralPosition(board, enemy)
  if (!enemyGeneral || enemyGeneral.col !== from.col) return null

  const step = enemyGeneral.row > from.row ? 1 : -1
  for (let row = from.row + step; row !== enemyGeneral.row; row += step) {
    if (board[row][from.col]) return null
  }

  return { from, to: enemyGeneral, piece, captured: board[enemyGeneral.row][enemyGeneral.col] }
}

const generateHorseMoves = (board: Board, piece: Piece, from: Position): Move[] => {
  const moves: Move[] = []
  ;(
    [
      { leg: [-1, 0], delta: [-2, -1] },
      { leg: [-1, 0], delta: [-2, 1] },
      { leg: [1, 0], delta: [2, -1] },
      { leg: [1, 0], delta: [2, 1] },
      { leg: [0, -1], delta: [-1, -2] },
      { leg: [0, -1], delta: [1, -2] },
      { leg: [0, 1], delta: [-1, 2] },
      { leg: [0, 1], delta: [1, 2] },
    ] as const
  ).forEach(({ leg, delta }) => {
    const legRow = from.row + leg[0]
    const legCol = from.col + leg[1]
    if (!inBounds(legRow, legCol) || board[legRow][legCol]) return
    pushMoveIfValid(board, moves, piece, from, {
      row: from.row + delta[0],
      col: from.col + delta[1],
    })
  })
  return moves
}

const generateSlidingMoves = (
  board: Board,
  piece: Piece,
  from: Position,
  cannon: boolean
): Move[] => {
  const moves: Move[] = []
  ;(
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const
  ).forEach(([dr, dc]) => {
    let row = from.row + dr
    let col = from.col + dc
    let jumped = false

    while (inBounds(row, col)) {
      const target = board[row][col]
      if (!cannon) {
        if (!target) {
          moves.push({ from, to: { row, col }, piece })
        } else {
          if (target.color !== piece.color) {
            moves.push({ from, to: { row, col }, piece, captured: target })
          }
          break
        }
      } else if (!jumped) {
        if (!target) {
          moves.push({ from, to: { row, col }, piece })
        } else {
          jumped = true
        }
      } else if (target) {
        if (target.color !== piece.color) {
          moves.push({ from, to: { row, col }, piece, captured: target })
        }
        break
      }

      row += dr
      col += dc
    }
  })
  return moves
}

export const generatePseudoLegalMoves = (board: Board, from: Position): Move[] => {
  const piece = getPiece(board, from)
  if (!piece) return []

  const moves: Move[] = []

  switch (piece.type) {
    case 'general': {
      ;(
        [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const
      ).forEach(([dr, dc]) => {
        const to = { row: from.row + dr, col: from.col + dc }
        if (isInPalace(to.row, to.col, piece.color)) {
          pushMoveIfValid(board, moves, piece, from, to)
        }
      })
      const flyingMove = getFlyingGeneralMove(board, piece, from)
      if (flyingMove) moves.push(flyingMove)
      break
    }
    case 'advisor': {
      ;(
        [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ] as const
      ).forEach(([dr, dc]) => {
        const to = { row: from.row + dr, col: from.col + dc }
        if (isInPalace(to.row, to.col, piece.color)) {
          pushMoveIfValid(board, moves, piece, from, to)
        }
      })
      break
    }
    case 'elephant': {
      ;(
        [
          [-2, -2],
          [-2, 2],
          [2, -2],
          [2, 2],
        ] as const
      ).forEach(([dr, dc]) => {
        const eyeRow = from.row + dr / 2
        const eyeCol = from.col + dc / 2
        const to = { row: from.row + dr, col: from.col + dc }
        if (!inBounds(to.row, to.col) || !isOwnSide(to.row, piece.color) || board[eyeRow][eyeCol])
          return
        pushMoveIfValid(board, moves, piece, from, to)
      })
      break
    }
    case 'horse':
      return generateHorseMoves(board, piece, from)
    case 'chariot':
      return generateSlidingMoves(board, piece, from, false)
    case 'cannon':
      return generateSlidingMoves(board, piece, from, true)
    case 'soldier': {
      const direction = piece.color === 'red' ? -1 : 1
      pushMoveIfValid(board, moves, piece, from, { row: from.row + direction, col: from.col })
      const crossedRiver = piece.color === 'red' ? from.row <= 4 : from.row >= 5
      if (crossedRiver) {
        pushMoveIfValid(board, moves, piece, from, { row: from.row, col: from.col - 1 })
        pushMoveIfValid(board, moves, piece, from, { row: from.row, col: from.col + 1 })
      }
      break
    }
  }

  return moves
}

export const applyMove = (board: Board, move: Move): Board => {
  const nextBoard = cloneBoard(board)
  nextBoard[move.from.row][move.from.col] = null
  nextBoard[move.to.row][move.to.col] = { ...move.piece }
  return nextBoard
}

export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const general = getGeneralPosition(board, color)
  if (!general) return true

  const enemyColor = color === 'red' ? 'black' : 'red'
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = board[row][col]
      if (!piece || piece.color !== enemyColor) continue
      const enemyMoves = generatePseudoLegalMoves(board, { row, col })
      if (enemyMoves.some((move) => samePosition(move.to, general))) {
        return true
      }
    }
  }
  return false
}

export const generateLegalMoves = (board: Board, color: PieceColor): Move[] => {
  const moves: Move[] = []

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = board[row][col]
      if (!piece || piece.color !== color) continue
      const from = { row, col }
      const candidates = generatePseudoLegalMoves(board, from)
      candidates.forEach((move) => {
        const nextBoard = applyMove(board, move)
        if (!isInCheck(nextBoard, color)) {
          moves.push(move)
        }
      })
    }
  }

  return moves
}

export const findMove = (
  board: Board,
  color: PieceColor,
  from: Position,
  to: Position
): Move | null => {
  const legalMoves = generateLegalMoves(board, color)
  return (
    legalMoves.find((move) => samePosition(move.from, from) && samePosition(move.to, to)) ?? null
  )
}

export const hasGeneral = (board: Board, color: PieceColor) => {
  return getGeneralPosition(board, color) !== null
}

export const getWinner = (board: Board, currentTurn: PieceColor): Side | null => {
  const redAlive = hasGeneral(board, 'red')
  const blackAlive = hasGeneral(board, 'black')

  if (!redAlive) return 'black'
  if (!blackAlive) return 'red'

  const legalMoves = generateLegalMoves(board, currentTurn)
  if (legalMoves.length === 0) {
    return currentTurn === 'red' ? 'black' : 'red'
  }

  return null
}

export const isCheckmateThreat = (board: Board, currentTurn: PieceColor) => {
  const next = currentTurn === 'red' ? 'black' : 'red'
  return isInCheck(board, next)
}

export const getPieceLabel = (piece: Piece) => {
  const redNames: Record<PieceType, string> = {
    general: '帅',
    advisor: '仕',
    elephant: '相',
    horse: '马',
    chariot: '车',
    cannon: '炮',
    soldier: '兵',
  }
  const blackNames: Record<PieceType, string> = {
    general: '将',
    advisor: '士',
    elephant: '象',
    horse: '马',
    chariot: '车',
    cannon: '炮',
    soldier: '卒',
  }
  return piece.color === 'red' ? redNames[piece.type] : blackNames[piece.type]
}
