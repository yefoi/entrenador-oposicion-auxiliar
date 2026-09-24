import type { BlockId, Question } from '../domain/types'
import { blocks, topics } from '../data/syllabus'

export interface ContentValidation {
  valid: boolean
  blockCounts: Record<BlockId, number>
  topicCount: number
  questionCount: number
  errors: string[]
}

export function validateContent(allQuestions: Question[]): ContentValidation {
  const errors: string[] = []
  const blockCounts: Record<BlockId, number> = { I: 0, II: 0, III: 0, IV: 0 }
  const topicById = new Map(topics.map((topic) => [topic.id, topic]))
  const topicCounts = new Map<string, number>()
  const ids = new Set<string>()
  const statements = new Set<string>()

  for (const question of allQuestions) {
    if (question.blockId in blockCounts) blockCounts[question.blockId] += 1
    topicCounts.set(
      question.topicId,
      (topicCounts.get(question.topicId) ?? 0) + 1,
    )
    if (ids.has(question.id)) errors.push(`ID duplicado: ${question.id}`)
    ids.add(question.id)
    if (statements.has(question.statement))
      errors.push(`Enunciado duplicado: ${question.id}`)
    statements.add(question.statement)
    if (!/^B[1-4]-T\d{2}-Q\d{2}$/.test(question.id))
      errors.push(`ID inválido: ${question.id}`)
    const expectedTopic = topicById.get(question.topicId)
    if (!expectedTopic) errors.push(`Tema desconocido: ${question.id}`)
    if (expectedTopic && expectedTopic.blockId !== question.blockId)
      errors.push(`Bloque incorrecto: ${question.id}`)
    if (expectedTopic && !question.id.startsWith(`${expectedTopic.id}-Q`))
      errors.push(`ID no asociado al tema: ${question.id}`)
    if (question.options.length !== 4)
      errors.push(`Número de opciones inválido: ${question.id}`)
    if (question.options.some((option) => !option.trim()))
      errors.push(`Opción vacía: ${question.id}`)
    if (
      new Set(
        question.options.map((option) => option.trim().toLocaleLowerCase('es')),
      ).size !== question.options.length
    ) {
      errors.push(`Opciones duplicadas: ${question.id}`)
    }
    if (
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex > 3
    ) {
      errors.push(`Índice inválido: ${question.id}`)
    }
    if (!question.explanation.trim())
      errors.push(`Explicación vacía: ${question.id}`)
  }

  for (const topic of topics) {
    if ((topicCounts.get(topic.id) ?? 0) !== 5)
      errors.push(`${topic.id}: se esperaban 5 preguntas`)
  }
  if (blocks.length !== 4) errors.push('El temario debe tener 4 bloques')
  if (topics.length !== 33) errors.push('El temario debe tener 33 temas')
  if (allQuestions.length !== 165)
    errors.push('El banco debe tener 165 preguntas')

  return {
    valid: errors.length === 0,
    blockCounts,
    topicCount: topics.length,
    questionCount: allQuestions.length,
    errors,
  }
}
