import {
  SITE,
  absolute,
  organizationId,
  personId,
  websiteId,
} from '@/data/site'

type JsonLd = Record<string, unknown>

const toIso = (value?: string | Date) => {
  if (!value) return new Date().toISOString()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export const personSchema = (): JsonLd => ({
  '@type': 'Person',
  '@id': personId,
  name: SITE.name,
  alternateName: [SITE.shortName, SITE.handle],
  jobTitle: SITE.jobTitle,
  description: SITE.bio,
  url: `${SITE.url}/`,
  image: absolute('/img/avatar.webp'),
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE.location.locality,
    addressRegion: SITE.location.region,
    addressCountry: SITE.location.country,
  },
  // `affiliation` is accurate while Raihan is still studying. Only add
  // `alumniOf` after graduation has been confirmed.
  affiliation: {
    '@type': 'CollegeOrUniversity',
    name: SITE.university,
    url: 'https://www.gunadarma.ac.id/',
  },
  knowsAbout: SITE.knowsAbout,
  sameAs: SITE.sameAs,
  mainEntityOfPage: { '@id': `${SITE.url}/#webpage` },
})

export const websiteSchema = (): JsonLd => ({
  '@type': 'WebSite',
  '@id': websiteId,
  url: `${SITE.url}/`,
  name: `${SITE.name} — Portofolio`,
  description: SITE.description,
  inLanguage: 'id-ID',
  publisher: { '@id': organizationId },
})

export const organizationSchema = (): JsonLd => ({
  '@type': 'Organization',
  '@id': organizationId,
  name: `${SITE.name} — Portofolio`,
  url: `${SITE.url}/`,
  logo: {
    '@type': 'ImageObject',
    url: absolute(SITE.logo),
    width: 512,
    height: 512,
  },
  founder: { '@id': personId },
  sameAs: SITE.sameAs,
})

export const webPageSchema = ({
  path,
  name,
  description,
}: {
  path: string
  name: string
  description: string
}): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'id-ID',
    isPartOf: { '@id': websiteId },
  }
}

export const profilePageSchema = (path = '/'): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'ProfilePage',
    '@id': `${url}#webpage`,
    url,
    name: `${SITE.name} — Profil`,
    description: SITE.bio,
    inLanguage: 'id-ID',
    isPartOf: { '@id': websiteId },
    mainEntity: { '@id': personId },
    dateModified: new Date().toISOString(),
  }
}

export const articleSchema = ({
  path,
  title,
  description,
  image,
  published,
  modified,
}: {
  path: string
  title: string
  description: string
  image: string
  published?: string | Date
  modified?: string | Date
}): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: title,
    description,
    image: [absolute(image)],
    datePublished: toIso(published),
    dateModified: toIso(modified ?? published),
    author: { '@id': personId },
    publisher: { '@id': organizationId },
    mainEntityOfPage: { '@id': `${url}#webpage` },
    inLanguage: 'id-ID',
    isPartOf: { '@id': websiteId },
  }
}

export const softwareApplicationSchema = ({
  path,
  name,
  description,
  image,
  category = 'BusinessApplication',
}: {
  path: string
  name: string
  description: string
  image: string
  category?: string
}): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'SoftwareApplication',
    '@id': `${url}#software`,
    name,
    description,
    image: absolute(image),
    applicationCategory: category,
    operatingSystem: 'Web',
    inLanguage: 'id-ID',
    url,
    author: { '@id': personId },
    publisher: { '@id': organizationId },
  }
}

export const breadcrumbSchema = (path: string, items: { name: string; href?: string }[]): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: absolute(item.href) } : {}),
    })),
  }
}

export const faqSchema = (items: { question: string; answer: string }[]): JsonLd => ({
  '@type': 'FAQPage',
  '@id': `${SITE.url}/tentang/#faq`,
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
})

export const collectionPageSchema = ({
  path,
  name,
  description,
  items,
}: {
  path: string
  name: string
  description: string
  items: { name: string; href: string }[]
}): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'id-ID',
    isPartOf: { '@id': websiteId },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absolute(item.href),
      })),
    },
  }
}

export const contactPageSchema = (path: string): JsonLd => {
  const url = absolute(path)
  return {
    '@type': 'ContactPage',
    '@id': `${url}#webpage`,
    url,
    name: `Kontak ${SITE.name}`,
    description: `Hubungi ${SITE.name} melalui email atau LinkedIn.`,
    inLanguage: 'id-ID',
    isPartOf: { '@id': websiteId },
    mainEntity: { '@id': personId },
  }
}

export const graph = (...nodes: (JsonLd | null | undefined)[]) =>
  nodes.filter(Boolean) as JsonLd[]
