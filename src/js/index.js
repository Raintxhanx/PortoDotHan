import Experience from '@/js/components/Experience'
import Cursor from '@/js/components/Cursor'
import Ambient from '@/js/components/Ambient'

/* ─────────────────────────────────────────────────────────────
   Boot
   ───────────────────────────────────────────────────────────── */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

const $ = (selector, scope = document) => scope.querySelector(selector)
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector))

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isFinePointer = window.matchMedia('(pointer: fine)').matches

/* ─────────────────────────────────────────────────────────────
   Loader
   ───────────────────────────────────────────────────────────── */

const loader = $('#loader')
const loaderBar = $('#loader-bar')
const loadCount = $('#load-count')

let progress = 0
let targetProgress = 8
let loaderDone = false
let progressRaf = null

const setProgress = () => {
  targetProgress = Math.min(91, targetProgress + Math.random() * 0.9 + 0.15)
}

const animateProgress = () => {
  progress += (targetProgress - progress) * 0.075
  if (loaderBar) loaderBar.style.width = `${progress.toFixed(2)}%`
  if (loadCount) loadCount.textContent = String(Math.round(progress)).padStart(2, '0')
  progressRaf = requestAnimationFrame(animateProgress)
}

if (!prefersReduced) {
  animateProgress()
  const interval = setInterval(() => {
    if (loaderDone) {
      clearInterval(interval)
      return
    }
    setProgress()
  }, 220)
} else {
  if (loaderBar) loaderBar.style.width = '100%'
  if (loadCount) loadCount.textContent = '100'
}

const minimumTime = new Promise((resolve) => setTimeout(resolve, 1650))
const pageLoad = new Promise((resolve) => {
  if (document.readyState === 'complete') resolve()
  else window.addEventListener('load', resolve, { once: true })
})
const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()

const finishLoading = () => {
  if (loaderDone) return
  loaderDone = true
  targetProgress = 100
  progress = 100

  if (loaderBar) loaderBar.style.width = '100%'
  if (loadCount) loadCount.textContent = '100'

  setTimeout(() => {
    loader?.classList.add('is-done')
    document.body.classList.remove('is-loading')
    document.body.classList.add('is-ready')
    setTimeout(initReveals, 120)
    setTimeout(() => loader?.remove(), 1800)
  }, 420)
}

Promise.all([minimumTime, pageLoad, fontsReady]).then(finishLoading)

// safety: never trap the visitor behind the curtain
setTimeout(finishLoading, 7000)

/* ─────────────────────────────────────────────────────────────
   Reveal on scroll
   ───────────────────────────────────────────────────────────── */

let revealObserver = null

function initReveals() {
  if (revealObserver || prefersReduced) {
    $$('[data-reveal]').forEach((el) => el.classList.add('is-in'))
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-in')
        revealObserver.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )

  $$('[data-reveal]').forEach((el) => revealObserver.observe(el))
}

/* ─────────────────────────────────────────────────────────────
   3D + section state
   ───────────────────────────────────────────────────────────── */

let experience = null
try {
  experience = new Experience()
} catch (error) {
  console.warn('[experience] WebGL scene could not start:', error)
  $('.scene')?.remove()
}

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

let currentPalette = PALETTES.hero.map((c) => [...c])
let paletteTarget = PALETTES.hero

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const name = entry.target.dataset.scene
      if (!name) return

      experience?.updateState(name)
      document.body.dataset.scene = name
      paletteTarget = PALETTES[name] || PALETTES.hero

      $$('[data-nav]').forEach((link) => {
        link.classList.toggle('is-active', link.dataset.nav === name)
      })
    })
  },
  { rootMargin: '-42% 0px -42% 0px', threshold: 0 },
)

$$('[data-scene]').forEach((section) => sectionObserver.observe(section))

/* ─────────────────────────────────────────────────────────────
   Scroll chrome + ambient colour blending
   ───────────────────────────────────────────────────────────── */

const nav = $('#nav')
const progressBar = $('#progress-bar')
const rootStyle = document.documentElement.style

let lastScroll = -1
let chromeRaf = null

const chromeLoop = () => {
  chromeRaf = requestAnimationFrame(chromeLoop)

  const y = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const ratio = max > 0 ? y / max : 0

  if (progressBar) progressBar.style.width = `${(ratio * 100).toFixed(2)}%`

  if (nav && Math.abs(y - lastScroll) > 2) {
    nav.classList.toggle('is-scrolled', y > 40)
    lastScroll = y
  }

  // blend the ambient glow colours toward the active section
  const ease = prefersReduced ? 1 : 0.035
  for (let i = 0; i < 2; i += 1) {
    for (let c = 0; c < 3; c += 1) {
      currentPalette[i][c] += (paletteTarget[i][c] - currentPalette[i][c]) * ease
    }
  }

  rootStyle.setProperty('--glow-a', currentPalette[0].map((v) => Math.round(v)).join(' '))
  rootStyle.setProperty('--glow-b', currentPalette[1].map((v) => Math.round(v)).join(' '))
}

chromeLoop()

/* ─────────────────────────────────────────────────────────────
   Clock — Jakarta, UTC+7
   ───────────────────────────────────────────────────────────── */

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const shortFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const heroTime = $('#hero-time')
const navTime = $('#nav-time')
const footerTime = $('#footer-time')

