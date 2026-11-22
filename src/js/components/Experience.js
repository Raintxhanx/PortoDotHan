import {
  Clock,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
} from 'three'

import GalaxyEngine from '@/js/galaxy/GalaxyEngine'
import CameraController from '@/js/galaxy/CameraController'
import PortfolioState from '@/js/galaxy/PortfolioState'
import UIProjector from '@/js/galaxy/UIProjector'
import PerformanceMonitor from '@/js/galaxy/PerformanceMonitor'
import { bindCardAutoAdvance } from '@/js/galaxy/CardScroll'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Render loop / scene manager.
 *
 * Responsibilities are deliberately narrow:
 *  - own the renderer, scene and camera
 *  - measure the document so scroll and the camera spline agree
 *  - tick the galaxy, camera rig, DOM projector and FPS watchdog
 *
 * Galaxy particles live in GalaxyEngine, navigation in CameraController and
 * the HUD in UIProjector.
 */
export default class Experience {
  constructor() {
    this.canvas = document.querySelector('.scene')
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.isMobile = this.getIsMobile()

    this.visible = true
    this.paused = false
    this.time = 0
    this.raf = null
    this.measureRaf = null
    this.scrollMeasureTimer = null
    this.hoverIndex = -1

    if (!this.canvas || !this.supportsWebGL()) {
      this.fallback()
      return
    }

    this.init()
  }

  getIsMobile() {
    return window.innerWidth < 768
  }

