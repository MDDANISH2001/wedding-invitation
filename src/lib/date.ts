import { WEDDING_TIMEZONE } from '../config/wedding'

const part = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: WEDDING_TIMEZONE, ...opts }).format(new Date(iso))

/** Parts of an event date, always rendered in the wedding's timezone. */
export function dateParts(iso: string) {
  return {
    day: part(iso, { day: '2-digit' }),
    dayNumber: part(iso, { day: 'numeric' }),
    weekday: part(iso, { weekday: 'long' }),
    month: part(iso, { month: 'long' }),
    monthShort: part(iso, { month: 'short' }),
    year: part(iso, { year: 'numeric' }),
  }
}

/** "Saturday, 5 December 2026" */
export function longDate(iso: string) {
  const p = dateParts(iso)
  return `${p.weekday}, ${p.dayNumber} ${p.month} ${p.year}`
}

export interface Remaining {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Pure countdown maths — easy to unit test. */
export function remainingUntil(targetMs: number, nowMs: number): Remaining {
  const total = Math.max(0, targetMs - nowMs)
  const s = Math.floor(total / 1000)
  return {
    total,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}
