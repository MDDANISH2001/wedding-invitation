/**
 * Vector Mughal ornament for the new themes: cusped arches, jaali lattice,
 * lanterns, a mosque at night, the monogram medallion, a save-the-date seal.
 * Pure geometry, so it is razor sharp at any size, and coloured from the
 * theme palette.
 */
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { wedding } from '../../config/wedding'
import { dateParts } from '../../lib/date'
import { PALETTE } from '../../theme/palette'
import { ThemeArt } from './ThemeArt'
import { cuspedArch } from './mughalGeometry'

const useUid = () => useId().replace(/:/g, '')

/** Gold gradient <defs>, vertical by default. */
function GoldDefs({ id, angle = 90 }: { id: string; angle?: number }) {
  const [g0, g1, g2, g3] = PALETTE.gold
  const r = (angle * Math.PI) / 180
  return (
    <linearGradient
      id={id}
      x1={0.5 - Math.cos(r) / 2}
      y1={0.5 - Math.sin(r) / 2}
      x2={0.5 + Math.cos(r) / 2}
      y2={0.5 + Math.sin(r) / 2}
    >
      <stop offset="0" stopColor={g2} />
      <stop offset="0.3" stopColor={g3} />
      <stop offset="0.55" stopColor={g1} />
      <stop offset="0.8" stopColor={g2} />
      <stop offset="1" stopColor={g0} />
    </linearGradient>
  )
}

/** The 8-point-star girih lattice as an SVG pattern. */
function JaaliPattern({ id, size, stroke, width = 0.9, opacity = 0.55 }: { id: string; size: number; stroke: string; width?: number; opacity?: number }) {
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" viewBox="0 0 56 56">
      <g fill="none" stroke={stroke} strokeWidth={width * (56 / size)} strokeOpacity={opacity}>
        <path d="M16 16h24v24H16z" />
        <path d="M28 11l17 17-17 17-17-17z" />
        <path d="M28 0v11M28 45v11M0 28h11M45 28h11" />
        <path d="M0 0l16 16M56 0L40 16M0 56l16-16M56 56L40 40" />
      </g>
      <circle cx="28" cy="28" r="2.4" fill={stroke} fillOpacity={opacity} />
    </pattern>
  )
}

/** Small eight-petal rosette (for corners and keystones). */
function Rosette({ x, y, r, fill, stroke }: { x: number; y: number; r: number; fill: string; stroke: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, k) => (
        <path
          key={k}
          transform={`rotate(${k * 45})`}
          d={`M0 0C${r * 0.36} ${-r * 0.3} ${r * 0.36} ${-r * 0.72} 0 ${-r}C${-r * 0.36} ${-r * 0.72} ${-r * 0.36} ${-r * 0.3} 0 0Z`}
          fill={fill}
          fillOpacity={0.55}
          stroke={stroke}
          strokeWidth={r * 0.08}
        />
      ))}
      <circle r={r * 0.22} fill={stroke} />
    </g>
  )
}

// ───────────────────────────── Arch card ─────────────────────────────
const AW = 400 // arch slice viewBox width
const AH = 250 // arch slice height
const XO = 10 // outer rule
const XI = 18 // second rule
const XJ = 40 // arch jambs (inner opening)

interface ArchCardProps {
  children: ReactNode
  className?: string
  /** Grow to at least the viewport height minus this many px. */
  viewportInset?: number
  /** Florals across the top and bottom. */
  florals?: boolean
}

/**
 * The invitation card for the new themes: a paper panel whose top is a
 * cusped Mughal arch, framed by double gold rules with jaali lattice in the
 * spandrels and along the sides, and Redouté florals over the crown and foot.
 */
