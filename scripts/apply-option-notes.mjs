import { readFileSync, writeFileSync } from 'node:fs'

const target = process.argv[2]
if (!target) {
  console.error('uso: node apply-option-notes.mjs <pregunta> [tema]')
  process.exit(1)
}

const notes = JSON.parse(readFileSync('scripts/option-notes.json', 'utf8'))
const files = [
  'src/data/questions/block1.ts',
  'src/data/questions/block2.ts',
  'src/data/questions/block3.ts',
  'src/data/questions/block4.ts',
]

const quote = (text) => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
const render = (list) =>
  `[\n${list.map((n) => `      ${quote(n)},`).join('\n')}\n    ],`

let applied = 0
const found = new Set()
const missing = new Set()

for (const file of files) {
  let source = readFileSync(file, 'utf8')
  for (const [id, list] of Object.entries(notes)) {
    if (target !== 'all' && id !== target && !id.startsWith(target)) continue
    const marker = `id: '${id}',`
    const at = source.indexOf(marker)
    if (at === -1) continue
    found.add(id)
    if (source.slice(at, at + 900).includes('optionNotes:')) continue
    const keyAt = source.indexOf('correctIndex:', at)
    if (keyAt === -1) {
      missing.add(id)
      continue
    }
    const lineEnd = source.indexOf('\n', keyAt)
    source =
      source.slice(0, lineEnd + 1) +
      `    optionNotes: ${render(list)}\n` +
      source.slice(lineEnd + 1)
    applied += 1
  }
  writeFileSync(file, source, 'utf8')
}

for (const id of Object.keys(notes)) {
  if (target !== 'all' && id !== target && !id.startsWith(target)) continue
  if (!found.has(id)) missing.add(id)
}

console.log(`aplicadas: ${applied} | ya existantes: ${found.size - applied}`)
if (missing.size) console.log(`no encontradas: ${[...missing].join(', ')}`)
