import { fxConfig } from '../config/env'

/** A short vibration (Android; iOS Safari ignores it). VITE_HAPTICS=off disables. */
export function haptic(pattern: number | number[] = 12) {
  if (!fxConfig.haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}
