import { m as motion } from 'motion/react'
import type { PageDef } from './InvitationBook'

interface Props {
  pages: PageDef[]
  active: number
  onSelect: (i: number) => void
}

/**
 * Page markers: a column of diamonds on the right on larger screens,
 * a slim row at the bottom on phones.
 */
export function PageNav({ pages, active, onSelect }: Props) {
  return (
    <motion.nav
      aria-label="Invitation pages"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3.2, duration: 0.8 }}
      className={`fixed z-50 transition-opacity duration-500 ${active === 0 ? "max-md:pointer-events-none max-md:!opacity-0" : ""} right-1 top-1/2 -translate-y-1/2 lg:right-5`}
    >
      <ol className="flex flex-col items-center gap-0.5 rounded-full border border-plum/15 bg-ivory/80 py-1.5 shadow-[0_4px_18px_-6px_rgba(74,47,92,0.35)] md:gap-1 md:px-1 md:py-2">
        {pages.map((p, i) => {
          const on = i === active
          return (
            <li key={p.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`${p.label} (page ${i + 1} of ${pages.length})`}
                aria-current={on ? 'step' : undefined}
                className="grid h-7 w-6 cursor-pointer place-items-center md:h-7 md:w-7"
              >
                <span
                  className={`block rotate-45 border border-plum transition-all duration-500 ease-silk ${
                    on ? 'h-2.5 w-2.5 bg-plum' : 'h-1.5 w-1.5 bg-transparent group-hover:bg-lavender'
                  }`}
                />
              </button>
              <span className="pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-sm bg-plum-deep/90 px-2 py-0.5 font-serif text-sm text-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
                {p.label}
              </span>
            </li>
          )
        })}
      </ol>
    </motion.nav>
  )
}
