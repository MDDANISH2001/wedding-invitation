import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { Palette } from '../theme/palette'
import { Tilt, canvasTexture, clamp01, detectTier, disposeTree, easeInOut, easeOut, glowPoints, makeCanvas, makeRenderer } from './common'

/**
 * The 3D envelope: a lit, gently floating envelope with gold-foil printing
 * (real metalness, so it glints as the phone tilts), a metallic wax seal
 * that cracks in two, a flap that swings open, warm light pouring out and
 * a burst of gold sparks.
 *
 * Built for phones: ~12 draw calls, no shadows or post-processing (glows
 * are additive sprites), capped pixel ratio, shaders compiled before the
 * first frame, and every resource disposed when the envelope is done.
 */
export interface EnvelopeOptions {
  palette: Palette
  /** big script label on the pocket, e.g. "Dawat-e-Nikah" */
  label: string
  /** Urdu line above it */
  labelUrdu: string
  /** optional guest line: "<guestPrefix> <guest>" */
  guest?: string
  guestPrefix: string
  monogram: [string, string]
  /** fraction of the viewport width the envelope spans (max) */
  maxWidthPx: number
  /** envelope centre, as a fraction of viewport height from the top */
  centerY: number
}

export interface FrameInfo {
  /** envelope in CSS px: left / right edges, the pocket rim (top edge) and bottom */
  left: number
  right: number
  rim: number
  bottom: number
}

const EW = 2 // envelope width (world units)
const EH = EW / 1.3
const V = 0.48 // the pocket's V reaches 48% down from the top
const FLAP = 0.52 // the flap covers 52% of the height

