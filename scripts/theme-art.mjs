/**
 * Builds the artwork for the new themes from public-domain (CC0) museum
 * scans, downloaded once into art-src/cc0/:
 *
 *   Pierre-Joseph Redouté, "Les Roses" (1817–24) and a Mughal "Flowering
 *   Marigold" album page (c. 1650) — Cleveland Museum of Art Open Access (CC0).
 *
 * Each plant is cut out of its paper, then rendered per theme:
 *   rose        → natural colour
 *   midnight    → gold leaf (luminance mapped onto a gold ramp)
 *   letterpress → single-ink engraving (dark ink, alpha from tone)
 * and arranged into the decoration shapes the components use.
 *
 *   node scripts/theme-art.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import sharp from 'sharp'
import { cutout } from './lib/cutout.mjs'

const SRC = 'art-src/cc0'
const OUT = 'src/assets/themes'
const CMA = (id) => `https://openaccess-cdn.clevelandart.org/${id}/${id}_print.jpg`

/** Source plates and how to cut them. */
const PLATES = {
  marigold: { id: '2013.351.b', crop: [0.335, 0.212, 0.665, 0.79] },
  roseDark: { id: '1965.293', crop: [0.02, 0.02, 0.98, 0.69] },
  roseSingle: { id: '1959.14' },
  roseCabbage: { id: '1959.20' },
  rosePompon: { id: '1943.142' },
}

