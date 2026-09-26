import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { blockPages, intentPages } from './seo-content.mjs'
import { topicSeo } from './seo-topics.mjs'

const defaultSiteUrl = 'https://yefoi.github.io/entrenador-oposicion-auxiliar/'
const siteUrl = (process.env.SITE_URL ?? defaultSiteUrl).replace(/\/$/, '') + '/'
const date = new Date().toISOString().slice(0, 10)
const staticPages = [
  { path: '', priority: '1.0' },
  { path: 'guia-tai.html', priority: '0.8' },
  { path: 'minijuegos-tai.html', priority: '0.8' },
  { path: 'preguntas-frecuentes-tai.html', priority: '0.7' },
  { path: 'privacidad.html', priority: '0.2' },
  { path: 'cookies.html', priority: '0.2' },
]
const blockMeta = [
  ['Bloque 1', 'Organización del Estado y administración electrónica'],
  ['Bloque 2', 'Tecnología básica'],
  ['Bloque 3', 'Desarrollo de sistemas'],
  ['Bloque 4', 'Sistemas, seguridad y comunicaciones'],
]
const related = [
  ['Temario TAI', 'temario-tai.html'],
  ['Test gratis TAI', 'test-oposiciones-tai.html'],
  ['Simulacro TAI', 'simulacro-tai.html'],
  ['Cómo estudiar TAI', 'como-estudiar-tai.html'],
  ['Guía TAI', 'guia-tai.html'],
  ['Preguntas frecuentes', 'preguntas-frecuentes-tai.html'],
  ...blockPages.map((page) => [page.title.split('|')[0].trim(), page.path]),
]
const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const list = (items) =>
  items.map(([label, path]) => `<li><a href="${path}">${escapeHtml(label)}</a></li>`).join('\n          ')
