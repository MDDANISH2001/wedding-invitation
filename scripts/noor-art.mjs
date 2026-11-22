/**
 * Bakes the noor theme's scenery once, at build time, so phones only move
 * finished pictures around (no runtime blur, no WebGL):
 *
 *   bg.webp       portrait room: lamp glow, mihrab niche, the open Qur'an on
 *                 its rehal (out of focus), bokeh, vignette
 *   bg-wide.webp  the same for landscape screens
 *   rays.webp     light shafts from the lamp (alpha), faded in and out live
 *   dust.webp     a seamless tile of gold motes, drifted live
 *   bokeh.webp    one soft bokeh disc, floated live
 *
 * Photo: "Qur'an and Rehal" by Sayyed Shahab-o-Din Vajedi, CC BY 4.0
 * (Wikimedia Commons), in art-src/photos/rehal.jpg.
 *
 *   node scripts/noor-art.mjs
 */
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const OUT = 'src/assets/noor'
mkdirSync(OUT, { recursive: true })

// deterministic randomness so rebuilds give the same picture
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)

/** soft bokeh circles, mostly near the edges and the lower part */
function bokehSvg(W, H, n, { minR, maxR, yBias }) {
  const colors = ['#ffd27a', '#ffbf5a', '#ffe3a8', '#f2a03c', '#ff9d4a', '#ffc46b']
  let defs = ''
  let body = ''
  for (let i = 0; i < n; i++) {
    const r = minR + (maxR - minR) * rnd() ** 1.6
    const side = rnd()
    const x = side < 0.38 ? rnd() * W * 0.28 : side < 0.76 ? W - rnd() * W * 0.28 : rnd() * W
    const y = H * (yBias + (1 - yBias) * rnd() ** 0.8) * (rnd() < 0.25 ? 0.4 : 1)
    const c = colors[Math.floor(rnd() * colors.length)]
    const a = 0.18 + rnd() * 0.42
    defs += `<radialGradient id="b${i}"><stop offset="0" stop-color="${c}" stop-opacity="${a * 0.75}"/><stop offset=".78" stop-color="${c}" stop-opacity="${a * 0.85}"/><stop offset=".92" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#b${i})"/>`
  }
  return svg(W, H, `<defs>${defs}</defs>${body}`)
}

/** pointed mihrab niche, very soft, gives the room depth */
function nicheSvg(W, H, cx, top, w) {
  const l = cx - w / 2
  const r = cx + w / 2
  const spring = top + w * 0.62
  const d = `M${l} ${H} L${l} ${spring} Q${l} ${top + w * 0.18} ${cx} ${top} Q${r} ${top + w * 0.18} ${r} ${spring} L${r} ${H} Z`
  return svg(
    W,
    H,
    `<defs><linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a26" stop-opacity=".22"/><stop offset=".6" stop-color="#4a2a10" stop-opacity=".14"/><stop offset="1" stop-color="#1a0c05" stop-opacity="0"/></linearGradient></defs>
     <path d="${d}" fill="url(#n)"/>
     <path d="${d}" fill="none" stroke="#c99447" stroke-opacity=".2" stroke-width="${w * 0.018}"/>`,
  )
}

