import { fxConfig } from '../config/env'
import { wedding } from '../config/wedding'

/**
 * The recited dua (VITE_DUA). One shared <audio>; browsers only allow sound
 * after a tap, so the envelope's tap starts it (VITE_DUA_AUTOPLAY), and the
 * floating player can always start / stop it.
 */
type State = 'idle' | 'playing' | 'paused' | 'ended'
const listeners = new Set<(s: State) => void>()
let audio: HTMLAudioElement | null = null
let state: State = 'idle'

const set = (s: State) => {
  state = s
  listeners.forEach((l) => l(s))
}

export const duaInfo = fxConfig.dua ? wedding.recitations[fxConfig.dua] : null

function el() {
  if (!audio && duaInfo) {
    audio = new Audio(`${import.meta.env.BASE_URL}${duaInfo.file}`)
    audio.volume= 0.5
    audio.preload = 'auto'
    audio.addEventListener('playing', () => set('playing'))
    audio.addEventListener('pause', () => set(audio!.ended ? 'ended' : 'paused'))
    audio.addEventListener('ended', () => set('ended'))
  }
  return audio
}

export const dua = {
  get state() {
    return state
  },
  subscribe(fn: (s: State) => void) {
    listeners.add(fn)
    return () => void listeners.delete(fn)
  },
  /** Call inside a tap handler. */
  play() {
    const a = el()
    if (!a) return
    if (a.ended) a.currentTime = 0
    a.play().catch(() => set('paused'))
  },
  pause() {
    audio?.pause()
  },
  toggle() {
    if (state === 'playing') this.pause()
    else this.play()
  },
  /** Warm the file up early so the first tap plays instantly. */
  preload() {
    el()
  },
}
