import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const ORIGEN = 'https://ejemplo.test'

/**
 * Ejecuta el service worker en un entorno de mentira para poder observar que
 * estrategia aplica a cada recurso.
 *
 * Viene de un fallo real: servia de la cache todo lo que no fuera una
 * navegacion, asi que un estilo viejo se quedaba congelado y las paginas se
 * veian descuadradas hasta forzar la recarga, que es lo unico que salta al
 * service worker.
 */
function cargarServiceWorker() {
  const handlers: Record<string, (event: unknown) => void> = {}
  const pedidos: string[] = []
  const guardado = new Map<string, object>()

  const respuesta = (texto: string): object => ({
    ok: true,
    clone: () => respuesta(texto),
    text: async () => texto,
  })

  const contexto = {
    self: {
      addEventListener: (tipo: string, fn: (event: unknown) => void) => {
        handlers[tipo] = fn
      },
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() },
      location: { origin: ORIGEN },
    },
    caches: {
      open: async () => ({
        addAll: async () => {},
        put: async (req: { url: string }, res: { text: () => Promise<string> }) => {
          guardado.set(req.url, respuesta(await res.text()))
        },
      }),
      match: async (req: { url: string }) => guardado.get(req.url),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async (req: { url: string }) => {
      pedidos.push(req.url)
      return respuesta('fresco')
    },
    URL,
    Promise,
  }

  vm.createContext(contexto)
  vm.runInContext(
    readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8'),
    contexto,
  )

  const pedir = async (ruta: string, mode = 'no-cors') => {
    let promesa: unknown
    handlers.fetch?.({
      request: { method: 'GET', url: `${ORIGEN}${ruta}`, mode },
      respondWith: (p: unknown) => {
        promesa = p
      },
    })
    return promesa
  }

  return { handlers, pedidos, guardado, respuesta, pedir }
}

describe('service worker', () => {
  it('pide a la red los ficheros que cambian, aunque los tenga guardados', async () => {
    const sw = cargarServiceWorker()
    // Ya guardado de una visita anterior, con el contenido viejo.
    sw.guardado.set(`${ORIGEN}/site.css`, sw.respuesta('viejo'))

    await sw.pedir('/site.css')

    expect(sw.pedidos).toContain(`${ORIGEN}/site.css`)
  })

  it('guarda una copia de esos ficheros para cuando no haya conexión', async () => {
    const sw = cargarServiceWorker()
    await sw.pedir('/capturas/panel.png')
    expect(sw.guardado.has(`${ORIGEN}/capturas/panel.png`)).toBe(true)
  })

  it('sirve de la caché los ficheros con hash, que no cambian nunca', async () => {
    const sw = cargarServiceWorker()
    sw.guardado.set(`${ORIGEN}/assets/index-abc123.js`, sw.respuesta('js'))

    await sw.pedir('/assets/index-abc123.js')

    expect(sw.pedidos).not.toContain(`${ORIGEN}/assets/index-abc123.js`)
  })

  it('pide las navegaciones a la red, para que una página nueva llegue al publicarse', async () => {
    const sw = cargarServiceWorker()
    sw.guardado.set(`${ORIGEN}/index.html`, sw.respuesta('viejo'))

    await sw.pedir('/temario-tai.html', 'navigate')

    expect(sw.pedidos).toContain(`${ORIGEN}/temario-tai.html`)
  })

  it('ignora las peticiones que no son del propio origen', () => {
    const sw = cargarServiceWorker()
    let respondida = false
    sw.handlers.fetch?.({
      request: {
        method: 'GET',
        url: 'https://otro.test/algo.css',
        mode: 'no-cors',
      },
      respondWith: () => {
        respondida = true
      },
    })
    expect(respondida).toBe(false)
  })
})
