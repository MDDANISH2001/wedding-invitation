import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { Suspense, lazy, useCallback, useState } from "react";
import { IS_NOOR, fxConfig } from "./config/env";
import { EnvelopeGate3D } from "./components/layout/EnvelopeGate3D";
import { SkyLayer } from "./components/extras/SkyLayer";
import { DuaPlayer } from "./components/extras/DuaPlayer";
import {
  InvitationBook,
  type PageDef,
} from "./components/layout/InvitationBook";
import { EnvelopeGate } from "./components/layout/EnvelopeGate";
import { OpenedContext } from "./components/layout/OpenedContext";
import { InvitationHero } from "./components/sections/InvitationHero";
import { WeddingEvents } from "./components/sections/WeddingEvents";
import { ClosingInvitation } from "./components/sections/ClosingInvitation";
import { FxLayer } from "./fx/FxLayer";

/** VITE_THEME=noor: its own self-playing experience, in its own chunk. */
const NoorExperience = lazy(() => import("./noor/NoorExperience"));

const PAGES: PageDef[] = [
  { id: "invitation", label: "Invitation", Component: InvitationHero },
  { id: "programme", label: "Programme", Component: WeddingEvents },
  { id: "duas", label: "Duas & RSVP", Component: ClosingInvitation },
];

/** Can this browser draw the 3D envelope? (and does the guest want motion?) */
const can3d = (() => {
  if (fxConfig.envelope !== "3d" || typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
})();

export default function App() {
  const [opened, setOpened] = useState(false);
  const [fallback, setFallback] = useState(false);
  const onLanded = useCallback(() => setOpened(true), []);
  const onFallback = useCallback(() => setFallback(true), []);

  if (IS_NOOR)
    return (
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <Suspense fallback={null}>
            <NoorExperience />
          </Suspense>
        </MotionConfig>
      </LazyMotion>
    );

  return (
    <LazyMotion features={domAnimation} strict>
      {/* reducedMotion="user": Motion drops transform animations for guests who ask for less motion. */}
      <MotionConfig reducedMotion="user">
        <OpenedContext.Provider value={opened}>
          {opened && fxConfig.sky && <SkyLayer />}
          <InvitationBook pages={PAGES} />
          {!opened &&
            (can3d && !fallback ? (
              <EnvelopeGate3D onLanded={onLanded} onFallback={onFallback} />
            ) : (
              <EnvelopeGate onLanded={onLanded} />
            ))}
          {opened && <FxLayer />}
          {opened && <DuaPlayer />}
        </OpenedContext.Provider>
      </MotionConfig>
    </LazyMotion>
  );
}
