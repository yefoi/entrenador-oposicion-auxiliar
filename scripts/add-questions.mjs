import { readFileSync, writeFileSync } from 'node:fs'

/**
 * Appends fully written questions to a block file.
 *
 * Usage: node scripts/add-questions.mjs <archivo.json>
 *
 * The JSON holds an array of questions with a `block` field naming the target
 * file. Ids are derived from the topic when omitted, continuing the sequence
 * already in the file, so adding questions never renumbers or disturbs the
 * ones already there.
 *
 * This exists because hand-editing a 2.000-line TypeScript array is where the
 * real mistakes happen: a missing comma, a note on the wrong option, an id
 * that collides. The script only writes what the JSON says, and the test suite
 * checks the result.
 */

const [, , source] = process.argv
if (!source) {
  console.error('Falta el JSON de preguntas')
  process.exit(1)
}

const bank = JSON.parse(readFileSync(source, 'utf8'))
if (!Array.isArray(bank) || bank.length === 0) {
  console.error('El JSON debe ser un array con al menos una pregunta')
  process.exit(1)
}

const files = {
  3: 'src/data/questions/block3.ts',
  4: 'src/data/questions/block4.ts',
  2: 'src/data/questions/block2.ts',
  1: 'src/data/questions/block1.ts',
}
const blockIds = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }

const escape = (text) => text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
const quote = (text) => `'${escape(text)}'`
const wrap = (text, indent) => {
  const line = `${indent}${quote(text)},`
  if (line.length <= 80) return line
  return `${indent}${quote(text)},`
}

const renderQuestion = (question, id, blockId) => {
  const notes = question.optionNotes
  const optionLines = question.options.map((o) => wrap(o, '      ')).join('\n')
  const seccionNotas =
    notes && notes.some(Boolean)
      ? `    optionNotes: [\n${notes.map((n) => wrap(n, '      ')).join('\n')}\n    ],\n`
      : ''
  return `  {
    id: ${quote(id)},
    topicId: ${quote(question.topicId)},
    blockId: ${quote(question.blockId ?? blockId)},
    statement:
      ${quote(question.statement)},
    options: [
${optionLines}
    ],
    correctIndex: ${question.correctIndex},
${seccionNotas}    explanation:
      ${quote(question.explanation)},
    difficulty: ${quote(question.difficulty)},
    source: ${quote(question.source ?? 'generated')},
    sourceLabel: ${quote(question.sourceLabel ?? 'Banco propio · práctica no oficial')},
    reviewedOn: ${quote(question.reviewedOn ?? new Date().toISOString().slice(0, 10))},
    active: true,
  },
`
}

let added = 0

for (const block of Object.keys(files)) {
  const enBloque = bank.filter((q) => String(q.block) === String(block))
  if (enBloque.length === 0) continue
  const ruta = files[block]
  let texto = readFileSync(ruta, 'utf8')

  for (const question of enBloque) {
    const existentes = [...texto.matchAll(new RegExp(`${question.topicId}-Q(\\d\\d)`, 'g'))]
      .map((m) => Number(m[1]))
    const siguiente = existentes.length === 0 ? 1 : Math.max(...existentes) + 1
    const id = question.id ?? `${question.topicId}-Q${String(siguiente).padStart(2, '0')}`
    if (texto.includes(`id: '${id}'`)) {
      console.error(`Ya existe ${id}, se omite`)
      continue
    }
    if (siguiente > 99) {
      console.error(`${question.topicId} pasa de 99 preguntas, el id de dos digitos no da`)
      process.exit(1)
    }
    // Los archivos estan en CRLF, asi que el cierre es \r\n]\r\n: buscar solo
    // \n] no encuentra nada y el script seguiria diciendo que ha escrito.
    const cierre = /\r?\n\]\r?\n?$/
    if (!cierre.test(texto)) {
      console.error(`No se encontro el cierre del array en ${ruta}`)
      process.exit(1)
    }
    const antes = texto
    texto = texto.replace(cierre, `\n${renderQuestion(question, id, blockIds[block])}]\n`)
    if (texto === antes || !texto.includes(`id: '${id}'`)) {
      console.error(`No se pudo insertar ${id}`)
      process.exit(1)
    }
    added += 1
  }
  writeFileSync(ruta, texto, 'utf8')
  console.log(`${ruta}: ${enBloque.length} preguntas anadidas`)
}

console.log(`total: ${added}`)
