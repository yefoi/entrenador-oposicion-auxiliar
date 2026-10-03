import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { blockPages, intentPages } from '../scripts/seo-content.mjs'
import { topicSeo } from '../scripts/seo-topics.mjs'
import { activeQuestions } from './data/questions'
import { topics, examRules } from './data/syllabus'
import { REVIEW_INTERVALS } from './lib/statistics'
import {
  MINIGAME_LABELS,
  getMinigameQuestionCount,
} from './lib/minigames'

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

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
  it('no anuncia un tamano de banco que ya no es el real', () => {
    // Los recuentos estaban escritos a mano en cuatro sitios y se quedaron en
    // 264 mientras el banco crecia. Un numero viejo en la descripcion que ve
    // Google es una promesa incumplida, y no habia nada que lo detectara.
    const real = activeQuestions.length
    // Estas si afirman el tamano del banco, asi que deben decir el real.
    const loAfirman = [
      'index.html',
      'scripts/seo-content.mjs',
      'public/preguntas-frecuentes-tai.html',
    ]
    // Esta puede no mencionarlo, pero si algun dia lo menciona no debe mentir.
    const loVigilamos = [...loAfirman, 'public/guia-tai.html']
    for (const fuente of loVigilamos) {
      const html = read(fuente)
      // "de 100 preguntas" describe el simulacro del examen, no el banco, asi
      // que solo cuentan las menciones sin ese "de" delante.
      const numeros = [...html.matchAll(/(?<!de )(\d{3,4}) preguntas/g)].map(
        (m) => Number(m[1]),
      )
      for (const numero of numeros) {
        expect(numero, `${fuente} anuncia ${numero} preguntas y hay ${real}`).toBe(real)
      }
    }
    for (const fuente of loAfirman) {
      expect(read(fuente), `${fuente} no menciona el tamano del banco`).toContain(
        `${real} preguntas`,
      )
    }
  })

  it('incluye el distintivo de CodeHype en el HTML que se descarga', () => {
    // El distintivo es la contrapartida de un backlink, y la verificacion se
    // hace contra la pagina raiz. Si viviera solo en el pie de React, un
    // comprobador que no ejecute JavaScript no lo encontraria, asi que ademas
    // tiene que estar en el HTML estatico.
    const html = read('index.html')
    expect(html).toContain('https://codehype.ai/product/plaza-tai?utm_source=codehype_badge')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('badges/plaza-tai.svg')
    const shell = read('src/components/AppShell.tsx')
    expect(shell).toContain('codehype.ai/product/plaza-tai')
    const generador = read('scripts/generate-seo.mjs')
    expect(generador).toContain('codehype.ai/product/plaza-tai')
  })

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

  it('publishes a real contact address in both legal pages', () => {
    for (const page of ['public/privacidad.html', 'public/cookies.html']) {
      const html = read(page)
      expect(html).not.toMatch(/REEMPLAZAR|PLACEHOLDER|TODO:/)
      expect(html).toMatch(/mailto:[^\s"']+@[^"\s']+/)
    }
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

  it('la fecha visible coincide con la declarada en el marcado', () => {
    // Google pide que el marcado describa lo que el lector ve, y dateModified
    // es una senal de frescura: declarar una fecha que no aparece en la pagina
    // seria marcado enganoso.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-fecha-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })

    const paginas = [
      'test-oposiciones-tai.html',
      'temario-tai.html',
      'simulacro-tai.html',
      'como-estudiar-tai.html',
      'temas/corona-constitucion-tai.html',
      'bloque-4-sistemas-comunicaciones.html',
    ]

    for (const pagina of paginas) {
      const html = readFileSync(resolve(outDir, pagina), 'utf8')
      const visible = html.match(/Actualizado el (\d{1,2}) de (\w+) de (\d{4})/)
      const declarada = html.match(/"dateModified":\s*"(\d{4})-(\d{2})-(\d{2})"/)

      expect(visible, `${pagina} no muestra la fecha`).not.toBeNull()
      expect(declarada, `${pagina} no declara dateModified`).not.toBeNull()
      expect(
        Number(visible![3]),
        `${pagina}: el año visible no coincide con el declarado`,
      ).toBe(Number(declarada![1]))
      expect(
        MESES.indexOf(visible![2]!) + 1,
        `${pagina}: el mes visible no coincide con el declarado`,
      ).toBe(Number(declarada![2]))
      expect(
        Number(visible![1]),
        `${pagina}: el día visible no coincide con el declarado`,
      ).toBe(Number(declarada![3]))
    }
  })

  it('todas las páginas declaran un favicon que Google admite', () => {
    // Google Search no admite SVG como favicon: admite BMP, GIF, ICO, PNG,
    // JPEG, PPM y TIFF. El sitio declaraba solo un SVG, asi que el buscador no
    // tenia ningun icono que usar. Con las paginas generadas pasaba ademas que
    // no declaraban ninguno.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-favicon-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })

    const aMano = [
      'index.html',
      'public/guia-tai.html',
      'public/minijuegos-tai.html',
      'public/preguntas-frecuentes-tai.html',
      'public/privacidad.html',
      'public/cookies.html',
    ].map((ruta) => [ruta, readFileSync(resolve(process.cwd(), ruta), 'utf8')] as const)

    const generadas = readdirSync(outDir, { recursive: true })
      .filter((f) => String(f).endsWith('.html'))
      .slice(0, 5)
      .map((f) => [
        String(f),
        readFileSync(resolve(outDir, String(f)), 'utf8'),
      ] as const)

    for (const [nombre, html] of [...aMano, ...generadas]) {
      expect(html, `${nombre} no declara favicon PNG`).toMatch(
        /rel="icon"[^>]*type="image\/png"/,
      )
    }
  })

  it('la página de minijuegos describe todos los que existen', () => {
    // Se anadio Descarte a la aplicacion y la pagina siguio hablando de tres
    // durante semanas. Ahora la lista de nombres sale del propio modulo.
    const pagina = readFileSync(
      resolve(process.cwd(), 'public/minijuegos-tai.html'),
      'utf8',
    )
    const filas = new Map(
      [...pagina.matchAll(/<tr>\s*<td>([^<]+)<\/td>\s*<td>(\d+)/g)].map((m) => [
        m[1]!.trim(),
        Number(m[2]),
      ]),
    )

    expect(filas.size).toBe(Object.keys(MINIGAME_LABELS).length)
    for (const [tipo, etiqueta] of Object.entries(MINIGAME_LABELS)) {
      expect(filas.has(etiqueta), `la página no describe ${etiqueta}`).toBe(true)
      expect(
        filas.get(etiqueta),
        `preguntas anunciadas para ${etiqueta}`,
      ).toBe(getMinigameQuestionCount(tipo as keyof typeof MINIGAME_LABELS))
    }
  })

  it('el marcado de la FAQ coincide con las preguntas visibles', () => {
    // Google exige que el marcado FAQPage describa contenido que el lector ve.
    // Si se anade una pregunta a la pagina y no al JSON, o al reves, esto falla.
    const faq = readFileSync(
      resolve(process.cwd(), 'public/preguntas-frecuentes-tai.html'),
      'utf8',
    )
    const visibles = [
      ...faq.matchAll(/<summary[^>]*>([^<]+)<\/summary>/g),
    ].map((m) => m[1]!.trim())
    const marcado = [...faq.matchAll(/"name":\s*"([^"]+)"/g)].map((m) =>
      m[1]!.trim(),
    )

    expect(visibles.length).toBeGreaterThanOrEqual(10)
    expect(marcado).toEqual(visibles)
  })

  it('los intervalos de repaso son los que usa la aplicación, en todas las páginas', () => {
    // Estas paginas prometen unos intervalos concretos. Si cambian en el motor
    // de repaso, estarian mintiendo al lector. La guia se escribe a mano y la
    // de como estudiar la genera el script, asi que se comprueban por separado.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-repaso-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })

    const paginas: [string, string][] = [
      [
        'guia-tai.html',
        readFileSync(resolve(process.cwd(), 'public/guia-tai.html'), 'utf8'),
      ],
      [
        'como-estudiar-tai.html',
        readFileSync(resolve(outDir, 'como-estudiar-tai.html'), 'utf8'),
      ],
    ]

    for (const [nombre, html] of paginas) {
      // Se leen los dias de la tabla y se comparan con los del motor, en orden:
      // asi da igual que la fila este en singular o en plural.
      const enPagina = [...html.matchAll(/<td>(\d+) días?<\/td>/g)].map((m) =>
        Number(m[1]),
      )
      expect(enPagina, `intervalos en ${nombre}`).toEqual([...REVIEW_INTERVALS])
    }
  })

  it('el temario y los bloques enlazan y cuentan todos los temas', () => {
    // Las paginas de tema no recibian ni un enlace interno: solo estaban en el
    // sitemap, y eran justo las unicas sin impresiones. Este test impide que
    // vuelvan a quedarse sin enlazar desde donde se las espera.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-indice-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })

    const temario = readFileSync(resolve(outDir, 'temario-tai.html'), 'utf8')
    const enlaces = new Set(
      [...temario.matchAll(/temas\/([a-z0-9-]+)\.html/g)].map((m) => m[1]),
    )
    expect(enlaces.size).toBe(topicSeo.length)
    for (const [, , , slug] of topicSeo) {
      expect(enlaces.has(slug), `el temario no enlaza ${slug}`).toBe(true)
    }

    // Y cada pagina de bloque enlaza exactamente los suyos.
    for (const [prefijo, slugBloque] of [
      ['B1', 'bloque-1-organizacion-administracion-electronica.html'],
      ['B2', 'bloque-2-tecnologia-basica.html'],
      ['B3', 'bloque-3-desarrollo-sistemas.html'],
      ['B4', 'bloque-4-sistemas-comunicaciones.html'],
    ] as const) {
      const pagina = readFileSync(resolve(outDir, slugBloque), 'utf8')
      const suyos = topicSeo.filter(([id]) => id.startsWith(prefijo))
      const puestos = new Set(
        [...pagina.matchAll(/temas\/([a-z0-9-]+)\.html/g)].map((m) => m[1]),
      )
      expect(puestos.size).toBe(suyos.length)
    }
  })

  it('las cifras del simulacro salen de las reglas del examen', () => {
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-simulacro-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })
    const pagina = readFileSync(resolve(outDir, 'simulacro-tai.html'), 'utf8')

    expect(pagina).toContain(`hasta ${examRules.theoryQuestions} preguntas`)
    expect(pagina).toContain(`${examRules.scenarioQuestions} preguntas`)
    expect(pagina).toContain(`${examRules.scenarioReserves} preguntas de reserva`)
    expect(pagina).toContain(`${examRules.durationMinutes} minutos`)

    // Los segundos por pregunta son una division, no un dato de la convocatoria:
    // si cambia la duracion o el numero de preguntas, aqui se recalcula.
    const total = examRules.theoryQuestions + examRules.scenarioQuestions
    const segundos = Math.round((examRules.durationMinutes * 60) / total)
    expect(pagina).toContain(`${segundos} segundos`)

    // El reparto del tiempo es una propuesta, pero tiene que sumar la duracion
    // real: una tabla que no cuadra con el examen seria peor que no tenerla.
    const desde = pagina.indexOf('Reparto del tiempo propuesto')
    const tramos = [...pagina.slice(desde).matchAll(/<td>(\d+)<\/td>/g)]
      .slice(0, 4)
      .map((m) => Number(m[1]))
    expect(tramos).toHaveLength(4)
    expect(tramos.reduce((a, b) => a + b, 0)).toBe(examRules.durationMinutes)
  })

  it('las cifras por bloque de la página del test salen del banco real', () => {
    // Es una tabla de numeros escrita a mano: si el banco crece, miente. Este
    // test la ata a los datos de verdad.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-bloques-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })
    const pagina = readFileSync(
      resolve(outDir, 'test-oposiciones-tai.html'),
      'utf8',
    )

    const filas = [
      ...pagina.matchAll(
        /<tr><td>([IV]+)<\/td><td>[^<]*<\/td><td>(\d+)<\/td><td>(\d+)<\/td>/g,
      ),
    ]
    expect(filas.length).toBe(4)

    for (const [, bloque, temas, preguntas] of filas) {
      const reales = activeQuestions.filter((q) => q.blockId === bloque)
      expect(Number(preguntas), `preguntas del bloque ${bloque}`).toBe(
        reales.length,
      )
      expect(Number(temas), `temas del bloque ${bloque}`).toBe(
        topics.filter((topic) => topic.blockId === bloque).length,
      )
    }
    // Y el total que anuncia la pagina tiene que ser el del banco.
    const total = activeQuestions.length
    expect(pagina).toContain(`${total} preguntas`)
  })

  it('las medidas escritas a mano coinciden con la captura real', () => {
    // En las paginas escritas a mano el ancho y el alto estan fijos, mientras
    // que las generadas los leen del PNG. Si alguien vuelve a capturar una
    // imagen, los numeros fijos quedarian mintiendo y la pagina daria un salto
    // al cargar. Este test los ata al fichero de verdad.
    const fuentes = [
      'index.html',
      'public/guia-tai.html',
      'public/minijuegos-tai.html',
    ]
    for (const fuente of fuentes) {
      const html = readFileSync(resolve(process.cwd(), fuente), 'utf8')
      const imgs = [
        ...html.matchAll(/capturas\/([a-z0-9-]+\.png)[^>]*?width="(\d+)"\s*\n?\s*height="(\d+)"/g),
      ]
      expect(imgs.length, `${fuente} no tiene capturas`).toBeGreaterThan(0)
      for (const [, file, width, height] of imgs) {
        const bin = readFileSync(
          resolve(process.cwd(), 'public/capturas', file!),
        )
        expect(Number(width), `${fuente}: ancho declarado de ${file}`).toBe(
          bin.readUInt32BE(16),
        )
        expect(Number(height), `${fuente}: alto declarado de ${file}`).toBe(
          bin.readUInt32BE(20),
        )
      }
    }
  })

  it('publica preguntas reales del tema con la explicación de cada opción', () => {
    // Las muestras las deja el build en un JSON porque el generador no puede
    // importar TypeScript. Aqui se escriben a mano con preguntas reales del
    // banco para comprobar que el generador las pinta bien.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-muestras-'))
    const tema = 'B1-T01'
    const delTema = activeQuestions.filter((q) => q.topicId === tema).slice(0, 4)
    writeFileSync(
      resolve(outDir, 'seo-muestras.json'),
      JSON.stringify({
        total: delTema.length,
        temas: { [tema]: { total: delTema.length, muestras: delTema } },
      }),
    )
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })

    const pagina = readFileSync(
      resolve(outDir, 'temas/corona-constitucion-tai.html'),
      'utf8',
    )
    const primera = delTema[0]!
    expect(pagina).toContain(primera.statement.slice(0, 60))
    // Cada opcion incorrecta lleva su nota, que es lo que no publica nadie mas.
    const notas = primera.optionNotes!.filter(Boolean)
    expect(notas.length).toBe(3)
    for (const nota of notas) {
      expect(pagina).toContain(nota.slice(0, 50))
    }
    expect(pagina).toContain('site-option-tag')
    expect(pagina).toContain('capturas/practica-tai-explicacion-opciones.png')
    // Y la seccion no debe quedarse con un hueco vacio sin muestras.
    expect(pagina).not.toContain('Preguntas reales de este tema\n      \n')
  })

  it('la página de tema sobrevive sin el volcado de muestras', () => {
    // El generador tiene que degradar, no romperse, si el JSON no esta.
    const outDir = mkdtempSync(resolve(tmpdir(), 'tai-seo-sin-muestras-'))
    execFileSync('node', ['scripts/generate-seo.mjs'], {
      env: { ...process.env, SEO_OUT_DIR: outDir },
      stdio: 'pipe',
    })
    const pagina = readFileSync(
      resolve(outDir, 'temas/corona-constitucion-tai.html'),
      'utf8',
    )
    expect(pagina).toContain('Qué abarca este tema')
    expect(pagina).not.toContain('Preguntas reales de este tema')
  })
})
