import * as THREE from 'three'

/**
 * Shared three.js helpers tuned for phones: a renderer that caps its pixel
 * ratio and antialiasing on weaker devices, a quality tier, soft additive
 * point sprites and gentle tilt input.
 */
export type Tier = 'high' | 'low'

export function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 4
  const cores = nav.hardwareConcurrency ?? 4
  return mem >= 4 && cores >= 6 ? 'high' : 'low'
}

/** WebGL2 renderer on an existing canvas; throws if WebGL is unavailable. */
export function makeRenderer(canvas: HTMLCanvasElement, tier: Tier, maxDpr = 2): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: tier === 'high',
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
  })
  // fill rate grows with dpr²: cap it, lower on weaker phones
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'high' ? maxDpr : Math.min(maxDpr, 1.5)))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.NeutralToneMapping
  return renderer
}

/** A canvas → texture, sRGB, with mipmaps. */
export function canvasTexture(canvas: HTMLCanvasElement, color = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/**
 * Soft glowing point sprites. Each point drifts on its own slow orbit (in
 * the vertex shader, so the CPU does nothing per frame) and twinkles.
 */
export function glowPoints(opts: {
  count: number
  box: [number, number, number]
  center?: [number, number, number]
  size: number
  color: THREE.ColorRepresentation
  drift?: number
  opacity?: number
}): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const { count, box, center = [0, 0, 0], size, color, drift = 0.08, opacity = 1 } = opts
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + (Math.random() - 0.5) * box[0]
    pos[i * 3 + 1] = center[1] + (Math.random() - 0.5) * box[1]
    pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * box[2]
    seed[i] = Math.random()
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uDrift: { value: drift },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPixelRatio: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uSize, uDrift, uPixelRatio;
      varying float vTw;
      void main() {
        vec3 p = position;
        float t = uTime * (0.25 + aSeed * 0.35) + aSeed * 40.0;
        p += vec3(sin(t), cos(t * 0.8) * 1.4, sin(t * 0.6)) * uDrift;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vTw = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 2.5) + aSeed * 20.0);
        gl_PointSize = uSize * (0.5 + aSeed) * uPixelRatio / -mv.z;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        gl_FragColor = vec4(uColor * (1.0 + a), a * vTw * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  return pts
}

/**
 * Smoothed tilt from the cursor or the phone's gyroscope, in -1…1.
 */
export class Tilt {
  x = 0
  y = 0
  private tx = 0
  private ty = 0
  private base: [number, number] | null = null
  private onMove = (e: PointerEvent) => {
    this.tx = (e.clientX / window.innerWidth) * 2 - 1
    this.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  private onOrient = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return
    // relative to how the phone was held when the page opened
    if (!this.base) this.base = [e.beta, e.gamma]
    this.tx = Math.max(-1, Math.min(1, (e.gamma - this.base[1]) / 25))
    this.ty = Math.max(-1, Math.min(1, (e.beta - this.base[0]) / 25))
  }
  constructor() {
    window.addEventListener('pointermove', this.onMove, { passive: true })
    window.addEventListener('deviceorientation', this.onOrient, { passive: true })
  }
  /** Ease toward the latest reading; call once per frame. */
  update(dt: number) {
    const k = 1 - Math.exp(-dt * 4)
    this.x += (this.tx - this.x) * k
    this.y += (this.ty - this.y) * k
  }
  dispose() {
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('deviceorientation', this.onOrient)
  }
}

/** Dispose every geometry, material and texture under an object. */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    m.geometry?.dispose()
    const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []
    for (const mat of mats) {
      for (const v of Object.values(mat)) if ((v as THREE.Texture)?.isTexture) (v as THREE.Texture).dispose()
      if ('uniforms' in mat)
        for (const u of Object.values((mat as THREE.ShaderMaterial).uniforms)) if ((u.value as THREE.Texture)?.isTexture) u.value.dispose()
      mat.dispose()
    }
  })
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
export const easeOut = (t: number) => 1 - (1 - t) ** 3
export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
