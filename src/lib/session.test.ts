import { describe, expect, it } from 'vitest'
import { activeQuestions } from '../data/questions'
import { scenarios } from '../data/syllabus'
import { createExamSession, createPracticeSession } from './session'

describe('session builders', () => {
  it('crea una práctica sin repetir preguntas', () => {
    const session = createPracticeSession(activeQuestions, { count: 25, now: new Date('2026-01-01') })
    const ids = session.questions.map((entry) => entry.questionId)
    expect(session.questions).toHaveLength(25)
    expect(new Set(ids).size).toBe(25)
    expect(session.mode).toBe('practice')
  })

  it('respeta el orden de selección del modo adaptativo', () => {
    const ids = activeQuestions.slice(0, 3).map((question) => question.id)
    const session = createPracticeSession(activeQuestions, {
      count: 2,
      questionIds: ids,
      selectionStrategy: 'adaptive',
      title: 'Práctica adaptativa',
    })
    expect(session.questions.map((entry) => entry.questionId)).toEqual(ids.slice(0, 2))
    expect(session.selectionStrategy).toBe('adaptive')
  })

  it('no convierte un filtro vacío en una práctica mixta', () => {
    const session = createPracticeSession(activeQuestions, {
      count: 5,
      topicIds: [],
      title: 'Sin temas',
    })
    expect(session.questions).toHaveLength(0)
  })

  it('crea un simulacro con 80 de teoría y 20 de un bloque', () => {
    const session = createExamSession(activeQuestions, 'III', new Date('2026-01-01'))
    expect(session.questions.filter((entry) => entry.part === 1)).toHaveLength(80)
    expect(session.questions.filter((entry) => entry.part === 2)).toHaveLength(20)
    expect(session.reserveQuestionIds).toHaveLength(5)
    expect(session.scenarioReserveQuestionIds).toHaveLength(5)
    const ids = session.questions.map((entry) => entry.questionId)
    expect(new Set(ids).size).toBe(100)
    expect(session.scenarioBlock).toBe('III')
  })

  it('la parte 2 del bloque IV sale del supuesto, no de la teoría', () => {
    const session = createExamSession(activeQuestions, 'IV', new Date('2026-01-01'))
    const parte2 = session.questions.filter((entry) => entry.part === 2)
    expect(parte2).toHaveLength(20)
    // Cada pregunta de la parte 2 tiene que pertenecer al supuesto: si alguna
    // no lo hiciera, el alumno se encontraria una pregunta de teoria suelta
    // dentro del caso, sin materiales con los que responderla.
    for (const entry of parte2) {
      const question = activeQuestions.find((item) => item.id === entry.questionId)
      expect(question?.scenarioId, `${entry.questionId} no pertenece al supuesto`).toBe('IV')
    }
    // Y el banco tiene que tener al menos veinte, o el generador cae en el
    // sorteo por bloque de siempre y el supuesto deja de usarse en silencio.
    const vinculadas = activeQuestions.filter((q) => q.scenarioId === 'IV')
    expect(vinculadas.length).toBeGreaterThanOrEqual(20)
  })

  it('el escenario del bloque IV trae materiales que consultar', () => {
    const scenario = scenarios.find((item) => item.id === 'IV')
    expect(scenario).toBeDefined()
    expect(scenario!.materials.length).toBeGreaterThan(0)
    for (const material of scenario!.materials) {
      expect(material.title.trim().length).toBeGreaterThan(0)
      expect(material.body.trim().length).toBeGreaterThan(0)
    }
  })

  it('permite elegir el bloque IV sin mezclarlo con el III', () => {
    const session = createExamSession(activeQuestions, 'IV', new Date('2026-01-01'))
    const scenario = session.questions.filter((entry) => entry.part === 2)
    expect(scenario.every((entry) => questionBelongsToBlock(entry.questionId, 'IV'))).toBe(true)
  })
})

function questionBelongsToBlock(questionId: string, block: 'III' | 'IV') {
  return activeQuestions.find((question) => question.id === questionId)?.blockId === block
}