async function fetchPlate(id) {
  const file = `${SRC}/${id}.jpg`
  try {
    await access(file)
  } catch {
    console.log('downloading', id)
    const res = await fetch(CMA(id))
    if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`)
    await mkdir(SRC, { recursive: true })
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
  }
  return file
}

/** RGBA image held in memory. */
const img = (c) => sharp(c.data, { raw: { width: c.width, height: c.height, channels: 4 } })

/** Crop a fraction of a cut-out (to pull single blooms / branches out of a plate). */
async function part(c, [l, t, r, b]) {
  const left = Math.round(c.width * l)
  const top = Math.round(c.height * t)
  const width = Math.min(c.width - left, Math.round(c.width * (r - l)))
  const height = Math.min(c.height - top, Math.round(c.height * (b - t)))
  const { data, info } = await img(c).extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true })
  // fade out along every edge that cut through the plant, so no hard crop lines show
  const W = info.width
  const H = info.height
  const fw = W * 0.14
  const fh = H * 0.16
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let k = 1
      if (l > 0) k = Math.min(k, x / fw)
      if (r < 1) k = Math.min(k, (W - 1 - x) / fw)
      if (t > 0) k = Math.min(k, y / fh)
      if (b < 1) k = Math.min(k, (H - 1 - y) / fh)
      if (k < 1) {
        const i = (y * W + x) * 4 + 3
        const e = Math.max(0, k)
        data[i] = Math.round(data[i] * e * e * (3 - 2 * e))
      }
    }
  return { data, width: W, height: H }
}

// ───────────────────────── colour treatments ─────────────────────────
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
function ramp(stops, t) {
  const n = stops.length - 1
  const x = Math.min(n - 1e-6, Math.max(0, t * n))
  const i = Math.floor(x)
  const f = x - i
  return stops[i].map((v, k) => v + (stops[i + 1][k] - v) * f)
}
const GOLD = ['#3a2404', '#7a5410', '#b8862a', '#e2bb5c', '#f8e6a8', '#fffbea'].map(hex)

function treat(c, mode) {
  if (mode === 'colour') return c
  const out = Buffer.from(c.data)
  for (let i = 0; i < out.length; i += 4) {
    const L = (0.299 * out[i] + 0.587 * out[i + 1] + 0.114 * out[i + 2]) / 255
    if (mode === 'gold') {
      // gentle contrast so petals read as raised leaf, shadows as tooling
      const t = Math.min(1, Math.max(0, (L - 0.04) / 0.72)) ** 0.7
      const [r, g, b] = ramp(GOLD, t)
      out[i] = r
      out[i + 1] = g
      out[i + 2] = b
    } else if (mode === 'ink') {
      const ink = 1 - L
      out[i] = 30
      out[i + 1] = 34
      out[i + 2] = 54
      out[i + 3] = Math.round(out[i + 3] * Math.min(1, ink * 1.35) ** 1.5)
    }
  }
  return { ...c, data: out }
}

// ───────────────────────── arrangements ─────────────────────────
/**
 * Place pieces on a transparent canvas. Each piece: { c, h (px), x, y (centre), rot, flip }.
 */
async function arrange(W0, H0, pieces) {
  const PAD = 700
  const W = W0 + PAD * 2
  const H = H0 + PAD * 2
  pieces = pieces.map((p) => ({ ...p, x: p.x + PAD, y: p.y + PAD }))
  const layers = []
  for (const p of pieces) {
    let s = img(p.c).resize({ height: Math.round(p.h) })
    if (p.flip) s = s.flop()
    let buf = await s.png().toBuffer()
    if (p.rot) buf = await sharp(buf).rotate(p.rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    const m = await sharp(buf).metadata()
    // clip pieces that overhang the canvas
    let left = Math.round(p.x - m.width / 2)
    let top = Math.round(p.y - m.height / 2)
    const ex = { left: Math.max(0, -left), top: Math.max(0, -top) }
    ex.width = Math.min(m.width - ex.left, W - Math.max(0, left))
    ex.height = Math.min(m.height - ex.top, H - Math.max(0, top))
    if (ex.width <= 0 || ex.height <= 0) continue
    buf = await sharp(buf).extract(ex).png().toBuffer()
    layers.push({ input: buf, left: Math.max(0, left), top: Math.max(0, top) })
  }
  const { data, info } = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .raw()
    .toBuffer({ resolveWithObject: true })
  return trim({ data, width: info.width, height: info.height })
}

async function trim(c) {
  const { data, info } = await img(c).trim({ threshold: 1 }).raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

async function main() {
  const cuts = {}
  for (const [k, p] of Object.entries(PLATES)) {
    const file = await fetchPlate(p.id)
    cuts[k] = await cutout(file, { maxSide: 1600, ...(p.crop ? { crop: p.crop } : {}) })
    console.log('cut', k, cuts[k].width, cuts[k].height)
  }
  const P = {
    marigold: cuts.marigold,
    // single blooms and branches pulled from the plates
    darkPair: await part(cuts.roseDark, [0.0, 0.0, 0.72, 0.46]),
    darkBranch: cuts.roseDark,
    pink: await part(cuts.roseSingle, [0.1, 0.0, 1.0, 0.62]),
    pinkFull: cuts.roseSingle,
    cabbage: await part(cuts.roseCabbage, [0.0, 0.0, 1.0, 0.42]),
    cabbageFull: cuts.roseCabbage,
    pompon: await part(cuts.rosePompon, [0.25, 0.0, 1.0, 0.25]),
    pomponFull: cuts.rosePompon,
  }

  /** The decoration shapes the components ask for. */
  const SHAPES = {
    // wide bouquet for the foot of a page
    spray: () =>
      arrange(1500, 760, [
        { c: P.darkBranch, h: 640, x: 330, y: 430, rot: -62 },
        { c: P.pinkFull, h: 640, x: 1170, y: 430, rot: 62, flip: true },
        { c: P.cabbage, h: 360, x: 560, y: 470, rot: -14 },
        { c: P.pink, h: 380, x: 960, y: 470, rot: 10 },
        { c: P.darkPair, h: 380, x: 760, y: 560 },
      ]),
    // garland across the arched top of an event card
    arc: () =>
      arrange(1500, 820, [
        { c: P.darkBranch, h: 640, x: 360, y: 500, rot: -48 },
        { c: P.cabbageFull, h: 640, x: 1140, y: 500, rot: 48, flip: true },
        { c: P.darkPair, h: 360, x: 560, y: 280, rot: -16 },
        { c: P.pink, h: 360, x: 940, y: 280, rot: 14 },
        { c: P.cabbage, h: 330, x: 750, y: 200 },
      ]),
    // slim horizontal sprig
    sprig: () =>
      arrange(1500, 520, [
        { c: P.pomponFull, h: 700, x: 430, y: 270, rot: -90 },
        { c: P.pomponFull, h: 700, x: 1070, y: 270, rot: 90, flip: true },
        { c: P.darkPair, h: 300, x: 750, y: 260 },
      ]),
    // bouquet for a page corner (drawn for the bottom-right; flipped in CSS)
    corner: () =>
      arrange(1000, 1000, [
        { c: P.darkBranch, h: 820, x: 620, y: 520, rot: -38 },
        { c: P.pink, h: 360, x: 330, y: 720, rot: -55 },
        { c: P.cabbage, h: 330, x: 760, y: 300, rot: 10 },
      ]),
    // the Mughal marigold, alone (tall side panels, page headers)
    marigold: async () => P.marigold,
    // single blooms for small accents
    bloom: async () => P.darkPair,
  }

  const THEMES = { rose: 'colour', midnight: 'gold', letterpress: 'ink' }
  const manifest = {}
  for (const [theme, mode] of Object.entries(THEMES)) {
    await mkdir(`${OUT}/${theme}`, { recursive: true })
    manifest[theme] = {}
    for (const [name, make] of Object.entries(SHAPES)) {
      const c = treat(await make(), mode)
      // 900px on the long side covers a 420px-wide slot at 2× DPR
      const long = name === 'marigold' ? 1100 : 900
      const out = img(c).resize(c.width >= c.height ? { width: Math.min(long, c.width) } : { height: Math.min(long, c.height) })
      const info = await out.webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/${theme}/${name}.webp`)
      manifest[theme][name] = { w: info.width, h: info.height }
      console.log(theme, name, info.width, info.height, `${(info.size / 1024).toFixed(0)} KB`)
    }
  }
  await writeFile(
    `${OUT}/manifest.ts`,
    `// Generated by scripts/theme-art.mjs — do not edit.\nexport const THEME_ART = ${JSON.stringify(manifest, null, 2)} as const\n`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
