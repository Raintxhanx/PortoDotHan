/**
 * Static SEO audit for the built site.
 *
 *   npm run build && npm run seo:audit
 *
 * Starts a temporary static server over dist/ and checks the things that are
 * easy to regress: titles, descriptions, canonicals, OG tags, JSON-LD, word
 * counts, sitemap coverage and internal links.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { load } from 'cheerio'

const ROOT = resolve('dist')
const PORT = 4322
const BASE = `http://127.0.0.1:${PORT}`

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
}

const routes = [
  {
    path: '/',
    h1: 'Raihan Ahmad Fathoni',
    minWords: 300,
    schema: ['Person', 'WebSite', 'Organization', 'ProfilePage'],
  },
  {
    path: '/tentang/',
    h1: 'Tentang Raihan Ahmad Fathoni',
    minWords: 400,
    schema: ['Person', 'ProfilePage', 'FAQPage', 'BreadcrumbList'],
  },
  {
    path: '/proyek/',
    h1: 'Proyek & Studi Kasus',
    minWords: 300,
    schema: ['Person', 'Organization', 'CollectionPage', 'BreadcrumbList'],
  },
  {
    path: '/proyek/ticketing-management-system/',
    h1: 'Ticketing Management System — Laboratorium Informatika Gunadarma',
    minWords: 500,
    schema: ['Article', 'SoftwareApplication', 'BreadcrumbList'],
  },
  {
    path: '/proyek/platform-chat-llm/',
    h1: 'Platform Chat LLM dengan Sistem Langganan',
    minWords: 500,
    schema: ['Article', 'SoftwareApplication', 'BreadcrumbList'],
  },
  {
    path: '/proyek/asisten-laboratorium/',
    h1: 'Asisten Laboratorium & Pembimbingan 90+ Praktikan',
    minWords: 500,
    schema: ['Article', 'BreadcrumbList'],
  },
  {
    path: '/kontak/',
    h1: 'Kontak Raihan Ahmad Fathoni',
    minWords: 150,
    schema: ['Person', 'ContactPage', 'BreadcrumbList'],
  },
]

const failures = []
const warnings = []

const fail = (route, message) => failures.push(`${route} — ${message}`)
const warn = (route, message) => warnings.push(`${route} — ${message}`)

const normalize = (value) => value.replace(/\s+/g, ' ').trim()
const wordCount = (value) => normalize(value).split(' ').filter(Boolean).length

async function fileFor(pathname) {
  let clean = pathname
  if (clean === '/') clean = '/index.html'
  else if (clean.endsWith('/')) clean += 'index.html'
  else if (!extname(clean)) clean += '/index.html'

  const file = join(ROOT, clean)
  if (!file.startsWith(ROOT)) return null

  try {
    const info = await stat(file)
    return info.isFile() ? file : null
  } catch {
    return null
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', BASE)
    const file = await fileFor(decodeURIComponent(url.pathname))

    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(await readFile(join(ROOT, '404.html'), 'utf8'))
      return
    }

    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' })
    res.end(await readFile(file))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(String(error))
  }
})

await new Promise((resolveListen) => server.listen(PORT, '127.0.0.1', resolveListen))

const get = async (path) => {
  const response = await fetch(`${BASE}${path}`)
  return { response, html: await response.text() }
}

for (const route of routes) {
  const { response, html } = await get(route.path)
  if (response.status !== 200) {
    fail(route.path, `HTTP ${response.status}`)
    continue
  }

  const $ = load(html)
  const canonical = `https://raintxhanx.uk${route.path}`
  const title = normalize($('title').first().text())
  const description = normalize($('meta[name="description"]').attr('content') ?? '')
  const h1s = $('h1')
  const h1 = normalize(h1s.first().text())
  const mainText = normalize($('main').text())

  if ($('html').attr('lang') !== 'id') fail(route.path, 'html lang is not "id"')
  if (!title) fail(route.path, 'missing <title>')
  if (title.length > 72) warn(route.path, `title is ${title.length} chars`)
  if (description.length < 110 || description.length > 180) {
    warn(route.path, `description is ${description.length} chars`)
  }
  if (h1s.length !== 1) fail(route.path, `expected 1 h1, found ${h1s.length}`)
  if (!h1.includes(route.h1)) fail(route.path, `h1 does not contain "${route.h1}" (found "${h1}")`)

  if ($('link[rel="canonical"]').attr('href') !== canonical) {
    fail(route.path, `canonical is not ${canonical}`)
  }
  if (($('meta[name="robots"]').attr('content') ?? '').includes('noindex')) {
    fail(route.path, 'unexpected noindex')
  }

  const ogUrl = $('meta[property="og:url"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content') ?? ''
  if (ogUrl !== canonical) fail(route.path, 'og:url does not match canonical')
  if (!ogImage.startsWith('https://raintxhanx.uk/') || !ogImage.endsWith('.png')) {
    fail(route.path, `og:image is not an absolute PNG: ${ogImage}`)
  }
  if ($('meta[name="twitter:card"]').attr('content') !== 'summary_large_image') {
    fail(route.path, 'missing twitter:card')
  }

  const graph = []
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).text())
      if (Array.isArray(data['@graph'])) graph.push(...data['@graph'])
      else graph.push(data)
    } catch (error) {
      fail(route.path, `invalid JSON-LD: ${error.message}`)
    }
  })

  const types = new Set(graph.map((node) => node['@type']).flat())
  for (const type of route.schema) {
    if (!types.has(type)) fail(route.path, `missing schema type ${type}`)
  }

  const words = wordCount(mainText)
  if (words < route.minWords) fail(route.path, `only ${words} words (minimum ${route.minWords})`)

  if (html.includes('localhost') || html.includes('127.0.0.1')) {
    fail(route.path, 'contains a localhost reference')
  }

  console.log(`✓ ${route.path} (${words} words, ${types.size} schema types)`)
}

/* ── sitemap ─────────────────────────────────────────────────── */

