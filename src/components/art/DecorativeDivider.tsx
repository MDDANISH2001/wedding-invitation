import { useId, type ReactNode } from 'react'
import { m as motion, useReducedMotion } from 'motion/react'
import { PALETTE } from '../../theme/palette'

interface Props {
  /** Which of the five ornaments (shapes follow the design sheet). */
  variant?: 1 | 2 | 3 | 4 | 5
  className?: string
  /** Unfold from the centre when scrolled into view. */
  animate?: boolean
  delay?: number
  /** Kept for API compatibility (vector art needs no preloading). */
  priority?: boolean
}

const INK = PALETTE.ink
const W = 260
const C = W / 2

/** n copies of a shape rotated evenly around the origin. */
const ring = (n: number, shape: (k: number) => ReactNode, offset = 0) =>
  Array.from({ length: n }, (_, k) => (
    <g key={k} transform={`rotate(${offset + (360 / n) * k})`}>
      {shape(k)}
    </g>
  ))

/** Pointed petal from the centre upwards, length l, half-width w. */
const petal = (l: number, w: number) => `M0 0C${w} ${-l * 0.3} ${w} ${-l * 0.72} 0 ${-l}C${-w} ${-l * 0.72} ${-w} ${-l * 0.3} 0 0Z`

/** Leaf lying along +x from (0,0), length l. */
const leaf = (l: number, w: number) => `M0 0C${l * 0.3} ${-w} ${l * 0.75} ${-w} ${l} 0C${l * 0.75} ${w} ${l * 0.3} ${w} 0 0Z`

/** Diamond centred on the origin. */
const diamond = (r: number) => `M${-r} 0L0 ${-r * 0.75}L${r} 0L0 ${r * 0.75}Z`

/** Tapering rule from x0 (thick) to x1 (hair-thin), mirrored on both sides. */
function Rule({ x0, x1, t = 2.2 }: { x0: number; x1: number; t?: number }) {
  const half = (s: 1 | -1) => `M${C + s * x0} ${20 - t / 2}L${C + s * x1} 20L${C + s * x0} ${20 + t / 2}Z`
  return (
    <>
      <path d={half(1)} fill={INK} />
      <path d={half(-1)} fill={INK} />
    </>
  )
}

/** Something drawn on the right half, mirrored to the left. */
function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform={`translate(${W} 0) scale(-1 1)`}>{children}</g>
    </>
  )
}

function Rosette({ r, n = 8, gold }: { r: number; n?: number; gold: string }) {
  return (
    <g transform={`translate(${C} 20)`}>
      {ring(n, () => <path d={petal(r * 0.62, r * 0.2)} fill="none" stroke={INK} strokeWidth={1.22} />, 360 / n / 2)}
      {ring(n, () => <path d={petal(r, r * 0.36)} fill={gold} fillOpacity={0.35} stroke={INK} strokeWidth={1.62} />)}
      <circle r={r * 0.2} fill={INK} />
      <circle r={r * 0.09} fill={gold} />
    </g>
  )
}

