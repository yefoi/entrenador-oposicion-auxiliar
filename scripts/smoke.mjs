import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Comprobacion de la web publicada, no del codigo.
 *
 * Los tests unitarios pasan en verde aunque el despliegue este roto: el service
 * worker sirvio ficheros congelados durante semanas sin que nada lo detectara, y
 * una captura se veia descuadrada solo en la web real. Esto abre la web con un
 * navegador de verdad y mira lo que ve el visitante.
 *
 * Uso: node scripts/smoke.mjs [url]     (por defecto, produccion)
 */

const BASE = (process.argv[2] ?? 'https://www.oposiciones-tai.app').replace(
  /\/$/,
  '',
)

const candidatosChrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

const chrome = candidatosChrome.find((ruta) => existsSync(ruta))
if (!chrome) {
  console.error(
    'No encuentro Chrome ni Edge. Indica la ruta con CHROME_PATH y vuelve a intentarlo.',
  )
  process.exit(2)
}

const fallos = []
const ok = (nombre) => console.log(`  ok    ${nombre}`)
const fallo = (nombre, detalle) => {
  fallos.push(`${nombre}: ${detalle}`)
  console.log(`  FALLA ${nombre}: ${detalle}`)
}

const perfil = mkdtempSync(join(tmpdir(), 'plaza-smoke-'))
const navegador = spawn(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--window-size=1280,900',
    '--remote-debugging-port=9333',
    `--user-data-dir=${perfil}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const cerrar = () => {
  navegador.kill()
  try {
    rmSync(perfil, { recursive: true, force: true })
  } catch {
    // El perfil temporal da igual si no se puede borrar.
  }
}
process.on('exit', cerrar)

// Esperar a que el puerto de depuracion responda.
let listo = false
for (let intento = 0; intento < 30 && !listo; intento += 1) {
  await sleep(500)
  try {
    await fetch('http://127.0.0.1:9333/json/version')
    listo = true
  } catch {
    // Sigue arrancando.
  }
}
if (!listo) {
  console.error('El navegador no arranco')
  process.exit(2)
}

const pestanas = await (await fetch('http://127.0.0.1:9333/json/list')).json()
const pestana = pestanas.find((t) => t.type === 'page')
const ws = new WebSocket(pestana.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let seq = 0
const pendientes = new Map()
ws.addEventListener('message', (evento) => {
  const msg = JSON.parse(evento.data)
  if (msg.id && pendientes.has(msg.id)) {
    pendientes.get(msg.id)(msg)
    pendientes.delete(msg.id)
  }
})
const enviar = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq
    pendientes.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

const evaluar = async (expresion) => {
  const res = await enviar('Runtime.evaluate', {
    expression: expresion,
    awaitPromise: true,
    returnByValue: true,
  })
  return res.result?.result?.value
}

await enviar('Page.enable')
await enviar('Runtime.enable')

console.log(`\nComprobando ${BASE}\n`)

// --- La aplicacion se dibuja ---
await enviar('Page.navigate', { url: `${BASE}/` })
await sleep(6000)
const app = await evaluar(`(() => {
  const raiz = document.getElementById('root')
  // El fondo lo pone html y el body queda transparente, asi que para saber si
  // la hoja de estilos llego se mira un elemento que solo se pinta con ella.
  const barra = document.querySelector('.sidebar, .app-sidebar, aside')
  return {
    tieneRaiz: Boolean(raiz),
    nodosDentro: raiz ? raiz.children.length : 0,
    tieneNavegacion: Boolean(document.querySelector('nav[aria-label="Navegación principal"]')),
    hojas: document.styleSheets.length,
    fondoBarra: barra ? getComputedStyle(barra).backgroundColor : null,
  }
})()`)
if (!app?.tieneRaiz) fallo('aplicacion', 'no encuentra #root')
else if (app.nodosDentro === 0)
  fallo('aplicacion', 'la aplicacion no ha dibujado nada dentro de #root')
else ok('la aplicación se dibuja')
if (!app?.tieneNavegacion) fallo('navegacion', 'no aparece el menu principal')
else ok('el menú principal está presente')
const fondo = app?.fondoBarra ?? ''
if (!app?.hojas) fallo('estilos', 'el navegador no cargó ninguna hoja de estilos')
else if (fondo === 'rgba(0, 0, 0, 0)' || fondo === '')
  fallo('estilos', 'un elemento con estilo propio se quedó sin fondo: la hoja no se aplicó')
else ok('la hoja de estilos se aplica')

// --- Una pagina de tema: contenido y captura encajada ---
await enviar('Page.navigate', {
  url: `${BASE}/temas/corona-constitucion-tai.html`,
})
await sleep(5000)
const tema = await evaluar(`(() => {
  const img = document.querySelector('.site-figure img')
  const caja = img ? img.parentElement.getBoundingClientRect().width : 0
  const ancho = img ? img.getBoundingClientRect().width : 0
  return {
    preguntas: document.querySelectorAll('.site-question').length,
    notas: document.querySelectorAll('.site-option-note').length,
    hayImagen: Boolean(img),
    cargada: img ? img.naturalWidth > 0 : false,
    ancho: Math.round(ancho),
    caja: Math.round(caja),
  }
})()`)
if (!tema?.preguntas) fallo('preguntas', 'la pagina de tema no muestra preguntas')
else ok(`la página de tema muestra ${tema.preguntas} preguntas y ${tema.notas} notas`)
if (!tema?.hayImagen) fallo('captura', 'la pagina de tema no tiene captura')
else if (!tema.cargada) fallo('captura', 'la imagen no se descarga')
else if (tema.ancho > tema.caja + 1)
  fallo(
    'captura',
    `la imagen mide ${tema.ancho} px en una caja de ${tema.caja}: se sale`,
  )
else ok(`la captura encaja en su caja (${tema.ancho} de ${tema.caja} px)`)

// --- El sitemap declara lo que debe ---
try {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text()
  const urls = (sitemap.match(/<loc>/g) ?? []).length
  if (urls < 40) fallo('sitemap', `solo declara ${urls} direcciones`)
  else ok(`el sitemap declara ${urls} direcciones`)
} catch (error) {
  fallo('sitemap', String(error))
}

// --- El favicon que Google puede usar ---
try {
  const res = await fetch(`${BASE}/favicon-96.png`)
  const tipo = res.headers.get('content-type') ?? ''
  if (!res.ok) {
    fallo('favicon', `favicon-96.png responde ${res.status}`)
  } else if (!tipo.includes('image/png')) {
    fallo('favicon', `se sirve como ${tipo}, y Google espera un PNG`)
  } else {
    // Un PNG cuadrado: ancho y alto en la cabecera IHDR.
    const bytes = Buffer.from(await res.arrayBuffer())
    const ancho = bytes.readUInt32BE(16)
    const alto = bytes.readUInt32BE(20)
    if (ancho !== alto || ancho < 48) {
      fallo('favicon', `mide ${ancho}x${alto}: debe ser cuadrado y mayor de 48`)
    } else {
      ok(`el favicon es un PNG cuadrado de ${ancho}x${alto}`)
    }
  }
} catch (error) {
  fallo('favicon', String(error))
}

// --- Las capturas se sirven ---
const capturas = [
  'practica-tai-explicacion-opciones.png',
  'panel-progreso-tai.png',
  'supuesto-practico-tai-materiales.png',
]
for (const captura of capturas) {
  try {
    const res = await fetch(`${BASE}/capturas/${captura}`, { method: 'HEAD' })
    if (res.ok) ok(`se sirve ${captura}`)
    else fallo('captura', `${captura} responde ${res.status}`)
  } catch (error) {
    fallo('captura', `${captura}: ${error}`)
  }
}

ws.close()
cerrar()

console.log('')
if (fallos.length) {
  console.error(`${fallos.length} comprobaciones fallidas:`)
  for (const f of fallos) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('La web publicada responde como se espera.')
