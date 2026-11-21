/**
 * Lightweight FPS watchdog.
 *
 * We never ship post-processing to this scene, and points are shader-soft, so
 * the two meaningful levers when a device struggles are pixel ratio and the
 * number of dust particles. Both are reduced progressively and never restored
 * (avoids oscillation between quality levels).
 */
export default class PerformanceMonitor {
  constructor({ renderer, galaxy, isMobile = false }) {
    this.renderer = renderer
    this.galaxy = galaxy
    this.isMobile = isMobile

    this.grace = 2.6
    this.elapsed = 0
    this.frames = 0
    this.fps = 60
    this.lowStreak = 0
    this.tier = 0
    this.enabled = true
  }

  tick(dt) {
    if (!this.enabled) return

    if (this.grace > 0) {
      this.grace -= dt
      return
    }

    this.elapsed += dt
    this.frames += 1

    if (this.elapsed < 1) return

    this.fps = this.frames / this.elapsed
    this.elapsed = 0
    this.frames = 0

    if (this.fps < 45) this.lowStreak += 1
    else this.lowStreak = 0

    if (this.lowStreak >= 3) this.degrade()
  }

  degrade() {
    if (this.tier >= 2) {
      this.enabled = false
      return
    }

    this.tier += 1
    this.lowStreak = 0

    if (this.tier === 1) {
      this.renderer.setPixelRatio(1)
      this.galaxy.setPixelRatio(1)
      this.galaxy.setDensity(0.65)
    } else {
      this.galaxy.setDensity(0.4)
      this.galaxy.setStarfieldVisible(false)
      this.enabled = false
    }

    window.dispatchEvent(
      new CustomEvent('galaxy:quality', {
        detail: { tier: this.tier, fps: this.fps },
      }),
    )
  }
}
