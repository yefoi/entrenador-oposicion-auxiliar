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
})
