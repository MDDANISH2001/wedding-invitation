import { m as motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { EASE_SILK } from '../../lib/motion'
import { useOpened } from '../layout/OpenedContext'
import { FloralDecoration } from '../art/FloralDecoration'
import { LanternDecoration } from '../art/LanternDecoration'
import { HERO_CARD_WIDTH, HeroCard } from './HeroCard'

/**
 * Page 1: the invitation card. It stays hidden until the envelope's flying
 * copy lands exactly on it, then takes over; only the surroundings animate in.
 */
export function InvitationHero() {
  const opened = useOpened()
  const reduce = useReducedMotion()

  const play = (delay: number, from: TargetAndTransition = { opacity: 0, y: 12 }, duration = 0.8) => {
    if (reduce) return {}
    const to = Object.fromEntries(Object.keys(from).map((k) => [k, k === 'opacity' || k === 'scale' ? 1 : 0])) as TargetAndTransition
    return { initial: from, animate: opened ? to : from, transition: { duration, delay, ease: EASE_SILK } }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-2 py-3 sm:py-6">
      {/* Wide screens: florals with hanging lanterns in the top corners, lanterns, bottom florals */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div className="absolute -left-3 -top-3 w-[22vw] max-w-[320px]" {...play(0.1, { opacity: 0, y: -30 }, 1.2)}>
          <FloralDecoration variant="corner-lanterns" flipX className="h-auto w-full" />
        </motion.div>
        <motion.div className="absolute -right-3 -top-3 w-[22vw] max-w-[320px]" {...play(0.1, { opacity: 0, y: -30 }, 1.2)}>
          <FloralDecoration variant="corner-lanterns" className="h-auto w-full" />
        </motion.div>
        {[
          { cls: 'left-[24%] w-10', chain: 90, d: -1.5, kind: 'lantern-globe' as const },
          { cls: 'right-[24%] w-10', chain: 140, d: -3, kind: 'lantern-grand' as const },
        ].map((l, i) => (
          <motion.div key={i} className={`absolute top-0 ${l.cls}`} {...play(0.3 + i * 0.1, { opacity: 0, y: -40 }, 1.2)}>
            <LanternDecoration kind={l.kind} chain={l.chain} delay={l.d} />
          </motion.div>
        ))}
        <motion.div className="absolute -bottom-4 -left-4 w-[20vw] max-w-[300px]" {...play(0.2, { opacity: 0, x: -30 }, 1.2)}>
          <FloralDecoration variant="corner-a" flipX className="anim-breathe h-auto w-full" />
        </motion.div>
        <motion.div className="absolute -bottom-4 -right-4 w-[20vw] max-w-[300px]" {...play(0.2, { opacity: 0, x: 30 }, 1.2)}>
          <FloralDecoration variant="corner-a" className="anim-breathe h-auto w-full" />
        </motion.div>
      </div>

      <div data-hero-card className="relative" style={{ width: HERO_CARD_WIDTH, opacity: opened ? 1 : 0 }}>
        <HeroCard />
      </div>

      <motion.a
        href="#programme"
        className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-0.5 rounded-full bg-ivory/95 px-4 py-1.5 text-plum-deep shadow-[0_6px_18px_-8px_rgba(75,0,130,0.5)] ring-1 ring-gold/40"
        {...play(1.2, { opacity: 0, y: 8 })}
        onClick={(e) => {
          e.preventDefault()
          window.scrollBy({ top: window.innerHeight, behavior: reduce ? 'auto' : 'smooth' })
        }}
      >
        <span className="caps whitespace-nowrap text-xs font-bold">See the programme</span>
        <ChevronDown aria-hidden="true" className="anim-cue h-4 w-4" strokeWidth={2} />
      </motion.a>
    </div>
  )
}
