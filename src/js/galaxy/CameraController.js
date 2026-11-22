import { CatmullRomCurve3, MathUtils, Raycaster, Vector2, Vector3 } from 'three'
import { DEG } from './galaxyConfig'

const UP = new Vector3(0, 1, 0)
const INTERACTIVE = 'a, button, input, textarea, select, [data-no-raycast], #orbit-card'

const clamp = MathUtils.clamp
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Hybrid camera rig.
 *
 *  • Scroll moves the camera along a CatmullRom spline through the six chapter
 *    waypoints. The spline parameter is derived from the *measured* scroll
 *    position of each <section>, so the camera always reaches a node exactly
 *    when that chapter is centred in the viewport.
 *  • Clicking a node (raycast) or the DOM HUD flies to that waypoint and
 *    temporarily locks scroll, then hands control back to the user.
 */
export default class CameraController {
  constructor({
    camera,
    nodes,
    state,
    isMobile = false,
    reduced = false,
    onNodeSelect = () => {},
    onHoverChange = () => {},
  }) {
    this.camera = camera
    this.nodes = nodes
    this.state = state
    this.isMobile = isMobile
    this.reduced = reduced
    this.onNodeSelect = onNodeSelect
    this.onHoverChange = onHoverChange

    this.u = 0
    this.targetU = 0
    this.progress = 0
    this.anchors = []
    this.flight = null
    this.previousScrollBehavior = null

    this.pointer = new Vector2(0, 0)
    this.pointerTarget = new Vector2(0, 0)
    this.needsRaycast = false
    this.pointerOverUI = false
    this.hoverIndex = -1
    this.pointerDown = { x: 0, y: 0, time: 0 }

    this.raycaster = new Raycaster()
    this.hitMeshes = nodes.map((node) => node.hitMesh).filter(Boolean)

    // Reused every frame so the render loop never allocates.
    this._camPos = new Vector3()
    this._lookPos = new Vector3()
    this._forward = new Vector3()
    this._right = new Vector3()
    this._up = new Vector3()
    this._radial = new Vector3()
    this._tangent = new Vector3()
    this._direction = new Vector3()
    this._temp = new Vector3()

    this.buildPath()
    this.bind()
  }

  /* ── path ────────────────────────────────────────────────── */

