import { AnimatePresence, m as motion } from 'motion/react'
import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dua, duaInfo } from '../../fx/dua'
import { haptic } from '../../lib/haptics'
import { EASE_SILK } from '../../lib/motion'

/**
 * A small floating player for the recited dua (VITE_DUA). While it plays,
 * the words appear above it in Arabic with their meaning.
 */
export function DuaPlayer({ caption = true, compact = false }: { caption?: boolean; compact?: boolean }) {
  const [state, setState] = useState(dua.state)
  useEffect(() => dua.subscribe(setState), [])
  if (!duaInfo) return null
  const playing = state === 'playing'

  return (
    <div className="pointer-events-none fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-3 z-[70] flex max-w-[min(92vw,420px)] flex-col items-start gap-2">
      <AnimatePresence>
        {playing && caption && (
          <motion.figure
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.6, ease: EASE_SILK }}
            className="no-press rounded-2xl border border-gold/50 bg-ivory/95 px-4 py-3 text-center shadow-[0_14px_34px_-14px_rgba(0,0,0,0.6)] backdrop-blur-sm"
          >
            <p lang="ar" dir="rtl" className="arabic gold-text text-[22px] font-bold leading-[1.8]">
              {duaInfo.arabic}
            </p>
            <p className="font-serif text-[15px] font-semibold italic leading-snug text-plum">{duaInfo.meaning}</p>
            <figcaption className="caps mt-1 text-[11px] font-bold text-gold-deep">{duaInfo.source}</figcaption>
          </motion.figure>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.6, ease: EASE_SILK }}
        onClick={() => {
          haptic(8)
          dua.toggle()
        }}
        aria-label={playing ? 'Pause the dua' : `Play the dua: ${duaInfo.latin}`}
        className={`no-press pointer-events-auto flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-gold/60 bg-btn text-btn-ink ${compact ? 'h-12 w-12 justify-center' : 'py-1.5 pl-2 pr-4'} shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)]`}
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-btn-ink/15">
          {playing && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-btn-ink/25" />}
          {playing ? <Pause className="h-4 w-4" strokeWidth={2.2} /> : <Play className="h-4 w-4 translate-x-px" strokeWidth={2.2} />}
        </span>
        {!compact && <span className="caps text-[11px] font-bold tracking-[0.14em]">{playing ? 'Dua playing' : 'Play the dua'}</span>}
      </motion.button>
    </div>
  )
}
