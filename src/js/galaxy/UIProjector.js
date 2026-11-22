import { MathUtils, Vector3 } from 'three'
import { CHAPTER_DETAILS } from '@/js/data/content'

const clamp = MathUtils.clamp

/**
 * Projects 3D chapter nodes into DOM space.
 *
 * The markers and the chapter card are ordinary HTML elements. Every frame we
 * write a single `transform: translate3d(...)` to each one (never layout
 * properties), and clamp the card to the viewport with an automatic
 * left/right/top/bottom anchor so it can never be cut off by an edge.
 */
export default class UIProjector {
  constructor({ camera, nodes, state, onFocus = () => {}, isMobile = false }) {
    this.camera = camera
    this.nodes = nodes
    this.state = state
    this.onFocus = onFocus
    this.isMobile = isMobile

    this.root = document.querySelector('#orbit')
    this.markerLayer = document.querySelector('#orbit-markers')
    this.card = document.querySelector('#orbit-card')

    this.enabled = Boolean(this.root && this.markerLayer && this.card)
    if (!this.enabled) return

    this.els = {
      index: document.querySelector('#orbit-index'),
      label: document.querySelector('#orbit-label'),
      count: document.querySelector('#orbit-count'),
      title: document.querySelector('#orbit-title'),
      blurb: document.querySelector('#orbit-blurb'),
      meta: document.querySelector('#orbit-meta'),
      details: document.querySelector('#orbit-details'),
      cta: document.querySelector('#orbit-cta'),
      ctaLabel: document.querySelector('#orbit-cta-label'),
      toggle: document.querySelector('#orbit-toggle'),
      body: document.querySelector('#orbit-body'),
    }

    this.activeId = null
    this.nextId = null
    this.cardVisible = false
    this.markerVisible = new Array(nodes.length).fill(null)
    this.cardW = 320
    this.cardH = 220
    this.mobile = isMobile
    this.expanded = false
    this.pinned = false

    this._v = new Vector3()
    this.activeScreen = { x: 0, y: 0, visible: false }

    this.buildMarkers()
    this.bind()

    this.setViewport(isMobile)
    this.setActive(state.active)

    this.unsubscribe = state.subscribe((detail) => this.setActive(detail.id))
  }

  /* ── DOM ─────────────────────────────────────────────────── */