  buildPath() {
    const camPoints = []
    const lookPoints = []

    this.nodes.forEach((node) => {
      const { distance, height, swirl } = node.camera

      this._radial.set(node.position.x, 0, node.position.z)
      if (this._radial.lengthSq() < 0.04) this._radial.set(1, 0, 0.35)
      this._radial.normalize()

      this._tangent.set(-this._radial.z, 0, this._radial.x)

      const angle = swirl * DEG
      this._direction
        .copy(this._radial)
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(this._tangent, Math.sin(angle))

      const camPos = node.position
        .clone()
        .addScaledVector(this._direction, distance)
        .add(this._temp.set(0, height, 0))

      // Keep the spline point on the node so the fly-to can reuse it.
      node.camPosition = camPos

      // Build a tiny camera basis so the node can be framed off-centre.
      // On desktop the node sits right-of-centre (content lives on the left);
      // on mobile it sits above the bottom sheet.
      this._forward.copy(node.position).sub(camPos).normalize()
      this._right.crossVectors(this._forward, UP)
      if (this._right.lengthSq() < 1e-6) this._right.set(1, 0, 0)
      this._right.normalize()
      this._up.crossVectors(this._right, this._forward).normalize()

      const shiftX = this.isMobile ? 0 : -distance * 0.24
      const shiftY = this.isMobile ? -distance * 0.19 : -distance * 0.045
      const look = node.position
        .clone()
        .addScaledVector(this._right, shiftX)
        .addScaledVector(this._up, shiftY)

      camPoints.push(camPos)
      lookPoints.push(look)
    })

    this.cameraPath = new CatmullRomCurve3(camPoints, false, 'catmullrom', 0.5)
    this.lookPath = new CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.5)
  }

  setViewport(isMobile) {
    if (isMobile === this.isMobile) return
    this.isMobile = isMobile
    this.buildPath()
  }

  /* ── scroll anchors ──────────────────────────────────────── */

  setAnchors(anchors) {
    if (!anchors || anchors.length !== this.nodes.length) return

    // Anchors must be monotonic or the interpolation folds back on itself.
    this.anchors = anchors.reduce((list, value, index) => {
      const previous = index === 0 ? -Infinity : list[index - 1]
      list.push(Math.max(value, previous + 1))
      return list
    }, [])

    // The galaxy track can end before the document does (the homepage dossier
    // continues below it). Cache its maximum scroll so fly-to never escapes it.
    this.scrollMax = this.anchors[this.anchors.length - 1] ?? 0
  }

  updateTargetFromScroll() {
    const anchors = this.anchors
    const last = anchors.length - 1

    if (last < 1) {
      this.targetU = 0
      return
    }

    const y = window.scrollY

    if (y <= anchors[0]) {
      this.targetU = 0
      return
    }

    if (y >= anchors[last]) {
      this.targetU = 1
      return
    }

    let index = 0
    while (index < last - 1 && y > anchors[index + 1]) index += 1

    const span = Math.max(1, anchors[index + 1] - anchors[index])
    const local = clamp((y - anchors[index]) / span, 0, 1)
    this.targetU = (index + local) / last
  }

  /* ── fly-to ──────────────────────────────────────────────── */

  /** True while a chapter-to-chapter flight owns the camera. */
  get isFlying() {
    return Boolean(this.flight)
  }

  /** Backwards-compatible alias used by the section observer. */
  get locked() {
    return Boolean(this.flight)
  }

  focus(index) {
    const node = this.nodes[index]
    if (!node) return

    const last = Math.max(1, this.nodes.length - 1)
    const toU = index / last
    const fromU = this.u
    const toScroll = this.anchors[index] ?? toU * this.maxScroll()
    const fromScroll = window.scrollY
    const distance = Math.abs(toU - fromU) * last
    const duration = this.reduced ? 0 : Math.min(2.4, 1.15 + distance * 0.16)

    this.targetU = toU

    if (this.reduced) {
      this.u = toU
      this.scrollInstant(toScroll)
      return
    }

    // Restarting from the current position keeps repeated clicks smooth instead
    // of snapping back to the spline point of the previous flight.
    this.beginScrollOverride()
    this.flight = {
      fromU,
      toU,
      fromScroll,
      toScroll,
      elapsed: 0,
      duration,
    }
  }

  cancelFly() {
    if (!this.flight) return

    this.flight = null
    this.endScrollOverride()
    // Adopt the current scroll position as the new target so control returns
    // to the user without a visible jump.
    this.updateTargetFromScroll()
  }

  maxScroll() {
    if (Number.isFinite(this.scrollMax)) return this.scrollMax
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  }

  beginScrollOverride() {
    if (this.previousScrollBehavior !== null) return
    this.previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
  }

  endScrollOverride() {
    if (this.previousScrollBehavior === null) return
    document.documentElement.style.scrollBehavior = this.previousScrollBehavior
    this.previousScrollBehavior = null
  }

  scrollInstant(top) {
    try {
      window.scrollTo({ top, left: 0, behavior: 'instant' })
    } catch (error) {
      window.scrollTo(0, top)
    }
  }

  /* ── frame update ────────────────────────────────────────── */

  update(dt) {
    if (this.flight) {
      const flight = this.flight
      flight.elapsed += dt

      const t = clamp(flight.elapsed / flight.duration, 0, 1)
      const eased = easeInOutCubic(t)

      // Drive the spline parameter directly. The camera is always evaluated
      // from the same path as scroll, so the hand-off at the end is seamless.
      this.u = flight.fromU + (flight.toU - flight.fromU) * eased
      this.scrollInstant(
        flight.fromScroll + (flight.toScroll - flight.fromScroll) * eased,
      )
      this.pointerTarget.set(0, 0)

      if (t >= 1) {
        this.u = flight.toU
        this.targetU = flight.toU
        this.scrollInstant(flight.toScroll)
        this.flight = null
        this.endScrollOverride()
      }
    } else {
      this.updateTargetFromScroll()

      const speed = this.reduced ? 100 : 2.75
      this.u = damp(this.u, this.targetU, speed, dt)
    }

    this.progress = this.u * (this.nodes.length - 1)

    this.updatePointer(dt)
    this.updateCamera(dt, false)
    this.updateRaycast()
  }

  updatePointer(dt) {
    if (this.isMobile || this.reduced) {
      this.pointer.set(0, 0)
      return
    }

    const speed = 4.5
    this.pointer.x = damp(this.pointer.x, this.pointerTarget.x, speed, dt)
    this.pointer.y = damp(this.pointer.y, this.pointerTarget.y, speed, dt)
  }

  updateCamera(dt, force) {
    const u = clamp(this.u, 0, 1)

    this.cameraPath.getPoint(u, this._camPos)
    this.lookPath.getPoint(u, this._lookPos)

    if (!this.reduced && !force && !this.isMobile) {
      this._forward.copy(this._lookPos).sub(this._camPos).normalize()
      this._right.crossVectors(this._forward, UP).normalize()
      this._up.crossVectors(this._right, this._forward).normalize()

      this.camera.position
        .copy(this._camPos)
        .addScaledVector(this._right, this.pointer.x * 0.38)
        .addScaledVector(this._up, this.pointer.y * 0.24)
    } else {
      this.camera.position.copy(this._camPos)
    }

    this.camera.lookAt(this._lookPos)
  }

  updateRaycast() {
    if (!this.needsRaycast) return
    this.needsRaycast = false

    if (this.pointerOverUI) {
      this.setHover(-1)
      return
    }

    this.raycaster.setFromCamera(this.pointerTarget, this.camera)
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false)

    this.setHover(hits.length ? hits[0].object.userData.nodeIndex : -1)
  }

  setHover(index) {
    if (index === this.hoverIndex) return
    this.hoverIndex = index
    this.onHoverChange(index)
  }

  /* ── events ──────────────────────────────────────────────── */

  bind() {
    this.onPointerMove = (event) => {
      this.pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1
      this.pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1)
      this.pointerOverUI = Boolean(event.target.closest?.(INTERACTIVE))
      this.needsRaycast = true
    }

    this.onPointerDown = (event) => {
      this.pointerDown.x = event.clientX
      this.pointerDown.y = event.clientY
      this.pointerDown.time = performance.now()
    }

    this.onClick = (event) => {
      if (event.target.closest?.(INTERACTIVE)) return

      const travel = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y)
      if (travel > 12 || performance.now() - this.pointerDown.time > 650) return

      const pointer = new Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      )

      this.raycaster.setFromCamera(pointer, this.camera)
      const hits = this.raycaster.intersectObjects(this.hitMeshes, false)

      if (hits.length) {
        const index = hits[0].object.userData.nodeIndex
        this.setHover(index)
        this.onNodeSelect(index)
      }
    }

    // Any deliberate scroll input cancels a fly-to and returns control. Ignore
    // events that originate inside the chapter card: those advance chapters
    // themselves and must not kill the flight they just started.
    this.onUserScroll = (event) => {
      if (event?.target?.closest?.(INTERACTIVE)) return
      if (this.flight) this.cancelFly()
    }

    this.onBlur = () => this.setHover(-1)

    this.onPointerLeave = () => {
      this.pointerTarget.set(0, 0)
      this.setHover(-1)
    }

    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true })
    window.addEventListener('click', this.onClick)
    window.addEventListener('wheel', this.onUserScroll, { passive: true })
    window.addEventListener('touchmove', this.onUserScroll, { passive: true })
    window.addEventListener('blur', this.onBlur)
    document.addEventListener('pointerleave', this.onPointerLeave)
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('click', this.onClick)
    window.removeEventListener('wheel', this.onUserScroll)
    window.removeEventListener('touchmove', this.onUserScroll)
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('pointerleave', this.onPointerLeave)
  }
}
