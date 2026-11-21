import { useEffect, useRef } from 'react'
import { fxConfig } from '../config/env'
import { startAmbience } from './ambience'
import { startTouch } from './touch'

/**
 * One fixed, click-through layer above the pages holding the ambient petals
 * + lanterns and the chosen touch effect.
 *
 * Everything inside is plain elements animated with the Web Animations API on
 * transform / opacity, which the browser runs on the GPU compositor. The
 * effects stay smooth while the main thread is busy, with no canvas and no
 * per-frame JavaScript. Skipped entirely for guests who prefer reduced motion.
 */
export function FxLayer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const stops = [startAmbience(root, fxConfig.ambientPetals, fxConfig.ambientLanterns), startTouch(root, fxConfig.touchEffect)]
    return () => stops.forEach((stop) => stop())
  }, [])

  return <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" style={{ contain: 'strict' }} />
}
