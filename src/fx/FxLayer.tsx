import { useEffect, useRef } from 'react'
import { fxConfig } from '../config/env'
import { artUrl } from '../lib/art'
import { Ambience } from './ambience'
import { loadImage } from './sprites'
import { createTouchFx } from './touch'

/**
 * One full-screen canvas above the pages (pointer-events: none) that paints
 * the ambient petals + lanterns and the chosen touch effect.
 *
 * Cost control: device-pixel-ratio capped, the loop sleeps when nothing
 * moves and while the tab is hidden, and the whole layer is skipped for
 * guests who prefer reduced motion.
 */
export function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ambience = new Ambience(fxConfig.ambientPetals, fxConfig.ambientLanterns)
    const touch = createTouchFx(fxConfig.touchEffect)
    if (!ambience.active && !touch) return

    let w = 0, h = 0, dpr = 1
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ambience.resize(w, h)
    }
    resize()

    if (fxConfig.ambientLanterns > 0)
      Promise.all(['lantern-small', 'lantern-grand', 'lantern-globe'].map((n) => loadImage(artUrl(n as 'lantern-small')))).then((imgs) =>
        ambience.setLanternSprites(imgs.filter((i): i is HTMLImageElement => i !== null)),
      )

    let raf = 0
    let last = 0
    let touchAlive = false
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      ambience.step(dt)
      touchAlive = touch ? touch.step(dt) : false
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ambience.draw(ctx)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      touch?.draw(ctx)
      if ((ambience.active || touchAlive) && document.visibilityState === 'visible') raf = requestAnimationFrame(frame)
      else {
        raf = 0
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        if (!ambience.active) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    const wake = () => {
      if (!raf && document.visibilityState === 'visible') {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    wake()

    // pointer → touch effect + parallax
    let px = -1, py = -1, down = false
    const onDown = (e: PointerEvent) => {
      down = true
      px = e.clientX
      py = e.clientY
      touch?.tap(e.clientX, e.clientY)
      wake()
    }
    const onMove = (e: PointerEvent) => {
      ambience.parallax.x = (e.clientX / w) * 2 - 1
      ambience.parallax.y = (e.clientY / h) * 2 - 1
      // mice leave a trail on hover; fingers only while touching
      if (!touch || (e.pointerType !== 'mouse' && !down)) return
      const d = px < 0 ? 0 : Math.hypot(e.clientX - px, e.clientY - py)
      px = e.clientX
      py = e.clientY
      if (d > 0) {
        touch.move(e.clientX, e.clientY, d)
        wake()
      }
    }
    const onUp = () => {
      down = false
      px = py = -1
    }
    // phone tilt (Android etc. — iOS needs a permission prompt, so it simply keeps the static view)
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      ambience.parallax.x = Math.max(-1, Math.min(1, e.gamma / 30))
      ambience.parallax.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30))
    }
    const onVisible = () => document.visibilityState === 'visible' && wake()

    window.addEventListener('resize', resize)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    window.addEventListener('deviceorientation', onTilt, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('deviceorientation', onTilt)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
}
