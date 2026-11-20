import { wedding, type Person } from "../../config/wedding";
import { dateParts } from "../../lib/date";
import { InvitationCardFrame } from "../art/frames";
import { ArtImage } from "../art/ArtImage";
import { DecorativeDivider } from "../art/DecorativeDivider";

/** Card width; shared by the page and the envelope's flying copy so both lay out identically. */
export const HERO_CARD_WIDTH = "min(96vw, 500px)";
export const HERO_VIEWPORT_INSET = 24;

/**
 * The first invitation card: arched floral frame + all its text. It's static
 * on purpose. The envelope animation flies an identical copy into its place,
 * so the hand-over is seamless.
 */
export function HeroCard() {
  const { bismillah, hosts, groom, bride, events, inshaAllah } = wedding;

  return (
    <InvitationCardFrame viewportInset={HERO_VIEWPORT_INSET}>
      {/* Bismillah: the most prominent line, glowing gold */}
      <div className="relative mt-4">
        <span
          aria-hidden="true"
          className="anim-halo absolute inset-[-25%_-8%] rounded-full bg-[radial-gradient(closest-side,rgba(255,230,160,0.6),transparent)]"
        />
        <p
          lang="ar"
          dir="rtl"
          className="arabic gold-text anim-sheen relative text-[clamp(27px,7.8vw,38px)] font-bold leading-[1.55]"
        >
          {bismillah.arabic}
        </p>
      </div>
      <p className="caps text-[clamp(10.5px,2.9vw,12px)] tracking-normal text-lg! leading-loose font-bold text-black">
        {bismillah.transliteration}
      </p>
      <p className="mt-0.5 font-serif text-[clamp(14px,3.9vw,16px)] text-xl! font-semibold leading-none italic text-plum">
        {bismillah.meaning}
      </p>

      <DecorativeDivider
        variant={1}
        animate={false}
        priority
        className="mt-2 w-[min(80%,250px)]"
      />

      <p className="mt-2 font-serif text-[clamp(21px,5.8vw,25px)] font-semibold italic leading-tight text-plum-deep">
        {hosts.names}
      </p>
      <p className="mt-1 max-w-[22em] text-balance font-serif text-[clamp(15px,4.1vw,17px)] italic leading-tight text-plum">
        {hosts.request}
      </p>

      <h1 className="mt-5 flex flex-col items-center">
        <PersonBlock person={groom} />
        <span className="my-1 flex flex-col items-center">
          <ArtImage
            name="hands"
            priority
            className="h-auto w-[clamp(64px,19vw,92px)]"
          />
          <span className="font-script text-[clamp(28px,7.6vw,36px)] leading-none text-lavender-rich">
            {wedding.weds}
          </span>
        </span>
        <PersonBlock person={bride} />
      </h1>

      <DecorativeDivider
        variant={3}
        animate={false}
        priority
        className="mt-2 w-[min(78%,240px)]"
      />

      <p className="mt-1 flex items-center gap-2">
        <span
          lang="ur"
          dir="rtl"
          className="urdu -mt-3 text-xl! text-[clamp(16px,4.3vw,19px)] text-gold-deep"
          style={{ lineHeight: 1.7 }}
        >
          {inshaAllah.urdu}
        </span>
        <span className="text-xl! text-[clamp(10.5px,2.9vw,12px)] font-black text-gold-deep">
          {inshaAllah.latin}
        </span>
      </p>

      <div
        className={`mt-1 grid w-full max-w-[260px] items-center gap-x-2 ${events.length > 1 ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-1"}`}
      >
        {events.map((ev, i) => (
          <div key={ev.id} className="contents">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="h-16 w-px bg-gradient-to-b from-transparent via-plum/50 to-transparent"
              />
            )}
            <HeroDate title={ev.shortTitle} iso={ev.start} />
          </div>
        ))}
      </div>
    </InvitationCardFrame>
  );
}

function PersonBlock({ person }: { person: Person }) {
  return (
    <span className="flex flex-col items-center">
      <span className="flex items-center gap-2">
        <span className="caps text-[clamp(10.5px,2.9vw,12px)] font-bold text-gold-deep">
          {person.honorific}
        </span>
        <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-gold" />
        <span
          lang="ur"
          dir="rtl"
          className="urdu -mt-4 text-xl! text-[clamp(15px,4vw,17px)] text-gold-deep"
          style={{ lineHeight: 1.6 }}
        >
          {person.honorificUrdu}
        </span>
      </span>
      <span className="font-script mt-4 text-[clamp(36px,11vw,54px)] tracking-widest font-semibold leading-[1.05] text-plum-deep">
        {person.name}
      </span>
      {person.lines.map((l) => (
        <span
          key={l}
          className="font-serif text-[clamp(14.5px,4vw,16.5px)] px-8 font-semibold leading-snug text-plum"
        >
          {l.split("*").map((part, i) =>
            i % 2 ? (
              <span key={i} className="whitespace-nowrap text-xl font-semibold italic text-plum-deep">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      ))}
    </span>
  );
}

function HeroDate({ title, iso }: { title: string; iso: string }) {
  const d = dateParts(iso);
  return (
    <div className="flex flex-col items-center leading-none">
      <span className="font-script text-[clamp(22px,6vw,26px)] font-bold tracking-widest text-lavender-rich">
        {title}
      </span>
      <span className="mt-1 font-serif text-[34px] font-bold text-plum-deep">
        {d.day}
      </span>
      <span className="caps mt-1 text-sm font-bold text-plum">
        {d.monthShort} {d.year}
      </span>
      <span className="mt-1 font-serif text-[20px] font-bold italic text-plum">
        {d.weekday}
      </span>
    </div>
  );
}
