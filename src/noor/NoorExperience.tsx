import { AnimatePresence, m as motion } from "motion/react";
import { SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fxConfig } from "../config/env";
import { GUEST, VIEW, wedding } from "../config/wedding";
import { onOpenGesture } from "../lib/opening";
import { DuaPlayer } from "../components/extras/DuaPlayer";
import { FloatingActions } from "./FloatingActions";
import { Backdrop } from "./Backdrop";
import { sparkBurst } from "./sparks";
import { Details } from "./Details";
import { buildScenes } from "./scenes";
import "./noor.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const FONTS = [
  "700 40px 'Cinzel Decorative'",
  "600 20px 'Cinzel'",
  "60px 'Pinyon Script'",
];

type Phase = "intro" | "film" | "details";

/**
 * VITE_THEME=noor: a self-playing, film-like invitation. A tap begins it
 * (browsers allow sound only after a tap, so the dua starts here), the
 * scenes write themselves in gold light over a lamp-lit room with the
 * Qur'an, and it settles on a still page with every detail and button.
 */
export default function NoorExperience() {
  const scenes = useMemo(() => buildScenes(), []);
  const [phase, setPhase] = useState<Phase>(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "details"
      : "intro",
  );
  const [idx, setIdx] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // the display fonts must be in before the first letters write themselves
  useEffect(() => {
    const t = window.setTimeout(() => setFontsReady(true), 2500);
    Promise.all(FONTS.map((f) => document.fonts.load(f, "Aa")))
      .catch(() => [])
      .then(() => setFontsReady(true));
    return () => window.clearTimeout(t);
  }, []);

  const next = useCallback(() => {
    if (idx + 1 < scenes.length) setIdx(idx + 1);
    else setPhase("details");
  }, [idx, scenes.length]);

  // advance on its own
  useEffect(() => {
    if (phase !== "film") return;
    const t = window.setTimeout(next, scenes[idx].dur);
    return () => window.clearTimeout(t);
  }, [phase, idx, next, scenes]);

  // a breath of sparks as each scene begins
  useEffect(() => {
    if (phase !== "film") return;
    const t = window.setTimeout(
      () =>
        sparkBurst(
          window.innerWidth / 2,
          window.innerHeight * 0.42,
          18,
          Math.min(220, window.innerWidth * 0.45),
        ),
      250,
    );
    return () => window.clearTimeout(t);
  }, [phase, idx]);

  useEffect(() => {
    document.documentElement.style.overflow =
      phase === "details" ? "" : "hidden";
    if (phase === "details") window.scrollTo(0, 0);
  }, [phase]);

  const begin = () => {
    if (!fontsReady) return;
    onOpenGesture();
    sparkBurst(window.innerWidth / 2, window.innerHeight * 0.45, 34, 200);
    setIdx(0);
    setPhase("film");
  };

  const replay = () => {
    setIdx(0);
    setPhase("film");
  };

  return (
    <div className="noor-root relative min-h-dvh">
      <Backdrop />

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.button
            key="intro"
            type="button"
            onClick={begin}
            aria-label="Begin the invitation"
            className="fixed inset-0 z-10 flex cursor-pointer flex-col items-center justify-center px-6 pb-[18vh] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transform: "scale(1.04)" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <span className="uppercase noor-soft text-[clamp(24px,8vw,32px)] font-bold">
              Invitation
            </span>
            {fxConfig.guestName && GUEST && (
              // <>
              <span className="font-pinyon noor-soft text-white! mb-4 text-[clamp(32px,9vw,42px)] leading-tight tracking-wide">
                {wedding.envelope.greeting} {GUEST}
              </span>
              // </>
            )}
            <Crescent />
            <span className="font-display noor-emboss mt-6 text-[clamp(30px,8.6vw,44px)] font-bold">
              <span className="noor-gold px-4">
                {VIEW === "walima"
                  ? wedding.envelope.labelWalima
                  : wedding.envelope.label}
              </span>
            </span>
            <span
              lang="ur"
              dir="rtl"
              className="urdu noor-gold mt-1 text-[24px]"
              style={{ lineHeight: 2 }}
            >
              {wedding.envelope.urdu}
            </span>
            <motion.span
              className="font-cinzel noor-soft mt-8 text-[13px] font-semibold tracking-[0.34em] uppercase"
              animate={{ opacity: fontsReady ? [0.45, 1, 0.45] : 0 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {wedding.noor.begin}
            </motion.span>
          </motion.button>
        )}

        {phase === "film" && (
          <motion.div
            key="film"
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <button
              type="button"
              onClick={() => setPhase("details")}
              className="font-cinzel noor-soft absolute right-3 top-[max(24px,calc(env(safe-area-inset-top)+12px))] z-20 inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-2 text-[12px] font-semibold tracking-[0.2em] uppercase opacity-80"
            >
              {wedding.noor.skip} <SkipForward size={14} />
            </button>

            {/* a tap anywhere moves on */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={next}
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={scenes[idx].id}
                  className="flex h-full flex-col items-center justify-center px-5 pb-[16vh] text-center"
                  initial={{
                    opacity: 1,
                    transform: "translateY(0px) scale(1)",
                  }}
                  exit={{
                    opacity: 0,
                    transform: "translateY(-22px) scale(1.03)",
                  }}
                  transition={{ duration: 0.7, ease: EASE }}
                >
                  {scenes[idx].node}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <Details onReplay={replay} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== "intro" && fxConfig.dua && (
        <DuaPlayer
          caption={phase === "details"}
          compact={phase === "details"}
        />
      )}
      {/* directions + call, on every screen */}
      <FloatingActions />
    </div>
  );
}

/** A crescent of light that breathes: tap it to begin. */
function Crescent() {
  // a five-point star, centred on 0,0
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 4.4 : 11;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" L");
  return (
    <span
      className="noor-orb relative block h-[clamp(124px,35vw,168px)] w-[clamp(124px,35vw,168px)]"
      aria-hidden="true"
    >
      <span className="absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(255,214,140,0.4)_0%,rgba(255,180,80,0.12)_40%,transparent_68%)]" />
      <svg
        viewBox="-60 -60 120 120"
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          {/* the bite taken out of the full disc: offset up and to the right, so the horns open that way */}
          <mask id="noor-bite">
            <rect x="-60" y="-60" width="120" height="120" fill="#fff" />
            <circle cx="17" cy="-11" r="38.5" fill="#000" />
          </mask>
          {/* lit from the upper left */}
          <linearGradient id="noor-moon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff8e2" />
            <stop offset=".35" stopColor="#f6d78f" />
            <stop offset=".7" stopColor="#d49a45" />
            <stop offset="1" stopColor="#8a5618" />
          </linearGradient>
          <radialGradient id="noor-star" cx=".45" cy=".4" r=".6">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".5" stopColor="#fff0c4" />
            <stop offset="1" stopColor="#e9b95e" />
          </radialGradient>
          <clipPath id="noor-disc">
            <circle r="46" />
          </clipPath>
          <filter id="noor-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* the rest of the moon, faintly lit (earthshine) */}
        {/* <circle r="46" fill="#f1cf85" opacity=".01" /> */}
        <g mask="url(#noor-bite)" filter="url(#noor-glow)">
          <circle r="46" fill="url(#noor-moon)" />
          {/* a dark outer edge and a bright inner rim give it body */}
          <circle
            r="45"
            fill="none"
            stroke="#5a3408"
            strokeOpacity=".45"
            strokeWidth="2"
          />
          <circle
            cx="17"
            cy="-11"
            r="39.2"
            fill="none"
            stroke="#fff6da"
            strokeOpacity=".85"
            strokeWidth="1.2"
            clipPath="url(#noor-disc)"
          />
        </g>

        <g transform="translate(23 -15) rotate(12)">
          <circle r="13" fill="#fff0c4" opacity=".01" />
          <g className="noor-twinkle">
            <path
              d={`M${star} Z`}
              fill="url(#noor-star)"
              stroke="#fff8e2"
              strokeWidth=".6"
              filter="url(#noor-glow)"
            />
          </g>
        </g>
      </svg>
    </span>
  );
}
