import { describe, expect, it } from 'vitest'
import { activeQuestions, questionById, questions } from '../data/questions'
import { auditQuestions } from './question-quality'

/**
 * Budgets are ratchets: they may go down, never up. Adding a question with a
 * giveaway distractor has to be a conscious decision, not an accident.
 */
const BUDGET = {
  longitud: 0,
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

  it('mantiene las notas de opcion pegadas a su texto', () => {
    for (const question of activeQuestions) {
      if (!question.optionNotes) continue
      expect(question.optionNotes).toHaveLength(4)
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      // La nota de la opcion correcta se deja vacia a proposito: la
      // explicacion ya cubre por que esa es la buena.
      expect(question.optionNotes[question.correctIndex]).toBe('')
      for (let i = 0; i < 4; i += 1) {
        if (i === question.correctIndex) continue
        expect(question.optionNotes[i].trim().length).toBeGreaterThan(15)
      }
    }
  })

  it('cubrio por completo los bloques I y II con notas de opcion', () => {
    const coveredBlocks = ['I', 'II'] as const
    for (const block of coveredBlocks) {
      const questions = activeQuestions.filter((q) => q.blockId === block)
      expect(questions.length).toBeGreaterThan(0)
      const covered = questions.filter((q) => q.optionNotes).length
      expect(covered).toBe(questions.length)
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
