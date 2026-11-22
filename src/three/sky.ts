import * as THREE from 'three'
import type { Palette } from '../theme/palette'
import { Tilt, detectTier, disposeTree, glowPoints, makeRenderer } from './common'

/**
 * The night sky behind the pages: a deep gradient with a faint milky band,
 * twinkling stars, a glowing crescent moon and paper sky lanterns rising
 * slowly. Lanterns start dark and light up one after another as the guest
 * scrolls through the invitation.
 *
 * Cheap by design: four draw calls, everything animated in shaders, the sky
 * at a reduced pixel ratio, 30 fps on weaker phones, paused when hidden.
 */
export class SkyScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60)
  private timer = new THREE.Timer()
  private tilt = new Tilt()
  private sky: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private stars: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private lanterns: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private moon: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private low: boolean
  private skip = false
  private lit = 0

  constructor(canvas: HTMLCanvasElement, palette: Palette) {
    const tier = detectTier()
    this.low = tier === 'low'
    this.renderer = makeRenderer(canvas, 'low', 1.25)
    this.renderer.toneMapping = THREE.NoToneMapping
    this.timer.connect(document)
    this.camera.position.set(0, 0, 10)

    this.sky = this.buildSky()
    this.stars = glowPoints({
      count: tier === 'high' ? 900 : 420,
      box: [40, 40, 20],
      center: [0, 0, -14],
      size: 0.09,
      color: '#fff4dc',
      drift: 0.02,
      opacity: 0.9,
    })
    this.scene.add(this.stars)
    this.moon = this.buildMoon(palette)
    this.lanterns = this.buildLanterns(tier === 'high' ? 34 : 20)
    this.resize()
    window.addEventListener('resize', this.resize)
  }

  async start() {
    await this.renderer.compileAsync(this.scene, this.camera)
    this.renderer.setAnimationLoop(this.frame)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    window.removeEventListener('resize', this.resize)
    this.tilt.dispose()
    this.timer.dispose()
    disposeTree(this.scene)
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  private resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const px = (this.renderer.getPixelRatio() * h) / (2 * tanH)
    this.stars.material.uniforms.uPixelRatio.value = px
    this.lanterns.material.uniforms.uPixelRatio.value = px
    // keep the moon in the top-right corner on any aspect
    const visH = 2 * 10 * tanH
    this.moon.position.set(Math.min(visH * this.camera.aspect * 0.32, 3.4), visH * 0.36, 0)
  }

  private frame = () => {
    // weaker phones: draw every other frame (the sky moves slowly)
    if (this.low && (this.skip = !this.skip)) return
    this.timer.update()
    const dt = Math.min(0.1, this.timer.getDelta())
    const t = this.timer.getElapsed()
    this.tilt.update(dt)

    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const progress = Math.min(1, window.scrollY / max)
    // lanterns ignite with scroll, and never go out again
    this.lit = Math.max(this.lit, 0.18 + progress * 0.9)

    for (const m of [this.sky.material, this.stars.material, this.lanterns.material, this.moon.material]) m.uniforms.uTime.value = t
    this.lanterns.material.uniforms.uLit.value += (this.lit - this.lanterns.material.uniforms.uLit.value) * Math.min(1, dt * 1.5)
    // gentle parallax: tilt + scroll
    this.camera.position.x += (this.tilt.x * 0.6 - this.camera.position.x) * Math.min(1, dt * 2)
    this.camera.position.y += (-progress * 1.6 - this.tilt.y * 0.4 - this.camera.position.y) * Math.min(1, dt * 2)
    this.camera.lookAt(this.camera.position.x * 0.4, this.camera.position.y * 0.4, 0)
    this.sky.position.set(this.camera.position.x, this.camera.position.y, -20)
    this.renderer.render(this.scene, this.camera)
  }

  private buildSky() {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 60),
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
          float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
          float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
          void main(){
            vec2 uv = vUv;
            vec3 top = vec3(0.02, 0.03, 0.10), mid = vec3(0.06, 0.08, 0.24), low = vec3(0.20, 0.12, 0.30);
            vec3 col = mix(low, mid, smoothstep(0.15, 0.45, uv.y));
            col = mix(col, top, smoothstep(0.45, 0.95, uv.y));
            // faint milky band drifting across
            float band = exp(-pow((uv.y - 0.62 + (uv.x - 0.5) * 0.45) * 5.0, 2.0));
            float n = fbm(uv * vec2(7.0, 5.0) + vec2(uTime * 0.004, 0.0));
            col += vec3(0.20, 0.17, 0.32) * band * n * 0.55;
            // warm horizon glow from the lanterns below
            col += vec3(0.35, 0.16, 0.06) * smoothstep(0.35, 0.0, uv.y) * 0.5;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
        depthWrite: false,
      }),
    )
    mesh.position.z = -20
    mesh.renderOrder = -1
    this.scene.add(mesh)
    return mesh
  }

  private buildMoon(palette: Palette) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uGold: { value: new THREE.Color(palette.gold[3]) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uGold; varying vec2 vUv;
          void main(){
            vec2 p = (vUv - 0.5) * 2.0;
            float r = length(p);
            float disc = smoothstep(0.36, 0.345, r);
            float bite = smoothstep(0.30, 0.285, length(p - vec2(0.15, 0.08)));
            float crescent = disc * (1.0 - bite);
            float halo = exp(-r * 3.2) * (0.55 + 0.05 * sin(uTime * 0.7));
            vec3 col = uGold * (crescent * 1.4) + vec3(1.0, 0.92, 0.75) * halo * 0.6;
            gl_FragColor = vec4(col, max(crescent, halo * 0.8));
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.scene.add(mesh)
    return mesh
  }

  /** Paper sky lanterns drawn as shaped point sprites: one draw call for all of them. */
  private buildLanterns(n: number) {
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    const order = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      // keep the middle column (where the cards sit) a little clearer
      const side = Math.random() < 0.5 ? -1 : 1
      pos[i * 3] = side * (0.8 + Math.random() * 7)
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22
      pos[i * 3 + 2] = -2 - Math.random() * 12
      seed[i] = Math.random()
      order[i] = i / n
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aOrder', new THREE.BufferAttribute(order, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLit: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed, aOrder;
        uniform float uTime, uLit, uPixelRatio;
        varying float vLit, vSeed;
        void main(){
          vec3 p = position;
          // rise forever, wrapping round; sway a little
          p.y = mod(p.y + 11.0 + uTime * (0.12 + aSeed * 0.12), 22.0) - 11.0;
          p.x += sin(uTime * 0.3 + aSeed * 30.0) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vLit = smoothstep(aOrder, aOrder + 0.08, uLit);
          vSeed = aSeed;
          gl_PointSize = (0.55 + aSeed * 0.35) * uPixelRatio / -mv.z;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; varying float vLit, vSeed;
        void main(){
          vec2 uv = gl_PointCoord;            // y grows downward
          float y = (uv.y - 0.22) / 0.56;     // 0 at the lantern top, 1 at its mouth
          float hw = mix(0.30, 0.22, y);      // wider at the top, like a kongming lantern
          float body = step(0.0, y) * step(y, 1.0) * smoothstep(hw, hw - 0.03, abs(uv.x - 0.5));
          float flicker = 0.85 + 0.15 * sin(uTime * (7.0 + vSeed * 5.0) + vSeed * 40.0);
          // lit: hot at the mouth, glowing paper; unlit: dim paper
          vec3 litCol = mix(vec3(1.0, 0.55, 0.18), vec3(1.0, 0.93, 0.7), smoothstep(0.2, 1.0, y)) * flicker;
          vec3 darkCol = vec3(0.22, 0.14, 0.12);
          vec3 col = mix(darkCol, litCol * 1.5, vLit);
          float rib = 0.85 + 0.15 * step(0.04, abs(fract(uv.x * 7.0) - 0.5));
          float halo = exp(-length((uv - vec2(0.5, 0.62)) * vec2(2.2, 1.8)) * 3.5) * vLit * flicker;
          float a = max(body * (0.55 + 0.45 * vLit), halo * 0.7);
          gl_FragColor = vec4(col * rib * body + vec3(1.0, 0.7, 0.35) * halo, a);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    const pts = new THREE.Points(geo, mat)
    pts.frustumCulled = false
    this.scene.add(pts)
    return pts
  }
}