export function ArchCard({ children, className = '', viewportInset, florals = true }: ArchCardProps) {
  const id = useUid()
  const gold = `url(#g${id})`
  const jaali = `url(#j${id})`
  const [vh, setVh] = useState<number>()
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (viewportInset === undefined) return
    const set = () => setVh(window.innerHeight - viewportInset)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [viewportInset])

  const pct = (x: number) => `${(x / AW) * 100}%`
  const arch = cuspedArch(XJ, AW - XJ, AH, 36, 4)
  return (
    <div ref={ref} className={`relative ${className}`} style={{ minHeight: vh }}>
      {/* paper body with shadow */}
      <div
        aria-hidden="true"
        className="paper absolute inset-0 rounded-[6px] shadow-[0_26px_50px_-24px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(0,0,0,0.25)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [container-type:inline-size]">
        <svg viewBox={`0 0 ${AW} ${AH}`} className="block h-auto w-full overflow-visible">
          <defs>
            <GoldDefs id={`g${id}`} />
            <JaaliPattern id={`j${id}`} size={16} stroke={PALETTE.gold[2]} opacity={0.5} />
          </defs>
          {/* jaali in the spandrels: the frame rectangle minus the arch opening */}
          <SpandrelFill arch={arch} fill={jaali} />
          {/* outer double rule */}
          <path d={`M${XO} ${AH + 1}V${XO}H${AW - XO}V${AH + 1}`} fill="none" stroke={gold} strokeWidth={2.4} />
          <path d={`M${XI} ${AH + 1}V${XI}H${AW - XI}V${AH + 1}`} fill="none" stroke={gold} strokeWidth={1} />
          {/* the arch: a broad gold line with a fine inner echo */}
          <path d={`M${XJ} ${AH + 1}${arch.replace(/^M[\d. ]+/, `L${XJ} ${AH}`)}L${AW - XJ} ${AH + 1}`} fill="none" stroke={gold} strokeWidth={2.6} strokeLinejoin="round" />
          <path d={cuspedArch(XJ + 6, AW - XJ - 6, AH, 46, 4)} fill="none" stroke={gold} strokeWidth={0.8} strokeOpacity={0.8} />
          {/* corner rosettes + keystone */}
          <Rosette x={(XO + XI) / 2 + 9} y={(XO + XI) / 2 + 9} r={9} fill={gold} stroke={PALETTE.gold[1]} />
          <Rosette x={AW - (XO + XI) / 2 - 9} y={(XO + XI) / 2 + 9} r={9} fill={gold} stroke={PALETTE.gold[1]} />
          <path d={`M${AW / 2} 14l7 10-7 10-7-10z`} fill={gold} />
        </svg>
        {/* sides below the arch slice */}
        <div className="absolute inset-x-0 bottom-0" style={{ top: `${(AH / AW) * 100}cqw` }}>
          <span className="absolute inset-y-0 border-l-[2.4px] border-gold/90" style={{ left: `calc(${pct(XO)} - 1.2px)` }} />
          <span className="absolute inset-y-0 border-r-[2.4px] border-gold/90" style={{ right: `calc(${pct(XO)} - 1.2px)` }} />
          <span className="absolute inset-y-0 border-l border-gold/80" style={{ left: `calc(${pct(XI)} - 0.5px)`, bottom: `${pct(XI)}` }} />
          <span className="absolute inset-y-0 border-r border-gold/80" style={{ right: `calc(${pct(XI)} - 0.5px)`, bottom: `${pct(XI)}` }} />
          <span className="absolute border-l-[2.6px] border-gold" style={{ left: `calc(${pct(XJ)} - 1.3px)`, top: 0, bottom: pct(XJ - 6) }} />
          <span className="absolute border-r-[2.6px] border-gold" style={{ right: `calc(${pct(XJ)} - 1.3px)`, top: 0, bottom: pct(XJ - 6) }} />
          {/* jaali strips between the rules */}
          <JaaliStrip side="left" from={XI} to={XJ} bottom={XJ - 6} />
          <JaaliStrip side="right" from={XI} to={XJ} bottom={XJ - 6} />
          {/* foot: closing rules */}
          <span className="absolute border-b-[2.4px] border-gold/90" style={{ left: `calc(${pct(XO)} - 1.2px)`, right: `calc(${pct(XO)} - 1.2px)`, bottom: pct(XO) }} />
          <span className="absolute border-b border-gold/80" style={{ left: pct(XI), right: pct(XI), bottom: pct(XI) }} />
          <span className="absolute border-b-[2.6px] border-gold" style={{ left: `calc(${pct(XJ)} - 1.3px)`, right: `calc(${pct(XJ)} - 1.3px)`, bottom: pct(XJ - 6) }} />
        </div>
      </div>

      {florals && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute -top-[7%] left-1/2 w-[58%] -translate-x-1/2">
            <ThemeArt name="arc" priority className="h-auto w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.25)]" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-[4%] left-1/2 w-[78%] -translate-x-1/2">
            <ThemeArt name="spray" priority className="h-auto w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.25)]" />
          </div>
        </>
      )}

      <div
        className="relative flex flex-col items-center text-center"
        style={{ paddingTop: '21%', paddingBottom: florals ? '30%' : '14%', paddingInline: '13%', minHeight: vh }}
      >
        <div className="my-auto flex w-full flex-col items-center">{children}</div>
      </div>
    </div>
  )
}

