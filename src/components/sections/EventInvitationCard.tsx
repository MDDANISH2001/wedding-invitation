import { m as motion, useReducedMotion } from 'motion/react'
import { CalendarPlus, MapPin, Navigation } from 'lucide-react'
import { fxConfig } from '../../config/env'
import { googleCalendarUrl, icsUrl } from '../../lib/calendar'
import type { WeddingEvent } from '../../config/wedding'
import { dateParts, longDate } from '../../lib/date'
import { EASE_SILK, inkReveal, reveal } from '../../lib/motion'
import { DecorativeDivider } from '../art/DecorativeDivider'
import { FloralDecoration } from '../art/FloralDecoration'
import { LanternDecoration } from '../art/LanternDecoration'

/**
 * One programme entry as its own ivory card: a floral sprig across the top,
 * English + Urdu title, the date, the schedule rows, the venue and directions.
 */
export function EventInvitationCard({ event, index }: { event: WeddingEvent; index: number }) {
  const reduce = useReducedMotion()
  const d = dateParts(event.start)
  const base = index * 0.12
  const btn =
    'caps mt-6 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold shadow-[0_10px_20px_-12px_rgba(75,0,130,0.9)]'

  return (
    <motion.article
      aria-labelledby={`${event.id}-title`}
      className="relative mx-auto w-full min-w-0 max-w-[420px] pt-10"
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1, delay: base, ease: EASE_SILK }}
    >
      {event.ornament === 'lantern' && (
        <div className="pointer-events-none absolute -top-2 right-[9%] z-10 w-9">
          <LanternDecoration kind="lantern-hex" chain={0} delay={-1.2} />
        </div>
      )}
      <div
        className="relative border border-gold/45 bg-ivory/90 px-6 pb-9 pt-[88px] text-center shadow-[0_24px_40px_-26px_rgba(75,0,130,0.6)]"
        style={{ borderRadius: '50% 50% 14px 14px / 96px 96px 14px 14px' }}
      >
        {/* inner printed rule */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-1.5 border border-plum-deep/20"
          style={{ borderRadius: '50% 50% 10px 10px / 90px 90px 10px 10px' }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/2 w-[78%] -translate-x-1/2">
          <FloralDecoration variant={event.ornament === 'lantern' ? 'sprig' : 'arc'} className="h-auto w-full" />
        </div>

        <motion.p lang="ur" dir="rtl" className="urdu text-[clamp(24px,6.6vw,30px)] text-gold-deep" style={{ lineHeight: 1.9 }} {...reveal(base + 0.15)}>
          {event.titleUrdu}
        </motion.p>
        <motion.h3
          id={`${event.id}-title`}
          className="-mt-1 whitespace-nowrap font-script text-[clamp(32px,8.6vw,54px)] font-semibold leading-[1.15] tracking-wide text-plum-deep"
          {...inkReveal(base + 0.25, 1)}
        >
          {event.title}
        </motion.h3>
        <motion.p className="caps mt-1 text-sm font-bold text-ink/80" {...reveal(base + 0.35)}>
          {event.subtitle}
        </motion.p>

        <DecorativeDivider variant={2} className="mx-auto mt-3 w-[80%]" delay={base + 0.4} />

        <motion.div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3" {...reveal(base + 0.5)}>
          <span className="text-right font-serif text-xl font-bold italic text-plum">{d.weekday}</span>
          <span className="font-serif text-[68px] font-bold leading-none text-plum-deep">{d.day}</span>
          <span className="caps text-left text-[13px] font-bold leading-snug tracking-[0.12em] text-lavender-rich">
            {d.month}
            <br />
            {d.year}
          </span>
          <span className="sr-only">{longDate(event.start)}</span>
        </motion.div>

        <motion.dl
          className="mx-auto mt-6 max-w-[310px] divide-y divide-plum/20 border-y border-plum/25 font-serif text-[19px]"
          {...reveal(base + 0.6)}
        >
          {event.schedule.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between gap-4 px-1 py-2.5">
              <dt className="text-left font-semibold italic text-plum">{s.label}</dt>
              <dd className="text-right font-bold text-plum-deep">{s.time}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div className="mt-5 flex flex-col items-center px-4" {...reveal(base + 0.7)}>
          <span className="caps flex items-center gap-1.5 text-sm font-bold text-gold-deep">
            <MapPin aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Venue
          </span>
          <span className="mt-1 font-serif text-xl font-bold text-plum-deep">{event.venueName}</span>
          {event.venueAddress && <span className="font-serif text-[17px] font-semibold text-plum">{event.venueAddress}</span>}
        </motion.div>

        {(event.mapsUrl || event.showDirections) && (
          <motion.div className="flex flex-col items-center" {...reveal(base + 0.8)}>
            {event.mapsUrl ? (
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} group/btn bg-btn text-btn-ink transition-colors duration-300 hover:bg-btn-hover`}
              >
                <Navigation aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-12" strokeWidth={2} />
                Get directions
              </a>
            ) : (
              <>
                <span aria-disabled="true" className={`${btn} cursor-default bg-btn/55 text-btn-ink`}>
                  <Navigation aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  Get directions
                </span>
                <span className="mt-1.5 font-serif text-[15px] font-semibold italic text-plum">Location link coming soon</span>
              </>
            )}
          </motion.div>
        )}

        {fxConfig.calendar && (
          <motion.div className="mt-4 flex flex-col items-center" {...reveal(base + 0.9)}>
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="caps inline-flex min-h-11 items-center gap-2 rounded-full border border-plum-deep/40 px-5 text-[13px] font-bold text-plum-deep transition-colors duration-300 hover:bg-btn hover:text-btn-ink"
            >
              <CalendarPlus aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              Add to calendar
            </a>
            <a
              href={icsUrl(event)}
              download={`${event.id}.ics`}
              className="mt-1.5 font-serif text-[15px] font-semibold italic text-plum underline decoration-gold/60 underline-offset-4"
            >
              Apple / Outlook calendar
            </a>
          </motion.div>
        )}
      </div>
    </motion.article>
  )
}
