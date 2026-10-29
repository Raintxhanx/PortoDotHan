import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Clock,
  Color,
  FrontSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  sRGBEncoding,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

/* ─────────────────────────────────────────────────────────────
   GLSL
   ───────────────────────────────────────────────────────────── */

const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const CORE_VERT = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
varying vec3 vPos;

${NOISE}

void main() {
  vec3 pos = position;

  float n1 = snoise(pos * uFreq + vec3(0.0, uTime * 0.16, 0.0));
  float n2 = snoise(pos * (uFreq * 2.4) + vec3(uTime * 0.1, 0.0, uTime * 0.06));
  float disp = (n1 * 0.095 + n2 * 0.028) * uAmp;

  pos += normal * disp;

  vNoise = n1;
  vPos = pos;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vView = normalize(-mv.xyz);
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * mv;
}
`

const CORE_FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uTime;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
varying vec3 vPos;

void main() {
  vec3 n = normalize(vNormal);
  float fres = pow(1.0 - clamp(dot(n, normalize(vView)), 0.0, 1.0), 2.7);

  float bands = smoothstep(-0.35, 0.9, sin(vPos.y * 4.2 + vNoise * 3.0 + uTime * 0.32) * 0.5 + 0.5);
  vec3 base = mix(uColorA, uColorB, bands);
  vec3 rim = mix(uColorC, uColorB, bands);

  vec3 col = base * 0.045;
  col += rim * fres * 0.92;
  col += uColorA * pow(fres, 4.0) * 0.3;

  float alpha = clamp(fres * 0.82 + 0.025, 0.0, 0.9) * uOpacity;

  gl_FragColor = vec4(col, alpha);
}
`

const POINT_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uPixelRatio;
uniform float uScale;
uniform float uDrift;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec3 p = position;

  p.y += sin(uTime * 0.32 + aPhase * 6.2831 + p.x * 0.22) * uDrift;
  p.x += cos(uTime * 0.24 + aPhase * 6.2831 + p.y * 0.18) * uDrift * 0.6;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);

  vColor = aColor;
  vTwinkle = 0.55 + 0.45 * sin(uTime * 1.1 + aPhase * 6.2831);

  gl_PointSize = aSize * uPixelRatio * (uScale / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;
}
`

const POINT_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.04, d);
  alpha *= vTwinkle;

  vec3 col = vColor * (0.75 + vTwinkle * 0.75);

  gl_FragColor = vec4(col, alpha);
}
`

/* ─────────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────────── */

const PALETTE = {
  bone: new Color('#f1ede3'),
  gold: new Color('#e3b263'),
  cyan: new Color('#79d7d0'),
  violet: new Color('#9c8cf6'),
}

const STATES = {
  hero: { x: 2.55, y: 0.25, z: -0.2, scale: 0.94, camZ: 7.2, camY: 0.05, amp: 1, freq: 1.15, opacity: 0.9, glow: 0.9 },
  about: { x: -3.8, y: 0.6, z: -2.2, scale: 0.62, camZ: 6.9, camY: 0, amp: 0.72, freq: 1.4, opacity: 0.55, glow: 0.5 },
  toolkit: { x: 3.9, y: 2.6, z: -2.2, scale: 0.75, camZ: 7.7, camY: 0.15, amp: 1.3, freq: 0.95, opacity: 0.55, glow: 0.6 },
  work: { x: 5.2, y: 3.0, z: -4.0, scale: 0.6, camZ: 8.2, camY: 0.1, amp: 0.5, freq: 1.6, opacity: 0.3, glow: 0.3 },
  now: { x: 3.9, y: 2.3, z: -2.5, scale: 0.55, camZ: 7.0, camY: 0, amp: 0.9, freq: 1.2, opacity: 0.38, glow: 0.4 },
  contact: { x: 0, y: 2.4, z: -3.6, scale: 0.9, camZ: 9.1, camY: 0.2, amp: 1.45, freq: 1.0, opacity: 0.4, glow: 0.6 },
}

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* ─────────────────────────────────────────────────────────────
   Experience
   ───────────────────────────────────────────────────────────── */

export default class Experience {
  constructor() {
    this.canvas = document.querySelector('.scene')
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.isMobile = window.matchMedia('(max-width: 820px)').matches
    this.pointer = new Vector2(0, 0)
    this.pointerTarget = new Vector2(0, 0)
    this.activeState = 'hero'
    this.state = { ...STATES.hero }
    this.clock = new Clock()
    this.time = 0
    this.scrollRot = 0
    this.raf = null
    this.visible = true

    if (!this.supportsWebGL()) {
      this.canvas.style.display = 'none'
      return
    }

    this.init()
  }

