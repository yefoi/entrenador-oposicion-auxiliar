import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { blockPages, intentPages } from './seo-content.mjs'
import { topicSeo } from './seo-topics.mjs'

const defaultSiteUrl = 'https://yefoi.github.io/entrenador-oposicion-auxiliar/'
const siteUrl = (process.env.SITE_URL ?? defaultSiteUrl).replace(/\/$/, '') + '/'
const date = new Date().toISOString().slice(0, 10)
const adsenseClient = process.env.VITE_ADSENSE_CLIENT?.trim()
const adsenseSnippet = adsenseClient
  ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>`
  : ''
// Distintivo de CodeHype. Va en el pie de las paginas generadas, que son las
// que se indexan, y en el de la aplicacion. Enlaza a la ficha del proyecto.
const codehypeBadge = `<a class="site-badge" href="https://codehype.ai/product/plaza-tai?utm_source=codehype_badge" target="_blank" rel="noopener noreferrer"><img src="https://codehype.ai/badges/plaza-tai.svg?variant=find-us&amp;v=20" alt="Destacado en CodeHype" width="180" height="65" loading="lazy" decoding="async" /></a>`
// Bandera de Espana dibujada con un degradado, igual que en la aplicacion.
const flagEs = `<span class="flag-es" aria-hidden="true"></span> `
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

/** Medidas reales de un PNG, leidas de su cabecera. */
const pngSize = (file) => {
  try {
    const bytes = readFileSync(resolve('public', 'capturas', file))
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  } catch {
    return {}
  }
}

const renderFigure = (image, root) => {
  // Las medidas se leen del propio fichero: escribirlas a mano es justo el
  // dato que se queda obsoleto en cuanto se recorta una captura.
  const size = pngSize(image.file)
  const width = image.width ?? size.width ?? 1280
  const height = image.height ?? size.height ?? 860
  return `<figure class="site-figure">
        <img src="${root}capturas/${image.file}" alt="${escapeHtml(image.alt)}" width="${width}" height="${height}" loading="lazy" decoding="async" />
        <figcaption>${escapeHtml(image.caption)}</figcaption>
      </figure>`
}

/**
 * Cuatro preguntas reales del tema con la explicacion de por que falla cada
 * opcion. Es el contenido que no tiene ninguna otra web del sector: la mayoria
 * ensena la respuesta correcta y se guarda el resto.
 */
const renderSamples = (muestras) => `<section class="site-card site-questions">
        <h2>Preguntas reales de este tema</h2>
        <p>Cuatro preguntas del banco con la razón por la que falla cada opción incorrecta. El tema completo tiene dieciséis y se practica en la aplicación.</p>
        ${muestras
          .map(
            (question) => `<article class="site-question">
          <h3>${escapeHtml(question.statement)}</h3>
          <ul class="site-options">
            ${question.options
              .map((option, index) => {
                const correct = index === question.correctIndex
                const note = question.optionNotes?.[index]
                return `<li class="${correct ? 'is-correct' : 'is-wrong'}">
              <span class="site-option-letter">${String.fromCharCode(65 + index)}</span>
              <span class="site-option-text">${escapeHtml(option)}</span>
              ${correct ? '<span class="site-option-tag">Correcta</span>' : ''}
              ${!correct && note ? `<p class="site-option-note">${escapeHtml(note)}</p>` : ''}
            </li>`
              })
              .join('\n            ')}
          </ul>
          <p class="site-answer"><strong>Por qué:</strong> ${escapeHtml(question.explanation)}</p>
        </article>`,
          )
          .join('\n        ')}
      </section>`

/**
 * Indice de los 33 temas con enlace a cada uno y su numero de preguntas.
 *
 * Antes las paginas de tema no recibian un solo enlace interno: vivian solo en
 * el sitemap, mientras que las unicas cuatro URLs con impresiones en Search
 * Console eran justo las que si estaban enlazadas desde aqui. Ademas de servir
 * al lector, esta tabla es la via por la que el buscador las encuentra.
 */
const renderTopicIndex = (banco, soloBloque) => {
  const bloques = [
    ['B1', 'I', 'Organización del Estado y administración electrónica'],
    ['B2', 'II', 'Tecnología básica'],
    ['B3', 'III', 'Desarrollo de sistemas'],
    ['B4', 'IV', 'Sistemas y comunicaciones'],
  ].filter(([, numero]) => !soloBloque || numero === soloBloque)
  return bloques
    .map(([prefijo, numero, materias]) => {
      const temas = topicSeo.filter(([id]) => id.startsWith(prefijo))
      if (!temas.length) return ''
      const filas = temas
        .map(([id, title, focus, slug]) => {
          const total = banco.temas?.[id]?.total
          return `<tr><td><a href="./temas/${slug}.html">${escapeHtml(title)}</a></td><td>${escapeHtml(focus)}</td><td>${total ?? '—'}</td></tr>`
        })
        .join('\n            ')
      return `<h3>Bloque ${numero}. ${escapeHtml(materias)}</h3>
        <table class="site-table">
          <thead>
            <tr><th scope="col">Tema</th><th scope="col">Qué se estudia</th><th scope="col">Preguntas</th></tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>`
    })
    .join('\n        ')
}

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
  // Bloque HTML que ya viene formateado. Se usa para las muestras de preguntas,
  // que no son texto plano como el resto de secciones.
  rawHtml = '',
  image,
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
    ${adsenseSnippet}
    <link rel="stylesheet" href="${root}site.css" />
  </head>
  <body>
    <main class="site-main">
      <header class="site-card">
        <p class="eyebrow">${flagEs}${escapeHtml(header)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(intro)}</p>
        <p class="site-cta">${actions}</p>
      </header>
      ${image ? renderFigure(image, root) : ''}
      ${sections
        .map(
          ([heading, body]) =>
            `<section class="site-card"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`,
        )
        .join('\n      ')}
      ${rawHtml}
      <section class="site-card">
        <h2>En Plaza TAI</h2>
        <p>Plaza TAI es una plataforma de práctica libre para el Cuerpo de Técnicos Auxiliares de Informática de la AGE. Funciona en el navegador y guarda el progreso en el propio equipo, sin registro.</p>
        <p class="note">Banco de preguntas propio y no oficial. Contrasta siempre con el BOE y las bases vigentes.</p>
      </section>
      <nav class="site-card site-nav" aria-label="Páginas relacionadas">
        <h2>Ver también</h2>
        <ul>
          ${list(related, root)}
        </ul>
      </nav>
      <footer class="site-footer"><p>Plaza TAI · práctica de oposiciones TAI sin registro · <a href="${root}privacidad.html">Privacidad</a> · <a href="${root}cookies.html">Cookies</a></p>${codehypeBadge}</footer>
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

/**
 * Muestras reales del banco, una por tema. Las deja el build en un JSON porque
 * este script no puede importar TypeScript. Si falta el fichero, las paginas se
 * generan igualmente sin la seccion de preguntas: es preferible una pagina mas
 * corta que un build roto.
 */
let banco = { total: 0, temas: {} }
try {
  banco = JSON.parse(await readFile(resolve(dist, 'seo-muestras.json'), 'utf8'))
} catch {
  console.warn('SEO: sin muestras del banco, las paginas de tema iran sin preguntas')
}
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
      // El temario lleva el indice completo y cada bloque el suyo, para que las
      // paginas de tema reciban enlaces internos desde donde se las espera.
      rawHtml:
        page.path === 'temario-tai.html'
          ? `${page.rawHtml ?? ''}\n      <section class="site-card">\n        <h2>Los 33 temas, con sus preguntas</h2>\n        <p>Cada tema tiene su propia página con una introducción y cuatro preguntas reales explicadas opción por opción.</p>\n        ${renderTopicIndex(banco)}\n      </section>`
          : isBlock
            ? `${page.rawHtml ?? ''}\n      <section class="site-card">\n        <h2>Los temas de este bloque</h2>\n        ${renderTopicIndex(banco, page.blockId)}\n      </section>`
            : page.rawHtml,
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
    const muestras = banco.temas?.[id]?.muestras
  const block = blockMeta.find((_, index) => id.startsWith(`B${index + 1}`)) ?? blockMeta[0]
  const description = `${title} (${id}). ${focus}. Explicación y práctica guiada de este tema del temario TAI AGE.`
    const sections = [
      [
        'Qué abarca este tema',
        `${title} aparece en el ${block[0]} del temario de Técnico Auxiliar de Informática de la AGE, dentro del bloque «${block[1]}». El foco de estudio es ${focus}.`,
      ],
      [
        'Ideas que conviene dominar',
        `Relaciona ${focus} con su contexto: qué problema resuelve, qué componentes implica y qué efecto tiene en la vida de la persona usuaria de un servicio público. Debajo tienes cuatro preguntas reales del tema ${id} con la explicación de cada opción; el resto se practica en la aplicación, que además lleva el repaso de los errores.`,
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
        rawHtml: muestras ? renderSamples(muestras) : '',
        image: {
          file: 'practica-tai-explicacion-opciones.png',
          alt: `Pregunta real del tema ${id} en Plaza TAI, con la explicación de por qué falla cada opción`,
          caption:
            'Cada pregunta explica por qué falla cada opción incorrecta, no solo cuál es la correcta.',
        },
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
  const original = await readIfExists(path)
  if (!original) continue
  let html = original.replaceAll(defaultSiteUrl, siteUrl)
  if (adsenseSnippet && !html.includes('adsbygoogle.js')) {
    html = html.replace('</head>', `  ${adsenseSnippet}\n  </head>`)
  }
  await writeFile(path, html)
}
// El volcado de muestras es un intermediario del build, no un recurso del
// sitio: no tiene por que llegar a produccion.
try {
  const { unlink } = await import('node:fs/promises')
  await unlink(resolve(dist, 'seo-muestras.json'))
} catch {
  // Si no existe, no hay nada que borrar.
}
console.log(`SEO: ${pages.length} URLs en el sitemap (${generated.length} generadas)`)
