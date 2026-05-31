declare module 'fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
}

declare module 'path' {
  export function dirname(path: string): string
  export function resolve(...paths: string[]): string
}

declare module 'url' {
  export function fileURLToPath(url: string): string
}
