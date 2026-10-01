import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const defaultSiteUrl = 'https://yefoi.github.io/entrenador-oposicion-auxiliar/'
/** Cuantas preguntas de cada tema se publican como muestra en su pagina. */
const SAMPLE_PER_TOPIC = 4

export const adsenseSnippet = (client: string) =>
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.SITE_URL ?? defaultSiteUrl).replace(/\/$/, '') + '/'
  const adsenseClient = env.VITE_ADSENSE_CLIENT?.trim()
  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'replace-site-url',
        transformIndexHtml(html) {
          const withSite = html.replaceAll(defaultSiteUrl, siteUrl)
          if (!adsenseClient) return withSite
          return withSite.replace('</head>', `  ${adsenseSnippet(adsenseClient)}\n  </head>`)
        },
      },
      {
        // Las paginas estaticas se generan con un script suelto que no puede
        // importar TypeScript, y necesitan unas muestras reales del banco. En
        // vez de reescribir el banco en otro formato, el build lo deja en un
        // JSON que el generador lee y borra al terminar.
        name: 'volcar-muestras-del-banco',
        async closeBundle() {
          // esbuild resuelve el import sin extension al empaquetar la
          // configuracion, pero el comprobador de tipos pide una extension que
          // no puede llevar aqui, asi que se silencia solo en esta linea.
          // @ts-expect-error import de un modulo TypeScript de la aplicacion
          const { activeQuestions } = (await import('./src/data/questions')) as {
            activeQuestions: {
              id: string
              topicId: string
              statement: string
              options: string[]
              correctIndex: number
              optionNotes?: string[]
              explanation: string
            }[]
          }
          const porTema = new Map<string, typeof activeQuestions>()
          for (const question of activeQuestions) {
            const lista = porTema.get(question.topicId) ?? []
            lista.push(question)
            porTema.set(question.topicId, lista)
          }
          const temas: Record<string, unknown> = {}
          for (const [topicId, todas] of porTema) {
            // Repartidas por todo el tema en lugar de coger las primeras, para
            // que la muestra ensene la variedad de lo que se pregunta.
            const paso = Math.max(1, Math.floor(todas.length / SAMPLE_PER_TOPIC))
            const elegidas = Array.from(
              { length: Math.min(SAMPLE_PER_TOPIC, todas.length) },
              (_, i) => todas[Math.min(todas.length - 1, i * paso)],
            )
            temas[topicId] = {
              // El recuento va aqui para que las paginas puedan decir cuantas
              // preguntas tiene cada tema sin escribirlo a mano.
              total: todas.length,
              muestras: elegidas.map((q) => ({
                id: q.id,
                statement: q.statement,
                options: q.options,
                correctIndex: q.correctIndex,
                optionNotes: q.optionNotes ?? [],
                explanation: q.explanation,
              })),
            }
          }
          const { mkdir, writeFile } = await import('node:fs/promises')
          const { resolve } = await import('node:path')
          await mkdir(resolve('dist'), { recursive: true })
          await writeFile(
            resolve('dist', 'seo-muestras.json'),
            JSON.stringify({ total: activeQuestions.length, temas }),
          )
        },
      },
    ],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
              // El banco de preguntas pesa mas que todo el codigo de la
              // aplicacion junto, y crece cada vez que se anaden preguntas. En
              // fragmentos por bloque, cada uno queda holgadamente por debajo
              // del aviso de tamano y solo se invalida el bloque que cambia.
              { name: 'banco-1', test: /questions[\\/]block1\.ts/ },
              { name: 'banco-2', test: /questions[\\/]block2\.ts/ },
              { name: 'banco-3', test: /questions[\\/]block3\.ts/ },
              { name: 'banco-4', test: /questions[\\/]block4\.ts/ },
            ],
          },
        },
      },
    },
  }
})