async function room(W, H, { photoW, photoTop, nicheW }) {
  const base = svg(
    W,
    H,
    `<defs>
      <radialGradient id="room" cx="50%" cy="58%" r="75%"><stop offset="0" stop-color="#3b2110"/><stop offset=".55" stop-color="#1c0e06"/><stop offset="1" stop-color="#080302"/></radialGradient>
      <radialGradient id="lamp" cx="38%" cy="4%" r="60%"><stop offset="0" stop-color="#c78a3c" stop-opacity=".75"/><stop offset=".45" stop-color="#7a4a1c" stop-opacity=".3"/><stop offset="1" stop-color="#7a4a1c" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#room)"/>
    <rect width="100%" height="100%" fill="url(#lamp)"/>`,
  )

  const niche = await sharp(nicheSvg(W, H, W / 2, H * 0.1, nicheW)).blur(W * 0.03).png().toBuffer()

  // the Qur'an: warm-graded, out of focus, lit from above (photo background is black → screen blend)
  const photo = await sharp('art-src/photos/rehal.jpg')
    .resize({ width: photoW })
    .modulate({ brightness: 0.66, saturation: 0.7 })
    .recomb([
      [1.08, 0.12, 0],
      [0.06, 0.92, 0.02],
      [0, 0.1, 0.62],
    ])
    .blur(W * 0.011)
    .toBuffer()
  const pm = await sharp(photo).metadata()
  // crop the (possibly wider than the screen) photo to what lands on the canvas
  const cropX = Math.max(0, Math.round((pm.width - W) / 2))
  const top = Math.round(photoTop)
  const visible = await sharp(photo)
    .extract({ left: cropX, top: 0, width: Math.min(W, pm.width), height: Math.min(pm.height, H - top) })
    .toBuffer()
  const photoLayer = await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite([{ input: visible, left: Math.max(0, Math.round((W - pm.width) / 2)), top }])
    .png()
    .toBuffer()

  const bokehBig = await sharp(bokehSvg(W, H, 46, { minR: W * 0.012, maxR: W * 0.075, yBias: 0.45 })).blur(W * 0.004).png().toBuffer()
  const bokehFar = await sharp(bokehSvg(W, H, 60, { minR: W * 0.004, maxR: W * 0.016, yBias: 0.15 })).blur(1.2).png().toBuffer()

  const vignette = svg(
    W,
    H,
    `<defs><radialGradient id="v" cx="50%" cy="48%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>
     <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".25" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
     <rect width="100%" height="100%" fill="url(#v)"/><rect width="100%" height="100%" fill="url(#t)"/>`,
  )

  return sharp(base)
    .composite([
      { input: niche },
      { input: photoLayer, blend: 'screen' },
      { input: bokehFar, blend: 'screen' },
      { input: bokehBig, blend: 'screen' },
      { input: vignette },
    ])
    .png()
    .toBuffer()
}

// ── backgrounds ─────────────────────────────────────────────────────────
{
  const W = 900
  const H = 1600
  const png = await room(W, H, { photoW: 1180, photoTop: H * 0.6, nicheW: W * 0.7 })
  await sharp(png).webp({ quality: 78, effort: 6 }).toFile(`${OUT}/bg.webp`)
}
{
  const W = 1600
  const H = 900
  const png = await room(W, H, { photoW: 1000, photoTop: H * 0.42, nicheW: W * 0.32 })
  await sharp(png).webp({ quality: 78, effort: 6 }).toFile(`${OUT}/bg-wide.webp`)
}

// ── light shafts (alpha) ────────────────────────────────────────────────
{
  const W = 900
  const H = 1600
  const ox = W * 0.42
  const oy = -H * 0.08
  let beams = ''
  const spec = [
    [-0.42, 0.05, 0.22],
    [-0.22, 0.035, 0.32],
    [-0.05, 0.05, 0.4],
    [0.1, 0.03, 0.3],
    [0.26, 0.045, 0.24],
    [0.45, 0.03, 0.16],
  ]
  for (const [ang, spread, a] of spec) {
    const len = H * 1.15
    const p = (t) => [ox + Math.sin(t) * len, oy + Math.cos(t) * len]
    const [x1, y1] = p(ang - spread)
    const [x2, y2] = p(ang + spread)
    beams += `<polygon points="${ox},${oy} ${x1.toFixed(0)},${y1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)}" fill="url(#ray)" opacity="${a}"/>`
  }
  const raysSvg = svg(
    W,
    H,
    `<defs><linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a6"/><stop offset=".45" stop-color="#ffcf7a" stop-opacity=".5"/><stop offset=".85" stop-color="#ffcf7a" stop-opacity="0"/></linearGradient></defs>${beams}`,
  )
  // soft by nature: stored at half size, the browser scales it up
  await sharp(raysSvg).blur(18).resize(W / 2).webp({ quality: 70, alphaQuality: 60 }).toFile(`${OUT}/rays.webp`)
}

