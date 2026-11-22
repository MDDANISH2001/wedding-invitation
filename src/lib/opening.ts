import { fxConfig } from '../config/env'
import { dua } from '../fx/dua'
import { requestMotion } from '../fx/foil'
import { haptic } from './haptics'

/**
 * Everything that needs the guest's tap on the seal (browsers allow sound,
 * vibration and motion sensors only inside a user gesture).
 */
export function onOpenGesture() {
  haptic([14, 60, 22])
  requestMotion()
  if (fxConfig.dua && fxConfig.duaAutoplay) dua.play()
}
