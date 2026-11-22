import { m as motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface LineProps {
  text: string;
  /** seconds after the scene starts */
  at?: number;
  className?: string;
  /** seconds between letters */
  stagger?: number;
  glint?: boolean;
}

/**
 * A line of raised gold lettering that writes itself in letter by letter
 * (each letter rises out of the light), then a glint skims across it.
 */
export function GoldLine({
  text,
  at = 0,
  className = "",
  stagger = 0.045,
  glint = true,
}: LineProps) {
  const words = text.split(" ");
  // letter by letter for short lines (names); word by word for long ones, to keep phones light
  const perLetter = text.length <= 18;
  let n = 0;
  const total = perLetter ? text.replace(/ /g, "").length : words.length * 3;
  return (
    <span className={`noor-emboss relative block ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) => (
          <span key={wi} className="inline-block pe-4">
            {(perLetter ? [...w] : [w]).map((ch, ci) => {
              const i = perLetter ? n++ : (n += 3) - 3;
              return (
                <motion.span
                  key={ci}
                  className="noor-gold inline-block"
                  initial={{
                    opacity: 0,
                    transform: "translateY(0.32em) scale(0.82)",
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translateY(0em) scale(1)",
                  }}
                  transition={{
                    duration: 0.9,
                    delay: at + i * stagger,
                    ease: EASE,
                  }}
                >
                  {ch}
                </motion.span>
              );
            })}
            {wi < words.length - 1 && " "}
          </span>
        ))}
      </span>
      {glint && <Glint at={at + total * stagger + 0.35} />}
    </span>
  );
}

/** Arabic / Urdu must stay joined: the whole line is unveiled right to left by light. */
export function ScriptLine({
  text,
  at = 0,
  className = "",
  lang = "ar",
  duration = 1.6,
}: {
  text: string;
  at?: number;
  className?: string;
  lang?: "ar" | "ur";
  duration?: number;
}) {
  return (
    <span className={`noor-emboss relative block ${className}`}>
      <motion.span
        lang={lang}
        dir="rtl"
        className="noor-gold block"
        initial={{ clipPath: "inset(-40% -15% -40% 100%)", opacity: 0.2 }}
        animate={{ clipPath: "inset(-40% -15% -40% -15%)", opacity: 1 }}
        transition={{ duration, delay: at, ease: [0.45, 0, 0.2, 1] }}
      >
        {text}
      </motion.span>
      <Glint at={at} duration={duration} rtl />
    </span>
  );
}

/** Plain cream text, word by word, gently rising. Words inside *stars* are highlighted. */
export function FadeLine({
  text,
  at = 0,
  className = "",
  stagger = 0.06,
}: {
  text: string;
  at?: number;
  className?: string;
  stagger?: number;
}) {
  const tokens = tokenize(text);
  return (
    <span className={`noor-soft block ${className}`}>
      <span className="sr-only">{text.replaceAll("*", "")}</span>
      <span aria-hidden="true">
        {tokens.map((t, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.8, delay: at + i * stagger, ease: EASE }}
          >
            {t.hl ? (
              <span className="noor-soft inline-block text-[1.18em] font-bold uppercase tracking-wide [text-shadow:none]">
                {t.text}
              </span>
            ) : (
              t.text
            )}
            {tokens[i + 1] && !tokens[i + 1].glue && " "}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

interface Token {
  text: string;
  /** inside *stars*: shown larger, uppercase, in gold */
  hl: boolean;
  /** sticks to the word before with no space, e.g. the comma in "*Shabir Ahamad*, Tyodhi wale" */
  glue: boolean;
}

/** "Son of *MD Mynuddin*, Delhi" → words, each marked highlighted or not. */
function tokenize(text: string): Token[] {
  const segs = text.split("*");
  const tokens: Token[] = [];
  segs.forEach((seg, si) => {
    seg.split(" ").forEach((word, wi) => {
      if (!word) return;
      const glue =
        wi === 0 && si > 0 && !segs[si - 1].endsWith(" ") && tokens.length > 0;
      tokens.push({ text: word, hl: si % 2 === 1, glue });
    });
  });
  return tokens;
}

/** Anything that should simply fade in at a given moment. */
export function Appear({
  at = 0,
  children,
  className = "",
}: {
  at?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.9, delay: at, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A star of light that skims along a line of text once. */
function Glint({
  at,
  duration = 1.1,
  rtl = false,
}: {
  at: number;
  duration?: number;
  rtl?: boolean;
}) {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 block h-0"
      initial={{ transform: `translateX(${rtl ? 50 : -50}%)`, opacity: 0 }}
      animate={{
        transform: `translateX(${rtl ? -50 : 50}%)`,
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay: at,
        ease: [0.45, 0, 0.3, 1],
        opacity: { duration, delay: at, times: [0, 0.15, 0.8, 1] },
      }}
    >
      <span className="absolute left-1/2 top-0 block h-16 w-16 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,240,200,0.75)_0%,rgba(255,200,110,0.25)_35%,transparent_68%)]" />
        <svg viewBox="-50 -50 100 100" className="absolute inset-0">
          <path
            d="M0-46C3-8 8-3 46 0 8 3 3 8 0 46-3 8-8 3-46 0-8-3-3-8 0-46Z"
            fill="#fffaf0"
            opacity=".95"
          />
        </svg>
      </span>
    </motion.span>
  );
}

/**
 * A thread of light drawn across the screen: two gold strokes that grow
 * outwards from a small lozenge of light. Used between the names.
 */
export function Thread({
  at = 0,
  className = "",
}: {
  at?: number;
  className?: string;
}) {
  const draw = (d: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 1.4, delay: at + d, ease: EASE },
  });
  return (
    <svg
      viewBox="0 0 300 40"
      className={`noor-emboss overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="thread" x1="0" x2="1">
          <stop offset="0" stopColor="#f1cf85" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff1c8" />
          <stop offset="1" stopColor="#f1cf85" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M138 20 C110 20 96 12 70 16 S30 22 4 20"
        fill="none"
        stroke="url(#thread)"
        strokeWidth="1.4"
        {...draw(0.25)}
      />
      <motion.path
        d="M162 20 C190 20 204 28 230 24 S270 18 296 20"
        fill="none"
        stroke="url(#thread)"
        strokeWidth="1.4"
        {...draw(0.25)}
      />
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: at, ease: EASE }}
        style={{ transformOrigin: "150px 20px" }}
      >
        <path d="M150 9 L158 20 L150 31 L142 20Z" fill="#f1cf85" />
        <path d="M150 13.5 L154.6 20 L150 26.5 L145.4 20Z" fill="#fff6da" />
        <circle cx="135" cy="20" r="2" fill="#f1cf85" />
        <circle cx="165" cy="20" r="2" fill="#f1cf85" />
      </motion.g>
    </svg>
  );
}
