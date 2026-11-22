import type { CSSProperties } from 'react'
import { THEME } from '../../config/env'
import { THEME_ART } from '../../assets/themes/manifest'

const urls = import.meta.glob<string>('../../assets/themes/*/*.webp', { eager: true, import: 'default' })

export type ThemeArtName = keyof (typeof THEME_ART)['rose']
type ArtTheme = keyof typeof THEME_ART

/** Theme of the art set to use (classic falls back to rose; noor uses the gold-leaf set). */
const ART_THEME: ArtTheme = THEME === 'classic' ? 'rose' : THEME === 'noor' ? 'midnight' : THEME

interface Props {
  name: ThemeArtName
  className?: string
  style?: CSSProperties
  alt?: string
  priority?: boolean
}

/**
 * Botanical art for the new themes, from public-domain museum scans
 * (Redouté's roses, a Mughal marigold) — see scripts/theme-art.mjs.
 */
export function ThemeArt({ name, className, style, alt = '', priority = false }: Props) {
  const { w, h } = THEME_ART[ART_THEME][name]
  return (
    <img
      src={urls[`../../assets/themes/${ART_THEME}/${name}.webp`]}
      width={w}
      height={h}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={style}
    />
  )
}
