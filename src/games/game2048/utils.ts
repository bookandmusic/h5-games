const ICON_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048] as const

export function buildIconMap(importFn: (name: string) => string): Record<number, string> {
  return Object.fromEntries(ICON_VALUES.map((v) => [v, importFn(String(v))])) as Record<
    number,
    string
  >
}
