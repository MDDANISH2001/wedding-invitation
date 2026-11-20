import type { CSSProperties, ReactNode } from 'react'
import { artUrl } from '../../lib/art'

interface Props {
  children: ReactNode
  className?: string
  /** Frame the sheet with the template's printed lattice border. */
  band?: boolean
}

const strip = (name: 'band-x' | 'band-y', extra: CSSProperties): CSSProperties => ({
  position: 'absolute',
  backgroundImage: `url(${artUrl(name)})`,
  ...extra,
})

/**
 * An ivory invitation sheet on the lavender table: paper texture, a fine
 * printed rule and (optionally) the lattice border strip from the template.
 */
export function Sheet({ children, className = '', band = true }: Props) {
  const B = 'var(--band)'
  return (
    <div className="flex min-h-svh px-2.5 py-2.5 sm:px-5 sm:py-5 lg:px-8 lg:py-7">
      <div
        className={`paper relative mx-auto flex w-full max-w-[1180px] flex-col overflow-hidden rounded-[3px] shadow-[0_22px_50px_-24px_rgba(52,30,70,0.55),0_2px_6px_-2px_rgba(52,30,70,0.25)] [--band:22px] sm:[--band:28px] ${className}`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-[5px] border border-plum/40" />
        {band && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[9px]">
            <div style={strip('band-x', { top: 0, left: 0, right: 0, height: B, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' })} />
            <div style={strip('band-x', { bottom: 0, left: 0, right: 0, height: B, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x', transform: 'scaleY(-1)' })} />
            <div style={strip('band-y', { top: B, bottom: B, left: 0, width: B, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y' })} />
            <div style={strip('band-y', { top: B, bottom: B, right: 0, width: B, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', transform: 'scaleX(-1)' })} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