const tickClock = () => {
  const now = new Date()
  const full = timeFormatter.format(now)
  const short = `${shortFormatter.format(now)} WIB`
  if (heroTime) heroTime.textContent = full
  if (navTime) navTime.textContent = short
  if (footerTime) footerTime.textContent = short
}

tickClock()
setInterval(tickClock, 1000)

/* ─────────────────────────────────────────────────────────────
   Cursor + ambient audio
   ───────────────────────────────────────────────────────────── */

new Cursor()
new Ambient($('#sound'))

/* ─────────────────────────────────────────────────────────────
   Menu
   ───────────────────────────────────────────────────────────── */

const menu = $('#menu')
const menuBtn = $('#menu-btn')

const setMenu = (open) => {
  if (!menu || !menuBtn) return
  menu.classList.toggle('is-open', open)
  menu.setAttribute('aria-hidden', String(!open))
  menuBtn.setAttribute('aria-expanded', String(open))
  document.body.classList.toggle('menu-open', open)
}

menuBtn?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')))

$$('a', menu || document.createElement('div')).forEach((link) => {
  link.addEventListener('click', () => setMenu(false))
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenu(false)
    closeWish()
  }
})

window.addEventListener('resize', () => {
  if (window.innerWidth > 1000) setMenu(false)
})

/* ─────────────────────────────────────────────────────────────
   Tilt cards
   ───────────────────────────────────────────────────────────── */

if (isFinePointer && !prefersReduced) {
  $$('[data-tilt]').forEach((element) => {
    element.style.transition =
      'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.5s ease, box-shadow 0.6s ease'
    element.style.willChange = 'transform'

    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5
      element.style.transform = `perspective(1100px) rotateX(${(-py * 4.5).toFixed(2)}deg) rotateY(${(px * 5.5).toFixed(2)}deg)`
    })

    element.addEventListener('pointerleave', () => {
      element.style.transform = ''
    })
  })
}

/* ─────────────────────────────────────────────────────────────
   Copy email
   ───────────────────────────────────────────────────────────── */

const toast = $('#toast')
let toastTimer = null

const showToast = (message = 'Copied to clipboard') => {
  if (!toast) return
  const label = toast.querySelector('.mono')
  if (label) label.textContent = message
  toast.classList.add('is-on')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2400)
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied — talk soon')
  } catch (error) {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      document.execCommand('copy')
      showToast('Copied — talk soon')
    } catch (err) {
      showToast('Copy failed — the address is above')
    }
    area.remove()
  }
}

$$('[data-copy]').forEach((element) => {
  element.addEventListener('click', (event) => {
    if (element.tagName === 'A') event.preventDefault()
    copyText(element.dataset.copy)
  })
})

/* ─────────────────────────────────────────────────────────────
   Wish easter egg
   ───────────────────────────────────────────────────────────── */

const WISHES = [
  'The best tools disappear. The best questions stay.',
  'A spreadsheet is just a universe with stricter physics.',
  'Small things compound. So do small kindnesses.',
  'Curiosity is a renewable resource. Spend it daily.',
  'Every model is wrong. Some are useful. Keep asking why.',
  'The gap between knowing and building is where you grow.',
  'Mathematics is the music you can audit.',
  'A bug is a question the universe asked back.',
  'Make it work. Make it clear. Then make it disappear.',
  'Ordinary humans, doing small things consistently — that is the whole trick.',
]

const wishBtn = $('#wish')
const wishResult = $('#wish-result')
const wishQuote = $('.wish__quote', wishResult || document.createElement('div'))
let lastWish = -1
let wishTimer = null

const closeWish = () => {
  wishResult?.classList.remove('is-open')
  wishBtn?.classList.remove('is-pulling')
}

const openWish = () => {
  if (!wishBtn || !wishResult) return

  let index = Math.floor(Math.random() * WISHES.length)
  if (index === lastWish) index = (index + 1) % WISHES.length
  lastWish = index

  if (wishQuote) wishQuote.textContent = WISHES[index]

  wishBtn.classList.add('is-pulling')
  clearTimeout(wishTimer)
  wishTimer = setTimeout(() => {
    wishResult.classList.add('is-open')
    wishBtn.classList.remove('is-pulling')
  }, 620)
}

wishBtn?.addEventListener('click', (event) => {
  event.stopPropagation()
  openWish()
})

wishResult?.addEventListener('click', closeWish)

/* ─────────────────────────────────────────────────────────────
   Nav anchor offsets & tiny polish
   ───────────────────────────────────────────────────────────── */

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    if (document.body.classList.contains('menu-open')) setMenu(false)
  })
})

// pause the marquees when the tab is hidden
document.addEventListener('visibilitychange', () => {
  $$('.marquee__track').forEach((track) => {
    track.style.animationPlayState = document.hidden ? 'paused' : 'running'
  })
})

// console signature
console.log(
  '%c RF %c Raihan Fathoni — an ordinary human, happy with small things. ',
  'background:#e3b263;color:#07080c;font-family:monospace;padding:3px 6px;',
  'color:#f1ede3;font-family:monospace;',
)
