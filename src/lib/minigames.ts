import { activeQuestions } from '../data/questions'
import type {
  BlockId,
  MinigameType,
  Question,
  SessionQuestion,
  TrainerSession,
} from '../domain/types'
import { makeId, shuffle } from './session'

export interface MinigameOptions {
  type?: MinigameType
  minigameType?: MinigameType
  blockId?: BlockId
  blockIds?: BlockId[]
  topicIds?: string[]
  count?: number
  now?: Date
  random?: () => number
  /** Speedrun only. Defaults to true; false gives the same questions untimed. */
  timed?: boolean
}

/**
 * A statement a candidate can read in about three seconds. Speedrun is only
 * fair on these, so untimed speedrun is restricted to the short ones and the
 * timed one may draw from the whole bank.
 */
export const SHORT_STATEMENT_CHARS = 140

export function isShortQuestion(question: Question): boolean {
  return (
    question.statement.length <= SHORT_STATEMENT_CHARS &&
    question.options.every((option) => option.length <= 90)
  )
}

export interface MinigameStreak {
  current: number
  best: number
}

const questionCounts: Record<MinigameType, number> = {
  flashcards: 12,
  speedrun: 20,
  weakness: 10,
}

const titles: Record<MinigameType, string> = {
  flashcards: 'Minijuego · Flashcards',
  speedrun: 'Minijuego · Speedrun',
  weakness: 'Minijuego · Debilidades',
}

function isMinigameOptions(value: unknown): value is MinigameOptions {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getMinigameQuestionCount(type: MinigameType): number {
  return questionCounts[type]
}

export function getMinigameTitle(type: MinigameType): string {
  return titles[type]
}

export function createMinigameSession(
  allQuestions: Question[],
  options: MinigameOptions,
): TrainerSession
export function createMinigameSession(options: MinigameOptions): TrainerSession
export function createMinigameSession(
  type: MinigameType,
  options?: MinigameOptions,
): TrainerSession
export function createMinigameSession(
  type: MinigameType,
  allQuestions: Question[],
  options?: MinigameOptions,
): TrainerSession
export function createMinigameSession(
  allQuestions: Question[],
  type: MinigameType,
  options?: MinigameOptions,
): TrainerSession
export function createMinigameSession(
  first: Question[] | MinigameType | MinigameOptions,
  second?: Question[] | MinigameOptions | MinigameType,
  third?: MinigameOptions,
): TrainerSession {
  let bank = activeQuestions
  let options: MinigameOptions = {}

  if (Array.isArray(first)) {
    bank = first
    if (typeof second === 'string') {
      options = { ...third, type: second }
    } else if (isMinigameOptions(second)) {
      options = second
    } else {
      options = {}
    }
  } else if (typeof first === 'string') {
    if (Array.isArray(second)) {
      bank = second
      options = { ...third, type: first }
    } else if (isMinigameOptions(second)) {
      options = { ...second, type: first }
    } else {
      options = { type: first }
    }
  } else {
    options = first
  }

  const type = options.type ?? options.minigameType ?? 'flashcards'
  const now = options.now ?? new Date()
  const blockSet = new Set(options.blockIds ?? [])
  if (options.blockId) blockSet.add(options.blockId)
  const topicSet = new Set(options.topicIds ?? [])
  const seen = new Set<string>()
  const filtered = bank.filter((question) => {
    if (!question.active || seen.has(question.id)) return false
    if (blockSet.size > 0 && !blockSet.has(question.blockId)) return false
    if (topicSet.size > 0 && !topicSet.has(question.topicId)) return false
    if (type === 'speedrun' && !options.timed && !isShortQuestion(question)) {
      return false
    }
    seen.add(question.id)
    return true
  })
  const defaultCount = questionCounts[type]
  const requestedCount =
    options.count === undefined
      ? defaultCount
      : Math.min(defaultCount, Math.max(0, options.count))
  const selected = shuffle(filtered, options.random ?? Math.random).slice(
    0,
    requestedCount,
  )
  const questions: SessionQuestion[] = selected.map((question) => ({
    questionId: question.id,
    part: 1,
  }))
  const expiresAt =
    type === 'speedrun' && options.timed !== false
      ? new Date(now.getTime() + 60 * 1000).toISOString()
      : undefined

  return {
    id: makeId('minigame'),
    mode: 'minigame',
    title: titles[type],
    createdAt: now.toISOString(),
    startedAt: now.toISOString(),
    ...(expiresAt ? { expiresAt } : {}),
    minigameType: type,
    questions,
    answers: {},
    flagged: [],
    immediateFeedback: true,
    submitted: false,
  }
}

export function getMinigameStreak(
  questions: SessionQuestion[],
  answers: Record<string, number>,
  questionById: Map<string, Question>,
): MinigameStreak {
  let current = 0
  let best = 0
  let lastAnswered = -1
  questions.forEach((entry, index) => {
    if (answers[entry.questionId] !== undefined) lastAnswered = index
  })
  for (const [index, entry] of questions.entries()) {
    if (index > lastAnswered) break
    const answer = answers[entry.questionId]
    if (answer === undefined) {
      current = 0
      continue
    }
    const question = questionById.get(entry.questionId)
    if (question && answer === question.correctIndex) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return { current, best }
}

export function calculateBestStreak(
  questions: SessionQuestion[],
  answers: Record<string, number>,
  questionById: Map<string, Question>,
): number {
  return getMinigameStreak(questions, answers, questionById).best
}
