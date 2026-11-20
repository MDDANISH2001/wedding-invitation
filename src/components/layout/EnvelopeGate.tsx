import {
  animate,
  m as motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { VIEW, wedding } from "../../config/wedding";
import { fxConfig } from "../../config/env";
import { artUrl } from "../../lib/art";
import { EASE_SILK } from "../../lib/motion";
import { ArtImage } from "../art/ArtImage";
import { HERO_CARD_WIDTH, HeroCard } from "../sections/HeroCard";

interface Props {
  /** Fired when the flying card has landed exactly on the page's card. */
  onLanded: () => void;
}

/** Scalloped wax-seal outline (16 lobes) as an SVG path in a 100×100 box. */
const SEAL_PATH = (() => {
  const lobes = 16;
  let d = "";
  for (let i = 0; i <= lobes * 8; i++) {
    const a = (i / (lobes * 8)) * Math.PI * 2;
    const r = 46 + 3 * Math.cos(a * lobes) + 0.8 * Math.sin(a * 5);
    d += `${i ? "L" : "M"}${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
  }
  return d + "Z";
})();

/** The wax seal. `back` is its underside, seen once the flap has swung up: plain wax, no monogram. */
function Seal({ back = false }: { back?: boolean }) {
  const { first, second } = wedding.monogram;
  if (back)
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="seal-b" cx="55%" cy="60%" r="70%">
            <stop offset="0" stopColor="#d9ad4a" />
            <stop offset="0.6" stopColor="#b8860b" />
            <stop offset="1" stopColor="#7a5500" />
          </radialGradient>
        </defs>
        <path d={SEAL_PATH} fill="url(#seal-b)" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#6b4600"
          strokeOpacity=".35"
          strokeWidth="1"
        />
      </svg>
    );
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full drop-shadow-[0_6px_10px_rgba(60,20,0,0.45)]"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="seal-g" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#f6dc8e" />
          <stop offset="0.45" stopColor="#d1a034" />
          <stop offset="1" stopColor="#8a6008" />
        </radialGradient>
      </defs>
      <path d={SEAL_PATH} fill="url(#seal-g)" />
      <circle
        cx="50"
        cy="50"
        r="37"
        fill="#f3d48a"
        fillOpacity=".35"
        stroke="#6b4600"
        strokeOpacity=".6"
        strokeWidth="1.4"
      />
      <circle
        cx="50"
        cy="50"
        r="33.5"
        fill="none"
        stroke="#fff3c9"
        strokeOpacity=".75"
        strokeWidth=".5"
      />
      {/* embossed monogram: light edge under a dark letter */}
      {[
        { dy: 0.9, fill: "#fff4cc", op: 0.8 },
        { dy: 0, fill: "#3d2600", op: 1 },
      ].map((l) => (
        <text
          key={l.fill}
          x="45"
          y={60 + l.dy}
          textAnchor="middle"
          fontFamily="'Great Vibes', cursive"
          fontSize="24"
          fontWeight={900}
          className="tracking-wider"
          fill={l.fill}
          opacity={l.op}
        >
          {first}
          <tspan fontSize="14" dx="0.5" dy="-3">
            &amp;
          </tspan>
          <tspan dx="0.5" dy="3">
            {second}
          </tspan>
        </text>
      ))}
    </svg>
  );
}

interface Geo {
  /** the page's card (target) */
  t: DOMRect;
  /** the envelope */
  e: DOMRect;
}

/**
 * The opening. A deep-lavender envelope with the Bismillah above it; the guest
 * taps the gold seal → the seal cracks, the flap opens, the real invitation
 * card rises out, the envelope falls away and the card grows to exactly the
 * size and place of the page's first card, which then takes over (~3.5s).
 * `VITE_OPENING=auto` plays it by itself.
 */
export function EnvelopeGate({ onLanded }: Props) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "opening" | "flying">("idle");
  const [geo, setGeo] = useState<Geo>();
  // the flap stays in front of the card until it has swung up past vertical
  const [flapOpen, setFlapOpen] = useState(false);
  const envRef = useRef<HTMLDivElement>(null);

  // flying card: translate + scale from the target's top-left, and the line below which it's hidden in the pocket
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(0.3);
  const fall = useMotionValue(0); // how far the envelope has dropped (px)
  const cutBase = useMotionValue(0);
  const clip = useTransform(() => {
    if (!geo) return "inset(0 0 100% 0)";
    const cut = cutBase.get() + fall.get();
    const visible = (cut - (geo.t.top + y.get())) / s.get();
    return `inset(-2px -2px ${Math.max(0, geo.t.height - visible)}px -2px)`;
  });
  const envOpacity = useTransform(fall, [0, 260], [1, 0]);

  // lock page scroll while the envelope is shown
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      el.style.overflow = prev;
    };
  }, []);

  // measure the target card and the envelope; park the card inside the envelope
  useLayoutEffect(() => {
    if (phase !== "idle") return;
    const target = document.querySelector("[data-hero-card]");
    const measure = () => {
      const env = envRef.current;
      if (!target || !env) return;
      const g = {
        t: target.getBoundingClientRect(),
        e: env.getBoundingClientRect(),
      };
      if (g.t.width === 0) return;
      setGeo(g);
      x.set(g.e.left + g.e.width * 0.08 - g.t.left);
      y.set(g.e.top + g.e.height * 0.07 - g.t.top);
      s.set((g.e.width * 0.84) / g.t.width);
      cutBase.set(g.e.bottom - 2);
      fall.set(0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (target) ro.observe(target);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [phase, x, y, s, cutBase, fall]);

  const open = () => {
    if (phase !== "idle") return;
    if (reduce || !geo) {
      setPhase("flying");
      window.setTimeout(onLanded, 450);
      return;
    }
    setPhase("opening");
    window.setTimeout(() => setFlapOpen(true), 600);
    const { e } = geo;
    // 1. the flap swings open with the seal on its tip (0.15–1.05s): declarative, below
    // 2. the card rises out of the envelope (1.1–2.3s)
    animate(y, y.get() - e.height * 0.62, {
      delay: 1.1,
      duration: 1.2,
      ease: [0.45, 0, 0.25, 1],
    }).then(() => {
      // 3. the card comes forward and grows into place while the envelope drops away;
      //    the clip line follows the falling pocket rim
      cutBase.set(e.top + e.height * 0.1);
      setPhase("flying");
      animate(fall, window.innerHeight, {
        duration: 1.1,
        ease: [0.5, 0, 0.75, 0],
      });
      animate(x, 0, { duration: 1.3, ease: EASE_SILK });
      animate(y, 0, { duration: 1.3, ease: EASE_SILK });
      animate(s, 1, { duration: 1.3, ease: EASE_SILK }).then(onLanded);
    });
  };

  useEffect(() => {
    if (fxConfig.opening !== "auto" || !geo || phase !== "idle") return;
    const t = window.setTimeout(open, 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  const opening = phase !== "idle";
  const T = (delay: number, duration = 0.6) => ({
    delay: reduce ? 0 : delay,
    duration: reduce ? 0.3 : duration,
    ease: EASE_SILK,
  });
  const label = VIEW === "walima" ? "Dawate-e-Walima" : "Dawate-e-Nikah";

  return (
    <div
      className="fixed inset-0 z-100 overflow-hidden"
      style={{ pointerEvents: phase === "flying" ? "none" : "auto" }}
    >
      {/* the lavender table + decorations; fades as the card lands */}
      <motion.div
        className="table-surface absolute inset-0"
        initial={false}
        animate={{ opacity: phase === "flying" ? 0 : 1 }}
        transition={phase === "flying" ? T(reduce ? 0 : 0.6, 0.7) : T(0)}
      >
        <ArtImage
          name="corner-lanterns"
          priority
          className="absolute -right-2 -top-2 w-[min(44vw,260px)]"
        />
        <ArtImage
          name="corner-lanterns"
          priority
          className="absolute -left-2 -top-2 w-[min(44vw,260px)] -scale-x-100"
        />
        <ArtImage
          name="floral-spray"
          priority
          className="absolute -bottom-3 left-1/2 w-[min(80vw,420px)] -translate-x-1/2 opacity-90"
        />
      </motion.div>

      <div className="relative flex h-full flex-col items-center justify-center px-4">
        {/* Bismillah: the first thing a guest reads */}
        <motion.div
          className="relative mb-[clamp(18px,4vh,40px)] flex flex-col items-center text-center"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={opening ? { opacity: 0, y: -24 } : { opacity: 1, y: 0 }}
          transition={opening ? T(0.9, 0.6) : T(0.15, 1.1)}
        >
          <span
            aria-hidden="true"
            className="anim-halo absolute inset-[-30%_-10%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,170,0.6),transparent)]"
          />
          <p
            lang="ar"
            dir="rtl"
            className="arabic gold-text anim-sheen relative text-[clamp(32px,9vw,48px)] font-bold leading-normal"
          >
            {wedding.bismillah.arabic}
          </p>
          <p className="caps relative mt-1 text-md font-bold text-black">
            {wedding.bismillah.transliteration}
          </p>
        </motion.div>

        {/* Envelope. The wrapper has no transform/opacity, so its layers and the flying card share one stacking order:
            back (10) < card while inside (20) < pocket (30) < closed flap (40) < seal (50); flying card (60). */}
        <div ref={envRef} className="relative aspect-[1.3] w-[min(86vw,400px)]">
          <motion.div
            className="absolute inset-0 z-10 rounded-md shadow-[0_30px_60px_-20px_rgba(75,0,130,0.55)]"
            style={{
              y: fall,
              opacity: envOpacity,
              background: `url(${artUrl("tile")}) center/46% auto, #e6e6fa`,
            }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0 z-30"
            style={{ y: fall, opacity: envOpacity }}
          >
            <div
              className="absolute inset-0 rounded-md"
              style={{
                clipPath: "polygon(0 0, 50% 48%, 100% 0, 100% 100%, 0 100%)",
                background:
                  "linear-gradient(160deg, #6a1fa0 0%, #4b0082 55%, #3a0066 100%)",
                boxShadow: "inset 0 0 0 1px rgba(233,196,106,0.5)",
              }}
            />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 0 L50 48 L100 0"
                fill="none"
                stroke="#e9c46a"
                strokeOpacity=".7"
                strokeWidth=".5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0 100 L41 42 M100 100 L59 42"
                fill="none"
                stroke="#e9c46a"
                strokeOpacity=".35"
                strokeWidth=".5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-[5%] flex flex-col items-center">
              <p className="font-script font-bold tracking-[0.15rem] text-[clamp(28px,8vw,36px)] leading-none text-[#f6dd93] [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                {label}
              </p>
              <p
                lang="ur"
                dir="rtl"
                className="urdu tracking-widest text-2xl! text-[clamp(15px,4.1vw,18px)] text-[#f6dd93]"
                style={{ lineHeight: 1.7 }}
              >
                دعوت نامہ
              </p>
            </div>
          </motion.div>

          {/* flap: in front while closed, behind the rising card once open */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[52%] origin-top"
            style={{
              transformStyle: "preserve-3d",
              transformPerspective: 1200,
              zIndex: flapOpen ? 15 : 40,
              y: fall,
              opacity: envOpacity,
            }}
            initial={false}
            animate={opening && !reduce ? { rotateX: 180 } : { rotateX: 0 }}
            transition={T(0.15, 0.9)}
          >
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                background:
                  "linear-gradient(180deg, #5a1592 0%, #4b0082 70%, #3f0070 100%)",
                backfaceVisibility: "hidden",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                // drawn pre-flipped: after the 180° swing it shows as an upward triangle above the envelope
                zIndex: flapOpen ? 15 : 40,
                clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
                background: `url(${artUrl("tile")}) center/46% auto, #e6e6fa`,
                transform: "rotateX(180deg)",
                backfaceVisibility: "hidden",
              }}
            />
            {/* the seal sits on the flap's tip and swings up with it */}
            <div
              className="absolute left-1/2 top-[92.3%] aspect-square w-[32%]"
              style={{
                transform: "translate(-50%, -50%)",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden" }}
              >
                <Seal />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateX(180deg)",
                }}
              >
                <Seal back />
              </div>
            </div>
            <p className="absolute left-1/2 -translate-x-1/2 uppercase text-nowrap top-4 [backface-visibility:hidden] text-[clamp(28px,8vw,36px)] leading-none text-[#f6dd93] [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
              Invitation
            </p>
          </motion.div>

          {/* tap target over the seal (the seal itself is drawn on the flap) */}
          <button
            type="button"
            onClick={open}
            aria-label="Open the invitation"
            className="group absolute left-1/2 top-[48%] z-50 aspect-square w-[32%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
            style={{ pointerEvents: opening ? "none" : "auto" }}
          >
            {!opening && (
              <span
                aria-hidden="true"
                className="anim-halo absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgba(255,220,140,0.65),transparent)]"
              />
            )}
          </button>
        </div>

        <motion.p
          className="caps relative mt-6 text-xs font-bold text-plum-deep"
          initial={reduce ? false : { opacity: 0 }}
          animate={opening ? { opacity: 0 } : { opacity: 1 }}
          transition={T(opening ? 0 : 0.8, 0.6)}
        >
          {fxConfig.opening === "auto" ? "Opening…" : "Tap the seal to open"}
        </motion.p>
      </div>

      {/* the invitation card itself: the same component as page 1, flown into its place */}
      {geo && !reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: geo.t.left,
            top: geo.t.top,
            width: HERO_CARD_WIDTH,
            x,
            y,
            scale: s,
            originX: 0,
            originY: 0,
            clipPath: clip,
            zIndex: phase === "flying" ? 60 : 20,
          }}
        >
          <HeroCard />
        </motion.div>
      )}
    </div>
  );
}
