import { useEffect, useState } from 'react'
import { remainingUntil, type Remaining } from '../lib/date'

/**
 * Live countdown to an ISO date. Ticks once per second, aligned to
 * the wall-clock second, and stops ticking once the target passes.
 */
export function useCountdown(targetIso: string): Remaining & { expired: boolean } {
  const target = new Date(targetIso).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (Number.isNaN(target)) return
    let timer: number
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t < target) timer = window.setTimeout(tick, 1000 - (t % 1000) + 5)
    }
    tick()
    // Re-sync when a backgrounded tab (e.g. WhatsApp in-app browser) returns.
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [target])

  const r = remainingUntil(Number.isNaN(target) ? 0 : target, now)
  return { ...r, expired: r.total === 0 }
}
