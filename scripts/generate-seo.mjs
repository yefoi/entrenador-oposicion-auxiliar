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
const list = (items, root = './') =>
  items
    .map(
      ([label, path]) =>
        `<li><a href="${root}${path}">${escapeHtml(label)}</a></li>`,
    )
    .join('\n          ')
const renderPage = ({
  path,
  title,
  description,
  intro,
  sections,
  keywords,
  jsonLd,
  header,
  actions,
  depth = 0,
}) => {
  const root = depth ? '../' : './'
  return `<!doctype html>
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
    <link rel="stylesheet" href="${root}site.css" />
  </head>
  <body>
    <main class="site-main">
      <header class="site-card">
        <p class="eyebrow">${escapeHtml(header)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(intro)}</p>
        <p class="site-cta">${actions}</p>
      </header>
      ${sections
        .map(
          ([heading, body]) =>
            `<section class="site-card"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`,
        )
        .join('\n      ')}
      <section class="site-card">
        <h2>En Plaza TAI</h2>
        <p>Este contenido forma parte de una plataforma de práctica libre para el Cuerpo de Técnicos Auxiliares de Informática de la AGE. Funciona en el navegador, guarda el progreso en localStorage y no necesita registro.</p>
        <p class="note">El banco de preguntas y las explicaciones son propios y no oficiales. Verifica siempre la convocatoria y el BOE vigentes.</p>
      </section>
      <nav class="site-card site-nav" aria-label="Páginas relacionadas">
        <h2>Ver también</h2>
        <ul>
          ${list(related, root)}
        </ul>
      </nav>
      <footer class="site-footer"><p>Plaza TAI · práctica de oposiciones TAI sin registro · <a href="${root}privacidad.html">Privacidad</a> · <a href="${root}cookies.html">Cookies</a></p></footer>
    </main>
  </body>
</html>
`
}
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
const actions = {
  test: [
    ['Practicar este bloque', './?bloque=III&vista=practica', 'button-primary'],
    ['Ver el temario', './?vista=temario', 'button-secondary'],
  ],
  exam: [
    ['Ir al simulacro', './?vista=simulacro', 'button-primary'],
    ['Practicar por bloques', './?vista=practica', 'button-secondary'],
  ],
  syllabus: [
    ['Explorar los 33 temas', './?vista=temario', 'button-primary'],
    ['Empezar a practicar', './?vista=practica', 'button-secondary'],
  ],
  study: [
    ['Practicar ahora', './?vista=practica', 'button-primary'],
    ['Ver el temario', './?vista=temario', 'button-secondary'],
  ],
}
const blockAction = (id) => [
  [`Practicar el bloque ${id}`, `./?bloque=${id}&vista=practica`, 'button-primary'],
  ['Practicar otro bloque', './?vista=practica', 'button-secondary'],
]
const actionButtons = (items) =>
  items
    .map(
      ([label, href, variant]) =>
        `<a class="button ${variant}" href="${href}">${escapeHtml(label)}</a>`,
    )
    .join('\n        ')
for (const page of [...intentPages, ...blockPages]) {
  const isBlock = page.path.startsWith('bloque-')
  const header = isBlock ? 'Bloque del temario' : 'Recurso'
  const key = isBlock
    ? 'block'
    : page.path.startsWith('test-')
      ? 'test'
      : page.path.startsWith('simulacro-')
        ? 'exam'
        : page.path.startsWith('temario-')
          ? 'syllabus'
          : 'study'
  await writeFile(
    resolve(dist, page.path),
    renderPage({
      ...page,
      header,
      actions: actionButtons(
        isBlock ? blockAction(page.blockId) : actions[key],
      ),
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
      depth: 1,
      actions: actionButtons([
        [`Practicar el tema ${id}`, `../?tema=${encodeURIComponent(id)}&vista=practica`, 'button-primary'],
        ['Ver el temario completo', '../?vista=temario', 'button-secondary'],
      ]),
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
