import Experience from '@/js/components/Experience'

/**
 * Homepage-only galaxy boot.
 *
 * Loaded lazily from site.js, so Three.js never reaches subpages and does not
 * compete with the LCP text on the homepage.
 */

const $ = (selector, scope = document) => scope.querySelector(selector)
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector))

const PALETTES = {
  hero: [
    [227, 178, 99],
    [121, 215, 208],
  ],
  about: [
    [156, 140, 246],
    [227, 178, 99],
  ],
  toolkit: [
    [121, 215, 208],
    [156, 140, 246],
  ],
  work: [
    [227, 178, 99],
    [156, 140, 246],
  ],
  now: [
    [121, 215, 208],
    [227, 178, 99],
  ],
  contact: [
    [227, 178, 99],
    [156, 140, 246],
  ],
}

let currentPalette = PALETTES.hero.map((color) => [...color])
let paletteTarget = PALETTES.hero

const rootStyle = document.documentElement.style

let experience = null
try {
  experience = new Experience()
} catch (error) {
  console.warn('[experience] WebGL scene could not start:', error)
  $('.scene')?.remove()
  $('.scene-veil')?.remove()
  $('#orbit')?.remove()
}

/* ── section / palette state ─────────────────────────────────── */

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const name = entry.target.dataset.scene
      if (!name) return

      experience?.updateState(name)
      document.body.dataset.scene = name
      paletteTarget = PALETTES[name] || PALETTES.hero
    })
  },
  { rootMargin: '-42% 0px -42% 0px', threshold: 0 },
)

$$('section[data-scene]').forEach((section) => sectionObserver.observe(section))

window.addEventListener('galaxy:section', (event) => {
  const name = event.detail?.id
  if (!name) return
  document.body.dataset.scene = name
  paletteTarget = PALETTES[name] || PALETTES.hero
})

/* ── ambient colour blending ─────────────────────────────────── */

const paletteLoop = () => {
  requestAnimationFrame(paletteLoop)

  for (let i = 0; i < 2; i += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      currentPalette[i][channel] += (paletteTarget[i][channel] - currentPalette[i][channel]) * 0.035
    }
  }

  rootStyle.setProperty('--glow-a', currentPalette[0].map((value) => Math.round(value)).join(' '))
  rootStyle.setProperty('--glow-b', currentPalette[1].map((value) => Math.round(value)).join(' '))
}

paletteLoop()

/* ── hand off from galaxy to the static dossier ──────────────── */

const dossier = $('#dossier')

if (dossier) {
  const dossierObserver = new IntersectionObserver(
    (entries) => {
      const done = entries.some((entry) => entry.isIntersecting)
      document.body.classList.toggle('galaxy-done', done)
      experience?.setPaused?.(done)
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0 },
  )

  dossierObserver.observe(dossier)
}

/* ── orbit CTA still flies between chapters ──────────────────── */

$('#orbit-cta')?.addEventListener('click', (event) => {
  const href = event.currentTarget.getAttribute('href')
  const id = href?.replace(/^#/, '')
  if (!id) return

  if (experience?.state?.getSection?.(id)) {
    event.preventDefault()
    experience.focusSection(id)
  }
})

/* ── debug hook ──────────────────────────────────────────────── */

if (new URLSearchParams(window.location.search).has('debug')) {
  window.__experience = experience
}
