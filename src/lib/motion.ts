import type { Transition } from 'motion/react'

export const EASE_SILK = [0.22, 1, 0.36, 1] as const

/** Shared in-view reveal: soft rise + fade, played once. */
export function reveal(delay = 0, y = 18, duration = 0.9) {
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-8% 0px' },
    transition: { duration, delay, ease: EASE_SILK } satisfies Transition,
  }
}

/** Ink-like left-to-right unveiling for script lettering. */
export function inkReveal(delay = 0, duration = 1.1) {
  return {
    initial: { opacity: 0, clipPath: 'inset(-60% 110% -60% -10%)' },
    whileInView: { opacity: 1, clipPath: 'inset(-60% -10% -60% -10%)' },
    viewport: { once: true, margin: '-8% 0px' },
    transition: { duration, delay, ease: [0.45, 0, 0.2, 1] } satisfies Transition,
  }
}
