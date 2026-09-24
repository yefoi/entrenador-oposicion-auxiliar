import type {
  Attempt,
  ExamPart,
  PartScore,
  Question,
  SessionQuestion,
} from '../domain/types'

export interface ScoreSummary {
  part: ExamPart
  total: number
  correct: number
  wrong: number
  blank: number
  direct: number
  estimated: number
  threshold: number
  passed: boolean
}

const round = (value: number) => Math.round(value * 10) / 10

export function scoreQuestions(
  sessionQuestions: SessionQuestion[],
  answers: Record<string, number>,
  questionById: Map<string, Question>,
  part: ExamPart,
): ScoreSummary {
  const relevant = sessionQuestions.filter((entry) => entry.part === part)
  let correct = 0
  let wrong = 0
  let blank = 0

  for (const entry of relevant) {
    const answer = answers[entry.questionId]
    if (answer === undefined) {
      blank += 1
      continue
    }
    const question = questionById.get(entry.questionId)
    if (!question) {
      blank += 1
    } else if (answer === question.correctIndex) {
      correct += 1
    } else {
      wrong += 1
    }
  }

  const direct = correct - wrong / 3
  const maximum = part === 1 ? 80 : 20
  const estimated = round(Math.max(0, Math.min(50, (direct / maximum) * 50)))
  const threshold = 25

  return {
    part,
    total: relevant.length,
    correct,
    wrong,
    blank,
    direct: round(direct),
    estimated,
    threshold,
    passed: estimated >= threshold,
  }
}

export function scoreSession(
  session: Pick<Attempt, 'questions' | 'answers' | 'mode'>,
  questionById: Map<string, Question>,
): ScoreSummary[] {
  const first = scoreQuestions(
    session.questions,
    session.answers,
    questionById,
    1,
  )
  if (session.mode !== 'exam') {
    const practiceEstimated =
      first.total === 0
        ? 0
        : round(Math.max(0, Math.min(100, (first.direct / first.total) * 100)))
    return [
      {
        ...first,
        estimated: practiceEstimated,
        threshold: 70,
        passed: practiceEstimated >= 70,
      },
    ]
  }
  return [
    first,
    scoreQuestions(session.questions, session.answers, questionById, 2),
  ]
}

export function overallScore(scores: PartScore[]): {
  direct: number
  estimated: number
  passed: boolean
} {
  const direct = round(scores.reduce((sum, score) => sum + score.direct, 0))
  const estimated = round(
    scores.reduce((sum, score) => sum + score.estimated, 0),
  )
  return {
    direct,
    estimated,
    passed: scores.every((score) => score.passed),
  }
}

export function formatDirect(value: number): string {
  return value.toFixed(1).replace('.', ',')
}
