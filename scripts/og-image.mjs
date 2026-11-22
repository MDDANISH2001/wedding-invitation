/**
 * The link-preview image WhatsApp (and others) show before the invite is
 * even opened: public/og.jpg, 1200×630, in the current VITE_THEME.
 * Runs before every build; names and dates come from src/config/wedding.ts.
 *
 *   node scripts/og-image.mjs
 */
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { loadEnv } from 'vite'

const env = loadEnv(process.env.NODE_ENV === 'development' ? 'development' : 'production', process.cwd(), 'VITE_')
const THEMES = ['classic', 'midnight', 'rose', 'letterpress', 'noor']
const theme = THEMES.includes((env.VITE_THEME ?? '').trim().toLowerCase()) ? env.VITE_THEME.trim().toLowerCase() : 'classic'

const STYLE = {
  classic: { bg: ['#f1effb', '#d3c6ee'], ink: '#4b0082', sub: '#5e3b67', gold: '#9a6c06', art: 'src/assets/art/floral-spray.webp' },
  midnight: { bg: ['#1d2457', '#05071a'], ink: '#fbe7b5', sub: '#e6dcc6', gold: '#f0cd72', art: 'src/assets/themes/midnight/spray.webp' },
  rose: { bg: ['#fff8ef', '#f6e2d6'], ink: '#7a0f2e', sub: '#5b1a26', gold: '#a8690a', art: 'src/assets/themes/rose/spray.webp' },
  letterpress: { bg: ['#fbf8f1', '#ece4d3'], ink: '#1b1e2e', sub: '#2f3140', gold: '#8a6820', art: 'src/assets/themes/letterpress/spray.webp' },
  // noor: the baked lamp-lit room (scripts/noor-art.mjs) instead of florals
  noor: { bg: ['#3b2110', '#080302'], ink: '#f8dc98', sub: '#f6e7c6', gold: '#e3b55a', photo: 'src/assets/noor/bg-wide.webp' },
}[theme]

