import { AnimatePresence, m as motion, useReducedMotion } from 'motion/react'
import { wedding } from '../../config/wedding'
import { EASE_SILK, reveal } from '../../lib/motion'
import { useCountdown } from '../../hooks/useCountdown'
import { Sparkle } from '../art/Monogram'

const pad = (n: number) => String(n).padStart(2, '0')

/** A compact live countdown to the configured target, shown above the event panels. */
export function WeddingCountdown() {
  const { target, label, startedMessage } = wedding.countdown
  const t = useCountdown(target)
  const reduce = useReducedMotion()

  if (t.expired) {
    return (
      <motion.div className="flex items-center justify-center gap-3 text-center" {...reveal(0.2)}>
        <Sparkle className="h-3 w-3 shrink-0 text-lavender-rich" />
        <p className="font-serif text-xl font-semibold italic text-plum-deep">{startedMessage}</p>
        <Sparkle className="h-3 w-3 shrink-0 text-lavender-rich" />
      </motion.div>
    )
  }

  const units = [
    { key: 'd', label: t.days === 1 ? 'Day' : 'Days', value: t.days < 100 ? pad(t.days) : String(t.days) },
    { key: 'h', label: 'Hours', value: pad(t.hours) },
    { key: 'm', label: 'Minutes', value: pad(t.minutes) },
    { key: 's', label: 'Seconds', value: pad(t.seconds) },
  ]

  return (
    <motion.div className="flex flex-col items-center" {...reveal(0.2)}>
      <p className="caps text-sm font-bold tracking-[0.14em] text-black/80">Counting down to {label}</p>
      <div
        role="timer"
        aria-label={`${t.days} days, ${t.hours} hours and ${t.minutes} minutes until ${label}`}
        className="mt-3 flex items-stretch rounded-[999px] border border-plum/25 bg-ivory/70 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:px-4"
      >
        {units.map((u, i) => (
          <div key={u.key} className="flex items-stretch">
            {i > 0 && <span aria-hidden="true" className="mx-1 my-2 w-px bg-gradient-to-b from-transparent via-plum/35 to-transparent sm:mx-3" />}
            <div className="flex w-[64px] flex-col items-center sm:w-[76px]" aria-hidden="true">
              <div className="relative h-[1.15em] overflow-hidden font-serif text-[34px] font-bold leading-[1.15] tabular-nums text-plum-deep sm:text-[40px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={u.value}
                    className="block"
                    initial={reduce ? false : { y: '-70%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={reduce ? undefined : { y: '70%', opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE_SILK }}
                  >
                    {u.value}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="caps text-[13px] font-bold tracking-[0.04em] text-plum">{u.label}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
