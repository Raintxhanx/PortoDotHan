import Cursor from '@/js/components/Cursor'
import Ambient from '@/js/components/Ambient'

const $ = (selector, scope = document) => scope.querySelector(selector)
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector))

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isFinePointer = window.matchMedia('(pointer: fine)').matches

/* ── ready state (no full-screen loader) ─────────────────────── */

document.body.classList.remove('is-loading')

requestAnimationFrame(() => {
  document.body.classList.add('is-ready')
})

/* ── reveal on scroll ────────────────────────────────────────── */

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

initReveals()

/* ── Jakarta clock ───────────────────────────────────────────── */

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

/* ── cursor + ambient audio ──────────────────────────────────── */

window.__cursor = new Cursor()

const soundButton = $('#sound')
if (soundButton) new Ambient(soundButton)

window.addEventListener('galaxy:hover', (event) => {
  const cursor = window.__cursor
  cursor?.setSceneHover?.(event.detail.index >= 0)
})

/* ── mobile menu ─────────────────────────────────────────────── */

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
  if (event.key === 'Escape') setMenu(false)
})

window.addEventListener('resize', () => {
  if (window.innerWidth > 1000) setMenu(false)
})

/* ── tilt cards (progressive enhancement) ────────────────────── */

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

/* ── copy email ──────────────────────────────────────────────── */

const toast = $('#toast')
let toastTimer = null

const showToast = (message = 'Disalin ke clipboard') => {
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
    showToast('Disalin — sampai jumpa')
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      document.execCommand('copy')
      showToast('Disalin — sampai jumpa')
    } catch {
      showToast('Gagal menyalin — alamat ada di atas')
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

/* ── wish easter egg ─────────────────────────────────────────── */

const WISHES = [
  'Tool terbaik menghilang. Pertanyaan terbaik tinggal.',
  'Spreadsheet adalah semesta dengan fisika yang lebih ketat.',
  'Hal kecil bertumpuk. Begitu juga kebaikan kecil.',
  'Rasa ingin tahu adalah sumber daya terbarukan.',
  'Setiap model salah. Sebagian berguna. Terus bertanya.',
  'Jarak antara tahu dan membangun adalah tempat kita tumbuh.',
  'Matematika adalah musik yang bisa diaudit.',
  'Bug adalah pertanyaan yang diajukan semesta kembali.',
  'Buat bekerja. Buat jelas. Lalu buat menghilang.',
  'Manusia biasa yang konsisten mengerjakan hal kecil — itu seluruh triknya.',
]

const wishBtn = $('#wish')
const wishResult = $('#wish-result')
const wishQuote = wishResult?.querySelector('.wish__quote')
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

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeWish()
})

/* ── scroll chrome ───────────────────────────────────────────── */

const nav = $('#nav')
const progressBar = $('#progress-bar')
const heroSection = $('#intro')
const heroMarquee = $('.marquee--hero')

let lastScroll = -1
let marqueeOut = null

const chromeLoop = () => {
  requestAnimationFrame(chromeLoop)

  const y = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const ratio = max > 0 ? y / max : 0

  if (progressBar) progressBar.style.width = `${(ratio * 100).toFixed(2)}%`

  if (nav && Math.abs(y - lastScroll) > 2) {
    nav.classList.toggle('is-scrolled', y > 40)
    lastScroll = y
  }

  if (heroSection && heroMarquee) {
    const rect = heroSection.getBoundingClientRect()
    const out = rect.bottom < window.innerHeight * 0.55
    if (out !== marqueeOut) {
      marqueeOut = out
      heroMarquee.classList.toggle('is-out', out)
    }
  }
}

chromeLoop()

document.addEventListener('visibilitychange', () => {
  $$('.marquee__track').forEach((track) => {
    track.style.animationPlayState = document.hidden ? 'paused' : 'running'
  })
})

/* ── lazy-load the galaxy only on the homepage ───────────────── */

let galaxyRequested = false

const bootGalaxy = () => {
  if (galaxyRequested || !document.querySelector('.scene')) return
  galaxyRequested = true

  import('@/scripts/home.js').catch((error) => {
    console.warn('[galaxy] scene could not load:', error)
    document.querySelector('.scene')?.remove()
    document.querySelector('.scene-veil')?.remove()
    document.querySelector('#orbit')?.remove()
  })
}

// The 3D chunk is large. Start it on the first sign of intent, or after a
// generous delay, so it never competes with the hero/LCP text.
window.addEventListener('scroll', bootGalaxy, { once: true, passive: true })
window.addEventListener('pointerdown', bootGalaxy, { once: true, passive: true })
window.addEventListener('keydown', bootGalaxy, { once: true })
setTimeout(bootGalaxy, 2500)

/* ── signature ───────────────────────────────────────────────── */

console.log(
  '%c RF %c Raihan Ahmad Fathoni — manusia biasa, bahagia dengan hal-hal kecil. ',
  'background:#e3b263;color:#07080c;font-family:monospace;padding:3px 6px;',
  'color:#f1ede3;font-family:monospace;',
)
