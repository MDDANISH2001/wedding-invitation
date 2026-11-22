import { useEffect, useRef } from 'react'

const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fewer drifting lights on small / weak devices. */
const BOKEH_COUNT = (() => {
  if (typeof navigator === 'undefined') return 8
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4
  return mem <= 2 || cores <= 4 ? 6 : 10
})()

/**
 * The room behind everything: the baked picture (lamp light, the Qur'an on
 * its rehal, bokeh), light shafts that breathe, two layers of drifting gold
 * dust and a few floating out-of-focus lights. Compositor-only motion.
 */
export function Backdrop() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host || REDUCED) return
    const anims: Animation[] = []
    for (let i = 0; i < BOKEH_COUNT; i++) {
      const el = document.createElement('span')
      el.className = 'noor-bokeh'
      const size = 18 + Math.random() * 70
      const left = Math.random() < 0.5 ? Math.random() * 26 : 74 + Math.random() * 26
      el.style.cssText = `width:${size}px;height:${size}px;left:${left}vw;top:${8 + Math.random() * 84}vh`
      host.appendChild(el)
      const dx = (Math.random() - 0.5) * 60
      const dy = -30 - Math.random() * 70
      const peak = 0.35 + Math.random() * 0.5
      anims.push(
        el.animate(
          [
            { transform: 'translate3d(0,0,0) scale(.85)', opacity: 0 },
            { opacity: peak, offset: 0.35 },
            { opacity: peak * 0.6, offset: 0.7 },
            { transform: `translate3d(${dx}px,${dy}px,0) scale(1.1)`, opacity: 0 },
          ],
          { duration: 9000 + Math.random() * 9000, delay: -Math.random() * 9000, iterations: Infinity, easing: 'ease-in-out' },
        ),
      )
    }
    return () => {
      anims.forEach((a) => a.cancel())
      host.replaceChildren()
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="noor-bg" />
      <div className="noor-rays" />
      <div className="noor-dust" />
      <div className="noor-dust near" />
      <div ref={ref} />
      <div className="noor-shade" />
    </div>
  )
}
