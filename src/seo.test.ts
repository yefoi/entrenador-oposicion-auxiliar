import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { blockPages, intentPages } from '../scripts/seo-content.mjs'
import { topicSeo } from '../scripts/seo-topics.mjs'

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const staticContentPages = [
  'guia-tai.html',
  'minijuegos-tai.html',
  'preguntas-frecuentes-tai.html',
  'privacidad.html',
  'cookies.html',
]

describe('SEO metadata', () => {
  it('includes Spanish metadata, social tags and structured data', () => {
    const html = read('index.html')
    expect(html).toContain('lang="es"')
    expect(html).toContain('TAI AGE | Entrenador de temario y simulacros')
    expect(html).toContain('name="description"')
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('name="twitter:card"')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('33 temas')
    expect(html).toContain('264 preguntas')
    expect(html).toContain('boot-screen')
    expect(html).toContain("classList.add('js')")
  })

  it('includes installable offline metadata and static content pages', () => {
    const html = read('index.html')
    const manifest = read('public/manifest.webmanifest')
    const serviceWorker = read('public/sw.js')
    expect(html).toContain('rel="manifest"')
    expect(manifest).toContain('"display": "standalone"')
    expect(serviceWorker).toContain("addEventListener('fetch'")
    const siteCss = read('public/site.css')
    expect(siteCss).toContain('--purple:')
    expect(siteCss).toContain('.site-card')
    for (const page of staticContentPages) {
      const content = read(`public/${page}`)
      expect(content).toContain('<h1>')
      expect(content).toContain('rel="canonical"')
      expect(content).toContain('href="./site.css"')
      expect(content).toContain('class="site-main"')
    }
  })

  it('declares no personal data in the legal pages', () => {
    const privacidad = read('public/privacidad.html')
    const cookies = read('public/cookies.html')
    expect(privacidad).toContain('localStorage')
    expect(privacidad).toContain('sin servidor de cuentas')
    expect(cookies).toContain('localStorage')
    expect(cookies).toContain('TCF 2.2')
  })

  it('covers the four blocks and the 33 syllabus topics with unique slugs', () => {
    expect(blockPages).toHaveLength(4)
    expect(intentPages).toHaveLength(4)
    expect(topicSeo).toHaveLength(33)
    const ids = topicSeo.map(([id]) => id)
    const slugs = topicSeo.map(([, , , slug]) => slug)
    expect(new Set(ids).size).toBe(33)
    expect(new Set(slugs).size).toBe(33)
    for (const [id, title, focus, slug] of topicSeo) {
      expect(id).toMatch(/^B[1-4]-T\d{2}$/)
      expect(title.length).toBeGreaterThan(10)
      expect(focus.length).toBeGreaterThan(15)
      expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
    const blocks = new Set(topicSeo.map(([id]) => id.slice(0, 2)))
    expect([...blocks].sort()).toEqual(['B1', 'B2', 'B3', 'B4'])
  })

  it('serves ads.txt at the root for AdSense', () => {
    const ads = read('public/ads.txt')
    expect(ads).toContain('google.com, pub-9757010029304189, DIRECT')
    expect(ads.trim().split('\n')).toHaveLength(1)
  })

  it('exposes a privacy policy that meets the AdSense review', () => {
    const html = read('public/privacidad.html')
    expect(html).toContain('Google AdSense')
    expect(html).toContain('TCF 2.2')
    expect(html).toContain('https://policies.google.com/privacy')
    expect(html).toContain('https://adssettings.google.com/')
    expect(html).toContain('https://www.aboutads.info/choices/')
    expect(html).toContain('Espacio Económico Europeo')
    expect(html).toContain('localStorage')
  })

  it('explains the third-party cookies in the cookie policy', () => {
    const html = read('public/cookies.html')
    expect(html).toContain('DoubleClick')
    expect(html).toContain('TCF 2.2')
    expect(html).toContain(
      'https://policies.google.com/technologies/cookies',
    )
  })

  it('links the legal pages from the app and the static shell', () => {
    expect(read('index.html')).toContain('./privacidad.html')
    expect(read('index.html')).toContain('./cookies.html')
    const shell = read('src/components/AppShell.tsx')
    expect(shell).toContain('href="./privacidad.html"')
    expect(shell).toContain('href="./cookies.html"')
  })

  it('ships an AdSense logo in a raster format', () => {
    const logo = readFileSync(resolve(process.cwd(), 'public/logo-adsense.png'))
    expect(logo.byteLength).toBeGreaterThan(1000)
    expect(logo.subarray(1, 4).toString('ascii')).toBe('PNG')
  })

  it('injects the AdSense script in the head only when configured', () => {
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-ads-'))
    const siteUrl = 'https://www.example.test/'
    const client = 'ca-pub-9757010029304189'
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SITE_URL: siteUrl, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })
    const withoutClient = readFileSync(
      resolve(outDir, 'temario-tai.html'),
      'utf8',
    )
    expect(withoutClient).not.toContain('adsbygoogle.js')

    writeFileSync(
      resolve(outDir, 'guia-tai.html'),
      '<html lang="es"><head></head><body><main>x</main></body></html>',
    )
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: {
        ...process.env,
        SITE_URL: siteUrl,
        SEO_OUT_DIR: outDir,
        VITE_ADSENSE_CLIENT: client,
      },
      stdio: 'pipe',
    })
    const generated = readFileSync(
      resolve(outDir, 'temario-tai.html'),
      'utf8',
    )
    const staticPage = readFileSync(resolve(outDir, 'guia-tai.html'), 'utf8')
    for (const html of [generated, staticPage]) {
      expect(html).toContain(
        `src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}"`,
      )
      expect(html).toContain('crossorigin="anonymous"')
      expect(html.indexOf('adsbygoogle.js')).toBeLessThan(
        html.indexOf('</head>'),
      )
    }
  })

  it('generates a sitemap, robots and indexable pages aligned with SITE_URL', () => {
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-'))
    const siteUrl = 'https://www.example.test/'
    writeFileSync(
      resolve(outDir, 'guia-tai.html'),
      '<html lang="es"><body><main><h1>Guía</h1></main></body></html>',
    )
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SITE_URL: siteUrl, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })

    const robots = readFileSync(resolve(outDir, 'robots.txt'), 'utf8')
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://www.example.test/sitemap.xml')

    const sitemap = readFileSync(resolve(outDir, 'sitemap.xml'), 'utf8')
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1],
    )
    expect(new Set(locations).size).toBe(locations.length)
    for (const location of locations) {
      expect(location.startsWith(siteUrl)).toBe(true)
    }
    for (const page of [
      ...staticContentPages,
      ...intentPages.map((p) => p.path),
      ...blockPages.map((p) => p.path),
    ]) {
      expect(locations).toContain(`${siteUrl}${page}`)
    }
    for (const [, , , slug] of topicSeo) {
      expect(locations).toContain(`${siteUrl}temas/${slug}.html`)
    }

    const topicFiles = readdirSync(resolve(outDir, 'temas'))
    expect(topicFiles).toHaveLength(33)

    const sample = readFileSync(
      resolve(outDir, `temas/${topicSeo[0][3]}.html`),
      'utf8',
    )
    expect(sample).toContain(
      `rel="canonical" href="${siteUrl}temas/${topicSeo[0][3]}.html"`,
    )
    expect(sample).toContain(topicSeo[0][1])
    expect(sample).toContain('application/ld+json')
    expect(sample).toContain('lang="es"')
    expect(sample).toContain('href="../site.css"')
    expect(sample).toContain('../?tema=B1-T01&vista=practica')
    expect(sample).toContain('href="../temario-tai.html"')

    const blockPage = readFileSync(
      resolve(outDir, 'bloque-3-desarrollo-sistemas.html'),
      'utf8',
    )
    expect(blockPage).toContain('href="./?bloque=III&vista=practica"')
    expect(blockPage).toContain('href="./site.css"')

    const hub = readFileSync(resolve(outDir, 'guia-tai.html'), 'utf8')
    expect(hub).toContain('id="seo-hub"')
    expect(hub).toContain('bloque-4-sistemas-comunicaciones.html')
    expect(hub).toContain('test-oposiciones-tai.html')

    const generated = readFileSync(resolve(outDir, 'temario-tai.html'), 'utf8')
    expect(generated).toContain(
      'bloque-1-organizacion-administracion-electronica.html',
    )
    expect(generated).toContain('como-estudiar-tai.html')
  })
})
