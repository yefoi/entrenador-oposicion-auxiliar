import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const defaultSiteUrl =
  'https://yefoi.github.io/entrenador-oposicion-auxiliar/'
const siteUrl = (process.env.SITE_URL ?? defaultSiteUrl).replace(/\/$/, '') + '/'
const date = new Date().toISOString().slice(0, 10)
const pages = [
  { path: '', priority: '1.0' },
  { path: 'guia-tai.html', priority: '0.8' },
  { path: 'minijuegos-tai.html', priority: '0.8' },
  { path: 'preguntas-frecuentes-tai.html', priority: '0.8' },
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
const dist = resolve('dist')
await mkdir(dist, { recursive: true })
await writeFile(
  resolve(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
)
await writeFile(resolve(dist, 'sitemap.xml'), sitemap)
for (const page of pages.slice(1)) {
  const path = resolve(dist, page.path)
  const html = await readFile(path, 'utf8')
  await writeFile(path, html.replaceAll(defaultSiteUrl, siteUrl))
}
