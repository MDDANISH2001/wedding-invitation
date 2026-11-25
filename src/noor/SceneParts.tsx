import type { Person, WeddingEvent } from "../config/wedding";
import { dateParts } from "../lib/date";
import { m as motion } from "motion/react";
import { MapPin } from "lucide-react";
import tajWindow from "../assets/noor/taj-window.webp";
import { Appear, FadeLine, GoldLine, ScriptLine } from "./text";

// fetch the Taj picture now, so it's ready long before its scene comes up
if (typeof window !== "undefined") new Image().src = tajWindow;

// const highlight = (l: string) => l.replace(/\*/g, "");

export function PersonScene({ person }: { person: Person }) {
  return (
    <>
      <Appear at={0} className="flex items-center justify-center gap-3">
        <span className="font-cinzel noor-soft text-[13px] font-semibold tracking-[0.28em] uppercase">
          {person.honorific}
        </span>
        <span className="h-1 w-1 rotate-45 bg-[#f1cf85]" />
        <span
          lang="ur"
          dir="rtl"
          className="urdu noor-soft -mt-2 text-[17px]"
          style={{ lineHeight: 1.8 }}
        >
          {person.honorificUrdu}
        </span>
      </Appear>
      <GoldLine
        text={person.name}
        at={0.5}
        stagger={0.07}
        className="font-pinyon mt-2 text-[clamp(56px,17vw,92px)] leading-[1.25]"
      />
      <div className="mt-3 space-y-1">
        {person.lines.map((l, i) => (
          <FadeLine
            key={l}
            text={l}
            at={1.6 + i * 0.5}
            className="text-[clamp(17px,4.6vw,21px)] font-semibold italic leading-snug"
          />
        ))}
      </div>
    </>
  );
}

export function EventScene({ ev }: { ev: WeddingEvent }) {
  const d = dateParts(ev.start);
  return (
    <>
      {ev.titleUrdu && (
        <ScriptLine
          text={ev.titleUrdu}
          lang="ur"
          at={0}
          className="urdu text-[clamp(26px,7vw,34px)] leading-[2]"
        />
      )}
      <GoldLine
        text={ev.title}
        at={0.4}
        stagger={0.05}
        className="font-display -mt-1 text-[clamp(30px,8.6vw,46px)] font-bold leading-tight"
      />
      <FadeLine
        text={`${d.weekday}, ${d.dayNumber} ${d.month} ${d.year}`}
        at={1.5}
        className="font-cinzel mt-4 text-[clamp(17px,4.6vw,22px)] font-semibold tracking-wide"
      />
      {ev.hijri && (
        <FadeLine
          text={ev.hijri}
          at={1.9}
          className="mt-1 text-[clamp(17px,4.6vw,21px)] italic"
        />
      )}
      <Appear at={2.4} className="mx-auto mt-5 w-fit space-y-1.5">
        {ev.schedule.map((s) => (
          <div
            key={s.label}
            className="noor-soft flex items-baseline justify-center gap-3 text-[clamp(17px,4.6vw,21px)]"
          >
            <span className="font-semibold italic">{s.label}</span>
            <span className="h-px w-6 translate-y-[-4px] bg-[#f1cf85]/60" />
            <span className="font-cinzel font-bold text-[#f8dc98]">
              {s.time}
            </span>
          </div>
        ))}
      </Appear>
      <Appear at={3.1} className="noor-venue mx-auto mt-10 w-[min(88vw,400px)] rounded-2xl px-4 pt-4 pb-4">
        <span aria-hidden="true" className="noor-pin mx-auto -mt-[34px] mb-2 grid h-11 w-11 place-items-center rounded-full">
          <MapPin size={20} strokeWidth={2.3} />
        </span>
        <p className="font-cinzel text-[11px] font-semibold tracking-[0.34em] uppercase text-[#f6e7c6]/75">
          Venue
        </p>
        <p className="font-cinzel noor-emboss mt-1 text-[clamp(19px,5.2vw,23px)] font-bold leading-snug">
          <span className="noor-gold">{ev.venueName}</span>
        </p>
        {ev.venueAddress && (
          <p className="noor-soft mt-1 text-[clamp(16px,4.3vw,19px)] italic leading-snug">
            {ev.venueAddress}
          </p>
        )}
      </Appear>
    </>
  );
}

/**
 * The Taj Mahal by night, seen through a pointed Mughal arch with a gold rim
 * (baked by scripts/noor-art.mjs from art-src/goldnoor.png). It glows in and
 * settles from a slow push, like a camera finding the view.
 */
export function TajWindow({ at = 0, className = "" }: { at?: number; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className="absolute inset-[-12%_-8%_0] rounded-full bg-[radial-gradient(closest-side,rgba(255,200,110,0.28),transparent)]"
      />
      <motion.img
        src={tajWindow}
        width={1000}
        height={700}
        alt="The Taj Mahal at night, seen through an arched window"
        decoding="async"
        draggable={false}
        className="relative block h-auto w-full select-none"
        initial={{ opacity: 0, transform: "scale(1.08)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        transition={{ opacity: { duration: 1.2, delay: at }, transform: { duration: 3.2, delay: at, ease: [0.22, 1, 0.36, 1] } }}
      />
    </div>
  );
}
