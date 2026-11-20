/**
 * Extracts, cleans and enhances the invitation artwork from the design sheet.
 *
 *   yarn art                        # uses art-src/design-sheet.png
 *   yarn art path/to/sheet.png      # e.g. an AI-upscaled copy of the same sheet
 *
 * Pipeline per asset:
 *   (once) ffmpeg non-local-means denoise of the whole sheet → removes AI/JPEG noise
 *   crop → erase neighbouring elements → cut out the sheet background
 *   (edge flood fill, soft alpha, colour decontamination)
 *   → colour grade to the palette (sheet grey → ivory #FDF6E3, richer lavender, warmer brass)
 *   → 3× Lanczos upscale → unsharp mask (line art: alpha re-sharpened for crisp edges)
 *   → WebP with alpha
 *
 * Coordinates are in sheet pixels (1264 × 843). A larger sheet with the same
 * layout (an upscaled copy) is scaled automatically and gives sharper output.
 * Writes src/assets/art/*.webp and src/assets/art/manifest.ts.
 */
import sharp from 'sharp'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.argv[2] ?? resolve(root, 'art-src/design-sheet.png')
const OUT = resolve(root, 'src/assets/art')
mkdirSync(OUT, { recursive: true })
for (const f of readdirSync(OUT)) if (f.endsWith('.webp')) unlinkSync(resolve(OUT, f))

const BASE_W = 1264
const SHEET = [245, 244, 240] // sheet background
const IVORY = [253, 246, 227] // #FDF6E3 page paper

// ── 0. denoise the sheet with ffmpeg (falls back to the raw sheet) ──
let input = SRC
try {
  const den = resolve(tmpdir(), 'wedding-sheet-denoised.png')
  execFileSync(process.env.FFMPEG ?? 'ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC, '-vf', 'nlmeans=s=1.6:p=5:r=11', den])
  input = den
  console.log('ffmpeg denoise ✓')
} catch {
  console.warn('ffmpeg not found (set FFMPEG=path) — skipping denoise')
}

const { data: RAW, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
// line art is taken from the untouched sheet: the denoiser smears hair-thin strokes
const { data: RAW_ORIG } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const K = info.width / BASE_W
const UPSCALE = Math.max(1, 3 / K) // aim for 3× the 1264-wide sheet
const k = (v) => Math.round(v * K)
const R = ([x, y, w, h]) => [k(x), k(y), k(w), k(h)]

function crop(l, t, w, h) {
  ;[l, t, w, h] = [k(l), k(t), k(w), k(h)]
  const d = new Float32Array(w * h * 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = ((t + y) * info.width + (l + x)) * 3
      const o = (y * w + x) * 4
      d[o] = RAW[s]
      d[o + 1] = RAW[s + 1]
      d[o + 2] = RAW[s + 2]
      d[o + 3] = 255
    }
  return { w, h, d, x0: l, y0: t }
}
/** Sheet-space rect → crop-local pixel rect. */
const local = (img, [x, y, w, h]) => [k(x) - img.x0, k(y) - img.y0, k(w), k(h)]

const dist = (d, i, c) => Math.hypot(d[i] - c[0], d[i + 1] - c[1], d[i + 2] - c[2])

/** Cut out the sheet background: flood from the crop border over paper-like pixels. */
function removeBackground(img, { tol = 22, step = 10, holes = 0 } = {}) {
  const { w, h, d } = img
  const mask = new Uint8Array(w * h)
  const stack = []
  const push = (x, y, from) => {
    const p = y * w + x
    if (mask[p]) return
    const i = p * 4
    if (dist(d, i, SHEET) > tol) return
    if (from >= 0 && dist(d, i, [d[from * 4], d[from * 4 + 1], d[from * 4 + 2]]) > step) return
    mask[p] = 1
    stack.push(p)
  }
  if (holes) for (let p = 0; p < w * h; p++) if (dist(d, p * 4, SHEET) < holes) mask[p] = 1
  for (let x = 0; x < w; x++) push(x, 0, -1), push(x, h - 1, -1)
  for (let y = 0; y < h; y++) push(0, y, -1), push(w - 1, y, -1)
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p / w) | 0
    if (x > 0) push(x - 1, y, p)
    if (x < w - 1) push(x + 1, y, p)
    if (y > 0) push(x, y - 1, p)
    if (y < h - 1) push(x, y + 1, p)
  }
  let m = Float32Array.from(mask)
  for (let pass = 0; pass < 2; pass++) {
    const n = new Float32Array(w * h)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0, c = 0
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy
            if (xx >= 0 && yy >= 0 && xx < w && yy < h) (s += m[yy * w + xx]), c++
          }
        n[y * w + x] = s / c
      }
    m = n
  }
  // pixels within a few px of the background: the clipart's white "sticker" halo
  let near = mask
  for (let r = 0; r < Math.max(3, k(4)); r++) {
    const n = Uint8Array.from(near)
    for (let p = 0; p < w * h; p++)
      if (!near[p]) {
        const x = p % w
        if ((x > 0 && near[p - 1]) || (x < w - 1 && near[p + 1]) || near[p - w] || near[p + w]) n[p] = 1
      }
    near = n
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    let a = 1 - (mask[p] ? 1 : m[p] * 0.95)
    let ref = SHEET
    if (!mask[p] && near[p]) {
      const lo = Math.min(d[i], d[i + 1], d[i + 2]), hi = Math.max(d[i], d[i + 1], d[i + 2])
      // pale, nearly neutral → halo: fade it out and decontaminate against white
      if (hi - lo < 40) {
        a = Math.min(a, Math.min(1, Math.max(0, (238 - lo) / 38)))
        ref = [255, 255, 252]
      }
    }
    d[i + 3] = Math.min(d[i + 3], a * 255)
    if (a > 0.02 && a < 1) for (let c = 0; c < 3; c++) d[i + c] = (d[i + c] - (1 - a) * ref[c]) / a
  }
}

