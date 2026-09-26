import { describe, expect, it } from 'vitest'
import { blocks, MIN_QUESTIONS_PER_TOPIC, topics } from '../data/syllabus'
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
    expect(result.questionCount).toBe(activeQuestions.length)
  })

  it('admite que unos temas crezcan antes que otros', () => {
    // El suelo es por tema, no un objetivo comun: subir los bloques III y IV
    // primero no debe obligar a tocar los otros 33 temas a la vez. Se
    // comprueba con una pregunta sintetica para que el test no dependa de
    // cuanto haya crecido el banco de verdad.
    const plantilla = activeQuestions.find((q) => q.topicId === 'B4-T01')!
    const extra = {
      ...plantilla,
      id: 'B4-T01-Q99',
      statement: 'Enunciado sintetico para probar el suelo por tema.',
      options: ['a', 'b', 'c', 'd'] as [string, string, string, string],
      optionNotes: undefined,
    }
    const result = validateContent([...activeQuestions, extra])
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('rechaza un tema por debajo del suelo', () => {
    // Hay que recortar hasta dejar el tema por debajo del suelo, no quitar una
    // sola pregunta: en cuanto un tema crece, quitarle una no incumple nada.
    const delTema = activeQuestions.filter((q) => q.topicId === 'B4-T01')
    const sobran = delTema.length - (MIN_QUESTIONS_PER_TOPIC - 1)
    expect(sobran).toBeGreaterThan(0)
    const fuera = new Set(delTema.slice(0, sobran).map((q) => q.id))
    const result = validateContent(activeQuestions.filter((q) => !fuera.has(q.id)))
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('B4-T01'))).toBe(true)
  })
})
