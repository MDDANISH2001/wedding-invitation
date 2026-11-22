/**
 * Every look-and-feel setting, read from `.env` at build time (see
 * `.env.example`). There is no settings UI on the site.
 *
 * VITE_THEME picks the whole look; each theme brings sensible defaults for
 * the other switches, and any switch set explicitly in `.env` wins.
 * Invalid values fall back to the defaults.
 */
export type TouchEffect = 'petals' | 'sparks' | 'ripple' | 'mehndi' | 'none'
export type ThemeName = 'classic' | 'midnight' | 'rose' | 'letterpress' | 'noor'
export type EnvelopeStyle = 'classic' | '3d'
export type DuaName = 'rabbirhamhuma' | 'rabbana-hablana'

const TOUCH: TouchEffect[] = ['petals', 'sparks', 'ripple', 'mehndi', 'none']
const THEMES: ThemeName[] = ['classic', 'midnight', 'rose', 'letterpress', 'noor']
const DUAS: DuaName[] = ['rabbirhamhuma', 'rabbana-hablana']

const env = import.meta.env
const str = (v: string | undefined) => (v ?? '').trim().toLowerCase()

const int = (v: string | undefined, fallback: number, max: number) => {
  const n = Number.parseInt(v ?? '', 10)
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : fallback
}

/** on / off, or the theme's default when unset. */
const flag = (v: string | undefined, fallback: boolean) => {
  const s = str(v)
  if (['on', 'true', '1', 'yes'].includes(s)) return true
  if (['off', 'false', '0', 'no'].includes(s)) return false
  return fallback
}

const themeRaw = str(env.VITE_THEME) as ThemeName
export const THEME: ThemeName = THEMES.includes(themeRaw) ? themeRaw : 'classic'
export const IS_CLASSIC = THEME === 'classic'
/** noor replaces the envelope + card book with a self-playing sequence. */
export const IS_NOOR = THEME === 'noor'

/** What each theme turns on when `.env` doesn't say. */
const DEFAULTS: Record<
  ThemeName,
  { petalColor: string; envelope: EnvelopeStyle; sky: boolean; foil: boolean; lanterns: number }
> = {
  classic: { petalColor: 'lavender', envelope: 'classic', sky: false, foil: false, lanterns: 6 },
  midnight: { petalColor: 'gold,white', envelope: '3d', sky: true, foil: true, lanterns: 0 },
  rose: { petalColor: 'rose,red', envelope: '3d', sky: false, foil: true, lanterns: 0 },
  letterpress: { petalColor: 'white,#e9d8b4', envelope: '3d', sky: false, foil: true, lanterns: 0 },
  // noor plays its own film-like sequence; envelope / sky / foil don't apply to it
  noor: { petalColor: 'gold,#ffd9a0', envelope: 'classic', sky: false, foil: false, lanterns: 0 },
}
const d = DEFAULTS[THEME]

const touch = str(env.VITE_TOUCH_EFFECT) as TouchEffect
const envelope = str(env.VITE_ENVELOPE) as EnvelopeStyle
const dua = str(env.VITE_DUA) as DuaName

export const fxConfig = {
  theme: THEME,
  touchEffect: TOUCH.includes(touch) ? touch : 'petals',
  ambientPetals: int(env.VITE_AMBIENT_PETALS, 14, 150),
  /** Petal colour(s): a name (lavender, pink, rose, red, maroon, peach, gold, white, purple) or hex, comma-separated to mix. */
  petalColor: (env.VITE_PETAL_COLOR ?? '').trim() || d.petalColor,
  ambientLanterns: int(env.VITE_AMBIENT_LANTERNS, d.lanterns, 30),
  opening: str(env.VITE_OPENING) === 'auto' ? 'auto' : 'seal',
  /** classic = the CSS envelope; 3d = the lit three.js envelope (falls back to classic without WebGL). */
  envelope: envelope === 'classic' || envelope === '3d' ? envelope : d.envelope,
  /** three.js night sky (stars, moon, sky lanterns that light up as you scroll) behind the pages. */
  sky: flag(env.VITE_SKY, d.sky),
  /** Gold lettering catches the light as the phone tilts / the cursor moves. */
  foil: flag(env.VITE_FOIL, d.foil),
  /** "Dear …" greeting from the link's ?to= parameter. */
  guestName: flag(env.VITE_GUEST_NAME, true),
  /** Recited dua offered after opening; off disables it. */
  dua: DUAS.includes(dua) ? dua : null,
  /** Start the dua as soon as the seal is tapped (otherwise a play button only). */
  duaAutoplay: flag(env.VITE_DUA_AUTOPLAY, true),
  /** Short vibration on the seal tap and buttons (Android). */
  haptics: flag(env.VITE_HAPTICS, true),
  /** "Add to calendar" on each event card. */
  calendar: flag(env.VITE_CALENDAR, true),
} as const
