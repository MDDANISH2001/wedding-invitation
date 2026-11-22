import { THEME, type ThemeName } from '../config/env'

/**
 * Colours that JavaScript-drawn art needs (SVG ornaments, the 3D envelope,
 * the night sky). CSS colours live in index.css under [data-theme].
 */
export interface Palette {
  /** gold ramp, dark → light, for gradients */
  gold: [string, string, string, string]
  /** main ink for line art */
  ink: string
  /** paper / card fill */
  paper: string
  /** a second accent */
  accent: string
  /** envelope body + flap colours, and the seal */
  /** labelInk: print the envelope's words in ink instead of gold foil */
  envelope: { body: string; flap: string; liner: string; seal: [string, string]; print: string; labelInk?: string }
  /** background behind the envelope */
  table: string
  /** text colour on that background */
  tableInk: string
}

const PALETTES: Record<ThemeName, Palette> = {
  classic: {
    gold: ['#7a5300', '#b8860b', '#e9c46a', '#fff3c9'],
    ink: '#4b0082',
    paper: '#fdf6e3',
    accent: '#800080',
    envelope: { body: '#4b0082', flap: '#5a1592', liner: '#e6e6fa', seal: ['#d1a034', '#8a6008'], print: '#e9c46a' },
    table: '#e6e6fa',
    tableInk: '#1a0033',
  },
  midnight: {
    gold: ['#6b4a0c', '#c08f2c', '#f0cd72', '#fff6d6'],
    ink: '#e9c46a',
    paper: '#141a3d',
    accent: '#f0c987',
    envelope: { body: '#141b45', flap: '#1b2458', liner: '#0d1233', seal: ['#e0b04a', '#7a5208'], print: '#d9ad4a' },
    table: '#070a1f',
    tableInk: '#f6ecd6',
  },
  rose: {
    gold: ['#7a4a00', '#c47f0e', '#f2b544', '#fff0c4'],
    ink: '#7a0f2e',
    paper: '#fff8ef',
    accent: '#b0123f',
    envelope: { body: '#5e0a22', flap: '#6c0f2a', liner: '#fbe3e3', seal: ['#e0a531', '#7a4a00'], print: '#f2b544' },
    table: '#4d0a1b',
    tableInk: '#fbe7d0',
  },
  letterpress: {
    gold: ['#6e5214', '#a8802e', '#e3c77d', '#fff7dc'],
    ink: '#1b1e2e',
    paper: '#fbf8f1',
    accent: '#9a7428',
    envelope: { body: '#f4efe3', flap: '#efe8d9', liner: '#1b1e2e', seal: ['#2a2f4a', '#0d0f1a'], print: '#a8802e', labelInk: '#1b1e2e' },
    table: '#e5ddcc',
    tableInk: '#1b1e2e',
  },
  noor: {
    gold: ['#6a4310', '#b98431', '#f1cf85', '#fff4d6'],
    ink: '#f3dfae',
    paper: '#1a0f08',
    accent: '#e8b45c',
    envelope: { body: '#2a170b', flap: '#331d0e', liner: '#120a05', seal: ['#e3b55a', '#7a5212'], print: '#e3b55a' },
    table: '#0b0604',
    tableInk: '#f3e3c0',
  },
}

export const PALETTE: Palette = PALETTES[THEME]
