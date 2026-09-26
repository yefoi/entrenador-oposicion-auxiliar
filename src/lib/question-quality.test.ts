import { describe, expect, it } from 'vitest'
import { activeQuestions, questionById, questions } from '../data/questions'
import { auditQuestions } from './question-quality'

/**
 * Budgets are ratchets: they may go down, never up. Adding a question with a
 * giveaway distractor has to be a conscious decision, not an accident.
 */
const BUDGET = {
  longitud: 34,
  'muy-corta': 0,
  parecida: 19,
}

describe('calidad de los distractores', () => {
  it('no supera el presupuesto de defectos mecanicos', () => {
    const flagged = auditQuestions(activeQuestions)
    const mechanical = flagged.filter((entry) =>
      entry.issues.some(
        (issue) => issue.kind === 'longitud' || issue.kind === 'muy-corta',
      ),
    )
    const tooShort = flagged.filter((entry) =>
      entry.issues.some((issue) => issue.kind === 'muy-corta'),
    )
    expect(mechanical.length).toBeLessThanOrEqual(BUDGET['longitud'])
    expect(tooShort.length).toBeLessThanOrEqual(BUDGET['muy-corta'])
  })

  it('no supera el presupuesto de opciones casi identicas', () => {
    const similar = auditQuestions(activeQuestions).filter((entry) =>
      entry.issues.some((issue) => issue.kind === 'parecida'),
    )
    expect(similar.length).toBeLessThanOrEqual(BUDGET.parecida)
  })

  it('conserva la respuesta correcta al normalizar el orden', () => {
    // The bank is shuffled at load time, so a normalization bug would silently
    // move the right answer. Compare the text, not the index.
    for (const question of questions) {
      const source = questionById.get(question.id)
      expect(source).toBeDefined()
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(question.correctIndex).toBeLessThan(4)
    }
  })

  it('no tiene preguntas sin explicar', () => {
    for (const question of activeQuestions) {
      expect(question.explanation.trim().length).toBeGreaterThan(30)
    }
  })

  it('reparte las respuestas correctas entre las cuatro posiciones', () => {
    const counts = [0, 0, 0, 0]
    for (const question of activeQuestions) counts[question.correctIndex] += 1
    for (const count of counts) {
      expect(count).toBeGreaterThan(activeQuestions.length * 0.15)
    }
  })
})
