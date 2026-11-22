/**
 * Local visual smoke test. Requires a running `npm run preview` on :4321.
 * Not part of the production build.
 */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const out = process.env.SHOT_DIR ?? join(tmpdir(), 'opencode', 'seo-shots')
await mkdir(out, { recursive: true })

const chrome =
  process.env.CHROME_PATH ??
  (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : '/usr/bin/google-chrome')

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-sandbox'],
})

const page = await browser.newPage()
const errors = []
const requested = []

page.on('request', (request) => requested.push(request.url()))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

await page.evaluateOnNewDocument(() => {
  window.__lcp = 0
  window.__cls = 0
  window.__lcpTag = ''
  window.__lcpEntries = []
  window.__longTasks = []

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__lcpEntries.push({
        startTime: Math.round(entry.startTime),
        tag: entry.element?.tagName ?? '',
        text: (entry.element?.textContent ?? '').trim().slice(0, 60),
        size: entry.size,
      })
      if (entry.startTime > window.__lcp) {
        window.__lcp = entry.startTime
        window.__lcpTag = entry.element?.tagName ?? ''
      }
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true })

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__cls += entry.value
    }
  }).observe({ type: 'layout-shift', buffered: true })

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__longTasks.push({ start: Math.round(entry.startTime), duration: Math.round(entry.duration) })
    }
  }).observe({ type: 'longtask', buffered: true })
})

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
await page.goto('http://localhost:4321/?debug=1', { waitUntil: 'networkidle0' })
await wait(3500)
await page.screenshot({ path: `${out}/home-wait.png` })

const desktop = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector)
    if (!element) return null
    const box = element.getBoundingClientRect()
    return { top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height) }
  }
  return {
    bodyClass: document.body.className,
    h1Opacity: getComputedStyle(document.querySelector('h1')).opacity,
    h1: rect('h1'),
    hero: rect('.hero'),
    foot: rect('.hero__foot'),
    dossier: rect('#dossier'),
    canvas: Boolean(document.querySelector('.scene')),
    hasExperience: Boolean(window.__experience),
    scene: document.body.dataset.scene,
    experiencePaused: window.__experience?.paused,
  }
})
console.log('desktop', JSON.stringify(desktop, null, 2))
const vitals = await page.evaluate(() => ({
  lcp: Math.round(window.__lcp),
  lcpTag: window.__lcpTag,
  cls: Number(window.__cls.toFixed(4)),
  lcpEntries: window.__lcpEntries,
  longTasks: window.__longTasks,
  resources: performance
    .getEntriesByType('resource')
    .filter((entry) => /\.(js|css|woff2)$/.test(entry.name))
    .map((entry) => ({
      name: entry.name.split('/').pop(),
      start: Math.round(entry.startTime),
      duration: Math.round(entry.duration),
    })),
  nav: (() => {
    const nav = performance.getEntriesByType('navigation')[0]
    return nav ? { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) } : null
  })(),
}))
console.log('vitals', JSON.stringify(vitals, null, 2))
console.log('home requests audio?', requested.some((url) => url.includes('Lullabye.mp3')))
console.log('home requests galaxy?', requested.some((url) => url.includes('/home.')))

await page.evaluate(() => document.querySelector('#dossier').scrollIntoView())
await wait(2000)
await page.screenshot({ path: `${out}/dossier-wait.png` })

const dossierState = await page.evaluate(() => ({
  galaxyDone: document.body.classList.contains('galaxy-done'),
  experiencePaused: window.__experience?.paused,
  scrollY: Math.round(window.scrollY),
}))
console.log('dossier', JSON.stringify(dossierState, null, 2))

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' })
await wait(3000)
await page.screenshot({ path: `${out}/home-mobile-wait.png` })

for (const [name, path] of [
  ['tentang', '/tentang/'],
  ['proyek', '/proyek/'],
  ['case', '/proyek/ticketing-management-system/'],
  ['kontak', '/kontak/'],
]) {
  requested.length = 0
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle0' })
  await wait(1200)
  console.log(`${name} requests galaxy?`, requested.some((url) => url.includes('/home.')))
  await page.screenshot({ path: `${out}/${name}-wait.png` })
}

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
for (const [name, path] of [
  ['tentang', '/tentang/'],
  ['proyek', '/proyek/'],
  ['case', '/proyek/ticketing-management-system/'],
  ['kontak', '/kontak/'],
]) {
  await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle0' })
  await wait(1200)
  await page.screenshot({ path: `${out}/${name}-mobile-wait.png` })
}

console.log('errors', errors)
await browser.close()
