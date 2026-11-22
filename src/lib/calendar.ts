import type { WeddingEvent } from '../config/wedding'
import { wedding } from '../config/wedding'

/** Default length of an event in the calendar entry. */
const HOURS = 3

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

function range(ev: WeddingEvent) {
  const start = new Date(ev.start)
  const end = new Date(start.getTime() + HOURS * 3600_000)
  return { start, end }
}

const title = (ev: WeddingEvent) => `${ev.title} · ${wedding.groom.name} & ${wedding.bride.name}`
const place = (ev: WeddingEvent) => [ev.venueName, ev.venueAddress].filter(Boolean).join(', ')
const details = (ev: WeddingEvent) => `${ev.schedule.map((s) => `${s.label}: ${s.time}`).join('\n')}${ev.mapsUrl ? `\n${ev.mapsUrl}` : ''}`

/** Google Calendar "create event" link (works on Android, iPhone and desktop). */
export function googleCalendarUrl(ev: WeddingEvent): string {
  const { start, end } = range(ev)
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: title(ev),
    dates: `${stamp(start)}/${stamp(end)}`,
    details: details(ev),
    location: place(ev),
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

/** An .ics file (Apple Calendar, Outlook) as a data URL. */
export function icsUrl(ev: WeddingEvent): string {
  const { start, end } = range(ev)
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nikah invitation//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}-${stamp(start)}@invitation`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title(ev))}`,
    `DESCRIPTION:${esc(details(ev))}`,
    `LOCATION:${esc(place(ev))}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title(ev))}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}
