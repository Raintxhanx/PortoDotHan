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
    label: 'Origin',
    title: 'Raihan <em>Fathoni</em>',
    blurb:
      'An ordinary human, happy with small things. Quiet software built with AI, backend engineering and data.',
    meta: ['Indonesia · UTC+7', 'Open to collaborate'],
    href: '#intro',
    accent: PALETTE.gold,
    node: { radius: 0, branch: 0, y: 0.15 },
    camera: { distance: 15, height: 10, swirl: 32 },
  },
  {
    id: 'about',
    number: '01',
    label: 'About',
    title: 'The ordinary <em>human.</em>',
    blurb:
      'Student at Gunadarma University, beginner developer, open-source contributor. Curious about mathematics, science, music — and the occasional spreadsheet rabbit hole.',
    meta: ['Gunadarma University', 'Curiosity, ignited'],
    href: '#about',
    accent: PALETTE.violet,
    node: { radius: 4.8, branch: 1, y: 0.55 },
    camera: { distance: 6, height: 3.2, swirl: -26 },
  },
  {
    id: 'toolkit',
    number: '02',
    label: 'Toolkit',
    title: 'Tools I <em>reach for.</em>',
    blurb:
      'Python by day, Java and Go in progress, PyTorch and TensorFlow on the bench. Honest levels only — I would rather show the learning than fake the mastery.',
    meta: ['Python', 'Java · Go', 'PyTorch · TF'],
    href: '#toolkit',
    accent: PALETTE.cyan,
    node: { radius: 7.2, branch: 2, y: -0.5 },
    camera: { distance: 5.6, height: 2.8, swirl: 30 },
  },
  {
    id: 'work',
    number: '03',
    label: 'Work',
    title: 'Small things, <em>built well.</em>',
    blurb:
      'Six selected projects: a maternal-health platform, a Bahasa Indonesia LLM companion, maps, bots and small desktop tools that save someone an afternoon.',
    meta: ['06 selected projects', 'AI · Web · Data'],
    href: '#work',
    accent: PALETTE.gold,
    node: { radius: 9.4, branch: 3, y: 0.6 },
    camera: { distance: 5.2, height: 2.4, swirl: -32 },
  },
  {
    id: 'now',
    number: '04',
    label: 'Now',
    title: 'Lately, <em>quietly.</em>',
    blurb:
      'Studying OOP and AI engineering, building the Gravida suite, and theory-crafting game mechanics in Excel. The favourite rabbit hole has a spreadsheet at the bottom.',
    meta: ['Studying', 'Building', 'Theory-crafting'],
    href: '#now',
    accent: PALETTE.cyan,
    node: { radius: 11.4, branch: 4, y: -0.7 },
    camera: { distance: 5, height: 2.2, swirl: 30 },
  },
  {
    id: 'contact',
    number: '05',
    label: 'Contact',
    title: 'Let’s build something <em>small.</em>',
    blurb:
      'Open to open-source collaboration, internships, and conversations about AI, data, mathematics or music. I reply faster than my models train.',
    meta: ['raintxhanx@gmail.com', 'Available for collaboration'],
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
