import { m as motion, useReducedMotion } from "motion/react";
import { ArrowUp, Heart, MessageCircle, Phone } from "lucide-react";
import { wedding } from "../../config/wedding";
import { inkReveal, reveal } from "../../lib/motion";
import { Sheet } from "../layout/Sheet";
import { CuspFrame } from "../art/frames";
import { ArtImage } from "../art/ArtImage";
import { FloralDecoration } from "../art/FloralDecoration";
import { DecorativeDivider } from "../art/DecorativeDivider";
import { Medallion } from "../art/mughal";
import { IS_CLASSIC } from "../../config/env";

function whatsappUrl(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Page 3: Alhamdulillah, a dua for the couple, the verse, R.S.V.P. and compliments. */
export function ClosingInvitation() {
  const reduce = useReducedMotion();
  const { duas, rsvp, compliments, closing, childNote } = wedding;
  const contacts = rsvp.contacts.filter((c) => c.name.trim() || c.phone.trim());

  return (
    <Sheet>
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-11 pb-[clamp(230px,64vw,310px)] pt-12 text-center sm:px-14 md:pt-16">
        {/* Alhamdulillah in the cusped floral frame */}
        <motion.div className="w-[min(72vw,300px)]" {...reveal(0, 30, 1.1)}>
          <CuspFrame>
            <motion.p
              lang="ar"
              dir="rtl"
              className="arabic gold-text anim-sheen pt-2 text-[clamp(34px,10vw,48px)] font-bold leading-[1.9]"
              {...inkReveal(0.3, 1.2)}
            >
              {duas.alhamdulillah.arabic}
            </motion.p>
            <p className="font-script text-[clamp(30px,8vw,38px)] font-semibold leading-none tracking-wide text-plum-deep">
              {duas.alhamdulillah.latin}
            </p>
            <p className="mt-1 font-serif text-lg font-semibold italic leading-snug text-plum">
              {duas.alhamdulillah.meaning}
            </p>
          </CuspFrame>
        </motion.div>

        {/* Dua for the couple */}
        <motion.section
          className="mt-6 max-w-xl"
          aria-labelledby="dua-heading"
          {...reveal(0.1)}
        >
          <h2
            id="dua-heading"
            className="caps text-sm font-bold text-ink/80"
          >
            {duas.couple.heading}
          </h2>
          <p
            lang="ar"
            dir="rtl"
            className="arabic mt-2 text-[clamp(24px,6.6vw,31px)] font-bold leading-[1.9] text-plum-deep"
          >
            {duas.couple.arabic}
          </p>
          <p className="mt-1 px-2 font-serif text-lg font-semibold italic leading-snug text-plum">
            {duas.couple.latin}
          </p>
          <p className="mt-2 px-2 font-serif text-xl font-semibold leading-snug text-plum-deep">
            “{duas.couple.meaning}”
          </p>
        </motion.section>

        <DecorativeDivider
          variant={4}
          className="mt-6 w-[min(80%,280px)]"
          delay={0.2}
        />

        <motion.figure className="mt-4 max-w-lg" {...reveal(0.2)}>
          <blockquote className="px-2 font-serif text-xl font-semibold italic leading-snug text-plum">
            “{duas.verse.text}”
          </blockquote>
          <figcaption className="caps mt-2 text-sm font-bold text-gold-deep">
            {duas.verse.source}
          </figcaption>
        </motion.figure>

        <motion.div className="mt-6" {...reveal(0.25)}>
          <p
            lang="ur"
            dir="rtl"
            className="urdu text-[clamp(21px,5.8vw,27px)] text-plum-deep"
            style={{ lineHeight: 2 }}
          >
            {duas.welcomeUrdu}
          </p>
          <p className="px-2 font-serif text-xl font-semibold italic leading-snug text-plum">
            {duas.welcome}
          </p>
        </motion.div>

        <DecorativeDivider
          variant={5}
          className="mt-6 w-[min(80%,280px)]"
          delay={0.2}
        />

        {/* R.S.V.P. */}
        <motion.section
          className="mt-4 flex flex-col items-center"
          aria-labelledby="rsvp-heading"
          {...reveal(0.3)}
        >
          <h2
            id="rsvp-heading"
            className="font-script text-[clamp(46px,12vw,60px)] font-semibold leading-[1.15] tracking-wide text-plum-deep"
          >
            {rsvp.heading}
          </h2>
          {contacts.length > 0 && (
            <ul className="mt-3 flex flex-nowrap items-center justify-center gap-2 font-serif text-plum-deep">
              {contacts.map((c) => (
                <li
                  key={c.name + c.phone}
                  className="flex items-center gap-x-2"
                >
                  {c.name && <span className="font-bold">{c.name}</span>}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                      aria-label={`Call ${c.phone}`}
                      className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border border-plum-deep/30 bg-ivory px-3 text-[clamp(15px,4.4vw,18px)] font-bold text-plum-deep hover:bg-lilac"
                    >
                      <Phone
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-lavender-rich"
                        strokeWidth={2}
                      />
                      {c.phone.replace(/^\+91\s*/, "")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {rsvp.whatsappNumber && (
              <a
                href={whatsappUrl(rsvp.whatsappNumber, rsvp.message)}
                target="_blank"
                rel="noopener noreferrer"
                className="caps inline-flex min-h-12 items-center gap-2 rounded-full bg-btn px-6 text-sm font-bold text-btn-ink shadow-[0_10px_24px_-12px_rgba(75,0,130,0.9)] transition-colors duration-300 hover:bg-btn-hover"
              >
                <MessageCircle
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
                {rsvp.buttonLabel}
              </a>
            )}
            <button
              type="button"
              className="caps inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-plum-deep/50 px-5 text-sm font-bold text-plum-deep transition-colors duration-300 hover:bg-btn hover:text-btn-ink"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: reduce ? "auto" : "smooth",
                })
              }
            >
              <ArrowUp
                aria-hidden="true"
                className="h-4 w-4"
                strokeWidth={1.6}
              />
              Back to the card
            </button>
          </div>
          {rsvp.whatsappNumber && rsvp.note && (
            <p className="mt-2 font-serif text-lg font-semibold italic text-plum">
              {rsvp.note}
            </p>
          )}
        </motion.section>

        {/* A toddler's invitation */}
        {childNote.text && (
          <motion.figure
            className="mt-9 flex flex-col items-center"
            {...reveal(0.3, 20)}
          >
            <blockquote className="anim-wiggle relative -rotate-2 rounded-[28px] border-2 border-dashed border-lavender-rich/45 bg-lilac/70 px-6 py-4 shadow-[0_12px_24px_-16px_rgba(75,0,130,0.7)]">
              <Heart
                aria-hidden="true"
                className="absolute -right-2 -top-3 h-6 w-6 rotate-12 fill-[#e05a7a] text-[#e05a7a]"
              />
              <p className="font-child text-[clamp(24px,6.8vw,30px)] leading-tight text-plum-deep">
                {childNote.text}
              </p>
              {/* bubble tail */}
              <span
                aria-hidden="true"
                className="absolute -bottom-[9px] left-10 h-4 w-4 rotate-45 border-b-2 border-r-2 border-dashed border-lavender-rich/45 bg-lilac"
              />
            </blockquote>
            <figcaption className="mt-3 self-start pl-8 font-child text-lg text-plum">
              {childNote.from}
            </figcaption>
          </motion.figure>
        )}

        {/* With best compliments */}
        <motion.section
          className="mt-8 flex flex-col items-center"
          aria-label={compliments.heading}
          {...reveal(0.35)}
        >
          <p className="caps text-sm font-bold text-ink/80">
            {compliments.heading}
          </p>
          <p
            lang="ur"
            dir="rtl"
            className="urdu text-[19px] text-gold-deep"
            style={{ lineHeight: 1.8 }}
          >
            {compliments.headingUrdu}
          </p>
          <p
            lang="ur"
            dir="rtl"
            className="urdu text-[clamp(22px,6vw,26px)] text-plum-deep"
            style={{ lineHeight: 1.9 }}
          >
            {compliments.namesUrdu}
          </p>
          <p className="font-serif text-2xl font-bold text-plum-deep">
            {compliments.names}
          </p>
        </motion.section>

        <motion.div
          className="mt-6 flex flex-col items-center"
          {...reveal(0.4)}
        >
          {IS_CLASSIC ? (
            <ArtImage name="hands" className="h-auto w-24" />
          ) : (
            <Medallion className="h-auto w-20" />
          )}
          <p
            lang="ar"
            dir="rtl"
            className="arabic gold-text mt-1 text-[clamp(28px,7.6vw,34px)] font-bold leading-[1.6]"
          >
            {closing.arabic}
          </p>
          <p className="caps text-sm font-black text-gold-deep">
            {closing.latin}
          </p>
          <p className="mt-3 px-4 font-serif text-xl font-semibold italic leading-snug text-plum">
            {closing.signOff}
          </p>
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-1/2 w-[min(86%,460px)] -translate-x-1/2"
        {...reveal(0.3, 30, 1.2)}
      >
        <FloralDecoration variant="spray" className="h-auto w-full" />
      </motion.div>
    </Sheet>
  );
}
