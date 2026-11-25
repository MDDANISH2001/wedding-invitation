import type { ReactNode } from "react";
import { fxConfig } from "../config/env";
import { GUEST, wedding } from "../config/wedding";
import { dateParts } from "../lib/date";
import { EventScene, PersonScene, TajWindow } from "./SceneParts";
import { FadeLine, GoldLine, ScriptLine, Thread } from "./text";

export interface Scene {
  id: string;
  /** how long it stays on screen, ms */
  dur: number;
  node: ReactNode;
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** The film, scene by scene, built from wedding.ts for the current view. */
export function buildScenes(): Scene[] {
  const { noor, bismillah, hosts, groom, bride, events } = wedding;
  const guest = fxConfig.guestName && GUEST ? GUEST : "";
  const days = daysUntil(wedding.countdown.target);
  const dates = events.map((e) => dateParts(e.start));
  const dateLine =
    dates.length > 1 && dates[0].month === dates[1].month
      ? `${dates.map((x) => x.dayNumber).join(" & ")} ${dates[0].month} ${dates[0].year}`
      : dates.map((x) => `${x.dayNumber} ${x.month} ${x.year}`).join(" · ");

  const scenes: Scene[] = [
    {
      id: "salaam",
      dur: 5200,
      node: (
        <>
          <ScriptLine
            text={noor.salaam.arabic}
            at={0.1}
            className="font-ruqaa text-[clamp(52px,16vw,86px)] leading-[1.6]"
          />
          <GoldLine
            text={noor.salaam.latin}
            at={1.1}
            className="font-display mt-1 text-[clamp(26px,7.4vw,40px)] font-bold"
          />
          {guest && (
            <FadeLine
              text={`${wedding.envelope.greeting} ${guest}`}
              at={2.2}
              className="font-pinyon mt-4 text-[clamp(32px,9vw,44px)] leading-tight"
            />
          )}
          <FadeLine
            text={noor.salaam.line}
            at={guest ? 2.8 : 2.2}
            className="mt-3 text-[clamp(18px,4.8vw,22px)] italic"
          />
        </>
      ),
    },
    {
      id: "bismillah",
      dur: 6000,
      node: (
        <>
          <ScriptLine
            text={bismillah.arabic}
            at={0.1}
            duration={2}
            className="font-ruqaa text-[clamp(46px,13.5vw,76px)] leading-[1.8]"
          />
          <GoldLine
            text={bismillah.transliteration}
            at={1.9}
            stagger={0.03}
            className="font-cinzel mt-2 text-[clamp(15px,4.2vw,20px)] font-bold tracking-wide"
          />
          <FadeLine
            text={bismillah.meaning}
            at={2.9}
            className="mx-auto mt-3 max-w-[20em] text-[clamp(18px,4.8vw,22px)] italic leading-snug"
          />
        </>
      ),
    },
    {
      id: "hosts",
      dur: 7000,
      node: (
        <>
          <FadeLine
            text={noor.blessing}
            at={0}
            className="font-cinzel mx-auto max-w-[24em] text-balance text-[12.5px] font-semibold tracking-[0.2em] uppercase"
          />
          <div className="mt-4 flex flex-col items-center">
            {hosts.parents.map((p, i) => (
              <div key={p.name} className="flex flex-col items-center">
                {i > 0 && (
                  <FadeLine
                    text="&"
                    at={0.6 + i * 1.1 - 0.3}
                    className="my-0.5 text-[clamp(28px,7.4vw,34px)] italic leading-none text-[#f8dc98]"
                  />
                )}
                <GoldLine
                  text={p.name}
                  at={0.6 + i * 1.1}
                  stagger={0.06}
                  className="font-display text-[clamp(32px,9vw,50px)] font-bold leading-tight"
                />
                {p.line && (
                  <FadeLine
                    text={p.line}
                    at={0.6 + i * 1.1 + 0.6}
                    className="text-[clamp(16px,5vw,20px)] italic leading-snug opacity-80"
                  />
                )}
              </div>
            ))}
          </div>
          <FadeLine
            text={hosts.request}
            at={0.6 + hosts.parents.length * 1.1 + 0.2}
            stagger={0.05}
            className="mx-auto mt-4 max-w-[19em] text-[clamp(19px,5vw,23px)] italic leading-snug"
          />
        </>
      ),
    },
    { id: "groom", dur: 6000, node: <PersonScene person={groom} /> },
    { id: "bride", dur: 6000, node: <PersonScene person={bride} /> },
    {
      id: "couple",
      dur: 7000,
      node: (
        <>
          <TajWindow
            at={0}
            className="mx-auto -mt-[18vh] mb-2 w-[min(92vw,460px)]"
          />
          {/* a soft pool of shadow under the names, so the gold reads clearly against the picture's glow */}
          <div className="noor-namebed relative">
            <GoldLine
              text={groom.name}
              at={0.9}
              stagger={0.06}
              className="noor-bright tracking-wide font-pinyon text-[clamp(48px,13.6vw,78px)] leading-none"
            />
            <Thread at={1.6} className="mx-auto w-[min(80vw,340px)]" />
            <FadeLine
              text={wedding.weds}
              at={2}
              className="font-pinyon -mt-5 text-[clamp(26px,7.4vw,36px)]"
            />
            <GoldLine
              text={bride.name}
              at={2.3}
              stagger={0.06}
              className="noor-bright tracking-wide font-pinyon text-[clamp(48px,13.6vw,78px)] leading-none"
            />
          </div>
        </>
      ),
    },
    {
      id: "ayah",
      dur: 5800,
      node: (
        <>
          <ScriptLine
            text={noor.ayah.arabic}
            at={0.1}
            duration={1.8}
            className="font-ruqaa text-[clamp(58px,17vw,96px)] leading-[1.7]"
          />
          <GoldLine
            text={noor.ayah.meaning}
            at={1.7}
            stagger={0.035}
            className="font-display mt-2 text-[clamp(20px,5.6vw,30px)] font-bold leading-snug"
          />
          <FadeLine
            text={noor.ayah.source}
            at={2.9}
            className="font-cinzel mt-3 text-[13px] font-semibold tracking-[0.24em] uppercase"
          />
        </>
      ),
    },
    ...events.map((ev) => ({
      id: ev.id,
      dur: 7600,
      node: <EventScene ev={ev} />,
    })),
    {
      id: "save",
      dur: 6400,
      node: (
        <>
          <GoldLine
            text={noor.saveTheDate.split(" ")[0]}
            at={0.1}
            stagger={0.1}
            className="font-pinyon text-[clamp(80px,24vw,130px)] leading-[1]"
          />
          <FadeLine
            text={noor.saveTheDate.split(" ").slice(1, -1).join(" ")}
            at={0.7}
            className="font-cinzel -mt-2 text-[15px] font-bold tracking-[0.5em] uppercase"
          />
          <GoldLine
            text={noor.saveTheDate.split(" ").slice(-1)[0]}
            at={0.9}
            stagger={0.1}
            className="font-pinyon -mt-2 text-[clamp(80px,24vw,130px)] leading-[1.1]"
          />
          <GoldLine
            text={dateLine}
            at={2}
            stagger={0.03}
            className="font-cinzel mt-2 text-[clamp(18px,5vw,24px)] font-bold tracking-wide"
          />
          {days > 0 && (
            <FadeLine
              text={`${days} ${days === 1 ? "day" : "days"} to go, In-sha' Allah`}
              at={2.8}
              className="mt-2 text-[clamp(17px,4.6vw,21px)] italic"
            />
          )}
        </>
      ),
    },
  ];
  // on the Walima link, `events` and the hosts' request already follow the view
  return scenes;
}
