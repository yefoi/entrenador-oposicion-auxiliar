import { describe, expect, it } from 'vitest'
import { block1Questions } from './block1'
import { block2Questions } from './block2'
import { block3Questions } from './block3'
import { block4Questions } from './block4'
import { questions } from './index'

const raw = [
  ...block1Questions,
  ...block2Questions,
  ...block3Questions,
  ...block4Questions,
]
const rawById = new Map(raw.map((question) => [question.id, question]))

describe('normalizacion de la posicion correcta', () => {
  it('mantiene el texto de la respuesta correcta en todas las preguntas', () => {
    const wrong: string[] = []
    for (const question of questions) {
      const source = rawById.get(question.id)
      if (!source) {
        wrong.push(`${question.id}: no existe en el banco original`)
        continue
      }
      const expected = source.options[source.correctIndex]
      const actual = question.options[question.correctIndex]
      if (expected !== actual) {
        wrong.push(
          `${question.id}: esperaba "${expected}" y marco "${actual}"`,
        )
      }
    }
    expect(wrong).toEqual([])
  })

  it('conserva el mismo conjunto de opciones', () => {
    for (const question of questions) {
      const source = rawById.get(question.id)!
      expect([...question.options].sort()).toEqual(
        [...source.options].sort(),
      )
    }
  })

  it('mantiene cada nota pegada a su opcion', () => {
    const withNotes = questions.filter((q) => q.optionNotes)
    expect(withNotes.length).toBeGreaterThan(0)
    for (const question of withNotes) {
      const source = rawById.get(question.id)!
      expect(question.optionNotes).toHaveLength(4)
      expect(source.optionNotes).toHaveLength(4)
      for (let i = 0; i < 4; i += 1) {
        // La nota normalizada en la posicion i debe ser la que en el fuente
        // corresponde a la MISMA opcion que ocupa la posicion i.
        const sourceIndex = source.options.indexOf(question.options[i])
        expect(question.optionNotes![i]).toBe(source.optionNotes![sourceIndex])
      }
    }
  })

  it('reparte las respuestas correctas y aplica el desplazamiento real', () => {
    const counts = [0, 0, 0, 0]
    questions.forEach((question, index) => {
      counts[question.correctIndex] += 1
      const offset = index % 4
      const source = rawById.get(question.id)!
      expect(question.correctIndex).toBe(
        (source.correctIndex - offset + 4) % 4,
      )
    })
    for (const count of counts) {
      expect(count).toBeGreaterThan(questions.length * 0.15)
    }
  })

  it('mantiene el tamano de cada bloque en multiplo de cuatro', () => {
    // El desplazamiento depende de la POSICION en el banco, no del id, y las
    // respuestas guardadas en el navegador son indices a la opcion que se
    // pulso. Si un bloque creciera en una cantidad que no sea multiplo de
    // cuatro, todas las preguntas de los bloques siguientes girarian a otra
    // posicion y esos indices pasarian a senalar OTRA opcion: el historial de
    // quien ya practicaba quedaria mal puntuado sin que nada fallara.
    //
    // Con bloques que son multiplos de cuatro y anadidos al final, cualquier
    // lote cuyo tamano sea multiplo de cuatro conserva los desplazamientos.
    const bloques: Array<[string, number]> = [
      ['I', block1Questions.length],
      ['II', block2Questions.length],
      ['III', block3Questions.length],
      ['IV', block4Questions.length],
    ]
    for (const [nombre, tamano] of bloques) {
      expect(
        tamano % 4,
        `el bloque ${nombre} tiene ${tamano} preguntas: un cambio como este mueve el desplazamiento de las preguntas posteriores`,
      ).toBe(0)
    }
  })
})
