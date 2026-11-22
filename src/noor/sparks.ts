const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A puff of gold sparks rising from a point: each spark is one element
 * animated once on the compositor, removed when it finishes.
 */
export function sparkBurst(x: number, y: number, count = 22, spread = 160) {
  if (REDUCED) return
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span')
    const size = 2 + Math.random() * 3.5
    s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;z-index:40;background:radial-gradient(circle,#fff6d8 0%,#f1cf85 45%,rgba(241,207,133,0) 72%);box-shadow:0 0 ${size * 3}px rgba(255,200,110,.8)`
    document.body.appendChild(s)
    const dx = (Math.random() - 0.5) * spread * 2
    const dy = -(30 + Math.random() * spread)
    const a = s.animate(
      [
        { transform: 'translate3d(-50%,-50%,0) scale(.4)', opacity: 0 },
        { transform: `translate3d(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3}px),0) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px),0) scale(.3)`, opacity: 0 },
      ],
      { duration: 1400 + Math.random() * 1400, delay: Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' },
    )
    a.onfinish = () => s.remove()
  }
}
