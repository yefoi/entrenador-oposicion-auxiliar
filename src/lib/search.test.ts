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

  it('encuentra por una palabra que solo esta en la nota de una opcion', () => {
    // Las notas de las opciones descartadas son la parte del banco que mas se
    // consulta al estudiar, y hasta ahora no entraban en el indice: buscar un
    // termino que solo viviera en ellas no devolvia nada.
    const question = activeQuestions.find((item) => item.optionNotes)
    expect(question).toBeDefined()
    const notas = question!.optionNotes!

    // Una palabra larga de una nota que no aparezca en el resto de campos, para
    // que la prueba muerda si alguien vuelve a dejar las notas fuera.
    const sinNotas = normalizeText(
      [
        question!.statement,
        question!.explanation,
        ...question!.options,
        question!.legalReference ?? '',
      ].join(' '),
    )
    const candidata = notas
      .filter((_, index) => index !== question!.correctIndex)
      .join(' ')
      .split(/\s+/)
      .map((palabra) => normalizeText(palabra).replace(/[^a-z0-9]/g, ''))
      .find((palabra) => palabra.length >= 6 && !sinNotas.includes(palabra))

    expect(
      candidata,
      "ninguna palabra de las notas sirve: la prueba dejaria de comprobar nada",
    ).toBeDefined()

    const matches = searchQuestions([question!], candidata!)
    expect(matches.map((match) => match.question.id)).toContain(question!.id)
    expect(questionHaystack(question!)).toContain(candidata!)
  })

  it('encuentra por la referencia legal', () => {
    const question = activeQuestions.find((item) => item.legalReference)
    expect(question).toBeDefined()

    const matches = searchQuestions(activeQuestions, question!.legalReference!)
    expect(matches.map((match) => match.question.id)).toContain(question!.id)
  })
})
