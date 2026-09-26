import { describe, expect, it } from 'vitest'
import { questionById, questions } from '../data/questions'
import { REGRADE_STAMP, regradeState } from './regrade'
import { getQuestionOutcome, updateTopicReviews } from './statistics'
import type { Attempt, PartScore, TrainerState } from '../domain/types'

/**
 * Picks a question from the half the bug actually broke, where an answer of 0
 * is unambiguously wrong.
 *
 * 0793e33 rotated the options left by `index % 4` but moved correctIndex to
 * the right, so only the questions at index 1 and 3 modulo 4 ended up with the
 * wrong key. Offset 0 was the quarter that escaped, so a test that grabs any
 * question with correctIndex !== 0 can silently pick an unaffected one and
 * still pass. This one requires the affected offsets.
 */
function questionWithWrongAtSlotZero() {
  const question = questions.find(
    (candidate, index) =>
      (index % 4 === 1 || index % 4 === 3) && candidate.correctIndex !== 0,
  )
  expect(question).toBeDefined()
  return question!
}

function attemptWith(
  questionId: string,
  answer: number,
  completedAt: string,
): Attempt {
  const question = questionById.get(questionId)!
  return {
    id: `attempt-${questionId}-${completedAt}`,
    sessionId: 'session-1',
    mode: 'practice',
    title: 'Practicar',
    completedAt,
    durationSeconds: 60,
    questions: [{ questionId, part: 1 }],
    answers: { [questionId]: answer },
    flagged: [],
    // Deliberately wrong-era snapshot: everything scored as a perfect run.
    scores: [
      {
        part: 1,
        total: 1,
        correct: 1,
        wrong: 0,
        blank: 0,
        direct: 1,
        estimated: 100,
        threshold: 70,
        passed: true,
      } as PartScore,
    ],
    reviewTopicIds: [question.topicId],
  }
}

function stateWith(attempts: Attempt[], reviews = {}): TrainerState {
  return {
    version: 1,
    sessions: [],
    attempts,
    reviews,
    activity: [],
    settings: {
      examDate: '2026-12-01',
      weeklyMinutes: 180,
      studyDays: [1, 2, 3, 4, 5],
      targetScore: 25,
      reducedMotion: false,
      showExplanations: true,
    },
    lastSavedAt: completedAtOf(attempts),
  }
}

const completedAtOf = (attempts: Attempt[]) =>
  attempts[attempts.length - 1]?.completedAt ?? '2026-01-01T00:00:00.000Z'

describe('regrade tras corregir la clave de respuestas', () => {
  it('reescribe las puntuaciones congeladas contra la clave actual', () => {
    const question = questionWithWrongAtSlotZero()
    const state = stateWith([attemptWith(question.id, 0, '2026-09-20T10:00:00.000Z')])

    expect(state.attempts[0].scores[0].correct).toBe(1)

    const after = regradeState(state)

    expect(after.attempts[0].scores[0].correct).toBe(0)
    expect(after.attempts[0].scores[0].wrong).toBe(1)
    expect(after.attempts[0].scores[0].passed).toBe(false)
  })

  it('conserva la respuesta correcta cuando el indice pulsado acierta', () => {
    const question = questionWithWrongAtSlotZero()
    const state = stateWith([
      attemptWith(question.id, question.correctIndex, '2026-09-20T10:00:00.000Z'),
    ])

    const after = regradeState(state)

    expect(after.attempts[0].scores[0].correct).toBe(1)
    expect(after.attempts[0].scores[0].wrong).toBe(0)
  })

  it('deja el nivel de repaso en cero tras un fallo', () => {
    const question = questionWithWrongAtSlotZero()
    const staleReview = {
      [question.topicId]: {
        topicId: question.topicId,
        // Inflated by the wrong key: this topic looked mastered.
        level: 4,
        dueAt: '2026-12-01',
        lastResult: 'correct' as const,
      },
    }
    const state = stateWith(
      [attemptWith(question.id, 0, '2026-09-20T10:00:00.000Z')],
      staleReview,
    )

    const after = regradeState(state)

    expect(after.reviews[question.topicId].level).toBe(0)
    expect(after.reviews[question.topicId].lastResult).toBe('incorrect')
  })

  it('reconstruye la escalera de repasos con la fecha de cada intento', () => {
    const question = questionWithWrongAtSlotZero()
    const first = attemptWith(question.id, 0, '2026-09-01T10:00:00.000Z')
    const second = attemptWith(
      question.id,
      question.correctIndex,
      '2026-09-05T10:00:00.000Z',
    )
    const third = attemptWith(
      question.id,
      question.correctIndex,
      '2026-09-09T10:00:00.000Z',
    )
    const state = stateWith([third, first, second])

    const after = regradeState(state)

    expect(after.reviews[question.topicId].level).toBe(2)
    // The due date must come from the last real attempt, not from today, or
    // every migrated topic would look freshly reviewed.
    expect(after.reviews[question.topicId].dueAt).not.toBe(
      new Date().toISOString().slice(0, 10),
    )
  })

  it('conserva los indices pulsados tal cual', () => {
    const question = questionWithWrongAtSlotZero()
    const state = stateWith([
      attemptWith(question.id, question.correctIndex, '2026-09-20T10:00:00.000Z'),
    ])

    const after = regradeState(state)

    expect(after.attempts[0].answers[question.id]).toBe(question.correctIndex)
    expect(
      getQuestionOutcome(after.attempts[0], question.id, questionById),
    ).toBe('correct')
  })

  it('es idempotente: una segunda pasada no vuelve a tocar nada', () => {
    const question = questionWithWrongAtSlotZero()
    const once = regradeState(
      stateWith([attemptWith(question.id, 0, '2026-09-20T10:00:00.000Z')]),
    )
    const twice = regradeState(once)

    expect(twice).toBe(once)
    expect(twice.regradedAtKey).toBe(REGRADE_STAMP)
  })

  it('no inventa repasos en temas que nunca se practicaron', () => {
    const question = questionWithWrongAtSlotZero()
    const after = regradeState(
      stateWith([attemptWith(question.id, 0, '2026-09-20T10:00:00.000Z')]),
    )

    expect(Object.keys(after.reviews)).toEqual([question.topicId])
  })

  it('degrada a un estado vacio sin lanzar cuando no hay intentos', () => {
    const after = regradeState(stateWith([]))

    expect(after.attempts).toEqual([])
    expect(after.reviews).toEqual({})
    expect(after.activity).toEqual([])
    expect(after.regradedAtKey).toBe(REGRADE_STAMP)
  })

  it('reproduce el mismo resultado que grading los intentos en vivo', () => {
    const question = questionWithWrongAtSlotZero()
    const attempt = attemptWith(question.id, 0, '2026-09-20T10:00:00.000Z')
    const after = regradeState(stateWith([attempt]))
    let reviews = {}
    reviews = updateTopicReviews(
      reviews,
      after.attempts[0],
      questionById,
      new Date(attempt.completedAt),
    )

    expect(after.reviews).toEqual(reviews)
  })
})
