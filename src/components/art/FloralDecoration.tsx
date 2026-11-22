import type { CSSProperties } from 'react'
import { ArtImage } from './ArtImage'
import { IS_CLASSIC } from '../../config/env'
import { ThemeArt, type ThemeArtName } from './ThemeArt'

/** The new themes' botanical equivalents (corner art is drawn for the bottom-right). */
const THEMED: Record<keyof typeof NAMES, ThemeArtName> = {
  spray: 'spray',
  arc: 'arc',
  sprig: 'sprig',
  'corner-a': 'corner',
  'corner-b': 'corner',
  'corner-lanterns': 'corner',
}

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
  // corner-lanterns hang from the top: the themed corner bouquet is turned upside down
  if (!IS_CLASSIC && variant === 'corner-lanterns') flipY = !flipY
  const t = [flipX ? 'scaleX(-1)' : '', flipY ? 'scaleY(-1)' : ''].join(' ').trim()
  if (!IS_CLASSIC) return <ThemeArt name={THEMED[variant]} className={className} style={t ? { ...style, transform: t } : style} priority={priority} />
  return <ArtImage name={NAMES[variant]} className={className} style={t ? { ...style, transform: t } : style} priority={priority} />
}
