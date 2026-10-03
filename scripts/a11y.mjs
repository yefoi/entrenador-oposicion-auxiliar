import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'

/**
 * Auditoria de accesibilidad de la aplicacion construida.
 *
 * No es un test unitario: hace falta un navegador de verdad y el CSS aplicado
 * para medir contraste, foco y nombres accesibles. Se sirve `dist` en local y se
 * pasa axe-core pantalla por pantalla, usando los enlaces profundos `?vista=`
 * que ya existen para no depender de clics fragiles.
 *
 * Uso: npm run build && npm run a11y
 */

const RAIZ = resolve('dist')
if (!existsSync(join(RAIZ, 'index.html'))) {
  console.error('No hay dist/. Ejecuta "npm run build" antes.')
  process.exit(2)
}

const axeFuente = readFileSync(
  resolve('node_modules/axe-core/axe.min.js'),
  'utf8',
)

const TIPOS = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
}

const servidor = createServer(async (peticion, respuesta) => {
  let ruta = decodeURIComponent(new URL(peticion.url, 'http://x').pathname)
  if (ruta.endsWith('/')) ruta += 'index.html'
  const fichero = resolve(join(RAIZ, ruta))
  const dentro = fichero.startsWith(RAIZ)
  try {
    if (!dentro) throw new Error('fuera')
    const datos = readFileSync(fichero)
    respuesta.writeHead(200, {
      'content-type': TIPOS[extname(fichero)] ?? 'application/octet-stream',
    })
    respuesta.end(datos)
  } catch {
    // Todo lo que no sea un fichero se resuelve con la portada, como en Vercel.
    respuesta.writeHead(200, { 'content-type': TIPOS['.html'] })
    respuesta.end(readFileSync(join(RAIZ, 'index.html')))
  }
})
await new Promise((listo) => servidor.listen(0, '127.0.0.1', listo))
const PUERTO = servidor.address().port
const BASE = `http://127.0.0.1:${PUERTO}`

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
  console.error('No encuentro Chrome ni Edge. Indica la ruta con CHROME_PATH.')
  process.exit(2)
}

const perfil = mkdtempSync(join(tmpdir(), 'plaza-a11y-'))
const navegador = spawn(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--window-size=1280,900',
    '--remote-debugging-port=9334',
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
  servidor.close()
}
process.on('exit', cerrar)

let listo = false
for (let intento = 0; intento < 30 && !listo; intento += 1) {
  await sleep(500)
  try {
    await fetch('http://127.0.0.1:9334/json/version')
    listo = true
  } catch {
    // Sigue arrancando.
  }
}
if (!listo) {
  console.error('El navegador no arranco')
  process.exit(2)
}

