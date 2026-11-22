import type { APIRoute } from 'astro'
import { SITE } from '@/data/site'
import { FEATURED_PROJECTS, projectPath } from '@/data/projects'

export const prerender = true

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }
    return map[char] ?? char
  })

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10)
  const routes = [
    { path: '/', changefreq: 'monthly', priority: '1.0' },
    { path: '/tentang/', changefreq: 'monthly', priority: '0.9' },
    { path: '/proyek/', changefreq: 'monthly', priority: '0.9' },
    ...FEATURED_PROJECTS.map((project) => ({
      path: projectPath(project.slug),
      changefreq: 'yearly',
      priority: '0.8',
    })),
    { path: '/kontak/', changefreq: 'yearly', priority: '0.7' },
  ]

  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${escapeXml(new URL(route.path, SITE.url).href)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
