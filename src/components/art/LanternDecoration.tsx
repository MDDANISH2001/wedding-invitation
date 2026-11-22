import type { CSSProperties } from 'react'
import { ArtImage } from './ArtImage'
import { IS_CLASSIC } from '../../config/env'
import { LanternSvg } from './mughal'

type Kind = 'lantern-grand' | 'lantern-small' | 'lantern-globe' | 'lantern-hex' | 'lantern-chain'

interface Props {
  kind?: Kind
  /** Extra chain above the lantern, in px (0 for lanterns drawn with their own chain). */
  chain?: number
  className?: string
  style?: CSSProperties
  sway?: boolean
  /** Offsets the sway so neighbouring lanterns don't move in unison. */
  delay?: number
}

/** A brass lantern from the design sheet, hung from a fine chain, with a gentle sway and candle glow. */
export function LanternDecoration({ kind = 'lantern-small', chain = 40, className = '', style, sway = true, delay = 0 }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col items-center ${sway ? 'anim-sway' : ''} ${className}`}
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      {chain > 0 && (
        <span
          className="w-[2px] rounded-full"
          style={{ height: chain, background: 'repeating-linear-gradient(180deg, #a07a2c 0 4px, #e9c46a 4px 6px, #7d5c17 6px 8px)' }}
        />
      )}
      {!IS_CLASSIC ? (
        <LanternSvg className="w-full" delay={delay} />
      ) : (
      <div className="relative w-full">
        <span
          className="anim-glow absolute left-1/2 top-[62%] aspect-square w-[240%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(255,214,130,0.5), rgba(255,214,130,0))', animationDelay: `${delay}s` }}
        />
        <ArtImage name={kind} className="relative block h-auto w-full" />
      </div>
      )}
    </div>
  )
}