const pestanas = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const pestana = pestanas.find((t) => t.type === 'page')
const ws = new WebSocket(pestana.webSocketDebuggerUrl)
await new Promise((listo, error) => {
  ws.addEventListener('open', listo, { once: true })
  ws.addEventListener('error', error, { once: true })
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
  new Promise((listo) => {
    const id = ++seq
    pendientes.set(id, listo)
    ws.send(JSON.stringify({ id, method, params }))
  })

const evaluar = async (expresion) => {
  const res = await enviar('Runtime.evaluate', {
    expression: expresion,
    awaitPromise: true,
    returnByValue: true,
  })
  if (res.result?.exceptionDetails) {
    throw new Error(res.result.exceptionDetails.text)
  }
  return res.result?.result?.value
}

await enviar('Page.enable')
await enviar('Runtime.enable')

const PANTALLAS = [
  { nombre: 'panel', vista: '' },
  { nombre: 'temario', vista: 'temario' },
  { nombre: 'preparar practica', vista: 'test' },
  { nombre: 'simulacro', vista: 'simulacro' },
  { nombre: 'minijuegos', vista: 'minijuegos' },
  { nombre: 'estadisticas', vista: 'estadisticas' },
  { nombre: 'plan', vista: 'plan' },
  { nombre: 'repasos', vista: 'repasos' },
  { nombre: 'ajustes', vista: 'ajustes' },
]

console.log(`\nAuditoría de accesibilidad sobre ${BASE}\n`)

const todas = []
let revisadas = 0

const auditar = async (nombre) => {
  const dibujada = await evaluar(`(() => {
    // La aplicacion monta sobre #root; las paginas estaticas son HTML suelto.
    const raiz = document.getElementById('root')
    if (raiz) return raiz.children.length
    return document.body.textContent.trim().length > 200 ? 1 : 0
  })()`)
  if (!dibujada) {
    console.log(`  FALLA ${nombre}: no se dibuja`)
    todas.push({
      pantalla: nombre,
      id: 'render',
      impacto: 'critical',
      ayuda: 'no se dibuja',
      total: 1,
      nodos: [],
    })
    return
  }
  revisadas += 1

  await evaluar(axeFuente)
  const resultado = await evaluar(`(async () => {
    const r = await window.axe.run(document, {
      resultTypes: ['violations'],
      rules: {
        // La aplicacion vive en una sola pagina: no hay navegacion por URL que
        // axe pueda seguir para revisar enlaces internos.
        'link-in-text-block': { enabled: false },
      },
    })
    return r.violations.map((v) => ({
      id: v.id,
      impacto: v.impact,
      ayuda: v.help,
      nodos: v.nodes.slice(0, 4).map((n) => ({
        objetivo: n.target.join(' '),
        resumen: (n.failureSummary ?? '').split('\\n').slice(1, 3).join(' '),
      })),
      total: v.nodes.length,
    }))
  })()`)

  if (!resultado.length) {
    console.log(`  ok    ${nombre}`)
    return
  }
  console.log(`  ${nombre}: ${resultado.length} reglas incumplidas`)
  for (const fallo of resultado) {
    todas.push({ pantalla: nombre, ...fallo })
  }
}

for (const pantalla of PANTALLAS) {
  const url = pantalla.vista ? `${BASE}/?vista=${pantalla.vista}` : `${BASE}/`
  await enviar('Page.navigate', { url })
  await sleep(2500)
  await auditar(pantalla.nombre)
}

// --- Una sesion con la pregunta delante ---
// Es la pantalla que mas se usa y no se llega a ella con un enlace profundo:
// hay que arrancar la practica.
await enviar('Page.navigate', { url: `${BASE}/?vista=test` })
await sleep(2500)
const arrancada = await evaluar(`(() => {
  const boton = [...document.querySelectorAll('button')].find((b) =>
    /comenzar pr[aá]ctica/i.test(b.textContent ?? ''),
  )
  boton?.click()
  return Boolean(boton)
})()`)
if (!arrancada) {
  console.log('  FALLA sesión de práctica: no encuentro el botón de comenzar')
} else {
  await sleep(1800)
  await auditar('sesión de práctica')
}

// --- Un minijuego en marcha ---
// Tiene interfaz propia (tarjetas, descarte) que no se parece a la sesión.
await enviar('Page.navigate', { url: `${BASE}/?vista=minijuegos` })
await sleep(2500)
const minijuego = await evaluar(`(() => {
  const boton = [...document.querySelectorAll('button')].find((b) =>
    (b.getAttribute('aria-label') ?? '') === 'Flashcards',
  )
  boton?.click()
  return Boolean(boton)
})()`)
if (!minijuego) {
  console.log('  FALLA minijuego: no encuentro la tarjeta de Flashcards')
} else {
  await sleep(1800)
  await auditar('minijuego en marcha')
}

// --- Las paginas estaticas ---
// Otra superficie y otra hoja de estilos: son las que Google indexa y las que
// recibe quien llega desde una busqueda. Se revisan todas las escritas a mano y
// una de cada tipo generado, porque las generadas comparten plantilla.
const ESTATICAS = [
  ['temario', 'temario-tai.html'],
  ['test', 'test-oposiciones-tai.html'],
  ['simulacro', 'simulacro-tai.html'],
  ['como estudiar', 'como-estudiar-tai.html'],
  ['bloque', 'bloque-4-sistemas-comunicaciones.html'],
  ['tema', 'temas/accesibilidad-wcag-usabilidad-seguridad.html'],
  ['guia', 'guia-tai.html'],
  ['preguntas frecuentes', 'preguntas-frecuentes-tai.html'],
  ['minijuegos', 'minijuegos-tai.html'],
  ['privacidad', 'privacidad.html'],
  ['cookies', 'cookies.html'],
]
for (const [nombre, ruta] of ESTATICAS) {
  await enviar('Page.navigate', { url: `${BASE}/${ruta}` })
  await sleep(1800)
  await auditar(`estática: ${nombre}`)
}

// --- Teclado: foco visible en todo lo que se puede pulsar ---
// axe no comprueba si el foco se ve, y es lo primero que pierde quien navega
// con el teclado. Se recorre con Tab de verdad, no con el.focus(): Chrome solo
// pinta el anillo de :focus-visible cuando el foco llega por teclado, asi que
// enfocar por codigo daria un falso positivo.
await enviar('Page.navigate', { url: `${BASE}/` })
await sleep(2500)
const recuento = await evaluar(`(() => {
  const lista = [...document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )]
  // Foto de cada uno en reposo: sin ella, una sombra de tarjeta permanente
  // contaria como si fuera el anillo de foco.
  window.__reposo = lista.map((el) => {
    const s = getComputedStyle(el)
    return [s.outlineStyle, s.outlineWidth, s.boxShadow, s.backgroundColor, s.color].join('|')
  })
  lista.forEach((el, indice) => el.setAttribute('data-a11y', String(indice)))
  return lista.length
})()`)
const sinFoco = []
let conFoco = 0
for (let paso = 0; paso < (recuento ?? 0) + 4; paso += 1) {
  await enviar('Input.dispatchKeyEvent', {
    type: 'rawKeyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  })
  await enviar('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  })
  await sleep(60)
  const estado = await evaluar(`(() => {
    const el = document.activeElement
    if (!el || el === document.body || el === document.documentElement) return null
    const indice = el.getAttribute('data-a11y')
    const s = getComputedStyle(el)
    const ahora = [s.outlineStyle, s.outlineWidth, s.boxShadow, s.backgroundColor, s.color].join('|')
    const etiqueta =
      el.tagName.toLowerCase() +
      (typeof el.className === 'string' && el.className
        ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.')
        : '')
    return {
      indice,
      cambia: indice === null ? null : ahora !== window.__reposo[Number(indice)],
      etiqueta: etiqueta.slice(0, 70),
      texto: (el.textContent ?? '').trim().replace(/\\s+/g, ' ').slice(0, 40),
      yaVisto: el.hasAttribute('data-ya-visto'),
    }
  })()`)
  if (!estado) break
  if (estado.yaVisto) continue
  await evaluar(`document.activeElement.setAttribute('data-ya-visto', '1')`)
  if (estado.cambia) conFoco += 1
  else sinFoco.push(`${estado.etiqueta} "${estado.texto}"`)
}

if (!recuento) {
  console.log('  FALLA teclado: no encuentro nada enfocable en la portada')
} else if (sinFoco.length) {
  console.log(
    `  teclado: ${sinFoco.length} de ${recuento} enfocables sin indicador de foco`,
  )
  for (const el of sinFoco.slice(0, 12)) console.log(`        ${el}`)
} else {
  console.log(
    `  ok    teclado: los ${conFoco} enfocables alcanzados muestran el foco`,
  )
}

ws.close()
cerrar()

console.log('')
const graves = todas.filter(
  (f) => f.impacto === 'critical' || f.impacto === 'serious',
)
console.log(
  `${revisadas} pantallas revisadas · ${todas.length} reglas incumplidas · ${graves.length} graves`,
)
if (todas.length) {
  console.log('')
  for (const fallo of todas) {
    console.log(
      `  [${fallo.impacto}] ${fallo.pantalla} :: ${fallo.id} — ${fallo.ayuda} (${fallo.total} nodos)`,
    )
    for (const nodo of fallo.nodos) {
      console.log(`        ${nodo.objetivo}`)
      if (nodo.resumen) console.log(`          ${nodo.resumen.trim()}`)
    }
  }
}
if (graves.length) process.exit(1)
