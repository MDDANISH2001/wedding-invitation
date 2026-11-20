/**
 * Effect settings, read from `.env` at build time (see `.env.example`).
 * Invalid values fall back to the defaults.
 */
export type TouchEffect = 'petals' | 'sparks' | 'ripple' | 'mehndi' | 'none'

const TOUCH: TouchEffect[] = ['petals', 'sparks', 'ripple', 'mehndi', 'none']

const int = (v: string | undefined, fallback: number, max: number) => {
  const n = Number.parseInt(v ?? '', 10)
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : fallback
}

const touch = (import.meta.env.VITE_TOUCH_EFFECT ?? '').trim().toLowerCase() as TouchEffect

export const fxConfig = {
  touchEffect: TOUCH.includes(touch) ? touch : 'petals',
  ambientPetals: int(import.meta.env.VITE_AMBIENT_PETALS, 14, 150),
  /** Petal colour(s): a name (lavender, pink, rose, red, maroon, peach, gold, white, purple) or hex, comma-separated to mix. */
  petalColor: (import.meta.env.VITE_PETAL_COLOR ?? '').trim() || 'lavender',
  ambientLanterns: int(import.meta.env.VITE_AMBIENT_LANTERNS, 6, 30),
  opening: (import.meta.env.VITE_OPENING ?? '').trim().toLowerCase() === 'auto' ? 'auto' : 'seal',
} as const
