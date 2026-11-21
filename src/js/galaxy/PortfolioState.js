/**
 * Tiny state manager shared by the camera, the galaxy and the DOM HUD.
 *
 * The active chapter is the only piece of state that React-less UI cares
 * about. Camera progress is read directly from CameraController every frame
 * so nothing is allocated or broadcast inside the render loop.
 */
export default class PortfolioState {
  constructor(sections) {
    this.sections = sections
    this.byId = new Map(sections.map((section) => [section.id, section]))
    this.active = sections[0]?.id ?? null
    this.listeners = new Set()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  setActive(id) {
    if (!this.byId.has(id) || id === this.active) return

    const previous = this.active
    this.active = id

    const detail = {
      id,
      previous,
      section: this.byId.get(id),
    }

    this.listeners.forEach((listener) => listener(detail))
    window.dispatchEvent(new CustomEvent('galaxy:section', { detail }))
  }

  getSection(id) {
    return this.byId.get(id) ?? null
  }

  getActiveSection() {
    return this.byId.get(this.active) ?? null
  }
}
