import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

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
    for (const page of [
      'guia-tai.html',
      'minijuegos-tai.html',
      'preguntas-frecuentes-tai.html',
    ]) {
      const content = read(`public/${page}`)
      expect(content).toContain('<h1>')
      expect(content).toContain('rel="canonical"')
    }
  })

  it('keeps robots and sitemap aligned with the canonical URL', () => {
    const html = read('index.html')
    const robots = read('public/robots.txt')
    const sitemap = read('public/sitemap.xml')
    const url = 'https://yefoi.github.io/entrenador-oposicion-auxiliar/'
    expect(html).toContain(url)
    expect(robots).toContain('Allow: /')
    expect(robots).toContain(`${url}sitemap.xml`)
    expect(sitemap).toContain(`<loc>${url}</loc>`)
    for (const page of [
      'guia-tai.html',
      'minijuegos-tai.html',
      'preguntas-frecuentes-tai.html',
    ]) {
      expect(sitemap).toContain(`${url}${page}`)
    }
  })
})
