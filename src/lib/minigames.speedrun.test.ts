import { describe, expect, it } from 'vitest'
import { createMinigameSession, isShortQuestion } from './minigames'
import { activeQuestions } from '../data/questions'

const speedrun = (extra: Record<string, unknown> = {}) =>
  createMinigameSession(activeQuestions, {
    type: 'speedrun',
    count: 20,
    random: () => 0.5,
    now: new Date('2026-01-01T10:00:00.000Z'),
    ...extra,
  })

describe('speedrun', () => {
  it('has a deadline when timed', () => {
    expect(speedrun().expiresAt).toBe('2026-01-01T10:01:00.000Z')
  })

  it('has no deadline when untimed', () => {
    expect(speedrun({ timed: false }).expiresAt).toBeUndefined()
  })

  it('only draws short questions when untimed', () => {
    const session = speedrun({ timed: false })
    expect(session.questions.length).toBeGreaterThan(0)
    for (const entry of session.questions) {
      const question = activeQuestions.find((q) => q.id === entry.questionId)
      expect(question && isShortQuestion(question)).toBe(true)
    }
  })

  it('can draw the whole bank when timed', () => {
    const shortCount = activeQuestions.filter(isShortQuestion).length
    const timed = speedrun()
    const timedCount = new Set(
      timed.questions.map((entry) => entry.questionId),
    ).size
    const untimed = speedrun({ timed: false })
    const untimedCount = new Set(
      untimed.questions.map((entry) => entry.questionId),
    ).size
    expect(timedCount).toBeGreaterThanOrEqual(untimedCount)
    expect(shortCount).toBeLessThan(activeQuestions.length)
  })

  it('flags short questions by statement and option length', () => {
    const long = activeQuestions.filter((q) => !isShortQuestion(q))
    expect(long.length).toBeGreaterThan(0)
    for (const question of long) {
      expect(
        question.statement.length > 140 ||
          question.options.some((option) => option.length > 90),
      ).toBe(true)
    }
  })
})
