import type { Question } from '../../domain/types'
import { block1Questions } from './block1'
import { block2Questions } from './block2'
import { block3Questions } from './block3'
import { block4Questions } from './block4'

const rawQuestions: Question[] = [
  ...block1Questions,
  ...block2Questions,
  ...block3Questions,
  ...block4Questions,
]

function normalizeAnswerPosition(question: Question, index: number): Question {
  const offset = index % 4
  const options = [
    ...question.options.slice(offset),
    ...question.options.slice(0, offset),
  ] as Question['options']
  return {
    ...question,
    options,
    correctIndex: ((question.correctIndex - offset + 4) % 4) as 0 | 1 | 2 | 3,
  }
}

export const questions = rawQuestions.map(normalizeAnswerPosition)

export const activeQuestions = questions.filter((question) => question.active)

export const questionById = new Map(
  questions.map((question) => [question.id, question]),
)

export const questionsByBlock = {
  I: activeQuestions.filter((question) => question.blockId === 'I'),
  II: activeQuestions.filter((question) => question.blockId === 'II'),
  III: activeQuestions.filter((question) => question.blockId === 'III'),
  IV: activeQuestions.filter((question) => question.blockId === 'IV'),
}

export const questionsByTopic = new Map<string, Question[]>()
for (const question of activeQuestions) {
  const current = questionsByTopic.get(question.topicId) ?? []
  current.push(question)
  questionsByTopic.set(question.topicId, current)
}
