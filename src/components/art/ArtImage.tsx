import type { CSSProperties } from 'react'
import { ART_SIZES, type ArtName } from '../../assets/art/manifest'

import { artUrl } from '../../lib/art'

interface Props {
  name: ArtName
  className?: string
  style?: CSSProperties
  /** Decorative by default; pass alt text for meaningful imagery. */
  alt?: string
  /** Above-the-fold art: load eagerly with high priority. */
  priority?: boolean
}

/**
 * An artwork image extracted from the design sheet. Intrinsic width and
 * height come from the generated manifest, so the layout never shifts.
 */
export function ArtImage({ name, className, style, alt = '', priority = false }: Props) {
  const { w, h } = ART_SIZES[name]
  return (
    <img
      src={artUrl(name)}
      width={w}
      height={h}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={style}
    />
  )
}
