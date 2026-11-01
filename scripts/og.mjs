import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * Tarjeta que se ve al compartir un enlace.
 *
 * Sin og:image, WhatsApp, Telegram y X muestran solo texto. Se genera desde
 * una plantilla para que no dependa de una captura de la aplicacion que se
 * quede vieja cuando cambie la paleta.
 *
 * Uso: npm run og
 */

const ANCHO = 1200
const ALTO = 630

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${ANCHO}px;
    height: ${ALTO}px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 64px 72px;
    color: #ffffff;
    background:
      radial-gradient(circle at 88% 12%, rgba(103, 82, 231, 0.55), transparent 46%),
      radial-gradient(circle at 8% 92%, rgba(17, 123, 112, 0.42), transparent 44%),
      #201a3b;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }
  .marca { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 700; letter-spacing: -0.01em; }
  .bandera {
    display: inline-block; width: 30px; height: 21px; border-radius: 3px;
    background: linear-gradient(#c60b1e 0 25%, #ffc400 25% 75%, #c60b1e 75%);
  }
  .sub { margin-left: 4px; color: #b9b4d6; font-size: 22px; font-weight: 500; }
  h1 { font-size: 66px; line-height: 1.08; letter-spacing: -0.025em; max-width: 980px; }
  h1 em { color: #9d8cff; font-style: normal; }
  .datos { display: flex; align-items: center; gap: 22px; font-size: 25px; color: #d9d5ee; }
  .punto { width: 7px; height: 7px; border-radius: 50%; background: #6d59e8; }
  .pie { display: flex; justify-content: space-between; align-items: baseline; font-size: 22px; color: #a9a5bd; }
  .dominio { color: #ffffff; font-weight: 600; }
</style>
</head>
<body>
  <div class="marca">
    <span class="bandera"></span>Plaza TAI<span class="sub">· entrenador de oposiciones</span>
  </div>
  <h1>Practica el examen TAI<br />y aprende por qué falla<br /><em>cada opción descartada</em>.</h1>
  <div class="datos">
    <span>568 preguntas</span><span class="punto"></span>
    <span>33 temas</span><span class="punto"></span>
    <span>sin registro</span>
  </div>
  <div class="pie">
    <span>Simulacros con la mecánica real de la convocatoria</span>
    <span class="dominio">oposiciones-tai.app</span>
  </div>
</body>
</html>`

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

const perfil = mkdtempSync(join(tmpdir(), 'plaza-og-'))
const navegador = spawn(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--window-size=${ANCHO},${ALTO}`,
    '--remote-debugging-port=9335',
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

let listo = false
for (let intento = 0; intento < 30 && !listo; intento += 1) {
  await sleep(500)
  try {
    await fetch('http://127.0.0.1:9335/json/version')
    listo = true
  } catch {
    // Sigue arrancando.
  }
}
if (!listo) {
  console.error('El navegador no arranco')
  process.exit(2)
}

const pestanas = await (await fetch('http://127.0.0.1:9335/json/list')).json()
const pestana = pestanas.find((t) => t.type === 'page')
const ws = new WebSocket(pestana.webSocketDebuggerUrl)
await new Promise((ok, mal) => {
  ws.addEventListener('open', ok, { once: true })
  ws.addEventListener('error', mal, { once: true })
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
  new Promise((ok) => {
    const id = ++seq
    pendientes.set(id, ok)
    ws.send(JSON.stringify({ id, method, params }))
  })

await enviar('Page.enable')
await enviar('Emulation.setDeviceMetricsOverride', {
  width: ANCHO,
  height: ALTO,
  deviceScaleFactor: 1,
  mobile: false,
})
await enviar('Page.navigate', {
  url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
})
await sleep(1200)

const captura = await enviar('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 0, y: 0, width: ANCHO, height: ALTO, scale: 1 },
})
const bytes = Buffer.from(captura.result.data, 'base64')
writeFileSync(resolve('public/og-plaza-tai.png'), bytes)

ws.close()
cerrar()

console.log(`og-plaza-tai.png · ${ANCHO}x${ALTO} · ${Math.round(bytes.length / 1024)} kB`)
