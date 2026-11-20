import { fxConfig } from '../config/env'

/**
 * Pre-rendered sprites for the canvas effects. Drawing a cached bitmap is far
 * cheaper than building gradients/paths per particle per frame.
 */

/** Built-in petal colours (VITE_PETAL_COLOR). Each is [light, mid, edge] tints. */
const PETAL_PRESETS: Record<string, [string, string, string][]> = {
  lavender: [
    ['#f6eeff', '#c9a8ec', '#8f5fc8'],
    ['#fbf3ff', '#d8bdf0', '#a777d6'],
    ['#f3e6fb', '#b98fe0', '#7c46b8'],
    ['#fff6ff', '#e4cdf3', '#b48ad9'],
  ],
}

const hexRgb = (hex: string): [number, number, number] | null => {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const n = Number.parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = ([r, g, b]: [number, number, number], to: number, t: number) =>
  `rgb(${Math.round(r + (to - r) * t)},${Math.round(g + (to - g) * t)},${Math.round(b + (to - b) * t)})`

/** Light/mid/edge tints of one base colour: a soft highlight, the colour, a deeper rim. */
function tintsOf(rgb: [number, number, number]): [string, string, string][] {
  return [
    [mix(rgb, 255, 0.85), mix(rgb, 255, 0.3), mix(rgb, 0, 0.15)],
    [mix(rgb, 255, 0.9), mix(rgb, 255, 0.45), mix(rgb, 255, 0.05)],
    [mix(rgb, 255, 0.75), mix(rgb, 255, 0.15), mix(rgb, 0, 0.3)],
  ]
}

/** Named colours accepted besides hex codes. */
const NAMED: Record<string, string> = {
  pink: '#f48fb1',
  rose: '#e05a7a',
  red: '#c8102e',
  maroon: '#800020',
  peach: '#f6a57a',
  gold: '#d4a537',
  white: '#f4efe6',
  purple: '#7b2cbf',
}

/**
 * Petal tints from a comma-separated list of names or hex codes,
 * e.g. "lavender", "rose", "#e05a7a" or "red,white" (mixed petals).
 */
function petalTints(spec: string): [string, string, string][] {
  const out: [string, string, string][] = []
  for (const part of spec.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean)) {
    if (PETAL_PRESETS[part]) out.push(...PETAL_PRESETS[part])
    else {
      const rgb = hexRgb(NAMED[part] ?? part)
      if (rgb) out.push(...tintsOf(rgb))
    }
  }
  return out.length ? out : PETAL_PRESETS.lavender
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Teardrop petals in the configured colour(s) (64×64, centred). */
export function makePetals(): HTMLCanvasElement[] {
  return petalTints(fxConfig.petalColor).map(([light, mid, edge]) => {
    const c = canvas(64, 64)
    const g = c.getContext('2d')!
    g.translate(32, 32)
    g.beginPath()
    g.moveTo(0, -28)
    g.bezierCurveTo(20, -18, 22, 12, 0, 28)
    g.bezierCurveTo(-22, 12, -20, -18, 0, -28)
    const grad = g.createRadialGradient(-4, -6, 2, 0, 0, 30)
    grad.addColorStop(0, light)
    grad.addColorStop(0.55, mid)
    grad.addColorStop(1, edge)
    g.fillStyle = grad
    g.fill()
    // centre vein
    g.strokeStyle = 'rgba(255,255,255,0.45)'
    g.lineWidth = 1.4
    g.beginPath()
    g.moveTo(0, -20)
    g.quadraticCurveTo(3, 0, 0, 22)
    g.stroke()
    return c
  })
}

/** Soft round glow (for lanterns, sparks, ripples). */
export function makeGlow(rgb: string, size = 128): HTMLCanvasElement {
  const c = canvas(size, size)
  const g = c.getContext('2d')!
  const r = size / 2
  const grad = g.createRadialGradient(r, r, 0, r, r, r)
  grad.addColorStop(0, `rgba(${rgb},1)`)
  grad.addColorStop(0.25, `rgba(${rgb},0.55)`)
  grad.addColorStop(0.6, `rgba(${rgb},0.14)`)
  grad.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}

/** Load an image; resolves even on error (effects simply skip missing sprites). */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => res(img)
    img.onerror = () => res(null)
    img.src = src
  })
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
