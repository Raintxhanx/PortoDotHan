import { Vector3 } from 'three'

/**
 * Single source of truth for the galaxy and its chapter nodes.
 *
 * The spiral maths is ported from the reference implementation in `./galaxy`
 * (uniform radius along `branches` arms, power-distributed randomness around
 * each arm). Everything else — camera framing, copy, colours — is portfolio
 * specific.
 */

export const PALETTE = {
  ink: '#07080c',
  bone: '#f1ede3',
  gold: '#e3b263',
  cyan: '#79d7d0',
  violet: '#9c8cf6',
}

export const GALAXY = {
  // 100k on desktop, ~28k on mobile. The renderer never draws more than this.
  countDesktop: 100000,
  countMobile: 28000,

  radius: 15,
  branches: 5,
  randomness: 0.3,
  randomnessPower: 4,
  thickness: 0.9,

  // Radians of extra twist per world unit of radius. This is the difference
  // between five straight spokes and five actual spiral arms.
  spiral: 0.18,

  // Base point size in CSS pixels (multiplied by DPR + per-star scale).
  // Kept deliberately small: 100k additive sprites bloom fast if each one is
  // any larger than a couple of pixels.
  size: 58,
  brightness: 0.72,
  spinSpeed: 0.008,

  starfieldDesktop: 1500,
  starfieldMobile: 550,

  colours: {
    inside: '#ffe7bd',
    mid: '#e3b263',
    outside: '#7f6cf2',
  },
}

export const SECTION_ORDER = ['hero', 'about', 'toolkit', 'work', 'now', 'contact']

/**
 * `node`     -> position on the spiral (radius + arm + height)
 * `camera`   -> how the camera frames that node (distance, height, swirl)
 * `accent`   -> HUD accent colour for markers and the floating card
 */
export const SECTIONS = [
  {
    id: 'hero',
    number: '00',
    label: 'Asal',
    title: 'Raihan Ahmad <em>Fathoni</em>',
    blurb:
      'AI Engineer dan Backend Developer. Sistem backend, platform LLM, dan tools yang dipakai ratusan pengguna.',
    meta: ['Jakarta Timur · UTC+7', 'Terbuka untuk kolaborasi'],
    href: '#intro',
    accent: PALETTE.gold,
    node: { radius: 0, branch: 0, y: 0.15 },
    camera: { distance: 15, height: 10, swirl: 32 },
  },
  {
    id: 'about',
    number: '01',
    label: 'Profil',
    title: 'Profil <em>singkat.</em>',
    blurb:
      'Mahasiswa Informatika Universitas Gunadarma dengan IPK 3.99/4.00. Fokus pada AI Engineering, Backend, DevOps, dan System Analysis.',
    meta: ['Universitas Gunadarma', 'IPK 3.99 / 4.00'],
    href: '#about',
    accent: PALETTE.violet,
    node: { radius: 4.8, branch: 1, y: 0.55 },
    camera: { distance: 6, height: 3.2, swirl: -26 },
  },
  {
    id: 'toolkit',
    number: '02',
    label: 'Keahlian',
    title: 'Yang saya <em>kerjakan.</em>',
    blurb:
      'Python, backend, LLM, database, dan DevOps. Level yang jujur — lebih baik menunjukkan proses belajar daripada mengklaim mastery.',
    meta: ['Python', 'Backend · LLM', 'DevOps'],
    href: '#toolkit',
    accent: PALETTE.cyan,
    node: { radius: 7.2, branch: 2, y: -0.5 },
    camera: { distance: 5.6, height: 2.8, swirl: 30 },
  },
  {
    id: 'work',
    number: '03',
    label: 'Proyek',
    title: 'Hal kecil, <em>dibangun benar.</em>',
    blurb:
      'Tiga studi kasus utama: sistem ticketing laboratorium, platform chat LLM, dan pendampingan praktikum. Ditambah proyek AI, web, dan otomasi.',
    meta: ['03 studi kasus', 'AI · Backend · Data'],
    href: '#work',
    accent: PALETTE.gold,
    node: { radius: 9.4, branch: 3, y: 0.6 },
    camera: { distance: 5.2, height: 2.4, swirl: -32 },
  },
  {
    id: 'now',
    number: '04',
    label: 'Sekarang',
    title: 'Sedang <em>dikerjakan.</em>',
    blurb:
      'Membangun backend platform LLM, mempelajari system design, dan tetap menyisakan waktu untuk spreadsheet serta matematika.',
    meta: ['Membangun', 'Belajar', 'Theorycrafting'],
    href: '#now',
    accent: PALETTE.cyan,
    node: { radius: 11.4, branch: 4, y: -0.7 },
    camera: { distance: 5, height: 2.2, swirl: 30 },
  },
  {
    id: 'contact',
    number: '05',
    label: 'Kontak',
    title: 'Mari <em>terhubung.</em>',
    blurb:
      'Terbuka untuk kolaborasi open-source, magang, dan diskusi seputar AI, data, serta backend.',
    meta: ['raintxhanx@gmail.com', 'Terbuka untuk kolaborasi'],
    href: '#contact',
    accent: PALETTE.violet,
    node: { radius: 13.4, branch: 0, y: 0.25 },
    camera: { distance: 5.4, height: 2.6, swirl: -24 },
  },
]

const DEG = Math.PI / 180

/**
 * Position of a chapter node on the ideal spiral arm. Shared by the particle
 * generator and the camera path so the stars always line up with the chapters.
 */
export function getNodePosition(node) {
  const branchAngle = (node.branch / GALAXY.branches) * Math.PI * 2
  const radius = node.radius
  const angle = branchAngle + radius * GALAXY.spiral

  return new Vector3(Math.cos(angle) * radius, node.y, Math.sin(angle) * radius)
}

export function createSectionNodes() {
  return SECTIONS.map((section, index) => ({
    ...section,
    index,
    position: getNodePosition(section.node),
  }))
}

export { DEG }
