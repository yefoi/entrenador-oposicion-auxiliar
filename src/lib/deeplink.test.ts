import { describe, expect, it } from 'vitest'
import { readDeepLink } from './deeplink'
import { topics } from '../data/syllabus'

describe('readDeepLink', () => {
  it('returns nothing for an empty query', () => {
    expect(readDeepLink('')).toEqual({})
    expect(readDeepLink('?')).toEqual({})
  })

  it('maps known views', () => {
    expect(readDeepLink('?vista=temario').view).toBe('syllabus')
    expect(readDeepLink('?vista=simulacro').view).toBe('exam')
    expect(readDeepLink('?vista=practica').view).toBe('practice')
    expect(readDeepLink('?vista=estadisticas').view).toBe('statistics')
  })

  it('is case insensitive and ignores unknown views', () => {
    expect(readDeepLink('?vista=TEMARIO').view).toBe('syllabus')
    expect(readDeepLink('?vista=inventado').view).toBeUndefined()
  })

  it('resolves a valid topic and defaults to practice', () => {
    const target = topics[10]
    const link = readDeepLink(`?tema=${target.id}`)
    expect(link.topicId).toBe(target.id)
    expect(link.view).toBe('practice')
  })

  it('ignores an unknown topic', () => {
    expect(readDeepLink('?tema=B9-T99').topicId).toBeUndefined()
  })

  it('accepts roman and arabic block ids', () => {
    expect(readDeepLink('?bloque=III').blockId).toBe('III')
    expect(readDeepLink('?bloque=3').blockId).toBe('III')
    expect(readDeepLink('?bloque=iii').blockId).toBe('III')
    expect(readDeepLink('?bloque=V').blockId).toBeUndefined()
  })

  it('lets an explicit view win over the default', () => {
    const target = topics[0]
    const link = readDeepLink(`?tema=${target.id}&vista=temario`)
    expect(link.topicId).toBe(target.id)
    expect(link.view).toBe('syllabus')
  })

  it('combines a block and a view', () => {
    const link = readDeepLink('?bloque=II&vista=simulacro')
    expect(link).toEqual({ view: 'exam', blockId: 'II' })
  })
})