  buildMarkers() {
    this.markerEls = this.nodes.map((node) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'orbit-marker'
      button.dataset.node = node.id
      button.dataset.cursor = 'fly'
      button.style.setProperty('--orbit-accent', node.accent)
      button.setAttribute('aria-label', `Terbang ke ${node.label}`)

      const dot = document.createElement('span')
      dot.className = 'orbit-marker__dot'
      dot.setAttribute('aria-hidden', 'true')

      const index = document.createElement('span')
      index.className = 'orbit-marker__index mono'
      index.textContent = node.number

      const label = document.createElement('span')
      label.className = 'orbit-marker__label'
      label.textContent = node.label

      button.append(dot, index, label)
      button.addEventListener('click', () => this.onFocus(node.id))

      this.markerLayer.appendChild(button)
      return button
    })
  }

  bind() {
    this.onToggle = () => {
      const next = !this.expanded
      this.pinned = next
      this.setExpanded(next)
    }

    this.els.toggle?.addEventListener('click', this.onToggle)

    this.onCtaClick = (event) => {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.pinned = false
      this.setExpanded(false)
      if (this.nextId) this.onFocus(this.nextId)
    }

    this.els.cta?.addEventListener('click', this.onCtaClick)

    /* ── phones: pull the sheet up / push it down ──────────── */

    this.onCardPointerDown = (event) => {
      if (!this.mobile) return
      if (event.target.closest?.('a, button, #orbit-body')) return
      this.dragStart = { x: event.clientX, y: event.clientY }
    }

    this.onCardPointerUp = (event) => {
      if (!this.mobile || !this.dragStart) return

      const dx = event.clientX - this.dragStart.x
      const dy = event.clientY - this.dragStart.y
      this.dragStart = null

      if (Math.abs(dy) < 34 || Math.abs(dx) > Math.abs(dy)) return

      this.pinned = dy < 0
      this.setExpanded(dy < 0)
    }

    this.onTopClick = (event) => {
      if (!this.mobile || event.target.closest?.('a, button')) return
      this.pinned = !this.expanded
      this.setExpanded(!this.expanded)
    }

    this.card.addEventListener('pointerdown', this.onCardPointerDown)
    this.card.addEventListener('pointerup', this.onCardPointerUp)
    this.els.toggle?.parentElement?.addEventListener('click', this.onTopClick)

    // Desktop opens the card with the chapter and collapses it again when the
    // pointer leaves. Pinning via the toggle keeps it open until dismissed.
    this.onCardEnter = () => {
      if (!this.mobile && !this.pinned) this.setExpanded(true)
    }

    this.onCardLeave = () => {
      if (this.mobile || this.pinned) return
      if (this.card.contains(document.activeElement)) return
      this.setExpanded(false)
    }

    this.onCardFocusIn = () => {
      if (!this.mobile) this.setExpanded(true)
    }

    this.onCardFocusOut = (event) => {
      if (this.mobile || this.pinned) return
      if (this.card.contains(event.relatedTarget)) return
      this.setExpanded(false)
    }

    this.card.addEventListener('pointerenter', this.onCardEnter)
    this.card.addEventListener('pointerleave', this.onCardLeave)
    this.card.addEventListener('focusin', this.onCardFocusIn)
    this.card.addEventListener('focusout', this.onCardFocusOut)
  }

  setExpanded(expanded) {
    this.expanded = Boolean(expanded)

    this.card.classList.toggle('is-expanded', this.expanded)
    this.els.toggle?.setAttribute('aria-expanded', String(this.expanded))
    this.els.toggle?.setAttribute(
      'aria-label',
      this.expanded ? 'Tutup detail bab' : 'Buka detail bab',
    )

    if (this.els.body) {
      if (this.expanded) {
        this.els.body.removeAttribute('inert')
        this.els.body.removeAttribute('aria-hidden')
      } else {
        this.els.body.setAttribute('inert', '')
        this.els.body.setAttribute('aria-hidden', 'true')
      }
    }

    if (!this.expanded) this.measureCard()
  }

  isOrigin() {
    return this.activeId === 'hero'
  }

  setActive(id) {
    if (!this.enabled || id === this.activeId) return

    const section = this.state.getSection(id)
    if (!section) return

    this.activeId = id
    this.card.style.setProperty('--orbit-accent', section.accent)

    const lastIndex = this.nodes.length - 1
    const next = this.nodes[(section.index + 1) % this.nodes.length]
    this.nextId = next?.id ?? this.nodes[0]?.id ?? null

    if (this.els.index) this.els.index.textContent = section.number
    if (this.els.label) this.els.label.textContent = section.label
    if (this.els.count) {
      this.els.count.textContent = `${section.number} / ${String(lastIndex).padStart(2, '0')}`
    }
    if (this.els.title) this.els.title.innerHTML = section.title
    if (this.els.blurb) this.els.blurb.textContent = section.blurb

    if (this.els.details) {
      this.els.details.innerHTML = CHAPTER_DETAILS[id]?.html ?? ''
    }

    if (this.els.cta) this.els.cta.setAttribute('href', `#${this.nextId ?? section.href.replace(/^#/, '')}`)
    if (this.els.ctaLabel) {
      this.els.ctaLabel.textContent = section.index === lastIndex ? 'Kembali ke awal' : 'Bab berikutnya'
    }

    if (this.els.meta) {
      const items = section.meta.map((text) => {
        const item = document.createElement('li')
        item.textContent = text
        return item
      })
      this.els.meta.replaceChildren(...items)
    }

    this.card.setAttribute('aria-label', `Bab ${section.label} — ${section.title.replace(/<[^>]*>/g, '')}`)

    this.markerEls.forEach((element, index) => {
      element.classList.toggle('is-active', index === section.index)
    })

    // Desktop opens the chapter summary right away now that the card carries
    // the portfolio copy; phones keep the compact bottom sheet and let the
    // visitor pull it up.
    this.card.classList.remove('is-expanded')
    if (this.els.body) this.els.body.scrollTop = 0
    this.pinned = false
    this.setExpanded(!this.mobile)

    if (this.isOrigin()) this.setCardVisible(false)

    // Content changed: cache the new card size once, not every frame.
    this.measureCard()
  }

  setHover(index) {
    if (!this.enabled) return

    this.markerEls.forEach((element, markerIndex) => {
      element.classList.toggle('is-hover', markerIndex === index)
    })
  }

  setViewport(isMobile) {
    if (!this.enabled) return

    this.mobile = isMobile
    this.root.classList.toggle('is-mobile', isMobile)

    if (isMobile) {
      this.card.style.transform = ''
      this.pinned = false
      this.setExpanded(false)
      this.setCardVisible(!this.isOrigin())
    } else {
      this.pinned = false
      this.setExpanded(!this.isOrigin())
      this.setCardVisible(false)
    }

    this.measureCard()
  }

  measureCard() {
    if (!this.enabled) return

    // Measure the card as if it were open so it is positioned for the space it
    // needs on hover, not just for the compact title bar. Temporarily disable
    // the max-height transition so the layout is final in this frame.
    const body = this.els.body
    const previousTransition = body?.style.transition ?? ''
    const previousMaxHeight = body?.style.maxHeight ?? ''

    if (body) {
      body.style.transition = 'none'
      body.style.maxHeight = 'none'
    }

    const rect = this.card.getBoundingClientRect()
    this.cardW = rect.width || 320
    this.cardH = rect.height || 220

    if (body) {
      body.style.transition = previousTransition
      body.style.maxHeight = previousMaxHeight
    }
  }

  /* ── per-frame projection ────────────────────────────────── */

  update(progress) {
    if (!this.enabled) return

    if (this.mobile) {
      this.setCardVisible(!this.isOrigin())
      return
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const activeIndex = this.state.getActiveSection()?.index ?? 0

    this.activeScreen.visible = false

    this.nodes.forEach((node, index) => {
      const element = this.markerEls[index]
      if (!element) return

      this._v.copy(node.position)
      this._v.y += 0.12
      this._v.project(this.camera)

      const behind = this._v.z > 1 || this._v.z < -1
      const x = (this._v.x * 0.5 + 0.5) * width
      const y = (-(this._v.y * 0.5) + 0.5) * height

      // Keep the HUD quiet: a chapter four spline stops away is not a useful
      // click target and would otherwise float over unrelated page copy.
      const nearby = Math.abs(progress - index) <= 2.15
      const onScreen =
        nearby && !behind && x > -90 && x < width + 90 && y > -70 && y < height + 70

      if (onScreen) {
        element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)`
      }

      if (this.markerVisible[index] !== onScreen) {
        this.markerVisible[index] = onScreen
        element.classList.toggle('is-off', !onScreen)
        element.tabIndex = onScreen ? 0 : -1
      }

      if (index === activeIndex) {
        this.activeScreen.x = x
        this.activeScreen.y = y
        this.activeScreen.visible = onScreen
      }
    })

    const proximity = Math.abs(progress - activeIndex)
    const visible =
      !this.isOrigin() && this.activeScreen.visible && proximity < 0.5

    this.setCardVisible(visible)
    if (visible) this.positionCard(this.activeScreen.x, this.activeScreen.y, width, height)
  }

  positionCard(nodeX, nodeY, width, height) {
    const pad = 24
    const gap = 26
    const topSafe = 96
    const bottomSafe = 28

    // Measure the card as it is right now (collapsed or expanded) and the
    // active marker itself, so the card really sits beside the star label.
    const cardRect = this.card.getBoundingClientRect()
    const cw = cardRect.width || this.cardW
    const ch = cardRect.height || this.cardH

    const markerEl = this.markerEls[this.state.getActiveSection()?.index ?? -1]
    const markerRect = markerEl?.getBoundingClientRect()
    const markerRight = markerRect?.width ? markerRect.right : nodeX + 12
    const markerLeft = markerRect?.width ? markerRect.left : nodeX - 12

    const rightX = markerRight + gap
    const leftX = markerLeft - gap - cw

    let side = 'right'
    let x = rightX
    let y = nodeY - ch * 0.5

    if (rightX + cw > width - pad) {
      if (leftX >= pad) {
        side = 'left'
        x = leftX
      } else {
        // Neither side has room (narrow desktop): centre it under the marker.
        side = 'center'
        x = clamp(nodeX - cw * 0.5, pad, Math.max(pad, width - cw - pad))
        const below = (markerRect?.bottom ?? nodeY + 12) + gap
        y = below + ch <= height - bottomSafe ? below : nodeY - gap - ch
      }
    }

    x = clamp(x, pad, Math.max(pad, width - cw - pad))
    y = clamp(y, topSafe, Math.max(topSafe, height - ch - bottomSafe))

    this.card.dataset.side = side
    this.card.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
  }

  setCardVisible(visible) {
    if (this.cardVisible === visible) return

    this.cardVisible = visible
    this.card.classList.toggle('is-visible', visible)
    this.card.toggleAttribute('inert', !visible)
    this.card.setAttribute('aria-hidden', String(!visible))
  }

  dispose() {
    this.unsubscribe?.()
    this.els.toggle?.removeEventListener('click', this.onToggle)
    this.els.cta?.removeEventListener('click', this.onCtaClick)
    this.card?.removeEventListener('pointerenter', this.onCardEnter)
    this.card?.removeEventListener('pointerleave', this.onCardLeave)
    this.card?.removeEventListener('focusin', this.onCardFocusIn)
    this.card?.removeEventListener('focusout', this.onCardFocusOut)
    this.card?.removeEventListener('pointerdown', this.onCardPointerDown)
    this.card?.removeEventListener('pointerup', this.onCardPointerUp)
    this.els.toggle?.parentElement?.removeEventListener('click', this.onTopClick)
    this.markerEls?.forEach((element) => element.remove())
  }
}
