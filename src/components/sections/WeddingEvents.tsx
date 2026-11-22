import { m as motion, useReducedMotion, useTransform } from 'motion/react'
import { wedding } from '../../config/wedding'
import { inkReveal, reveal } from '../../lib/motion'
import { Sheet } from '../layout/Sheet'
import { usePage } from '../layout/PageContext'
import { ArtImage } from '../art/ArtImage'
import { FloralDecoration } from '../art/FloralDecoration'
import { LanternDecoration } from '../art/LanternDecoration'
import { EventInvitationCard } from './EventInvitationCard'
import { WeddingCountdown } from './WeddingCountdown'
import { IS_CLASSIC } from '../../config/env'
import { MosqueSvg, SaveDateSeal } from '../art/mughal'

/** Page 2: the mosque at dusk, the programme heading, countdown and both events. */
export function WeddingEvents() {
  const { enter } = usePage()
  const reduce = useReducedMotion()
  const yScene = useTransform(enter, [0, 1], [50, 0])
  const { programme, inshaAllah } = wedding

  return (
    <Sheet>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden md:block">
        <div className="absolute left-[7%] top-0 w-10 lg:w-12">
          <LanternDecoration kind="lantern-small" chain={90} delay={-1} />
        </div>
        <div className="absolute right-[7%] top-0 w-10 lg:w-12">
          <LanternDecoration kind="lantern-globe" chain={50} delay={-2.5} />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-11 pb-24 pt-10 sm:px-14 md:pt-12">
        <header className="flex flex-col items-center text-center">
          <motion.div className="w-[min(100%,500px)]" style={reduce ? undefined : { y: yScene }}>
            {IS_CLASSIC ? (
              <ArtImage name="mosque" alt="Watercolour of a Mughal mosque in lavender, with gardens" className="h-auto w-full" />
            ) : (
              <MosqueSvg className="h-auto w-full drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]" />
            )}
          </motion.div>
          <motion.p lang="ur" dir="rtl" className="urdu mt-1 text-[clamp(26px,7vw,34px)] text-gold-deep" style={{ lineHeight: 1.8 }} {...reveal(0)}>
            {programme.headingUrdu}
          </motion.p>
          <motion.h2
            className="-mt-2 font-script text-[clamp(56px,14vw,84px)] font-semibold leading-[1.1] tracking-wide text-plum-deep"
            {...inkReveal(0.15)}
          >
            {programme.heading}
          </motion.h2>
          <motion.p className="mt-1 flex items-center gap-3" {...reveal(0.25)}>
            <span lang="ur" dir="rtl" className="urdu -mt-3 text-[clamp(20px,5.4vw,24px)] text-gold-deep" style={{ lineHeight: 1.7 }}>
              {inshaAllah.urdu}
            </span>
            <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <span className="font-serif text-[clamp(20px,5.4vw,24px)] font-black text-gold-deep">{inshaAllah.latin}</span>
          </motion.p>
          <motion.p className="mx-auto mt-2 max-w-md px-4 font-serif text-xl font-semibold italic leading-snug text-plum" {...reveal(0.3)}>
            {programme.intro}
          </motion.p>
          <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <motion.div className="w-[116px] shrink-0" {...reveal(0.35, 10)}>
              {IS_CLASSIC ? (
                <ArtImage name="seal-save-date" alt="Save the date" className="h-auto w-full" />
              ) : (
                <SaveDateSeal className="h-auto w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]" />
              )}
            </motion.div>
            <WeddingCountdown />
          </div>
        </header>

        <div className={`mt-12 grid gap-14 md:gap-10 lg:gap-14 ${wedding.events.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {wedding.events.map((ev, i) => (
            <div key={ev.id} className={`min-w-0 ${i === 1 ? 'md:mt-14' : ''}`}>
              <EventInvitationCard event={ev} index={i} />
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute bottom-7 left-7 w-24 sm:w-36">
        <FloralDecoration variant="corner-b" flipX className="h-auto w-full" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-7 right-7 w-24 sm:w-36">
        <FloralDecoration variant="corner-b" className="h-auto w-full" />
      </div>
    </Sheet>
  )
}
