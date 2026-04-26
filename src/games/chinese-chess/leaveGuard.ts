let leaveHandler: null | (() => Promise<boolean> | boolean) = null

export const registerChineseChessLeaveGuard = (handler: () => Promise<boolean> | boolean) => {
  leaveHandler = handler
}

export const clearChineseChessLeaveGuard = (handler?: () => Promise<boolean> | boolean) => {
  if (!handler || leaveHandler === handler) {
    leaveHandler = null
  }
}

export const runChineseChessLeaveGuard = async () => {
  if (!leaveHandler) return true
  return await leaveHandler()
}
