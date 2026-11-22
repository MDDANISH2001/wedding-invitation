import { useEffect, useRef, useState } from 'react'
import { PALETTE } from '../../theme/palette'

/**
 * The three.js night sky (VITE_SKY), fixed behind the pages. Loads its own
 * chunk; if WebGL is unavailable the pages simply keep their CSS night table.
 */
export function SkyLayer() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    let dispose = () => {}
    import('../../three/sky')
      .then(async ({ SkyScene }) => {
        if (!alive || !ref.current) return
        const sky = new SkyScene(ref.current, PALETTE)
        dispose = () => sky.dispose()
        await sky.start()
        if (alive) setReady(true)
      })
      .catch((e) => {
        console.warn('Night sky unavailable', e)
        document.documentElement.classList.remove('sky-on')
      })
    return () => {
      alive = false
      dispose()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-[1500ms]"
      style={{ opacity: ready ? 1 : 0 }}
    />
  )
}
