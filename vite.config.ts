import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const defaultSiteUrl = 'https://yefoi.github.io/entrenador-oposicion-auxiliar/'

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
