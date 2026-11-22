/**
 * Generate social cards and brand icons.
 *
 *   npm run og
 *
 * Typographic cards only — no synthetic headshots. The real avatar is used on
 * the About page and in Person.image.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const outDir = 'src/public/og'
await mkdir(outDir, { recursive: true })

const esc = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const wrap = (text, max = 26) => {
  const words = text.split(' ')
  const lines = []
  let line = ''

  for (const word of words) {
    if (!line) {
      line = word
    } else if (`${line} ${word}`.length <= max) {
      line += ` ${word}`
    } else {
      lines.push(line)
      line = word
    }
  }

  if (line) lines.push(line)
  return lines
}

const card = ({ eyebrow, title, sub, metric, accent = '#e3b263', footer = 'raintxhanx.uk' }) => {
  const titleLines = wrap(title, 24).slice(0, 3)
  const titleSize = titleLines.length > 2 ? 62 : 74
  const titleStart = 240

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="12%" r="72%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".22"/>
      <stop offset=".55" stop-color="${accent}" stop-opacity=".05"/>
      <stop offset="1" stop-color="#07080c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1ede3" stop-opacity=".09"/>
      <stop offset="1" stop-color="#f1ede3" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="#07080c"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g stroke="#f1ede3" stroke-opacity=".07">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${80 + i * 90}" y1="0" x2="${80 + i * 90}" y2="630"/>`).join('\n    ')}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${70 + i * 80}" x2="1200" y2="${70 + i * 80}"/>`).join('\n    ')}
  </g>

  <circle cx="1050" cy="92" r="150" fill="none" stroke="${accent}" stroke-opacity=".18"/>
  <circle cx="1050" cy="92" r="92" fill="none" stroke="${accent}" stroke-opacity=".12"/>
  <path d="M1050 18 L1058 84 L1124 92 L1058 100 L1050 166 L1042 100 L976 92 L1042 84 Z" fill="${accent}" fill-opacity=".82"/>

  <text x="80" y="92" fill="${accent}" font-family="'Courier New', monospace" font-size="17" letter-spacing="7">${esc(eyebrow)}</text>
  <text x="80" y="150" fill="#615f59" font-family="'Courier New', monospace" font-size="15" letter-spacing="4">RAIHAN AHMAD FATHONI</text>

  ${titleLines
    .map(
      (line, index) =>
        `<text x="80" y="${titleStart + index * (titleSize + 10)}" fill="#f1ede3" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="300" letter-spacing="-2">${esc(line)}</text>`,
    )
    .join('\n  ')}

  <rect x="80" y="505" width="1040" height="1" fill="url(#fade)"/>

  <text x="80" y="552" fill="#cbc7bb" font-family="Arial, Helvetica, sans-serif" font-size="24">${esc(sub)}</text>
  <text x="80" y="590" fill="${accent}" font-family="'Courier New', monospace" font-size="17" letter-spacing="2">${esc(metric)}</text>
  <text x="1120" y="590" text-anchor="end" fill="#8b8d8c" font-family="'Courier New', monospace" font-size="16" letter-spacing="2">${esc(footer)}</text>
</svg>`
}

const cards = [
  {
    file: 'default.png',
    eyebrow: 'PORTFOLIO / 2026',
    title: 'Raihan Ahmad Fathoni',
    sub: 'AI Engineer · Backend Developer · System Analyst',
    metric: 'Jakarta Timur · Universitas Gunadarma · IPK 3.99',
    accent: '#e3b263',
  },
  {
    file: 'ticketing.png',
    eyebrow: 'STUDI KASUS / 2025',
    title: 'Ticketing Management System',
    sub: 'Laboratorium Informatika Gunadarma',
    metric: '687 praktikan · 1.300+ tiket',
    accent: '#e3b263',
  },
  {
    file: 'llm.png',
    eyebrow: 'STUDI KASUS / 2026',
    title: 'Platform Chat LLM',
    sub: 'Sistem langganan, backend, dan konkurensi',
    metric: '200 concurrent users · 31 pengguna aktif saat rilis',
    accent: '#79d7d0',
  },
  {
    file: 'lab.png',
    eyebrow: 'STUDI KASUS / 2024–2025',
    title: 'Asisten Laboratorium',
    sub: 'AI · Pengolahan Citra · Algoritma',
    metric: '90+ praktikan dibimbing',
    accent: '#9c8cf6',
  },
  {
    file: 'about.png',
    eyebrow: 'PROFIL / 2026',
    title: 'Tentang Raihan',
    sub: 'AI Engineer · Backend Developer · System Analyst',
    metric: 'Universitas Gunadarma · IPK 3.99/4.00',
    accent: '#9c8cf6',
  },
  {
    file: 'projects.png',
    eyebrow: 'PORTOFOLIO / 2026',
    title: 'Proyek & Studi Kasus',
    sub: 'Ticketing · LLM · Laboratorium',
    metric: '687 praktikan · 1.300+ tiket · 200 concurrent users',
    accent: '#e3b263',
  },
  {
    file: 'contact.png',
    eyebrow: 'KONTAK / 2026',
    title: 'Mari Terhubung',
    sub: 'Kolaborasi · Magang · Diskusi',
    metric: 'raintxhanx@gmail.com',
    accent: '#79d7d0',
  },
]

for (const item of cards) {
  const svg = card(item)
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`${outDir}/${item.file}`)
  console.log(`wrote ${outDir}/${item.file}`)
}

await sharp('src/public/img/favicon.svg').resize(512, 512).png().toFile('src/public/img/logo-512.png')
await sharp('src/public/img/favicon.svg').resize(180, 180).png().toFile('src/public/img/apple-touch-icon.png')
console.log('wrote src/public/img/logo-512.png')
console.log('wrote src/public/img/apple-touch-icon.png')
