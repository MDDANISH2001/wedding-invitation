import { PALETTE } from '../../theme/palette'

/**
 * A Mughal multifoil (cusped) arch: a pointed arch whose outline is made of
 * semicircular lobes meeting in small inward cusps. Returns an open path from
 * the left springing point over the apex to the right springing point.
 */
export function cuspedArch(xL: number, xR: number, y0: number, yA: number, lobes = 4): string {
  const cx = (xL + xR) / 2
  // base curve: a gently pointed arch
  const base = (t: number, side: 1 | -1) => {
    const th = t * (Math.PI / 2)
    const x = cx - side * (cx - xL) * Math.cos(th) ** 1.05
    const y = y0 - (y0 - yA) * Math.sin(th) ** 0.8
    return [x, y] as const
  }
  const pts: (readonly [number, number])[] = []
  for (let i = 0; i <= lobes; i++) pts.push(base(i / lobes, 1))
  for (let i = lobes - 1; i >= 0; i--) pts.push(base(i / lobes, -1))
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]
    const [px, py] = pts[i - 1]
    const chord = Math.hypot(x - px, y - py)
    d += `A${(chord * 0.56).toFixed(2)} ${(chord * 0.56).toFixed(2)} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d
}

/** A horizontal jaali band tile (data URL) for the sheet borders. */
export function jaaliBandUrl(vertical = false): string {
  const g = PALETTE.gold[1].replace('#', '%23')
  const l = PALETTE.gold[2].replace('#', '%23')
  const body = `%3Cpath d='M0 3h40M0 25h40' stroke='${g}' stroke-width='1.4'/%3E%3Cpath d='M20 6l8 8-8 8-8-8z' fill='none' stroke='${l}' stroke-width='1.2'/%3E%3Ccircle cx='20' cy='14' r='1.8' fill='${l}'/%3E%3Cpath d='M0 14l6-6M0 14l6 6M40 14l-6-6M40 14l-6 6' stroke='${l}' stroke-width='1'/%3E`
  return vertical
    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='40'%3E%3Cg transform='rotate(90 14 14)'%3E${body}%3C/g%3E%3C/svg%3E")`
    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='28'%3E${body}%3C/svg%3E")`
}
