import type { TouchEffect } from '../config/env'
import { el, petalUrls, pick, rand } from './petals'

/**
 * Touch effects. Taps and finger / cursor movement spawn short-lived
 * elements that animate on the GPU compositor (transform + opacity only) and
 * remove themselves when done. Nothing runs between touches.
 */
interface Fx {
  tap(x: number, y: number): void
  /** Called once per `step` px travelled along a drag. */
  trail(x: number, y: number): void
  step: number
}

type Spawn = (css: string, frames: Keyframe[], ms: number, opts?: KeyframeAnimationOptions, html?: string) => void

const MAX_NODES = 240

interface Flight {
  drag: number
  gravity: number
  lifeS: number
  size: number
  spin?: number
  flip?: number
  samples?: number
  fadeS?: number
}

/** Sample a damped ballistic path into keyframes (the browser interpolates between them). */
function flight(x: number, y: number, vx: number, vy: number, f: Flight): Keyframe[] {
  const { drag, gravity, lifeS, size, spin = 0, flip = 0, samples = 9, fadeS = 0.6 } = f
  const frames: Keyframe[] = []
  const dt = lifeS / (samples - 1)
  let px = x
  let py = y
  let rot = rand(0, 360)
  let fl = rand(0, 360)
  for (let i = 0; i < samples; i++) {
    const left = lifeS - i * dt
    frames.push({
      transform: `translate3d(${(px - size / 2).toFixed(1)}px,${(py - size / 2).toFixed(1)}px,0) rotate(${rot.toFixed(0)}deg) rotateY(${fl.toFixed(0)}deg)`,
      opacity: Math.min(1, left / fadeS),
    })
    for (let k = 0; k < 6; k++) {
      const h = dt / 6
      vx *= 1 - drag * h
      vy = vy * (1 - drag * h) + gravity * h
      px += vx * h
      py += vy * h
    }
    rot += spin * dt
    fl += flip * dt
  }
  return frames
}

// ───────────────────────────── 1. Petal burst ─────────────────────────────
function petalBurst(spawn: Spawn): Fx {
  const urls = petalUrls()
  const one = (x: number, y: number, speed: number) => {
    const size = rand(10, 18)
    const a = -Math.PI / 2 + rand(-1.4, 1.4)
    const v = rand(0.4, 1) * speed
    const life = rand(2, 3)
    spawn(
      `width:${size}px;height:${size}px;background:${pick(urls)} center/contain no-repeat`,
      flight(x, y, Math.cos(a) * v, Math.sin(a) * v, { drag: 1.6, gravity: 140, lifeS: life, size, spin: rand(-280, 280), flip: 230 }),
      life * 1000,
    )
  }
  return {
    step: 26,
    tap: (x, y) => {
      for (let i = 0; i < 12; i++) one(x, y, 300)
    },
    trail: (x, y) => one(x, y, 70),
  }
}

// ───────────────────────────── 2. Golden sparks ─────────────────────────────
function goldenSparks(spawn: Spawn): Fx {
  // normal blending with a bronze rim so they read on the ivory paper
  const bg = 'radial-gradient(circle,#fff6d0 0 18%,#f2c15a 34%,rgba(205,140,30,.55) 52%,rgba(205,140,30,0) 72%)'
  const one = (x: number, y: number, speed: number) => {
    const size = rand(9, 20)
    const a = rand(0, Math.PI * 2)
    const v = rand(0.2, 1) * speed
    const life = rand(0.8, 1.6)
    const frames = flight(x, y, Math.cos(a) * v, Math.sin(a) * v, { drag: 2.2, gravity: -40, lifeS: life, size, samples: 7, fadeS: life })
    frames.forEach((f, i) => (f.transform += ` scale(${(1 - (0.65 * i) / (frames.length - 1)).toFixed(2)})`))
    spawn(`width:${size}px;height:${size}px;border-radius:50%;background:${bg}`, frames, life * 1000)
  }
  return {
    step: 9,
    tap: (x, y) => {
      for (let i = 0; i < 26; i++) one(x, y, 220)
    },
    trail: (x, y) => one(x + rand(-4, 4), y + rand(-4, 4), 30),
  }
}

// ───────────────────────────── 3. Light ripple ─────────────────────────────
function lightRipple(spawn: Spawn): Fx {
  const ring = (x: number, y: number, r: number, color: string, width: number, ms: number, delay: number, to: number) =>
    spawn(
      `width:${r * 2}px;height:${r * 2}px;border-radius:50%;border:${width}px solid ${color};box-shadow:0 0 10px ${color}`,
      // the ring races outward (ease-out) while its light fades more slowly
      [0, 0.15, 0.35, 0.6, 0.8, 1].map((t) => ({
        offset: t,
        transform: `translate3d(${x - r}px,${y - r}px,0) scale(${(0.15 + (to - 0.15) * (1 - (1 - t) ** 3)).toFixed(3)})`,
        opacity: 0.95 * (1 - t ** 1.6),
      })),
      ms,
      { delay },
    )
  return {
    step: 46,
    tap: (x, y) => {
      const b = 80
      spawn(
        `width:${b * 2}px;height:${b * 2}px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,140,.55),rgba(255,214,140,0))`,
        [
          { transform: `translate3d(${x - b}px,${y - b}px,0) scale(.3)`, opacity: 1 },
          { transform: `translate3d(${x - b}px,${y - b}px,0) scale(1.4)`, opacity: 0 },
        ],
        1300,
        { easing: 'ease-out' },
      )
      ring(x, y, 105, 'rgba(226,182,90,.9)', 3, 1500, 0, 2)
      ring(x, y, 105, 'rgba(201,168,236,.85)', 2.5, 1500, 120, 1.6)
      ring(x, y, 105, 'rgba(226,182,90,.7)', 1.5, 1500, 240, 1.25)
    },
    trail: (x, y) => ring(x, y, 40, 'rgba(226,182,90,.85)', 2, 900, 0, 1.6),
  }
}

