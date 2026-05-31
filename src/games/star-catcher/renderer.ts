import type { FallingItem } from './types'
import { ITEM_COLORS, type ItemType } from './types'

const ITEM_TYPES: ItemType[] = ['star', 'sapphire', 'amethyst', 'lucky', 'meteor', 'shield']

const imageCache = new Map<string, HTMLImageElement>()

const IMAGE_BASE = new URL('./assets/images/', import.meta.url).href.replace(/\/?$/, '/')

export function loadImages(): Promise<void> {
  const promises = ITEM_TYPES.map(
    (type) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.onload = () => {
          imageCache.set(type, img)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = `${IMAGE_BASE}${type}.png`
      })
  )
  return Promise.all(promises).then(() => undefined)
}

export function drawItem(ctx: CanvasRenderingContext2D, item: FallingItem, _time: number) {
  ctx.save()
  ctx.globalAlpha = item.opacity

  const color = ITEM_COLORS[item.type]

  if (item.trail.length > 1) {
    ctx.beginPath()
    ctx.moveTo(item.trail.getX(0), item.trail.getY(0))
    for (let i = 1; i < item.trail.length; i++) {
      ctx.lineTo(item.trail.getX(i), item.trail.getY(i))
    }
    ctx.strokeStyle = color
    ctx.globalAlpha = item.opacity * 0.2
    ctx.lineWidth = item.size * 0.5
    ctx.stroke()
    ctx.globalAlpha = item.opacity
  }

  const img = imageCache.get(item.type)
  if (!img) {
    ctx.restore()
    return
  }

  ctx.translate(item.x, item.y)
  ctx.rotate(item.rotation)

  ctx.shadowColor = color
  ctx.shadowBlur = 15

  const dim = item.size * 2
  ctx.drawImage(img, -dim / 2, -dim / 2, dim, dim)

  ctx.restore()
}
