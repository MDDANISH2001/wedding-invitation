import type { CSSProperties } from 'react'
import { ArtImage } from './ArtImage'

const NAMES = {
  spray: 'floral-spray',
  arc: 'floral-arc',
  sprig: 'floral-sprig',
  'corner-a': 'floral-corner-a',
  'corner-b': 'floral-corner-b',
  'corner-lanterns': 'corner-lanterns',
} as const

interface Props {
  variant: keyof typeof NAMES
  className?: string
  style?: CSSProperties
  flipX?: boolean
  flipY?: boolean
  priority?: boolean
}

/** Lavender watercolour florals from the design sheet. */
export function FloralDecoration({ variant, className, style, flipX, flipY, priority }: Props) {
  const t = [flipX ? 'scaleX(-1)' : '', flipY ? 'scaleY(-1)' : ''].join(' ').trim()
  return <ArtImage name={NAMES[variant]} className={className} style={t ? { ...style, transform: t } : style} priority={priority} />
}
