import { describe, expect, it } from 'vitest'
import { blocks, topics } from '../data/syllabus'
import { activeQuestions } from '../data/questions'
import { validateContent } from './validation'

describe('content catalog', () => {
  it('contains the official four-block, 33-topic structure', () => {
    expect(blocks).toHaveLength(4)
    expect(topics).toHaveLength(33)
    expect(topics.filter((topic) => topic.blockId === 'I')).toHaveLength(9)
    expect(topics.filter((topic) => topic.blockId === 'II')).toHaveLength(5)
    expect(topics.filter((topic) => topic.blockId === 'III')).toHaveLength(9)
    expect(topics.filter((topic) => topic.blockId === 'IV')).toHaveLength(10)
  })

  it('passes the content validation gate', () => {
    const result = validateContent(activeQuestions)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
    expect(result.questionCount).toBe(165)
  })
})
