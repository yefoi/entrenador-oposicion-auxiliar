import { describe, expect, it } from 'vitest'
import type { Attempt } from '../domain/types'
import { activeQuestions, questionById } from '../data/questions'
import { getMasteryReport, emptyMasteryReport } from './mastery'

const bank = activeQuestions.slice(0, 6)

const makeAttempt = (
  id: string,
  entries: { questionId: string; answer: number }[],
  completedAt: string,
): Attempt => ({
  id,
  sessionId: `s-${id}`,
  mode: 'practice',
  title: 'Test',
  completedAt,
  durationSeconds: 60,
  questions: entries.map((entry) => ({ questionId: entry.questionId, part: 1 })),
  answers: Object.fromEntries(entries.map((e) => [e.questionId, e.answer])),
  flagged: [],
  scores: [],
  reviewTopicIds: [],
})

const right = (id: string) => questionById.get(id)!.correctIndex
const wrong = (id: string) => (questionById.get(id)!.correctIndex + 1) % 4

describe('getMasteryReport', () => {
  it('is all zeroes with no attempts', () => {
    const report = getMasteryReport([])
    expect(report.actividad.intentos).toBe(0)
    expect(report.cobertura.temasTocados).toBe(0)
    expect(report.dominio.primeras.accuracy).toBe(0)
    expect(report.dominio.retencion.ratio).toBe(0)
  })

  it('separates a first correct answer from a later one', () => {
    const [a, b, c] = bank
    const report = getMasteryReport([
      makeAttempt('1', [{ questionId: a.id, answer: right(a.id) }], '2026-01-01T10:00:00.000Z'),
      makeAttempt(
        '2',
        [
          { questionId: b.id, answer: right(b.id) },
          { questionId: c.id, answer: right(c.id) },
        ],
        '2026-01-02T10:00:00.000Z',
      ),
      makeAttempt(
        '3',
        [{ questionId: a.id, answer: right(a.id) }],
        '2026-01-09T10:00:00.000Z',
      ),
    ])
    expect(report.dominio.primeras.presented).toBe(3)
    expect(report.dominio.primeras.correct).toBe(3)
    expect(report.dominio.repeticiones.presented).toBe(1)
    expect(report.dominio.repeticiones.correct).toBe(1)
    expect(report.actividad.intentos).toBe(3)
    expect(report.actividad.diasActivos).toBe(3)
  })

  it('counts a wrong answer as a first attempt, not a repeat', () => {
    const [a] = bank
    const report = getMasteryReport([
      makeAttempt('1', [{ questionId: a.id, answer: wrong(a.id) }], '2026-01-01T10:00:00.000Z'),
    ])
    expect(report.dominio.primeras.presented).toBe(1)
    expect(report.dominio.primeras.correct).toBe(0)
    expect(report.dominio.repeticiones.presented).toBe(0)
  })

  it('tracks recovery of a previously failed question', () => {
    const [a, b] = bank
    const report = getMasteryReport([
      makeAttempt('1', [{ questionId: a.id, answer: wrong(a.id) }], '2026-01-01T10:00:00.000Z'),
      makeAttempt('2', [{ questionId: b.id, answer: wrong(b.id) }], '2026-01-02T10:00:00.000Z'),
      makeAttempt(
        '3',
        [{ questionId: a.id, answer: right(a.id) }],
        '2026-01-05T10:00:00.000Z',
      ),
    ])
    expect(report.dominio.retencion.recuperadas).toBe(1)
    expect(report.dominio.retencion.pendientes).toBe(1)
    expect(report.dominio.retencion.ratio).toBe(0.5)
  })

  it('measures coverage in topics and in the bank', () => {
    const [a, b] = bank
    const report = getMasteryReport([
      makeAttempt(
        '1',
        [
          { questionId: a.id, answer: right(a.id) },
          { questionId: b.id, answer: right(b.id) },
        ],
        '2026-01-01T10:00:00.000Z',
      ),
    ])
    expect(report.cobertura.preguntasVistas).toBe(2)
    expect(report.cobertura.preguntasTotales).toBe(activeQuestions.length)
    expect(report.cobertura.temasTocados).toBeLessThanOrEqual(
      report.cobertura.temasTotales,
    )
    const totalVistos = report.cobertura.porBloque.reduce(
      (sum, item) => sum + item.vistos,
      0,
    )
    expect(totalVistos).toBe(2)
  })

  it('does not inflate activity by repeating the same question', () => {
    const [a] = bank
    const report = getMasteryReport([
      makeAttempt('1', [{ questionId: a.id, answer: right(a.id) }], '2026-01-01T10:00:00.000Z'),
      makeAttempt('2', [{ questionId: a.id, answer: right(a.id) }], '2026-01-02T10:00:00.000Z'),
    ])
    expect(report.actividad.preguntasPresentadas).toBe(1)
    expect(report.actividad.sesiones).toBe(2)
  })

  it('ignores questions that were never answered', () => {
    const [a, b] = bank
    const attempt = makeAttempt('1', [{ questionId: a.id, answer: right(a.id) }], '2026-01-01T10:00:00.000Z')
    attempt.questions.push({ questionId: b.id, part: 1 })
    const report = getMasteryReport([attempt])
    expect(report.cobertura.preguntasVistas).toBe(1)
  })

  it('empty report keeps the real bank size', () => {
    const report = emptyMasteryReport()
    expect(report.cobertura.preguntasTotales).toBe(activeQuestions.length)
    expect(report.cobertura.temasTotales).toBe(33)
  })
})
