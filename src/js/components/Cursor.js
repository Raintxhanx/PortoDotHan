const LABELS = {
  view: 'View ↗',
  copy: 'Copy',
  open: 'Open ↗',
  explore: 'Explore',
  read: 'Read',
  email: 'Email ↗',
  wish: 'Wish',
}

export default class Cursor {
  constructor() {
    this.el = document.querySelector('.cursor')
    if (!this.el) return

    this.fine = window.matchMedia('(pointer: fine)').matches
    if (!this.fine) {
      this.el.remove()
      return
    }

    this.dot = this.el.querySelector('.cursor__dot')
    this.ring = this.el.querySelector('.cursor__ring')
    this.label = this.el.querySelector('.cursor__label')

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    this.dotPos = { ...this.mouse }
    this.ringPos = { ...this.mouse }
    this.hovering = false

    document.documentElement.classList.add('has-cursor')

    this.bind()
    this.loop()
  }

  bind() {
    window.addEventListener(
      'pointermove',
      (event) => {
        this.mouse.x = event.clientX
        this.mouse.y = event.clientY
      },
      { passive: true },
    )

    document.addEventListener('pointerover', (event) => {
      const target = event.target.closest('[data-cursor]')
      const interactive = event.target.closest('a, button, [data-magnetic]')

      if (target) {
        const key = target.dataset.cursor
        this.label.textContent = LABELS[key] || ''
        this.el.classList.add('is-active')
        if (key === 'view' || key === 'wish') this.el.classList.add('is-gold')
        this.hovering = true
      } else if (interactive) {
        this.el.classList.add('is-hover')
        this.hovering = true
      }
    })

    document.addEventListener('pointerout', (event) => {
      const next = event.relatedTarget
      if (next && next.closest && next.closest('a, button, [data-cursor], [data-magnetic]')) return
      this.clear()
    })

    document.addEventListener('pointerdown', () => this.el.classList.add('is-down'))
    document.addEventListener('pointerup', () => this.el.classList.remove('is-down'))

    window.addEventListener('blur', () => this.clear())

    // magnetic elements
    document.querySelectorAll('[data-magnetic]').forEach((element) => {
      element.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect()
        const x = event.clientX - (rect.left + rect.width / 2)
        const y = event.clientY - (rect.top + rect.height / 2)
        element.style.transform = `translate(${x * 0.16}px, ${y * 0.22}px)`
      })

      element.addEventListener('pointerleave', () => {
        element.style.transform = ''
      })
    })
  }

  clear() {
    this.el.classList.remove('is-active', 'is-hover', 'is-gold', 'is-down')
    this.label.textContent = ''
    this.hovering = false
  }

  loop = () => {
    this.dotPos.x += (this.mouse.x - this.dotPos.x) * 0.55
    this.dotPos.y += (this.mouse.y - this.dotPos.y) * 0.55
    this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.14
    this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.14

    this.dot.style.transform = `translate3d(${this.dotPos.x}px, ${this.dotPos.y}px, 0)`
    this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`

    this.raf = requestAnimationFrame(this.loop)
  }
}