const sitemap = await get('/sitemap.xml')
if (sitemap.response.status !== 200) {
  fail('/sitemap.xml', `HTTP ${sitemap.response.status}`)
} else {
  const locs = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  const expected = routes.map((route) => `https://raintxhanx.uk${route.path}`)

  if (locs.length !== expected.length) {
    fail('/sitemap.xml', `expected ${expected.length} URLs, found ${locs.length}`)
  }
  for (const loc of expected) {
    if (!locs.includes(loc)) fail('/sitemap.xml', `missing ${loc}`)
  }
  for (const loc of locs) {
    const localPath = loc.replace('https://raintxhanx.uk', '') || '/'
    const check = await get(localPath)
    if (check.response.status !== 200) fail('/sitemap.xml', `${loc} returns HTTP ${check.response.status}`)
  }
  console.log(`✓ /sitemap.xml (${locs.length} URLs)`)
}

/* ── robots ──────────────────────────────────────────────────── */

const robots = await get('/robots.txt')
if (robots.response.status !== 200) {
  fail('/robots.txt', `HTTP ${robots.response.status}`)
} else {
  if (!robots.html.includes('Sitemap: https://raintxhanx.uk/sitemap.xml')) {
    fail('/robots.txt', 'missing sitemap directive')
  }
  if (!robots.html.includes('Allow: /')) fail('/robots.txt', 'missing Allow: /')
  if (!robots.html.includes('GPTBot')) fail('/robots.txt', 'missing GPTBot rule')
  console.log('✓ /robots.txt')
}

/* ── internal links ──────────────────────────────────────────── */

const pagePaths = new Set(routes.map((route) => route.path))
const known = new Set([...pagePaths, '/404.html', '/sitemap.xml', '/robots.txt', '/llms.txt'])

for (const route of routes) {
  const { html } = await get(route.path)
  const $ = load(html)

  $('a[href^="/"]').each((_, element) => {
    const href = ($(element).attr('href') ?? '').split('#')[0].split('?')[0]
    if (!href) return
    if (href.startsWith('/_astro/') || href.startsWith('/img/') || href.startsWith('/og/') || href.startsWith('/audio/')) return
    if (known.has(href)) return
    if (href.endsWith('/') && pagePaths.has(href)) return
    fail(route.path, `internal link target is not in the build: ${href}`)
  })
}

/* ── report ──────────────────────────────────────────────────── */

server.close()

for (const warning of warnings) console.warn(`! ${warning}`)

if (failures.length) {
  console.error(`\n${failures.length} SEO failure(s):`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log(`\nAll checks passed (${warnings.length} warning(s)).`)
