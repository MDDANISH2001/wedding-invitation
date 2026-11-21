import { fxConfig } from '../config/env'

/**
 * Petal artwork: one small SVG per tint, encoded as a data URL. Each petal
 * element uses it as a background, so the browser rasterises it once and
 * the GPU only moves the finished bitmap around.
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

/** Teardrop petals (SVG data URLs) in the configured colour(s). */
export function petalUrls(): string[] {
  return petalTints(fxConfig.petalColor).map(([light, mid, edge], i) => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64">` +
      `<defs><radialGradient id="p${i}" gradientUnits="userSpaceOnUse" cx="-4" cy="-6" r="32" fx="-4" fy="-6">` +
      `<stop offset="0.06" stop-color="${light}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${edge}"/>` +
      `</radialGradient></defs>` +
      `<path d="M0-28C20-18 22 12 0 28C-22 12-20-18 0-28Z" fill="url(#p${i})"/>` +
      `<path d="M0-20Q3 0 0 22" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.4"/>` +
      `</svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  })
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const pick = <T>(xs: T[]) => xs[(Math.random() * xs.length) | 0]

/** A positioned, non-interactive element for an effect layer. */
export function el(css: string, html = ''): HTMLDivElement {
  const d = document.createElement('div')
  d.style.cssText = `position:absolute;left:0;top:0;pointer-events:none;${css}`
  if (html) d.innerHTML = html
  return d
}
