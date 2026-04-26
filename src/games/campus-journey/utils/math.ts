export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const round = (value: number, digits = 0) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export const percent = (value: number) => `${Math.round(value * 100)}%`
