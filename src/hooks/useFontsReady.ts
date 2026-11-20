import { useEffect, useState } from 'react'

/**
 * Resolves once web fonts have loaded (or after `timeout` ms), so the
 * opening animation never reveals fallback lettering mid-flourish.
 */
export function useFontsReady(timeout = 700) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        setReady(true)
      }
    }
    const t = window.setTimeout(finish, timeout)
    document.fonts?.ready.then(finish).catch(finish)
    return () => window.clearTimeout(t)
  }, [timeout])
  return ready
}