const renderPage = ({ path, title, description, intro, sections, keywords, jsonLd, header }) =>
  `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${siteUrl}${path}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Plaza TAI" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${siteUrl}${path}" />
    <meta name="twitter:card" content="summary" />
    <meta name="keywords" content="${escapeHtml(keywords.join(', '))}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.65; color: #1c2230; background: #f6f7fb; }
      main { max-width: 60rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
      header, section, nav, .cta { background: #fff; border: 1px solid #e2e5ee; border-radius: 0.75rem; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
      h1 { margin-top: 0; font-size: clamp(1.6rem, 4vw, 2.25rem); line-height: 1.2; }
      h2 { margin-top: 0; font-size: 1.25rem; }
      a { color: #1d4ed8; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; color: #5b6478; margin: 0 0 0.5rem; }
      .lead { font-size: 1.1rem; color: #38405a; }
      nav ul, section ul { padding-left: 1.1rem; }
      nav li { margin-bottom: 0.35rem; }
      .cta a { display: inline-block; background: #1d4ed8; color: #fff; padding: 0.7rem 1.1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
      .note { font-size: 0.9rem; color: #5b6478; }
      footer { color: #5b6478; font-size: 0.9rem; text-align: center; padding-bottom: 2rem; }
      @media (prefers-color-scheme: dark) {
        body { background: #10131b; color: #e7eaf3; }
        header, section, nav, .cta { background: #181d29; border-color: #2a3040; }
        .lead, .note, .eyebrow, footer { color: #a7b0c4; }
        a { color: #93b4ff; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">${escapeHtml(header)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(intro)}</p>
        <p class="cta"><a href="./">Abrir el entrenador gratis</a></p>
      </header>
      ${sections
        .map(
          ([heading, body]) =>
            `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`,
        )
        .join('\n      ')}
      <section>
        <h2>En Plaza TAI</h2>
        <p>Este contenido forma parte de una plataforma de práctica libre para el Cuerpo de Técnicos Auxiliares de Informática de la AGE. Funciona en el navegador, guarda el progreso en localStorage y no necesita registro.</p>
        <p class="note">El banco de preguntas y las explicaciones son propios y no oficiales. Verifica siempre la convocatoria y el BOE vigentes.</p>
      </section>
      <nav aria-label="Páginas relacionadas">
        <h2>Ver también</h2>
        <ul>
          ${list(related)}
        </ul>
      </nav>
      <footer><p>Plaza TAI · práctica de oposiciones TAI sin registro · <a href="./privacidad.html">Privacidad</a> · <a href="./cookies.html">Cookies</a></p></footer>
    </main>
  </body>
</html>
`
const breadcrumb = (name, path) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
    { '@type': 'ListItem', position: 2, name, item: `${siteUrl}${path}` },
  ],
})
const dist = resolve(process.env.SEO_OUT_DIR ?? 'dist')
await mkdir(dist, { recursive: true })
const readIfExists = async (target) => {
  try {
    return await readFile(target, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}
const generated = []
for (const page of [...intentPages, ...blockPages]) {
  const header = page.path.startsWith('bloque-') ? 'Bloque del temario' : 'Recurso'
  await writeFile(
    resolve(dist, page.path),
    renderPage({
      ...page,
      header,
      jsonLd: breadcrumb(page.title.split('|')[0].trim(), page.path),
    }),
  )
  generated.push({ path: page.path, priority: '0.9' })
}
await mkdir(resolve(dist, 'temas'), { recursive: true })
for (const [id, title, focus, slug] of topicSeo) {
  const path = `temas/${slug}.html`
  const block = blockMeta.find((_, index) => id.startsWith(`B${index + 1}`)) ?? blockMeta[0]
  const description = `${title} (${id}). ${focus}. Explicación y práctica guiada de este tema del temario TAI AGE.`
  const sections = [
    [
      'Qué abarca este tema',
      `${title} aparece en el ${block[0]} del temario de Técnico Auxiliar de Informática de la AGE, dentro del bloque «${block[1]}». El foco de estudio es ${focus}.`,
    ],
    [
      'Ideas que conviene dominar',
      `Relaciona ${focus} con su contexto: qué problema resuelve, qué componentes implica y qué efecto tiene en la vida de la persona usuaria de un servicio público. Practica ocho preguntas del tema ${id} y revisa la explicación de cada respuesta.`,
    ],
    [
      'Cómo estudiarlo en Plaza TAI',
      'Alterna teoría con práctica: una lectura corta, ocho preguntas propias y un repaso de los errores. Vuelve a este tema cuando el simulacro te señale como débil, en lugar de repetir el temario entero.',
    ],
    [
      'Fuente y revisión',
      'El temario reproduce la convocatoria de referencia. El contenido de Plaza TAI es propio y no oficial; contrasta siempre con el BOE y las bases vigentes.',
    ],
  ]
  await writeFile(
    resolve(dist, path),
    renderPage({
      path,
      title: `${title} | ${id} Temario TAI AGE`,
      description,
      intro: `${title}. ${focus}.`,
      sections,
      header: `Tema ${id} · ${block[0]}`,
      keywords: [focus, 'temario TAI', 'preguntas TAI'],
      jsonLd: breadcrumb(`${title} (${id})`, path),
    }),
  )
  generated.push({ path, priority: '0.7' })
}
const hubLinks = [
  ...intentPages.map((page) => [page.title.split('|')[0].trim(), `./${page.path}`]),
  ...blockPages.map((page) => [page.title.split('|')[0].trim(), `./${page.path}`]),
]
const hubHtml = `<nav id="seo-hub" aria-label="Recursos del temario TAI">
        <h2>Recursos del temario</h2>
        <ul>
          ${list(hubLinks)}
        </ul>
      </nav>
      `
const hubTargets = ['', ...staticPages.slice(1).map((page) => page.path)]
for (const target of hubTargets) {
  const path = resolve(dist, target || 'index.html')
  const html = await readIfExists(path)
  if (!html || html.includes('id="seo-hub"') || !html.includes('</main>')) continue
  await writeFile(path, html.replace('</main>', `${hubHtml}    </main>`))
}
const pages = [...staticPages, ...generated]
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
await writeFile(
  resolve(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
)
await writeFile(resolve(dist, 'sitemap.xml'), sitemap)
for (const page of staticPages.slice(1)) {
  const path = resolve(dist, page.path)
  const html = await readIfExists(path)
  if (!html) continue
  await writeFile(path, html.replaceAll(defaultSiteUrl, siteUrl))
}
console.log(`SEO: ${pages.length} URLs en el sitemap (${generated.length} generadas)`)