// names + dates straight from the content file
const src = readFileSync('src/config/wedding.ts', 'utf8')
const nameOf = (who) => src.match(new RegExp(`${who}:\\s*\\{[^}]*?name:\\s*"([^"]+)"`, 's'))?.[1] ?? who
const groom = nameOf('groom')
const bride = nameOf('bride')
// `node og-image.mjs walima` makes the Walima page's thumbnail (public/og-walima.jpg)
const VIEW = process.argv[2] === 'walima' ? 'walima' : 'all'
const OUT = VIEW === 'walima' ? 'public/og-walima.jpg' : 'public/og.jpg'
const LABEL = VIEW === 'walima' ? 'THE DAWAT-E-WALIMA OF' : 'THE NIKAH OF'
const events = [...src.matchAll(/id:\s*"(\w+)"[\s\S]*?start:\s*"(\d{4}-\d{2}-\d{2})T[\s\S]*?hijri:\s*"([^"]*)"/g)]
  .map((m) => ({ id: m[1], date: new Date(`${m[2]}T12:00:00`), hijri: m[3] }))
  .filter((e) => VIEW === 'all' || e.id === 'walima')
const dates = events.map((e) => e.date)
const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const dateLine =
  dates.length > 1 && dates[0].getMonth() === dates[1].getMonth()
    ? `${dates[0].getDate()} & ${fmt(dates[1])}`
    : dates.map(fmt).join(' · ')

const F = 'art-src/fonts'
const text = (t, font, fontfile, color, width = 1100) =>
  sharp({ text: { text: `<span foreground="${color}">${t.replace(/&(?!amp;)/g, "&amp;")}</span>`, font, fontfile, rgba: true, width, align: 'centre', dpi: 72 } })
    .png()
    .toBuffer()

const W = 1200
const H = 630
const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${STYLE.bg[0]}"/><stop offset="1" stop-color="${STYLE.bg[1]}"/></radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${STYLE.gold}" stroke-width="4"/>
    <rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${STYLE.gold}" stroke-width="1.5"/>
  </svg>`,
)

// ── noor: its own composition ──────────────────────────────────────────
// the lamp-lit room, the couple's Taj Mahal in a gold-rimmed arch, and raised
// gold lettering (a white text mask filled with a gold ramp, a dark bevel edge
// underneath, a soft glow behind)
if (theme === 'noor') {
  const hijri = events.map((e) => e.hijri.match(/^(\d+)\s+(.+)\s+(\d{4})$/)).filter(Boolean)
  const hijriLine =
    hijri.length > 1 && hijri[0][2] === hijri[1][2] ? `${hijri[0][1]} & ${hijri[1][1]} ${hijri[0][2]} ${hijri[0][3]}` : hijri.map((h) => h[0]).join(' · ')

  const mask = (t, font, fontfile, spacing = 0) =>
    sharp({ text: { text: `<span foreground="#ffffff"${spacing ? ` letter_spacing="${Math.round(spacing * 1024)}"` : ''}>${t.replace(/&(?!amp;)/g, '&amp;')}</span>`, font, fontfile, rgba: true, align: 'centre', dpi: 72 } })
      .png()
      .toBuffer()
      // trim to the ink, so lines can be stacked by what is actually drawn
      .then((b) => sharp(b).trim().png().toBuffer())
  const tint = async (m, color) => {
    const { width, height } = await sharp(m).metadata()
    return sharp({ create: { width, height, channels: 4, background: color } }).composite([{ input: m, blend: 'dest-in' }]).png().toBuffer()
  }
  /** raised gold: bevel edge + glow + gold ramp */
  const gold = async (t, font, fontfile, spacing) => {
    const m = await mask(t, font, fontfile, spacing)
    const { width, height } = await sharp(m).metadata()
    const pad = 24
    const ramp = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6da"/><stop offset=".3" stop-color="#f8dc98"/><stop offset=".5" stop-color="#d9a24c"/><stop offset=".56" stop-color="#9a6420"/><stop offset=".7" stop-color="#ecc070"/><stop offset="1" stop-color="#b7802f"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`))
      .composite([{ input: m, blend: 'dest-in' }])
      .png()
      .toBuffer()
    const edge = await tint(m, '#2a1404')
    const glow = await sharp(await tint(m, '#ffb84a')).extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#0000' }).blur(10).toBuffer()
    return sharp({ create: { width: width + pad * 2, height: height + pad * 2, channels: 4, background: '#0000' } })
      .composite([
        { input: glow, blend: 'over' },
        { input: edge, left: pad, top: pad + 2 },
        { input: ramp, left: pad, top: pad },
      ])
      .png()
      .toBuffer()
  }
  const soft = (t, font, fontfile, color, spacing) => mask(t, font, fontfile, spacing).then((m) => tint(m, color))

  const out = []
  const put = async (buf, top, dx = 0) => {
    const m = await sharp(buf).metadata()
    out.push({ input: buf, top: Math.round(top), left: Math.round((W - m.width) / 2 + dx) })
    return m
  }

  const room = await sharp('src/assets/noor/bg-wide.webp').resize(W, H, { fit: 'cover' }).modulate({ brightness: 0.7 }).png().toBuffer()
  out.push({ input: room, top: 0, left: 0 })
  out.push({
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="v" cx="50%" cy="45%" r="75%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient></defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#0b0604" stop-opacity="0"/><stop offset=".62" stop-color="#0b0604" stop-opacity=".72"/><stop offset="1" stop-color="#0b0604" stop-opacity=".8"/></linearGradient><rect width="100%" height="100%" fill="url(#v)"/><rect width="100%" height="100%" fill="url(#d)"/>
      <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="#e3b55a" stroke-width="3"/>
      <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#e3b55a" stroke-opacity=".6" stroke-width="1.2"/></svg>`),
    top: 0,
    left: 0,
  })

  const PAD = 24 // the glow margin gold() adds around the ink
  await put(await gold('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ', 'Aref Ruqaa Bold 40', `${F}/ArefRuqaa-Bold.ttf`), 40 - PAD)
  const TAJ_TOP = 96
  const TAJ_H = 290
  await put(await sharp('src/assets/noor/taj-window.webp').resize({ height: TAJ_H }).png().toBuffer(), TAJ_TOP)
  let y = TAJ_TOP + TAJ_H - 22
  y += (await put(await soft(LABEL, 'Cinzel 19', `${F}/Cinzel[wght].ttf`, '#f3e3c0', 6), y)).height + 16
  // names in the script face; the "&" in Cormorant (the script's ampersand reads like an "l")
  {
    const parts = [
      await gold(groom, 'Pinyon Script 84', `${F}/PinyonScript-Regular.ttf`),
      await gold('&amp;', 'Cormorant Garamond Italic 60', `${F}/CormorantGaramond-Italic[wght].ttf`),
      await gold(bride, 'Pinyon Script 84', `${F}/PinyonScript-Regular.ttf`),
    ]
    const metas = await Promise.all(parts.map((p) => sharp(p).metadata()))
    const gap = -2 * PAD + 26
    const rowW = metas.reduce((a, m) => a + m.width, 0) + gap * (parts.length - 1)
    const rowH = Math.max(...metas.map((m) => m.height))
    let x = Math.round((W - rowW) / 2)
    parts.forEach((p, i) => {
      // the "&" sits a little low in the script's line, like a joining word
      const dy = i === 1 ? Math.round((rowH - metas[i].height) / 2 + 4) : rowH - metas[i].height
      out.push({ input: p, left: x, top: Math.round(y - PAD + dy) })
      x += metas[i].width + gap
    })
    y += rowH - 2 * PAD + 18
  }
  y += (await put(await gold(dateLine.toUpperCase(), 'Cinzel Decorative Bold 28', `${F}/CinzelDecorative-Bold.ttf`, 1.5), y - PAD)).height - 2 * PAD + 12
  if (hijriLine) await put(await soft(hijriLine, 'Cormorant Garamond Italic 25', `${F}/CormorantGaramond-Italic[wght].ttf`, '#f3e3c0'), y)

  await sharp({ create: { width: W, height: H, channels: 3, background: '#0b0604' } })
    .composite(out)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(OUT)
  console.log(`${OUT} (noor): ${groom} & ${bride}, ${dateLine}, ${hijriLine}`)
  process.exit(0)
}

