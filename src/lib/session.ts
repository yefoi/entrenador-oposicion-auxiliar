import type {
  BlockId,
  ExamPart,
  Question,
  SessionQuestion,
  SessionMode,
  TrainerSession,
} from '../domain/types'

export interface PracticeOptions {
  blockIds?: BlockId[]
  topicIds?: string[]
  count: number
  mode?: Extract<SessionMode, 'practice' | 'review'>
  immediateFeedback?: boolean
  wrongQuestionIds?: string[]
  title?: string
  now?: Date
}

export function makeId(prefix: string): string {
  const random =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = copy[index]
    const swap = copy[swapIndex]
    if (current !== undefined && swap !== undefined) {
      copy[index] = swap
      copy[swapIndex] = current
    }
  }
  return copy
}

function takeRandom<T>(items: T[], count: number, random = Math.random): T[] {
  return shuffle(items, random).slice(0, count)
}

function toSessionQuestions(
  questions: Question[],
  part: ExamPart,
): SessionQuestion[] {
  return questions.map((question) => ({ questionId: question.id, part }))
}

export function createPracticeSession(
  allQuestions: Question[],
  options: PracticeOptions,
): TrainerSession {
  const now = options.now ?? new Date()
  const blockSet = new Set(options.blockIds ?? [])
  const topicSet = new Set(options.topicIds ?? [])
  const wrongSet = new Set(options.wrongQuestionIds ?? [])
  const filtered = allQuestions.filter((question) => {
    if (!question.active) return false
    if (blockSet.size > 0 && !blockSet.has(question.blockId)) return false
    if (topicSet.size > 0 && !topicSet.has(question.topicId)) return false
    if (wrongSet.size > 0 && !wrongSet.has(question.id)) return false
    return true
  })
  const selected = takeRandom(filtered, options.count)
  return {
    id: makeId('practice'),
    mode: options.mode ?? 'practice',
    title: options.title ?? 'Sesión de práctica',
    createdAt: now.toISOString(),
    startedAt: now.toISOString(),
    questions: toSessionQuestions(selected, 1),
    answers: {},
    flagged: [],
    immediateFeedback: options.immediateFeedback ?? true,
    submitted: false,
  }
}

export function createExamSession(
  allQuestions: Question[],
  scenarioBlock: 'III' | 'IV',
  now = new Date(),
): TrainerSession {
  const scenarioPool = allQuestions.filter(
    (question) => question.active && question.blockId === scenarioBlock,
  )
  const scenarioSelected = takeRandom(scenarioPool, 20)
  const scenarioReserves = takeRandom(
    scenarioPool.filter(
      (question) => !scenarioSelected.some((item) => item.id === question.id),
    ),
    5,
  )
  const excluded = new Set([
    ...scenarioSelected.map((question) => question.id),
    ...scenarioReserves.map((question) => question.id),
  ])
  const weights: Record<BlockId, number> = { I: 22, II: 13, III: 20, IV: 25 }
  const theory: Question[] = []
  for (const [block, count] of Object.entries(weights) as [BlockId, number][]) {
    const pool = allQuestions.filter(
      (question) =>
        question.active &&
        question.blockId === block &&
        !excluded.has(question.id),
    )
    theory.push(...takeRandom(pool, count))
  }
  const reserves = takeRandom(
    allQuestions.filter(
      (question) =>
        question.active && !theory.some((item) => item.id === question.id),
    ),
    5,
  )
  const expiresAt = new Date(now.getTime() + 120 * 60 * 1000).toISOString()

  return {
    id: makeId('exam'),
    mode: 'exam',
    title: `Simulacro oficial · ${scenarioBlock === 'III' ? 'Desarrollo' : 'Sistemas y comunicaciones'}`,
    createdAt: now.toISOString(),
    startedAt: now.toISOString(),
    expiresAt,
    scenarioBlock,
    questions: [
      ...toSessionQuestions(takeRandom(theory, 80), 1),
      ...toSessionQuestions(scenarioSelected, 2),
    ],
    reserveQuestionIds: reserves.map((question) => question.id),
    scenarioReserveQuestionIds: scenarioReserves.map((question) => question.id),
    answers: {},
    flagged: [],
    immediateFeedback: false,
    submitted: false,
  }
}

export function getSessionProgress(session: TrainerSession): {
  answered: number
  total: number
  percent: number
} {
  const total = session.questions.length
  const answered = session.questions.filter(
    (entry) => session.answers[entry.questionId] !== undefined,
  ).length
  return {
    answered,
    total,
    percent: total === 0 ? 0 : Math.round((answered / total) * 100),
  }
}

export function getRemainingSeconds(
  session: TrainerSession,
  now = Date.now(),
): number {
  if (!session.expiresAt) return Number.POSITIVE_INFINITY
  return Math.max(
    0,
    Math.ceil((new Date(session.expiresAt).getTime() - now) / 1000),
  )
}

export function formatTimer(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'Sin límite'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return [hours, minutes, rest]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}
