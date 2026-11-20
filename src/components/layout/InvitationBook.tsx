import {
  m as motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { PageContext } from './PageContext'
import { PageNav } from './PageNav'

export interface PageDef {
  id: string
  label: string
  Component: ComponentType
}

interface Layout {
  heights: number[]
  vh: number
}

/**
 * A sequence of invitation pages. Every page is `position: sticky`, so as
 * the guest scrolls, the next sheet slides up over the previous one while
 * it settles back slightly — like leafing through a printed invitation.
 * Pure native scrolling: no hijacking, no snapping, works with any input.
 */
export function InvitationBook({ pages }: { pages: PageDef[] }) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [layout, setLayout] = useState<Layout>({ heights: [], vh: 800 })
  const layoutRef = useRef(layout)
  const { scrollY } = useScroll()
  const [active, setActive] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const heights = refs.current.map((el) => el?.offsetHeight ?? 0)
      const vh = window.innerHeight
      setLayout((prev) =>
        prev.vh === vh && prev.heights.length === heights.length && prev.heights.every((h, i) => h === heights[i])
          ? prev
          : { heights, vh },
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    refs.current.forEach((el) => el && ro.observe(el))
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [pages.length])

  // Static (in-flow) top of each page = sum of the heights before it.
  const tops = useMemo(() => {
    const out: number[] = []
    layout.heights.forEach((_h, i) => out.push(i === 0 ? 0 : out[i - 1] + layout.heights[i - 1]))
    return out
  }, [layout.heights])
  const topsRef = useRef(tops)
  useLayoutEffect(() => {
    layoutRef.current = layout
    topsRef.current = tops
  }, [layout, tops])

  const updateActive = useCallback((y: number) => {
    const t = topsRef.current
    const { vh } = layoutRef.current
    let idx = 0
    for (let i = 0; i < t.length; i++) if (y >= t[i] - vh * 0.45) idx = i
    setActive((a) => (a === idx ? a : idx))
  }, [])
  useMotionValueEvent(scrollY, 'change', updateActive)

  const goTo = useCallback((i: number) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: topsRef.current[i] ?? 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  return (
    <main className="relative">
      {pages.map((p, i) => (
        <BookPage
          key={p.id}
          def={p}
          index={i}
          isLast={i === pages.length - 1}
          scrollY={scrollY}
          top={tops[i] ?? 0}
          nextTop={tops[i + 1]}
          height={layout.heights[i] ?? 0}
          vh={layout.vh}
          setRef={(el) => (refs.current[i] = el)}
        />
      ))}
      <PageNav pages={pages} active={active} onSelect={goTo} />
    </main>
  )
}

interface BookPageProps {
  def: PageDef
  index: number
  isLast: boolean
  scrollY: MotionValue<number>
  top: number
  nextTop: number | undefined
  height: number
  vh: number
  setRef: (el: HTMLElement | null) => void
}

function BookPage({ def, index, isLast, scrollY, top, nextTop, height, vh, setRef }: BookPageProps) {
  const reduce = useReducedMotion()
  const { Component } = def

  // Geometry lives in a ref so the scroll-driven transforms always read fresh values.
  const geo = useRef({ top, nextTop, vh })
  useLayoutEffect(() => {
    geo.current = { top, nextTop, vh }
  }, [top, nextTop, vh])

  // How far the *next* page has slid over this one (0 → 1).
  const cover = useTransform(scrollY, (y) => {
    const g = geo.current
    return g.nextTop === undefined ? 0 : clamp01((y - (g.nextTop - g.vh)) / g.vh)
  })
  // This page's own arrival (0 → 1); used for gentle parallax inside.
  const enter = useTransform(scrollY, (y) => {
    const g = geo.current
    return index === 0 ? 1 : clamp01((y - (g.top - g.vh)) / g.vh)
  })

  const scale = useTransform(cover, [0, 1], [1, 0.94])
  const shade = useTransform(cover, [0, 1], [0, 0.42])
  // Settle back around the part of the page that's actually on screen.
  const originY = height > vh ? `${((height - vh / 2) / height) * 100}%` : '50%'
  const stickTop = Math.min(0, vh - height)
  const ctx = useMemo(() => ({ enter, index }), [enter, index])

  return (
    <section
      ref={setRef}
      id={def.id}
      aria-label={def.label}
      className="sticky"
      style={{
        top: stickTop,
        zIndex: index + 1,
        boxShadow: index === 0 ? undefined : '0 -18px 40px -12px rgba(52, 30, 70, 0.35)',
      }}
    >
      <motion.div
        className="table-surface relative"
        style={reduce || isLast ? undefined : { scale, transformOrigin: `50% ${originY}` }}
      >
        <PageContext.Provider value={ctx}>
          <Component />
        </PageContext.Provider>
      </motion.div>
      {!reduce && !isLast && (
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-plum-deep" style={{ opacity: shade }} />
      )}
    </section>
  )
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
