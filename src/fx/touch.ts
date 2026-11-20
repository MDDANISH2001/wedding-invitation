import type { TouchEffect } from '../config/env'
import { makeGlow, makePetals, rand } from './sprites'

/**
 * Touch effects. Each one reacts to taps (`tap`) and finger / cursor
 * movement (`move`), advances its particles in `step` and paints in `draw`.
 * `step` returns false once nothing is left to animate, so the render loop
 * can sleep.
 */
export interface TouchFx {
  tap(x: number, y: number): void
  move(x: number, y: number, dist: number): void
  step(dt: number): boolean
  draw(ctx: CanvasRenderingContext2D): void
}

const MAX = 220

// ───────────────────────────── 1. Petal burst ─────────────────────────────
class PetalBurst implements TouchFx {
  private sprites = makePetals()
  private ps: { x: number; y: number; vx: number; vy: number; rot: number; spin: number; flip: number; size: number; life: number; max: number; s: number }[] = []
  private acc = 0

  private spawn(x: number, y: number, speed: number) {
    if (this.ps.length >= MAX) this.ps.shift()
    const a = -Math.PI / 2 + rand(-1.4, 1.4)
    const v = rand(0.4, 1) * speed
    const max = rand(2, 3)
    this.ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rand(0, 6.3), spin: rand(-5, 5), flip: rand(0, 6.3), size: rand(10, 18), life: max, max, s: (Math.random() * this.sprites.length) | 0 })
  }
  tap(x: number, y: number) {
    for (let i = 0; i < 12; i++) this.spawn(x, y, 300)
  }
  move(x: number, y: number, dist: number) {
    this.acc += dist
    while (this.acc > 26) {
      this.acc -= 26
      this.spawn(x, y, 70)
    }
  }
  step(dt: number) {
    for (const p of this.ps) {
      p.vx *= 1 - 1.6 * dt
      p.vy = p.vy * (1 - 1.6 * dt) + 140 * dt
      p.x += (p.vx + Math.sin(p.flip) * 18) * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
      p.flip += 4 * dt
      p.life -= dt
    }
    this.ps = this.ps.filter((p) => p.life > 0)
    return this.ps.length > 0
  }
  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.ps) {
      ctx.globalAlpha = Math.min(1, p.life / 0.6)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.scale(0.25 + 0.75 * Math.abs(Math.cos(p.flip)), 1)
      ctx.drawImage(this.sprites[p.s], -p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }
}

// ───────────────────────────── 2. Golden sparks ─────────────────────────────
class GoldenSparks implements TouchFx {
  private glow = makeGlow('205,140,30', 64)
  private core = makeGlow('255,236,170', 32)
  private ps: { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; ph: number }[] = []
  private acc = 0

  private spawn(x: number, y: number, speed: number) {
    if (this.ps.length >= MAX) this.ps.shift()
    const a = rand(0, Math.PI * 2)
    const v = rand(0.2, 1) * speed
    const max = rand(0.8, 1.6)
    this.ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(1.4, 3.2), life: max, max, ph: rand(0, 6.3) })
  }
  tap(x: number, y: number) {
    for (let i = 0; i < 26; i++) this.spawn(x, y, 220)
  }
  move(x: number, y: number, dist: number) {
    this.acc += dist
    while (this.acc > 9) {
      this.acc -= 9
      this.spawn(x + rand(-4, 4), y + rand(-4, 4), 30)
    }
  }
  step(dt: number) {
    for (const p of this.ps) {
      p.vx *= 1 - 2.2 * dt
      p.vy = p.vy * (1 - 2.2 * dt) - 40 * dt // embers rise
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      p.ph += dt * 14
    }
    this.ps = this.ps.filter((p) => p.life > 0)
    return this.ps.length > 0
  }
  draw(ctx: CanvasRenderingContext2D) {
    // normal blending: additive light would vanish on the ivory paper
    for (const p of this.ps) {
      const k = p.life / p.max
      const tw = 0.7 + 0.3 * Math.sin(p.ph)
      const g = p.r * 6
      ctx.globalAlpha = k * 0.9 * tw
      ctx.drawImage(this.glow, p.x - g / 2, p.y - g / 2, g, g)
      const c = p.r * 2.4
      ctx.globalAlpha = Math.min(1, k * 1.4)
      ctx.drawImage(this.core, p.x - c / 2, p.y - c / 2, c, c)
    }
    ctx.globalAlpha = 1
  }
}

// ───────────────────────────── 3. Light ripple ─────────────────────────────
class LightRipple implements TouchFx {
  private glow = makeGlow('255,214,140', 128)
  private rings: { x: number; y: number; t: number; max: number; size: number }[] = []
  private acc = 0

