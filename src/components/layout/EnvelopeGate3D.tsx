import {
  animate,
  m as motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fxConfig } from "../../config/env";
import { GUEST, VIEW, wedding } from "../../config/wedding";
import { EASE_SILK } from "../../lib/motion";
import { onOpenGesture } from "../../lib/opening";
import { PALETTE } from "../../theme/palette";
import { HERO_CARD_WIDTH, HeroCard } from "../sections/HeroCard";
import type { EnvelopeScene, FrameInfo } from "../../three/envelope";

interface Props {
  onLanded: () => void;
  /** WebGL failed: show the classic envelope instead. */
  onFallback: () => void;
}

const SCRIPT_FONTS = [
  "600 116px 'Great Vibes'",
  "64px 'Noto Nastaliq Urdu'",
  "italic 600 40px 'Cormorant Garamond'",
];

/**
 * The cinematic opening (VITE_ENVELOPE=3d). A lit three.js envelope floats
 * under the Bismillah; a tap cracks the seal, the flap opens, light pours
 * out and the real invitation card rises from the pocket and flies to its
 * place on the page. three.js loads in its own chunk, only for this.
 */
export function EnvelopeGate3D({ onLanded, onFallback }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EnvelopeScene | null>(null);
  const frameRef = useRef<FrameInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"idle" | "opening" | "rising" | "flying">(
    "idle",
  );
  const [target, setTarget] = useState<DOMRect>();

  // flying card: translate + scale from the page card's top-left; hidden below the pocket rim
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(0.3);
  const rim = useMotionValue(10_000);
  const clip = useTransform(() => {
    if (!target) return "inset(0 0 100% 0)";
    const visible = (rim.get() - (target.top + y.get())) / s.get();
    return `inset(-4px -4px ${Math.max(0, target.height - visible)}px -4px)`;
  });

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

  // build the scene once fonts for the printed label are in
  useEffect(() => {
    let alive = true;
    let scene: EnvelopeScene | null = null;
    const label =
      VIEW === "walima" ? wedding.envelope.labelWalima : wedding.envelope.label;
    Promise.all([
      import("../../three/envelope"),
      Promise.all(
        SCRIPT_FONTS.map((f) =>
          document.fonts.load(
            f,
            f.includes("Urdu") ? wedding.envelope.urdu : "Aa&",
          ),
        ),
      ).catch(() => []),
    ])
      .then(async ([{ EnvelopeScene }]) => {
        if (!alive || !canvasRef.current) return;
        scene = new EnvelopeScene(canvasRef.current, {
          palette: PALETTE,
          label,
          labelUrdu: wedding.envelope.urdu,
          guest: fxConfig.guestName && GUEST ? GUEST : undefined,
          guestPrefix: wedding.envelope.guestPrefix,
          monogram: [wedding.monogram.first, wedding.monogram.second],
          maxWidthPx: 400,
          centerY: 0.56,
        });
        scene.onFrame = (f) => {
          frameRef.current = f;
          rim.set(f.rim);
        };
        sceneRef.current = scene;
        await scene.start();
        if (alive) setReady(true);
      })
      .catch((e) => {
        console.warn("3D envelope unavailable, using the classic one", e);
        if (alive) onFallback();
      });
    return () => {
      alive = false;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [onFallback, rim]);

  // where the card will land
  useLayoutEffect(() => {
    const el = document.querySelector("[data-hero-card]");
    const measure = () => el && setTarget(el.getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const open = async () => {
    const scene = sceneRef.current;
    if (phase !== "idle" || !scene || !target) return;
    onOpenGesture();
    setPhase("opening");
    await scene.open();
    const f = frameRef.current;
    if (!f) return;
    const w = f.right - f.left;
    const s0 = (w * 0.84) / target.width;
    // park the card inside the pocket: its top on the rim, so it is fully hidden
    x.set(f.left + w * 0.08 - target.left);
    y.set(f.rim + 6 - target.top);
    s.set(s0);
    setPhase("rising");
    const envH = f.bottom - f.rim;
    await animate(y, y.get() - envH * 0.78, {
      duration: 1.1,
      ease: [0.45, 0, 0.25, 1],
    });
    scene.fall();
    setPhase("flying");
    animate(x, 0, { duration: 1.3, ease: EASE_SILK });
    animate(y, 0, { duration: 1.3, ease: EASE_SILK });
    await animate(s, 1, { duration: 1.3, ease: EASE_SILK });
    onLanded();
  };

  useEffect(() => {
    if (fxConfig.opening !== "auto" || !ready || phase !== "idle") return;
    const t = window.setTimeout(open, 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const leaving = phase === "flying";

  return (
    <div
      className="fixed inset-0 z-100 overflow-hidden"
      style={{ pointerEvents: leaving ? "none" : "auto" }}
    >
      {/* the table */}
      <motion.div
        className="table-surface absolute inset-0"
        style={{ backgroundColor: PALETTE.table }}
        initial={false}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{
          duration: 0.9,
          delay: leaving ? 0.5 : 0,
          ease: EASE_SILK,
        }}
      />

      <motion.canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: !ready ? 0 : leaving ? 0 : 1 }}
        transition={{ duration: leaving ? 1.1 : 0.9, ease: EASE_SILK }}
      />

      {/* Bismillah above the envelope */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[max(7vh,28px)] flex flex-col items-center px-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={
          phase === "idle" ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }
        }
        transition={{
          duration: phase === "idle" ? 1.1 : 0.6,
          delay: phase === "idle" ? 0.2 : 0.4,
          ease: EASE_SILK,
        }}
      >
        <span
          aria-hidden="true"
          className="anim-halo absolute inset-[-20%_10%] rounded-full bg-[radial-gradient(closest-side,rgba(255,226,150,0.4),transparent)]"
        />
        <p
          lang="ar"
          dir="rtl"
          className="arabic gold-text anim-sheen relative text-[clamp(32px,9vw,48px)] font-bold leading-normal"
        >
          {wedding.bismillah.arabic}
        </p>
        <p
          className="caps relative mt-1 text-sm font-bold"
          style={{ color: PALETTE.tableInk }}
        >
          {wedding.bismillah.transliteration}
        </p>
        {fxConfig.guestName && GUEST && (
          <p
            className="relative mt-3 font-script text-[clamp(26px,7vw,34px)] leading-tight"
            style={{ color: PALETTE.tableInk }}
          >
            {wedding.envelope.greeting} {GUEST}
          </p>
        )}
      </motion.div>

      {/* the whole envelope is the button */}
      <button
        type="button"
        data-open-seal
        aria-label="Open the invitation"
        onClick={open}
        disabled={!ready}
        className="absolute left-1/2 top-[56%] aspect-[1.3] w-[min(86vw,400px)] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-md"
      />

      <motion.p
        className="caps pointer-events-none absolute inset-x-0 bottom-[max(9vh,40px)] text-center text-[13px] font-bold tracking-[0.2em]"
        style={{ color: PALETTE.tableInk }}
        initial={{ opacity: 0 }}
        animate={{
          opacity:
            ready && phase === "idle" && fxConfig.opening !== "auto" ? 1 : 0,
        }}
        transition={{ duration: 0.8, delay: phase === "idle" ? 1.4 : 0 }}
      >
        <span className="anim-cue inline-block">{wedding.envelope.hint}</span>
      </motion.p>

      {/* the real card, rising out of the pocket and flying to its place */}
      {target && phase !== "idle" && phase !== "opening" && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-10 origin-top-left"
          style={{
            x,
            y,
            scale: s,
            left: target.left,
            top: target.top,
            width: HERO_CARD_WIDTH,
            clipPath: clip,
          }}
        >
          <HeroCard />
        </motion.div>
      )}
    </div>
  );
}
