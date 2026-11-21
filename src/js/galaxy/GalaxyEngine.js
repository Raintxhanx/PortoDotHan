import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  sRGBEncoding,
} from 'three'

import { GALAXY, createSectionNodes } from './galaxyConfig'
import {
  galaxyFragmentShader,
  galaxyVertexShader,
  nodeFragmentShader,
  nodeVertexShader,
} from './shaders'

const TAU = Math.PI * 2

/**
 * The galaxy itself: one BufferGeometry + ShaderMaterial for the dust, one for
 * the chapter markers, a small starfield and a few additive nebula sprites.
 *
 * Nothing here touches the DOM or the camera. `GalaxyEngine` only owns GPU
 * resources and exposes the chapter node positions for raycasting.
 */
export default class GalaxyEngine {
  constructor(scene, { isMobile = false, reduced = false, pixelRatio = 1 } = {}) {
    this.scene = scene
    this.isMobile = isMobile
    this.reduced = reduced
    this.pixelRatio = pixelRatio
    this.time = 0

    this.count = isMobile ? GALAXY.countMobile : GALAXY.countDesktop
    this.starCount = isMobile ? GALAXY.starfieldMobile : GALAXY.starfieldDesktop

    this.parameters = {
      count: this.count,
      size: GALAXY.size,
      radius: GALAXY.radius,
      branches: GALAXY.branches,
      randomness: GALAXY.randomness,
      randomnessPower: GALAXY.randomnessPower,
      thickness: GALAXY.thickness,
      spiral: GALAXY.spiral,
      insideColor: GALAXY.colours.inside,
      midColor: GALAXY.colours.mid,
      outsideColor: GALAXY.colours.outside,
    }

    this.group = new Group()
    this.group.name = 'galaxy'
    scene.add(this.group)

    this.nodes = createSectionNodes()
    this.nodeGeometry = null
    this.nebulaTextures = []

    this.buildDust()
    this.buildNebula()
    this.buildStarfield()
    this.buildNodes()
    this.buildTether()
  }

  /* ── galaxy dust ─────────────────────────────────────────── */

  buildDust() {
    const geometry = new BufferGeometry()
    const positions = new Float32Array(this.count * 3)
    const colors = new Float32Array(this.count * 3)
    const scales = new Float32Array(this.count)
    const randomness = new Float32Array(this.count * 3)
    const phases = new Float32Array(this.count)

    const { radius: maxRadius, branches, randomness: spread, randomnessPower, thickness, spiral } = this.parameters
    const inside = new Color(GALAXY.colours.inside)
    const mid = new Color(GALAXY.colours.mid)
    const outside = new Color(GALAXY.colours.outside)
    const mixed = new Color()

    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3

      // More stars toward the rim keeps the core from blooming into a white
      // blob while the outer arms stay readable.
      const radius = Math.pow(Math.random(), 0.9) * maxRadius
      const branchAngle = ((i % branches) / branches) * TAU
      const angle = branchAngle + radius * spiral

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] =
        (Math.random() - 0.5) * thickness * (1.2 - (radius / maxRadius) * 0.6)
      positions[i3 + 2] = Math.sin(angle) * radius

      const rx = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spread * radius
      const ry =
        Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spread * radius * 0.32
      const rz = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spread * radius

      randomness[i3] = rx
      randomness[i3 + 1] = ry
      randomness[i3 + 2] = rz

      const t = radius / maxRadius
      if (t < 0.46) {
        mixed.copy(inside).lerp(mid, t / 0.46)
      } else {
        mixed.copy(mid).lerp(outside, (t - 0.46) / 0.54)
      }

      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b