function erase(img, rect) {
  const [rx, ry, rw, rh] = local(img, rect)
  for (let y = Math.max(0, ry); y < Math.min(img.h, ry + rh); y++)
    for (let x = Math.max(0, rx); x < Math.min(img.w, rx + rw); x++) img.d[(y * img.w + x) * 4 + 3] = 0
}

/** Ink on paper → alpha. */
function colorToAlpha(img, soft = 60, ink) {
  const { d } = img
  for (let i = 0; i < d.length; i += 4) {
    const a = Math.min(1, Math.max(0, (dist(d, i, SHEET) - 7) / soft))
    d[i + 3] = a * 255
    if (ink) for (let c = 0; c < 3; c++) d[i + c] = ink[c]
    else if (a > 0.02) for (let c = 0; c < 3; c++) d[i + c] = (d[i + c] - (1 - a) * SHEET[c]) / a
  }
}

/**
 * Grade to the palette: sheet grey → ivory white balance, purple pushed a touch
 * toward deep lavender (#4B0082 family), brass warmed toward golden bronze (#B8860B).
 */
function grade(img, { sat = 1.14, contrast = 1.06 } = {}) {
  const gain = IVORY.map((c, i) => c / SHEET[i])
  const { d } = img
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * gain[0], g = d[i + 1] * gain[1], b = d[i + 2] * gain[2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    r = l + (r - l) * sat
    g = l + (g - l) * sat
    b = l + (b - l) * sat
    // purple tones (blue ≥ green, red ≥ green): deepen slightly toward violet
    if (b > g && r > g) {
      const t = Math.min(1, (b - g) / 50)
      r -= (r - l) * t * 0.35 + t * 6
      g -= t * 4
      b += t * 4
    }
    // warm brass (red > green > blue): richer, more bronze
    if (r > g && g > b && r - b > 30) {
      const t = Math.min(1, (r - b) / 90) * 0.15
      b -= b * t
      g -= g * t * 0.25
    }
    r = 240 + (r - 240) * contrast
    g = 240 + (g - 240) * contrast
    b = 240 + (b - 240) * contrast
    d[i] = r
    d[i + 1] = g
    d[i + 2] = b
  }
}

