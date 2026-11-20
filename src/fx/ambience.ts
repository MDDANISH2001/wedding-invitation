import { makeGlow, makePetals, rand } from './sprites'

interface Petal {
  x: number
  y: number
  z: number
  size: number
  rot: number
  spin: number
  flip: number
  flipSpeed: number
  vy: number
  sway: number
  swayAmp: number
  sprite: number
}

interface Lantern {
  x: number
  y: number
  z: number
  size: number
  vy: number
  phase: number
  sprite: number
  drift: number
}

/**
 * Background ambience: lavender petals drifting down and golden lantern
 * lights floating up, with depth (size / speed / opacity) and a light
 * parallax that follows the pointer or the phone's tilt.
 */
export class Ambience {
  private petals: Petal[] = []
  private lanterns: Lantern[] = []
  private petalSprites = makePetals()
  private glow = makeGlow('255,206,120')
  private lanternSprites: HTMLImageElement[] = []
  private w = 0
  private h = 0
  private t = 0
  parallax = { x: 0, y: 0 }

  private petalCount: number
  private lanternCount: number

  constructor(petalCount: number, lanternCount: number) {
    this.petalCount = petalCount
    this.lanternCount = lanternCount
  }

  get active() {
    return this.petalCount + this.lanternCount > 0
  }

  setLanternSprites(imgs: HTMLImageElement[]) {
    this.lanternSprites = imgs
  }

  resize(w: number, h: number) {
    const first = this.w === 0
    this.w = w
    this.h = h
    if (first) {
      for (let i = 0; i < this.petalCount; i++) this.petals.push(this.newPetal(true))
      for (let i = 0; i < this.lanternCount; i++) this.lanterns.push(this.newLantern(true))
    }
  }

  private newPetal(anywhere: boolean): Petal {
    const z = rand(0.45, 1)
    return {
      x: rand(-0.05, 1.05) * this.w,
      y: anywhere ? rand(-0.1, 1) * this.h : rand(-60, -20),
      z,
      size: rand(9, 17) * z,
      rot: rand(0, Math.PI * 2),
      spin: rand(-1.2, 1.2),
      flip: rand(0, Math.PI * 2),
      flipSpeed: rand(1.2, 2.6),
      vy: rand(22, 40) * z,
      sway: rand(0, Math.PI * 2),
      swayAmp: rand(14, 36),
      sprite: (Math.random() * this.petalSprites.length) | 0,
    }
  }

  private newLantern(anywhere: boolean): Lantern {
    const z = rand(0.4, 1)
    // mostly along the edges so they frame the card instead of covering text
    // keep lanterns out of the central text column: hug the edges on phones, the side margins on wide screens
    const band = this.w < 700 ? 0.09 : 0.24
    const u = Math.random() < 0.5 ? rand(0, band) : rand(1 - band, 1)
    return {
      x: u * this.w,
      y: anywhere ? rand(0.1, 1.1) * this.h : this.h + rand(30, 120),
      z,
      size: rand(20, 32) * (0.55 + 0.45 * z),
      vy: rand(9, 18) * z,
      phase: rand(0, Math.PI * 2),
      sprite: (Math.random() * 3) | 0,
      drift: rand(-4, 4),
    }
  }

  step(dt: number) {
    this.t += dt
    for (const p of this.petals) {
      p.y += p.vy * dt
      p.sway += dt * 0.9
      p.rot += p.spin * dt
      p.flip += p.flipSpeed * dt
      if (p.y > this.h + 30) Object.assign(p, this.newPetal(false))
    }
    for (const l of this.lanterns) {
      l.y -= l.vy * dt
      l.x += l.drift * dt
      if (l.y < -l.size * 3) Object.assign(l, this.newLantern(false))
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x: px, y: py } = this.parallax
    // lanterns: soft glow + brass sprite, gently flickering
    for (const l of this.lanterns) {
      const flicker = 0.82 + 0.18 * Math.sin(this.t * 3.1 + l.phase) * Math.sin(this.t * 1.7 + l.phase * 2)
      const x = l.x + px * 18 * l.z + Math.sin(this.t * 0.6 + l.phase) * 6
      const y = l.y + py * 12 * l.z
      const g = l.size * 3.2
      ctx.globalAlpha = 0.5 * flicker * l.z
      ctx.drawImage(this.glow, x - g / 2, y - g / 2, g, g)
      const img = this.lanternSprites[l.sprite % Math.max(1, this.lanternSprites.length)]
      if (img) {
        const h = l.size * 1.9
        const w = (h * img.naturalWidth) / img.naturalHeight
        ctx.globalAlpha = Math.min(0.92, 0.3 + 0.6 * l.z)
        ctx.drawImage(img, x - w / 2, y - h * 0.6, w, h)
      }
    }
    // petals: tumbling (scaleX by cos(flip) fakes the 3-D turn)
    for (const p of this.petals) {
      const x = p.x + Math.sin(p.sway) * p.swayAmp + px * 26 * p.z
      const y = p.y + py * 16 * p.z
      ctx.globalAlpha = 0.55 + 0.45 * p.z
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(p.rot)
      ctx.scale(0.25 + 0.75 * Math.abs(Math.cos(p.flip)), 1)
      ctx.drawImage(this.petalSprites[p.sprite], -p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }
}
