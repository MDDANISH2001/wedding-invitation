import { artUrl } from '../lib/art'
import { el, petalUrls, pick, rand } from './petals'

const LANTERNS = ['lantern-small', 'lantern-grand', 'lantern-globe'] as const

/**
 * Background ambience: petals drifting down and lantern lights floating up.
 *
 * Every particle is a tiny element animated once with the Web Animations
 * API, using transform/opacity only, so the GPU compositor runs it. There is
 * no per-frame JavaScript, and a busy main thread (scrolling, fonts, React)
 * can't make the petals stutter or stop.
 *
 * Each petal is three nested layers: fall (Y), sway (X) and tumble (spin + a
 * 3-D flip). Depth `z` scales size, speed and opacity.
 */
export function startAmbience(root: HTMLElement, petals: number, lanterns: number): () => void {
  const layer = el('inset:0;width:100%;height:100%;transition:transform .8s cubic-bezier(.22,1,.36,1);will-change:transform')
  root.append(layer)
  const anims: Animation[] = []
  const loop = (target: Element, frames: Keyframe[], duration: number, opts: KeyframeAnimationOptions = {}) =>
    anims.push(target.animate(frames, { duration, iterations: Infinity, ...opts }))

  const H = Math.max(window.innerHeight, 500)
  const urls = petalUrls()

  for (let i = 0; i < petals; i++) {
    const z = rand(0.45, 1)
    const size = rand(10, 19) * z
    const fall = el(`left:${rand(-3, 100).toFixed(2)}%;width:${size}px;height:${size}px;opacity:${(0.55 + 0.45 * z).toFixed(2)}`)
    const sway = el('position:relative;width:100%;height:100%')
    const tumble = el(`position:relative;width:100%;height:100%;background:${pick(urls)} center/contain no-repeat`)
    sway.append(tumble)
    fall.append(sway)
    layer.append(fall)

    const fallMs = ((H + 80) / (rand(22, 40) * z)) * 1000
    loop(fall, [{ transform: 'translate3d(0,-40px,0)' }, { transform: 'translate3d(0,calc(100vh + 40px),0)' }], fallMs, {
      easing: 'linear',
      delay: -rand(0, fallMs),
    })
    const amp = rand(14, 36)
    const swayMs = rand(2800, 4200)
    loop(sway, [{ transform: `translateX(${-amp}px)` }, { transform: `translateX(${amp}px)` }], swayMs, {
      easing: 'ease-in-out',
      direction: 'alternate',
      delay: -rand(0, swayMs),
    })
    const dir = Math.random() < 0.5 ? 1 : -1
    const spinMs = rand(3000, 6500)
    loop(tumble, [{ transform: 'perspective(90px) rotate(0deg) rotateY(0deg)' }, { transform: `perspective(90px) rotate(${360 * dir}deg) rotateY(${720 * dir}deg)` }], spinMs, {
      easing: 'linear',
      delay: -rand(0, spinMs),
    })
  }

  // lanterns: hug the edges so they frame the card instead of covering text
  const band = window.innerWidth < 700 ? 9 : 24
  for (let i = 0; i < lanterns; i++) {
    const z = rand(0.4, 1)
    const size = rand(20, 32) * (0.55 + 0.45 * z)
    const g = size * 3.2
    const x = Math.random() < 0.5 ? rand(0, band) : rand(100 - band, 100)
    const rise = el(`left:${x.toFixed(2)}%;width:${size}px;height:${size * 1.9}px`)
    const drift = el('position:relative;width:100%;height:100%')
    const glow = el(
      `left:50%;top:40%;width:${g}px;height:${g}px;margin:${-g / 2}px 0 0 ${-g / 2}px;border-radius:50%;` +
        `background:radial-gradient(closest-side,rgba(255,206,120,${(0.5 * z).toFixed(2)}),rgba(255,206,120,${(0.14 * z).toFixed(2)}) 60%,transparent)`,
    )
    const img = el(
      `position:relative;width:100%;height:100%;opacity:${Math.min(0.92, 0.3 + 0.6 * z).toFixed(2)};` +
        `background:url("${artUrl(pick([...LANTERNS]))}") center/contain no-repeat`,
    )
    drift.append(glow, img)
    rise.append(drift)
    layer.append(rise)

    const riseMs = ((H + 200) / (rand(9, 18) * z)) * 1000
    loop(rise, [{ transform: 'translate3d(0,calc(100vh + 60px),0)' }, { transform: `translate3d(0,${-size * 3}px,0)` }], riseMs, {
      easing: 'linear',
      delay: -rand(0, riseMs),
    })
    loop(drift, [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }], rand(4000, 7000), { easing: 'ease-in-out', direction: 'alternate' })
    loop(glow, [{ opacity: 0.65 }, { opacity: 1 }, { opacity: 0.8 }], rand(1400, 2400), { easing: 'ease-in-out', direction: 'alternate' })
  }

  // gentle parallax: the whole layer leans with the pointer / phone tilt (one compositor transform)
  let raf = 0
  const lean = (nx: number, ny: number) => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => (layer.style.transform = `translate3d(${(nx * 16).toFixed(1)}px,${(ny * 10).toFixed(1)}px,0)`))
  }
  const onMove = (e: PointerEvent) => e.pointerType === 'mouse' && lean((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return
    lean(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)))
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('deviceorientation', onTilt, { passive: true })

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('deviceorientation', onTilt)
    anims.forEach((a) => a.cancel())
    layer.remove()
  }
}