function sub(img, x, y, w, h) {
  const out = { w, h, d: new Float32Array(w * h * 4), x0: img.x0 + x, y0: img.y0 + y }
  for (let yy = 0; yy < h; yy++) out.d.set(img.d.subarray(((y + yy) * img.w + x) * 4, ((y + yy) * img.w + x + w) * 4), yy * w * 4)
  return out
}

/** Repeat period along an axis by autocorrelation (pixels of this sheet). */
function period(img, axis, min, max) {
  const { w, h, d } = img
  const lum = (x, y) => {
    const i = (y * w + x) * 4
    return d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
  }
  let best = min, bestErr = Infinity
  const len = axis === 'x' ? w : h
  for (let p = k(min); p <= k(max); p++) {
    let err = 0, n = 0
    for (let a = 0; a + p < len; a++)
      for (let b = 0; b < (axis === 'x' ? h : w); b += 2) {
        err += Math.abs(axis === 'x' ? lum(a, b) - lum(a + p, b) : lum(b, a) - lum(b, a + p))
        n++
      }
    if (err / n < bestErr) (bestErr = err / n), (best = p)
  }
  return best
}

const manifest = {}
async function save(name, img, { quality = 84, lineArt = false, rotate = 0, scale = UPSCALE } = {}) {
  const W = Math.round(img.w * scale), H = Math.round(img.h * scale)
  const raw = Buffer.from(Uint8ClampedArray.from(img.d))
  let buf = await sharp(raw, { raw: { width: img.w, height: img.h, channels: 4 } })
    .resize(W, H, { kernel: 'lanczos3' })
    .sharpen({ sigma: 1.1, m1: 0.6, m2: 2.2 })
    .raw()
    .toBuffer()
  if (lineArt) {
    // smooth the upscaled alpha (kills the stair-stepping of the small source)…
    const blurred = await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).extractChannel(3).blur(0.75).raw().toBuffer()
    for (let j = 0; j < blurred.length; j++) buf[j * 4 + 3] = blurred[j]
    // …then re-sharpen the alpha with a smooth contrast curve: crisp, vector-like strokes
    for (let i = 3; i < buf.length; i += 4) {
      const a = buf[i] / 255
      const t = Math.min(1, Math.max(0, (a - 0.32) / 0.45))
      buf[i] = Math.round(t * t * (3 - 2 * t) * 255)
    }
  }
  let p = sharp(buf, { raw: { width: W, height: H, channels: 4 } })
  if (rotate) p = sharp(await p.png().toBuffer()).rotate(rotate)
  const out = await p.webp({ quality, alphaQuality: 92, effort: 6, smartSubsample: true }).toFile(resolve(OUT, `${name}.webp`))
  manifest[name] = { w: out.width, h: out.height }
  console.log(`  ${(name + '.webp').padEnd(24)} ${out.width}×${out.height}  ${(out.size / 1024).toFixed(1)} KB`)
}

/** Standard cut-out asset. */
async function cutout(name, rect, { erases = [], holes = 0, tol, opts } = {}) {
  const img = crop(...rect)
  removeBackground(img, { holes, tol })
  erases.forEach((r) => erase(img, r))
  grade(img)
  await save(name, img, opts)
}

console.log(`Extracting artwork from ${SRC} (${info.width}×${info.height}, ${UPSCALE.toFixed(2)}× output)`)

