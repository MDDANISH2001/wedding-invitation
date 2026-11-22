import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ART_SIZES } from '../../assets/art/manifest'
import { ArtImage } from './ArtImage'
import { artUrl } from '../../lib/art'
import { IS_CLASSIC } from '../../config/env'
import { ArchCard, CuspArch } from './mughal'

const S = ART_SIZES
// Interior of the arched frame, as fractions of its width.
const PAD_TOP = 0.15
const PAD_BOTTOM = 0.4

interface CardProps {
  children: ReactNode
  className?: string
  /** Grow to at least the viewport height minus this many px. */
  viewportInset?: number
}

/**
 * The arched floral frame from the design sheet, rebuilt in three slices:
 * arch + top florals, the patterned sides repeated on whole pattern periods,
 * and the bottom florals + lattice band. Height snaps to whole repeats so
 * the border never shows a seam.
 */
export function InvitationCardFrame(props: CardProps) {
  if (!IS_CLASSIC) return <ArchCard {...props} />
  return <ClassicCardFrame {...props} />
}

function ClassicCardFrame({ children, className = '', viewportInset }: CardProps) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const measure = () => {
      const W = o.clientWidth
      const top = (W * S['frame-top'].h) / S['frame-top'].w
      const bot = (W * S['frame-bottom'].h) / S['frame-bottom'].w
      const tile = (W * S['frame-mid'].h) / S['frame-mid'].w
      const forContent = Math.ceil((i.offsetHeight + W * (PAD_TOP + PAD_BOTTOM) - top - bot - 1) / tile)
      const forViewport = viewportInset === undefined ? 0 : Math.floor((window.innerHeight - viewportInset - top - bot) / tile)
      setHeight(Math.round(top + bot + Math.max(0, forContent, forViewport) * tile))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(o)
    ro.observe(i)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [viewportInset])

  return (
    <div ref={outer} className={`relative ${className}`} style={{ height }}>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col drop-shadow-[0_18px_30px_rgba(75,0,130,0.22)]">
        <ArtImage name="frame-top" priority className="block h-auto w-full shrink-0" />
        <div
          className="-my-px min-h-0 flex-1"
          style={{ backgroundImage: `url(${artUrl('frame-mid')})`, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y' }}
        />
        <ArtImage name="frame-bottom" priority className="block h-auto w-full shrink-0" />
      </div>
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ paddingTop: `${PAD_TOP * 100}%`, paddingBottom: `${PAD_BOTTOM * 100}%`, paddingInline: '11%' }}
      >
        <div ref={inner} className="flex flex-col items-center text-center">
          {children}
        </div>
      </div>
    </div>
  )
}

/** The cusped floral frame from the design sheet; children sit in its centre. */
export function CuspFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  if (!IS_CLASSIC) return <CuspArch className={className}>{children}</CuspArch>
  return (
    <div className={`relative ${className}`}>
      <ArtImage name="cusp-frame" className="block h-auto w-full" />
      <div className="absolute inset-x-[17%] bottom-[16%] top-[16%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