// ───────────────────────────── 4. Mehndi ink trail ─────────────────────────────
/** A henna double spiral as an SVG string. */
function curlSvg(): string {
  let d = ''
  for (const dir of [1, -1]) {
    let first = true
    for (let th = 0; th <= 2.2 * Math.PI * 2; th += 0.2) {
      const r = 3 + th * 2.6
      d += `${first ? 'M' : 'L'}${(50 + Math.cos(dir * th) * r * dir).toFixed(1)} ${(50 + Math.sin(dir * th) * r).toFixed(1)}`
      first = false
    }
  }
  return `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="${d}" fill="none" stroke="#9a6a12" stroke-width="2.4" stroke-linecap="round"/></svg>`
}

function mehndiTrail(spawn: Spawn): Fx {
  const curl = curlSvg()
  const dot = (x: number, y: number, r: number, life: number, delay = 0, halo = false) => {
    const at = `translate3d(${(x - r).toFixed(1)}px,${(y - r).toFixed(1)}px,0)`
    spawn(
      `width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:#9a6a12;${halo ? 'box-shadow:0 0 0 2.5px rgba(243,217,139,.45)' : ''}`,
      [
        { transform: `${at} scale(.3)`, opacity: 0 },
        { transform: `${at} scale(1)`, opacity: 0.95, offset: 0.12 },
        { transform: `${at} scale(1)`, opacity: 0.9, offset: 0.55 },
        { transform: `${at} scale(.6)`, opacity: 0 },
      ],
      life,
      { delay },
    )
  }
  let n = 0
  return {
    step: 5,
    tap: (x, y) => {
      const s = 100
      const rot = rand(0, 360)
      const at = `translate3d(${x - s / 2}px,${y - s / 2}px,0)`
      spawn(
        `width:${s}px;height:${s}px`,
        [
          { transform: `${at} rotate(${rot - 90}deg) scale(.2)`, opacity: 0 },
          { transform: `${at} rotate(${rot}deg) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `${at} rotate(${rot}deg) scale(1)`, opacity: 1, offset: 0.65 },
          { transform: `${at} rotate(${rot + 10}deg) scale(1.05)`, opacity: 0 },
        ],
        1600,
        { easing: 'ease-out' },
        curl,
      )
      for (let i = 0; i < 9; i++) {
        const a = ((rot + (i / 9) * 360) * Math.PI) / 180
        dot(x + Math.cos(a) * 36, y + Math.sin(a) * 36, i % 2 ? 1.6 : 2.4, 1400, i * 40)
      }
    },
    trail: (x, y) => {
      dot(x, y, 1.5, 1300, 0, true)
      if (++n % 8 === 0) dot(x + rand(-12, 12), y + rand(-12, 12), rand(1.2, 2.2), 1400)
    },
  }
}

const EFFECTS = { petals: petalBurst, sparks: goldenSparks, ripple: lightRipple, mehndi: mehndiTrail }

export function startTouch(root: HTMLElement, kind: TouchEffect): () => void {
  if (kind === 'none') return () => {}
  const layer = el('inset:0;width:100%;height:100%;overflow:hidden')
  root.append(layer)

  const spawn: Spawn = (css, frames, ms, opts = {}, html = '') => {
    while (layer.childElementCount >= MAX_NODES) layer.firstElementChild?.remove()
    const node = el(`${css};will-change:transform,opacity;opacity:0`, html)
    layer.append(node)
    const a = node.animate(frames, { duration: ms, easing: 'linear', fill: 'backwards', ...opts })
    const done = () => node.remove()
    a.onfinish = done
    a.oncancel = done
  }

  const fx = EFFECTS[kind](spawn)

  let down = false
  let lx = -1
  let ly = -1
  let acc = 0
  const onDown = (e: PointerEvent) => {
    down = true
    lx = e.clientX
    ly = e.clientY
    acc = 0
    fx.tap(e.clientX, e.clientY)
  }
  const onMove = (e: PointerEvent) => {
    // mice leave a trail on hover; fingers only while touching
    if (e.pointerType !== 'mouse' && !down) return
    const dx = e.clientX - lx
    const dy = e.clientY - ly
    const d = Math.hypot(dx, dy)
    if (lx < 0 || d > 120) {
      // first point or a jump (new stroke): start fresh, don't draw across it
      lx = e.clientX
      ly = e.clientY
      return
    }
    acc += d
    // drop trail particles evenly along the segment
    while (acc >= fx.step) {
      acc -= fx.step
      const k = 1 - acc / Math.max(d, 1e-3)
      fx.trail(lx + dx * k, ly + dy * k)
    }
    lx = e.clientX
    ly = e.clientY
  }
  const onUp = (e: PointerEvent) => {
    down = false
    if (e.pointerType !== 'mouse') lx = ly = -1
  }

  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onUp, { passive: true })
  return () => {
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    layer.remove()
  }
}
