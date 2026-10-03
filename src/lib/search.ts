import type { Question } from '../domain/types'
import { blocks, topics } from '../data/syllabus'

const topicById = new Map(topics.map((topic) => [topic.id, topic]))
const blockById = new Map(blocks.map((block) => [block.id, block]))

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export interface QuestionMatch {
  question: Question
  topicLabel: string
  blockId: string
}

/**
 * Todo lo que se mira al buscar: enunciado, explicacion, opciones y tambien las
 * notas de cada opcion descartada y la referencia legal.
 *
 * Las notas son lo mas util del banco para estudiar, porque dicen por que se
 * cae cada distractor. Dejarlas fuera hacia que un termino que solo aparece en
 * ellas no encontrara nada, que es justo lo contrario de lo que espera quien lo
 * busca.
 */
export const questionHaystack = (question: Question) => {
  const topic = topicById.get(question.topicId)
  const block = topic ? blockById.get(topic.blockId) : undefined
  return normalizeText(
    [
      question.statement,
      question.explanation,
      ...question.options,
      ...(question.optionNotes ?? []),
      question.legalReference ?? '',
      topic?.title ?? '',
      topic?.focus ?? '',
      block?.title ?? '',
    ].join(' '),
  )
}

export function searchQuestions(
  questions: Question[],
  query: string,
  limit = 60,
): QuestionMatch[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const matches: QuestionMatch[] = []
  for (const question of questions) {
    const text = questionHaystack(question)
    if (!terms.every((term) => text.includes(term))) continue
    const topic = topicById.get(question.topicId)
    matches.push({
      question,
      topicLabel: topic?.focus ?? question.topicId,
      blockId: topic?.blockId ?? '',
    })
    if (matches.length >= limit) break
  }
  return matches
}
