import { describe, expect, it } from 'vitest'
import { activeQuestions } from '../data/questions'
import { selectAdaptiveQuestionIds } from './adaptive'

describe('adaptive selector', () => {
  it('selects unique questions and balances untouched topics', () => {
    const ids = selectAdaptiveQuestionIds(activeQuestions, [], [], 20)
    const topics = new Set(
      ids.map((id) => activeQuestions.find((question) => question.id === id)?.topicId),
    )
    expect(ids).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
    expect(topics.size).toBe(20)
  })

  it('returns fewer questions when the requested count exceeds the bank', () => {
    const ids = selectAdaptiveQuestionIds(activeQuestions, [], [], activeQuestions.length + 1)
    expect(ids).toHaveLength(activeQuestions.length)
    expect(new Set(ids).size).toBe(activeQuestions.length)
  })
})
