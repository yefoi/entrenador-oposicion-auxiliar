import { readFileSync, writeFileSync } from 'node:fs'

const target = process.argv[2]
if (!target) {
  console.error('uso: node apply-option-notes.mjs <pregunta> [tema]')
  process.exit(1)
}

const notes = JSON.parse(readFileSync('scripts/option-notes.json', 'utf8'))

const problems = []
for (const [id, list] of Object.entries(notes)) {
  if (!Array.isArray(list) || list.length !== 4) {
    problems.push(`${id}: se esperan 4 notas, hay ${list?.length}`)
    continue
  }
  const empty = list.filter((note) => !note.trim()).length
  if (empty !== 1) {
    problems.push(`${id}: debe haber exactamente una nota vacía, hay ${empty}`)
  }
  for (const note of list) {
    // Rangos que solo aparecen por corrupcion: cirilico, chino y el mojibake
    // tipico de un texto UTF-8 leido como latin-1. Se permiten signos
    // matematicos y alfabetos griegos, que son legitimos en este temario.
    if (/[\u0400-\u04FF\u3000-\u303F\u4E00-\u9FFF\uFF00-\uFFEF]/.test(note)) {
      problems.push(`${id}: la nota contiene caracteres de otro alfabeto: ${note.slice(0, 40)}`)
    }
    if (/[\u00C3\u00C2][\u0080-\u00BF]/.test(note)) {
      problems.push(`${id}: la nota parece texto mal codificado: ${note.slice(0, 40)}`)
    }
    // Palas inglesas que se han colado de verdad al escribir estas notas.
    // Lista corta y concreta: un filtro general de palabras seria inútil
    // porque marcaria todo el español normal.
    const inglesas = [
      'player', 'string', 'safety', 'waiting', 'magic', 'correct', 'answer',
      'journey', 'ignore', 'master', 'opening', 'share', 'spare', 'employee',
      'employees', 'affected', 'equality', 'levine', 'situations', 'sovereignty',
      'candidate', 'candidates', 'approach', 'escape', 'journeys', 'record',
      'owner', 'match', 'scale', 'reset', 'source', 'target', 'point', 'label',
      'block', 'shift', 'sprite', 'render', 'commit', 'smart',
      'bright', 'please',
    ]
    for (const word of note.match(/[A-Za-z]{4,}/g) ?? []) {
      if (inglesas.includes(word.toLowerCase())) {
        problems.push(
          `${id}: palabra no esperada "${word}" en "${note.slice(0, 45)}"`,
        )
      }
    }
  }
}
if (problems.length) {
  console.error('JSON inválido:\n  ' + problems.join('\n  '))
  process.exit(1)
}
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
