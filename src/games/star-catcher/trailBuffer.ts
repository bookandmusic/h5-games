export class TrailBuffer {
  private buffer: Float64Array
  private head = 0
  count = 0

  constructor(capacity = 8) {
    this.buffer = new Float64Array(capacity * 2)
  }

  push(x: number, y: number): void {
    const cap = this.buffer.length / 2
    const idx = ((this.head + this.count) % cap) * 2
    this.buffer[idx] = x
    this.buffer[idx + 1] = y
    if (this.count < cap) {
      this.count++
    } else {
      this.head = (this.head + 1) % cap
    }
  }

  getX(i: number): number {
    if (i < 0 || i >= this.count) return 0
    const cap = this.buffer.length / 2
    return this.buffer[((this.head + i) % cap) * 2]
  }

  getY(i: number): number {
    if (i < 0 || i >= this.count) return 0
    const cap = this.buffer.length / 2
    return this.buffer[((this.head + i) % cap) * 2 + 1]
  }

  get length(): number {
    return this.count
  }
}