/** Lattice fill between the frame and the arch opening (top slice only). */
function SpandrelFill({ arch, fill }: { arch: string; fill: string }) {
  // frame rectangle traced clockwise, then the arch opening traced back: even-odd leaves the band
  const opening = `M${XJ} ${AH}${arch.replace(/^M[\d. ]+/, '')}L${AW - XJ} ${AH}Z`
  const frame = `M${XI} ${XI}H${AW - XI}V${AH}H${XI}Z`
  return <path d={`${frame}${opening}`} fill={fill} fillRule="evenodd" />
}

/** A vertical jaali strip between two rules, as a CSS background (cheap, tiles forever). */
function JaaliStrip({ side, from, to, bottom }: { side: 'left' | 'right'; from: number; to: number; bottom: number }) {
  const g = PALETTE.gold[2].replace('#', '%23')
  const tile = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cg fill='none' stroke='${g}' stroke-opacity='.5' stroke-width='3'%3E%3Cpath d='M16 16h24v24H16z'/%3E%3Cpath d='M28 11l17 17-17 17-17-17z'/%3E%3Cpath d='M28 0v11M28 45v11M0 28h11M45 28h11'/%3E%3Cpath d='M0 0l16 16M56 0L40 16M0 56l16-16M56 56L40 40'/%3E%3C/g%3E%3C/svg%3E")`
  return (
    <span
      className="absolute top-0"
      style={{
        [side]: `${(from / AW) * 100}%`,
        width: `${((to - from) / AW) * 100}%`,
        bottom: `${(bottom / AW) * 100}cqw`,
        backgroundImage: tile,
        backgroundSize: '100% auto',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: '0 0',
      }}
    />
  )
}

// ───────────────────────────── Small cusped frame ─────────────────────────────
/** A smaller cusped-arch panel (replaces the sheet's floral cusp frame). */
export function CuspArch({ children, className = '' }: { children: ReactNode; className?: string }) {
  const id = useUid()
  const gold = `url(#c${id})`
  const W = 300
  const H = 360
  const arch = cuspedArch(22, W - 22, 150, 18, 3)
  const outline = `${arch}L${W - 22} ${H - 22}H22Z`
  const inner = `${cuspedArch(32, W - 32, 152, 32, 3)}L${W - 32} ${H - 32}H32Z`
  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
        <defs>
          <GoldDefs id={`c${id}`} />
          <JaaliPattern id={`cj${id}`} size={14} stroke={PALETTE.gold[2]} opacity={0.4} />
        </defs>
        <path d={outline} fill={PALETTE.paper} fillOpacity={0.6} />
        <path d={`${outline}${inner}`} fill={`url(#cj${id})`} fillRule="evenodd" />
        <path d={outline} fill="none" stroke={gold} strokeWidth={3} strokeLinejoin="round" />
        <path d={inner} fill="none" stroke={gold} strokeWidth={1.1} strokeLinejoin="round" />
        <Rosette x={W / 2} y={6} r={10} fill={gold} stroke={PALETTE.gold[1]} />
      </svg>
      <div className="absolute inset-x-[14%] bottom-[12%] top-[20%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

// ───────────────────────────── Medallion ─────────────────────────────
/** The D & Z monogram in an eight-pointed star medallion (replaces the hands art). */
export function Medallion({ className = '' }: { className?: string }) {
  const id = useUid()
  const gold = `url(#m${id})`
  const { first, second } = wedding.monogram
  const star = (r: number, rot: number) => {
    const pts = Array.from({ length: 4 }, (_, k) => {
      const a = ((rot + k * 90) * Math.PI) / 180
      return `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`
    })
    return `M${pts.join('L')}Z`
  }
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`${first} and ${second}`}>
      <defs>
        <GoldDefs id={`m${id}`} angle={60} />
      </defs>
      <path d={star(46, 0) + star(46, 45)} fill={PALETTE.paper} stroke={gold} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={star(40, 0) + star(40, 45)} fill="none" stroke={gold} strokeWidth={0.7} strokeLinejoin="round" />
      <circle cx="50" cy="50" r="27" fill="none" stroke={gold} strokeWidth={1.2} />
      <text x="50" y="60" textAnchor="middle" fontFamily="'Great Vibes', cursive" fontSize="30" fill={gold}>
        {first}
        <tspan fontSize="16" dy="-4">
          &amp;
        </tspan>
        <tspan dy="4">{second}</tspan>
      </text>
    </svg>
  )
}

