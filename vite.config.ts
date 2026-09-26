import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const defaultSiteUrl = 'https://yefoi.github.io/entrenador-oposicion-auxiliar/'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.SITE_URL ?? defaultSiteUrl).replace(/\/$/, '') + '/'
  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'replace-site-url',
        transformIndexHtml(html) {
          return html.replaceAll(defaultSiteUrl, siteUrl)
        },
      },
    ],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            ],
          },
        },
      },
    },
  }
})