export class EnvelopeScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  private timer = new THREE.Timer()
  private tilt = new Tilt()
  private group = new THREE.Group()
  private flap = new THREE.Group()
  private sealHalves: THREE.Mesh[] = []
  private glow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private rays: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private dust: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private burst: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private lamp = new THREE.PointLight(0xffc870, 0, 6, 1.6)
  private openAt = -1
  private fallAt = -1
  private baseY = 0
  private disposed = false
  onFrame?: (f: FrameInfo) => void

  private o: EnvelopeOptions

  constructor(canvas: HTMLCanvasElement, o: EnvelopeOptions) {
    this.o = o
    const tier = detectTier()
    this.renderer = makeRenderer(canvas, tier, 2)
    this.timer.connect(document)

    // image-based lighting for the metallic seal and the foil print
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.scene.environment = pmrem.fromScene(room, 0.04).texture
    this.scene.environmentIntensity = 0.9
    room.dispose()
    pmrem.dispose()

    const key = new THREE.DirectionalLight(0xfff1d6, 1.6)
    key.position.set(-2, 3, 4)
    this.scene.add(key)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25))

    this.buildEnvelope()
    this.glow = this.buildGlow()
    this.rays = this.buildRays()
    this.lamp.position.set(0, EH * 0.35, 0.35)
    this.group.add(this.lamp)

    const gold = new THREE.Color(o.palette.gold[2])
    this.dust = glowPoints({ count: tier === 'high' ? 140 : 70, box: [6, 7, 2.5], center: [0, 0.4, -0.6], size: 0.05, color: gold, drift: 0.12, opacity: 0.7 })
    this.scene.add(this.dust)
    this.burst = this.buildBurst(tier === 'high' ? 160 : 90, gold)
    this.group.add(this.burst)

    this.scene.add(this.group)
    this.resize()
    window.addEventListener('resize', this.resize)
  }

  /** Compile every shader up front (no stutter on the first frames), then start the loop. */
  async start() {
    await this.renderer.compileAsync(this.scene, this.camera)
    if (this.disposed) return
    this.renderer.setAnimationLoop(this.frame)
  }

  /** Crack the seal and open; resolves when the card should start rising out. */
  open(): Promise<void> {
    if (this.openAt < 0) this.openAt = this.timer.getElapsed()
    return new Promise((r) => setTimeout(r, 1550))
  }

  /** Drop the envelope away (the card has taken over). */
  fall() {
    this.fallAt = this.timer.getElapsed()
  }

  dispose() {
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    window.removeEventListener('resize', this.resize)
    this.tilt.dispose()
    this.timer.dispose()
    disposeTree(this.scene)
    this.scene.environment?.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  // ───────────────────────────── layout ─────────────────────────────
  private resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // distance at which the envelope spans min(86vw, maxWidthPx)
    const frac = Math.min(0.86, this.o.maxWidthPx / w)
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const dist = EW / (frac * 2 * tanH * this.camera.aspect)
    this.camera.position.set(0, 0, dist)
    this.camera.updateProjectionMatrix()
    // place the envelope centre at centerY of the screen
    const visH = 2 * dist * tanH
    this.baseY = (0.5 - this.o.centerY) * visH
    const pr = this.renderer.getPixelRatio()
    // world size → pixels at distance 1
    for (const p of [this.dust, this.burst]) p.material.uniforms.uPixelRatio.value = (pr * h) / (2 * tanH)
  }

  private project = (() => {
    const v = new THREE.Vector3()
    return (x: number, y: number) => {
      v.set(x, y, 0).applyMatrix4(this.group.matrixWorld).project(this.camera)
      return [((v.x + 1) / 2) * window.innerWidth, ((1 - v.y) / 2) * window.innerHeight] as const
    }
  })()

  // ───────────────────────────── loop ─────────────────────────────
  private frame = () => {
    this.timer.update()
    const dt = Math.min(0.05, this.timer.getDelta())
    const t = this.timer.getElapsed()
    this.tilt.update(dt)

    // idle float + tilt parallax (eases out once opening)
    const calm = this.openAt < 0 ? 1 : Math.max(0, 1 - (t - this.openAt) / 0.8)
    const g = this.group
    g.rotation.y = this.tilt.x * 0.22 + Math.sin(t * 0.6) * 0.04 * calm
    g.rotation.x = -this.tilt.y * 0.14 + Math.sin(t * 0.45) * 0.03 * calm
    g.position.y = this.baseY + Math.sin(t * 0.9) * 0.035 * calm
    for (const p of [this.dust, this.burst]) p.material.uniforms.uTime.value = t

    if (this.openAt >= 0) this.animateOpen(t - this.openAt)
    if (this.fallAt >= 0) {
      const f = clamp01((t - this.fallAt) / 1.1)
      g.position.y -= f * f * 5
      g.rotation.x += f * 0.5
    }

    g.updateMatrixWorld()
    if (this.onFrame) {
      const [l, top] = this.project(-EW / 2, EH / 2)
      const [r] = this.project(EW / 2, EH / 2)
      const [, bottom] = this.project(0, -EH / 2)
      this.onFrame({ left: l, right: r, rim: top, bottom })
    }
    this.renderer.render(this.scene, this.camera)
  }

  private animateOpen(s: number) {
    // 0–.35 press · .3–1.0 seal cracks apart · .45–1.35 flap swings up · .9– light pours out
    const press = s < 0.35 ? Math.sin((s / 0.35) * Math.PI) : 0
    const crack = easeOut(clamp01((s - 0.3) / 0.7))
    this.sealHalves.forEach((h, i) => {
      const dir = i === 0 ? -1 : 1
      h.scale.setScalar(1 - press * 0.08)
      h.position.x = dir * crack * 0.32
      h.position.y = -crack * crack * 0.9
      h.position.z = crack * 0.25
      h.rotation.z = dir * crack * 0.7
      h.rotation.y = dir * crack * 0.6
      h.visible = crack < 0.98
    })
    this.flap.rotation.x = -Math.PI * easeInOut(clamp01((s - 0.45) / 0.9))
    const light = easeOut(clamp01((s - 0.8) / 0.9))
    this.glow.material.uniforms.uIntensity.value = light
    this.rays.material.uniforms.uIntensity.value = light * (1 - clamp01((s - 2.6) / 1.2))
    this.lamp.intensity = light * 6
    if (s > 0.32 && this.burst.material.uniforms.uStart.value < 0) this.burst.material.uniforms.uStart.value = this.timer.getElapsed()
  }

  // ───────────────────────────── build ─────────────────────────────
  private buildEnvelope() {
    const { palette } = this.o
    const env = palette.envelope

    // back panel + the patterned liner seen inside the opening
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(EW, EH, 0.02),
      new THREE.MeshStandardMaterial({ color: env.body, roughness: 0.85 }),
    )
    back.position.z = -0.012
    this.group.add(back)

    const liner = this.linerTexture()
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(EW * 0.98, EH * 0.98), new THREE.MeshStandardMaterial({ map: liner, roughness: 0.7 }))
    inner.position.z = 0.0
    this.group.add(inner)

    // front pocket with the V cut, printed with foil
    const pocketShape = new THREE.Shape()
    pocketShape.moveTo(-EW / 2, -EH / 2)
    pocketShape.lineTo(EW / 2, -EH / 2)
    pocketShape.lineTo(EW / 2, EH / 2)
    pocketShape.lineTo(0, EH / 2 - EH * V)
    pocketShape.lineTo(-EW / 2, EH / 2)
    pocketShape.closePath()
    const pocketGeo = planarUV(new THREE.ShapeGeometry(pocketShape), EW, EH)
    const [front, frontMR] = this.frontTextures()
    const pocket = new THREE.Mesh(
      pocketGeo,
      new THREE.MeshStandardMaterial({ map: front, roughnessMap: frontMR, metalnessMap: frontMR, roughness: 1, metalness: 1 }),
    )
    pocket.position.z = 0.03
    this.group.add(pocket)

    // flap, hinged on the top edge
    const flapShape = new THREE.Shape()
    flapShape.moveTo(-EW / 2, 0)
    flapShape.lineTo(EW / 2, 0)
    flapShape.lineTo(0, -EH * FLAP)
    flapShape.closePath()
    const flapGeo = planarUV(new THREE.ShapeGeometry(flapShape), EW, EH * FLAP, -EW / 2, -EH * FLAP)
    const [flapTex, flapMR] = this.flapTextures()
    const flapFront = new THREE.Mesh(
      flapGeo,
      new THREE.MeshStandardMaterial({ map: flapTex, roughnessMap: flapMR, metalnessMap: flapMR, roughness: 1, metalness: 1, side: THREE.FrontSide }),
    )
    const flapBack = new THREE.Mesh(flapGeo, new THREE.MeshStandardMaterial({ map: liner, roughness: 0.7, side: THREE.BackSide }))
    this.flap.add(flapFront, flapBack)
    this.flap.position.set(0, EH / 2, 0.045)
    this.group.add(this.flap)

    // the wax seal on the flap's tip, in two halves along a jagged crack
    const R = 0.27
    const [sealTex, sealBump] = this.sealTextures()
    const sealMat = new THREE.MeshStandardMaterial({
      map: sealTex,
      bumpMap: sealBump,
      bumpScale: 3,
      metalness: 0.75,
      roughness: 0.3,
    })
    for (const side of [-1, 1] as const) {
      const geo = new THREE.ExtrudeGeometry(sealHalf(R, side), {
        depth: 0.03,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.016,
        bevelSegments: 3,
        curveSegments: 6,
      })
      planarUV(geo, 2 * R * 1.08, 2 * R * 1.08, -R * 1.08, -R * 1.08)
      const half = new THREE.Mesh(geo, sealMat)
      const holder = new THREE.Group()
      holder.position.set(0, -EH * FLAP + R * 0.55, 0.01)
      holder.add(half)
      this.flap.add(holder)
      this.sealHalves.push(half)
    }

    // soft shadow behind the floating envelope
    const [sc, sx] = makeCanvas(128, 128)
    const rg = sx.createRadialGradient(64, 64, 0, 64, 64, 64)
    rg.addColorStop(0, 'rgba(0,0,0,0.55)')
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    sx.fillStyle = rg
    sx.fillRect(0, 0, 128, 128)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(EW * 1.5, EH * 1.5),
      new THREE.MeshBasicMaterial({ map: canvasTexture(sc), transparent: true, depthWrite: false }),
    )
    shadow.position.set(0.08, -0.16, -0.35)
    this.group.add(shadow)
  }

  /** Warm light inside the pocket, seen through the opening. */
  private buildGlow() {
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(EW * 0.96, EH * 0.9),
      new THREE.ShaderMaterial({
        uniforms: { uIntensity: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uIntensity; varying vec2 vUv;
          void main(){
            float d = distance(vUv, vec2(0.5, 1.0));
            float a = smoothstep(0.9, 0.0, d) * uIntensity;
            gl_FragColor = vec4(vec3(1.0, 0.82, 0.5) * (0.6 + a), a);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    )
    glow.position.set(0, 0, 0.012)
    this.group.add(glow)
    return glow
  }

  /** God rays fanning upward out of the opened envelope. */
  private buildRays() {
    const rays = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 6),
      new THREE.ShaderMaterial({
        uniforms: { uIntensity: { value: 0 }, uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uIntensity; varying vec2 vUv;
          void main(){
            vec2 p = vUv - vec2(0.5, 0.0);
            float ang = atan(p.x, p.y);
            float r = length(p);
            float beams = 0.55 + 0.45 * sin(ang * 22.0) * sin(ang * 9.0 + 1.3);
            float cone = smoothstep(1.25, 0.0, abs(ang)) ;
            float a = beams * cone * smoothstep(1.0, 0.05, r) * smoothstep(0.0, 0.08, r) * uIntensity * 0.55;
            gl_FragColor = vec4(vec3(1.0, 0.86, 0.6), a);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    )
    rays.position.set(0, EH / 2 + 3 - 0.05, -0.05)
    this.group.add(rays)
    return rays
  }

  /** Gold sparks thrown up out of the seal and the opening; motion entirely in the shader. */
  private buildBurst(n: number, color: THREE.Color) {
    const pos = new Float32Array(n * 3)
    const vel = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const fromSeal = i < n * 0.35
      pos[i * 3] = fromSeal ? 0 : (Math.random() - 0.5) * EW * 0.8
      pos[i * 3 + 1] = fromSeal ? EH / 2 - EH * FLAP + 0.15 : EH / 2 - 0.1
      pos[i * 3 + 2] = 0.1
      const a = fromSeal ? Math.random() * Math.PI * 2 : Math.PI / 2 + (Math.random() - 0.5) * 1.4
      const sp = fromSeal ? 0.6 + Math.random() * 1.6 : 0.8 + Math.random() * 2.2
      vel[i * 3] = Math.cos(a) * sp
      vel[i * 3 + 1] = Math.sin(a) * sp
      vel[i * 3 + 2] = (Math.random() - 0.2) * 1.2
      seed[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aVel', new THREE.BufferAttribute(vel, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uStart: { value: -1 }, uColor: { value: color }, uPixelRatio: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 aVel; attribute float aSeed;
        uniform float uTime, uStart, uPixelRatio;
        varying float vA;
        void main(){
          float t = uStart < 0.0 ? -1.0 : uTime - uStart - aSeed * 0.5;
          float life = 1.4 + aSeed * 1.2;
          vA = t < 0.0 ? 0.0 : (1.0 - smoothstep(0.0, life, t));
          float tt = max(t, 0.0);
          // drag + slight rise, like embers
          vec3 p = position + aVel * (1.0 - exp(-tt * 1.6)) / 1.6 + vec3(0.0, 0.18 * tt * tt, 0.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.025 + aSeed * 0.05) * uPixelRatio / -mv.z * (0.4 + vA);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.97, 0.85), a * a) * 1.6, a * vA);
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

  // ───────────────────────────── textures ─────────────────────────────
  /**
   * The pocket front: paper colour, a printed jaali border, fold lines and
   * the label. The second canvas is the roughness/metalness map — foil
   * printing is metallic and glossy, the paper matte.
   */
  private frontTextures(): [THREE.Texture, THREE.Texture] {
    const W = 1024
    const H = Math.round(W / 1.3)
    const [c, x] = makeCanvas(W, H)
    const [m, mx] = makeCanvas(W, H)
    const env = this.o.palette.envelope
    paperFill(x, W, H, env.body)
    mx.fillStyle = 'rgb(0,235,0)' // G = roughness .92, B = metalness 0
    mx.fillRect(0, 0, W, H)

    const foil = (draw: (ctx: CanvasRenderingContext2D, mr: boolean) => void) => {
      x.save()
      x.fillStyle = x.strokeStyle = foilGradient(x, W, H, this.o.palette.gold)
      draw(x, false)
      x.restore()
      mx.save()
      mx.fillStyle = mx.strokeStyle = 'rgb(0,70,255)' // glossy metal
      draw(mx, true)
      mx.restore()
    }

    // fold lines from the bottom corners toward the V
    x.strokeStyle = 'rgba(0,0,0,0.22)'
    x.lineWidth = 3
    x.beginPath()
    x.moveTo(0, H)
    x.lineTo(W * 0.41, H * 0.42)
    x.moveTo(W, H)
    x.lineTo(W * 0.59, H * 0.42)
    x.stroke()

    foil((ctx) => {
      // double rule border, with the V edge echoed
      ctx.lineWidth = 7
      ctx.strokeRect(26, 26, W - 52, H - 52)
      ctx.lineWidth = 2.5
      ctx.strokeRect(42, 42, W - 84, H - 84)
      ctx.beginPath()
      ctx.moveTo(34, 30)
      ctx.lineTo(W / 2, H * V + 16)
      ctx.lineTo(W - 34, 30)
      ctx.lineWidth = 4
      ctx.stroke()
      // corner rosettes
      for (const [cx, cy] of [
        [70, H - 70],
        [W - 70, H - 70],
      ])
        rosette(ctx, cx, cy, 22)
    })

    // label: gold foil, or plain ink on pale paper (letterpress)
    const cx = W / 2
    const ink = env.labelInk
    const print = ink
      ? (draw: (ctx: CanvasRenderingContext2D) => void) => {
          x.save()
          x.fillStyle = ink
          draw(x)
          x.restore()
        }
      : foil
    print((ctx) => {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      // below the seal: script label, Urdu, then the guest's name
      ctx.font = `600 108px 'Great Vibes', cursive`
      ctx.fillText(this.o.label, cx, H * 0.75)
      ctx.font = `48px 'Noto Nastaliq Urdu', serif`
      ctx.direction = 'rtl'
      ctx.fillText(this.o.labelUrdu, cx, H * (this.o.guest ? 0.845 : 0.87))
      ctx.direction = 'ltr'
      if (this.o.guest) {
        ctx.font = `600 italic 36px 'Cormorant Garamond', serif`
        ctx.fillText(`${this.o.guestPrefix} ${this.o.guest}`, cx, H * 0.915)
      }
    })
    return [canvasTexture(c), canvasTexture(m, false)]
  }

  private flapTextures(): [THREE.Texture, THREE.Texture] {
    const W = 1024
    const H = Math.round((W / 1.3) * FLAP)
    const [c, x] = makeCanvas(W, H)
    const [m, mx] = makeCanvas(W, H)
    paperFill(x, W, H, this.o.palette.envelope.flap)
    // light falls on the flap from above
    const sh = x.createLinearGradient(0, 0, 0, H)
    sh.addColorStop(0, 'rgba(255,255,255,0.06)')
    sh.addColorStop(1, 'rgba(0,0,0,0.12)')
    x.fillStyle = sh
    x.fillRect(0, 0, W, H)
    mx.fillStyle = 'rgb(0,235,0)'
    mx.fillRect(0, 0, W, H)
    for (const [ctx, style] of [
      [x, foilGradient(x, W, H, this.o.palette.gold)],
      [mx, 'rgb(0,70,255)'],
    ] as const) {
      ctx.strokeStyle = style
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(28, 22)
      ctx.lineTo(W / 2, H - 30)
      ctx.lineTo(W - 28, 22)
      ctx.stroke()
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(72, 40)
      ctx.lineTo(W / 2, H - 66)
      ctx.lineTo(W - 72, 40)
      ctx.stroke()
    }
    // flap UVs run hinge (v=1) to tip (v=0), matching the canvas drawn top-down
    return [canvasTexture(c), canvasTexture(m, false)]
  }

  private linerTexture(): THREE.Texture {
    const S = 512
    const [c, x] = makeCanvas(S, S)
    paperFill(x, S, S, this.o.palette.envelope.liner)
    x.strokeStyle = this.o.palette.envelope.print
    x.globalAlpha = 0.55
    x.lineWidth = 2
    const step = 64
    for (let gy = 0; gy < S; gy += step)
      for (let gx = 0; gx < S; gx += step) {
        const k = step / 56
        x.save()
        x.translate(gx, gy)
        x.scale(k, k)
        x.strokeRect(16, 16, 24, 24)
        x.beginPath()
        x.moveTo(28, 11)
        x.lineTo(45, 28)
        x.lineTo(28, 45)
        x.lineTo(11, 28)
        x.closePath()
        x.moveTo(28, 0)
        x.lineTo(28, 11)
        x.moveTo(28, 45)
        x.lineTo(28, 56)
        x.moveTo(0, 28)
        x.lineTo(11, 28)
        x.moveTo(45, 28)
        x.lineTo(56, 28)
        x.stroke()
        x.restore()
      }
    const t = canvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 2.3)
    return t
  }

  /** Seal face: wax/metal colour with the embossed monogram, and its bump map. */
  private sealTextures(): [THREE.Texture, THREE.Texture] {
    const S = 512
    const [c, x] = makeCanvas(S, S)
    const [b, bx] = makeCanvas(S, S)
    const [s0, s1] = this.o.palette.envelope.seal
    const rg = x.createRadialGradient(S * 0.38, S * 0.32, 10, S / 2, S / 2, S * 0.55)
    rg.addColorStop(0, lighten(s0, 0.35))
    rg.addColorStop(0.5, s0)
    rg.addColorStop(1, s1)
    x.fillStyle = rg
    x.fillRect(0, 0, S, S)
    bx.fillStyle = '#808080'
    bx.fillRect(0, 0, S, S)
    // raised rim ring + pressed monogram
    for (const [ctx, ring, letters] of [
      [x, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.35)'],
      [bx, '#c8c8c8', '#3a3a3a'],
    ] as const) {
      ctx.strokeStyle = ring
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2)
      ctx.stroke()
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(S / 2, S / 2, S * 0.31, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = letters
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `600 170px 'Great Vibes', cursive`
      const [a, z] = this.o.monogram
      ctx.fillText(a, S * 0.36, S * 0.52)
      ctx.fillText(z, S * 0.66, S * 0.52)
      ctx.font = `600 90px 'Great Vibes', cursive`
      ctx.fillText('&', S * 0.51, S * 0.46)
    }
    return [canvasTexture(c), canvasTexture(b, false)]
  }
}

// ───────────────────────────── helpers ─────────────────────────────
/** Planar UVs from x/y (ShapeGeometry and the extrude caps use raw coordinates). */
function planarUV<G extends THREE.BufferGeometry>(geo: G, w: number, h: number, x0 = -w / 2, y0 = -h / 2): G {
  const p = geo.attributes.position
  const uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - x0) / w
    uv[i * 2 + 1] = (p.getY(i) - y0) / h
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geo
}

/** One half of a scalloped seal, split along a jagged crack. */
function sealHalf(R: number, side: -1 | 1): THREE.Shape {
  const r = (a: number) => R * (1 + 0.06 * Math.cos(a * 16))
  const crack: [number, number][] = [
    [0, -1],
    [0.06, -0.62],
    [-0.07, -0.24],
    [0.06, 0.12],
    [-0.05, 0.5],
    [0.03, 0.8],
    [0, 1],
  ].map(([cx, cy]) => [cx * R, cy * r(Math.PI / 2)])
  const s = new THREE.Shape()
  const steps = 48
  // outer scallop: left half from top over the left side to bottom; right half bottom → right → top
  const a0 = side < 0 ? Math.PI / 2 : -Math.PI / 2
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (i / steps) * Math.PI
    const px = Math.cos(a) * r(a)
    const py = Math.sin(a) * r(a)
    if (i === 0) s.moveTo(px, py)
    else s.lineTo(px, py)
  }
  const back = side < 0 ? crack : [...crack].reverse()
  for (const [cx, cy] of back) s.lineTo(cx, cy)
  s.closePath()
  return s
}

function paperFill(x: CanvasRenderingContext2D, W: number, H: number, color: string) {
  x.fillStyle = color
  x.fillRect(0, 0, W, H)
  // fibres / velvet grain
  const n = Math.round((W * H) / 90)
  for (let i = 0; i < n; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)'
    x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75)
  v.addColorStop(0, 'rgba(255,255,255,0.05)')
  v.addColorStop(1, 'rgba(0,0,0,0.18)')
  x.fillStyle = v
  x.fillRect(0, 0, W, H)
}

function foilGradient(x: CanvasRenderingContext2D, W: number, H: number, gold: Palette['gold']) {
  const g = x.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, gold[1])
  g.addColorStop(0.3, gold[2])
  g.addColorStop(0.45, gold[3])
  g.addColorStop(0.6, gold[2])
  g.addColorStop(1, gold[1])
  return g
}

function rosette(x: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  x.save()
  x.translate(cx, cy)
  for (let k = 0; k < 8; k++) {
    x.rotate(Math.PI / 4)
    x.beginPath()
    x.moveTo(0, 0)
    x.bezierCurveTo(r * 0.36, -r * 0.3, r * 0.36, -r * 0.72, 0, -r)
    x.bezierCurveTo(-r * 0.36, -r * 0.72, -r * 0.36, -r * 0.3, 0, 0)
    x.fill()
  }
  x.restore()
}

function lighten(hex: string, k: number) {
  const c = new THREE.Color(hex)
  c.lerp(new THREE.Color('#ffffff'), k)
  return `#${c.getHexString()}`
}