function Ornament({ variant, gold }: { variant: number; gold: string }) {
  switch (variant) {
    case 2: // rosette, leaves, diamond caps
      return (
        <>
          <Rule x0={38} x1={110} />
          <Mirror>
            <path d={leaf(22, 6)} transform={`translate(${C + 16} 20)`} fill="none" stroke={INK} strokeWidth={1.49} />
            <path d={diamond(7)} transform={`translate(${C + 116} 20)`} fill={gold} stroke={INK} strokeWidth={1.62} />
            <circle cx={C + 127} cy={20} r={1.4} fill={INK} />
          </Mirror>
          <Rosette r={15} gold={gold} />
        </>
      )
    case 3: // small star, beads
      return (
        <>
          <Rule x0={34} x1={128} t={1.8} />
          <Mirror>
            {[16, 23, 29].map((x, i) => (
              <circle key={x} cx={C + x} cy={20} r={2.2 - i * 0.55} fill={INK} />
            ))}
          </Mirror>
          <g transform={`translate(${C} 20)`}>
            {ring(8, (k) => <path d={petal(k % 2 ? 7 : 11, k % 2 ? 1.6 : 2.4)} fill={k % 2 ? gold : INK} />)}
            <circle r={2.2} fill={gold} stroke={INK} strokeWidth={1.08} />
          </g>
        </>
      )
    case 4: // four-petal flower with teardrops and drop finials
      return (
        <>
          <Rule x0={58} x1={128} t={2} />
          <Mirror>
            <path d={leaf(16, 4.5)} transform={`translate(${C + 18} 20)`} fill={INK} />
            <path d={leaf(9, 3)} transform={`translate(${C + 40} 20)`} fill="none" stroke={INK} strokeWidth={1.35} />
            <circle cx={C + 54} cy={20} r={2.4} fill={gold} stroke={INK} strokeWidth={1.08} />
          </Mirror>
          <g transform={`translate(${C} 20)`}>
            {ring(4, () => <path d={petal(15, 6)} fill={gold} fillOpacity={0.35} stroke={INK} strokeWidth={1.62} />, 45)}
            {ring(4, () => <path d={petal(10, 2.4)} fill={INK} />)}
            <circle r={2.6} fill={gold} stroke={INK} strokeWidth={1.08} />
          </g>
        </>
      )
    case 5: // grand medallion with diamonds
      return (
        <>
          <Rule x0={48} x1={110} />
          <Mirror>
            <path d={diamond(7)} transform={`translate(${C + 34} 20)`} fill="none" stroke={INK} strokeWidth={1.62} />
            <path d={leaf(12, 3.5)} transform={`translate(${C + 41} 20)`} fill={INK} />
            <path d={diamond(6)} transform={`translate(${C + 119} 20)`} fill={gold} stroke={INK} strokeWidth={1.49} />
          </Mirror>
          <g transform={`translate(${C} 20)`}>
            <ellipse rx={26} ry={17} fill="none" stroke={INK} strokeWidth={1.35} strokeOpacity={0.55} />
            {ring(6, () => <path d={petal(16, 6)} fill={gold} fillOpacity={0.35} stroke={INK} strokeWidth={1.62} />, 30)}
            {ring(6, () => <path d={petal(9, 2)} fill={INK} />)}
            <circle r={2.8} fill={gold} stroke={INK} strokeWidth={1.08} />
          </g>
        </>
      )
    default: // 1: lotus rosette between leaves
      return (
        <>
          <Rule x0={30} x1={130} />
          <Mirror>
            <path d={leaf(20, 5.5)} transform={`translate(${C + 15} 20) rotate(-14)`} fill="none" stroke={INK} strokeWidth={1.49} />
            <path d={leaf(20, 5.5)} transform={`translate(${C + 15} 20) rotate(14)`} fill={INK} fillOpacity={0.85} />
          </Mirror>
          <Rosette r={14} gold={gold} />
        </>
      )
  }
}

/** Ornamental rules, drawn as crisp vectors and unfolding outward from the centre motif. */
export function DecorativeDivider({ variant = 1, className = '', animate = true, delay = 0 }: Props) {
  const reduce = useReducedMotion()
  const id = useId().replace(/:/g, '')
  const gold = `url(#g${id})`
  const svg = (
    <svg viewBox={`0 0 ${W} 40`} className="block h-auto w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PALETTE.gold[2]} />
          <stop offset="0.55" stopColor={PALETTE.gold[1]} />
          <stop offset="1" stopColor={PALETTE.gold[0]} />
        </linearGradient>
      </defs>
      <Ornament variant={variant} gold={gold} />
    </svg>
  )
  if (!animate || reduce) return <div className={className}>{svg}</div>
  return (
    <motion.div
      className={className}
      initial={{ clipPath: 'inset(-20% 50% -20% 50%)', opacity: 0 }}
      whileInView={{ clipPath: 'inset(-20% 0% -20% 0%)', opacity: 1 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] }}
    >
      {svg}
    </motion.div>
  )
}