// ───────────────────────────── Lantern ─────────────────────────────
/** A pierced brass Moroccan lantern with a living candle glow. */
export function LanternSvg({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  const id = useUid()
  const gold = `url(#l${id})`
  const glass = `url(#lg${id})`
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className="anim-glow absolute left-1/2 top-[58%] aspect-square w-[260%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(255,200,110,0.55), rgba(255,200,110,0))', animationDelay: `${delay}s` }}
      />
      <svg viewBox="0 0 60 150" className="relative block h-auto w-full" aria-hidden="true">
        <defs>
          <GoldDefs id={`l${id}`} angle={0} />
          <radialGradient id={`lg${id}`} cx="50%" cy="62%" r="60%">
            <stop offset="0" stopColor="#fff6d0" />
            <stop offset="0.35" stopColor="#ffc861" />
            <stop offset="1" stopColor="#c26a12" />
          </radialGradient>
        </defs>
        {/* hanging ring + cap */}
        <circle cx="30" cy="5" r="3.6" fill="none" stroke={gold} strokeWidth="1.6" />
        <path d="M30 9c-2 6-14 10-16 20h32c-2-10-14-14-16-20z" fill={gold} />
        <path d="M12 29h36l-3 5H15z" fill={gold} />
        {/* glass body: three visible faces of a hexagonal lantern */}
        <path d="M15 34h30l5 12v52l-5 10H15l-5-10V46z" fill={glass} className="anim-glow" style={{ animationDelay: `${delay}s` }} />
        {/* pierced lattice over the glass */}
        <g fill="none" stroke={gold} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M15 34h30l5 12v52l-5 10H15l-5-10V46z" strokeWidth="2.2" />
          <path d="M22 34v74M38 34v74" />
          <path d="M22 108V58c0-8 16-8 16 0v50" />
          <path d="M10 60h12M38 60h12M10 84h12M38 84h12" />
          <path d="M26 72l4-6 4 6-4 6z" />
          <path d="M13 70l3 4-3 4M47 70l-3 4 3 4" />
        </g>
        {/* base + finial */}
        <path d="M15 108h30l-6 8H21z" fill={gold} />
        <path d="M24 116h12l-3 10h-6z" fill={gold} />
        <path d="M30 126c3 4 3 9 0 14-3-5-3-10 0-14z" fill={gold} />
      </svg>
    </div>
  )
}

