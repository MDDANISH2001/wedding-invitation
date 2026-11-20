import type { ArtName } from '../assets/art/manifest'

const urls = import.meta.glob<string>('../assets/art/*.webp', { eager: true, import: 'default' })

/** URL of an extracted artwork file (see scripts/extract-art.mjs). */
export function artUrl(name: ArtName): string {
  return urls[`../assets/art/${name}.webp`]
}
