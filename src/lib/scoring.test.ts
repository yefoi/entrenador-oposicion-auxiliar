import { describe, expect, it } from 'vitest'
import { activeQuestions, questionById } from '../data/questions'
import { scoreQuestions, overallScore } from './scoring'

function entry(questionId: string, part: 1 | 2 = 1) {
  return { questionId, part }
}

describe('scoreQuestions', () => {
  it('aplica aciertos menos un tercio de los errores', () => {
    const [first, second] = activeQuestions
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    if (!first || !second) return
    const score = scoreQuestions(
      [entry(first.id), entry(second.id)],
      { [first.id]: first.correctIndex, [second.id]: (second.correctIndex + 1) % 4 },
      questionById,
      1,
    )
    expect(score.correct).toBe(1)
    expect(score.wrong).toBe(1)
    expect(score.direct).toBe(0.7)
  })

  it('no penaliza los blancos y limita la estimación a 50', () => {
    const first = activeQuestions[0]
    expect(first).toBeDefined()
    if (!first) return
    const score = scoreQuestions([entry(first.id)], {}, questionById, 1)
    expect(score.blank).toBe(1)
    expect(score.direct).toBe(0)
    expect(score.estimated).toBe(0)
    expect(score.passed).toBe(false)
  })

  it('calcula el total solo cuando todas las partes pasan', () => {
    const passing = { part: 1 as const, total: 1, correct: 1, wrong: 0, blank: 0, direct: 1, estimated: 25, threshold: 25, passed: true }
    const failing = { ...passing, estimated: 20, passed: false }
    expect(overallScore([passing, passing]).passed).toBe(true)
    expect(overallScore([passing, failing]).passed).toBe(false)
  })
})
