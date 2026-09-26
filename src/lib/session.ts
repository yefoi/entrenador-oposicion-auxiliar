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
  questionIds?: string[]
  selectionStrategy?: 'random' | 'adaptive'
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
  const questionSet = new Set(options.questionIds ?? [])
  const filtered = allQuestions.filter((question) => {
    if (!question.active) return false
    if (options.blockIds && !blockSet.has(question.blockId)) return false
    if (options.topicIds && !topicSet.has(question.topicId)) return false
    if (options.wrongQuestionIds && !wrongSet.has(question.id)) return false
    if (options.questionIds && !questionSet.has(question.id)) return false
    return true
  })
  const selected =
    options.selectionStrategy === 'adaptive' && options.questionIds
      ? options.questionIds
          .map((questionId) =>
            filtered.find((question) => question.id === questionId),
          )
          .filter((question): question is Question => Boolean(question))
          .slice(0, options.count)
      : takeRandom(filtered, options.count)
  return {
    id: makeId('practice'),
    mode: options.mode ?? 'practice',
    title: options.title ?? 'Sesión de práctica',
    selectionStrategy: options.selectionStrategy ?? 'random',
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
  // El supuesto tira de las preguntas escritas para el caso, que solo se
  // pueden responder consultando sus materiales. Si todavia no hay veinte,
  // cae en el sorteo por bloque de siempre para que el simulacro no se quede
  // corto mientras se escribe el contenido.
  const linkedPool = allQuestions.filter(
    (question) => question.active && question.scenarioId === scenarioBlock,
  )
  const pool = linkedPool.length >= 20 ? linkedPool : scenarioPool
  const scenarioSelected = takeRandom(pool, 20)
  // Las reservas salen del bloque entero y no solo del supuesto: cuando el
  // caso tiene justo veinte preguntas, el conjunto vinculado se agota al
  // seleccionarlas y no quedaria ninguna para sustituir.
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
    title: `Simulacro orientativo · ${scenarioBlock === 'III' ? 'Desarrollo' : 'Sistemas y comunicaciones'}`,
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
