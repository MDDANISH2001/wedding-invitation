import { m as motion } from "motion/react";
import {
  CalendarPlus,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { fxConfig } from "../config/env";
import { GUEST, wedding, type WeddingEvent } from "../config/wedding";
import { googleCalendarUrl, icsUrl } from "../lib/calendar";
import { dateParts, remainingUntil } from "../lib/date";
import { haptic } from "../lib/haptics";
import { ThemeArt } from "../components/art/ThemeArt";

const EASE = [0.22, 1, 0.36, 1] as const;

function Rise({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, transform: "translateY(24px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

function Heading({ children, urdu }: { children: ReactNode; urdu?: string }) {
  return (
    <div className="mb-4 flex flex-col items-center">
      {urdu && (
        <span
          lang="ur"
          dir="rtl"
          className="urdu noor-gold text-[22px]"
          style={{ lineHeight: 2 }}
        >
          {urdu}
        </span>
      )}
      <h2
        className={`font-display noor-emboss text-[clamp(24px,6.6vw,32px)] font-bold leading-tight`}
      >
        <span className={`noor-gold`}>{children}</span>
      </h2>
      <span
        aria-hidden="true"
        className="mt-2 h-px w-24 bg-gradient-to-r from-transparent via-[#f1cf85] to-transparent"
      />
    </div>
  );
}

/** The venue on a framed gold plate: the pin, the hall in raised gold, the address under it. */
function VenuePlate({ ev }: { ev: WeddingEvent }) {
  const body = (
    <>
      <span className="noor-pin mx-auto -mt-[34px] mb-2 grid h-11 w-11 place-items-center rounded-full">
        <MapPin size={20} strokeWidth={2.3} />
      </span>
      <span className="font-cinzel block text-[11px] font-semibold tracking-[0.34em] uppercase text-[#f6e7c6]/75">
        Venue
      </span>
      <span className="font-cinzel noor-emboss mt-1 block text-[21px] font-bold leading-snug">
        <span className="noor-gold">{ev.venueName}</span>
      </span>
      {ev.venueAddress && (
        <span className="mt-1 block text-[17px] italic leading-snug text-[#fbeed0]">
          {ev.venueAddress}
        </span>
      )}
    </>
  );
  return ev.mapsUrl ? (
    <a
      href={ev.mapsUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${ev.venueName}, ${ev.venueAddress}: open in maps`}
      onClick={() => haptic(8)}
      className="noor-venue mt-9 block rounded-2xl px-4 pt-4 pb-4"
    >
      {body}
    </a>
  ) : (
    <div className="noor-venue mt-9 rounded-2xl px-4 pt-4 pb-4">{body}</div>
  );
}

function EventPanel({ ev }: { ev: WeddingEvent }) {
  const d = dateParts(ev.start);
  return (
    <Rise className="noor-panel rounded-[28px] px-5 py-7 text-center">
      <Heading urdu={ev.titleUrdu}>
        {ev.title.split(" ")[0]}
        <br />
        {ev.title.split(" ")[1]}
      </Heading>
      <p className="font-cinzel text-[19px] font-bold tracking-wide text-[#f8dc98]">
        {d.weekday}, {d.dayNumber} {d.month} {d.year}
      </p>
      {ev.hijri && (
        <p className="mt-0.5 text-[18px] italic text-[#f6e7c6]/85">
          {ev.hijri}
        </p>
      )}
      <ul className="mx-auto mt-4 w-fit space-y-1.5">
        {ev.schedule.map((s) => (
          <li
            key={s.label}
            className="flex items-baseline justify-center gap-3 text-[18px]"
          >
            <span className="font-semibold italic">{s.label}</span>
            <span
              aria-hidden="true"
              className="h-px w-5 translate-y-[-4px] bg-[#f1cf85]/60"
            />
            <span className="font-cinzel font-bold text-[#f8dc98]">
              {s.time}
            </span>
          </li>
        ))}
      </ul>
      <VenuePlate ev={ev} />
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {ev.mapsUrl ? (
          <a
            href={ev.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="noor-btn noor-shine inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-cinzel text-[14px] font-bold tracking-[0.12em] uppercase"
            onClick={() => haptic(8)}
          >
            <MapPin size={18} strokeWidth={2.4} /> Get directions
          </a>
        ) : (
          ev.showDirections && (
            <span className="noor-btn-ghost inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold opacity-75">
              <MapPin size={17} /> Directions coming soon
            </span>
          )
        )}
        {fxConfig.calendar && (
          <>
            <a
              href={googleCalendarUrl(ev)}
              target="_blank"
              rel="noreferrer"
              className="noor-btn-ghost inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold"
            >
              <CalendarPlus size={17} /> Add to calendar
            </a>
            <a
              href={icsUrl(ev)}
              download={`${ev.id}.ics`}
              className="inline-flex min-h-11 items-center px-2 text-[14px] italic text-[#f6e7c6]/80 underline decoration-[#f1cf85]/50 underline-offset-4"
            >
              Apple / Outlook
            </a>
          </>
        )}
      </div>
    </Rise>
  );
}

function Countdown() {
  const target = new Date(wedding.countdown.target).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const r = remainingUntil(target, now);
  if (r.total === 0)
    return (
      <p className="text-[19px] italic">{wedding.countdown.startedMessage}</p>
    );
  const cells: [number, string][] = [
    [r.days, "Days"],
    [r.hours, "Hours"],
    [r.minutes, "Minutes"],
    [r.seconds, "Seconds"],
  ];
  return (
    <div
      className="flex justify-center gap-2.5"
      role="timer"
      aria-label={`${r.days} days until ${wedding.countdown.label}`}
    >
      {cells.map(([v, l]) => (
        <div
          key={l}
          className="noor-panel flex w-[68px] flex-col items-center rounded-2xl py-3"
        >
          <span className="font-cinzel noor-gold text-[28px] font-bold tabular-nums leading-none">
            {String(v).padStart(2, "0")}
          </span>
          <span className="mt-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#f6e7c6]/75">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The still page after the film: every detail, the buttons, the duas. */
export function Details({ onReplay }: { onReplay: () => void }) {
  const {
    bismillah,
    groom,
    bride,
    events,
    duas,
    rsvp,
    childNote,
    compliments,
    closing,
    noor,
  } = wedding;
  const contacts = rsvp.contacts.filter((c) => c.name.trim() || c.phone.trim());
  const guest = fxConfig.guestName && GUEST ? GUEST : "";

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[520px] flex-col gap-8 px-4 pt-[max(40px,env(safe-area-inset-top))] pb-28 text-center">
      <Rise className="flex flex-col items-center">
        <p
          lang="ar"
          dir="rtl"
          className="font-ruqaa noor-emboss text-[clamp(34px,9.5vw,46px)] leading-[1.9]"
        >
          <span className="noor-gold">{bismillah.arabic}</span>
        </p>
        {guest && (
          <p className="font-pinyon mt-2 text-[34px] leading-tight text-[#f8dc98]">
            {wedding.envelope.greeting} {guest},
          </p>
        )}
        <p className="font-cinzel mt-3 text-balance text-[12.5px] font-semibold tracking-[0.2em] uppercase">
          {noor.blessing}
        </p>
        <div className="mt-2 flex flex-col items-center">
          {wedding.hosts.parents.map((p, i) => (
            <div key={p.name} className="flex flex-col items-center">
              {i > 0 && (
                <span className="noor-emboss my-0.5 text-[28px] italic leading-none">
                  <span className="noor-gold">&amp;</span>
                </span>
              )}
              <span className="font-display noor-emboss text-[clamp(26px,7vw,34px)] font-bold leading-tight">
                <span className="noor-gold">{p.name}</span>
              </span>
              {p.line && (
                <span className="text-[clamp(16px,5vw,20px)] italic leading-snug text-[#f6e7c6]/80">
                  {p.line}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 max-w-[22em] text-[18px] italic leading-snug">
          {wedding.hosts.request}
        </p>
        <p className="font-pinyon noor-emboss mt-4 text-[clamp(52px,15vw,74px)] leading-[1.2]">
          <span className="noor-gold px-4">{groom.name}</span>
        </p>
        <ThemeArt
          name="sprig"
          priority
          className="my-1 h-auto w-[min(70%,260px)]"
        />
        <p className="font-pinyon noor-emboss text-[clamp(52px,15vw,74px)] leading-[1.2]">
          <span className="noor-gold px-6">{bride.name}</span>
        </p>
      </Rise>

      {events.map((ev) => (
        <EventPanel key={ev.id} ev={ev} />
      ))}

      <Rise>
        <Heading>Counting the days</Heading>
        <Countdown />
      </Rise>

      <Rise className="noor-panel rounded-[28px] px-5 py-7">
        <Heading>{duas.couple.heading}</Heading>
        <p
          lang="ar"
          dir="rtl"
          className="arabic noor-gold text-[26px] font-bold leading-[1.9]"
        >
          {duas.couple.arabic}
        </p>
        <p className="mt-2 text-[16px] italic text-[#f6e7c6]/80">
          {duas.couple.latin}
        </p>
        <p className="mt-2 text-[18px] leading-snug">{duas.couple.meaning}</p>
        <span
          aria-hidden="true"
          className="mx-auto my-5 block h-px w-20 bg-[#f1cf85]/50"
        />
        <p className="text-[18px] italic leading-snug">“{duas.verse.text}”</p>
        <p className="font-cinzel mt-2 text-[12px] font-semibold tracking-[0.24em] uppercase text-[#f8dc98]">
          {duas.verse.source}
        </p>
      </Rise>

      <Rise className="flex flex-col items-center">
        <p
          lang="ur"
          dir="rtl"
          className="urdu text-[20px] text-[#f8dc98]"
          style={{ lineHeight: 2.1 }}
        >
          {duas.welcomeUrdu}
        </p>
        <p className="mt-1 text-[18px] italic">{duas.welcome}</p>
      </Rise>

      {(contacts.length > 0 || rsvp.whatsappNumber) && (
        <Rise className="noor-panel rounded-[28px] px-5 py-7">
          <Heading>{rsvp.heading}</Heading>
          <div className="flex flex-wrap justify-center gap-2.5">
            {contacts.map((c) => (
              <a
                key={c.phone}
                href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                className="noor-btn-ghost inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[16px] font-semibold"
              >
                <Phone size={16} /> {c.name ? `${c.name} · ` : ""}
                {c.phone}
              </a>
            ))}
          </div>
          {rsvp.whatsappNumber && (
            <a
              href={`https://wa.me/${rsvp.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(rsvp.message)}`}
              target="_blank"
              rel="noreferrer"
              className="noor-btn mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-[15px] font-bold"
            >
              <MessageCircle size={17} /> {rsvp.buttonLabel}
            </a>
          )}
          {rsvp.whatsappNumber && rsvp.note && (
            <p className="mt-2 text-[15px] italic opacity-80">{rsvp.note}</p>
          )}
        </Rise>
      )}

      {childNote.text && (
        // the little one's note: a gold-edged card with a heart coin on top
        <Rise className="noor-venue noor-note relative mx-auto mt-4 w-full max-w-[22em] rounded-[24px] px-5 pt-9 pb-6">
          <span className="noor-pin absolute top-0 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full">
            <Heart size={19} strokeWidth={2.3} fill="currentColor" />
          </span>
          <p className="font-child relative text-[25px] leading-snug text-[#fff6dc]">
            <span aria-hidden="true" className="noor-gold font-display mr-0.5 align-[-0.25em] text-[44px] leading-none">“</span>
            {childNote.text}
            <span aria-hidden="true" className="noor-gold font-display ml-0.5 align-[-0.25em] text-[44px] leading-none">”</span>
          </p>
          <span aria-hidden="true" className="mx-auto mt-3 block h-px w-24 bg-gradient-to-r from-transparent via-[#f1cf85] to-transparent" />
          <p className="font-child noor-emboss mt-2 text-[30px] uppercase">
            <span className="noor-gold">{childNote.from}</span>
          </p>
        </Rise>
      )}

      <Rise className="flex flex-col items-center">
        <p
          lang="ur"
          dir="rtl"
          className="urdu text-[20px] text-[#f8dc98]"
          style={{ lineHeight: 2 }}
        >
          {compliments.headingUrdu}
        </p>
        <p className="font-cinzel text-[12.5px] font-semibold tracking-[0.26em] uppercase">
          {compliments.heading}
        </p>
        <p className="mt-2 text-[20px] font-semibold">{compliments.names}</p>
        <p
          lang="ur"
          dir="rtl"
          className="urdu text-[18px]"
          style={{ lineHeight: 2 }}
        >
          {compliments.namesUrdu}
        </p>
        <p
          lang="ar"
          dir="rtl"
          className="arabic noor-gold mt-5 text-[30px] font-bold leading-[1.8]"
        >
          {closing.arabic}
        </p>
        <p className="font-cinzel text-[14px] font-bold tracking-[0.2em] uppercase text-[#f8dc98]">
          {closing.latin}
        </p>
        <p className="mt-2 max-w-[20em] text-[17px] italic">
          {closing.signOff}
        </p>
      </Rise>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            haptic(8);
            onReplay();
          }}
          className="noor-btn-ghost inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-semibold"
        >
          <RotateCcw size={16} /> {noor.replay}
        </button>
        {/* <p className="max-w-[26em] text-[11px] leading-snug text-[#f6e7c6]/45">
          Background photograph: “Qur'an and Rehal” by Sayyed Shahab-o-Din
          Vajedi, CC BY 4.0, via Wikimedia Commons (blurred and colour-graded).
        </p> */}
      </div>
    </main>
  );
}