  supportsWebGL() {
    try {
      const canvas = document.createElement('canvas')
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
      )
    } catch (error) {
      return false
    }
  }

  fallback() {
    document.documentElement.classList.add('no-webgl')
    if (this.canvas) this.canvas.style.display = 'none'
  }

  init() {
    try {
      this.renderer = new WebGLRenderer({
        canvas: this.canvas,
        // Additive point sprites are already soft-edged; MSAA would only cost
        // fill-rate. This is the cheapest antialiasing decision we can make.
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      })
      this.renderer.setClearColor(0x000000, 0)
      this.renderer.outputEncoding = sRGBEncoding
      this.renderer.setPixelRatio(this.getPixelRatio())

      this.scene = new Scene()
      this.camera = new PerspectiveCamera(
        this.isMobile ? 60 : 46,
        window.innerWidth / window.innerHeight,
        0.1,
        240,
      )

      this.galaxy = new GalaxyEngine(this.scene, {
        isMobile: this.isMobile,
        reduced: this.reduced,
        pixelRatio: this.renderer.getPixelRatio(),
      })

      this.state = new PortfolioState(this.galaxy.nodes)

      this.cameraController = new CameraController({
        camera: this.camera,
        nodes: this.galaxy.nodes,
        state: this.state,
        isMobile: this.isMobile,
        reduced: this.reduced,
        onNodeSelect: (index) => this.focusSection(this.galaxy.nodes[index]?.id),
        onHoverChange: (index) => this.setHover(index),
      })

      this.uiProjector = new UIProjector({
        camera: this.camera,
        nodes: this.galaxy.nodes,
        state: this.state,
        isMobile: this.isMobile,
        onFocus: (id) => this.focusSection(id),
      })

      bindCardAutoAdvance(
        document.getElementById('orbit-card'),
        () => this.focusSection(this.neighbourId(+1)),
        () => this.focusSection(this.neighbourId(-1)),
      )

      this.performance = new PerformanceMonitor({
        renderer: this.renderer,
        galaxy: this.galaxy,
        isMobile: this.isMobile,
      })

      this.state.subscribe((detail) => {
        this.galaxy.setActive(detail.section.index)
        document.body.dataset.scene = detail.id
      })

      this.galaxy.setActive(this.state.getActiveSection()?.index ?? 0)
      document.body.dataset.scene = this.state.active

      this.bind()
      this.resize()

      if (this.reduced) this.cameraController.update(0)
      else this.cameraController.update(0.016)

      this.clock = new Clock()
      this.clock.start()
      this.draw()

      if (new URLSearchParams(window.location.search).has('debug')) {
        window.__experience = this
      }
    } catch (error) {
      console.warn('[experience] WebGL scene could not start:', error)
      this.fallback()
    }
  }

  getPixelRatio() {
    const cap = this.performance && this.performance.tier > 0 ? 1 : 2
    return Math.min(window.devicePixelRatio || 1, cap)
  }

  /* ── document measurements ───────────────────────────────── */

  measure() {
    if (!this.cameraController) return

    // The galaxy belongs to the opening track only. Static content below the
    // track (the SEO dossier) must not stretch the camera anchors.
    const track = document.querySelector('#galaxy-track')
    const trackRect = track?.getBoundingClientRect()
    const trackBottom = trackRect
      ? trackRect.bottom + window.scrollY
      : document.documentElement.scrollHeight
    const documentMax = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    )

    const maxScroll = Math.max(0, Math.min(documentMax, trackBottom - window.innerHeight))
    const viewport = window.innerHeight
    const last = this.galaxy.nodes.length - 1

    const anchors = this.galaxy.nodes.map((node, index) => {
      if (index === 0) return 0
      if (index === last) return maxScroll

      const element = document.querySelector(`section[data-scene="${node.id}"]`)
      if (!element) return (maxScroll * index) / last

      const top = element.getBoundingClientRect().top + window.scrollY
      return clamp(top + element.offsetHeight / 2 - viewport / 2, 0, maxScroll)
    })

    for (let i = 1; i < anchors.length; i += 1) {
      const ceiling = Math.max(anchors[i - 1] + 1, maxScroll - (last - i))
      anchors[i] = Math.min(Math.max(anchors[i], anchors[i - 1] + 1), ceiling)
    }
    anchors[last] = maxScroll

    this.anchors = anchors
    this.cameraController.setAnchors(anchors)
  }

  scheduleMeasure() {
    if (this.measureRaf) return

    this.measureRaf = requestAnimationFrame(() => {
      this.measureRaf = null
      this.measure()
    })
  }

  /* ── public API ──────────────────────────────────────────── */

  /** Kept for the existing IntersectionObserver in index.js. */
  updateState(name) {
    if (!this.state) return
    // While a fly-to is in progress the target chapter is already active; do
    // not let sections passing under the viewport flash the HUD mid-flight.
    if (this.cameraController?.isFlying) return
    this.state.setActive(name)
  }

  focusSection(id) {
    if (!id || !this.state) return

    const section = this.state.getSection(id)
    if (!section) return

    this.state.setActive(id)
    this.cameraController.focus(section.index)
  }

  /** Stop rendering while the visitor reads the static content below. */
  setPaused(paused) {
    this.paused = Boolean(paused)
    if (!this.paused) this.clock?.getDelta()
  }

  setHover(index) {
    this.hoverIndex = index

    this.galaxy?.setHover(index)
    this.uiProjector?.setHover(index)

    window.dispatchEvent(
      new CustomEvent('galaxy:hover', { detail: { index } }),
    )
  }

  /** Keep the HUD/nav in step with free scrolling, not just direct clicks. */
  syncActiveSection() {
    if (!this.state || !this.cameraController || this.cameraController.isFlying) return

    const progress = this.cameraController.progress
    const index = Math.round(progress)
    const node = this.galaxy.nodes[index]

    if (!node) return
    // Only commit once the camera has settled near a waypoint, so the card does
    // not flicker through every chapter it passes on a long scroll.
    if (Math.abs(progress - index) > 0.42) return
    if (this.state.active !== node.id) this.state.setActive(node.id)
  }

  neighbourId(step) {
    const i = this.state.getActiveSection().index + step
    return this.galaxy.nodes[i]?.id
  }

  /* ── events ──────────────────────────────────────────────── */

  bind() {
    this.onResize = () => this.resize()

    this.onVisibility = () => {
      this.visible = !document.hidden
      if (this.visible && this.clock) this.clock.getDelta()
    }

    // Some sections change height after fonts, images or the mobile sheet
    // settle. Re-measure once scrolling stops so the last anchor is never
    // stranded past the real maximum scroll.
    this.onScrollMeasure = () => {
      clearTimeout(this.scrollMeasureTimer)
      this.scrollMeasureTimer = setTimeout(() => this.scheduleMeasure(), 180)
    }

    window.addEventListener('resize', this.onResize, { passive: true })
    window.addEventListener('scroll', this.onScrollMeasure, { passive: true })
    document.addEventListener('visibilitychange', this.onVisibility)

    window.addEventListener('load', () => this.scheduleMeasure(), { once: true })
    document.fonts?.ready?.then(() => this.scheduleMeasure())

    const main = document.querySelector('main')
    if (main && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure())
      this.resizeObserver.observe(main)
    }

    window.addEventListener('galaxy:quality', (event) => {
      document.documentElement.dataset.galaxyQuality = String(event.detail.tier)
    })
  }

  resize() {
    if (!this.renderer) return

    const wasMobile = this.isMobile
    this.isMobile = this.getIsMobile()

    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.fov = this.isMobile ? 60 : 46
    this.camera.updateProjectionMatrix()

    const pixelRatio = this.getPixelRatio()
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.galaxy.setPixelRatio(pixelRatio)

    if (wasMobile !== this.isMobile) {
      this.cameraController.setViewport(this.isMobile)
      this.uiProjector.setViewport(this.isMobile)
    }

    this.scheduleMeasure()
  }

  /* ── render loop ─────────────────────────────────────────── */

  draw = () => {
    this.raf = requestAnimationFrame(this.draw)

    const dt = Math.min(this.clock.getDelta(), 0.05)
    if (!this.visible || this.paused) return

    this.time += dt

    this.cameraController.update(dt)
    this.syncActiveSection()
    this.camera.updateMatrixWorld()

    this.galaxy.update(this.time, dt)
    this.uiProjector.update(this.cameraController.progress)
    this.performance.tick(dt)

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    cancelAnimationFrame(this.measureRaf)
    clearTimeout(this.scrollMeasureTimer)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('scroll', this.onScrollMeasure)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.resizeObserver?.disconnect()
    this.cameraController?.dispose()
    this.uiProjector?.dispose()
    this.galaxy?.dispose()
    this.renderer?.dispose()
  }
}
