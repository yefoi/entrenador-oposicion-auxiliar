import { describe, expect, it } from 'vitest'
import { activeQuestions } from '../data/questions'
import { createExamSession, createPracticeSession } from './session'

describe('session builders', () => {
  it('crea una práctica sin repetir preguntas', () => {
    const session = createPracticeSession(activeQuestions, { count: 25, now: new Date('2026-01-01') })
    const ids = session.questions.map((entry) => entry.questionId)
    expect(session.questions).toHaveLength(25)
    expect(new Set(ids).size).toBe(25)
    expect(session.mode).toBe('practice')
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

  it('permite elegir el bloque IV sin mezclarlo con el III', () => {
    const session = createExamSession(activeQuestions, 'IV', new Date('2026-01-01'))
    const scenario = session.questions.filter((entry) => entry.part === 2)
    expect(scenario.every((entry) => questionBelongsToBlock(entry.questionId, 'IV'))).toBe(true)
  })
})

function questionBelongsToBlock(questionId: string, block: 'III' | 'IV') {
  return activeQuestions.find((question) => question.id === questionId)?.blockId === block
}