  tap(x: number, y: number) {
    this.rings.push({ x, y, t: 0, max: 1.5, size: 1 })
    if (this.rings.length > 24) this.rings.shift()
  }
  move(x: number, y: number, dist: number) {
    this.acc += dist
    if (this.acc > 46) {
      this.acc = 0
      this.rings.push({ x, y, t: 0, max: 0.9, size: 0.3 })
      if (this.rings.length > 24) this.rings.shift()
    }
  }
  step(dt: number) {
    for (const r of this.rings) r.t += dt
    this.rings = this.rings.filter((r) => r.t < r.max)
    return this.rings.length > 0
  }
  draw(ctx: CanvasRenderingContext2D) {
    for (const r of this.rings) {
      const k = r.t / r.max
      const ease = 1 - Math.pow(1 - k, 3)
      const fade = 1 - k
      // soft bloom at the touch point
      const g = 160 * r.size * (0.4 + ease)
      ctx.globalAlpha = fade * fade * 0.55
      ctx.drawImage(this.glow, r.x - g / 2, r.y - g / 2, g, g)
      // three concentric rings, golden → lavender
      for (let i = 0; i < 3; i++) {
        const rad = (40 + 170 * ease) * r.size * (1 - i * 0.22)
        if (rad <= 0) continue
        ctx.globalAlpha = fade * (0.55 - i * 0.14)
        ctx.lineWidth = (3.2 - i) * fade + 0.4
        ctx.strokeStyle = i === 1 ? '#c9a8ec' : '#e2b65a'
        ctx.beginPath()
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2)
        ctx.stroke()
      }
      // glints riding the outer ring
      if (r.size === 1) {
        const rad = (40 + 170 * ease)
        ctx.fillStyle = '#fff4d6'
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * Math.PI * 2 + k * 1.2
          ctx.globalAlpha = fade
          ctx.beginPath()
          ctx.arc(r.x + Math.cos(a) * rad, r.y + Math.sin(a) * rad, 1.8 * fade + 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    ctx.globalAlpha = 1
  }
}

// ───────────────────────────── 4. Mehndi ink trail ─────────────────────────────
type Pt = { x: number; y: number; age: number }
class MehndiTrail implements TouchFx {
  private trail: Pt[] = []
  private curls: { x: number; y: number; t: number; rot: number; s: number }[] = []
  private dots: { x: number; y: number; t: number; r: number }[] = []
  private last: { x: number; y: number } | null = null
  private sinceDot = 0
  private LIFE = 1.3

  tap(x: number, y: number) {
    this.last = null
    const rot = rand(0, Math.PI * 2)
    this.curls.push({ x, y, t: 0, rot, s: rand(0.9, 1.2) })
    // a ring of henna dots around the curl
    for (let i = 0; i < 9; i++) {
      const a = rot + (i / 9) * Math.PI * 2
      this.dots.push({ x: x + Math.cos(a) * 34, y: y + Math.sin(a) * 34, t: -i * 0.04, r: i % 2 ? 1.6 : 2.4 })
    }
    if (this.curls.length > 10) this.curls.shift()
  }
  move(x: number, y: number, dist: number) {
    if (this.last && Math.hypot(x - this.last.x, y - this.last.y) > 80) this.trail.push({ x: NaN, y: NaN, age: 0 }) // break
    this.trail.push({ x, y, age: 0 })
    this.last = { x, y }
    this.sinceDot += dist
    if (this.sinceDot > 38) {
      this.sinceDot = 0
      this.dots.push({ x: x + rand(-10, 10), y: y + rand(-10, 10), t: 0, r: rand(1.2, 2.2) })
    }
    if (this.trail.length > 160) this.trail.shift()
  }
  step(dt: number) {
    for (const p of this.trail) p.age += dt
    while (this.trail.length && this.trail[0].age > this.LIFE) this.trail.shift()
    for (const c of this.curls) c.t += dt
    this.curls = this.curls.filter((c) => c.t < 1.6)
    for (const d of this.dots) d.t += dt
    this.dots = this.dots.filter((d) => d.t < 1.4)
    return this.trail.length + this.curls.length + this.dots.length > 0
  }
  private stroke(ctx: CanvasRenderingContext2D, width: number, color: string, alpha: number) {
    ctx.strokeStyle = color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let i = 1; i < this.trail.length - 1; i++) {
      const a = this.trail[i - 1], b = this.trail[i], c = this.trail[i + 1]
      if (Number.isNaN(a.x + b.x + c.x)) continue
      const k = 1 - b.age / this.LIFE
      ctx.globalAlpha = alpha * k
      ctx.lineWidth = width * (0.35 + 0.65 * k)
      ctx.beginPath()
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2)
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2)
      ctx.stroke()
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    this.stroke(ctx, 7, '#f3d98b', 0.35)
    this.stroke(ctx, 2.6, '#9a6a12', 0.95)
    // curls: a double spiral that draws itself, then fades
    for (const c of this.curls) {
      const draw = Math.min(1, c.t / 0.55)
      const fade = c.t < 1 ? 1 : 1 - (c.t - 1) / 0.6
      ctx.strokeStyle = '#9a6a12'
      ctx.lineWidth = 2.2
      ctx.globalAlpha = fade
      for (const dir of [1, -1]) {
        ctx.beginPath()
        const turns = 2.2 * draw
        for (let th = 0; th <= turns * Math.PI * 2; th += 0.18) {
          const r = 3 + th * 2.6 * c.s
          const a = c.rot + dir * th
          const px = c.x + Math.cos(a) * r * dir
          const py = c.y + Math.sin(a) * r
          if (th === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
    }
    ctx.fillStyle = '#9a6a12'
    for (const d of this.dots) {
      if (d.t < 0) continue
      ctx.globalAlpha = Math.min(1, d.t * 6) * (1 - d.t / 1.4)
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

export function createTouchFx(kind: TouchEffect): TouchFx | null {
  switch (kind) {
    case 'petals':
      return new PetalBurst()
    case 'sparks':
      return new GoldenSparks()
    case 'ripple':
      return new LightRipple()
    case 'mehndi':
      return new MehndiTrail()
    default:
      return null
  }
}
