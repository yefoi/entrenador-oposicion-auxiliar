import { describe, expect, it } from 'vitest'
import { activeQuestions, questionById } from '../data/questions'
import {
  calculateBestStreak,
  createMinigameSession,
  getMinigameStreak,
} from './minigames'

describe('minigames', () => {
  it('crea un mazo de flashcards sin repetir preguntas', () => {
    const session = createMinigameSession(activeQuestions, {
      type: 'flashcards',
      count: 5,
      now: new Date('2026-01-01T10:00:00.000Z'),
      random: () => 0.2,
    })
    const ids = session.questions.map((entry) => entry.questionId)
    expect(session.mode).toBe('minigame')
    expect(session.minigameType).toBe('flashcards')
    expect(ids).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
    expect(session.expiresAt).toBeUndefined()
  })

  it('asigna un minuto al speedrun', () => {
    const now = new Date('2026-01-01T10:00:00.000Z')
    const session = createMinigameSession(activeQuestions, {
      type: 'speedrun',
      now,
    })
    expect(session.expiresAt).toBe('2026-01-01T10:01:00.000Z')
    expect(session.questions).toHaveLength(20)
  })

  it('calcula la racha actual y la mejor racha', () => {
    const session = createMinigameSession(activeQuestions, {
      type: 'flashcards',
      count: 3,
      random: () => 0.1,
    })
    const [first, second, third] = session.questions
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(third).toBeDefined()
    if (!first || !second || !third) return
    const answers = {
      [first.questionId]: questionById.get(first.questionId)?.correctIndex ?? 0,
      [second.questionId]:
        (questionById.get(second.questionId)?.correctIndex ?? 0) + 1,
      [third.questionId]: questionById.get(third.questionId)?.correctIndex ?? 0,
    }
    expect(getMinigameStreak(session.questions, answers, questionById)).toEqual(
      {
        current: 1,
        best: 1,
      },
    )
    expect(calculateBestStreak(session.questions, answers, questionById)).toBe(
      1,
    )
  })

  it('prioriza los temas indicados para el modo de debilidades', () => {
    const firstTopic = activeQuestions[0]?.topicId
    expect(firstTopic).toBeDefined()
    if (!firstTopic) return
    const session = createMinigameSession(activeQuestions, {
      type: 'weakness',
      topicIds: [firstTopic],
      count: 4,
    })
    expect(session.questions).toHaveLength(4)
    expect(
      session.questions.every((entry) => entry.questionId.includes(firstTopic)),
    ).toBe(true)
  })
})
