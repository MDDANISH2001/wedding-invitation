import { wedding } from '../../config/wedding'

interface Props {
  layout?: 'inline' | 'stacked'
  className?: string
}

/** Four-point sparkle used beside the monogram and in transitions. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M10 0 L11.6 8.4 L20 10 L11.6 11.6 L10 20 L8.4 11.6 L0 10 L8.4 8.4Z" fill="currentColor" />
    </svg>
  )
}

/**
 * The D & Z monogram. Text stays as real (accessible, crisp) type in
 * the script face; flourishes and rules are SVG.
 */
export function Monogram({ layout = 'inline', className = '' }: Props) {
  const { first, second } = wedding.monogram
  const label = `${first} and ${second}`

  if (layout === 'stacked') {
    return (
      <div className={`relative flex flex-col items-center font-script text-plum leading-none ${className}`} role="img" aria-label={label}>
        <span className="text-[1em]" aria-hidden="true">{first}</span>
        <span className="-my-[0.1em] flex w-[3.4em] items-center text-[0.5em] text-lavender-rich" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-l from-plum/70 to-transparent" />
          <span className="px-[0.35em]">&amp;</span>
          <span className="h-px flex-1 bg-gradient-to-r from-plum/70 to-transparent" />
        </span>
        <span className="text-[1em]" aria-hidden="true">{second}</span>
      </div>
    )
  }

  return (
    <div className={`relative inline-flex items-center gap-[0.12em] font-script leading-none text-plum ${className}`} role="img" aria-label={label}>
      <span aria-hidden="true">{first}</span>
      <span aria-hidden="true" className="relative top-[0.04em] text-[0.52em] text-lavender-rich">
        &amp;
      </span>
      <span aria-hidden="true">{second}</span>
    </div>
  )
}