const layers = []
const place = async (buf, top) => {
  const m = await sharp(buf).metadata()
  layers.push({ input: buf, top: Math.round(top), left: Math.round((W - m.width) / 2) })
  return m.height
}

if (STYLE.photo) {
  const photo = await sharp(STYLE.photo).resize(W, H, { fit: 'cover', position: 'bottom' }).modulate({ brightness: 0.8 }).png().toBuffer()
  layers.push({ input: photo, top: 0, left: 0 })
  // darken the top half a little more, where the words go
  layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset=".6" stop-color="#000" stop-opacity="0.38"/><stop offset="1" stop-color="#000" stop-opacity="0.38"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#t)"/><rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${STYLE.gold}" stroke-width="4"/><rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${STYLE.gold}" stroke-width="1.5"/></svg>`), top: 0, left: 0 })
} else {
  const art = await sharp(STYLE.art).resize({ width: 620 }).png().toBuffer()
  const artH = (await sharp(art).metadata()).height
  layers.push({ input: art, left: Math.round((W - 620) / 2), top: H - artH + 40 > H ? H - artH : H - artH + 30 })
}

let y = 58
y += await place(await text('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْم', 'Amiri Bold 40', `${F}/Amiri-Bold.ttf`, STYLE.gold), y)
y += 6
y += await place(await text(LABEL, 'Cormorant Garamond Bold 26', `${F}/CormorantGaramond[wght].ttf`, STYLE.sub), y)
y -= 4
y += await place(await text(`${groom} &amp; ${bride}`, 'Great Vibes 118', `${F}/GreatVibes-Regular.ttf`, STYLE.ink), y)
y += 2
await place(await text(dateLine, 'Cormorant Garamond Bold Italic 40', `${F}/CormorantGaramond-Italic[wght].ttf`, STYLE.ink), y)

await sharp(bg).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT)
console.log(`${OUT} (${theme}): ${groom} & ${bride}, ${dateLine}`)
