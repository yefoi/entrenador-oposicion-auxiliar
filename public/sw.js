const CACHE_NAME = 'plaza-tai-v2'
const APP_SHELL = ['./', './index.html', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('plaza-tai-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/**
 * Tres estrategias, porque no todos los recursos son iguales.
 *
 * Antes todo lo que no fuera una navegacion se servia de la cache y solo se
 * pedia a la red si faltaba. Eso deja los ficheros congelados para siempre: un
 * estilo viejo se seguia sirviendo despues de desplegar, y las paginas se veian
 * descuadradas hasta forzar la recarga con Ctrl+F5, que es lo unico que salta al
 * service worker. El nombre de la cache sube a v2 para purgar la copia envenenada
 * de quien ya lo tenia instalado.
 */
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Navegaciones: red primero y la copia guardada solo como respaldo sin
  // conexion, para que una pagina nueva llegue en cuanto se publica.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  // Los ficheros de /assets llevan un hash en el nombre: si el contenido cambia,
  // cambia la URL, asi que guardarlos indefinidamente es seguro y ademas rapido.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  // El resto (hojas de estilo, capturas, paginas generadas) cambia en cada
  // despliegue y conserva la misma direccion: se pide a la red y solo se tira de
  // la copia guardada cuando no hay conexion.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request)),
  )
})
