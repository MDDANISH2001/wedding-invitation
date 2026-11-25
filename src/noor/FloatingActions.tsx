import { m as motion } from "motion/react";
import { ArrowUpRight, MapPin, Phone, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { wedding } from "../config/wedding";
import { haptic } from "../lib/haptics";

const EASE = [0.22, 1, 0.36, 1] as const;

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/**
 * Two floating buttons on the details page: directions and call.
 * With more than one choice a tap opens a small sheet to pick from;
 * with exactly one (e.g. the Walima-only link) it acts straight away.
 */
export function FloatingActions() {
  const events = wedding.events;
  const contacts = wedding.rsvp.contacts.filter((c) => c.phone.trim());
  const [sheet, setSheet] = useState<"location" | "call" | null>(null);
  const [toast, setToast] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  const open = (which: "location" | "call") => {
    setSheet(which);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  const onLocation = () => {
    haptic(8);
    if (events.length > 1) return open("location");
    const ev = events[0];
    if (ev?.mapsUrl) window.open(ev.mapsUrl, "_blank", "noopener");
    else say("Location link coming soon");
  };

  const onCall = () => {
    haptic(8);
    if (contacts.length > 1) return open("call");
    if (contacts[0]) window.location.href = telHref(contacts[0].phone);
  };

  return (
    <>
      <div className="fixed bottom-[max(14px,env(safe-area-inset-bottom))] right-3 z-[70] flex flex-col gap-3">
        <Fab label="Get directions" onClick={onLocation} delay={0.2}>
          <MapPin size={20} strokeWidth={2.2} />
        </Fab>
        {contacts.length > 0 && (
          <Fab label="Call us" onClick={onCall} delay={0.35}>
            <Phone size={19} strokeWidth={2.2} />
          </Fab>
        )}
      </div>

      {toast && (
        <p role="status" className="noor-panel fixed bottom-[max(78px,calc(env(safe-area-inset-bottom)+64px))] right-[72px] z-[70] rounded-full px-4 py-2 text-[15px] italic">
          {toast}
        </p>
      )}

      <dialog
        ref={dialog}
        onClose={() => setSheet(null)}
        onClick={(e) => e.target === e.currentTarget && close()}
        aria-labelledby="noor-sheet-title"
        className="noor-sheet noor-panel m-0 mt-auto w-full max-w-none rounded-t-[28px] px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] text-[#f6e7c6] sm:mx-auto sm:max-w-[480px]"
      >
        <div className="flex items-center justify-between">
          <h2 id="noor-sheet-title" className="font-cinzel text-[14px] font-bold tracking-[0.22em] uppercase text-[#f8dc98]">
            {sheet === "call" ? "Call" : "Directions"}
          </h2>
          <button type="button" onClick={close} aria-label="Close" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full">
            <X size={20} />
          </button>
        </div>
        <ul className="mt-2 space-y-2.5">
          {sheet === "location" &&
            events.map((ev) => (
              <li key={ev.id}>
                {ev.mapsUrl ? (
                  <a href={ev.mapsUrl} target="_blank" rel="noreferrer" onClick={close} className="noor-option flex min-h-16 items-center gap-3.5 rounded-2xl px-3.5 py-3">
                    <span className="noor-pin grid h-10 w-10 shrink-0 place-items-center rounded-full">
                      <MapPin size={19} strokeWidth={2.3} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col text-left leading-snug">
                      <span className="font-cinzel text-[12px] font-semibold tracking-[0.2em] uppercase text-[#f6e7c6]/75">{ev.title}</span>
                      <span className="noor-gold font-cinzel mt-0.5 text-[17px] font-bold">{ev.venueName}</span>
                      {ev.venueAddress && <span className="mt-0.5 text-[15px] italic text-[#fbeed0]/90">{ev.venueAddress}</span>}
                    </span>
                    <ArrowUpRight size={20} className="shrink-0 text-[#f1cf85]" />
                  </a>
                ) : (
                  <div className="noor-btn-ghost flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2.5 opacity-60" aria-disabled="true">
                    <MapPin size={18} className="shrink-0 text-[#f1cf85]" />
                    <Option title={ev.title} sub="Location link coming soon" />
                  </div>
                )}
              </li>
            ))}
          {sheet === "call" &&
            contacts.map((c) => (
              <li key={c.phone}>
                <a href={telHref(c.phone)} onClick={close} className="noor-btn-ghost flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2.5">
                  <Phone size={18} className="shrink-0 text-[#f1cf85]" />
                  <Option title={c.name || c.phone} sub={c.name ? c.phone : ""} />
                </a>
              </li>
            ))}
        </ul>
      </dialog>
    </>
  );
}

function Option({ title, sub }: { title: string; sub: string }) {
  return (
    <span className="flex flex-col text-left leading-snug">
      <span className="text-[18px] font-semibold">{title}</span>
      {sub && <span className="text-[15px] italic opacity-80">{sub}</span>}
    </span>
  );
}

function Fab({ label, onClick, delay, children }: { label: string; onClick: () => void; delay: number; children: ReactNode }) {
  // the outer span floats (CSS, on the compositor); the button itself pops in once
  return (
    <span className="noor-bob block" style={{ animationDelay: `${-delay * 6}s` }}>
      <motion.button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        initial={{ opacity: 0, transform: "scale(0.8)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        transition={{ delay: 1.2 + delay, duration: 0.6, ease: EASE }}
        className="noor-btn grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-[#fff1c8]/60"
      >
        {children}
      </motion.button>
    </span>
  );
}
