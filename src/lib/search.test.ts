import { describe, expect, it } from 'vitest'
import { normalizeText, questionHaystack, searchQuestions } from './search'
import { activeQuestions } from '../data/questions'

describe('searchQuestions', () => {
  it('ignores case and accents', () => {
    expect(normalizeText('Acción y Señal')).toBe('accion y senal')
  })

  it('returns nothing for an empty query', () => {
    expect(searchQuestions(activeQuestions, '   ')).toHaveLength(0)
  })

  it('matches every term across the searchable fields', () => {
    const matches = searchQuestions(activeQuestions, 'base de datos')
    expect(matches.length).toBeGreaterThan(0)
    for (const match of matches) {
      const searchable = questionHaystack(match.question)
      for (const term of ['base', 'datos']) {
        expect(searchable).toContain(term)
      }
    }
  })

  it('finds questions by topic name even when the text differs', () => {
    const matches = searchQuestions(activeQuestions, 'firma electronica')
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.every((match) => match.blockId.length > 0)).toBe(true)
  })

  it('respects the limit', () => {
    expect(searchQuestions(activeQuestions, 'de', 5)).toHaveLength(5)
  })

  it('scopes results to the given pool', () => {
    const sample = activeQuestions.slice(0, 5)
    const matches = searchQuestions(
      sample,
      normalizeText(sample[0].statement).slice(0, 12),
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.length).toBeLessThanOrEqual(sample.length)
  })
})
