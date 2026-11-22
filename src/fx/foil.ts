/**
 * Gold foil (VITE_FOIL): drives the CSS variable --foil-x (0…1) that
 * positions the highlight in every `.gold-text`, from the phone's tilt or
 * the cursor. With no input, a slow CSS animation keeps the foil alive
 * (see `foil-idle` in index.css). Updates are rAF-throttled.
 */
let started = false

export function startFoil() {
  if (started || typeof window === 'undefined') return
  started = true
  const root = document.documentElement
  let target = 0.5
  let raf = 0
  let idle = 0
  const push = () => {
    raf = 0
    root.style.setProperty('--foil-x', target.toFixed(3))
  }
  const live = (v: number) => {
    target = Math.min(1, Math.max(0, v))
    root.classList.add('foil-live')
    window.clearTimeout(idle)
    idle = window.setTimeout(() => root.classList.remove('foil-live'), 4000)
    if (!raf) raf = requestAnimationFrame(push)
  }
  let base: number | null = null
  window.addEventListener(
    'deviceorientation',
    (e) => {
      if (e.gamma == null) return
      if (base === null) base = e.gamma
      live(0.5 + (e.gamma - base) / 50)
    },
    { passive: true },
  )
  window.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && live(e.clientX / window.innerWidth), { passive: true })
}

/** iOS asks permission for motion sensors; must run inside a tap. */
export function requestMotion() {
  const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  try {
    D?.requestPermission?.().catch(() => {})
  } catch {
    /* not iOS */
  }
}
