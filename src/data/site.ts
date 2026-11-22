/**
 * Single source of truth for the entity.
 *
 * Keep the bio paragraph identical here, on the homepage, on /tentang/,
 * in JSON-LD, and on LinkedIn/GitHub. Name/role/location consistency is the
 * strongest on-site signal for a person/entity search.
 */

export const SITE = {
  url: 'https://raintxhanx.uk',
  name: 'Raihan Ahmad Fathoni',
  shortName: 'Raihan Fathoni',
  handle: 'raintxhanx',
  jobTitle: 'AI Engineer & Backend Developer',
  roles: ['AI Engineer', 'Backend Developer', 'System Analyst'],
  email: 'raintxhanx@gmail.com',
  location: {
    locality: 'Jakarta Timur',
    localityId: 'Jakarta Timur',
    region: 'DKI Jakarta',
    country: 'ID',
  },
  university: 'Universitas Gunadarma',
  studyProgram: 'Informatika',
  gpa: '3.99',
  gpaScale: '4.00',
  bio: 'Raihan Ahmad Fathoni adalah AI Engineer dan Backend Developer yang berbasis di Jakarta Timur. Ia menempuh studi Informatika di Universitas Gunadarma dengan IPK 3.99/4.00 dan membangun sistem backend, platform LLM, serta tools yang dipakai ratusan pengguna.',
  shortBio:
    'AI Engineer & Backend Developer. Mahasiswa Informatika Universitas Gunadarma (IPK 3.99/4.00), berbasis di Jakarta Timur.',
  description:
    'Portofolio Raihan Ahmad Fathoni, Backend Developer & AI Engineer. Mahasiswa Informatika Universitas Gunadarma (IPK 3.99), berbasis di Jakarta Timur.',
  knowsAbout: [
    'AI Engineering',
    'Backend Development',
    'DevOps',
    'System Analysis',
    'Python',
    'Large Language Models',
    'REST API',
    'Database Design',
    'Docker',
    'Observability',
  ],
  socials: [
    { label: 'GitHub', handle: '@Raintxhanx', url: 'https://github.com/Raintxhanx' },
    { label: 'LinkedIn', handle: 'in/raintxhanx', url: 'https://www.linkedin.com/in/raintxhanx/' },
    { label: 'YouTube', handle: '@raintxhanx', url: 'https://www.youtube.com/@raintxhanx' },
    { label: 'Instagram', handle: '@raintxhanx', url: 'https://www.instagram.com/raintxhanx/' },
    { label: 'MyAnimeList', handle: 'raintxhanx', url: 'https://myanimelist.net/profile/raintxhanx' },
  ],
  sameAs: [
    'https://github.com/Raintxhanx',
    'https://github.com/Raintxhanx/Raintxhanx',
    'https://www.linkedin.com/in/raintxhanx/',
    'https://www.youtube.com/@raintxhanx',
    'https://www.instagram.com/raintxhanx/',
    'https://myanimelist.net/profile/raintxhanx',
  ],
  ogImage: '/og/default.png',
  logo: '/img/logo-512.png',
  twitterHandle: '@raintxhanx',
} as const

export const NAV = [
  { label: 'Tentang', href: '/tentang/', key: 'tentang' },
  { label: 'Proyek', href: '/proyek/', key: 'proyek' },
  { label: 'Kontak', href: '/kontak/', key: 'kontak' },
] as const

export const absolute = (path: string) => new URL(path, SITE.url).href

export const personId = `${SITE.url}/#person`
export const websiteId = `${SITE.url}/#website`
export const organizationId = `${SITE.url}/#organization`
