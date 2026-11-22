/**
 * Cuts a botanical illustration out of its paper background.
 *
 * The paper colour is sampled from the sheet's margins; each pixel's alpha
 * follows its colour distance from the paper (soft edge), small specks of
 * foxing are dropped by a connected-component pass, and the paper tint is
 * removed from the semi-transparent edge pixels so the cut-out sits cleanly
 * on any background.
 */
import sharp from 'sharp'

/** sRGB 0–255 → CIE Lab */
function lab(r, g, b) {
  const f = (c) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const R = f(r)
  const G = f(g)
  const B = f(b)
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const h = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z))]
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * @param {string} file source image
 * @param {{ crop?: [number, number, number, number], maxSide?: number, t0?: number, t1?: number, keep?: number }} o
 *   crop = [left, top, right, bottom] as fractions; t0/t1 = colour-distance ramp; keep = min component size vs largest
 * @returns {Promise<{ data: Buffer, width: number, height: number }>} RGBA, trimmed
 */
export async function cutout(file, o = {}) {
  const { crop = [0.02, 0.02, 0.98, 0.86], maxSide = 2000, t0 = 16, t1 = 46, chroma = 1.6, keep = 0.004, holes = 0 } = o
  const meta = await sharp(file).metadata()
  const left = Math.round(meta.width * crop[0])
  const top = Math.round(meta.height * crop[1])
  const width = Math.round(meta.width * (crop[2] - crop[0]))
  const height = Math.round(meta.height * (crop[3] - crop[1]))
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const W = Math.round(width * scale)
  const H = Math.round(height * scale)
  const { data } = await sharp(file)
    .extract({ left, top, width, height })
    .resize(W, H)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // paper colour = per-channel median of a frame of pixels around the edge
  const samples = [[], [], []]
  const m = Math.round(Math.min(W, H) * 0.03)
  for (let y = 0; y < H; y += 3)
    for (let x = 0; x < W; x += 3) {
      if (x > m && x < W - m && y > m && y < H - m) continue
      const i = (y * W + x) * 3
      for (let c = 0; c < 3; c++) samples[c].push(data[i + c])
    }
  const paper = samples.map((s) => s.sort((a, b) => a - b)[s.length >> 1])
  const P = lab(...paper)

  const out = Buffer.alloc(W * H * 4)
  const alpha = new Float32Array(W * H)
  for (let p = 0; p < W * H; p++) {
    const i = p * 3
    const dr = data[i] - paper[0]
    const dg = data[i + 1] - paper[1]
    const db = data[i + 2] - paper[2]
    // plain colour distance, or (for pale petals) the hue/chroma shift, whichever is larger
    const [, A, Bb] = lab(data[i], data[i + 1], data[i + 2])
    const d = Math.max(Math.sqrt(dr * dr + dg * dg + db * db), chroma * Math.hypot(A - P[1], Bb - P[2]))
    alpha[p] = smooth(t0, t1, d)
  }

  // fill small enclosed holes (pale petal interiors): background reachable
  // from the border stays, enclosed pockets smaller than `holes` get filled
  if (holes > 0) {
    const seen = new Uint8Array(W * H)
    const st = []
    const push = (q) => {
      if (!seen[q] && alpha[q] < 0.5) {
        seen[q] = 1
        st.push(q)
      }
    }
    for (let x = 0; x < W; x++) push(x), push((H - 1) * W + x)
    for (let y = 0; y < H; y++) push(y * W), push(y * W + W - 1)
    while (st.length) {
      const q = st.pop()
      const x = q % W
      const y = (q / W) | 0
      if (x > 0) push(q - 1)
      if (x < W - 1) push(q + 1)
      if (y > 0) push(q - W)
      if (y < H - 1) push(q + W)
    }
    const lim = W * H * holes
    const done = new Uint8Array(W * H)
    for (let p = 0; p < W * H; p++) {
      if (seen[p] || done[p] || alpha[p] >= 0.5) continue
      const pocket = []
      st.push(p)
      done[p] = 1
      while (st.length) {
        const q = st.pop()
        pocket.push(q)
        const x = q % W
        const y = (q / W) | 0
        for (const r of [x > 0 ? q - 1 : -1, x < W - 1 ? q + 1 : -1, y > 0 ? q - W : -1, y < H - 1 ? q + W : -1])
          if (r >= 0 && !done[r] && !seen[r] && alpha[r] < 0.5) {
            done[r] = 1
            st.push(r)
          }
      }
      if (pocket.length < lim) for (const q of pocket) alpha[q] = Math.max(alpha[q], 0.97)
    }
  }

  // drop specks: components (alpha > .5) much smaller than the largest
  const comp = new Int32Array(W * H).fill(-1)
  const sizes = []
  const stack = []
  for (let p = 0; p < W * H; p++) {
    if (alpha[p] < 0.5 || comp[p] >= 0) continue
    const id = sizes.length
    let n = 0
    stack.push(p)
    comp[p] = id
    while (stack.length) {
      const q = stack.pop()
      n++
      const x = q % W
      const y = (q / W) | 0
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const r = ny * W + nx
        if (comp[r] < 0 && alpha[r] >= 0.5) {
          comp[r] = id
          stack.push(r)
        }
      }
    }
    sizes.push(n)
  }
  const big = Math.max(...sizes)
  const keepId = sizes.map((s) => s >= big * keep)
  // soft edge pixels (alpha < .5) survive only next to a kept component
  const keepMask = new Uint8Array(W * H)
  for (let p = 0; p < W * H; p++) if (comp[p] >= 0 && keepId[comp[p]]) keepMask[p] = 1
  const R = 2
  const near = new Uint8Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!keepMask[y * W + x]) continue
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < W && ny < H) near[ny * W + nx] = 1
        }
    }

  let x0 = W
  let y0 = H
  let x1 = 0
  let y1 = 0
  for (let p = 0; p < W * H; p++) {
    let a = near[p] ? alpha[p] : 0
    if (comp[p] >= 0 && !keepId[comp[p]]) a = 0
    const i = p * 3
    const o4 = p * 4
    // un-mix the paper from partially transparent pixels
    for (let c = 0; c < 3; c++) {
      const v = a > 0.02 ? (data[i + c] - (1 - a) * paper[c]) / a : data[i + c]
      out[o4 + c] = Math.max(0, Math.min(255, Math.round(v)))
    }
    out[o4 + 3] = Math.round(a * 255)
    if (a > 0.1) {
      const x = p % W
      const y = (p / W) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  const pad = 4
  x0 = Math.max(0, x0 - pad)
  y0 = Math.max(0, y0 - pad)
  x1 = Math.min(W - 1, x1 + pad)
  y1 = Math.min(H - 1, y1 + pad)
  const tw = x1 - x0 + 1
  const th = y1 - y0 + 1
  const trimmed = Buffer.alloc(tw * th * 4)
  for (let y = 0; y < th; y++) out.copy(trimmed, y * tw * 4, ((y + y0) * W + x0) * 4, ((y + y0) * W + x1 + 1) * 4)
  return { data: trimmed, width: tw, height: th }
}