// 1. Arched invitation frame → top / repeating middle / bottom slices.
//    The cut rows are chosen where the side borders match best, so the
//    repeated middle joins itself and both neighbours without a visible seam.
{
  const img = crop(18, 22, 282, 426)
  grade(img)
  const borderCols = []
  for (let x = 0; x < k(34); x++) borderCols.push(x, img.w - 1 - x)
  const rowDiff = (r1, r2) => {
    let e = 0
    for (const x of borderCols) {
      const i = (r1 * img.w + x) * 4, j = (r2 * img.w + x) * 4
      for (let c = 0; c < 3; c++) e += Math.abs(img.d[i + c] - img.d[j + c])
    }
    // compare a 3-row neighbourhood so the pattern phase matches, not just one row
    return e
  }
  const band = (r1, r2) => rowDiff(r1, r2) + rowDiff(r1 + 1, r2 + 1) + rowDiff(r1 - 1, r2 - 1)
  let best = { e: Infinity, top: 0, h: 0 }
  for (let top = k(165); top <= k(190); top++)
    for (let h = k(40); h <= k(80); h++) {
      const e = band(top, top + h)
      if (e < best.e) best = { e, top, h }
    }
  let bot = { e: Infinity, y: 0 }
  for (let y = k(232); y <= k(262); y++) {
    const e = band(best.top, y)
    if (e < bot.e) bot = { e, y }
  }
  console.log(`  frame: top 0–${best.top}, mid ${best.h}px, bottom from ${bot.y}`)
  await save('frame-top', sub(img, 0, 0, img.w, best.top), { quality: 86 })
  await save('frame-mid', sub(img, 0, best.top, img.w, best.h), { quality: 86 })
  await save('frame-bottom', sub(img, 0, bot.y, img.w, img.h - bot.y), { quality: 86 })
}

// 2. Mosque at dusk (the hanging lanterns + florals of the corner piece erased)
await cutout('mosque', [860, 40, 402, 262], {
  erases: [
    [1140, 0, 130, 136],
    [1182, 136, 90, 64],
  ],
})

// 3. Floral corner with two hanging lanterns (mosque roofs erased)
await cutout('corner-lanterns', [1072, 0, 192, 194], {
  holes: 10,
  erases: [
    [1072, 128, 80, 70],
    [1150, 134, 31, 64],
    [1072, 60, 70, 70],
  ],
})

// 4. Lanterns
await cutout('lantern-chain', [814, 26, 46, 194])
await cutout('lantern-hex', [837, 298, 49, 106])
await cutout('lantern-globe', [985, 336, 54, 104])
await cutout('lantern-grand', [1170, 303, 66, 141])
await cutout('lantern-small', [1076, 318, 61, 127])

// 5. Florals
await cutout('floral-spray', [320, 457, 196, 121], { holes: 9 })
await cutout('floral-arc', [520, 457, 205, 132], { holes: 9 })
await cutout('floral-sprig', [324, 387, 175, 61], { holes: 9 })
await cutout('floral-corner-a', [19, 459, 96, 101], { holes: 9 })
await cutout('floral-corner-b', [213, 543, 90, 90], { holes: 9 })
await cutout('flower-a', [519, 591, 60, 82], { holes: 9 })
await cutout('flower-b', [588, 587, 54, 86], { holes: 9 })
await cutout('flower-c', [786, 597, 62, 113], { holes: 9 })

// 6. Cusped frame with florals, Save-the-Date seal, hands
await cutout('cusp-frame', [320, 24, 185, 231])
await cutout('seal-save-date', [731, 460, 107, 107])
await cutout('hands', [1074, 702, 161, 120], { holes: 9 })