// ── dust tile (seamless: motes near an edge are drawn on both sides) ─────
{
  const S = 512
  let dots = ''
  for (let i = 0; i < 90; i++) {
    const x = rnd() * S
    const y = rnd() * S
    const r = 0.5 + rnd() ** 3 * 2.2
    const a = 0.25 + rnd() * 0.7
    const c = rnd() < 0.7 ? '#ffd98a' : '#fff6dc'
    for (const dx of [-S, 0, S])
      for (const dy of [-S, 0, S]) dots += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${r.toFixed(2)}" fill="${c}" fill-opacity="${a.toFixed(2)}"/>`
  }
  await sharp(svg(S, S, dots)).blur(0.5).webp({ quality: 80, alphaQuality: 90 }).toFile(`${OUT}/dust.webp`)
}

// ── a single bokeh disc ─────────────────────────────────────────────────
{
  const S = 128
  await sharp(
    svg(
      S,
      S,
      `<defs><radialGradient id="d"><stop offset="0" stop-color="#ffd890" stop-opacity=".55"/><stop offset=".75" stop-color="#ffd890" stop-opacity=".7"/><stop offset=".9" stop-color="#fff0c8" stop-opacity=".9"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient></defs><circle cx="64" cy="64" r="62" fill="url(#d)"/>`,
    ),
  )
    .blur(1.5)
    .webp({ quality: 80, alphaQuality: 90 })
    .toFile(`${OUT}/bokeh.webp`)
}

// ── the Taj window (art-src/goldnoor.png, supplied by the couple) ───────
// Cropped symmetrically around the Taj (which also drops the generator's
// sparkle mark at the bottom right), cut into a pointed Mughal arch with a
// gold rim, and faded out at the bottom so it melts into the room.
{
  const W = 1000
  const H = 700
  const photo = await sharp('art-src/goldnoor.png')
    .removeAlpha()
    .extract({ left: 150, top: 30, width: 1076, height: 738 })
    .resize(W, H)
    .modulate({ brightness: 1.04, saturation: 1.05 })
    .toBuffer()
  const arch = `M14 ${H} L14 330 C14 170 250 70 ${W / 2} 10 C${W - 250} 70 ${W - 14} 170 ${W - 14} 330 L${W - 14} ${H}`
  const mask = svg(
    W,
    H,
    `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
     <path d="${arch} Z" fill="url(#f)"/>`,
  )
  const alpha = await sharp(mask).blur(3).extractChannel('alpha').toBuffer()
  const cut = await sharp(photo).joinChannel(alpha).png().toBuffer()
  const rim = svg(
    W,
    H,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c6"/><stop offset=".35" stop-color="#e9bd68"/><stop offset=".75" stop-color="#b98431" stop-opacity=".8"/><stop offset=".95" stop-color="#b98431" stop-opacity="0"/></linearGradient></defs>
     <path d="${arch}" fill="none" stroke="url(#g)" stroke-width="7"/>
     <path d="${arch}" fill="none" stroke="#2a1606" stroke-opacity=".55" stroke-width="2" transform="translate(${W / 2} ${H * 0.022}) scale(.964) translate(${-W / 2} 0)"/>
     <path d="${arch}" fill="none" stroke="url(#g)" stroke-width="2" transform="translate(${W / 2} ${H * 0.03}) scale(.956) translate(${-W / 2} 0)"/>`,
  )
  await sharp(cut)
    .composite([{ input: rim }])
    .webp({ quality: 82, alphaQuality: 85, effort: 6 })
    .toFile(`${OUT}/taj-window.webp`)
}

console.log('noor art written to', OUT)