// ───────────────────────────── Mosque at night ─────────────────────────────
/** A Mughal mosque silhouette with lit arches under a crescent moon. */
export function MosqueSvg({ className = '' }: { className?: string }) {
  const id = useUid()
  const gold = `url(#q${id})`
  // on dark themes the arches glow with lamplight; on paper themes they are cut out
  const night = PALETTE.paper.startsWith('#1')
  const lit = '#ffd27a'
  /** pointed arch opening, centre cx, half-width w, from floor y0 up to apex yA */
  const pointed = (cx: number, w: number, y0: number, yA: number) => {
    const s = yA + (y0 - yA) * 0.45
    return `M${cx - w} ${y0}V${s}C${cx - w} ${s - (s - yA) * 0.55} ${cx - w * 0.35} ${yA + 4} ${cx} ${yA}C${cx + w * 0.35} ${yA + 4} ${cx + w} ${s - (s - yA) * 0.55} ${cx + w} ${s}V${y0}Z`
  }
  const onion = (cx: number, base: number, w: number, h: number) =>
    `M${cx - w / 2} ${base}C${cx - w / 2} ${base - h * 0.55} ${cx - w * 0.62} ${base - h * 0.7} ${cx} ${base - h}C${cx + w * 0.62} ${base - h * 0.7} ${cx + w / 2} ${base - h * 0.55} ${cx + w / 2} ${base}Z`
  const minaret = (x: number) => (
    <g>
      <rect x={x - 5} y={70} width={10} height={150} fill={gold} />
      <rect x={x - 8} y={110} width={16} height={4} fill={gold} />
      <rect x={x - 8} y={160} width={16} height={4} fill={gold} />
      <rect x={x - 7} y={62} width={14} height={8} fill={gold} />
      <path d={onion(x, 62, 14, 20)} fill={gold} />
      <path d={`M${x} 42v-8`} stroke={gold} strokeWidth="1.4" />
    </g>
  )
  return (
    <svg viewBox="0 0 500 250" className={className} role="img" aria-label="A Mughal mosque under a crescent moon">
      <defs>
        <GoldDefs id={`q${id}`} />
        <radialGradient id={`mg${id}`}>
          <stop offset="0" stopColor="#fff2c4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2c4" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* crescent + stars */}
      <circle cx="402" cy="44" r="34" fill={`url(#mg${id})`} />
      <path d="M408 22a22 22 0 1 0 0 44a17 17 0 1 1 0-44z" fill={gold} />
      {[
        [70, 40, 2.2],
        [120, 22, 1.6],
        [345, 30, 1.4],
        [455, 90, 1.8],
        [40, 95, 1.3],
      ].map(([x, y, r]) => (
        <path key={x} d={`M${x} ${y - r * 2.2}L${x + r * 0.6} ${y - r * 0.6}L${x + r * 2.2} ${y}L${x + r * 0.6} ${y + r * 0.6}L${x} ${y + r * 2.2}L${x - r * 0.6} ${y + r * 0.6}L${x - r * 2.2} ${y}L${x - r * 0.6} ${y - r * 0.6}Z`} fill={gold} />
      ))}
      {minaret(70)}
      {minaret(430)}
      {/* wings with small domes */}
      <rect x={110} y={140} width={280} height={80} fill={gold} />
      <path d={onion(150, 140, 46, 46)} fill={gold} />
      <path d={onion(350, 140, 46, 46)} fill={gold} />
      {/* central iwan + great dome */}
      <rect x={185} y={96} width={130} height={124} fill={gold} />
      <rect x={196} y={82} width={108} height={16} fill={gold} />
      <path d={onion(250, 84, 104, 92)} fill={gold} />
      <path d="M250 -8v8" stroke={gold} strokeWidth="2" />
      <path d="M253 -2a4.5 4.5 0 1 0 0 9a3.6 3.6 0 1 1 0-9z" fill={gold} transform="translate(0 -8)" />
      {/* lit arches */}
      <path d={pointed(250, 26, 220, 126)} fill={night ? lit : PALETTE.paper} fillOpacity={0.92} />
      <path d={pointed(250, 18, 220, 140)} fill="none" stroke={gold} strokeWidth="1.4" />
      {[139, 171, 329, 361].map((x) => (
        <path key={x} d={pointed(x, 8, 206, 178)} fill={night ? lit : PALETTE.paper} fillOpacity={0.85} />
      ))}
      {/* plinth */}
      <rect x={30} y={220} width={440} height={10} fill={gold} />
      <rect x={10} y={230} width={480} height={6} fill={gold} opacity={0.7} />
    </svg>
  )
}

// ───────────────────────────── Save-the-date seal ─────────────────────────────
/** A scalloped foil seal: "Save the Date" around the rim, the date inside. */
export function SaveDateSeal({ className = '' }: { className?: string }) {
  const id = useUid()
  const gold = `url(#s${id})`
  const d = dateParts(wedding.events[0].start)
  const lobes = 24
  let edge = ''
  for (let i = 0; i <= lobes * 6; i++) {
    const a = (i / (lobes * 6)) * Math.PI * 2
    const r = 47 + 2.2 * Math.cos(a * lobes)
    edge += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`
  }
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`Save the date: ${d.day} ${d.month} ${d.year}`}>
      <defs>
        <GoldDefs id={`s${id}`} angle={50} />
        <path id={`sp${id}`} d="M50 50m-34 0a34 34 0 1 1 68 0a34 34 0 1 1 -68 0" />
      </defs>
      <path d={edge + 'Z'} fill={gold} />
      <circle cx="50" cy="50" r="40" fill={PALETTE.paper} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={gold} strokeWidth="0.8" />
      <circle cx="50" cy="50" r="28" fill="none" stroke={gold} strokeWidth="0.8" />
      <text fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="7.4" letterSpacing="1.6" fill={PALETTE.ink}>
        <textPath href={`#sp${id}`} startOffset="2%">
          SAVE THE DATE · SAVE THE DATE ·
        </textPath>
      </text>
      <text x="50" y="55" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="22" fill={gold}>
        {d.day}
      </text>
      <text x="50" y="66" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize="6.6" letterSpacing="1" fill={PALETTE.ink}>
        {d.monthShort.toUpperCase()} {d.year}
      </text>
    </svg>
  )
}