// 7. Ornamental dividers: thin-stroke line art.
//    Alpha comes from how much darker than the paper each pixel is (keeps the
//    original stroke weight), colour is a flat deep-lavender ink, 4× Lanczos.
for (const [name, rect] of [
  ['divider-1', [521, 26, 250, 40]],
  ['divider-2', [549, 152, 193, 39]],
  ['divider-3', [521, 119, 250, 24]],
  ['divider-4', [521, 330, 192, 32]],
  ['divider-5', [331, 330, 156, 30]],
]) {
  const [l, t, w, h] = R(rect)
  const out = Buffer.alloc(w * h * 4)
  const bgL = 0.299 * SHEET[0] + 0.587 * SHEET[1] + 0.114 * SHEET[2]
  const INK = [84, 36, 132]
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s3 = ((t + y) * info.width + (l + x)) * 3
      const L = 0.299 * RAW_ORIG[s3] + 0.587 * RAW_ORIG[s3 + 1] + 0.114 * RAW_ORIG[s3 + 2]
      let a = Math.min(1, Math.max(0, (bgL - L - 6) / 105))
      a = Math.pow(a, 0.8)
      const o = (y * w + x) * 4
      out[o] = INK[0]
      out[o + 1] = INK[1]
      out[o + 2] = INK[2]
      out[o + 3] = Math.round(a * 255)
    }
  const S4 = Math.max(1, 4 / K)
  const W2 = Math.round(w * S4), H2 = Math.round(h * S4)
  const buf = await sharp(out, { raw: { width: w, height: h, channels: 4 } }).resize(W2, H2, { kernel: 'lanczos3' }).raw().toBuffer()
  // gentle contrast on the alpha: firmer edges without thickening the stroke
  for (let i = 3; i < buf.length; i += 4) {
    const a = buf[i] / 255
    const u = Math.min(1, Math.max(0, (a - 0.06) / 0.8))
    buf[i] = Math.round(u * u * (3 - 2 * u) * 255)
  }
  const file = await sharp(buf, { raw: { width: W2, height: H2, channels: 4 } })
    .trim({ threshold: 1 })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(resolve(OUT, `${name}.webp`))
  manifest[name] = { w: file.width, h: file.height }
  console.log(`  ${(name + '.webp').padEnd(24)} ${file.width}×${file.height}  ${(file.size / 1024).toFixed(1)} KB`)
}

// 8. Lattice bands → seamless tiles
{
  const strip = crop(19, 646, 296, 40)
  const p = period(sub(strip, k(10), 0, k(200), strip.h), 'x', 15, 60)
  const n = Math.max(2, Math.round(k(110) / p))
  console.log(`  band-x period ${p}px × ${n}`)
  const img = sub(strip, k(40), 0, p * n, strip.h)
  colorToAlpha(img, 40)
  grade(img)
  await save('band-x', img)
}
{
  const strip = crop(383, 600, 46, 218)
  const p = period(sub(strip, 0, k(10), strip.w, k(190)), 'y', 15, 70)
  const n = Math.max(2, Math.round(k(110) / p))
  console.log(`  band-y period ${p}px × ${n}`)
  const img = sub(strip, 0, k(20), strip.w, p * n)
  colorToAlpha(img, 40)
  grade(img)
  await save('band-y', img)
}

// 9. Geometric tile (envelope liner) — mirrored 2×2 so it tiles seamlessly
{
  const img = crop(519, 688, 178, 128)
  grade(img)
  const raw = Buffer.from(Uint8ClampedArray.from(img.d))
  const base = sharp(raw, { raw: { width: img.w, height: img.h, channels: 4 } })
  const a = await base.clone().png().toBuffer()
  const b = await base.clone().flop().png().toBuffer()
  const c = await base.clone().flip().png().toBuffer()
  const dd = await base.clone().flip().flop().png().toBuffer()
  const tile = await sharp({ create: { width: img.w * 2, height: img.h * 2, channels: 4, background: '#fff' } })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: img.w, top: 0 },
      { input: c, left: 0, top: img.h },
      { input: dd, left: img.w, top: img.h },
    ])
    .raw()
    .toBuffer()
  await save('tile', { w: img.w * 2, h: img.h * 2, d: Float32Array.from(tile) }, { quality: 72, scale: Math.max(1, 2 / K) })
}

writeFileSync(
  resolve(OUT, 'manifest.ts'),
  `// Generated by scripts/extract-art.mjs — do not edit.\nexport const ART_SIZES = ${JSON.stringify(manifest, null, 2)} as const\n\nexport type ArtName = keyof typeof ART_SIZES\n`,
)
console.log('Done.')