      scales[i] = 0.35 + Math.pow(Math.random(), 2.4) * 1.05
      phases[i] = Math.random()
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new BufferAttribute(scales, 1))
    geometry.setAttribute('aRandomness', new BufferAttribute(randomness, 3))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))

    this.dustUniforms = {
      uTime: { value: 0 },
      uSize: { value: this.parameters.size },
      uPixelRatio: { value: this.pixelRatio },
      uSpin: { value: this.reduced ? 0 : GALAXY.spinSpeed },
      uDrift: { value: this.reduced ? 0 : 1 },
      uBrightness: { value: GALAXY.brightness },
    }

    this.dustMaterial = new ShaderMaterial({
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
      transparent: true,
      vertexColors: true,
      vertexShader: galaxyVertexShader,
      fragmentShader: galaxyFragmentShader,
      uniforms: this.dustUniforms,
    })

    this.dust = new Points(geometry, this.dustMaterial)
    this.dust.frustumCulled = false
    this.dust.renderOrder = 0
    this.group.add(this.dust)
  }

  /* ── atmospheric core glow ───────────────────────────────── */

  buildNebula() {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(0.28, 'rgba(255,255,255,0.28)')
    gradient.addColorStop(0.62, 'rgba(255,255,255,0.06)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new CanvasTexture(canvas)
    texture.encoding = sRGBEncoding
    this.nebulaTextures.push(texture)

    const specs = [
      { color: GALAXY.colours.mid, x: 0, y: 0, z: 0, scale: 34, opacity: 0.13 },
      { color: GALAXY.colours.outside, x: -5, y: -1.2, z: 5, scale: 26, opacity: 0.08 },
      { color: GALAXY.colours.inside, x: 4.5, y: 0.9, z: -4, scale: 21, opacity: 0.1 },
    ]

    this.nebula = new Group()
    this.nebula.renderOrder = -2

    specs.forEach((spec) => {
      const material = new SpriteMaterial({
        map: texture,
        color: new Color(spec.color),
        transparent: true,
        opacity: spec.opacity,
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      })

      const sprite = new Sprite(material)
      sprite.position.set(spec.x, spec.y, spec.z)
      sprite.scale.setScalar(spec.scale)
      this.nebula.add(sprite)
    })

    this.group.add(this.nebula)
  }

  /* ── distant starfield ──────────────────────────────────── */

  buildStarfield() {
    const geometry = new BufferGeometry()
    const positions = new Float32Array(this.starCount * 3)
    const colors = new Float32Array(this.starCount * 3)
    const scales = new Float32Array(this.starCount)
    const phases = new Float32Array(this.starCount)
    const zeros = new Float32Array(this.starCount * 3)

    const palette = [
      new Color('#f1ede3'),
      new Color('#f1ede3'),
      new Color('#f1ede3'),
      new Color(GALAXY.colours.mid),
      new Color(GALAXY.colours.outside),
    ]

    for (let i = 0; i < this.starCount; i += 1) {
      const i3 = i * 3
      const radius = 34 + Math.random() * 72
      const theta = Math.random() * TAU
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62
      positions[i3 + 2] = radius * Math.cos(phi)

      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      scales[i] = 0.45 + Math.pow(Math.random(), 2.2) * 1.3
      phases[i] = Math.random()
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new BufferAttribute(scales, 1))
    geometry.setAttribute('aRandomness', new BufferAttribute(zeros, 3))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))

    this.starUniforms = {
      uTime: { value: 0 },
      uSize: { value: 150 },
      uPixelRatio: { value: this.pixelRatio },
      uSpin: { value: 0.0015 },
      uDrift: { value: 0.2 },
      uBrightness: { value: 0.95 },
    }

    this.starMaterial = new ShaderMaterial({
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
      transparent: true,
      vertexColors: true,
      vertexShader: galaxyVertexShader,
      fragmentShader: galaxyFragmentShader,
      uniforms: this.starUniforms,
    })

    this.starfield = new Points(geometry, this.starMaterial)
    this.starfield.frustumCulled = false
    this.starfield.renderOrder = -1
    this.group.add(this.starfield)
  }

  /* ── chapter nodes ───────────────────────────────────────── */

  buildNodes() {
    const positions = new Float32Array(this.nodes.length * 3)
    const indices = new Float32Array(this.nodes.length)
    const phases = new Float32Array(this.nodes.length)
    const sizes = new Float32Array(this.nodes.length)

    this.nodes.forEach((node, index) => {
      positions[index * 3] = node.position.x
      positions[index * 3 + 1] = node.position.y + 0.12
      positions[index * 3 + 2] = node.position.z

      indices[index] = index
      phases[index] = Math.random()
      sizes[index] = 1
    })

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aIndex', new BufferAttribute(indices, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    this.nodeGeometry = geometry

    this.nodeUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: this.pixelRatio },
      uPointSize: { value: 17 },
      uActive: { value: 0 },
      uHover: { value: -1 },
    }

    this.nodeMaterial = new ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      transparent: true,
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
      uniforms: this.nodeUniforms,
    })

    this.nodePoints = new Points(geometry, this.nodeMaterial)
    this.nodePoints.frustumCulled = false
    this.nodePoints.renderOrder = 3
    this.group.add(this.nodePoints)

    // Generous invisible spheres make raycasting reliable on touch screens.
    const hitGeometry = new SphereGeometry(0.85, 10, 10)
    const hitMaterial = new MeshBasicMaterial({ visible: false })

    this.nodes.forEach((node, index) => {
      const mesh = new Mesh(hitGeometry, hitMaterial)
      mesh.position.copy(node.position)
      mesh.userData.nodeIndex = index
      this.group.add(mesh)
      node.hitMesh = mesh
    })

    this.hitMeshes = this.nodes.map((node) => node.hitMesh)
    this.hitGeometry = hitGeometry
    this.hitMaterial = hitMaterial
  }

  buildTether() {
    const points = this.nodes.map(
      (node) => new Vector3(node.position.x, node.position.y + 0.22, node.position.z),
    )

    const geometry = new BufferGeometry().setFromPoints(points)
    const material = new LineBasicMaterial({
      color: new Color(GALAXY.colours.mid),
      transparent: true,
      opacity: 0.16,
      blending: AdditiveBlending,
      depthWrite: false,
    })

    this.tether = new Line(geometry, material)
    this.tether.frustumCulled = false
    this.tether.renderOrder = 2
    this.group.add(this.tether)
  }

  /* ── runtime ─────────────────────────────────────────────── */

  setActive(index) {
    if (this.nodeUniforms) this.nodeUniforms.uActive.value = index
  }

  setHover(index) {
    if (this.nodeUniforms) this.nodeUniforms.uHover.value = index ?? -1
  }

  setPixelRatio(pixelRatio) {
    this.pixelRatio = pixelRatio

    if (this.dustUniforms) this.dustUniforms.uPixelRatio.value = pixelRatio
    if (this.starUniforms) this.starUniforms.uPixelRatio.value = pixelRatio
    if (this.nodeUniforms) this.nodeUniforms.uPixelRatio.value = pixelRatio
  }

  /** Progressive quality: draw fewer dust particles, then hide the starfield. */
  setDensity(ratio) {
    const clamped = Math.min(1, Math.max(0.15, ratio))

    if (this.dust) {
      this.dust.geometry.setDrawRange(0, Math.floor(this.count * clamped))
    }

    if (this.starfield) {
      this.starfield.geometry.setDrawRange(0, Math.floor(this.starCount * clamped))
    }
  }

  setStarfieldVisible(visible) {
    if (this.starfield) this.starfield.visible = visible
    if (this.tether) this.tether.visible = visible
  }

  update(time, dt) {
    this.time = time
    const shaderTime = this.reduced ? 0 : time

    if (this.dustUniforms) this.dustUniforms.uTime.value = shaderTime
    if (this.starUniforms) this.starUniforms.uTime.value = shaderTime
    if (this.nodeUniforms) this.nodeUniforms.uTime.value = shaderTime

    if (!this.reduced) {
      this.starfield.rotation.y += dt * 0.006
      this.nebula.rotation.y += dt * 0.004
    }
  }

  getNodeByIndex(index) {
    return this.nodes[index] ?? null
  }

  dispose() {
    this.scene.remove(this.group)
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose())
        else child.material.dispose()
      }
    })
    this.nebulaTextures.forEach((texture) => texture.dispose())
    this.nebulaTextures.length = 0
  }
}