  supportsWebGL() {
    try {
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch (e) {
      return false
    }
  }

  init() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputEncoding = sRGBEncoding

    this.scene = new Scene()
    this.camera = new PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120)
    this.camera.position.set(0, 0, STATES.hero.camZ)

    this.group = new Group()
    this.scene.add(this.group)

    this.buildGlow()
    this.buildCore()
    this.buildRings()
    this.buildSwarm()
    this.buildShards()
    this.buildStars()

    this.bind()
    this.resize()
    this.updateState('hero')

    this.clock.start()
    this.draw()
  }

  /* ── objects ─────────────────────────────────────────────── */

  buildGlow() {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.32)')
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.09)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new CanvasTexture(canvas)
    texture.encoding = sRGBEncoding

    this.glow = new Sprite(
      new SpriteMaterial({
        map: texture,
        color: PALETTE.gold,
        transparent: true,
        opacity: 0.34,
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    )
    this.glow.scale.set(9, 9, 1)
    this.glow.position.z = -1
    this.group.add(this.glow)
  }

  buildCore() {
    const geometry = new IcosahedronGeometry(1.35, this.isMobile ? 20 : 32)

    this.coreUniforms = {
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uFreq: { value: 1.15 },
      uColorA: { value: PALETTE.gold.clone() },
      uColorB: { value: PALETTE.cyan.clone() },
      uColorC: { value: PALETTE.violet.clone() },
      uOpacity: { value: 0.95 },
    }

    this.core = new Mesh(
      geometry,
      new ShaderMaterial({
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        uniforms: this.coreUniforms,
        transparent: true,
        depthWrite: false,
        side: FrontSide,
      }),
    )
    this.group.add(this.core)

    this.wire = new Mesh(
      new IcosahedronGeometry(1.37, 3),
      new MeshBasicMaterial({
        color: PALETTE.bone,
        wireframe: true,
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
      }),
    )
    this.group.add(this.wire)
  }

  buildRings() {
    this.rings = new Group()

    const specs = [
      { radius: 2.15, tube: 0.004, color: PALETTE.gold, opacity: 0.5, rx: 1.12, rz: 0.2, speed: 0.14 },
      { radius: 2.55, tube: 0.003, color: PALETTE.cyan, opacity: 0.32, rx: 1.45, rz: -0.35, speed: -0.1 },
      { radius: 3.0, tube: 0.0025, color: PALETTE.violet, opacity: 0.26, rx: 0.85, rz: 0.6, speed: 0.07 },
    ]

    this.ringMeshes = specs.map((spec) => {
      const mesh = new Mesh(
        new TorusGeometry(spec.radius, spec.tube, 6, 240),
        new MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: spec.opacity,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      )
      mesh.rotation.x = spec.rx
      mesh.rotation.z = spec.rz
      mesh.userData.speed = spec.speed
      mesh.userData.baseRx = spec.rx
      this.rings.add(mesh)
      return mesh
    })

    this.group.add(this.rings)
  }

  buildSwarm() {
    const count = this.isMobile ? 420 : 1100
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    const palette = [PALETTE.gold, PALETTE.bone, PALETTE.cyan, PALETTE.violet]

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1.85 + Math.pow(Math.random(), 0.7) * 2.6
      const spread = 0.25 + radius * 0.18

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.35
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 2
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.35

      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = 0.5 + Math.random() * 1.5
      phases[i] = Math.random()
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))

    this.swarmUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uScale: { value: 17 },
      uDrift: { value: 0.1 },
    }

    this.swarm = new Points(
      geometry,
      new ShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: this.swarmUniforms,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    )

    this.group.add(this.swarm)
  }

  buildShards() {
    this.shards = new Group()
    const geometry = new OctahedronGeometry(0.038, 0)
    const material = new MeshBasicMaterial({
      color: PALETTE.gold,
      wireframe: true,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    })

    this.shardData = []

    for (let i = 0; i < (this.isMobile ? 14 : 26); i += 1) {
      const mesh = new Mesh(geometry, material)
      const angle = Math.random() * Math.PI * 2
      const radius = 2.1 + Math.random() * 3.4
      const y = (Math.random() - 0.5) * 4.2

      mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      const scale = 0.45 + Math.random() * 1.1
      mesh.scale.setScalar(scale)

      this.shardData.push({
        mesh,
        baseY: y,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.6,
      })

      this.shards.add(mesh)
    }

    this.group.add(this.shards)
  }

  buildStars() {
    const count = this.isMobile ? 700 : 1700
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    const palette = [PALETTE.bone, PALETTE.bone, PALETTE.bone, PALETTE.gold, PALETTE.cyan, PALETTE.violet]

    for (let i = 0; i < count; i += 1) {
      const radius = 12 + Math.random() * 46
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7
      positions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 2

      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = 0.5 + Math.pow(Math.random(), 2) * 2.4
      phases[i] = Math.random()
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))

    this.starUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uScale: { value: 105 },
      uDrift: { value: 0.02 },
    }

    this.stars = new Points(
      geometry,
      new ShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: this.starUniforms,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    )

    this.scene.add(this.stars)
  }

  /* ── state / events ──────────────────────────────────────── */

  updateState(name) {
    if (!STATES[name]) return
    this.activeState = name
    this.state = { ...STATES[name] }
  }

  bind() {
    this.onPointerMove = (event) => {
      this.pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1
      this.pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }

    this.onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      this.scrollRot = progress
    }

    this.onResize = () => this.resize()

    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize, { passive: true })
    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden
      if (this.visible) this.clock.getDelta()
    })
  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.isMobile = this.width < 820

    const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.75 : 2)

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(this.width, this.height)

    if (this.swarmUniforms) this.swarmUniforms.uPixelRatio.value = dpr
    if (this.starUniforms) this.starUniforms.uPixelRatio.value = dpr
  }

  /* ── render loop ─────────────────────────────────────────── */

  draw = () => {
    this.raf = requestAnimationFrame(this.draw)

    const dt = Math.min(this.clock.getDelta(), 0.05)
    if (!this.visible) return

    this.time += dt

    const smooth = 1 - Math.exp(-dt * 2.6)
    const quick = 1 - Math.exp(-dt * 6)

    this.pointer.x = lerp(this.pointer.x, this.pointerTarget.x, quick)
    this.pointer.y = lerp(this.pointer.y, this.pointerTarget.y, quick)

    const target = this.state
    const aspectFactor = clamp(this.camera.aspect / 1.7, 0.34, 1)
    const targetX = target.x * aspectFactor
    const targetY = target.y * clamp(this.camera.aspect / 1.2, 0.5, 1)

    this.group.position.x = lerp(this.group.position.x, targetX, smooth)
    this.group.position.y = lerp(this.group.position.y, targetY + Math.sin(this.time * 0.5) * 0.05, smooth)
    this.group.position.z = lerp(this.group.position.z, target.z, smooth)

    const s = lerp(this.group.scale.x, target.scale * (this.isMobile ? 0.72 : 1), smooth)
    this.group.scale.setScalar(s)

    this.camera.position.z = lerp(this.camera.position.z, target.camZ, smooth)
    this.camera.position.y = lerp(this.camera.position.y, target.camY + this.pointer.y * 0.18, quick)
    this.camera.position.x = lerp(this.camera.position.x, this.pointer.x * 0.32, quick)

    this.camera.lookAt(0, 0, 0)

    const t = this.time

    this.core.rotation.y += dt * (this.reduced ? 0.02 : 0.11) + dt * this.scrollRot * 0.05
    this.core.rotation.x = Math.sin(t * 0.14) * 0.14
    this.core.rotation.z = Math.cos(t * 0.1) * 0.08

    this.wire.rotation.copy(this.core.rotation)
    this.wire.rotation.y *= -0.6

    this.coreUniforms.uTime.value = t
    this.coreUniforms.uAmp.value = lerp(this.coreUniforms.uAmp.value, target.amp, smooth)
    this.coreUniforms.uFreq.value = lerp(this.coreUniforms.uFreq.value, target.freq, smooth)
    this.coreUniforms.uOpacity.value = lerp(
      this.coreUniforms.uOpacity.value,
      target.opacity * (this.isMobile ? 0.2 : 1),
      smooth,
    )

    this.glow.material.opacity = lerp(this.glow.material.opacity, 0.16 * target.glow, smooth)
    this.glow.scale.setScalar(lerp(this.glow.scale.x, 7.5 * target.scale, smooth))

    this.rings.rotation.y += dt * 0.05
    this.ringMeshes.forEach((mesh) => {
      mesh.rotation.z += dt * mesh.userData.speed
    })

    this.swarm.rotation.y = -t * 0.035 + this.scrollRot * 0.6
    this.swarmUniforms.uTime.value = t

    this.shardData.forEach((shard) => {
      shard.mesh.position.y = shard.baseY + Math.sin(t * shard.speed + shard.phase) * 0.35
      shard.mesh.rotation.y += dt * shard.rotSpeed
      shard.mesh.rotation.x += dt * shard.rotSpeed * 0.6
    })

    this.stars.rotation.y = t * 0.006 + this.pointer.x * 0.03
    this.stars.rotation.x = this.pointer.y * 0.02
    this.starUniforms.uTime.value = t

    this.renderer.render(this.scene, this.camera)
  }
}
